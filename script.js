const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 
let currentEditField = ""; 
let currentEditDbKey = ""; 
let pendingAction = null; 
let temporarySelectedValue = null; 
let extraCardCounter = 0; 

/* --- СИСТЕМА ТЕМ --- */
// Завантаження збереженої теми при старті
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bunkerTheme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
});

function openThemeModal() { document.getElementById('theme-modal').style.display = 'flex'; }
function closeThemeModal() { document.getElementById('theme-modal').style.display = 'none'; }

function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('bunkerTheme', themeName); // Зберігаємо вибір
    closeThemeModal();
}

/* --- МЕНЮ ТА ПРАВИЛА --- */
function openRules() { document.getElementById('rules-modal').style.display = 'flex'; }
function closeRules() { document.getElementById('rules-modal').style.display = 'none'; }

function openMoreMenu() { document.getElementById('more-menu-modal').style.display = 'flex'; }
function closeMoreMenu() { document.getElementById('more-menu-modal').style.display = 'none'; }

function openAddCardModal() { document.getElementById('add-card-modal').style.display = 'flex'; }
function closeAddCardModal() { document.getElementById('add-card-modal').style.display = 'none'; }

/* --- ДОДАВАННЯ НОВОЇ ХАРАКТЕРИСТИКИ --- */
async function addNewCard(dbKey, labelText, fieldPrefix, tabId) {
    closeAddCardModal();
    if (isTypingGlobal) return;
    
    extraCardCounter++;
    const newFieldId = `${fieldPrefix}-extra-${extraCardCounter}`;
    const newCardId = `card-${newFieldId}`;
    
    let newValue = "";
    if (dbKey === 'professions' || dbKey === 'hobbies') {
        newValue = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (dbKey === 'health') {
        newValue = generateHealth();
    } else {
        newValue = getRandomItem(db[dbKey]);
    }

    let extraClasses = "wide-card";
    if (dbKey === 'specials') extraClasses += " special-card";

    const newCardHTML = `
        <div class="m3-card glass-panel ${extraClasses}" id="${newCardId}">
            <div class="card-header">
                <span class="label">${labelText} (Дод.)</span>
                <div class="action-btns">
                    ${dbKey === 'specials' ? `<button class="m3-icon-btn highlight" onclick="useSpecial('${newFieldId}')"><span class="material-symbols-outlined">bolt</span></button>` : ''}
                    <button class="m3-icon-btn" onclick="openEditModal('${newFieldId}', '${dbKey}')"><span class="material-symbols-outlined">edit</span></button>
                    <button class="m3-icon-btn" onclick="requestResetField('${newFieldId}', '${dbKey}')"><span class="material-symbols-outlined">shuffle</span></button>
                </div>
            </div>
            <div class="field-content revealed" id="${newFieldId}" data-value="${newValue}"></div>
        </div>
    `;
    
    const tabElement = document.getElementById(tabId);
    tabElement.insertAdjacentHTML('beforeend', newCardHTML);
    
    const targetTabNavBtn = document.querySelector(`.m3-tab[onclick*="${tabId}"]`);
    if(targetTabNavBtn) switchTab(tabId, targetTabNavBtn);
    
    const container = document.getElementById(newFieldId);
    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newValue);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
    
    document.getElementById(newCardId).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* --- СИСТЕМА ПІДТВЕРДЖЕННЯ ДІЙ --- */
function requestResetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    if (!document.getElementById(elementId).classList.contains('revealed')) return;
    pendingAction = { type: 'random', fieldId: elementId, dbKey: dbKey };
    document.getElementById('confirm-modal').style.display = 'flex';
}

function requestSaveEditField(selectedValue) {
    pendingAction = { type: 'manual', fieldId: currentEditField, dbKey: currentEditDbKey, value: selectedValue };
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

    document.querySelectorAll('.m3-card[id*="-extra-"]').forEach(card => card.remove());
    extraCardCounter = 0;

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
function openEditModal(fieldId, dbKey) {
    if (isTypingGlobal || !document.getElementById(fieldId).classList.contains('revealed')) return;
    
    currentEditField = fieldId;
    currentEditDbKey = dbKey; 
    temporarySelectedValue = null; 
    
    const list = document.getElementById('optionsList');
    list.innerHTML = '';
    document.getElementById('searchInput').value = ''; 
    
    const confirmBtn = document.getElementById('confirmEditBtn');
    if(confirmBtn) confirmBtn.disabled = true;
    
    let options = dbKey === 'health' ? [...db.health_base, ...db.health_diseases] : [...db[dbKey]]; 
    options.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    options.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option-item'; 
        el.textContent = opt;
        el.onclick = () => selectOptionItem(el, opt); 
        list.appendChild(el);
    });
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('searchInput').focus();
}

function selectOptionItem(element, value) {
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for(let i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
    }
    
    element.classList.add('selected');
    temporarySelectedValue = value; 
    
    const confirmBtn = document.getElementById('confirmEditBtn');
    if(confirmBtn) confirmBtn.disabled = false;
}

function confirmEditSelection() {
    if (temporarySelectedValue) {
        requestSaveEditField(temporarySelectedValue); 
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
    const dbKey = pendingAction.dbKey;
    
    if (dbKey === 'professions' || dbKey === 'hobbies') newValue += `\nДосвід: ${getExperienceD6()}`;
    else if (dbKey === 'health' && db.health_diseases.includes(newValue)) {
        if (!newValue.toLowerCase().includes('здоров') && newValue !== "Дані відсутні") newValue += ` (ступінь: ${getRandomItem(db.health_stages)})`;
    } 

    const container = document.getElementById(fieldId);
    container.dataset.value = newValue;
    container.classList.remove('used-special'); 
    if (dbKey === 'genders') document.getElementById('profile-photo').innerHTML = newValue === "Чоловік" ? imgMale : imgFemale;

    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newValue);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}

async function resetField(elementId, dbKey) {
    const container = document.getElementById(elementId);
    container.classList.remove('used-special'); 
    let newItem = "";

    if (dbKey === 'ages' || dbKey === 'genders' || dbKey === 'bodies') {
        newItem = getRandomItem(db[dbKey]);
        if (dbKey === 'genders') document.getElementById('profile-photo').innerHTML = newItem === "Чоловік" ? imgMale : imgFemale;
    } else if (dbKey === 'professions' || dbKey === 'hobbies') {
        newItem = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (dbKey === 'health') { 
        newItem = generateHealth();
    } else if (dbKey === 'specials') {
        newItem = getRandomItem(db.specials);
        const otherId = elementId === 'special1' ? 'special2' : (elementId === 'special2' ? 'special1' : null);
        if (otherId && document.getElementById(otherId)) {
            while (newItem === document.getElementById(otherId).dataset.value && db.specials.length > 1) {
                newItem = getRandomItem(db.specials);
            }
        }
    } else { 
        newItem = getRandomItem(db[dbKey]); 
    }

    container.dataset.value = newItem;
    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newItem);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}