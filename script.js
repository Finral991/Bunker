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

/* --- ФУНКЦІЯ ПЛАВНОГО СКРОЛУ ТА ПІДСВІЧУВАННЯ --- */
function scrollToCard(cardId) {
    const el = document.getElementById(cardId);
    if (el) {
        // М'яко прокручуємо до картки, вирівнюючи її по центру екрана
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Спочатку знімаємо підсвічування з усіх інших карток
        document.querySelectorAll('.trait-card').forEach(card => {
            card.classList.remove('highlight-active');
        });

        // Додаємо клас анімації для вибраної картки
        el.classList.add('highlight-active');

        // Прибираємо клас після завершення анімації (щоб можна було підсвітити її знову)
        setTimeout(() => {
            el.classList.remove('highlight-active');
        }, 1200);
    }
}

async function loadDatabase() {
    const categories = ['health_base', 'professions', 'health_diseases', 'hobbies', 'additional_info', 'inventory', 'phobias', 'specials'];
    
    try {
        const fetchPromises = categories.map(cat => 
            fetch(`${cat}.txt?v=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error(`Файл ${cat}.txt не знайдено`);
                return response.text();
            })
            .then(text => {
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

window.addEventListener('DOMContentLoaded', loadDatabase);

const imgMale = `<img src="man.jpg" alt="Чоловік" class="profile-photo-img">`;
const imgFemale = `<img src="woman.jpg" alt="Жінка" class="profile-photo-img">`;

const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 
let currentEditField = ""; 

const getRandomItem = (array) => {
    if (!array || array.length === 0) return "Дані відсутні";
    return array[Math.floor(Math.random() * array.length)];
};

const getExperienceD6 = () => {
    const experiences = [
        "Дилетант (до 1 місяця)", "Новачок (від 1 до 12 місяців)", 
        "Любитель (від 1 до 2 років)", "Досвідчений (від 2 до 5 років)", 
        "Експерт (від 5 до 10 років)", "Професіонал (понад 10 років)"
    ];
    return experiences[Math.floor(Math.random() * experiences.length)];
};

const generateHealth = () => {
    if (Math.random() > 0.4) {
        return getRandomItem(db.health_base);
    } else {
        const disease = getRandomItem(db.health_diseases);
        if (disease.toLowerCase().includes('здоров') || disease === "Дані відсутні") return disease;
        return `${disease} (ступінь: ${getRandomItem(db.health_stages)})`;
    }
};

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
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('global-lock').style.display = 'flex';

    const gender = getRandomItem(db.genders);

    let sp1 = getRandomItem(db.specials);
    let sp2 = getRandomItem(db.specials);
    while (sp1 === sp2 && db.specials.length > 1) {
        sp2 = getRandomItem(db.specials);
    }

    const charData = {
        gender: gender,
        age: getRandomItem(db.ages),
        body: getRandomItem(db.bodies),
        profession: `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`,
        health: generateHealth(),
        phobia: getRandomItem(db.phobias),
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
            container.classList.remove('used-special');
            container.textContent = ""; 
        }
    }
    
    document.getElementById('character-sheet').classList.remove('hidden');
}

async function printText(element, text) {
    let currentString = "";
    for (let i = 0; i < text.length; i++) {
        currentString += text.charAt(i);
        element.textContent = currentString; 
        await new Promise(r => setTimeout(r, 20)); 
    }
}

async function unlockSheet() {
    if (isTypingGlobal) return;
    isTypingGlobal = true;
    
    document.getElementById('global-lock').style.display = 'none';

    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {}

    const fields = ['gender', 'age', 'body', 'profession', 'health', 'phobia', 'hobby', 'inventory', 'info', 'special1', 'special2'];
    
    const promises = fields.map(id => {
        const container = document.getElementById(id);
        container.classList.add('revealed');
        return printText(container, container.dataset.value);
    });

    await Promise.all(promises); 
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}

function useSpecial(fieldId) {
    if (isTypingGlobal) return;
    const container = document.getElementById(fieldId);
    if (!container.classList.contains('revealed')) return;
    container.classList.toggle('used-special');
}

/* --- РОБОТА З МОДАЛКОЮ ПОШУКУ ТА ВИБОРУ --- */
function openEditModal(fieldId, dbKey) {
    if (isTypingGlobal) return;
    if (!document.getElementById(fieldId).classList.contains('revealed')) return;
    
    currentEditField = fieldId;
    const list = document.getElementById('optionsList');
    list.innerHTML = '';
    document.getElementById('searchInput').value = ''; 
    
    let options = [];
    if (dbKey === 'health') {
        options = [...db.health_base, ...db.health_diseases]; 
    } else {
        options = [...db[dbKey]]; 
    }

    options.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    options.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option-item';
        el.textContent = opt;
        // Коли користувач натискає на пункт, одразу застосовуємо вибір
        el.onclick = () => saveEditField(opt); 
        list.appendChild(el);
    });

    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('searchInput').focus(); // Одразу ставимо курсор у пошук
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function filterOptions() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    
    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

async function saveEditField(selectedValue) {
    let newValue = selectedValue;
    const fieldId = currentEditField;

    document.getElementById('edit-modal').style.display = 'none';

    if (fieldId === 'profession' || fieldId === 'hobby') {
        newValue += `\nДосвід: ${getExperienceD6()}`;
    } else if (fieldId === 'health' && db.health_diseases.includes(newValue)) {
        if (!newValue.toLowerCase().includes('здоров') && newValue !== "Дані відсутні") {
            newValue += ` (ступінь: ${getRandomItem(db.health_stages)})`;
        }
    } else if (fieldId === 'special1' || fieldId === 'special2') {
        const otherId = fieldId === 'special1' ? 'special2' : 'special1';
        const otherValue = document.getElementById(otherId).dataset.value;
        if (newValue === otherValue) {
            alert("Ця картка вже є в іншому слоті! Виберіть іншу.");
            return; 
        }
    }

    const container = document.getElementById(fieldId);
    container.dataset.value = newValue;
    container.classList.remove('used-special'); 
    
    if (fieldId === 'gender') {
        document.getElementById('profile-photo').innerHTML = newValue === "Чоловік" ? imgMale : imgFemale;
    }

    isTypingGlobal = true;
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {}
    
    await printText(container, newValue);
    
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}

async function resetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    const container = document.getElementById(elementId);
    if (!container.classList.contains('revealed')) return; 
    
    container.classList.remove('used-special'); 
    let newItem = "";

    if (elementId === 'age' || elementId === 'gender' || elementId === 'body') {
        newItem = getRandomItem(db[dbKey]);
        if (elementId === 'gender') {
            document.getElementById('profile-photo').innerHTML = newItem === "Чоловік" ? imgMale : imgFemale;
        }
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