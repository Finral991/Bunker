// data.js

const db = {
    names: [], 
    genders: ["Чоловік", "Жінка"],
    ages: Array.from({length: 65 - 18 + 1}, (_, i) => `${i + 18} років`),
    bodies: ["1 (Худорлява)", "2 (Струнка)", "3 (Середня)", "4 (Щільна)", "5 (З надмірною вагою)"],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    professions: [],
    health_diseases: [],
    hobbies: [],
    additional_info: [],
    inventory: [],
    phobias: [],
    specials: [] 
};

// СЮДИ ВСТАВ СВОЇ СПРАВЖНІ ПОСИЛАННЯ З ТАБЛИЦІ
const sheetUrls = {
    names: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=516861620&single=true&output=csv",
    professions: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1382198780&single=true&output=csv",
    health_diseases: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=609770703&single=true&output=csv",
    hobbies: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1277297200&single=true&output=csv",
    additional_info: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1243736491&single=true&output=csv",
    inventory: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=552616764&single=true&output=csv",
    phobias: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=625829278&single=true&output=csv",
    specials: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=0&single=true&output=csv"
};

const imgMale = `<img src="man.jpg" alt="Чоловік" class="profile-photo-img">`;
const imgFemale = `<img src="woman.jpg" alt="Жінка" class="profile-photo-img">`;

async function loadDatabase() {
    try {
        const fetchPromises = Object.entries(sheetUrls).map(async ([category, url]) => {
            if (!url || url.includes("ПОСИЛАННЯ_НА_ВКЛАДКУ_")) {
                db[category] = ["Дані відсутні (немає посилання)"];
                return;
            }
            try {
                const response = await fetch(`${url}&t=${Date.now()}`);
                if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
                const csvText = await response.text();
                db[category] = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            } catch (e) {
                console.error(`Не вдалося завантажити ${category}:`, e);
                db[category] = ["Помилка завантаження"];
            }
        });

        await Promise.all(fetchPromises);
        console.log("Базу даних успішно завантажено з Google Таблиць!");
    } catch (globalError) {
        console.error("Глобальна помилка завантаження бази:", globalError);
    }
}

const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

const getExperienceD6 = () => {
    const experiences = ["Дилетант (до 1 місяця)", "Новачок (1-12 місяців)", "Любитель (1-2 роки)", "Досвідчений (2-5 років)", "Експерт (5-10 років)", "Професіонал (10+ років)"];
    return experiences[Math.floor(Math.random() * experiences.length)];
};

// Здоров'я тепер генерується лише на основі хвороб
const generateHealth = () => {
    const disease = getRandomItem(db.health_diseases);
    if (disease.toLowerCase().includes('здоров') || disease === "Дані відсутні" || disease.includes("Помилка")) return disease;
    return `${disease} (ступінь: ${getRandomItem(db.health_stages)})`;
};

window.addEventListener('DOMContentLoaded', loadDatabase);