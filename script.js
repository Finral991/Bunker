// script.js

const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 
let currentEditField = ""; 
let currentEditDbKey = ""; 
let pendingAction = null; 
let temporarySelectedValue = null; 
let extraCardCounter = 0; 

// --- ЗМІННІ ДЛЯ АНТИЧИТУ ---
let totalChanges = 0;
let auditLog = [];

// --- МЕРЕЖЕВА ЛОГІКА (PEER.JS) ---
let peer = null;
let connections = []; 
let hostConnection = null; 
let myRole = 'offline'; 
let players = []; 

/* --- СИСТЕМА ТЕМ --- */
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bunkerTheme');
    const savedHue = localStorage.getItem('bunkerCustomHue');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'custom' && savedHue) {
            document.body.style.setProperty('--hue', savedHue);
            const slider = document.getElementById('customHueSlider');
            if(slider) slider.value = savedHue;
        }
    }
});

function openThemeModal() { document.getElementById('theme-modal').style.display = 'flex'; }
function closeThemeModal() { document.getElementById('theme-modal').style.display = 'none'; }
function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('bunkerTheme', themeName);
}
function setCustomTheme(hueValue) {
    document.body.setAttribute('data-theme', 'custom');
    document.body.style.setProperty('--hue', hueValue);
    localStorage.setItem('bunkerTheme', 'custom');
    localStorage.setItem('bunkerCustomHue', hueValue);
}

/* --- МЕНЮ ТА ПРАВИЛА --- */
function openRules() { document.getElementById('rules-modal').style.display = 'flex'; }
function closeRules() { document.getElementById('rules-modal').style.display = 'none'; }
function openMoreMenu() { document.getElementById('more-menu-modal').style.display = 'flex'; }
function closeMoreMenu() { document.getElementById('more-menu-modal').style.display = 'none'; }
function openAddCardModal() { document.getElementById('add-card-modal').style.display = 'flex'; }
function closeAddCardModal() { document.getElementById('add-card-modal').style.display = 'none'; }

/* --- ЛОГІКА АНТИЧИТУ (ЖУРНАЛ АУДИТУ) --- */
function logAction(type, label, oldVal, newVal) {
    const time = new Date().toLocaleTimeString('uk-UA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    auditLog.push({ time, type, label, oldVal, newVal });
    totalChanges++;
    const counterBadge = document.getElementById('changes-counter');
    if (counterBadge) {
        counterBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">history</span> Змін: ${totalChanges}`;
        counterBadge.style.display = 'inline-flex';
    }
}

function openAuditModal() {
    const list = document.getElementById('audit-list');
    list.innerHTML = '';
    if (auditLog.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--md-on-surface-variant); padding: 20px;">Втручань у досьє не виявлено. Гравець чистий.</div>';
    } else {
        [...auditLog].reverse().forEach(log => {
            list.innerHTML += `
                <div class="audit-item glass-panel">
                    <div class="audit-header">
                        <span>${log.time}</span>
                        <span>${log.type}</span>
                    </div>
                    <div class="audit-label">${log.label}</div>
                    ${log.oldVal ? `<div class="audit-old">${log.oldVal.replace(/\n/g, ' | ')}</div>` : ''}
                    <div class="audit-new">${log.newVal.replace(/\n/g, ' | ')}</div>
                </div>
            `;
        });
    }
    closeMoreMenu();
    document.getElementById('audit-modal').style.display = 'flex';
}
function closeAuditModal() { document.getElementById('audit-modal').style.display = 'none'; }

function getCardLabel(fieldId) {
    const card = document.getElementById('card-' + fieldId);
    if (!card) return fieldId;
    const labelEl = card.querySelector('.label');
    return labelEl ? labelEl.textContent.trim() : fieldId;
}

/* --- СТАРТОВИЙ ЕКРАН ТА ПЕРЕМИКАННЯ РЕЖИМІВ --- */
function switchStartMode(mode) {
    const tabs = document.querySelectorAll('.mode-tab');
    if(tabs.length >= 2) {
        tabs[0].classList.toggle('active', mode === 'offline');
        tabs[1].classList.toggle('active', mode === 'online');
    }
    document.getElementById('mode-offline').style.display = mode === 'offline' ? 'flex' : 'none';
    document.getElementById('mode-online').style.display = mode === 'online' ? 'flex' : 'none';
}

function returnToStart() {
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'none';
    document.getElementById('candidate-name').style.display = 'none';
    document.getElementById('candidate-id').textContent = '0000';
    document.getElementById('profile-photo').innerHTML = '';

    if(document.getElementById('firstNameInput')) document.getElementById('firstNameInput').value = '';
    if(document.getElementById('lastNameInput')) document.getElementById('lastNameInput').value = '';
    if(document.getElementById('feedbackInput')) document.getElementById('feedbackInput').value = '';
    
    document.getElementById('start-screen').style.display = 'flex';
}

/* --- ОСНОВНА ЛОГІКА СТАРТУ (ОФЛАЙН) --- */
function startGame() {
    let fName = document.getElementById('firstNameInput').value.trim();
    let lName = document.getElementById('lastNameInput').value.trim();
    
    if (!fName) {
        const randomFullName = getRandomItem(db.names);
        if (randomFullName && randomFullName !== "Дані відсутні") {
            const nameParts = randomFullName.split(' ');
            fName = nameParts[0]; 
            lName = nameParts.slice(1).join(' '); 
        } else {
            fName = "Анонім";
        }
    }
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('candidate-name').textContent = lName ? `${fName} ${lName}` : fName;
    document.getElementById('candidate-name').style.display = 'block';
    
    generateCharacter();
}

function generateCharacter() {
    totalChanges = 0;
    auditLog = [];
    const counterBadge = document.getElementById('changes-counter');
    if(counterBadge) counterBadge.style.display = 'none';

    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('global-lock').style.display = 'flex';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'flex'; 

    document.querySelectorAll('.m3-card[id*="-extra-"]').forEach(card => card.remove());
    extraCardCounter = 0;

    const firstTabBtn = document.querySelector('.m3-tab');
    if(firstTabBtn) switchTab('tab-bio', firstTabBtn);

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

/* --- АНІМАЦІЇ ТА ВІДКРИТТЯ --- */
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
        if(container) {
            container.classList.add('revealed');
            return printText(container, container.dataset.value);
        }
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
    
    if (!container.classList.contains('used-special')) {
        logAction('<span class="material-symbols-outlined icon-inline">bolt</span> Використано', getCardLabel(fieldId), '', container.dataset.value);
    }
    container.classList.toggle('used-special');
}

/* --- РЕДАГУВАННЯ ХАРАКТЕРИСТИК --- */
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
    
    let options = dbKey === 'health' ? [...db.health_diseases] : (db[dbKey] ? [...db[dbKey]] : []); 
    options.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    options.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option-item'; 
        el.textContent = opt;
        el.onclick = () => selectOptionItem(el, opt); 
        list.appendChild(el);
    });
    
    document.getElementById('edit-modal').style.display = 'flex';
}

function selectOptionItem(element, value) {
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for(let i = 0; i < items.length; i++) items[i].classList.remove('selected');
    element.classList.add('selected');
    temporarySelectedValue = value; 
    const confirmBtn = document.getElementById('confirmEditBtn');
    if(confirmBtn) confirmBtn.disabled = false;
}

function filterOptions() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = (items[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
    }
}
function confirmEditSelection() {
    if (temporarySelectedValue) requestSaveEditField(temporarySelectedValue); 
}
function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; }

async function saveEditField(newValue) {
    const fieldId = pendingAction.fieldId; 
    const dbKey = pendingAction.dbKey;
    const container = document.getElementById(fieldId);
    const oldValue = container.dataset.value; 
    
    if (dbKey === 'professions' || dbKey === 'hobbies') newValue += `\nДосвід: ${getExperienceD6()}`;
    else if (dbKey === 'health_diseases' || dbKey === 'health') {
        if (!newValue.toLowerCase().includes('здоров') && newValue !== "Дані відсутні") newValue += ` (ступінь: ${getRandomItem(db.health_stages)})`;
    } 

    logAction('<span class="material-symbols-outlined icon-inline">edit</span> Вручну', getCardLabel(fieldId), oldValue, newValue);

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
    const oldValue = container.dataset.value; 
    container.classList.remove('used-special'); 
    let newItem = "";

    if (dbKey === 'ages' || dbKey === 'genders' || dbKey === 'bodies') {
        newItem = getRandomItem(db[dbKey]);
        if (dbKey === 'genders') document.getElementById('profile-photo').innerHTML = newItem === "Чоловік" ? imgMale : imgFemale;
    } else if (dbKey === 'professions' || dbKey === 'hobbies') {
        newItem = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (dbKey === 'health' || dbKey === 'health_diseases') { 
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

    logAction('<span class="material-symbols-outlined icon-inline">casino</span> Рандом', getCardLabel(elementId), oldValue, newItem);

    container.dataset.value = newItem;
    isTypingGlobal = true;
    try { const playPromise = typingAudio.play(); if (playPromise !== undefined) await playPromise; } catch(e) {}
    await printText(container, newItem);
    typingAudio.pause(); typingAudio.currentTime = 0; isTypingGlobal = false;
}

/* --- ДОДАВАННЯ НОВОЇ ХАРАКТЕРИСТИКИ --- */
async function addNewCard(dbKey, labelText, fieldPrefix, tabId) {
    closeAddCardModal();
    if (isTypingGlobal) return;
    
    extraCardCounter++;
    const newFieldId = `${fieldPrefix}-extra-${extraCardCounter}`;
    const newCardId = `card-${newFieldId}`;
    
    let newValue = "";
    if (dbKey === 'professions' || dbKey === 'hobbies') newValue = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    else if (dbKey === 'health') newValue = generateHealth();
    else newValue = getRandomItem(db[dbKey]);

    let extraClasses = "wide-card";
    if (dbKey === 'specials') extraClasses += " special-card";

    const actionButtonsHtml = dbKey === 'specials' 
        ? `<button class="m3-icon-btn highlight" onclick="useSpecial('${newFieldId}')"><span class="material-symbols-outlined">bolt</span></button>`
        : `<button class="m3-icon-btn" onclick="openEditModal('${newFieldId}', '${dbKey}')"><span class="material-symbols-outlined">edit</span></button>
           <button class="m3-icon-btn" onclick="requestResetField('${newFieldId}', '${dbKey}')"><span class="material-symbols-outlined">shuffle</span></button>`;

    const newCardHTML = `
        <div class="m3-card glass-panel ${extraClasses}" id="${newCardId}">
            <div class="card-header">
                <span class="label">${labelText} (Дод.)</span>
                <div class="action-btns">
                    ${actionButtonsHtml}
                </div>
            </div>
            <div class="field-content revealed" id="${newFieldId}" data-value="${newValue}"></div>
        </div>
    `;
    
    const tabElement = document.getElementById(tabId);
    tabElement.insertAdjacentHTML('beforeend', newCardHTML);
    
    logAction('<span class="material-symbols-outlined icon-inline">add_circle</span> Додано', `${labelText} (Дод.)`, '', newValue);

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

/* --- ЛОГІКА ВКЛАДОК --- */
function switchTab(tabId, navElement) {
    if (isTypingGlobal) return;
    const activeTab = document.getElementById(tabId);
    const cards = activeTab.querySelectorAll('.m3-card');

    if (navElement.classList.contains('active')) {
        navElement.classList.remove('tab-bump');
        void navElement.offsetWidth; 
        navElement.classList.add('tab-bump');
        cards.forEach(card => {
            card.classList.remove('card-pop-active');
            void card.offsetWidth; 
            card.classList.add('card-pop-active');
        });
        return; 
    }

    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.m3-tab').forEach(nav => nav.classList.remove('active'));
    activeTab.classList.add('active');
    navElement.classList.add('active');

    cards.forEach(card => {
        card.classList.remove('card-pop-active');
        void card.offsetWidth; 
        card.classList.add('card-pop-active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- ЛОГІКА МУЛЬТИПЛЕЄРА (ХОСТ) --- */
function hostGame() {
    let fName = document.getElementById('firstNameInput').value.trim() || "Анонім (Хост)";
    myRole = 'host';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('lobby-title').textContent = "Ваша кімната";
    document.getElementById('lobby-status').textContent = "Генеруємо код...";
    document.getElementById('players-list').innerHTML = '';

    peer = new Peer({
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', function(id) {
        document.getElementById('lobby-status').textContent = "Очікування гравців...";
        const codeBox = document.getElementById('lobby-code-box');
        codeBox.style.display = 'inline-flex';
        codeBox.textContent = id;
        
        players = [{ id: id, name: fName }];
        updateLobbyUI();
        document.getElementById('startGameOnlineBtn').style.display = 'block';
    });

    peer.on('connection', function(conn) {
        connections.push(conn);
        
        conn.on('data', function(data) {
            if(data.type === 'join') {
                players.push({ id: conn.peer, name: data.name });
                updateLobbyUI();
                broadcastData({ type: 'players_update', players: players });
            }
        });

        conn.on('close', function() {
            players = players.filter(p => p.id !== conn.peer);
            connections = connections.filter(c => c.peer !== conn.peer);
            updateLobbyUI();
            broadcastData({ type: 'players_update', players: players });
        });
    });
}

/* --- ЛОГІКА МУЛЬТИПЛЕЄРА (КЛІЄНТ) --- */
function joinGame() {
    const hostId = document.getElementById('joinIdInput').value.trim();
    let fName = document.getElementById('firstNameInput').value.trim() || "Анонім";
    if (!hostId) return alert("Введіть код кімнати!");

    myRole = 'client';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('lobby-title').textContent = "Приєднання...";
    document.getElementById('lobby-status').textContent = "Шукаємо кімнату: " + hostId;
    document.getElementById('lobby-code-box').style.display = 'none';
    document.getElementById('startGameOnlineBtn').style.display = 'none';
    document.getElementById('players-list').innerHTML = '';

    peer = new Peer({
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', function(id) {
        hostConnection = peer.connect(hostId);

        hostConnection.on('open', function() {
            document.getElementById('lobby-status').textContent = "Успішно підключено! Очікуємо Хоста...";
            hostConnection.send({ type: 'join', name: fName });
        });

        hostConnection.on('data', function(data) {
            if (data.type === 'players_update') {
                players = data.players;
                updateLobbyUI();
            }
            if (data.type === 'game_start') {
                alert("Хост запустив гру! (Тут буде генерація)");
                // Логіка старту гри для клієнта буде тут
            }
        });
        
        hostConnection.on('close', function() {
            alert("Зв'язок із Хостом втрачено!");
            cancelOnline();
        });
    });
}

/* --- ДОПОМІЖНІ ФУНКЦІЇ ЛОБІ --- */
function updateLobbyUI() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.name + (p.id === (peer ? peer.id : null) ? " (Ти)" : "");
        li.style.marginBottom = "4px";
        list.appendChild(li);
    });
    document.getElementById('lobby-players').style.display = 'flex';
}

function broadcastData(data) {
    connections.forEach(conn => {
        if(conn.open) conn.send(data);
    });
}

function cancelOnline() {
    if (peer) { peer.destroy(); peer = null; }
    connections = []; hostConnection = null; players = [];
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}

function startOnlineGame() {
    if (players.length < 2) {
        if (!confirm("Ви єдиний гравець у лобі. Почати гру?")) return;
    }
    broadcastData({ type: 'game_start' });
    alert("Генерація даних для " + players.length + " гравців... (Далі буде)");
}