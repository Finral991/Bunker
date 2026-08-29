const db = {
    genders: ["Чоловік", "Жінка"],
    ages: Array.from({length: 65 - 18 + 1}, (_, i) => `${i + 18} років`),
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

// Зображення профілю
const imgMale = `<img src="man.jpg" alt="Чоловік" class="profile-photo-img">`;
const imgFemale = `<img src="woman.jpg" alt="Жінка" class="profile-photo-img">`;

// Завантаження бази з текстових файлів
async function loadDatabase() {
    const categories = ['health_base', 'professions', 'health_diseases', 'hobbies', 'additional_info', 'inventory', 'phobias', 'specials'];
    try {
        const fetchPromises = categories.map(cat => 
            fetch(`${cat}.txt?v=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error(`Файл ${cat}.txt не знайдено`);
                return response.text();
            })
            .then(text => { db[cat] = text.split('\n').map(line => line.trim()).filter(line => line.length > 0); })
            .catch(error => { db[cat] = ["Помилка: Файл не знайдено або пустий"]; })
        );
        await Promise.all(fetchPromises);
        console.log("Базу даних завантажено!");
    } catch (globalError) {
        console.error("Помилка:", globalError);
    }
}

// Допоміжні функції для генерації
const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

const getExperienceD6 = () => {
    const experiences = ["Дилетант (до 1 місяця)", "Новачок (1-12 місяців)", "Любитель (1-2 роки)", "Досвідчений (2-5 років)", "Експерт (5-10 років)", "Професіонал (10+ років)"];
    return experiences[Math.floor(Math.random() * experiences.length)];
};

const generateHealth = () => {
    if (Math.random() > 0.4) return getRandomItem(db.health_base);
    const disease = getRandomItem(db.health_diseases);
    if (disease.toLowerCase().includes('здоров') || disease === "Дані відсутні") return disease;
    return `${disease} (ступінь: ${getRandomItem(db.health_stages)})`;
};

window.addEventListener('DOMContentLoaded', loadDatabase);