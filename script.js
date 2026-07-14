const db = {
    professions: ["Хірург-травматолог", "Інженер-електрик", "Програміст (Python)", "Спецназівець", "Вчитель історії", "Агроном", "Кухар", "Фермер"],
    genders: ["Чоловік", "Жінка"],
    health: ["Ідеальне", "Астма", "Короткозорість (-4)", "Цукровий діабет", "Хронічний кашель", "Здоровий як бик"],
    hobbies: ["Виживання в лісі", "В'язання", "Радіоаматорство", "Швидкісне читання", "Ботаніка"],
    inventory: ["Військова аптечка", "Набір викруток", "Динамо-ліхтарик", "Гітара", "Ящик тушонки", "Насіння овочів"],
    traits: ["Клаустрофобія (боїться тісноти)", "Піроманія", "Патологічний брехун", "Абсолютна пам'ять", "Безсоння"],
    specials: ["Забрати здоров'я в будь-якого гравця", "Перероздати всім здоров'я", "Дізнатися фобію будь-якого гравця", "Імунітет на одне голосування", "Вкрасти інвентар сусіда"]
};

const svgMale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="20"/><path d="M15,100 C15,60 85,60 85,100"/></svg>`;
const svgFemale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="18"/><path d="M25,25 C10,40 20,70 30,80 C35,65 65,65 70,80 C80,70 90,40 75,25 Z"/><path d="M15,100 C15,65 85,65 85,100"/></svg>`;

let isTypingGlobal = false; // Блокує кліки під час анімації друку

function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    const lName = document.getElementById('lastNameInput').value.trim();
    
    if (!fName) {
        alert("Будь ласка, введіть хоча б Ім'я!");
        return;
    }

    document.getElementById('start-modal').style.display = 'none';
    
    const nameDisplay = document.getElementById('candidate-name');
    nameDisplay.innerText = `ПІБ: ${fName} ${lName}`.trim();
    nameDisplay.style.display = 'block';

    generateCharacter();
    document.getElementById('generateBtn').style.display = 'block';
}

function generateCharacter() {
    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    const gender = getRandomItem(db.genders);
    const maxExperience = age - 18;
    const exp = maxExperience > 0 ? Math.floor(Math.random() * (maxExperience + 1)) : 0;
    
    const currentCharacter = {
        profession: getRandomItem(db.professions),
        bio: `${gender}, ${age} років`,
        experience: exp > 0 ? `${exp} років` : "Без досвіду",
        health: getRandomItem(db.health),
        hobby: getRandomItem(db.hobbies),
        inventory: getRandomItem(db.inventory),
        trait: getRandomItem(db.traits),
        special: getRandomItem(db.specials)
    };

    document.getElementById('profile-photo').innerHTML = gender === "Чоловік" ? svgMale : svgFemale;
    document.getElementById('candidate-id').innerText = Math.floor(1000 + Math.random() * 9000);

    setupLockedField('profession', currentCharacter.profession);
    setupLockedField('bio', currentCharacter.bio);
    setupLockedField('experience', currentCharacter.experience);
    setupLockedField('health', currentCharacter.health);
    setupLockedField('hobby', currentCharacter.hobby);
    setupLockedField('inventory', currentCharacter.inventory);
    setupLockedField('trait', currentCharacter.trait);
    setupLockedField('special', currentCharacter.special);

    document.getElementById('character-sheet').classList.remove('hidden');
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Знімає глобальний замок (натискання на велику кнопку по центру)
function unlockSheet() {
    document.getElementById('global-lock').style.display = 'none';
}

// Формуємо приховане поле (тільки розмитий текст, жодних кнопок!)
function setupLockedField(id, text) {
    const container = document.getElementById(id);
    container.dataset.value = text;
    container.classList.remove('revealed');
    
    container.innerHTML = `<div class="blurred-text">${text}</div>`;
}

// Відкриття поля (з анімацією друку) по тапу на саме поле
async function revealField(id, event) {
    if (event) event.stopPropagation();

    // Якщо глобальний замок ще висить, кліки по полях не працюють
    if (document.getElementById('global-lock').style.display !== 'none') {
        return; 
    }

    const container = document.getElementById(id);
    if (container.classList.contains('revealed') || isTypingGlobal) {
        return;
    }
    
    container.classList.add('revealed');
    const textToType = container.dataset.value;
    container.innerHTML = ""; 
    
    await typeWriterEffect(container, textToType);
}

async function typeWriterEffect(element, text) {
    isTypingGlobal = true;
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        await new Promise(r => setTimeout(r, 30)); 
    }
    isTypingGlobal = false;
}

// Кнопка [+]
async function addExtra(elementId, dbKey) {
    if (isTypingGlobal) return; 

    const container = document.getElementById(elementId);
    const newItem = getRandomItem(db[dbKey]);
    
    const currentValue = container.dataset.value;
    const textToAdd = " + " + newItem;
    container.dataset.value = currentValue + textToAdd;
    
    if (container.classList.contains('revealed')) {
        await typeWriterEffect(container, textToAdd);
    } else {
        const blurText = container.querySelector('.blurred-text');
        if (blurText) blurText.innerText = container.dataset.value;
    }
}