// База тепер спочатку порожня
const db = {
    genders: ["Чоловік", "Жінка"],
    health_base: [],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    professions: [],
    health_diseases: [],
    hobbies: [],
    additional_info: [],
    inventory: [],
    phobias: [],
    traits: [],
    specials: []
};

// Виправлено: Оптимізоване завантаження бази даних (паралельне)
async function loadDatabase() {
    const categories = ['health_base', 'professions', 'health_diseases', 'hobbies', 'additional_info', 'inventory', 'phobias', 'traits', 'specials'];
    
    try {
        const fetchPromises = categories.map(cat => 
            // Додаємо Date.now(), щоб браузер не кешував текстові файли
            fetch(`${cat}.txt?v=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error(`Файл ${cat}.txt не знайдено`);
                return response.text();
            })
            .then(text => {
                // Розбиваємо текст на рядки, забираємо пробіли, ігноруємо порожні рядки
                db[cat] = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            })
            .catch(error => {
                console.error(`Помилка завантаження ${cat}.txt:`, error);
                db[cat] = ["Помилка: Файл не знайдено або пустий"];
            })
        );

        await Promise.all(fetchPromises);
        console.log("База даних успішно завантажена.");
    } catch (globalError) {
        console.error("Критична помилка при завантаженні бази:", globalError);
    }
}

// Запускаємо завантаження бази одразу при відкритті сторінки
window.addEventListener('DOMContentLoaded', loadDatabase);

const imgMale = `<img src="man.jpg" alt="Чоловік" class="profile-photo-img">`;
const imgFemale = `<img src="woman.jpg" alt="Жінка" class="profile-photo-img">`;

const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 

const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

const getExperienceD6 = () => {
    const r = Math.floor(Math.random() * 6) + 1;
    return r === 1 ? "Дилетант (до 1 місяця)" : r === 2 ? "Новачок (від 1 до 12 місяців)" :
           r === 3 ? "Любитель (від 1 до 2 років)" : r === 4 ? "Досвідчений (від 2 до 5 років)" :
           r === 5 ? "Експерт (від 5 до 10 років)" : "Професіонал (понад 10 років)";
};

const getConstitutionText = () => {
    const r = Math.floor(Math.random() * 5) + 1;
    return r === 1 ? "1 (Худорлява)" : r === 2 ? "2 (Струнка)" : r === 3 ? "3 (Середня)" : r === 4 ? "4 (Щільна)" : "5 (З надмірною вагою)";
};

const generateHealth = () => Math.random() > 0.4 ? getRandomItem(db.health_base) : `${getRandomItem(db.health_diseases)} (ступінь: ${getRandomItem(db.health_stages)})`;

function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    const lName = document.getElementById('lastNameInput').value.trim();
    
    if (!fName) { alert("Будь ласка, введіть хоча б Ім'я!"); return; }
    
    document.getElementById('start-modal').style.display = 'none';
    const nameDisplay = document.getElementById('candidate-name');
    nameDisplay.textContent = `ПІБ: ${fName} ${lName}`.trim();
    nameDisplay.style.display = 'block';

    generateCharacter();
    document.getElementById('generateBtn').style.display = 'block';
}

function generateCharacter() {
    // Приховуємо картку, поки вона генерується
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('global-lock').style.display = 'flex';

    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    const gender = getRandomItem(db.genders);

    let sp1 = getRandomItem(db.specials);
    let sp2 = getRandomItem(db.specials);
    while (sp1 === sp2 && db.specials.length > 1) {
        sp2 = getRandomItem(db.specials);
    }

    const charData = {
        bio: `${gender}, ${age} років\nСтатура: ${getConstitutionText()}`,
        profession: `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`,
        health: generateHealth(),
        phobia: getRandomItem(db.phobias),
        trait: getRandomItem(db.traits),
        hobby: `${getRandomItem(db.hobbies)}\nРівень: ${getExperienceD6()}`,
        inventory: getRandomItem(db.inventory),
        info: getRandomItem(db.additional_info),
        special1: sp1,
        special2: sp2
    };

    document.getElementById('profile-photo').innerHTML = gender === "Чоловік" ? imgMale : imgFemale;
    document.getElementById('candidate-id').textContent = Math.floor(1000 + Math.random() * 9000);

    for (const [key, value] of Object.entries(charData)) {
        const container = document.getElementById(key);
        if(container) {
            container.dataset.value = value;
            container.classList.remove('revealed');
            container.textContent = ""; 
        }
    }
    // Показуємо картку з глобальним блокуванням
    document.getElementById('character-sheet').classList.remove('hidden');
}

async function printText(element, text) {
    let currentString = "";
    for (let i = 0; i < text.length; i++) {
        currentString += text.charAt(i);
        element.textContent = currentString; 
        // Невелика затримка для ефекту друку
        await new Promise(r => setTimeout(r, 20)); 
    }
}

async function unlockSheet() {
    if (isTypingGlobal) return;
    isTypingGlobal = true;
    
    // ДОДАНО СЮДИ: одразу ховаємо блюр перед тим, як почнеться друк тексту
    document.getElementById('global-lock').style.display = 'none';

    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {
        // Деякі браузери блокують автовідтворення аудіо без взаємодії користувача
    }

    const fields = ['bio', 'profession', 'health', 'phobia', 'trait', 'hobby', 'inventory', 'info', 'special1', 'special2'];
    
    const promises = fields.map(id => {
        const container = document.getElementById(id);
        container.classList.add('revealed');
        return printText(container, container.dataset.value);
    });

    await Promise.all(promises); 
    
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
    
    // Звідси ми забрали приховування 'global-lock', бо перенесли його наверх
}

async function resetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    const container = document.getElementById(elementId);
    if (!container.classList.contains('revealed')) return; // Не перегенеровуємо приховані поля
    
    let newItem = "";

    if (elementId === 'bio') {
        const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
        newItem = `${getRandomItem(db.genders)}, ${age} років\nСтатура: ${getConstitutionText()}`;
    } else if (elementId === 'profession' || elementId === 'hobby') {
        newItem = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (elementId === 'health') {
        newItem = generateHealth();
    } else if (elementId === 'special1' || elementId === 'special2') {
        const otherId = elementId === 'special1' ? 'special2' : 'special1';
        const otherCardValue = document.getElementById(otherId).dataset.value;
        newItem = getRandomItem(db.specials);
        while (newItem === otherCardValue && db.specials.length > 1) {
            newItem = getRandomItem(db.specials);
        }
    } else {
        newItem = getRandomItem(db[dbKey]);
    }

    container.dataset.value = newItem;

    isTypingGlobal = true;
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {}
    
    await printText(container, newItem);
    
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}