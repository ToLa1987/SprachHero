
import { getGlobal } from "./storage.js";

let voices = [];

// =========================================================
// AUDIO-DIAGNOSE
// =========================================================

function showAudioDiagnostics(langCode, selectedVoice, rate, pitch) {
    if (!document.body) return;

    let panel = document.getElementById("sprachhero-audio-debug");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "sprachhero-audio-debug";

        Object.assign(panel.style, {
            position: "fixed",
            bottom: "12px",
            left: "12px",
            right: "12px",
            maxHeight: "45vh",
            overflowY: "auto",
            zIndex: "2147483647",
            background: "#ffffff",
            color: "#111111",
            border: "3px solid #005086",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "14px",
            fontFamily: "Arial, sans-serif",
            boxShadow: "0 2px 12px #0004",
            overflowWrap: "anywhere",
            boxSizing: "border-box"
        });

        document.body.appendChild(panel);
    }

    const availableVoices =
        window.speechSynthesis
            .getVoices()
            .filter(v =>
                v.lang.toLowerCase().startsWith(
                    langCode.split("-")[0].toLowerCase()
                )
            )
            .map(v => `${v.name} (${v.lang})`);

    panel.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "SprachHero – Audio-Diagnose";
    panel.appendChild(title);

    const details = document.createElement("pre");
    details.style.whiteSpace = "pre-wrap";
    details.style.fontSize = "13px";
    details.style.margin = "8px 0";

    details.textContent =
        `Sprache: ${langCode}\n` +
        `Ausgewählte Stimme: ${selectedVoice?.name || "Systemstandard"}\n` +
        `Sprachcode der Stimme: ${selectedVoice?.lang || "unbekannt"}\n` +
        `Rate: ${rate}\n` +
        `Pitch: ${pitch}\n\n` +
        `Verfügbare Stimmen:\n` +
        (availableVoices.join("\n") || "Keine Stimmen gefunden");

    panel.appendChild(details);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Anzeige schließen";
    closeButton.style.padding = "8px 12px";
    closeButton.style.fontSize = "14px";
    closeButton.onclick = () => panel.remove();

    panel.appendChild(closeButton);
}

// =========================================================
// DIAGNOSE MANUELL TESTEN
// =========================================================

export function testAudioDiagnostics() {
    const langCode = "en-GB";
    const voice = getBestVoice(langCode);

    showAudioDiagnostics(langCode, voice, 1.0, 1.0);
}

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
// STIMMEN INITIALISIEREN
// =========================================================

export function initVoices() {
    const loadVoices = () => {
        voices = window.speechSynthesis.getVoices();

        console.table(
            voices.map(v => ({
                name: v.name,
                lang: v.lang,
                default: v.default
            }))
        );
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
        "voiceschanged",
        loadVoices
    );
}

// =========================================================
// BESTE STIMME FINDEN
// =========================================================

function getBestVoice(langCode) {
    if (!voices.length) {
        voices = window.speechSynthesis.getVoices();
    }

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
            "Microsoft Raquel",
            "Google Portuguese Female"
        ],
        "es-ES": [
            "Microsoft Helena Online",
            "Microsoft Helena"
        ],
        "ru-RU": [
            "Microsoft Svetlana Online",
            "Microsoft Svetlana",
            "Google русский"
        ],
        "it-IT": [
            "Microsoft Elsa Online",
            "Microsoft Elsa"
        ]
    };

    const preferred = preferredVoices[langCode];

    if (preferred) {
        for (const name of preferred) {
            const found = voices.find(v =>
                v.name.toLowerCase().includes(name.toLowerCase()) &&
                v.lang.toLowerCase().startsWith(
                    langCode.split("-")[0].toLowerCase()
                )
            );

            if (found) return found;
        }
    }

    let match = voices.find(v =>
        v.lang.toLowerCase() === langCode.toLowerCase()
    );

    if (match) return match;

    match = voices.find(v =>
        v.lang.toLowerCase().startsWith(
            langCode.split("-")[0].toLowerCase()
        )
    );

    return match || null;
}

// =========================================================
// ASYNC SPEAK
// =========================================================

export function speakAsync(text, lang, options = {}) {
    return new Promise(resolve => {
        if (
            !("speechSynthesis" in window) ||
            !text
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

        utter.rate = options.rate ?? 1.0;
        utter.pitch = options.pitch ?? 1.0;
        utter.volume = options.volume ?? 1.0;

        if (utter.lang === "de-DE" && g.language === "la") {
            utter.rate *= 0.92;
            utter.pitch *= 0.95;
        }

        const voice = getBestVoice(utter.lang);

        // Diagnoseanzeige bei jedem Sprechaufruf
        showAudioDiagnostics(
            utter.lang,
            voice,
            utter.rate,
            utter.pitch
        );

        console.log("SprachHero – Audio-Diagnose", {
            language: utter.lang,
            selectedVoice: voice?.name ?? "Systemstandard",
            voiceLanguage: voice?.lang ?? "unbekannt",
            rate: utter.rate,
            pitch: utter.pitch
        });

        if (voice) {
            utter.voice = voice;
        }

        if (options.onBoundary) {
            utter.onboundary = options.onBoundary;
        }

        utter.onend = () => resolve();
        utter.onerror = () => resolve();

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
// SFX
// =========================================================

export function playSfx(name) {
    try {
        const audio = new Audio(
            new URL(`./assets/sfx/${name}.wav`, document.baseURI).href
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
