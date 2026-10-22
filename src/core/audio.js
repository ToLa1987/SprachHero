
import { getGlobal } from "./storage.js";

let voices = [];
let voicesInitialized = false;

// =========================================================
// LATEIN – VORLESETEXT VORBEREITEN
// =========================================================

// Nur den Vorlesetext verändern, niemals die gespeicherte Vokabel.
// Keine künstlichen Vokale oder unsichtbaren Zeichen hinzufügen.

function latinLengthFix(text) {
    return String(text || "")
        .normalize("NFC")
        .replace(/[āĀ]/g, "a")
        .replace(/[ēĒ]/g, "e")
        .replace(/[īĪ]/g, "i")
        .replace(/[ōŌ]/g, "o")
        .replace(/[ūŪ]/g, "u")
        .replace(/[ȳȲ]/g, "y");
}

// =========================================================
// SPRACHCODES
// =========================================================

export function getLangCodeForLanguage(lang) {
    const languageCodes = {
        en: "en-GB",
        pt: "pt-PT",
        fr: "fr-FR",
        la: "de-DE",
        es: "es-ES",
        it: "it-IT",
        ru: "ru-RU",
        de: "de-DE",
        tr: "tr-TR",
        pl: "pl-PL"
    };

    return languageCodes[lang] || "en-GB";
}

export function getLangCodeForGlobalLanguage() {
    const settings = getGlobal();

    return getLangCodeForLanguage(settings?.language || "en");
}

// =========================================================
// PLATTFORM ERKENNEN
// =========================================================

function getPlatform() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";

    if (
        /iPhone|iPad|iPod/i.test(ua) ||
        (platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ) {
        return "ios";
    }

    if (/Android/i.test(ua)) return "android";
    if (/Windows/i.test(ua)) return "windows";

    return "other";
}

// =========================================================
// STIMMEN LADEN
// =========================================================

function loadVoices() {
    if (!("speechSynthesis" in window)) {
        voices = [];
        return voices;
    }

    voices = window.speechSynthesis.getVoices() || [];
    return voices;
}

export function initVoices() {
    if (!("speechSynthesis" in window)) return;

    loadVoices();

    if (voicesInitialized) return;

    voicesInitialized = true;

    if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener(
            "voiceschanged",
            loadVoices
        );
    } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

// =========================================================
// STIMMENPRIORITÄTEN
// =========================================================

const PLATFORM_PREFERENCES = {
    windows: {
        "en-GB": [
            "Microsoft George",
            "George",
            "Microsoft Hazel",
            "Hazel",
            "Microsoft Susan",
            "Susan"
        ],
        "de-DE": [
            "Microsoft Katja",
            "Microsoft Hedda",
            "Microsoft Stefan"
        ],
        "fr-FR": [
            "Microsoft Hortense",
            "Microsoft Julie",
            "Microsoft Paul",
            "Microsoft Denise"
        ],
        "es-ES": [
            "Microsoft Helena",
            "Microsoft Laura",
            "Microsoft Pablo"
        ],
        "it-IT": [
            "Microsoft Elsa",
            "Microsoft Cosimo"
        ],
        "pt-PT": [
            "Microsoft Raquel"
        ],
        "ru-RU": [
            "Microsoft Svetlana"
        ]
    },

    ios: {
        // iOS-Stimmen werden anhand der tatsächlich verfügbaren
        // Sprachkennungen ausgewählt. Siri kann nicht erzwungen werden.
        "en-GB": [],
        "de-DE": [],
        "fr-FR": [],
        "es-ES": [],
        "it-IT": [],
        "pt-PT": [],
        "ru-RU": []
    },

    android: {
        "en-GB": [
            "Google UK English",
            "Google English (United Kingdom)",
            "English (United Kingdom)"
        ],
        "de-DE": [
            "Google Deutsch",
            "German (Germany)"
        ],
        "fr-FR": [
            "Google français",
            "French (France)"
        ],
        "es-ES": [
            "Google español",
            "Spanish (Spain)"
        ],
        "it-IT": [
            "Google italiano",
            "Italian (Italy)"
        ],
        "pt-PT": [
            "Google português",
            "Portuguese (Portugal)"
        ],
        "ru-RU": [
            "Google русский",
            "Russian"
        ]
    },

    other: {
        "en-GB": [
            "Microsoft George",
            "Microsoft Hazel",
            "Google UK English"
        ]
    }
};

const GENERAL_PREFERENCES = {
    "en-GB": [
        "Microsoft George",
        "Microsoft Hazel",
        "Microsoft Susan",
        "Google UK English"
    ],
    "de-DE": [
        "Microsoft Katja",
        "Microsoft Hedda",
        "Microsoft Stefan"
    ],
    "fr-FR": [
        "Microsoft Hortense",
        "Microsoft Julie",
        "Microsoft Denise"
    ],
    "es-ES": [
        "Microsoft Helena",
        "Microsoft Laura",
        "Microsoft Pablo"
    ],
    "it-IT": [
        "Microsoft Elsa",
        "Microsoft Cosimo"
    ],
    "pt-PT": [
        "Microsoft Raquel",
        "Google Portuguese"
    ],
    "ru-RU": [
        "Microsoft Svetlana",
        "Google русский"
    ],
    "tr-TR": [],
    "pl-PL": []
};

// =========================================================
// HILFSFUNKTIONEN
// =========================================================

function normalizeLanguage(lang) {
    return String(lang || "")
        .replace("_", "-")
        .toLowerCase();
}

function sameLanguage(voice, langCode) {
    return normalizeLanguage(voice.lang) ===
        normalizeLanguage(langCode);
}

function sameBaseLanguage(voice, langCode) {
    const voiceBase = normalizeLanguage(voice.lang).split("-")[0];
    const targetBase = normalizeLanguage(langCode).split("-")[0];

    return voiceBase === targetBase;
}

function findPreferredVoice(available, names, langCode) {
    for (const preferredName of names) {
        const needle = preferredName.toLowerCase();

        const match = available.find(voice =>
            voice.name.toLowerCase().includes(needle) &&
            sameLanguage(voice, langCode)
        );

        if (match) return match;
    }

    return null;
}

// =========================================================
// BESTE STIMME AUSWÄHLEN
// =========================================================

export function getBestVoice(langCode) {
    if (!("speechSynthesis" in window)) return null;

    const targetLang = langCode || getLangCodeForGlobalLanguage();

    loadVoices();

    if (!voices.length) return null;

    const platform = getPlatform();

    // Zuerst Stimmen mit exakt passender Sprache verwenden.
    const exactMatches = voices.filter(voice =>
        sameLanguage(voice, targetLang)
    );

    // 1. Plattformbezogene Wunschstimme
    const platformNames =
        PLATFORM_PREFERENCES[platform]?.[targetLang] || [];

    const platformVoice = findPreferredVoice(
        exactMatches,
        platformNames,
        targetLang
    );

    if (platformVoice) return platformVoice;

    // 2. Allgemeine Wunschstimme
    const generalVoice = findPreferredVoice(
        exactMatches,
        GENERAL_PREFERENCES[targetLang] || [],
        targetLang
    );

    if (generalVoice) return generalVoice;

    // 3. Standardstimme für die exakt passende Sprache
    const defaultExact = exactMatches.find(voice => voice.default);

    if (defaultExact) return defaultExact;

    // 4. Andere Stimme derselben exakten Sprache
    if (exactMatches.length > 0) return exactMatches[0];

    // 5. Regionale Alternative derselben Sprache
    const languageMatches = voices.filter(voice =>
        sameBaseLanguage(voice, targetLang)
    );

    if (languageMatches.length > 0) {
        return languageMatches.find(voice => voice.default) ||
            languageMatches[0];
    }

    // 6. Keine passende Stimme gefunden.
    // null lässt den Browser seine Standardstimme verwenden.
    return null;
}

// =========================================================
// SPRECHEN
// =========================================================

export function speakAsync(text, lang, options = {}) {
    return new Promise(resolve => {
        if (
            !("speechSynthesis" in window) ||
            typeof text !== "string" ||
            !text.trim()
        ) {
            resolve();
            return;
        }

        initVoices();

        const settings = getGlobal();
        const utter = new SpeechSynthesisUtterance(text);

        utter.lang = lang || getLangCodeForGlobalLanguage();

        const isLatin =
            settings?.language === "la" &&
            utter.lang.toLowerCase() === "de-de";

        if (isLatin) {
            utter.text = latinLengthFix(text);
        }

        utter.rate = options.rate ?? 1.0;
        utter.pitch = options.pitch ?? 1.0;
        utter.volume = options.volume ?? 1.0;

        if (isLatin) {
            // Langsamer sprechen, aber Tonhöhe nicht künstlich absenken.
            utter.rate = Math.min(utter.rate, 0.95);
            utter.pitch = 1.0;
        }

        const voice = getBestVoice(utter.lang);

        if (voice) {
            utter.voice = voice;
        }

        if (typeof options.onBoundary === "function") {
            utter.onboundary = options.onBoundary;
        }

        let finished = false;

        const finish = () => {
            if (finished) return;

            finished = true;
            utter.onend = null;
            utter.onerror = null;

            resolve();
        };

        utter.onend = finish;
        utter.onerror = finish;

        console.info("[SprachHero Audio]", {
            platform: getPlatform(),
            language: utter.lang,
            voice: voice?.name || "Browser-Standardstimme",
            voiceLanguage: voice?.lang || "unbekannt",
            rate: utter.rate,
            latin: isLatin
        });

        try {
            window.speechSynthesis.speak(utter);
        } catch (error) {
            console.warn(
                "[SprachHero Audio] Wiedergabe fehlgeschlagen:",
                error
            );

            finish();
        }
    });
}

// =========================================================
// KOMPATIBILITÄT MIT BISHERIGEN AUFRUFEN
// =========================================================

export function speak(text, lang, options = {}) {
    return speakAsync(text, lang, options);
}

// =========================================================
// WIEDERGABE STOPPEN
// =========================================================

export function stopSpeaking() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

// =========================================================
// SOUND-EFFEKTE
// =========================================================

export function playSfx(name) {
    try {
        const audio = new Audio(
            new URL(`./assets/sfx/${name}.wav`, document.baseURI).href
        );

        audio.volume = 0.7;

        const playback = audio.play();

        if (playback && typeof playback.catch === "function") {
            playback.catch(error => {
                console.warn(
                    "SFX konnte nicht abgespielt werden:",
                    name,
                    error
                );
            });
        }
    } catch (error) {
        console.warn(
            "SFX konnte nicht abgespielt werden:",
            name,
            error
        );
    }
}
