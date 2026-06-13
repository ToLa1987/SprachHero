// =========================================================
// /src/story/storyData.js – SprachHero V10.0
// Story-Daten: 3 Welten, je 10 kurze Kapitel mit Bild + Quests
// =========================================================

export const STORIES = [
  {
    id: "magic",
    title: "Das magische Wörterbuch",
    style: "fantasy",
    description: "Ein geheimnisvolles Buch, das Wörter lebendig macht.",
    chapters: [
      {
        id: "magic-1",
        title: "Kapitel 1: Das Buch im Regal",
        text: "Du findest in der Schulbibliothek ein altes, staubiges Wörterbuch. Als du es öffnest, leuchtet eine Seite.",
        image: "/src/story/magic/magic1.png",
        unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
        quests: [
          { id: "magic-1-q1", type: "xp", amount: 10, label: "Sammle 10 XP." }
        ]
      },
      {
        id: "magic-2",
        title: "Kapitel 2: Flüsternde Seiten",
        text: "Die Wörter im Buch beginnen zu flüstern. Jedes gelernte Wort wird lauter und klarer.",
        image: "/src/story/magic/magic2.png",
        unlock: { minXp: 20, minSessions: 1, minWords: 5, minSuccess: 0 },
        quests: [
          { id: "magic-2-q1", type: "words", amount: 10, label: "Lerne 10 Wörter." }
        ]
      },
      {
        id: "magic-3",
        title: "Kapitel 3: Das leuchtende Zeichen",
        text: "Ein Symbol im Buch beginnt zu leuchten, als du deine nächste Training-Session startest.",
        image: "/src/story/magic/magic3.png",
        unlock: { minXp: 40, minSessions: 2, minWords: 15, minSuccess: 0 },
        quests: [
          { id: "magic-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
        ]
      },
      {
        id: "magic-4",
        title: "Kapitel 4: Die sprechende Seite",
        text: "Eine Seite spricht direkt zu dir und fordert dich auf, weiterzulernen.",
        image: "/src/story/magic/magic4.png",
        unlock: { minXp: 60, minSessions: 3, minWords: 20, minSuccess: 50 },
        quests: [
          { id: "magic-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
        ]
      },
      {
        id: "magic-5",
        title: "Kapitel 5: Der geheime Gang",
        text: "Hinter einem Bücherregal öffnet sich ein geheimer Gang, der nur reagiert, wenn du genug gelernt hast.",
        image: "/src/story/magic/magic5.png",
        unlock: { minXp: 80, minSessions: 4, minWords: 25, minSuccess: 55 },
        quests: [
          { id: "magic-5-q1", type: "xp", amount: 80, label: "Erreiche insgesamt 80 XP." }
        ]
      },
      {
        id: "magic-6",
        title: "Kapitel 6: Die fliegenden Wörter",
        text: "Wörter schweben durch die Luft und ordnen sich zu Sätzen, wenn du sie beherrschst.",
        image: "/src/story/magic/magic6.png",
        unlock: { minXp: 100, minSessions: 5, minWords: 30, minSuccess: 60 },
        quests: [
          { id: "magic-6-q1", type: "words", amount: 30, label: "Lerne 30 Wörter." }
        ]
      },
      {
        id: "magic-7",
        title: "Kapitel 7: Die Prüfung der Runen",
        text: "Magische Runen testen dein Wissen. Jede richtige Antwort lässt sie heller leuchten.",
        image: "/src/story/magic/magic7.png",
        unlock: { minXp: 130, minSessions: 6, minWords: 35, minSuccess: 65 },
        quests: [
          { id: "magic-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
        ]
      },
      {
        id: "magic-8",
        title: "Kapitel 8: Der Wächter des Buches",
        text: "Ein Wächter erscheint und prüft, ob du fleißig trainiert hast.",
        image: "/src/story/magic/magic8.png",
        unlock: { minXp: 160, minSessions: 7, minWords: 40, minSuccess: 65 },
        quests: [
          { id: "magic-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
        ]
      },
      {
        id: "magic-9",
        title: "Kapitel 9: Die letzte Seite",
        text: "Nur wer wirklich dranbleibt, kann die letzte Seite des Buches lesen.",
        image: "/src/story/magic/magic9.png",
        unlock: { minXp: 200, minSessions: 8, minWords: 45, minSuccess: 70 },
        quests: [
          { id: "magic-9-q1", type: "xp", amount: 200, label: "Erreiche 200 XP." }
        ]
      },
      {
        id: "magic-10",
        title: "Kapitel 10: Meister der Wörter",
        text: "Das Buch erkennt dich als Meister der Wörter an. Neue Abenteuer warten.",
        image: "/src/story/magic/magic10.png",
        unlock: { minXp: 250, minSessions: 10, minWords: 50, minSuccess: 75 },
        quests: [
          { id: "magic-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
        ]
      }
    ]
  },
  {
    id: "comic",
    title: "Boom! Pow! Wörter‑Attacke!",
    style: "comic",
    description: "Actiongeladene Kapitel, in denen du Wortmonster besiegst.",
    chapters: [
      {
        id: "comic-1",
        title: "Kapitel 1: Wortmonster erscheint",
        text: "Ein riesiges Wortmonster taucht auf und wirft dir unbekannte Wörter entgegen.",
        image: "/src/story/src/story/src/story/comic/comic1.png",
        unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
        quests: [
          { id: "comic-1-q1", type: "xp", amount: 5, label: "Sammle 5 XP." }
        ]
      },
      {
        id: "comic-2",
        title: "Kapitel 2: Erster Treffer",
        text: "Du triffst das Monster mit einem richtig übersetzten Wort.",
        image: "/src/story/src/story/src/story/comic/comic2.png",
        unlock: { minXp: 15, minSessions: 1, minWords: 5, minSuccess: 0 },
        quests: [
          { id: "comic-2-q1", type: "words", amount: 8, label: "Lerne 8 Wörter." }
        ]
      },
      {
        id: "comic-3",
        title: "Kapitel 3: Combo‑Attacke",
        text: "Mehrere richtige Antworten hintereinander lösen eine Combo aus.",
        image: "/src/story/src/story/src/story/comic/comic3.png",
        unlock: { minXp: 30, minSessions: 2, minWords: 12, minSuccess: 0 },
        quests: [
          { id: "comic-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
        ]
      },
      {
        id: "comic-4",
        title: "Kapitel 4: Schild aus Vokabeln",
        text: "Dein Schild wird stärker, je mehr Wörter du beherrschst.",
        image: "/src/story/src/story/src/story/comic/comic4.png",
        unlock: { minXp: 45, minSessions: 3, minWords: 15, minSuccess: 50 },
        quests: [
          { id: "comic-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
        ]
      },
      {
        id: "comic-5",
        title: "Kapitel 5: Boss‑Kampf",
        text: "Ein besonders starkes Wortmonster stellt sich dir in den Weg.",
        image: "/src/story/src/story/comic/comic5.png",
        unlock: { minXp: 70, minSessions: 4, minWords: 20, minSuccess: 55 },
        quests: [
          { id: "comic-5-q1", type: "xp", amount: 70, label: "Erreiche 70 XP." }
        ]
      },
      {
        id: "comic-6",
        title: "Kapitel 6: Team‑Attacke",
        text: "Deine gelernten Wörter greifen gemeinsam an und schwächen das Monster.",
        image: "/src/story/src/story/comic/comic6.png",
        unlock: { minXp: 90, minSessions: 5, minWords: 25, minSuccess: 60 },
        quests: [
          { id: "comic-6-q1", type: "words", amount: 25, label: "Lerne 25 Wörter." }
        ]
      },
      {
        id: "comic-7",
        title: "Kapitel 7: Kritischer Treffer",
        text: "Ein besonders schwieriges Wort trifft das Monster mitten ins Ziel.",
        image: "/src/story/src/story/comic/comic7.png",
        unlock: { minXp: 120, minSessions: 6, minWords: 30, minSuccess: 60 },
        quests: [
          { id: "comic-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
        ]
      },
      {
        id: "comic-8",
        title: "Kapitel 8: Letzte Verteidigung",
        text: "Das Monster versucht, dich mit neuen Wörtern zu verwirren.",
        image: "/src/story/src/story/comic/comic8.png",
        unlock: { minXp: 150, minSessions: 7, minWords: 35, minSuccess: 65 },
        quests: [
          { id: "comic-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
        ]
      },
      {
        id: "comic-9",
        title: "Kapitel 9: Der Fall des Monsters",
        text: "Mit einem letzten Wort besiegst du das Monster endgültig.",
        image: "/src/story/src/story/comic/comic9.png",
        unlock: { minXp: 180, minSessions: 8, minWords: 40, minSuccess: 70 },
        quests: [
          { id: "comic-9-q1", type: "xp", amount: 180, label: "Erreiche 180 XP." }
        ]
      },
      {
        id: "comic-10",
        title: "Kapitel 10: Held der Wörter",
        text: "Du wirst als Held der Wörter gefeiert. Neue Herausforderungen warten.",
        image: "/src/story/src/story/comic/comic10.png",
        unlock: { minXp: 220, minSessions: 9, minWords: 45, minSuccess: 70 },
        quests: [
          { id: "comic-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
        ]
      }
    ]
  },
  {
    id: "school",
    title: "Die Klassen‑Challenge",
    style: "school",
    description: "Alltagsnahe Situationen in der Schule – mit Vokabel‑Challenges.",
    chapters: [
      {
        id: "school-1",
        title: "Kapitel 1: Neuer Stundenplan",
        text: "Dein Lehrer kündigt eine Vokabel‑Challenge für die ganze Klasse an.",
        image: "/src/story/school/school1.png",
        unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
        quests: [
          { id: "school-1-q1", type: "xp", amount: 5, label: "Sammle 5 XP." }
        ]
      },
      {
        id: "school-2",
        title: "Kapitel 2: Erste Hausaufgabe",
        text: "Du bekommst eine Liste mit neuen Wörtern, die du bis morgen können sollst.",
        image: "/src/story/school/school2.png",
        unlock: { minXp: 15, minSessions: 1, minWords: 5, minSuccess: 0 },
        quests: [
          { id: "school-2-q1", type: "words", amount: 8, label: "Lerne 8 Wörter." }
        ]
      },
      {
        id: "school-3",
        title: "Kapitel 3: Vokabeltest",
        text: "Ein unangekündigter Vokabeltest steht an. Dein Training zahlt sich aus.",
        image: "/src/story/school/school3.png",
        unlock: { minXp: 30, minSessions: 2, minWords: 12, minSuccess: 0 },
        quests: [
          { id: "school-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
        ]
      },
      {
        id: "school-4",
        title: "Kapitel 4: Gruppenarbeit",
        text: "In einer Gruppenarbeit hilfst du deinen Mitschülern mit deinen Vokabelkenntnissen.",
        image: "/src/story/school/school4.png",
        unlock: { minXp: 45, minSessions: 3, minWords: 15, minSuccess: 50 },
        quests: [
          { id: "school-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
        ]
      },
      {
        id: "school-5",
        title: "Kapitel 5: Elternabend",
        text: "Deine Lehrerin lobt deinen Einsatz beim Lernen vor deinen Eltern.",
        image: "/src/story/school/school5.png",
        unlock: { minXp: 70, minSessions: 4, minWords: 20, minSuccess: 55 },
        quests: [
          { id: "school-5-q1", type: "xp", amount: 70, label: "Erreiche 70 XP." }
        ]
      },
      {
        id: "school-6",
        title: "Kapitel 6: Austauschschüler",
        text: "Ein Austauschschüler kommt in deine Klasse. Du kannst dich dank deiner Vokabeln gut mit ihm unterhalten.",
        image: "/src/story/school/school6.png",
        unlock: { minXp: 90, minSessions: 5, minWords: 25, minSuccess: 60 },
        quests: [
          { id: "school-6-q1", type: "words", amount: 25, label: "Lerne 25 Wörter." }
        ]
      },
      {
        id: "school-7",
        title: "Kapitel 7: Präsentation",
        text: "Du hältst eine kurze Präsentation in der Fremdsprache vor der Klasse.",
        image: "/src/story/school/school7.png",
        unlock: { minXp: 120, minSessions: 6, minWords: 30, minSuccess: 60 },
        quests: [
          { id: "school-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
        ]
      },
      {
        id: "school-8",
        title: "Kapitel 8: Klassenfahrt",
        text: "Auf der Klassenfahrt brauchst du deine Vokabeln im Alltag.",
        image: "/src/story/school/school8.png",
        unlock: { minXp: 150, minSessions: 7, minWords: 35, minSuccess: 65 },
        quests: [
          { id: "school-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
        ]
      },
      {
        id: "school-9",
        title: "Kapitel 9: Große Abschlussarbeit",
        text: "Du schreibst eine längere Arbeit in der Fremdsprache und merkst, wie viel du gelernt hast.",
        image: "/src/story/school/school9.png",
        unlock: { minXp: 180, minSessions: 8, minWords: 40, minSuccess: 70 },
        quests: [
          { id: "school-9-q1", type: "xp", amount: 180, label: "Erreiche 180 XP." }
        ]
      },
      {
        id: "school-10",
        title: "Kapitel 10: Klassen‑Champion",
        text: "Du gewinnst die Klassen‑Challenge und wirst als Vokabel‑Champion gefeiert.",
        image: "/src/story/school/school10.png",
        unlock: { minXp: 220, minSessions: 9, minWords: 45, minSuccess: 70 },
        quests: [
          { id: "school-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
        ]
      }
    ]
  },
  {
    id: "magic-2",
    title: "Der Kristallwald",
    style: "fantasy",
    description: "Ein Wald voller magischer Kristalle, die auf deine Lernfortschritte reagieren.",
    chapters: [
        {
            id: "magic-2-1",
            title: "Kapitel 1: Der Ruf des Waldes",
            text: "Ein leuchtender Kristall zeigt dir den Weg in einen geheimnisvollen Wald.",
            image: "/fantasy/fantasy2-1.png",
            unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
            quests: [
                { id: "magic-2-1-q1", type: "xp", amount: 10, label: "Sammle 10 XP." }
            ]
        },
        {
            id: "magic-2-2",
            title: "Kapitel 2: Die Flüsterkristalle",
            text: "Die Kristalle beginnen zu flüstern, wenn du neue Wörter lernst.",
            image: "/fantasy/fantasy2-2.png",
            unlock: { minXp: 20, minSessions: 1, minWords: 5, minSuccess: 0 },
            quests: [
                { id: "magic-2-2-q1", type: "words", amount: 10, label: "Lerne 10 Wörter." }
            ]
        },
        {
            id: "magic-2-3",
            title: "Kapitel 3: Der Kristallwächter",
            text: "Ein Wächter prüft, ob du fleißig trainiert hast.",
            image: "/fantasy/fantasy2-3.png",
            unlock: { minXp: 40, minSessions: 2, minWords: 15, minSuccess: 0 },
            quests: [
                { id: "magic-2-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
            ]
        },
        {
            id: "magic-2-4",
            title: "Kapitel 4: Die Lichtprüfung",
            text: "Ein Kristallstrahl reagiert auf deine Erfolgsquote.",
            image: "/fantasy/fantasy2-4.png",
            unlock: { minXp: 60, minSessions: 3, minWords: 20, minSuccess: 50 },
            quests: [
                { id: "magic-2-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
            ]
        },
        {
            id: "magic-2-5",
            title: "Kapitel 5: Der Kristallsee",
            text: "Ein See aus Licht zeigt dir deine Lernfortschritte.",
            image: "/fantasy/fantasy2-5.png",
            unlock: { minXp: 80, minSessions: 4, minWords: 25, minSuccess: 55 },
            quests: [
                { id: "magic-2-5-q1", type: "xp", amount: 80, label: "Erreiche 80 XP." }
            ]
        },
        {
            id: "magic-2-6",
            title: "Kapitel 6: Die Kristallhöhle",
            text: "Eine Höhle voller schwebender Wörter erwartet dich.",
            image: "/fantasy/fantasy2-6.png",
            unlock: { minXp: 100, minSessions: 5, minWords: 30, minSuccess: 60 },
            quests: [
                { id: "magic-2-6-q1", type: "words", amount: 30, label: "Lerne 30 Wörter." }
            ]
        },
        {
            id: "magic-2-7",
            title: "Kapitel 7: Die Runenprüfung",
            text: "Magische Runen testen dein Wissen.",
            image: "/fantasy/fantasy2-7.png",
            unlock: { minXp: 130, minSessions: 6, minWords: 35, minSuccess: 65 },
            quests: [
                { id: "magic-2-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
            ]
        },
        {
            id: "magic-2-8",
            title: "Kapitel 8: Der Kristallriese",
            text: "Ein riesiger Kristallgigant stellt dich auf die Probe.",
            image: "/fantasy/fantasy2-8.png",
            unlock: { minXp: 160, minSessions: 7, minWords: 40, minSuccess: 65 },
            quests: [
                { id: "magic-2-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
            ]
        },
        {
            id: "magic-2-9",
            title: "Kapitel 9: Der Kristallkern",
            text: "Im Herzen des Waldes wartet die größte Prüfung.",
            image: "/fantasy/fantasy2-9.png",
            unlock: { minXp: 200, minSessions: 8, minWords: 45, minSuccess: 70 },
            quests: [
                { id: "magic-2-9-q1", type: "xp", amount: 200, label: "Erreiche 200 XP." }
            ]
        },
        {
            id: "magic-2-10",
            title: "Kapitel 10: Meister des Waldes",
            text: "Der Wald erkennt dich als würdig an.",
            image: "/fantasy/fantasy2-10.png",
            unlock: { minXp: 250, minSessions: 10, minWords: 50, minSuccess: 75 },
            quests: [
                { id: "magic-2-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
            ]
        }
    ]
},

  {
    id: "comic-2",
    title: "SuperNova Squad – Staffel 2",
    style: "comic",
    description: "Neue Abenteuer mit dem Superhelden‑Team, das Wörter als Waffen nutzt.",
    chapters: [
        {
            id: "comic-2-1",
            title: "Kapitel 1: Neues Signal",
            text: "Ein seltsames Energiesignal taucht über der Stadt auf.",
            image: "/src/story/src/story/comic/comic2-1.png",
            unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
            quests: [
                { id: "comic-2-1-q1", type: "xp", amount: 10, label: "Sammle 10 XP." }
            ]
        },
        {
            id: "comic-2-2",
            title: "Kapitel 2: Der neue Gegner",
            text: "Ein mysteriöser Schurke namens 'Glitch' stört die Wort‑Energie.",
            image: "/src/story/src/story/comic/comic2-2.png",
            unlock: { minXp: 20, minSessions: 1, minWords: 5, minSuccess: 0 },
            quests: [
                { id: "comic-2-2-q1", type: "words", amount: 10, label: "Lerne 10 Wörter." }
            ]
        },
        {
            id: "comic-2-3",
            title: "Kapitel 3: Team‑Upgrade",
            text: "Das Team erhält neue Wort‑Gadgets.",
            image: "/src/story/src/story/comic/comic2-3.png",
            unlock: { minXp: 40, minSessions: 2, minWords: 15, minSuccess: 0 },
            quests: [
                { id: "comic-2-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
            ]
        },
        {
            id: "comic-2-4",
            title: "Kapitel 4: Der Datensturm",
            text: "Glitch löst einen digitalen Wortsturm aus.",
            image: "/src/story/src/story/comic/comic2-4.png",
            unlock: { minXp: 60, minSessions: 3, minWords: 20, minSuccess: 50 },
            quests: [
                { id: "comic-2-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
            ]
        },
        {
            id: "comic-2-5",
            title: "Kapitel 5: Die Spur",
            text: "Du findest Hinweise auf Glitchs Versteck.",
            image: "/src/story/src/story/comic/comic2-5.png",
            unlock: { minXp: 80, minSessions: 4, minWords: 25, minSuccess: 55 },
            quests: [
                { id: "comic-2-5-q1", type: "xp", amount: 80, label: "Erreiche 80 XP." }
            ]
        },
        {
            id: "comic-2-6",
            title: "Kapitel 6: Die Falle",
            text: "Glitch stellt dem Team eine digitale Falle.",
            image: "/src/story/src/story/comic/comic2-6.png",
            unlock: { minXp: 100, minSessions: 5, minWords: 30, minSuccess: 60 },
            quests: [
                { id: "comic-2-6-q1", type: "words", amount: 30, label: "Lerne 30 Wörter." }
            ]
        },
        {
            id: "comic-2-7",
            title: "Kapitel 7: Der Code‑Splitter",
            text: "Ein Gerät, das Wörter verzerrt, taucht auf.",
            image: "/src/story/src/story/comic/comic2-7.png",
            unlock: { minXp: 130, minSessions: 6, minWords: 35, minSuccess: 65 },
            quests: [
                { id: "comic-2-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
            ]
        },
        {
            id: "comic-2-8",
            title: "Kapitel 8: Der Showdown beginnt",
            text: "Das Team findet Glitchs Hauptquartier.",
            image: "/src/story/src/story/comic/comic2-8.png",
            unlock: { minXp: 160, minSessions: 7, minWords: 40, minSuccess: 65 },
            quests: [
                { id: "comic-2-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
            ]
        },
        {
            id: "comic-2-9",
            title: "Kapitel 9: Der Datenkern",
            text: "Im Zentrum des Verstecks wartet die größte Herausforderung.",
            image: "/src/story/src/story/comic/comic2-9.png",
            unlock: { minXp: 200, minSessions: 8, minWords: 45, minSuccess: 70 },
            quests: [
                { id: "comic-2-9-q1", type: "xp", amount: 200, label: "Erreiche 200 XP." }
            ]
        },
        {
            id: "comic-2-10",
            title: "Kapitel 10: Neustart",
            text: "Du besiegst Glitch und setzt das Wort‑System zurück.",
            image: "/src/story/src/story/comic/comic2-10.png",
            unlock: { minXp: 250, minSessions: 10, minWords: 50, minSuccess: 75 },
            quests: [
                { id: "comic-2-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
            ]
        }
    ]
},
{
    id: "school-2",
    title: "Die Schul‑Expedition",
    style: "school",
    description: "Eine große Klassen‑Expedition voller Rätsel, Teamarbeit und Vokabel‑Challenges.",
    chapters: [
        {
            id: "school-2-1",
            title: "Kapitel 1: Die Einladung",
            text: "Die Klasse erhält eine geheimnisvolle Einladung zu einer Expedition.",
            image: "/src/story/school/school2-1.png",
            unlock: { minXp: 0, minSessions: 0, minWords: 0, minSuccess: 0 },
            quests: [
                { id: "school-2-1-q1", type: "xp", amount: 10, label: "Sammle 10 XP." }
            ]
        },
        {
            id: "school-2-2",
            title: "Kapitel 2: Die Teams",
            text: "Du wirst einem Team zugeteilt und erhältst deine erste Aufgabe.",
            image: "/src/story/school/school2-2.png",
            unlock: { minXp: 20, minSessions: 1, minWords: 5, minSuccess: 0 },
            quests: [
                { id: "school-2-2-q1", type: "words", amount: 10, label: "Lerne 10 Wörter." }
            ]
        },
        {
            id: "school-2-3",
            title: "Kapitel 3: Der Aufbruch",
            text: "Die Expedition startet. Du musst dein Wissen direkt anwenden.",
            image: "/src/story/school/school2-3.png",
            unlock: { minXp: 40, minSessions: 2, minWords: 15, minSuccess: 0 },
            quests: [
                { id: "school-2-3-q1", type: "sessions", amount: 2, label: "Beende 2 Sessions." }
            ]
        },
        {
            id: "school-2-4",
            title: "Kapitel 4: Die Hängebrücke",
            text: "Eine wackelige Brücke testet deine Konzentration.",
            image: "/src/story/school/school2-4.png",
            unlock: { minXp: 60, minSessions: 3, minWords: 20, minSuccess: 50 },
            quests: [
                { id: "school-2-4-q1", type: "success", amount: 50, label: "Erreiche 50% Erfolgsquote." }
            ]
        },
        {
            id: "school-2-5",
            title: "Kapitel 5: Das Lager",
            text: "Ihr baut ein Lager auf und besprecht die nächsten Schritte.",
            image: "/src/story/school/school2-5.png",
            unlock: { minXp: 80, minSessions: 4, minWords: 25, minSuccess: 55 },
            quests: [
                { id: "school-2-5-q1", type: "xp", amount: 80, label: "Erreiche 80 XP." }
            ]
        },
        {
            id: "school-2-6",
            title: "Kapitel 6: Die Karte",
            text: "Ihr findet eine alte Karte mit geheimen Hinweisen.",
            image: "/src/story/school/school2-6.png",
            unlock: { minXp: 100, minSessions: 5, minWords: 30, minSuccess: 60 },
            quests: [
                { id: "school-2-6-q1", type: "words", amount: 30, label: "Lerne 30 Wörter." }
            ]
        },
        {
            id: "school-2-7",
            title: "Kapitel 7: Das Rätsel",
            text: "Ein Rätselblock muss gelöst werden, um weiterzukommen.",
            image: "/src/story/school/school2-7.png",
            unlock: { minXp: 130, minSessions: 6, minWords: 35, minSuccess: 65 },
            quests: [
                { id: "school-2-7-q1", type: "success", amount: 60, label: "Halte 60% Erfolgsquote." }
            ]
        },
        {
            id: "school-2-8",
            title: "Kapitel 8: Der Fluss",
            text: "Ihr müsst einen Fluss überqueren – Teamarbeit ist gefragt.",
            image: "/src/story/school/school2-8.png",
            unlock: { minXp: 160, minSessions: 7, minWords: 40, minSuccess: 65 },
            quests: [
                { id: "school-2-8-q1", type: "sessions", amount: 7, label: "Beende 7 Sessions." }
            ]
        },
        {
            id: "school-2-9",
            title: "Kapitel 9: Der Schatz",
            text: "Ihr findet eine alte Kiste mit einer besonderen Belohnung.",
            image: "/src/story/school/school2-9.png",
            unlock: { minXp: 200, minSessions: 8, minWords: 45, minSuccess: 70 },
            quests: [
                { id: "school-2-9-q1", type: "xp", amount: 200, label: "Erreiche 200 XP." }
            ]
        },
        {
            id: "school-2-10",
            title: "Kapitel 10: Die Rückkehr",
            text: "Ihr kehrt als Expedition‑Meister zurück zur Schule.",
            image: "/src/story/school/school2-10.png",
            unlock: { minXp: 250, minSessions: 10, minWords: 50, minSuccess: 75 },
            quests: [
                { id: "school-2-10-q1", type: "success", amount: 70, label: "Halte 70% Erfolgsquote." }
            ]
        }
    ]
},

];
