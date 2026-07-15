const db = {
    professions: ["Хірург-травматолог", "Інженер-електрик", "Програміст (Python)", "Спецназівець", "Вчитель історії", "Агроном", "Кухар", "Фермер"],
    genders: ["Чоловік", "Жінка"],
    // Здоров'я розділено, щоб не було абсурдних комбінацій
    health_base: ["Ідеальне здоров'я", "Абсолютно здоровий", "Міцний імунітет"],
    health_diseases: ["Астма", "Короткозорість (-4)", "Цукровий діабет", "Хронічний кашель", "Сліпота на одне око", "Алергія на пилок"],
    hobbies: ["Виживання в лісі", "В'язання", "Радіоаматорство", "Швидкісне читання", "Ботаніка", "Стрільба з лука"],
    additional_info: ["Прочитав всі книги Стівена Кінга", "Вміє затримувати дихання на 3 хвилини", "Колишній чемпіон з покеру", "Має чорний пояс з карате", "Знає азбуку Морзе", "Перехворів на всі відомі віруси"],
    inventory: ["Військова аптечка", "Набір викруток", "Динамо-ліхтарик", "Гітара", "Ящик тушонки", "Насіння овочів"],
    traits: ["Клаустрофобія (боїться тісноти)", "Піроманія", "Патологічний брехун", "Абсолютна пам'ять", "Безсоння"],
    specials: ["Забрати здоров'я в будь-якого гравця", "Перероздати всім здоров'я", "Дізнатися фобію будь-якого гравця", "Імунітет на одне голосування", "Вкрасти інвентар сусіда"]
};

const svgMale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="20"/><path d="M15,100 C15,60 85,60 85,100"/></svg>`;
const svgFemale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="18"/><path d="M25,25 C10,40 20,70 30,80 C35,65 65,65 70,80 C80,70 90,40 75,25 Z"/><path d="M15,100 C15,65 85,65 85,100"/></svg>`;

// --- АУДІО ПЕЧАТНОЇ МАШИНКИ ---
const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; // Зациклюємо, поки йде друк
typingAudio.preload = 'auto';

let isTypingGlobal = false; 

function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    const lName = document.getElementById('lastNameInput').value.trim();
    if (!fName) { alert("Будь ласка, введіть хоча б Ім'я!"); return; }
    
    document.getElementById('start-modal').style.display = 'none';
    const nameDisplay = document.getElementById('candidate-name');
    nameDisplay.innerText = `ПІБ: ${fName} ${lName}`.trim();
    nameDisplay.style.display = 'block';

    generateCharacter();
    document.getElementById('generateBtn').style.display = 'block';
}

function generateCharacter() {
    document.getElementById('global-lock').style.display = 'flex';

    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    const gender = getRandomItem(db.genders);
    const maxExperience = age - 18;
    const exp = maxExperience > 0 ? Math.floor(Math.random() * (maxExperience + 1)) : 0;
    
    // Логіка здоров'я: 60% шанс на хороше здоров'я, 40% на хворобу зі старту
    const startHealth = Math.random() > 0.4 ? getRandomItem(db.health_base) : getRandomItem(db.health_diseases);
    // Логіка хобі: додаємо випадковий стаж
    const hobbyExp = Math.floor(Math.random() * 15) + 1;

    const currentCharacter = {
        bio: `${gender}, ${age} років`,
        profession: getRandomItem(db.professions),
        experience: exp > 0 ? `${exp} років` : "Без досвіду",
        health: startHealth,
        hobby: `${getRandomItem(db.hobbies)} (стаж: ${hobbyExp} років)`,
        info: getRandomItem(db.additional_info),
        inventory: getRandomItem(db.inventory),
        trait: getRandomItem(db.traits),
        special: getRandomItem(db.specials)
    };

    document.getElementById('profile-photo').innerHTML = gender === "Чоловік" ? svgMale : svgFemale;
    document.getElementById('candidate-id').innerText = Math.floor(1000 + Math.random() * 9000);

    setupLockedField('bio', currentCharacter.bio);
    setupLockedField('profession', currentCharacter.profession);
    setupLockedField('experience', currentCharacter.experience);
    setupLockedField('health', currentCharacter.health);
    setupLockedField('hobby', currentCharacter.hobby);
    setupLockedField('info', currentCharacter.info);
    setupLockedField('inventory', currentCharacter.inventory);
    setupLockedField('trait', currentCharacter.trait);
    setupLockedField('special', currentCharacter.special);

    document.getElementById('character-sheet').classList.remove('hidden');
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function unlockSheet() {
    document.getElementById('global-lock').style.display = 'none';
}

function setupLockedField(id, text) {
    const container = document.getElementById(id);
    container.dataset.value = text;
    container.classList.remove('revealed');
    container.innerHTML = `<div class="blurred-text">${text}</div>`;
}

async function revealField(id, event) {
    if (event) event.stopPropagation();
    if (document.getElementById('global-lock').style.display !== 'none') return; 

    const container = document.getElementById(id);
    if (container.classList.contains('revealed') || isTypingGlobal) return;
    
    container.classList.add('revealed');
    const textToType = container.dataset.value;
    container.innerHTML = ""; 
    await typeWriterEffect(container, textToType);
}

// Функція друку тепер зі звуком!
async function typeWriterEffect(element, text) {
    isTypingGlobal = true;
    
    // Запускаємо звук і ЧЕКАЄМО, поки браузер реально почне його відтворювати
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) {
            await playPromise; // Скрипт зупиняється тут на мілісекунди, поки не піде звук
        }
    } catch(e) { 
        console.log("Аудіо заблоковано браузером"); 
    }

    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        await new Promise(r => setTimeout(r, 30)); // 30ms зазвичай звучить краще для машинки
    }
    
    typingAudio.pause(); // Зупиняємо звук
    typingAudio.currentTime = 0; // Відмотуємо на початок
    isTypingGlobal = false;
}

// НОВА ФУНКЦІЯ: Рерол конкретного поля [↻]
async function resetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    const container = document.getElementById(elementId);
    let newItem = "";

    // Специфічна логіка генерації для різних полів
    if (elementId === 'bio') {
        const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
        newItem = `${getRandomItem(db.genders)}, ${age} років`;
    } else if (elementId === 'experience') {
        newItem = `${Math.floor(Math.random() * 20) + 1} років`; // Просто випадковий стаж
    } else if (elementId === 'health') {
        newItem = Math.random() > 0.4 ? getRandomItem(db.health_base) : getRandomItem(db.health_diseases);
    } else if (elementId === 'hobby') {
        const hobbyExp = Math.floor(Math.random() * 15) + 1;
        newItem = `${getRandomItem(db.hobbies)} (стаж: ${hobbyExp} років)`;
    } else {
        newItem = getRandomItem(db[dbKey]);
    }

    container.dataset.value = newItem;

    // Якщо поле вже відкрите — переписуємо красиво, якщо закрите — просто міняємо блюр
    if (container.classList.contains('revealed')) {
        container.innerHTML = "";
        await typeWriterEffect(container, newItem);
    } else {
        const blurText = container.querySelector('.blurred-text');
        if (blurText) blurText.innerText = newItem;
    }
}

// ОНОВЛЕНО: Логіка додавання [+]
async function addExtra(elementId, dbKey) {
    if (isTypingGlobal) return; 

    const container = document.getElementById(elementId);
    let newItem = "";
    let textToAdd = "";

    if (elementId === 'health') {
        newItem = getRandomItem(db.health_diseases); // Завжди додаємо хворобу
        let current = container.dataset.value;
        
        // Якщо у гравця було "Ідеальне здоров'я", хвороба ПЕРЕКРИВАЄ його, а не додається через плюс
        if (current.includes("Ідеальне") || current.includes("Абсолютно") || current.includes("Міцний")) {
            textToAdd = newItem;
            container.dataset.value = newItem;
        } else {
            textToAdd = " + " + newItem;
            container.dataset.value = current + textToAdd;
        }
    } else if (elementId === 'hobby') {
        const hobbyExp = Math.floor(Math.random() * 15) + 1;
        newItem = `${getRandomItem(db.hobbies)} (стаж: ${hobbyExp} років)`;
        textToAdd = " + " + newItem;
        container.dataset.value += textToAdd;
    } else {
        newItem = getRandomItem(db[dbKey]);
        textToAdd = " + " + newItem;
        container.dataset.value += textToAdd;
    }
    
    if (container.classList.contains('revealed')) {
        // Якщо це здоров'я і ми повністю замінюємо текст
        if (textToAdd === newItem && elementId === 'health') {
            container.innerHTML = "";
        }
        await typeWriterEffect(container, textToAdd);
    } else {
        const blurText = container.querySelector('.blurred-text');
        if (blurText) blurText.innerText = container.dataset.value;
    }
}