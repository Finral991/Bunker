const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 
let currentEditField = ""; 
let pendingAction = null; 

/* --- МЕНЮ ТА ПРАВИЛА --- */
function openRules() { document.getElementById('rules-modal').style.display = 'flex'; }
function closeRules() { document.getElementById('rules-modal').style.display = 'none'; }

function toggleMoreMenu() {
    const menu = document.getElementById('more-menu');
    const overlay = document.getElementById('more-menu-overlay');
    if (menu.classList.contains('open')) {
        menu.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        menu.classList.add('open');
        overlay.style.display = 'block';
    }
}

/* --- СИСТЕМА ПІДТВЕРДЖЕННЯ ДІЙ --- */
function requestResetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    if (!document.getElementById(elementId).classList.contains('revealed')) return;
    pendingAction = { type: 'random', fieldId: elementId, dbKey: dbKey };
    document.getElementById('confirm-modal').style.display = 'flex';
}

function requestSaveEditField(selectedValue) {
    pendingAction = { type: 'manual', fieldId: currentEditField, value: selectedValue };
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('confirm-modal').style.display = 'flex';
}

function requestNewDossier() {
    pendingAction = { type: 'new_dossier' };
    document.getElementById('confirm-modal').style.display = 'flex';
}

function confirmAction() {
    document.getElementById('confirm-modal').style.display = 'none';
    if (!pendingAction) return;
    if (pendingAction.type === 'random') resetField(pendingAction.fieldId, pendingAction.dbKey);
    else if (pendingAction.type === 'manual') saveEditField(pendingAction.value);
    else if (pendingAction.type === 'new_dossier') generateCharacter();
    pendingAction = null;
}
function cancelAction() {
    document.getElementById('confirm-modal').style.display = 'none';
    pendingAction = null;
}

/* --- ЛОГІКА ВКЛАДОК (M3 TABS) --- */
function switchTab(tabId, navElement) {
    if (isTypingGlobal) return;
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.m3-tab').forEach(nav => nav.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    activeTab.classList.add('active');
    navElement.classList.add('active');

    const cards = activeTab.querySelectorAll('.m3-card');
    cards.forEach(card => {
        card.classList.remove('highlight-active');
        void card.offsetWidth; 
        card.classList.add('highlight-active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- ОСНОВНА ЛОГІКА --- */
function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    if (!fName) { alert("Введіть ім'я!"); return; }
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('candidate-name').textContent = fName;
    document.getElementById('candidate-name').style.display = 'block';
    generateCharacter();
}

function generateCharacter() {
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('global-lock').style.display = 'flex';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'flex'; 

    const firstTabBtn = document.querySelector('.m3-tab');
    switchTab('tab-bio', firstTabBtn);

    const gender = getRandomItem(db.genders);
    let sp1 = getRandomItem(db.specials), sp2 = getRandomItem(db.specials);
    while (sp1 === sp2 && db.specials.length > 1) sp2 = getRandomItem(db.specials);

    const charData = {
        gender: gender, age: getRandomItem(db.ages), body: getRandomItem(db.bodies),
        profession: `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`,
        health: generateHealth(), phobia: getRandomItem(db.phobias),
        hobby: `${getRandomItem(db.hobbies)}\nРівень: ${getExperienceD6()}`,
        inventory: getRandomItem(db.inventory), info: getRandomItem(db.additional_info),
        special1: sp1, special2: sp2
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
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}

    const fields = ['gender', 'age', 'body', 'profession', 'health', 'phobia', 'hobby', 'inventory', 'info', 'special1', 'special2'];
    const promises = fields.map(id => {
        const container = document.getElementById(id);
        container.classList.add('revealed');
        return printText(container, container.dataset.value);
    });

    await Promise.all(promises); 
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}

function unlockSheetAndShowNav() {
    unlockSheet();
    document.getElementById('bottomNav').style.display = 'flex';
}

function useSpecial(fieldId) {
    if (isTypingGlobal) return;
    const container = document.getElementById(fieldId);
    if (!container.classList.contains('revealed')) return;
    container.classList.toggle('used-special');
}

/* --- ПОШУК ТА РЕДАГУВАННЯ --- */
let temporarySelectedValue = null; // Змінна для зберігання тимчасового вибору

function openEditModal(fieldId, dbKey) {
    if (isTypingGlobal || !document.getElementById(fieldId).classList.contains('revealed')) return;
    
    currentEditField = fieldId;
    temporarySelectedValue = null; // Скидаємо попередній вибір
    
    const list = document.getElementById('optionsList');
    list.innerHTML = '';
    document.getElementById('searchInput').value = ''; 
    
    // Блокуємо кнопку "Підтвердити" при відкритті
    const confirmBtn = document.getElementById('confirmEditBtn');
    if(confirmBtn) confirmBtn.disabled = true;
    
    let options = dbKey === 'health' ? [...db.health_base, ...db.health_diseases] : [...db[dbKey]]; 
    options.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    options.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option-item'; 
        el.textContent = opt;
        // ЗМІНЕНО: Тепер клік викликає функцію виділення, а не відразу збереження
        el.onclick = () => selectOptionItem(el, opt); 
        list.appendChild(el);
    });
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('searchInput').focus();
}

// Нова функція для виділення варіанту
function selectOptionItem(element, value) {
    // Знімаємо клас 'selected' з усіх елементів списку
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for(let i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
    }
    
    // Додаємо 'selected' до того, на який клікнули
    element.classList.add('selected');
    temporarySelectedValue = value; // Запам'ятовуємо вибір
    
    // Розблоковуємо кнопку "Підтвердити"
    const confirmBtn = document.getElementById('confirmEditBtn');
    if(confirmBtn) confirmBtn.disabled = false;
}

// Нова функція, яка спрацьовує по кнопці "Підтвердити"
function confirmEditSelection() {
    if (temporarySelectedValue) {
        requestSaveEditField(temporarySelectedValue); // Передаємо вибір у стандартний потік
    }
}

function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; }

function filterOptions() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = (items[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
    }
}

async function saveEditField(newValue) {
    const fieldId = pendingAction.fieldId; 
    if (fieldId === 'profession' || fieldId === 'hobby') newValue += `\nДосвід: ${getExperienceD6()}`;
    else if (fieldId === 'health' && db.health_diseases.includes(newValue)) {
        if (!newValue.toLowerCase().includes('здоров') && newValue !== "Дані відсутні") newValue += ` (ступінь: ${getRandomItem(db.health_stages)})`;
    } else if (fieldId === 'special1' || fieldId === 'special2') {
        const otherId = fieldId === 'special1' ? 'special2' : 'special1';
        if (newValue === document.getElementById(otherId).dataset.value) { alert("Ця картка вже є!"); return; }
    }

    const container = document.getElementById(fieldId);
    container.dataset.value = newValue;
    container.classList.remove('used-special'); 
    if (fieldId === 'gender') document.getElementById('profile-photo').innerHTML = newValue === "Чоловік" ? imgMale : imgFemale;

    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newValue);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}

async function resetField(elementId, dbKey) {
    const container = document.getElementById(elementId);
    container.classList.remove('used-special'); 
    let newItem = "";

    if (elementId === 'age' || elementId === 'gender' || elementId === 'body') {
        newItem = getRandomItem(db[dbKey]);
        if (elementId === 'gender') document.getElementById('profile-photo').innerHTML = newItem === "Чоловік" ? imgMale : imgFemale;
    } else if (elementId === 'profession' || elementId === 'hobby') {
        newItem = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (elementId === 'health') { newItem = generateHealth();
    } else if (elementId === 'special1' || elementId === 'special2') {
        const otherId = elementId === 'special1' ? 'special2' : 'special1';
        newItem = getRandomItem(db.specials);
        while (newItem === document.getElementById(otherId).dataset.value && db.specials.length > 1) newItem = getRandomItem(db.specials);
    } else { newItem = getRandomItem(db[dbKey]); }

    container.dataset.value = newItem;
    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newItem);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}