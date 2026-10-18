// data.js

const DEFAULT_SPECIALS = [
    "Змінити картку 'Здоров'я' всім гравцям на нову з колоди",
    "Змінити свою картку 'Здоров'я' на нову з колоди.",
    "Змінити картку 'Здоров'я' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Здоров'я' із вибраним гравцем.",
    "Вилікувати себе від будь-якої хвороби або травми.",
    "Відкрити картку 'Здоров'я' будь-якого гравця.",
    "Змінити картку 'Фобія' всім гравцям на нову з колоди",
    "Змінити свою картку 'Фобія' на нову з колоди.",
    "Змінити картку 'Фобія' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Фобія' із вибраним гравцем.",
    "Вилікувати себе від будь-якої фобії",
    "Відкрити картку 'Фобія' будь-якого гравця.",
    "Змінити картку 'Професії' всім гравцям на нову з колоди",
    "Змінити свою картку 'Професії' на нову з колоди",
    "Змінити картку 'Професії' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Професії' із вибраним гравцем.",
    "Відкрити картку 'Професія' будь-якого гравця.",
    "Змінити картку 'Хобі' всім гравцям на нову з колоди",
    "Змінити свою картку 'Хобі' на нову з колоди",
    "Змінити картку 'Хобі' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Хобі' із вибраним гравцем.",
    "Відкрити картку 'Хобі' будь-якого гравця.",
    "Отримати додаткову карту 'Хобі'",
    "Змінити картку 'Багаж' всім гравцям на нову з колоди",
    "Змінити свою картку 'Багаж' на нову з колоди.",
    "Змінити картку 'Багаж' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Багаж' із вибраним гравцем.(Вкрасти)",
    "Захистити карту 'Багаж' від крадіжки до кінця гри.",
    "Відкрити картку 'Багаж' будь-якого гравця.",
    "Отримати додаткову карту 'Багаж'",
    "Змінити картку 'Дод.Інформація' всім гравцям на нову з колоди",
    "Змінити свою картку 'Дод.Інформація' на нову з колоди.",
    "Змінити картку 'Дод.Інформація' гравцеві на вибір на нову з колоди",
    "Обмінятися картками 'Дод.Інформація' із вибраним гравцем.",
    "Відкрити картку 'Дод.Інформація' будь-якого гравця.",
    "Змінити картку 'Вік' всім гравцям на нову з колоди",
    "Змінити свою картку 'Вік' на нову з колоди.",
    "Змінити картку 'Вік' гравцеві на вибір на нову з колоди",
    "Відкрити картку 'Вік' будь-якого гравця.",
    "Змінити картку 'Стать' всім гравцям на нову з колоди",
    "Змінити свою картку 'Стать' на нову з колоди.",
    "Змінити картку 'Стать' гравцеві на вибір на нову з колоди",
    "Відкрити картку 'Стать' будь-якого гравця.",
    "Змінити картку 'Статура' всім гравцям на нову з колоди",
    "Змінити свою картку 'Статура' на нову з колоди.",
    "Змінити картку 'Статура' гравцеві на вибір на нову з колоди",
    "Відкрити картку 'Статура' будь-якого гравця.",
    "Змінити всім гравцям 'Досьє'",
    "Змінити собі 'Досьє'",
    "Змінити 'Досьє' гравцеві на вибір",
    "Змусити будь-якого гравця відкрити одну приховану картку на ваш вибір.",
    "Замінити собі карту на власний розсуд.",
    "Перероздати одну картку на вибір всім гравцям.",
    "Змусити іншого гравця голосувати так само, як і ви.",
    "Перенаправити всі голоси, віддані проти вас, на іншого обраного гравця.",
    "Заборонити одному гравцю голосувати на цьому ході.",
    "Пропуск голосування.",
    "Отримати імунітет до вигнання на наступному голосуванні.",
    "Заборонити використання карток 'Стоп Бункер' на цьому ході всім гравцям.",
    "Отримати право двох голосів на поточному голосуванні.",
    "Захистити іншого гравця від вигнання, але ви втрачаєте право голосу на наступному голосуванні.",
    "Захистити себе від вигнання на одне голосування, але ви втрачаєте право голосу на наступному голосуванні.",
    "Змусити гравця скинути свою картку 'Стоп Бункер' без використання.",
    "Оголосити диктатуру: на цьому ході ви одноосібно вирішуєте, хто покине бункер.",
    "Відкрити всі свої картки добровільно, щоб отримати імунітет на одне голосування."
];

const db = {
    names: [], 
    genders: ["Чоловік", "Жінка"],
    ages: Array.from({length: 65 - 18 + 1}, (_, i) => `${i + 18} років`),
    bodies: ["Худорлява", "Струнка", "Середня", "Щільна", "З надмірною вагою"],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    professions: [],
    health_diseases: [],
    hobbies: [],
    additional_info: [],
    inventory: [],
    phobias: [],
    specials: [...DEFAULT_SPECIALS]
};

const sheetUrls = {
    names: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=516861620&single=true&output=csv",
    professions: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1382198780&single=true&output=csv",
    health_diseases: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=609770703&single=true&output=csv",
    hobbies: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1277297200&single=true&output=csv",
    additional_info: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1243736491&single=true&output=csv",
    inventory: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=552616764&single=true&output=csv",
    phobias: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=625829278&single=true&output=csv"
};

const imgMale = `<img src="man.jpg" alt="Чоловік" class="profile-photo-img">`;
const imgFemale = `<img src="woman.jpg" alt="Жінка" class="profile-photo-img">`;

function parseCSVLines(csvText) {
    return csvText
        .split(/\r?\n/)
        .map(line => line.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
        .filter(line => line.length > 0);
}

function enableStartButtons() {
    const startBtn = document.getElementById('startBtn');
    const hostBtn = document.getElementById('hostBtn');
    const joinBtn = document.getElementById('joinBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "Розпочати симуляцію";
    }
    if (hostBtn) hostBtn.disabled = false;
    if (joinBtn) joinBtn.disabled = false;
}

async function loadDatabase() {
    try {
        // Миттєвий старт із кешу сесії, якщо вже завантажували
        const cached = sessionStorage.getItem('bunkerDbCache_v2');
        if (cached) {
            const parsed = JSON.parse(cached);
            Object.assign(db, parsed);
            db.specials = [...DEFAULT_SPECIALS];
            enableStartButtons();
            return;
        }

        const fetchPromises = Object.entries(sheetUrls).map(async ([category, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const csvText = await response.text();
                const parsedLines = parseCSVLines(csvText);
                if (parsedLines.length > 0) db[category] = parsedLines;
            } catch (e) {
                console.error(`Не вдалося завантажити ${category}:`, e);
                if (!db[category] || db[category].length === 0) {
                    db[category] = ["Дані тимчасово недоступні"];
                }
            }
        });

        await Promise.all(fetchPromises);
        db.specials = [...DEFAULT_SPECIALS];
        sessionStorage.setItem('bunkerDbCache_v2', JSON.stringify(db));
        enableStartButtons();
    } catch (globalError) {
        console.error("Глобальна помилка завантаження бази:", globalError);
        enableStartButtons();
    }
}

const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

const getExperienceD6 = () => {
    const experiences = [
        "Дилетант (до 1 місяця)", 
        "Новачок (1-12 місяців)", 
        "Любитель (1-2 роки)", 
        "Досвідчений (2-5 років)", 
        "Експерт (5-10 років)", 
        "Професіонал (10+ років)"
    ];
    return experiences[Math.floor(Math.random() * experiences.length)];
};

const generateHealth = () => {
    const disease = getRandomItem(db.health_diseases);
    if (disease.toLowerCase().includes('здоров') || disease.includes("недоступні") || disease === "Дані відсутні") {
        return disease;
    }
    return `${disease} (ступінь: ${getRandomItem(db.health_stages)})`;
};

const generateFieldValue = (fieldKey) => {
    switch (fieldKey) {
        case 'gender': return getRandomItem(db.genders);
        case 'age': return getRandomItem(db.ages);
        case 'body': return getRandomItem(db.bodies);
        case 'profession': return `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`;
        case 'health': return generateHealth();
        case 'phobia': return getRandomItem(db.phobias);
        case 'hobby': return `${getRandomItem(db.hobbies)}\nДосвід: ${getExperienceD6()}`;
        case 'inventory': return getRandomItem(db.inventory);
        case 'info': return getRandomItem(db.additional_info);
        case 'special': return getRandomItem(db.specials);
        default: return "Невідомо";
    }
};

window.addEventListener('DOMContentLoaded', loadDatabase);