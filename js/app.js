// js/app.js
import { firebaseConfig, FIELD_NAMES, CORE_FIELDS, imgMale, imgFemale } from './config.js';
import { db, loadDatabase, getRandomItem, getExperienceD6, generateHealth, generateFieldValue, createDossierObject } from './data.js';
import { createStaticWallpaper } from './wallpaper.js';
import { typingAudio, escapeHtml, showToast, initSavedTheme, setTheme, setCustomTheme, printText, getCardLabel } from './ui.js';

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let isTypingGlobal = false; 
let currentEditField = ""; 
let currentEditDbKey = ""; 
let pendingAction = null; 
let temporarySelectedValue = null; 
let extraCardCounter = 0; 

let totalChanges = 0;
let auditLog = [];

let myRole = 'offline'; 
let myId = sessionStorage.getItem('bunkerPlayerId') || ('p_' + Math.random().toString(36).substring(2, 10));
sessionStorage.setItem('bunkerPlayerId', myId);

let currentRoomId = null; 
let roomRef = null; 
let players = []; 
let allGameData = {};
let roomState = {};
let votingState = {};
let isSheetUnlocked = false;
let lastSeenEventTimestamp = 0;
let selectedBoardPlayerId = null;

/* --- ІНІЦІАЛІЗАЦІЯ --- */
window.addEventListener('DOMContentLoaded', () => {
    createStaticWallpaper();
    initSavedTheme();
    loadDatabase();
    syncBodyScrollLock();
});

function syncBodyScrollLock() {
    const startVisible = document.getElementById('start-screen')?.style.display !== 'none';
    const lobbyVisible = document.getElementById('lobby-screen')?.style.display !== 'none';
    const anyModalVisible = Array.from(document.querySelectorAll('.modal-overlay')).some(
        el => el.style.display === 'flex' || el.style.display === 'block'
    );
    document.body.classList.toggle('no-scroll', startVisible || lobbyVisible || anyModalVisible);
}

/* --- МОДАЛЬНІ ВІКНА --- */
function openThemeModal() { document.getElementById('theme-modal').style.display = 'flex'; syncBodyScrollLock(); }
function closeThemeModal() { document.getElementById('theme-modal').style.display = 'none'; syncBodyScrollLock(); }
function openRules() { document.getElementById('rules-modal').style.display = 'flex'; syncBodyScrollLock(); }
function closeRules() { document.getElementById('rules-modal').style.display = 'none'; syncBodyScrollLock(); }
function openMoreMenu() { document.getElementById('more-menu-modal').style.display = 'flex'; syncBodyScrollLock(); }
function closeMoreMenu() { document.getElementById('more-menu-modal').style.display = 'none'; syncBodyScrollLock(); }
function openAddCardModal() { document.getElementById('add-card-modal').style.display = 'flex'; syncBodyScrollLock(); }
function closeAddCardModal() { document.getElementById('add-card-modal').style.display = 'none'; syncBodyScrollLock(); }
function closeTargetModal() { document.getElementById('target-modal').style.display = 'none'; syncBodyScrollLock(); }
function closeAuditModal() { document.getElementById('audit-modal').style.display = 'none'; syncBodyScrollLock(); }
function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; syncBodyScrollLock(); }

/* --- АУДИТ ТА АНТИЧИТ --- */
function logAction(type, label, oldVal, newVal, isPublicEvent = false) {
    const time = new Date().toLocaleTimeString('uk-UA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    auditLog.push({ time, type, label, oldVal: oldVal || '', newVal: newVal || '' });
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
    syncBodyScrollLock();
}

/* --- СТАРТОВИЙ ЕКРАН --- */
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
    if (myRole !== 'offline') cancelOnline();
    myRole = 'offline';
    isSheetUnlocked = false;
    document.body.classList.remove('is-online');
    document.getElementById('nav-tab-players').style.display = 'none';
    document.getElementById('active-vote-alert-btn').style.display = 'none';
    document.getElementById('character-sheet').classList.add('hidden');
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('header-actions').style.display = 'none';
    document.getElementById('candidate-name').style.display = 'none';
    document.getElementById('candidate-id').textContent = '0000';
    document.getElementById('profile-photo').innerHTML = '';
    document.getElementById('my-statuses-bar').innerHTML = '';
    document.getElementById('start-screen').style.display = 'flex';
    syncBodyScrollLock();
}

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
    
    generateCharacter(false);
    syncBodyScrollLock();
}

function createDossierPreservingState(existingData, preserveRevealed = true) {
    const fresh = createDossierObject();
    if (existingData && preserveRevealed) {
        fresh.revealed = existingData.revealed ? { ...existingData.revealed } : {};
        fresh.changesCount = existingData.changesCount || 0;
        fresh.statuses = existingData.statuses ? [...existingData.statuses] : [];
        fresh.baggageProtected = !!existingData.baggageProtected;
        fresh.eliminated = !!existingData.eliminated;
        fresh.voteEffects = existingData.voteEffects ? { ...existingData.voteEffects } : {};
    }
    return fresh;
}

function generateCharacter(preserveOpenState = false) {
    if (!preserveOpenState) {
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
    }

    const prevData = allGameData[myId] || {};
    const charData = createDossierPreservingState(prevData, preserveOpenState);
    allGameData[myId] = charData;

    document.getElementById('profile-photo').innerHTML = charData.gender === "Чоловік" ? imgMale : imgFemale;
    if (!preserveOpenState) {
        document.getElementById('candidate-id').textContent = Math.floor(1000 + Math.random() * 9000);
    }

    const fields = [...CORE_FIELDS, 'special1', 'special2'];
    fields.forEach(key => {
        const container = document.getElementById(key);
        if (container) {
            container.dataset.value = charData[key];
            container.classList.remove('used-special');
            if (preserveOpenState && isSheetUnlocked) {
                container.classList.add('revealed');
                container.textContent = charData[key];
            } else {
                container.classList.remove('revealed');
                container.textContent = ""; 
            }
        }
    });

    document.getElementById('character-sheet').classList.remove('hidden');
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

/* --- НЕЗВОРОТНЕ ПУБЛІЧНЕ ВІДКРИТТЯ КАРТКИ --- */
function revealCardPublicly(fieldId) {
    if (myRole === 'offline' || !roomRef || !isSheetUnlocked) return;
    const alreadyOpen = !!(allGameData[myId]?.revealed?.[fieldId]);
    if (alreadyOpen) {
        showToast("Цю характеристику вже відкрито! Сховати назад не можна.", "lock");
        return;
    }

    roomRef.child(`gameData/${myId}/revealed/${fieldId}`).set(true);

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

function revealExtraCardPublicly(extraFieldId) {
    if (myRole === 'offline' || !roomRef) return;
    const alreadyOpen = !!(allGameData[myId]?.extraCards?.[extraFieldId]?.revealed);
    if (alreadyOpen) return;

    roomRef.child(`gameData/${myId}/extraCards/${extraFieldId}/revealed`).set(true);
}

/* --- КАРТКИ СТОП БУНКЕР --- */
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
    syncBodyScrollLock();
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
    syncBodyScrollLock();
}

function setVoteEffect(playerId, key, val) {
    if (myRole === 'offline' || !roomRef) return;
    roomRef.child(`gameData/${playerId}/voteEffects/${key}`).set(val);
}

function executeSpecialCard(specialFieldId, cardText) {
    const textLower = cardText.toLowerCase();
    const targetField = mapCardTextToFieldKey(cardText);

    if (myRole === 'offline') {
        handleOfflineSpecial(specialFieldId, cardText, textLower, targetField);
        return;
    }

    // 1. Зміна всього Досьє (ЗБЕРІГАЮЧИ ВІДКРИТІ ПОЗИЦІЇ!)
    if (textLower.includes("досьє")) {
        if (textLower.includes("всім гравцям")) {
            players.forEach(p => {
                const cur = allGameData[p.id] || {};
                const fresh = createDossierPreservingState(cur, true);
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
            const cur = allGameData[myId] || {};
            const fresh = createDossierPreservingState(cur, true);
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
                const cur = allGameData[targetPlayer.id] || {};
                const fresh = createDossierPreservingState(cur, true);
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

    // 2. Вилікувати себе
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

    // 3. Захистити карту Багаж
    if (textLower.includes("захистити карту") && textLower.includes("багаж")) {
        roomRef.child(`gameData/${myId}/baggageProtected`).set(true);
        addPlayerStatus(myId, "🛡️ Багаж захищено");
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 4. Отримати додаткову карту
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

    // 5. Дії з конкретною характеристикою
    if (targetField) {
        if (textLower.includes("всім гравцям")) {
            players.forEach(p => {
                roomRef.child(`gameData/${p.id}/${targetField}`).set(generateFieldValue(targetField));
            });
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (textLower.includes("свою картку")) {
            roomRef.child(`gameData/${myId}/${targetField}`).set(generateFieldValue(targetField));
            markSpecialAsUsed(specialFieldId, cardText);
            return;
        }
        if (textLower.includes("гравцеві на вибір")) {
            promptPlayerSelection(`Кому змінити «${FIELD_NAMES[targetField]}»?`, cardText, true, (targetPlayer) => {
                roomRef.child(`gameData/${targetPlayer.id}/${targetField}`).set(generateFieldValue(targetField));
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
            return;
        }
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
        if (textLower.includes("відкрити картку")) {
            promptPlayerSelection(`Чию картку «${FIELD_NAMES[targetField]}» відкрити?`, cardText, false, (targetPlayer) => {
                roomRef.child(`gameData/${targetPlayer.id}/revealed/${targetField}`).set(true);
                markSpecialAsUsed(specialFieldId, `${cardText} (${targetPlayer.name})`);
            });
            return;
        }
    }

    // 6. Змусити відкрити одну приховану картку
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

    // 9. Заборонити використання карток Стоп Бункер
    if (textLower.includes("заборонити використання карток")) {
        roomRef.child('roomState/specialsLockedBy').set(myId);
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 10. Скинути чужу картку Стоп Бункер
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

    // 11. Відкрити всі свої картки добровільно -> Імунітет
    if (textLower.includes("відкрити всі свої картки добровільно")) {
        const revObj = {};
        CORE_FIELDS.forEach(f => revObj[f] = true);
        roomRef.child(`gameData/${myId}/revealed`).update(revObj);
        setVoteEffect(myId, 'immune', true);
        addPlayerStatus(myId, "🛡️ Імунітет (Усі картки відкрито)");
        markSpecialAsUsed(specialFieldId, cardText);
        return;
    }

    // 12. Картки голосування на іншого гравця (інтегровані з движком голосування!)
    if (
        textLower.includes("голосувати так само") ||
        textLower.includes("перенаправити всі голоси") ||
        textLower.includes("заборонити одному гравцю голосувати") ||
        textLower.includes("захистити іншого гравця від вигнання")
    ) {
        promptPlayerSelection("Оберіть гравця для дії голосування", cardText, false, (targetPlayer) => {
            if (textLower.includes("голосувати так само")) {
                setVoteEffect(targetPlayer.id, 'forcedSameAs', myId);
                addPlayerStatus(targetPlayer.id, `🗳️ Голосує як ${getMyPlayerName()}`);
            } else if (textLower.includes("перенаправити всі голоси")) {
                setVoteEffect(myId, 'redirectTo', targetPlayer.id);
                addPlayerStatus(myId, `🔄 Голоси -> ${targetPlayer.name}`);
                addPlayerStatus(targetPlayer.id, `🎯 Приймає голоси замість ${getMyPlayerName()}`);
            } else if (textLower.includes("заборонити одному гравцю голосувати")) {
                setVoteEffect(targetPlayer.id, 'cantVoteThisRound', true);
                addPlayerStatus(targetPlayer.id, `🚫 Без права голосу (цей хід)`);
            } else if (textLower.includes("захистити іншого гравця")) {
                setVoteEffect(targetPlayer.id, 'immune', true);
                setVoteEffect(myId, 'cantVoteNextRound', true);
                addPlayerStatus(targetPlayer.id, `🛡️ Захищений від вигнання`);
                addPlayerStatus(myId, `🚫 Без голосу на наст. хід`);
            }
            markSpecialAsUsed(specialFieldId, `${cardText} -> ${targetPlayer.name}`);
        });
        return;
    }

    // 13. Статуси голосування на себе або стіл
    if (textLower.includes("диктатур")) {
        setVoteEffect(myId, 'dictator', true);
        addPlayerStatus(myId, "👑 ДИКТАТОР (Вирішує одноосібно)");
    } else if (textLower.includes("двох голосів")) {
        setVoteEffect(myId, 'doubleVote', true);
        addPlayerStatus(myId, "🗳️×2 Подвійний голос");
    } else if (textLower.includes("пропуск голосування")) {
        if (roomRef) roomRef.child('voting/active').set(false);
        addPlayerStatus(myId, "⏭️ Стіл пропускає голосування");
    } else if (textLower.includes("втрачаєте право голосу")) {
        setVoteEffect(myId, 'immune', true);
        setVoteEffect(myId, 'cantVoteNextRound', true);
        addPlayerStatus(myId, "🛡️ Імунітет (Без голосу наст. хід)");
    } else if (textLower.includes("імунітет")) {
        setVoteEffect(myId, 'immune', true);
        addPlayerStatus(myId, "🛡️ Імунітет на голосуванні");
    }

    markSpecialAsUsed(specialFieldId, cardText);
}

function handleOfflineSpecial(specialFieldId, cardText, textLower, targetField) {
    if (textLower.includes("досьє")) {
        generateCharacter(true);
        markSpecialAsUsed(specialFieldId, cardText);
        showToast("Досьє оновлено зі збереженням відкритих карток!", "autorenew");
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
    if (roomRef) roomRef.child('roomState/specialsLockedBy').remove();
}

/* --- СИСТЕМА ГОЛОСУВАННЯ --- */
function goToVotingTab() {
    const navBtn = document.getElementById('nav-tab-players');
    if (navBtn) switchTab('tab-players', navBtn);
}

function startVotingSession() {
    if (!roomRef || myRole !== 'host') return;
    const nextRound = (votingState.round || 0) + 1;
    roomRef.child('voting').set({
        active: true,
        round: nextRound,
        votes: {},
        lastResultText: ""
    });
    roomRef.child('events').push({
        timestamp: Date.now(),
        actor: getMyPlayerName(),
        type: '🗳️ Голосування',
        label: `Розпочато раунд голосування #${nextRound}`,
        oldVal: '',
        newVal: 'Перейдіть у вкладку «Стіл», щоб віддати голос'
    });
}

function cancelVotingSession() {
    if (!roomRef || myRole !== 'host') return;
    roomRef.child('voting/active').set(false);
}

function castVote(targetPlayerId) {
    if (!roomRef || !votingState.active) return;
    const myData = allGameData[myId] || {};
    if (myData.eliminated) {
        showToast("Вигнані гравці не можуть голосувати!", "block");
        return;
    }
    if (myData.voteEffects?.cantVoteThisRound) {
        showToast("Ви позбавлені права голосу на цьому раунді!", "block");
        return;
    }
    if (myData.voteEffects?.forcedSameAs) {
        const masterId = myData.voteEffects.forcedSameAs;
        const masterName = players.find(p => p.id === masterId)?.name || "іншим гравцем";
        showToast(`Ваш голос автоматично закріплений за ${masterName}!`, "lock");
        return;
    }
    const targetData = allGameData[targetPlayerId] || {};
    if (targetData.voteEffects?.immune) {
        showToast("Цей гравець має імунітет на поточному голосуванні!", "shield");
        return;
    }

    roomRef.child(`voting/votes/${myId}`).set(targetPlayerId);

    // Якщо хтось прив'язаний голосувати так само, як ми — автоматично дублюємо його голос!
    players.forEach(p => {
        const pEffects = allGameData[p.id]?.voteEffects || {};
        if (pEffects.forcedSameAs === myId && !allGameData[p.id]?.eliminated) {
            roomRef.child(`voting/votes/${p.id}`).set(targetPlayerId);
        }
    });
}

function computeTallies() {
    const rawVotes = votingState.votes || {};
    const tallies = {}; // candidateId -> { count, voters: [] }
    players.forEach(p => {
        tallies[p.id] = { count: 0, voters: [] };
    });

    Object.entries(rawVotes).forEach(([voterId, chosenTargetId]) => {
        const voterPlayer = players.find(p => p.id === voterId);
        const voterData = allGameData[voterId] || {};
        if (!voterPlayer || voterData.eliminated || voterData.voteEffects?.cantVoteThisRound) return;

        // Перевіряємо, чи має ціль перенаправлення голосів (redirectTo)
        let finalTargetId = chosenTargetId;
        const chosenTargetData = allGameData[chosenTargetId] || {};
        if (chosenTargetData.voteEffects?.redirectTo) {
            finalTargetId = chosenTargetData.voteEffects.redirectTo;
        }

        if (!tallies[finalTargetId]) {
            tallies[finalTargetId] = { count: 0, voters: [] };
        }

        let weight = 1;
        if (voterData.voteEffects?.dictator) weight = 100;
        else if (voterData.voteEffects?.doubleVote) weight = 2;

        tallies[finalTargetId].count += weight;
        const suffix = weight === 100 ? ' (👑)' : (weight === 2 ? ' (×2)' : '');
        const redirectNote = finalTargetId !== chosenTargetId ? ' 🔄' : '';
        tallies[finalTargetId].voters.push(`${voterPlayer.name}${suffix}${redirectNote}`);
    });

    return tallies;
}

function finalizeVoting() {
    if (!roomRef || myRole !== 'host') return;
    const tallies = computeTallies();
    let maxVotes = 0;
    let leaders = [];

    Object.entries(tallies).forEach(([candId, info]) => {
        if (allGameData[candId]?.eliminated) return;
        if (info.count > maxVotes) {
            maxVotes = info.count;
            leaders = [candId];
        } else if (info.count === maxVotes && maxVotes > 0) {
            leaders.push(candId);
        }
    });

    let resultMsg = "";
    if (maxVotes === 0) {
        resultMsg = "Жодного голосу не віддано. Нікого не вигнано.";
    } else if (leaders.length > 1) {
        const names = leaders.map(id => players.find(p => p.id === id)?.name || id).join(', ');
        resultMsg = `Нічия між: ${names} (по ${maxVotes} гол.). Проведіть переголосування!`;
    } else {
        const eliminatedId = leaders[0];
        const eliminatedName = players.find(p => p.id === eliminatedId)?.name || "Гравець";
        resultMsg = `За рішенням столу Бункер покидає: ${eliminatedName}!`;
        roomRef.child(`gameData/${eliminatedId}/eliminated`).set(true);
    }

    // Очищуємо одноразові ефекти цього раунду і переносимо cantVoteNextRound -> cantVoteThisRound
    players.forEach(p => {
        const curEffects = allGameData[p.id]?.voteEffects || {};
        const nextEffects = {};
        if (curEffects.cantVoteNextRound) {
            nextEffects.cantVoteThisRound = true;
        }
        roomRef.child(`gameData/${p.id}/voteEffects`).set(nextEffects);

        // Очищуємо тимчасові статуси голосування з бейджів, залишаючи постійні
        const curStatuses = allGameData[p.id]?.statuses || [];
        const filteredStatuses = curStatuses.filter(s => s.includes("Багаж захищено"));
        if (nextEffects.cantVoteThisRound) {
            filteredStatuses.push("🚫 Без права голосу (цей хід)");
        }
        roomRef.child(`gameData/${p.id}/statuses`).set(filteredStatuses);
    });

    roomRef.child('voting').update({
        active: false,
        lastResultText: resultMsg
    });

    roomRef.child('events').push({
        timestamp: Date.now(),
        actor: getMyPlayerName(),
        type: '⚖️ Підсумок голосування',
        label: 'Результати голосування',
        oldVal: '',
        newVal: resultMsg
    });
}

function toggleEliminatePlayer(playerId) {
    if (!roomRef || myRole !== 'host') return;
    const current = !!(allGameData[playerId]?.eliminated);
    roomRef.child(`gameData/${playerId}/eliminated`).set(!current);
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
    syncBodyScrollLock();
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

/* --- ДОДАТКОВІ КАРТКИ --- */
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
        ? `<button class="reveal-pill-btn use-special-pill" onclick="useSpecial('${escapeHtml(newFieldId)}')"><span class="material-symbols-outlined">bolt</span><span>Активувати</span></button>`
        : `<button class="reveal-pill-btn online-reveal-btn ${isPubliclyRevealed ? 'is-public' : ''}" id="reveal-btn-${escapeHtml(newFieldId)}" onclick="revealExtraCardPublicly('${escapeHtml(newFieldId)}')">
               <span class="material-symbols-outlined">${isPubliclyRevealed ? 'check_circle' : 'visibility'}</span>
               <span class="reveal-btn-text">${isPubliclyRevealed ? 'Відкрито' : 'Відкрити'}</span>
           </button>
           <button class="m3-icon-btn subtle" onclick="openEditModal('${escapeHtml(newFieldId)}', '${escapeHtml(dbKey)}')"><span class="material-symbols-outlined">edit</span></button>
           <button class="m3-icon-btn subtle" onclick="requestResetField('${escapeHtml(newFieldId)}', '${escapeHtml(dbKey)}')"><span class="material-symbols-outlined">shuffle</span></button>`;

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

/* --- ПІДТВЕРДЖЕННЯ ДІЙ --- */
function requestResetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    if (!document.getElementById(elementId)?.classList.contains('revealed')) return;
    pendingAction = { type: 'random', fieldId: elementId, dbKey: dbKey };
    document.getElementById('confirm-modal').style.display = 'flex';
    syncBodyScrollLock();
}
function requestSaveEditField(selectedValue) {
    pendingAction = { type: 'manual', fieldId: currentEditField, dbKey: currentEditDbKey, value: selectedValue };
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('confirm-modal').style.display = 'flex';
    syncBodyScrollLock();
}
function requestNewDossier() {
    pendingAction = { type: 'new_dossier' };
    document.getElementById('confirm-modal').style.display = 'flex';
    syncBodyScrollLock();
}
function confirmAction() {
    document.getElementById('confirm-modal').style.display = 'none';
    syncBodyScrollLock();
    if (!pendingAction) return;
    if (pendingAction.type === 'random') resetField(pendingAction.fieldId, pendingAction.dbKey);
    else if (pendingAction.type === 'manual') saveEditField(pendingAction.value);
    else if (pendingAction.type === 'new_dossier') {
        if (myRole !== 'offline' && roomRef) {
            const cur = allGameData[myId] || {};
            const fresh = createDossierPreservingState(cur, true);
            roomRef.child(`gameData/${myId}`).set(fresh);
            logAction('🔄 Нове досьє', 'Перегенерація (відкриті збережено)', '', 'Оновлено', true);
        } else {
            generateCharacter(false);
        }
    }
    pendingAction = null;
}
function cancelAction() {
    document.getElementById('confirm-modal').style.display = 'none';
    syncBodyScrollLock();
    pendingAction = null;
}

/* --- ПЕРЕМИКАННЯ ВКЛАДОК --- */
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

    if (tabId === 'tab-players') {
        renderPlayersBoard();
    }

    cards.forEach(card => {
        card.classList.remove('card-pop-active');
        void card.offsetWidth; 
        card.classList.add('card-pop-active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- МУЛЬТИПЛЕЄР --- */
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
    syncBodyScrollLock();

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
    syncBodyScrollLock();

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
        if (!selectedBoardPlayerId && players.length > 0) {
            selectedBoardPlayerId = players[0].id;
        }
        const navText = document.getElementById('nav-tab-players-text');
        if (navText) navText.textContent = `Стіл (${players.length})`;

        updateLobbyUI();
        renderPlayersBoard();
    });

    roomRef.child('status').on('value', (snapshot) => {
        if (snapshot.val() === 'started') {
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

    roomRef.child('voting').on('value', (snapshot) => {
        votingState = snapshot.val() || { active: false, round: 0, votes: {} };
        const alertBtn = document.getElementById('active-vote-alert-btn');
        if (alertBtn) {
            alertBtn.style.display = votingState.active ? 'inline-flex' : 'none';
        }
        renderPlayersBoard();
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
    syncBodyScrollLock();

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

function updateRevealButtonState(btnEl, cardEl, isPublic) {
    if (btnEl) {
        btnEl.classList.toggle('is-public', isPublic);
        const iconSpan = btnEl.querySelector('.material-symbols-outlined');
        const textSpan = btnEl.querySelector('.reveal-btn-text');
        if (iconSpan) iconSpan.textContent = isPublic ? 'check_circle' : 'visibility';
        if (textSpan) textSpan.textContent = isPublic ? 'Відкрито' : 'Відкрити';
    }
    if (cardEl) {
        cardEl.classList.toggle('publicly-revealed', isPublic);
    }
}

function syncMyCharacterUI(myData) {
    document.getElementById('profile-photo').innerHTML = myData.gender === "Чоловік" ? imgMale : imgFemale;

    const statusesBar = document.getElementById('my-statuses-bar');
    if (statusesBar) {
        statusesBar.innerHTML = '';
        if (myData.eliminated) {
            const elChip = document.createElement('span');
            elChip.className = 'status-chip eliminated-chip';
            elChip.textContent = '💀 ВИГНАНИЙ З БУНКЕРА';
            statusesBar.appendChild(elChip);
        }
        (myData.statuses || []).forEach(st => {
            const chip = document.createElement('span');
            chip.className = 'status-chip';
            chip.textContent = st;
            statusesBar.appendChild(chip);
        });
    }

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
            if (oldVal !== newVal || container.textContent === "") {
                container.textContent = newVal;
            }
        }

        const isPublic = !!(myData.revealed && myData.revealed[key]);
        const revealBtn = document.getElementById(`reveal-btn-${key}`);
        const cardEl = document.getElementById(`card-${key}`);
        updateRevealButtonState(revealBtn, cardEl, isPublic);
    });

    ['special1', 'special2'].forEach(spKey => {
        const container = document.getElementById(spKey);
        if (!container) return;
        const isUsed = !!(myData.usedSpecials && myData.usedSpecials[spKey]);
        container.classList.toggle('used-special', isUsed);
    });

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
            updateRevealButtonState(revBtn, cardBox, !!extraObj.revealed);
        });
    }
}

/* --- РЕНДЕР ПАНЕЛІ ГОЛОСУВАННЯ ТА СТОЛУ --- */
function renderVotingSection() {
    const wrapper = document.getElementById('voting-section-wrapper');
    if (!wrapper || myRole === 'offline') return;

    const isVotingActive = !!votingState.active;
    const roundNum = votingState.round || 1;
    const lastResult = votingState.lastResultText || "";
    const myVoteTarget = votingState.votes?.[myId] || null;
    const myData = allGameData[myId] || {};
    const tallies = computeTallies();

    const alivePlayersCount = players.filter(p => !allGameData[p.id]?.eliminated).length;
    const votedCount = Object.keys(votingState.votes || {}).length;

    let html = `<div class="m3-card glass-panel voting-panel ${isVotingActive ? 'active-voting' : ''}">`;

    // Шапка блоку голосування
    html += `
        <div class="voting-header-row">
            <div class="voting-title">
                <span class="material-symbols-outlined">${isVotingActive ? 'how_to_vote' : 'ballot'}</span>
                <span>${isVotingActive ? `Голосування (Раунд #${roundNum}) — Проголосувало: ${votedCount}/${alivePlayersCount}` : 'Система голосування'}</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${myRole === 'host' && !isVotingActive ? `
                    <button class="reveal-pill-btn use-special-pill" onclick="startVotingSession()">
                        <span class="material-symbols-outlined">play_arrow</span> Почати голосування
                    </button>
                ` : ''}
                ${myRole === 'host' && isVotingActive ? `
                    <button class="reveal-pill-btn use-special-pill" onclick="finalizeVoting()">
                        <span class="material-symbols-outlined">gavel</span> Підбити підсумки
                    </button>
                    <button class="reveal-pill-btn" onclick="cancelVotingSession()">Скасувати</button>
                ` : ''}
            </div>
        </div>
    `;

    if (lastResult && !isVotingActive) {
        html += `<div style="font-size: 14px; color: var(--md-primary); font-weight: 600; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 12px;">⚖️ ${escapeHtml(lastResult)}</div>`;
    }

    if (isVotingActive) {
        if (myData.eliminated) {
            html += `<div style="font-size: 13px; color: var(--md-error);">💀 Ви вигнані з Бункера і спостерігаєте за голосуванням.</div>`;
        } else if (myData.voteEffects?.cantVoteThisRound) {
            html += `<div style="font-size: 13px; color: var(--md-error);">🚫 Картка «Стоп Бункер» заблокувала ваше право голосу на цьому раунді.</div>`;
        }

        html += `<div class="voting-candidates-grid">`;
        players.forEach(p => {
            const pData = allGameData[p.id] || {};
            if (pData.eliminated) return; // Вигнаних не показуємо у списку кандидатів на виліт

            const tInfo = tallies[p.id] || { count: 0, voters: [] };
            const isImmune = !!pData.voteEffects?.immune;
            const isMyChoice = myVoteTarget === p.id;
            const votersStr = tInfo.voters.length > 0 ? `Проти: ${tInfo.voters.join(', ')}` : 'Голосів немає';

            html += `
                <div class="vote-candidate-card ${isMyChoice ? 'my-vote-target' : ''}">
                    <div class="vote-candidate-info">
                        <div class="vote-candidate-name">
                            ${escapeHtml(p.name)} ${p.id === myId ? '(Ви)' : ''}
                            ${isImmune ? '<span class="shield-badge">🛡️ Імунітет</span>' : ''}
                        </div>
                        <div class="vote-candidate-voters">${escapeHtml(votersStr)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                        ${tInfo.count > 0 ? `<span class="vote-count-pill">${tInfo.count}</span>` : ''}
                        ${!myData.eliminated && !myData.voteEffects?.cantVoteThisRound && !isImmune ? `
                            <button class="reveal-pill-btn ${isMyChoice ? 'use-special-pill' : ''}" onclick="castVote('${escapeHtml(p.id)}')">
                                ${isMyChoice ? '✓ Ваш голос' : 'Голосувати'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    wrapper.innerHTML = html;
}

function selectBoardPlayer(playerId) {
    selectedBoardPlayerId = playerId;
    renderPlayersBoard();
}

function cycleBoardPlayer(direction) {
    if (!players || players.length <= 1) return;
    const currentIndex = players.findIndex(p => p.id === selectedBoardPlayerId);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + players.length) % players.length;
    selectedBoardPlayerId = players[nextIndex].id;
    renderPlayersBoard();

    const activeTabEl = document.querySelector('.player-dock-tab.active');
    if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function renderPlayersBoard() {
    renderVotingSection();

    const topDock = document.getElementById('players-top-dock');
    const board = document.getElementById('players-board-container');
    const countSubtitle = document.getElementById('players-count-subtitle');
    const prevBtn = document.getElementById('prevPlayerBtn');
    const nextBtn = document.getElementById('nextPlayerBtn');

    if (!board || !topDock || myRole === 'offline') return;

    if (!players.some(p => p.id === selectedBoardPlayerId)) {
        selectedBoardPlayerId = players[0]?.id || myId;
    }

    const aliveCount = players.filter(p => !allGameData[p.id]?.eliminated).length;
    if (countSubtitle) {
        countSubtitle.textContent = `Учасників за столом: ${players.length} (У грі: ${aliveCount})`;
    }

    const showArrows = players.length > 1;
    if (prevBtn) prevBtn.style.display = showArrows ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = showArrows ? 'flex' : 'none';

    topDock.innerHTML = '';
    players.forEach(p => {
        const pData = allGameData[p.id] || {};
        const openCount = CORE_FIELDS.filter(f => pData.revealed && pData.revealed[f]).length;
        const btn = document.createElement('div');
        btn.className = `player-dock-tab ${p.id === selectedBoardPlayerId ? 'active' : ''} ${pData.eliminated ? 'eliminated-tab' : ''}`;
        btn.onclick = () => selectBoardPlayer(p.id);
        btn.innerHTML = `
            <span class="material-symbols-outlined">${pData.eliminated ? 'skull' : (p.isHost ? 'military_tech' : 'person')}</span>
            <span>${escapeHtml(p.name)}${p.id === myId ? ' (Ви)' : ''}</span>
            <span class="player-dock-badge">${openCount}/${CORE_FIELDS.length}</span>
        `;
        topDock.appendChild(btn);
    });

    board.innerHTML = '';
    const activePlayer = players.find(p => p.id === selectedBoardPlayerId);
    if (!activePlayer) return;

    const pData = allGameData[activePlayer.id] || {};
    const revealedMap = pData.revealed || {};
    const statuses = pData.statuses || [];
    const changes = pData.changesCount || 0;

    let statusesHtml = '';
    if (pData.eliminated) {
        statusesHtml += `<span class="status-chip eliminated-chip">💀 ВИГНАНИЙ З БУНКЕРА</span>`;
    }
    statusesHtml += statuses.map(s => `<span class="status-chip">${escapeHtml(s)}</span>`).join('');
    if (pData.baggageProtected) {
        statusesHtml += `<span class="status-chip">🛡️ Багаж захищено</span>`;
    }

    let cardsHtml = '';

    // Панель статусів обраного гравця + кнопка для Хоста (Вигнати / Повернути в гру)
    cardsHtml += `
        <div class="m3-card glass-panel wide-card" style="padding: 14px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div class="statuses-bar" style="margin: 0;">
                    ${statusesHtml || '<span style="font-size:13px; color:var(--md-on-surface-variant);">Активних ефектів немає</span>'}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${changes > 0 ? `<span class="changes-badge" style="padding: 4px 10px; font-size: 12px;">Ручних змін: ${changes}</span>` : ''}
                    ${myRole === 'host' ? `
                        <button class="reveal-pill-btn" onclick="toggleEliminatePlayer('${escapeHtml(activePlayer.id)}')" title="Керування статусом гравця">
                            <span class="material-symbols-outlined">${pData.eliminated ? 'restore' : 'person_remove'}</span>
                            <span>${pData.eliminated ? 'Повернути в гру' : 'Вигнати'}</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    CORE_FIELDS.forEach(fKey => {
        const isOpen = !!revealedMap[fKey];
        const val = isOpen ? (pData[fKey] || "—") : "🔒 Засекречено";
        const isWide = ['health', 'phobia', 'hobby', 'inventory', 'info'].includes(fKey);
        cardsHtml += `
            <div class="m3-card glass-panel ${isWide ? 'wide-card' : ''} ${isOpen ? 'publicly-revealed' : ''}">
                <div class="card-header">
                    <span class="label">${escapeHtml(FIELD_NAMES[fKey])}</span>
                    <span class="material-symbols-outlined" style="font-size: 18px; color: ${isOpen ? '#9CD69E' : 'var(--md-outline)'};">
                        ${isOpen ? 'check_circle' : 'lock'}
                    </span>
                </div>
                <div class="field-content ${isOpen ? '' : 'secret-value'}">${escapeHtml(val)}</div>
            </div>
        `;
    });

    if (pData.extraCards) {
        Object.values(pData.extraCards).forEach(ext => {
            const isOpen = !!ext.revealed;
            const val = isOpen ? ext.value : "🔒 Засекречено";
            cardsHtml += `
                <div class="m3-card glass-panel wide-card ${isOpen ? 'publicly-revealed' : ''}">
                    <div class="card-header">
                        <span class="label">${escapeHtml(ext.label)}</span>
                        <span class="material-symbols-outlined" style="font-size: 18px; color: ${isOpen ? '#9CD69E' : 'var(--md-outline)'};">
                            ${isOpen ? 'check_circle' : 'lock'}
                        </span>
                    </div>
                    <div class="field-content ${isOpen ? '' : 'secret-value'}">${escapeHtml(val)}</div>
                </div>
            `;
        });
    }

    ['special1', 'special2'].forEach((spKey, idx) => {
        const isUsed = !!(pData.usedSpecials && pData.usedSpecials[spKey]);
        if (isUsed || revealedMap[spKey]) {
            cardsHtml += `
                <div class="m3-card glass-panel wide-card" style="border-color: var(--md-error) !important;">
                    <div class="card-header">
                        <span class="label" style="color: var(--md-error);">⚡ Стоп Бункер ${idx + 1} (Використано)</span>
                    </div>
                    <div class="field-content">${escapeHtml(pData[spKey] || '')}</div>
                </div>
            `;
        }
    });

    board.innerHTML = `<div class="cards-grid">${cardsHtml}</div>`;
}

function updateLobbyUI() {
    const list = document.getElementById('players-list');
    const countLabel = document.getElementById('lobby-players-count');
    if (!list) return;
    if (countLabel) countLabel.textContent = `Гравці в лобі (${players.length}):`;
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
        roomRef.child('voting').off();
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
    votingState = {};
    myRole = 'offline';
    document.body.classList.remove('is-online');
    document.getElementById('active-vote-alert-btn').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    syncBodyScrollLock();
}

// Експортуємо функції у window для HTML-атрибутів onclick
Object.assign(window, {
    switchStartMode, startGame, hostGame, joinGame, startOnlineGame, cancelOnline,
    openRules, closeRules, openMoreMenu, closeMoreMenu, openThemeModal, closeThemeModal,
    setTheme, setCustomTheme, openAddCardModal, closeAddCardModal, addNewCard,
    openAuditModal, closeAuditModal, returnToStart, unlockSheetAndShowNav, switchTab,
    revealCardPublicly, revealExtraCardPublicly, cycleBoardPlayer, openEditModal, closeEditModal,
    filterOptions, confirmEditSelection, requestResetField, requestNewDossier,
    confirmAction, cancelAction, useSpecial, clearRoomSpecialsLock, closeTargetModal,
    startVotingSession, cancelVotingSession, castVote, finalizeVoting, toggleEliminatePlayer, goToVotingTab
});