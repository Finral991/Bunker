// data.js

const db = {
    names: [], 
    genders: ["Чоловік", "Жінка"], // Залишаємо локально, бо тут всього 2 варіанти
    ages: Array.from({length: 65 - 18 + 1}, (_, i) => `${i + 18} років`), // Генерується автоматично
    bodies: ["1 (Худорлява)", "2 (Струнка)", "3 (Середня)", "4 (Щільна)", "5 (З надмірною вагою)"],
    health_base: [],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    professions: [],
    health_diseases: [],
    hobbies: [],
    additional_info: [],
    inventory: [],
    phobias: [],
    specials: [] 
};

// СЮДИ ВСТАВ СВОЇ ПОСИЛАННЯ З ТАБЛИЦІ (ТІЛЬКИ ТІ, ЩО ЗАКІНЧУЮТЬСЯ НА csv)
const sheetUrls = {
    names: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=516861620&single=true&output=csv",
    health_base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQokwvg24mYfy4WHDvvF7oNWP6vJFTFCJp6jsxk2EgrG1rjykneazGmqSo4cvdKsk51k9EUGxkvZb/pub?gid=1848535898&single=true&output=csv",
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

// ОНОВЛЕНА ФУНКЦІЯ ЗАВАНТАЖЕННЯ
async function loadDatabase() {
    try {
        const fetchPromises = Object.entries(sheetUrls).map(async ([category, url]) => {
            if (!url || url === "ПОСИЛАННЯ_НА_ВКЛАДКУ_" + category.toUpperCase()) {
                db[category] = ["Дані відсутні (немає посилання)"];
                return;
            }
            
            try {
                // Додаємо випадковий параметр ?t=..., щоб браузер завжди тягнув свіжі дані, а не кеш
                const response = await fetch(`${url}&t=${Date.now()}`);
                if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
                
                const csvText = await response.text();
                
                // Розбиваємо CSV на масив
                db[category] = csvText.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                    
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

// ... (решта функцій getRandomItem, getExperienceD6, generateHealth залишаються без змін)

window.addEventListener('DOMContentLoaded', loadDatabase);