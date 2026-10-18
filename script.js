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

let totalChanges = 0;
let auditLog = [];

const FIELD_NAMES = {
    gender: "Стать",
    age: "Вік",
    body: "Статура",
    profession: "Професія",
    health: "Здоров'я",
    phobia: "Фобія",
    hobby: "Хобі / Навички",
    inventory: "Рюкзак",
    info: "Дод. інформація",
    special1: "Стоп Бункер 1",
    special2: "Стоп Бункер 2"
};

const CORE_FIELDS = ['gender', 'age', 'body', 'profession', 'health', 'phobia', 'hobby', 'inventory', 'info'];

// --- МЕРЕЖЕВА ЛОГІКА (FIREBASE) ---
const firebaseConfig = {
    apiKey: "AIzaSyCkJ93viSMFWMuoraJcIohakdsVNBsQE9E",
    authDomain: "bunker-c9082.firebaseapp.com",
    databaseURL: "https://bunker-c9082-default-rtdb.europe-west1.firebasedatabase.app", 
    projectId: "bunker-c9082",
    storageBucket: "bunker-c9082.firebasestorage.app",
    messagingSenderId: "1069457346181",
    appId: "1:1069457346181:web:bc6ef8fe3eda8eef49a3ec"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let myRole = 'offline'; 
let myId = sessionStorage.getItem('bunkerPlayerId') || ('p_' + Math.random().toString(36).substring(2, 10));
sessionStorage.setItem('bunkerPlayerId', myId);

let currentRoomId = null; 
let roomRef = null; 
let players = []; 
let allGameData = {};
let roomState = {};
let isSheetUnlocked = false;
let lastSeenEventTimestamp = 0;

/* --- БЕЗПЕКА ТА ДОПОМІЖНІ ФУНКЦІЇ --- */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, icon = 'bolt') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span class="material-symbols-outlined" style="color: var(--md-primary);">${escapeHtml(icon)}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4200);
}

/* --- СИСТЕМА ТЕМ --- */
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bunkerTheme');
    const savedHue = localStorage.getItem('bunkerCustomHue');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'custom' && savedHue) {
            document.body.style.setProperty('--hue', savedHue);
            const slider = document.getElementById('customHueSlider');
            if (slider) slider.value = savedHue;
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
function closeTargetModal() { document.getElementById('target-modal').style.display = 'none'; }

/* --- ЛОГІКА АНТИЧИТУ ТА АУДИТУ --- */
function logAction(type, label, oldVal, newVal, isPublicEvent = false) {
    const time = new Date().toLocaleTimeString('uk-UA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = { time, type, label, oldVal: oldVal || '', newVal: newVal || '' };
    auditLog.push(entry);
    totalChanges++;
    updateChangesCounterUI();

    if (myRole !== 'offline' && roomRef) {
        roomRef.child(`gameData/${myId}/changesCount`).set(totalChanges);
        if (isPublicEvent) {
            const myName = getMyPlayerName();
            roomRef.child('events').push({
                timestamp: Date.now(),
                actor: myName,
                type: type,
                label: `${myName}: ${label}`,
                oldVal: oldVal || '',
                newVal: newVal || ''
            });
        }
    }
}

function updateChangesCounterUI() {
    const counterBadge = document.getElementById('changes-counter');
    if (counterBadge) {
        counterBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">history</span> Змін: ${totalChanges}`;
        counterBadge.style.display = totalChanges > 0 ? 'inline-flex' : 'none';
    }
}

function openAuditModal() {
    const list = document.getElementById('audit-list');
    list.innerHTML = '';
    if (auditLog.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--md-on-surface-variant); padding: 20px;">Втручань у досьє не виявлено. Гравець чистий.</div>';
    } else {
        [...auditLog].reverse().forEach(log => {
            const item = document.createElement('div');
            item.className = 'audit-item glass-panel';
            item.innerHTML = `
                <div class="audit-header">
                    <span>${escapeHtml(log.time)}</span>
                    <span>${escapeHtml(log.type)}</span>
                </div>
                <div class="audit-label">${escapeHtml(log.label)}</div>
                ${log.oldVal ? `<div class="audit-old">${escapeHtml(log.oldVal.replace(/\n/g, ' | '))}</div>` : ''}
                <div class="audit-new">${escapeHtml(log.newVal.replace(/\n/g, ' | '))}</div>
            `;
            list.appendChild(item);
        });
    }
    closeMoreMenu();
    document.getElementById('audit-modal').style.display = 'flex';
}
function closeAuditModal() { document.getElementById('audit-modal').style.display = 'none'; }

function getCardLabel(fieldId) {
    if (FIELD_NAMES[fieldId]) return FIELD_NAMES[fieldId];
    const card = document.getElementById('card-' + fieldId);
    if (!card) return fieldId;
    const labelEl = card.querySelector('.label');
    return labelEl ? labelEl.textContent.trim() : fieldId;
}

/* --- СТАРТОВИЙ ЕКРАН ТА ПЕРЕМИКАННЯ РЕЖИМІВ --- */
function switchStartMode(mode) {
    const tabs = document.querySelectorAll('.mode-tab');
    if (tabs.length >= 2) {
        tabs[0].classList.toggle('active', mode === 'offline');
        tabs[1].classList.toggle('active', mode === 'online');
    }
    document.getElementById('mode-offline').style.display = mode === 'offline' ? 'flex' : 'none';
    document.getElementById('mode-online').style.display = mode === 'online' ? 'flex' : 'none';
}

function returnToStart() {
    if (myRole !== 'offline') {
        cancelOnline();
    }
    myRole = 'offline';
    isSheetUnlocked = false;
    document.body.classList.remove('is-online');
    document.getElementById('nav-tab-players').style.display = 'none';
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'none';
    document.getElementById('candidate-name').style.display = 'none';
    document.getElementById('candidate-id').textContent = '0000';
    document.getElementById('profile-photo').innerHTML = '';
    document.getElementById('my-statuses-bar').innerHTML = '';
    document.getElementById('start-screen').style.display = 'flex';
}

/* --- ГЕНЕРАЦІЯ ДОСЬЄ --- */
function createDossierObject() {
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

/* --- ОФЛАЙН РЕЖИМ --- */
function startGame() {
    myRole = 'offline';
    document.body.classList.remove('is-online');
    document.getElementById('nav-tab-players').style.display = 'none';

    let fName = document.getElementById('firstNameInput').value.trim();
    let lName = document.getElementById('lastNameInput').value.trim();
    
    if (!fName) {
        const randomFullName = getRandomItem(db.names);
        if (randomFullName && !randomFullName.includes("недоступні")) {
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
    document.getElementById('room-status-label').textContent = "Очікує рішення...";
    
    generateCharacter();
}

function generateCharacter() {
    totalChanges = 0;
    auditLog = [];
    isSheetUnlocked = false;
    updateChangesCounterUI();

    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('global-lock').style.display = 'flex';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'flex'; 
    document.getElementById('my-statuses-bar').innerHTML = '';
    document.getElementById('baggage-shield-badge').style.display = 'none';

    document.querySelectorAll('.m3-card[id*="-extra-"]').forEach(card => card.remove());
    extraCardCounter = 0;

    const firstTabBtn = document.querySelector('.m3-tab');
    if (firstTabBtn) switchTab('tab-bio', firstTabBtn);

    const charData = createDossierObject();
    allGameData[myId] = charData;

    document.getElementById('profile-photo').innerHTML = charData.gender === "Чоловік" ? imgMale : imgFemale;
    document.getElementById('candidate-id').textContent = Math.floor(1000 + Math.random() * 9000);

    const fields = [...CORE_FIELDS, 'special1', 'special2'];
    fields.forEach(key => {
        const container = document.getElementById(key);
        if (container) {
            container.dataset.value = charData[key];
            container.classList.remove('revealed', 'used-special');
            container.textContent = ""; 
        }
    });

    document.getElementById('character-sheet').classList.remove('hidden');
}

/* --- АНІМАЦІЯ ВІДКРИТТЯ ДОСЬЄ --- */
async function printText(element, text) {
    let currentString = "";
    const str = String(text || "");
    for (let i = 0; i < str.length; i++) {
        currentString += str.charAt(i);
        element.textContent = currentString; 
        await new Promise(r => setTimeout(r, 15)); 
    }
}

async function unlockSheet() {
    if (isTypingGlobal) return;
    isTypingGlobal = true;
    isSheetUnlocked = true;
    document.getElementById('global-lock').style.display = 'none';
    try { 
        const playPromise = typingAudio.play(); 
        if (playPromise !== undefined) await playPromise; 
    } catch(e) {}

    // Анімуємо лише першу видиму вкладку для плавності, решту заповнюємо миттєво
    const bioFields = ['gender', 'age', 'body', 'profession'];
    const otherFields = ['health', 'phobia', 'hobby', 'inventory', 'info', 'special1', 'special2'];

    otherFields.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.classList.add('revealed');
            container.textContent = container.dataset.value || "";
        }
    });

    const promises = bioFields.map(id => {
        const container = document.getElementById(id);
        if (container) {
            container.classList.add('revealed');
            return printText(container, container.dataset.value || "");
        }
    });

    await Promise.all(promises); 
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}

function unlockSheetAndShowNav() {
    unlockSheet();
    document.getElementById('bottomNav').style.display = 'flex';
}

/* --- ПУБЛІЧНЕ ВІДКРИТТЯ КАРТКИ ДЛЯ СТОЛУ (ОНЛАЙН) --- */
function togglePublicReveal(fieldId) {
    if (myRole === 'offline' || !roomRef || !isSheetUnlocked) return;
    const currentState = !!(allGameData[myId]?.revealed?.[fieldId]);
    const nextState = !currentState;
    roomRef.child(`gameData/${myId}/revealed/${fieldId}`).set(nextState);

    if (nextState) {
        const label = getCardLabel(fieldId);
        const val = document.getElementById(fieldId)?.dataset.value || '';
        roomRef.child('events').push({
            timestamp: Date.now(),
            actor: getMyPlayerName(),
            type: '👁️ Відкрито картку',
            label: `${getMyPlayerName()} відкрив «${label}»`,
            oldVal: '',
            newVal: val
        });
    }
}

/* --- МЕХАНІКА КАРТОК СТОП БУНКЕР --- */
function mapCardTextToFieldKey(text) {
    const t = text.toLowerCase();
    if (t.includes("здоров")) return "health";
    if (t.includes("фобі")) return "phobia";
    if (t.includes("професі")) return "profession";
    if (t.includes("хобі")) return "hobby";
    if (t.includes("багаж") || t.includes("рюкзак")) return "inventory";
    if (t.includes("дод.інформац") || t.includes("дод. інформац")) return "info";
    if (t.includes("вік")) return "age";
    if (t.includes("стать")) return "gender";
    if (t.includes("статур")) return "body";
    return null;
}

function useSpecial(fieldId) {
    if (isTypingGlobal || !isSheetUnlocked) return;
    const container = document.getElementById(fieldId);
    if (!container || !container.classList.contains('revealed')) return;

    if (container.classList.contains('used-special')) {
        showToast("Цю картку вже використано!", "info");
        return;
    }

    if (myRole !== 'offline' && roomState.specialsLockedBy && roomState.specialsLockedBy !== myId) {
        showToast("Використання карток «Стоп Бункер» заблоковано на цьому ході!", "block");
        return;
    }

    const cardText = (container.dataset.value || "").trim();
    executeSpecialCard(fieldId, cardText);
}

function markSpecialAsUsed(fieldId, cardText) {
    const container = document.getElementById(fieldId);
    if (container) container.classList.add('used-special');

    if (myRole !== 'offline' && roomRef) {
        roomRef.child(`gameData/${myId}/usedSpecials/${fieldId}`).set(true);
        roomRef.child(`gameData/${myId}/revealed/${fieldId}`).set(true);
    }
    logAction('⚡ Стоп Бункер', getCardLabel(fieldId), '', cardText, true);
}

function getOtherPlayers() {
    return players.filter(p => p.id !== myId);
}

function getMyPlayerName() {
    const me = players.find(p => p.id === myId);
    return me ? me.name : (document.getElementById('candidate-name')?.textContent || "Гравець");
}

function promptPlayerSelection(title, subtitle, includeSelf, callback) {
    const list = document.getElementById('target-list');
    list.innerHTML = '';
    document.getElementById('target-modal-title').textContent = title;
    document.getElementById('target-modal-subtitle').textContent = subtitle;

    const candidates = includeSelf ? players : getOtherPlayers();
    if (candidates.length === 0) {
        showToast("Немає інших гравців у кімнаті для цієї дії!", "group_off");
        return;
    }

    candidates.forEach(p => {
        const el = document.createElement('div');
        el.className = 'option-item';
        el.innerHTML = `<span class="material-symbols-outlined">person</span> <span>${escapeHtml(p.name)}${p.id === myId ? ' (Ви)' : ''}</span>`;
        el.onclick = () => {
            closeTargetModal();
            callback(p);
        };
        list.appendChild(el);
    });

    document.getElementById('target-modal').style.display = 'flex';
}

function promptFieldSelection(title, subtitle, allowedFields, callback) {
    const list = document.getElementById('target-list');
    list.innerHTML = '';
    document.getElementById('target-modal-title').textContent = title;
    document.getElementById('target-modal-subtitle').textContent = subtitle;

    allowedFields.forEach(fKey => {
        const el = document.createElement('div');
        el.className = 'option-item';
        el.innerHTML = `<span class="material-symbols-outlined">style</span> <span>${escapeHtml(FIELD_NAMES[fKey] || fKey)}</span>`;
        el.onclick = () => {
            closeTargetModal();
            callback(fKey);
        };
        list.appendChild(el);
    });

    document.getElementById('target-modal').style.display = 'flex';
}

function executeSpecialCard(specialFieldId, cardText) {
    const textLower = cardText.toLowerCase();
    const targetField = mapCardTextToFieldKey(cardText);

    // Якщо офлайн — виконуємо локально для себе
    if (myRole === 'offline') {
        handleOfflineSpecial(specialFieldId, cardText, textLower, targetField);
        return;
    }

    // --- ОНЛАЙН МЕХАНІКА ВСІХ КАРТОК СТОП БУНКЕР ---

    // 1. Зміна всього Досьє всім / собі / гравцеві на вибір
    if (textLower.includes("досьє")) {
        if (textLower.includes("всім гравцям")) {
            players.forEach(p => {
                const fresh = createDossierObject();
                // Зберігаємо поточні Стоп Бункери гравців
                const cur = allGameData[p.id] || {};
                fresh.special1 = cur.special1 || fresh.special1;
                fresh.special2 = cur.special2 || fresh.special2;
                fresh.usedSpecials = cur.usedSpecials || { special1: false, special2: false };
                if (p.id === myId) fresh.usedSpecials[specialFieldId] = true;
                roomRef.child(`gameData/${p.id}`).set(fresh);
            });
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (textLower.includes("собі")) {
            const fresh = createDossierObject();
            const cur = allGameData[myId] || {};
            fresh.special1 = cur.special1;
            fresh.special2 = cur.special2;
            fresh.usedSpecials = cur.usedSpecials || {};
            fresh.usedSpecials[specialFieldId] = true;
            roomRef.child(`gameData/${myId}`).set(fresh);
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (textLower.includes("гравцеві на вибір")) {
            promptPlayerSelection("Кому змінити все Досьє?", cardText, true, (targetPlayer) => {
                const fresh = createDossierObject();
                const cur = allGameData[targetPlayer.id] || {};
                fresh.special1 = cur.special1 || fresh.special1;
                fresh.special2 = cur.special2 || fresh.special2;
                fresh.usedSpecials = cur.usedSpecials || {};
                if (targetPlayer.id === myId) fresh.usedSpecials[specialFieldId] = true;
                roomRef.child(`gameData/${targetPlayer.id}`).set(fresh);
                markSpecialAsUsed(specialFieldId, `${cardText} -> ${targetPlayer.name}`);
            });
            return;
        }
    }

    // 2. Вилікувати себе від хвороби або фобії
    if (textLower.includes("вилікувати себе")) {
        if (textLower.includes("хвороб") || textLower.includes("травм")) {
            roomRef.child(`gameData/${myId}/health`).set("Ідеально здоровий (Вилікувано)");
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (textLower.includes("фобі")) {
            roomRef.child(`gameData/${myId}/phobia`).set("Немає фобій (Вилікувано)");
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
    }

    // 3. Захистити карту Багаж від крадіжки
    if (textLower.includes("захистити карту") && textLower.includes("багаж")) {
        roomRef.child(`gameData/${myId}/baggageProtected`).set(true);
        addPlayerStatus(myId, "🛡️ Багаж захищено");
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 4. Отримати додаткову карту Хобі або Багаж
    if (textLower.includes("отримати додаткову карту")) {
        if (targetField === 'hobby') {
            addNewCard('hobbies', 'Хобі / Навички', 'hobby', 'tab-inventory');
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (targetField === 'inventory') {
            addNewCard('inventory', 'Рюкзак', 'inventory', 'tab-inventory');
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
    }

    // 5. Дії з конкретною характеристикою (Здоров'я, Фобія, Професія, Хобі, Багаж, Дод.Інфо, Вік, Стать, Статура)
    if (targetField) {
        // 5a. Змінити всім гравцям на нову з колоди
        if (textLower.includes("всім гравцям")) {
            players.forEach(p => {
                roomRef.child(`gameData/${p.id}/${targetField}`).set(generateFieldValue(targetField));
            });
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        // 5b. Змінити свою картку на нову з колоди
        if (textLower.includes("свою картку")) {
            roomRef.child(`gameData/${myId}/${targetField}`).set(generateFieldValue(targetField));
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        // 5c. Змінити картку гравцеві на вибір
        if (textLower.includes("гравцеві на вибір")) {
            promptPlayerSelection(`Кому змінити «${FIELD_NAMES[targetField]}»?`, cardText, true, (targetPlayer) => {
                roomRef.child(`gameData/${targetPlayer.id}/${targetField}`).set(generateFieldValue(targetField));
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
            return;
        }
        // 5d. Обмінятися картками із вибраним гравцем (або Вкрасти)
        if (textLower.includes("обмінятися картками")) {
            promptPlayerSelection(`З ким обмінятися карткою «${FIELD_NAMES[targetField]}»?`, cardText, false, (targetPlayer) => {
                if (targetField === 'inventory' && allGameData[targetPlayer.id]?.baggageProtected) {
                    showToast(`У гравця ${targetPlayer.name} Багаж захищено від крадіжки та обміну!`, "shield");
                    return;
                }
                const myVal = allGameData[myId]?.[targetField] || "";
                const targetVal = allGameData[targetPlayer.id]?.[targetField] || "";
                roomRef.child(`gameData/${myId}/${targetField}`).set(targetVal);
                roomRef.child(`gameData/${targetPlayer.id}/${targetField}`).set(myVal);
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
            return;
        }
        // 5e. Відкрити картку будь-якого гравця
        if (textLower.includes("відкрити картку")) {
            promptPlayerSelection(`Чию картку «${FIELD_NAMES[targetField]}» відкрити?`, cardText, false, (targetPlayer) => {
                roomRef.child(`gameData/${targetPlayer.id}/revealed/${targetField}`).set(true);
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
            return;
        }
    }

    // 6. Змусити будь-якого гравця відкрити одну приховану картку на ваш вибір
    if (textLower.includes("відкрити одну приховану картку")) {
        promptPlayerSelection("Оберіть гравця для розкриття картки", cardText, false, (targetPlayer) => {
            const pData = allGameData[targetPlayer.id] || {};
            const hiddenFields = CORE_FIELDS.filter(f => !(pData.revealed && pData.revealed[f]));
            if (hiddenFields.length === 0) {
                showToast(`У гравця ${targetPlayer.name} вже відкриті всі картки!`, "info");
                return;
            }
            promptFieldSelection(`Яку картку гравця ${targetPlayer.name} відкрити?`, "Оберіть із прихованих характеристик:", hiddenFields, (chosenField) => {
                roomRef.child(`gameData/${targetPlayer.id}/revealed/${chosenField}`).set(true);
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name}: ${FIELD_NAMES[chosenField]})`);
            });
        });
        return;
    }

    // 7. Замінити собі карту на власний розсуд
    if (textLower.includes("замінити собі карту на власний розсуд")) {
        promptFieldSelection("Яку свою картку замінити?", cardText, CORE_FIELDS, (chosenField) => {
            const dbMap = {
                gender: 'genders', age: 'ages', body: 'bodies',
                profession: 'professions', health: 'health', phobia: 'phobias',
                hobby: 'hobbies', inventory: 'inventory', info: 'additional_info'
            };
            markSpecialAsUsed(specialFieldId, `${cardText} (${FIELD_NAMES[chosenField]})`);
            openEditModal(chosenField, dbMap[chosenField]);
        });
        return;
    }

    // 8. Перероздати одну картку на вибір всім гравцям
    if (textLower.includes("перероздати одну картку на вибір всім")) {
        promptFieldSelection("Яку характеристику перероздати всім?", cardText, CORE_FIELDS, (chosenField) => {
            players.forEach(p => {
                roomRef.child(`gameData/${p.id}/${chosenField}`).set(generateFieldValue(chosenField));
            });
            markSpecialAsUsed(specialFieldId, `${cardText} (${FIELD_NAMES[chosenField]})`);
        });
        return;
    }

    // 9. Заборонити використання карток 'Стоп Бункер' на цьому ході всім гравцям
    if (textLower.includes("заборонити використання карток")) {
        roomRef.child('roomState/specialsLockedBy').set(myId);
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 10. Змусити гравця скинути свою картку 'Стоп Бункер' без використання
    if (textLower.includes("скинути свою картку")) {
        promptPlayerSelection("Хто має скинути «Стоп Бункер»?", cardText, false, (targetPlayer) => {
            promptFieldSelection(`Яку картку скинути у ${targetPlayer.name}?`, "Оберіть слот Стоп Бункера:", ['special1', 'special2'], (spSlot) => {
                roomRef.child(`gameData/${targetPlayer.id}/usedSpecials/${spSlot}`).set(true);
                roomRef.child(`gameData/${targetPlayer.id}/revealed/${spSlot}`).set(true);
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
        });
        return;
    }

    // 11. Відкрити всі свої картки добровільно, щоб отримати імунітет на одне голосування
    if (textLower.includes("відкрити всі свої картки добровільно")) {
        const revObj = {};
        CORE_FIELDS.forEach(f => revObj[f] = true);
        roomRef.child(`gameData/${myId}/revealed`).update(revObj);
        addPlayerStatus(myId, "🛡️ Імунітет (Усі картки відкрито)");
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 12. Картки голосування та статусів, що накладаються на іншого гравця
    if (
        textLower.includes("голосувати так само") ||
        textLower.includes("перенаправити всі голоси") ||
        textLower.includes("заборонити одному гравцю голосувати") ||
        textLower.includes("захистити іншого гравця від вигнання")
    ) {
        promptPlayerSelection("Оберіть гравця для дії голосування", cardText, false, (targetPlayer) => {
            if (textLower.includes("голосувати так само")) {
                addPlayerStatus(targetPlayer.id, `🗳️ Голосує як ${getMyPlayerName()}`);
            } else if (textLower.includes("перенаправити всі голоси")) {
                addPlayerStatus(myId, `🔄 Голоси перенаправлено на ${targetPlayer.name}`);
                addPlayerStatus(targetPlayer.id, `🎯 Приймає голоси замість ${getMyPlayerName()}`);
            } else if (textLower.includes("заборонити одному гравцю голосувати")) {
                addPlayerStatus(targetPlayer.id, `🚫 Без права голосу (1 хід)`);
            } else if (textLower.includes("захистити іншого гравця")) {
                addPlayerStatus(targetPlayer.id, `🛡️ Захищений від вигнання`);
                addPlayerStatus(myId, `🚫 Втратив голос на наст. хід`);
            }
            markSpecialAsUsed(specialFieldId, `${cardText} -> ${targetPlayer.name}`);
        });
        return;
    }

    // 13. Картки голосування та статусів на себе / стіл (Диктатура, Пропуск голосування, 2 голоси, Імунітет)
    if (textLower.includes("диктатур")) {
        addPlayerStatus(myId, "👑 ДИКТАТОР (Вирішує одноосібно)");
    } else if (textLower.includes("двох голосів")) {
        addPlayerStatus(myId, "🗳️×2 Подвійний голос");
    } else if (textLower.includes("пропуск голосування")) {
        addPlayerStatus(myId, "⏭️ Стіл пропускає голосування");
    } else if (textLower.includes("втрачаєте право голосу")) {
        addPlayerStatus(myId, "🛡️ Імунітет (Без голосу наст. хід)");
    } else if (textLower.includes("імунітет")) {
        addPlayerStatus(myId, "🛡️ Імунітет на голосуванні");
    }

    markSpecialAsUsed(specialFieldId, cardText);
}

function handleOfflineSpecial(specialFieldId, cardText, textLower, targetField) {
    if (textLower.includes("досьє")) {
        generateCharacter();
        showToast("Згенеровано нове досьє!", "autorenew");
        return;
    }
    if (textLower.includes("вилікувати себе")) {
        if (textLower.includes("хвороб") || textLower.includes("травм")) {
            updateLocalField('health', "Ідеально здоровий (Вилікувано)");
        } else if (textLower.includes("фобі")) {
            updateLocalField('phobia', "Немає фобій (Вилікувано)");
        }
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }
    if (textLower.includes("отримати додаткову карту")) {
        if (targetField === 'hobby') addNewCard('hobbies', 'Хобі / Навички', 'hobby', 'tab-inventory');
        if (targetField === 'inventory') addNewCard('inventory', 'Рюкзак', 'inventory', 'tab-inventory');
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }
    if (textLower.includes("замінити собі карту на власний розсуд")) {
        promptFieldSelection("Яку свою картку замінити?", cardText, CORE_FIELDS, (chosenField) => {
            const dbMap = {
                gender: 'genders', age: 'ages', body: 'bodies',
                profession: 'professions', health: 'health', phobia: 'phobias',
                hobby: 'hobbies', inventory: 'inventory', info: 'additional_info'
            };
            markSpecialAsUsed(specialFieldId, `${cardText} (${FIELD_NAMES[chosenField]})`);
            openEditModal(chosenField, dbMap[chosenField]);
        });
        return;
    }
    if (targetField && (textLower.includes("свою картку") || textLower.includes("всім гравцям"))) {
        updateLocalField(targetField, generateFieldValue(targetField));
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }
    markSpecialAsUsed(specialFieldId, cardText);
    showToast("Картку «Стоп Бункер» активовано!", "bolt");
}

function updateLocalField(fieldId, newVal) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.dataset.value = newVal;
    el.textContent = newVal;
    if (fieldId === 'gender') {
        document.getElementById('profile-photo').innerHTML = newVal === "Чоловік" ? imgMale : imgFemale;
    }
}

function addPlayerStatus(playerId, statusText) {
    if (myRole === 'offline' || !roomRef) return;
    const currentStatuses = allGameData[playerId]?.statuses || [];
    if (!currentStatuses.includes(statusText)) {
        currentStatuses.push(statusText);
        roomRef.child(`gameData/${playerId}/statuses`).set(currentStatuses);
    }
}

function clearRoomSpecialsLock() {
    if (roomRef) {
        roomRef.child('roomState/specialsLockedBy').remove();
    }
}

/* --- РЕДАГУВАННЯ ХАРАКТЕРИСТИК --- */
function openEditModal(fieldId, dbKey) {
    if (isTypingGlobal || !document.getElementById(fieldId)?.classList.contains('revealed')) return;
    currentEditField = fieldId;
    currentEditDbKey = dbKey; 
    temporarySelectedValue = null; 
    
    const list = document.getElementById('optionsList');
    list.innerHTML = '';
    document.getElementById('searchInput').value = ''; 
    const confirmBtn = document.getElementById('confirmEditBtn');
    if (confirmBtn) confirmBtn.disabled = true;
    
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
    for (let i = 0; i < items.length; i++) items[i].classList.remove('selected');
    element.classList.add('selected');
    temporarySelectedValue = value; 
    const confirmBtn = document.getElementById('confirmEditBtn');
    if (confirmBtn) confirmBtn.disabled = false;
}

function filterOptions() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const items = document.getElementById('optionsList').getElementsByClassName('option-item');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = (items[i].textContent.toLowerCase().indexOf(filter) > -1) ? "" : "none";
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
    if (!container) return;
    const oldValue = container.dataset.value; 
    
    if (dbKey === 'professions' || dbKey === 'hobbies') {
        newValue += `\nДосвід: ${getExperienceD6()}`;
    } else if (dbKey === 'health_diseases' || dbKey === 'health') {
        if (!newValue.toLowerCase().includes('здоров') && !newValue.includes("недоступні")) {
            newValue += ` (ступінь: ${getRandomItem(db.health_stages)})`;
        }
    } 

    logAction('✏️ Вручну', getCardLabel(fieldId), oldValue, newValue, true);

    container.dataset.value = newValue;
    container.classList.remove('used-special'); 
    if (dbKey === 'genders') {
        document.getElementById('profile-photo').innerHTML = newValue === "Чоловік" ? imgMale : imgFemale;
    }

    if (myRole !== 'offline' && roomRef) {
        if (fieldId.includes('-extra-')) {
            roomRef.child(`gameData/${myId}/extraCards/${fieldId}/value`).set(newValue);
        } else {
            roomRef.child(`gameData/${myId}/${fieldId}`).set(newValue);
        }
    }

    await printText(container, newValue);
}

async function resetField(elementId, dbKey) {
    const container = document.getElementById(elementId);
    if (!container) return;
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
        if (myRole !== 'offline' && roomRef) {
            roomRef.child(`gameData/${myId}/usedSpecials/${elementId}`).set(false);
        }
    } else { 
        newItem = getRandomItem(db[dbKey]); 
    }

    logAction('🎲 Рандом', getCardLabel(elementId), oldValue, newItem, true);

    container.dataset.value = newItem;
    if (myRole !== 'offline' && roomRef) {
        if (elementId.includes('-extra-')) {
            roomRef.child(`gameData/${myId}/extraCards/${elementId}/value`).set(newItem);
        } else {
            roomRef.child(`gameData/${myId}/${elementId}`).set(newItem);
        }
    }

    await printText(container, newItem);
}

/* --- ДОДАВАННЯ НОВОЇ ХАРАКТЕРИСТИКИ --- */
async function addNewCard(dbKey, labelText, fieldPrefix, tabId) {
    closeAddCardModal();
    if (isTypingGlobal) return;
    
    extraCardCounter++;
    const newFieldId = `${fieldPrefix}-extra-${extraCardCounter}`;
    
    let newValue = "";
    if (dbKey === 'professions' || dbKey === 'hobbies') newValue = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    else if (dbKey === 'health') newValue = generateHealth();
    else newValue = getRandomItem(db[dbKey]);

    renderExtraCardDOM(newFieldId, dbKey, `${labelText} (Дод.)`, newValue, tabId, false);
    
    logAction('➕ Додано', `${labelText} (Дод.)`, '', newValue, true);

    if (myRole !== 'offline' && roomRef) {
        roomRef.child(`gameData/${myId}/extraCards/${newFieldId}`).set({
            dbKey,
            label: `${labelText} (Дод.)`,
            value: newValue,
            tabId,
            revealed: false
        });
    }

    const targetTabNavBtn = document.querySelector(`.m3-tab[onclick*="${tabId}"]`);
    if (targetTabNavBtn) switchTab(tabId, targetTabNavBtn);
    
    const container = document.getElementById(newFieldId);
    if (container) await printText(container, newValue);
}

function renderExtraCardDOM(newFieldId, dbKey, fullLabel, value, tabId, isPubliclyRevealed) {
    const newCardId = `card-${newFieldId}`;
    if (document.getElementById(newCardId)) return;

    let extraClasses = "wide-card";
    if (dbKey === 'specials') extraClasses += " special-card";
    if (isPubliclyRevealed) extraClasses += " publicly-revealed";

    const card = document.createElement('div');
    card.className = `m3-card glass-panel ${extraClasses}`;
    card.id = newCardId;

    const actionButtonsHtml = dbKey === 'specials' 
        ? `<button class="m3-icon-btn highlight" onclick="useSpecial('${escapeHtml(newFieldId)}')"><span class="material-symbols-outlined">bolt</span></button>`
        : `<button class="m3-icon-btn online-reveal-btn ${isPubliclyRevealed ? 'is-public' : ''}" id="reveal-btn-${escapeHtml(newFieldId)}" onclick="toggleExtraCardReveal('${escapeHtml(newFieldId)}')" title="Відкрити для всіх"><span class="material-symbols-outlined">visibility</span></button>
           <button class="m3-icon-btn" onclick="openEditModal('${escapeHtml(newFieldId)}', '${escapeHtml(dbKey)}')"><span class="material-symbols-outlined">edit</span></button>
           <button class="m3-icon-btn" onclick="requestResetField('${escapeHtml(newFieldId)}', '${escapeHtml(dbKey)}')"><span class="material-symbols-outlined">shuffle</span></button>`;

    card.innerHTML = `
        <div class="card-header">
            <span class="label">${escapeHtml(fullLabel)}</span>
            <div class="action-btns">${actionButtonsHtml}</div>
        </div>
        <div class="field-content revealed" id="${escapeHtml(newFieldId)}"></div>
    `;

    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.appendChild(card);
        const contentEl = document.getElementById(newFieldId);
        if (contentEl) {
            contentEl.dataset.value = value;
            contentEl.textContent = value;
        }
    }
}

function toggleExtraCardReveal(extraFieldId) {
    if (myRole === 'offline' || !roomRef) return;
    const cur = !!(allGameData[myId]?.extraCards?.[extraFieldId]?.revealed);
    roomRef.child(`gameData/${myId}/extraCards/${extraFieldId}/revealed`).set(!cur);
}

/* --- СИСТЕМА ПІДТВЕРДЖЕННЯ ДІЙ --- */
function requestResetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    if (!document.getElementById(elementId)?.classList.contains('revealed')) return;
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
    else if (pendingAction.type === 'new_dossier') {
        if (myRole !== 'offline' && roomRef) {
            const fresh = createDossierObject();
            roomRef.child(`gameData/${myId}`).set(fresh);
            logAction('🔄 Нове досьє', 'Повна перегенерація', '', 'Новий персонаж', true);
        } else {
            generateCharacter();
        }
    }
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
    if (!activeTab) return;
    const cards = activeTab.querySelectorAll('.m3-card');

    if (navElement && navElement.classList.contains('active')) {
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
    if (navElement) navElement.classList.add('active');

    cards.forEach(card => {
        card.classList.remove('card-pop-active');
        void card.offsetWidth; 
        card.classList.add('card-pop-active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- МУЛЬТИПЛЕЄР FIREBASE (ХОСТ ТА КЛІЄНТ) --- */
function getFormattedInputName(defaultFallback) {
    const fName = document.getElementById('firstNameInput')?.value.trim() || "";
    const lName = document.getElementById('lastNameInput')?.value.trim() || "";
    const full = `${fName} ${lName}`.trim();
    return full || defaultFallback;
}

function hostGame() {
    const playerName = getFormattedInputName("Хост");
    myRole = 'host';
    currentRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('lobby-title').textContent = "Код вашої кімнати";
    document.getElementById('lobby-status').textContent = "Очікування приєднання гравців...";
    
    const codeBox = document.getElementById('lobby-code-box');
    codeBox.style.display = 'inline-flex';
    codeBox.textContent = currentRoomId;

    const startOnlineBtn = document.getElementById('startGameOnlineBtn');
    startOnlineBtn.style.display = 'block';
    startOnlineBtn.disabled = false;
    startOnlineBtn.textContent = "Почати гру";

    roomRef = database.ref('rooms/' + currentRoomId);
    roomRef.set({
        createdAt: Date.now(),
        status: 'waiting',
        players: {
            [myId]: { name: playerName, isHost: true }
        }
    });

    // Поки гра в лобі — якщо хост закриє вкладку, кімната прибереться
    roomRef.onDisconnect().remove();

    attachRoomListeners();
}

function joinGame() {
    const hostId = document.getElementById('joinIdInput').value.trim();
    const playerName = getFormattedInputName("Гравець");
    if (!hostId) {
        showToast("Введіть 4-значний код кімнати!", "warning");
        return;
    }

    myRole = 'client';
    currentRoomId = hostId;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('lobby-title').textContent = `Кімната #${currentRoomId}`;
    document.getElementById('lobby-status').textContent = "Підключення до сервера...";
    document.getElementById('lobby-code-box').style.display = 'none';
    document.getElementById('startGameOnlineBtn').style.display = 'none';

    roomRef = database.ref('rooms/' + currentRoomId);
    
    roomRef.child('players').once('value', (snapshot) => {
        if (snapshot.exists()) {
            document.getElementById('lobby-status').textContent = "Підключено! Очікуємо старту від Хоста...";
            const myPlayerRef = roomRef.child('players/' + myId);
            myPlayerRef.set({ name: playerName, isHost: false });
            myPlayerRef.onDisconnect().remove();
            
            attachRoomListeners();
        } else {
            showToast("Кімнату не знайдено! Перевірте код.", "error");
            cancelOnline();
        }
    });
}

function attachRoomListeners() {
    if (!roomRef) return;
    lastSeenEventTimestamp = Date.now();

    roomRef.child('players').on('value', (snapshot) => {
        players = [];
        snapshot.forEach((childSnap) => {
            const p = childSnap.val();
            p.id = childSnap.key;
            players.push(p);
        });
        updateLobbyUI();
        renderPlayersBoard();
    });

    roomRef.child('status').on('value', (snapshot) => {
        if (snapshot.val() === 'started') {
            // Скасовуємо автовидалення кімнати при згортанні браузера на телефоні!
            if (myRole === 'host') {
                roomRef.onDisconnect().cancel();
            }
            enterOnlineGameScreen();
        }
    });

    roomRef.child('gameData').on('value', (snapshot) => {
        if (!snapshot.exists()) return;
        allGameData = snapshot.val() || {};
        if (allGameData[myId]) {
            syncMyCharacterUI(allGameData[myId]);
        }
        renderPlayersBoard();
    });

    roomRef.child('roomState').on('value', (snapshot) => {
        roomState = snapshot.val() || {};
        const banner = document.getElementById('specials-lock-banner');
        if (banner) {
            banner.style.display = roomState.specialsLockedBy ? 'flex' : 'none';
        }
    });

    roomRef.child('events').limitToLast(1).on('child_added', (snapshot) => {
        const ev = snapshot.val();
        if (!ev) return;
        const time = new Date(ev.timestamp || Date.now()).toLocaleTimeString('uk-UA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        auditLog.push({
            time,
            type: ev.type || 'Подія',
            label: ev.label || '',
            oldVal: ev.oldVal || '',
            newVal: ev.newVal || ''
        });
        if (ev.timestamp > lastSeenEventTimestamp && ev.actor !== getMyPlayerName()) {
            showToast(`${ev.label}: ${ev.newVal}`, "notifications_active");
        }
    });
}

function startOnlineGame() {
    if (players.length < 2) {
        if (!confirm("Ви єдиний гравець у кімнаті. Почати тестування наодинці?")) return;
    }
    
    const btn = document.getElementById('startGameOnlineBtn');
    btn.disabled = true;
    btn.textContent = "Генерація досьє...";

    const initialGameData = {};
    players.forEach(p => {
        initialGameData[p.id] = createDossierObject();
    });

    roomRef.child('gameData').set(initialGameData).then(() => {
        roomRef.child('status').set('started');
    });
}

function enterOnlineGameScreen() {
    if (!document.getElementById('character-sheet').classList.contains('hidden')) return;

    totalChanges = 0;
    auditLog = [];
    isSheetUnlocked = false;
    updateChangesCounterUI();

    document.body.classList.add('is-online');
    document.getElementById('nav-tab-players').style.display = 'flex';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('global-lock').style.display = 'flex';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'flex';
    document.getElementById('room-status-label').textContent = `КІМНАТА #${currentRoomId}`;

    document.querySelectorAll('.m3-card[id*="-extra-"]').forEach(card => card.remove());
    extraCardCounter = 0;

    const firstTabBtn = document.querySelector('.m3-tab');
    if (firstTabBtn) switchTab('tab-bio', firstTabBtn);

    const myPlayer = players.find(p => p.id === myId);
    if (myPlayer) {
        document.getElementById('candidate-name').textContent = myPlayer.name;
        document.getElementById('candidate-name').style.display = 'block';
    }
    document.getElementById('candidate-id').textContent = currentRoomId;

    if (allGameData[myId]) {
        syncMyCharacterUI(allGameData[myId]);
    }

    document.getElementById('character-sheet').classList.remove('hidden');
}

function syncMyCharacterUI(myData) {
    document.getElementById('profile-photo').innerHTML = myData.gender === "Чоловік" ? imgMale : imgFemale;

    // Статуси гравця під ім'ям
    const statusesBar = document.getElementById('my-statuses-bar');
    if (statusesBar) {
        statusesBar.innerHTML = '';
        (myData.statuses || []).forEach(st => {
            const chip = document.createElement('span');
            chip.className = 'status-chip';
            chip.textContent = st;
            statusesBar.appendChild(chip);
        });
    }

    // Бейдж захисту багажу
    const shieldBadge = document.getElementById('baggage-shield-badge');
    if (shieldBadge) {
        shieldBadge.style.display = myData.baggageProtected ? 'inline-block' : 'none';
    }

    const allFields = [...CORE_FIELDS, 'special1', 'special2'];
    allFields.forEach(key => {
        const container = document.getElementById(key);
        if (!container) return;
        const newVal = myData[key] || "";
        const oldVal = container.dataset.value || "";

        container.dataset.value = newVal;
        if (isSheetUnlocked) {
            container.classList.add('revealed');
            if (oldVal !== newVal) {
                container.textContent = newVal;
            }
        }

        // Публічне відкриття картки (іконка ока)
        const isPublic = !!(myData.revealed && myData.revealed[key]);
        const revealBtn = document.getElementById(`reveal-btn-${key}`);
        const cardEl = document.getElementById(`card-${key}`);
        if (revealBtn) revealBtn.classList.toggle('is-public', isPublic);
        if (cardEl) cardEl.classList.toggle('publicly-revealed', isPublic);
    });

    // Використані Стоп Бункери
    ['special1', 'special2'].forEach(spKey => {
        const container = document.getElementById(spKey);
        if (!container) return;
        const isUsed = !!(myData.usedSpecials && myData.usedSpecials[spKey]);
        container.classList.toggle('used-special', isUsed);
    });

    // Додаткові картки
    if (myData.extraCards) {
        Object.entries(myData.extraCards).forEach(([extraId, extraObj]) => {
            renderExtraCardDOM(extraId, extraObj.dbKey, extraObj.label, extraObj.value, extraObj.tabId, !!extraObj.revealed);
            const cEl = document.getElementById(extraId);
            if (cEl && cEl.dataset.value !== extraObj.value) {
                cEl.dataset.value = extraObj.value;
                cEl.textContent = extraObj.value;
            }
            const revBtn = document.getElementById(`reveal-btn-${extraId}`);
            const cardBox = document.getElementById(`card-${extraId}`);
            if (revBtn) revBtn.classList.toggle('is-public', !!extraObj.revealed);
            if (cardBox) cardBox.classList.toggle('publicly-revealed', !!extraObj.revealed);
        });
    }
}

/* --- РЕНДЕР ВКЛАДКИ «СТІЛ» (ВСІ ГРАВЦІ ТА ЇХНІ ВІДКРИТІ КАРТКИ) --- */
function renderPlayersBoard() {
    const board = document.getElementById('players-board-container');
    if (!board || myRole === 'offline') return;
    board.innerHTML = '';

    players.forEach(p => {
        const pData = allGameData[p.id] || {};
        const revealedMap = pData.revealed || {};
        const statuses = pData.statuses || [];
        const changes = pData.changesCount || 0;

        const card = document.createElement('div');
        card.className = 'm3-card glass-panel player-board-card';

        let statusesHtml = statuses.map(s => `<span class="status-chip">${escapeHtml(s)}</span>`).join('');
        if (pData.baggageProtected) {
            statusesHtml += `<span class="status-chip">🛡️ Багаж захищено</span>`;
        }

        let traitsHtml = '';
        CORE_FIELDS.forEach(fKey => {
            const isOpen = !!revealedMap[fKey];
            const val = isOpen ? (pData[fKey] || "—") : "Приховано";
            traitsHtml += `
                <div class="player-trait-box ${isOpen ? 'is-open' : ''}">
                    <div class="player-trait-title">${escapeHtml(FIELD_NAMES[fKey])}</div>
                    <div class="player-trait-val ${isOpen ? '' : 'secret'}">${escapeHtml(val)}</div>
                </div>
            `;
        });

        // Додаткові картки гравця
        if (pData.extraCards) {
            Object.values(pData.extraCards).forEach(ext => {
                const isOpen = !!ext.revealed;
                const val = isOpen ? ext.value : "Приховано";
                traitsHtml += `
                    <div class="player-trait-box ${isOpen ? 'is-open' : ''}">
                        <div class="player-trait-title">${escapeHtml(ext.label)}</div>
                        <div class="player-trait-val ${isOpen ? '' : 'secret'}">${escapeHtml(val)}</div>
                    </div>
                `;
            });
        }

        // Використані Стоп Бункери
        ['special1', 'special2'].forEach((spKey, idx) => {
            const isUsed = !!(pData.usedSpecials && pData.usedSpecials[spKey]);
            if (isUsed || revealedMap[spKey]) {
                traitsHtml += `
                    <div class="player-trait-box is-open" style="grid-column: 1 / -1; border-color: var(--md-error);">
                        <div class="player-trait-title">⚡ Стоп Бункер ${idx + 1} (Активовано)</div>
                        <div class="player-trait-val">${escapeHtml(pData[spKey] || '')}</div>
                    </div>
                `;
            }
        });

        card.innerHTML = `
            <div class="player-board-header">
                <div class="player-board-name">
                    <span class="material-symbols-outlined">${p.isHost ? 'military_tech' : 'person'}</span>
                    <span>${escapeHtml(p.name)} ${p.id === myId ? '(Ви)' : ''}</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${changes > 0 ? `<span class="changes-badge" style="padding: 2px 8px; font-size: 11px;">Змін: ${changes}</span>` : ''}
                </div>
            </div>
            ${statusesHtml ? `<div class="statuses-bar" style="margin-top: 0;">${statusesHtml}</div>` : ''}
            <div class="player-traits-grid">${traitsHtml}</div>
        `;

        board.appendChild(card);
    });
}

/* --- ДОПОМІЖНІ ФУНКЦІЇ ЛОБІ --- */
function updateLobbyUI() {
    const list = document.getElementById('players-list');
    if (!list) return;
    list.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.name + (p.id === myId ? " (Ви)" : "") + (p.isHost ? " 👑" : "");
        li.style.marginBottom = "4px";
        list.appendChild(li);
    });
    document.getElementById('lobby-players').style.display = 'flex';
}

function cancelOnline() {
    if (roomRef) {
        roomRef.child('players').off();
        roomRef.child('status').off();
        roomRef.child('gameData').off();
        roomRef.child('roomState').off();
        roomRef.child('events').off();

        if (myRole === 'host' && document.getElementById('character-sheet').classList.contains('hidden')) {
            roomRef.remove();
        } else {
            roomRef.child('players/' + myId).remove();
        }
    }
    currentRoomId = null;
    roomRef = null;
    players = [];
    allGameData = {};
    myRole = 'offline';
    document.body.classList.remove('is-online');
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}