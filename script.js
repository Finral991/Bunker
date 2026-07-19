const db = {
    roles: ["Звичайний", "Потрібний", "Зрадник"], 
    professions: [
        // Корисні
        "Хірург-травматолог", "Інженер-електрик", "Програміст (Python)", "Спецназівець", "Агроном", "Кухар", "Фермер", "Архітектор", "Пілот гелікоптера", "Ветеринар", "Зварювальник", "Столяр", "Водій вантажівки", "Хімік-технолог", "Мисливець", "Рятувальник МНС",
        // Сумнівні / Нейтральні
        "Вчитель історії", "Бариста", "Майстер манікюру", "Священик", "Фітнес-тренер", "Дизайнер інтер'єрів", "Актор театру", "Перекладач з латини", "Продавець-консультант",
        // Повний абсурд
        "Таролог", "Блогер-мільйонник", "Криптоінвестор", "Професійний гравець у покер", "Астролог", "Дегустатор корму для тварин", "Експерт з НЛО", "Критик ресторанів", "Порноактор", "Рієлтор",
    ],
    genders: ["Чоловік", "Жінка"],
    health_base: ["Ідеальне здоров'я", "Абсолютно здоровий", "Здоровий як бик", "Міцний імунітет", "Жодних скарг", "Спортивна статура"],
    health_diseases: [
        "Астма", "Короткозорість", "Цукровий діабет", "Хронічний кашель", "Сліпота на одне око", "Алергія на пилок", 
        "Глухота на одне вухо", "Епілепсія", "Подагра", "Гемороїдальні вузли", "Алергія на арахіс (навіть на запах)", 
        "Відсутність правої нирки", "Тахікардія", "Мігрені", "Лунатизм", "Шизофренія", "Хронічний гастрит"
    ],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    hobbies: [
        "Виживання в лісі", "В'язання", "Радіоаматорство", "Швидкісне читання", "Ботаніка", "Стрільба з лука", 
        "Колекціонування марок", "Орігамі", "Скелелазіння", "Варіння крафтового пива", "Історична реконструкція", 
        "Паркур", "Гра на баяні", "Езотерика", "Риболовля", "Метання ножів", "Створення отрут з рослин", "Збирання пазлів"
    ],
    additional_info: [
        "Прочитав всі книги Стівена Кінга", "Вміє затримувати дихання на 3 хвилини", "Колишній чемпіон з покеру", 
        "Має чорний пояс з карате", "Пережив удар блискавки", "Відсидів 3 роки за шахрайство", 
        "Має імунітет до всіх штамів грипу", "Знає напам'ять карту міста", "Володіє навичками гіпнозу", 
        "Хронічно не переносить брехню", "Є таємним агентом під прикриттям (можливо)", "Носить перуку", 
        "Вміє відкривати замки шпилькою", "Жодного разу в житті не мив посуд"
    ],
    inventory: [
        "Військова аптечка", "Набір викруток", "Динамо-ліхтарик", "Гітара", "Ящик тушонки", "Насіння овочів", 
        "Пляшка елітного віскі", "Том енциклопедії (літера 'К')", "Набір для пікніка", "Сонячна панель", 
        "Рація", "Пачка презервативів", "Кілограм солі", "Мисливський ніж", "Намет на 2 особи", 
        "Квадрокоптер", "Довідник з виживання", "Рулон армованого скотчу", "Колекція коміксів", "Протигаз"
    ],
    traits: [
        "Клаустрофобія (панічний страх замкнутих просторів)", 
        "Ніктофобія (страх темряви)", 
        "Арахнофобія (страх павуків)", 
        "Піроманія (хворобливий потяг до підпалів)", 
        "Клептоманія (нав'язливе бажання щось вкрасти)", 
        "Мізофобія (панічний страх бруду та мікробів)", 
        "Коулрофобія (страх клоунів)", 
        "Номофобія (страх залишитися без телефону)", 
        "Гемофобія (страх вигляду крові)", 
        "Акрофобія (страх висоти)", 
        "Анатидаефобія (страх, що десь є качка, яка стежить за тобою)", 
        "Агорафобія (страх відкритого простору або натовпу)", 
        "Фагофобія (страх подавитися їжею)", 
        "Патологічний брехун (бреше навіть коли це не потрібно)", 
        "Синдром Туретта (раптові нервові тики або лайка)",
        "Абсолютна пам'ять (пам'ятає кожну деталь життя)",
        "Гіперсомнія (може заснути в будь-якій ситуації)"
    ],
    specials: [
        "Забрати здоров'я в будь-якого гравця", 
        "Перероздати всім здоров'я", 
        "Дізнатися фобію будь-якого гравця", 
        "Імунітет на одне голосування", 
        "Вкрасти рюкзак сусіда", 
        "Скасувати чужу карту Стоп Бункер",
        "Змусити двох гравців помінятися рюкзаками",
        "Відкрити роль (Хто ти) обраного гравця",
        "Отримати подвійний голос на наступному голосуванні",
        "Заборонити обраному гравцю розмовляти один раунд"
    ]
};

const svgMale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="20"/><path d="M15,100 C15,60 85,60 85,100"/></svg>`;
const svgFemale = `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="18"/><path d="M25,25 C10,40 20,70 30,80 C35,65 65,65 70,80 C80,70 90,40 75,25 Z"/><path d="M15,100 C15,65 85,65 85,100"/></svg>`;

const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 

function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    const lName = document.getElementById('lastNameInput').value.trim();
    if (!fName) { alert("Будь ласка, введіть хоча б Ім'я!"); return; }
    
    document.getElementById('start-modal').style.display = 'none';
    const nameDisplay = document.getElementById('candidate-name');
    nameDisplay.innerText = `ПІБ: ${fName} ${lName}`.trim();
    nameDisplay.style.display = 'block';

    generateCharacter();
    document.getElementById('generateBtn').style.display = 'block';
}

function getExperienceD6() {
    const roll = Math.floor(Math.random() * 6) + 1;
    switch(roll) {
        case 1: return "Дилетант (до 1 місяця)";
        case 2: return "Новачок (від 1 до 12 місяців)";
        case 3: return "Любитель (від 1 до 2 років)";
        case 4: return "Досвідчений (від 2 до 5 років)";
        case 5: return "Експерт (від 5 до 10 років)";
        case 6: return "Професіонал (понад 10 років)";
    }
}

function getConstitutionText() {
    const roll = Math.floor(Math.random() * 5) + 1;
    switch(roll) {
        case 1: return "(Худорлява)";
        case 2: return "(Струнка)";
        case 3: return "(Середня)";
        case 4: return "(Щільна)";
        case 5: return "(Надмірна вага)";
    }
}

function generateHealth() {
    if (Math.random() > 0.4) {
        return getRandomItem(db.health_base);
    } else {
        const disease = getRandomItem(db.health_diseases);
        const stage = getRandomItem(db.health_stages);
        return `${disease} (ступінь: ${stage})`;
    }
}

function generateCharacter() {
    document.getElementById('global-lock').style.display = 'flex';

    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    const gender = getRandomItem(db.genders);

    const roleRoll = Math.random();
    const role = roleRoll > 0.4 ? "Звичайний" : getRandomItem(["Потрібний", "Зрадник"]);

    const currentCharacter = {
        role: role,
        bio: `${gender}, ${age} років\nСтатура: ${getConstitutionText()}`,
        profession: `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`,
        health: generateHealth(),
        trait: getRandomItem(db.traits),
        hobby: `${getRandomItem(db.hobbies)}\nРівень: ${getExperienceD6()}`,
        inventory: getRandomItem(db.inventory),
        info: getRandomItem(db.additional_info),
        special1: getRandomItem(db.specials),
        special2: getRandomItem(db.specials)
    };

    document.getElementById('profile-photo').innerHTML = gender === "Чоловік" ? svgMale : svgFemale;
    document.getElementById('candidate-id').innerText = Math.floor(1000 + Math.random() * 9000);

    setupLockedField('role', currentCharacter.role);
    setupLockedField('bio', currentCharacter.bio);
    setupLockedField('profession', currentCharacter.profession);
    setupLockedField('health', currentCharacter.health);
    setupLockedField('trait', currentCharacter.trait);
    setupLockedField('hobby', currentCharacter.hobby);
    setupLockedField('inventory', currentCharacter.inventory);
    setupLockedField('info', currentCharacter.info);
    setupLockedField('special1', currentCharacter.special1);
    setupLockedField('special2', currentCharacter.special2);

    document.getElementById('character-sheet').classList.remove('hidden');
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function setupLockedField(id, text) {
    const container = document.getElementById(id);
    container.dataset.value = text;
    container.classList.remove('revealed');
    container.innerHTML = ""; 
}

async function unlockSheet() {
    document.getElementById('global-lock').style.display = 'none';
    
    if (isTypingGlobal) return;
    isTypingGlobal = true;
    
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) {
            await playPromise;
        }
    } catch(e) { console.log("Аудіо заблоковано браузером"); }

    const fields = ['role', 'bio', 'profession', 'health', 'trait', 'hobby', 'inventory', 'info', 'special1', 'special2'];
    
    const promises = fields.map(async (id) => {
        const container = document.getElementById(id);
        container.classList.add('revealed');
        const text = container.dataset.value;
        container.innerHTML = "";
        
        for (let i = 0; i < text.length; i++) {
            container.innerHTML += text.charAt(i);
            await new Promise(r => setTimeout(r, 25)); 
        }
    });

    await Promise.all(promises); 
    
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}

async function typeWriterEffect(element, text) {
    isTypingGlobal = true;
    
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {}

    element.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        await new Promise(r => setTimeout(r, 25)); 
    }
    
    typingAudio.pause(); 
    typingAudio.currentTime = 0; 
    isTypingGlobal = false;
}

async function resetField(elementId, dbKey) {
    if (isTypingGlobal) return;
    const container = document.getElementById(elementId);
    let newItem = "";

    if (elementId === 'role') {
        newItem = Math.random() > 0.4 ? "Звичайний" : getRandomItem(["Потрібний", "Зрадник"]);
    } else if (elementId === 'bio') {
        const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
        newItem = `${getRandomItem(db.genders)}, ${age} років\nСтатура: ${getConstitutionText()}`;
    } else if (elementId === 'profession' || elementId === 'hobby') {
        newItem = `${getRandomItem(db[dbKey])}\nДосвід: ${getExperienceD6()}`;
    } else if (elementId === 'health') {
        newItem = generateHealth();
    } else {
        newItem = getRandomItem(db[dbKey]);
    }

    container.dataset.value = newItem;

    if (container.classList.contains('revealed')) {
        await typeWriterEffect(container, newItem);
    } else {
        container.innerHTML = "";
    }
}