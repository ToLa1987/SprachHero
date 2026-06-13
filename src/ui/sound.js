const achievementSound = new Audio("assets/sounds/achievement.wav");
const bigAchievementSound = new Audio("assets/sounds/big_achievement.wav");

export function playAchievementSound(key) {
    if (
        key.includes("100") ||
        key.includes("200") ||
        key.includes("master") ||
        key.includes("complete")
    ) {
        bigAchievementSound.currentTime = 0;
        bigAchievementSound.play();
        return;
    }

    achievementSound.currentTime = 0;
    achievementSound.play();
}

// NEU: Quest-Sound
const questSound = new Audio("assets/sounds/achievement.wav");

export function playQuestSound() {
    questSound.currentTime = 0;
    questSound.play();
}

// NEU: Boost-Sound
const boostSound = new Audio("assets/sfx/levelup.wav");

export function playBoostSound() {
    boostSound.currentTime = 0;
    boostSound.play();
}

// Automatisch Boost-Sound bei aktiviertem Boost (Event aus storage.js)
window.addEventListener("boostActivated", () => {
    playBoostSound();
});
