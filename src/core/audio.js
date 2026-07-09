// =========================================================
// /src/core/audio.js – SprachHero V10
// Zentrale Audio-Engine
// Offlinefähig + intelligente Voice-Auswahl
// =========================================================

import { getGlobal } from "./storage.js";

let voices = [];

// =========================================================
// Sprachcodes
// =========================================================

export function getLangCodeForLanguage(lang) {

    switch (lang) {

        case "en":
            return "en-GB";

        case "fr":
            return "fr-FR";

        // Latein -> Italienisch funktioniert nicht gut, daher deutsch
        case "la":
            return "de-DE";

        case "es":
            return "es-ES";

        case "it":
            return "it-IT";

        case "de":
            return "de-DE";

        default:
            return "en-GB";
    }
}

export function getLangCodeForGlobalLanguage() {

    const g = getGlobal();

    return getLangCodeForLanguage(
        g.language || "en"
    );
}

// =========================================================
// Voices initialisieren
// =========================================================

export function initVoices() {

    const loadVoices = () => {

        voices =
            window.speechSynthesis.getVoices();

        console.table(
            voices.map(v => ({
                name: v.name,
                lang: v.lang
            }))
        );
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
        loadVoices;
}

// =========================================================
// Beste Stimme finden
// =========================================================

function getBestVoice(langCode) {

    if (!voices.length) {

        voices =
            speechSynthesis.getVoices();
    }

    // =====================================
    // Bevorzugte Stimmen
    // =====================================

    const preferredVoices = {

        "de-DE": [
            "Microsoft Katja Online",
            "Microsoft Katja"
        ],

        "en-GB": [
            "Microsoft Libby Online",
            "Microsoft Libby",
            "Google UK English Female"
        ],

        "fr-FR": [
            "Microsoft Denise Online",
            "Microsoft Denise"
        ],

        "es-ES": [
            "Microsoft Helena Online",
            "Microsoft Helena"
        ],

        "it-IT": [
            "Microsoft Elsa Online",
            "Microsoft Elsa"
        ]
    };

    // =====================================
    // Wunschstimmen prüfen
    // =====================================

    const preferred =
        preferredVoices[langCode];

    if (preferred) {

        for (const name of preferred) {

            const found = voices.find(v =>
                v.name.includes(name)
            );

            if (found) {
                return found;
            }
        }
    }

    // =====================================
    // Exakte Sprache
    // =====================================

    let match = voices.find(v =>

        v.lang.toLowerCase() ===
        langCode.toLowerCase()
    );

    if (match) {
        return match;
    }

    // =====================================
    // Sprachpräfix
    // =====================================

    match = voices.find(v =>

        v.lang
            .toLowerCase()
            .startsWith(
                langCode
                    .split("-")[0]
                    .toLowerCase()
            )
    );

    if (match) {
        return match;
    }

    // =====================================
    // Browser-Standard
    // =====================================

    return null;
}

// =========================================================
// Async Speak
// =========================================================

export function speakAsync(
    text,
    lang,
    options = {}
) {

    return new Promise(resolve => {

        if (
            !window.speechSynthesis ||
            !text
        ) {
            resolve();
            return;
        }

        const utter =
            new SpeechSynthesisUtterance(
                text
            );

        // =====================================
        // Sprache
        // =====================================

        utter.lang =
            lang ||
            getLangCodeForGlobalLanguage();

        // =====================================
        // Standardwerte
        // =====================================

        utter.rate =
            options.rate || 1.0;

        utter.pitch =
            options.pitch || 1.0;

        utter.volume =
            options.volume || 1.0;

        // =====================================
        // Latein optimieren
        // =====================================

        if (utter.lang === "de-DE") {

            utter.rate *= 0.92;
            utter.pitch *= 0.95;
        }

        // =====================================
        // Beste Stimme wählen
        // =====================================

        const voice =
            getBestVoice(utter.lang);

        if (voice) {

            utter.voice = voice;
        }

        // =====================================
        // Karaoke / Word Highlighting
        // =====================================

        if (options.onBoundary) {

            utter.onboundary =
                options.onBoundary;
        }

        // =====================================
        // Ende
        // =====================================

        utter.onend = () => {

            resolve();
        };

        utter.onerror = () => {

            resolve();
        };

        // =====================================
        // Abspielen
        // =====================================

        speechSynthesis.speak(utter);
    });
}

// =========================================================
// Einfaches speak()
// =========================================================

export function speak(
    text,
    lang,
    options = {}
) {

    return speakAsync(
        text,
        lang,
        options
    );
}

// =========================================================
// Audio stoppen
// =========================================================

export function stopSpeaking() {

    speechSynthesis.cancel();
}

// =========================================================
// SFX
// =========================================================

export function playSfx(name) {

    try {

        const audio = new Audio(
            `../assets/sfx/${name}.wav`
        );

        audio.volume = 0.7;

        audio.play();

    } catch (e) {

        console.warn(
            "SFX konnte nicht abgespielt werden:",
            name,
            e
        );
    }
}

