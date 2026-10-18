// js/data.js
import { sheetUrls, DEFAULT_SPECIALS } from './config.js';

export const db = {
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

export async function loadDatabase() {
    try {
        const cached = sessionStorage.getItem('bunkerDbCache_v3');
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
        sessionStorage.setItem('bunkerDbCache_v3', JSON.stringify(db));
        enableStartButtons();
    } catch (e) {
        console.error("Помилка завантаження бази:", e);
        enableStartButtons();
    }
}

export const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

export const getExperienceD6 = () => {
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

export const generateHealth = () => {
    const disease = getRandomItem(db.health_diseases);
    if (disease.toLowerCase().includes('здоров') || disease.includes("недоступні") || disease === "Дані відсутні") {
        return disease;
    }
    return `${disease} (ступінь: ${getRandomItem(db.health_stages)})`;
};

export const generateFieldValue = (fieldKey) => {
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

export function createDossierObject() {
    let sp1 = getRandomItem(db.specials);
    let sp2 = getRandomItem(db.specials);
    while (sp1 === sp2 && db.specials.length > 1) sp2 = getRandomItem(db.specials);

    return {
        gender: generateFieldValue('gender'),
        age: generateFieldValue('age'),
        body: generateFieldValue('body'),
        profession: generateFieldValue('profession'),
        health: generateFieldValue('health'),
        phobia: generateFieldValue('phobia'),
        hobby: generateFieldValue('hobby'),
        inventory: generateFieldValue('inventory'),
        info: generateFieldValue('info'),
        special1: sp1,
        special2: sp2,
        usedSpecials: { special1: false, special2: false },
        revealed: {},
        extraCards: {},
        statuses: [],
        baggageProtected: false,
        changesCount: 0
    };
}