
import { getGlobal } from "./storage.js";

let voices = [];
let voicesInitialized = false;

// =========================================================
// LATEIN – VOKALLÄNGEN OPTIMIEREN
// =========================================================

function latinLengthFix(text) {
    const ZWJ = "\u200D";

    return text
        .replace(/ā/g, "a" + ZWJ + "aaa")
        .replace(/ē/g, "e" + ZWJ + "eee")
        .replace(/ī/g, "i" + ZWJ + "iii")
        .replace(/ō/g, "o" + ZWJ + "ooo")
        .replace(/ū/g, "u" + ZWJ + "uuu");
}

// =========================================================
// SPRACHCODES
// =========================================================

export function getLangCodeForLanguage(lang) {
    switch (lang) {
        case "en": return "en-GB";
        case "pt": return "pt-PT";
        case "fr": return "fr-FR";
        case "la": return "de-DE";
        case "es": return "es-ES";
        case "it": return "it-IT";
        case "ru": return "ru-RU";
        case "de": return "de-DE";
        default: return "en-GB";
    }
}

export function getLangCodeForGlobalLanguage() {
    const g = getGlobal();
    return getLangCodeForLanguage(g.language || "en");
}

// =========================================================
// STIMMEN LADEN
// =========================================================

function loadVoices() {
    if (!("speechSynthesis" in window)) {
        voices = [];
        return voices;
    }

    voices = window.speechSynthesis.getVoices();
    return voices;
}

export function initVoices() {
    if (!("speechSynthesis" in window)) return;

    loadVoices();

    if (!voicesInitialized) {
        window.speechSynthesis.addEventListener(
            "voiceschanged",
            loadVoices
        );

        voicesInitialized = true;
    }
}

// =========================================================
// BEVORZUGTE STIMMEN
// =========================================================

const preferredVoices = {
    "de-DE": [
        "Microsoft Katja Online",
        "Microsoft Katja"
    ],
    "en-GB": [
        "Katrin",
        "Microsoft Libby Online",
        "Microsoft Libby",
        "Google UK English Female"
    ],
    "fr-FR": [
        "Microsoft Denise Online",
        "Microsoft Denise"
    ],
    "pt-PT": [
        "Microsoft Raquel Online",
        "Microsoft Raquel"
    ],
    "es-ES": [
        "Microsoft Helena Online",
        "Microsoft Helena"
    ],
    "ru-RU": [
        "Microsoft Svetlana Online",
        "Microsoft Svetlana"
    ],
    "it-IT": [
        "Microsoft Elsa Online",
        "Microsoft Elsa"
    ]
};

// =========================================================
// PASSENDE STIMME FINDEN
// =========================================================

function getBestVoice(langCode) {
    if (!voices.length) {
        loadVoices();
    }

    const normalizedCode = langCode.toLowerCase();
    const baseLanguage = normalizedCode.split("-")[0];

    const exactMatches = voices.filter(
        voice => voice.lang.toLowerCase() === normalizedCode
    );

    const languageMatches = voices.filter(
        voice => voice.lang.toLowerCase().startsWith(baseLanguage + "-")
    );

    // 1. Bevorzugte Stimme suchen, aber nur in der richtigen Sprache.
    const preferred = preferredVoices[langCode] || [];

    for (const preferredName of preferred) {
        const match = exactMatches.find(
            voice => voice.name.toLowerCase().includes(
                preferredName.toLowerCase()
            )
        );

        if (match) return match;
    }

    // 2. Für Englisch zuerst exakt britisches Englisch bevorzugen.
    if (exactMatches.length > 0) {
        const defaultVoice = exactMatches.find(voice => voice.default);
        return defaultVoice || exactMatches[0];
    }

    // 3. Falls kein en-GB verfügbar ist, andere englische Stimme nutzen.
    if (baseLanguage === "en" && languageMatches.length > 0) {
        const defaultVoice = languageMatches.find(voice => voice.default);
        return defaultVoice || languageMatches[0];
    }

    // 4. Für andere Sprachen auf eine Stimme derselben Sprache ausweichen.
    if (languageMatches.length > 0) {
        const defaultVoice = languageMatches.find(voice => voice.default);
        return defaultVoice || languageMatches[0];
    }

    // 5. Keine passende Stimme vorhanden: null zurückgeben.
    // Der Browser verwendet dann seine Systemstandardstimme.
    return null;
}

// =========================================================
// ASYNC SPEAK
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

        const utter = new SpeechSynthesisUtterance(text);

        utter.lang = lang || getLangCodeForGlobalLanguage();

        const g = getGlobal();

        if (g.language === "la" && utter.lang === "de-DE") {
            text = latinLengthFix(text);
            utter.text = text;
        }

        // Nullish Coalescing erhält auch absichtlich gesetzte 0-Werte.
        utter.rate = options.rate ?? 1.0;
        utter.pitch = options.pitch ?? 1.0;
        utter.volume = options.volume ?? 1.0;

        if (utter.lang === "de-DE" && g.language === "la") {
            utter.rate *= 0.92;
            utter.pitch *= 0.95;
        }

        const voice = getBestVoice(utter.lang);

        if (voice) {
            utter.voice = voice;
        }

        if (options.onBoundary) {
            utter.onboundary = options.onBoundary;
        }

        let finished = false;

        const finish = () => {
            if (finished) return;
            finished = true;
            resolve();
        };

        utter.onend = finish;
        utter.onerror = finish;

        window.speechSynthesis.speak(utter);
    });
}

// =========================================================
// EINFACHES SPEAK()
// =========================================================

export function speak(text, lang, options = {}) {
    return speakAsync(text, lang, options);
}

// =========================================================
// AUDIO STOPPEN
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
                console.warn("SFX konnte nicht abgespielt werden:", name, error);
            });
        }
    } catch (error) {
        console.warn("SFX konnte nicht abgespielt werden:", name, error);
    }
}
