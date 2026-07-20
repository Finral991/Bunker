const db = {
    roles: ["Звичайний", "Потрібний", "Зрадник"], 
    professions: [
        "Хірург-травматолог", "Інженер-електрик", "Програміст (Python)", "Спецназівець", "Агроном", "Кухар", "Фермер", "Архітектор", "Пілот гелікоптера", "Ветеринар", "Зварювальник", "Столяр", "Водій вантажівки", "Хімік-технолог", "Мисливець", "Рятувальник МНС",
        "Вчитель історії", "Бариста", "Майстер манікюру", "Священик", "Фітнес-тренер", "Дизайнер інтер'єрів", "Актор театру", "Перекладач з латини", "Продавець-консультант",
        "Таролог", "Блогер-мільйонник", "Криптоінвестор", "Професійний гравець у покер", "Астролог", "Дегустатор корму для тварин", "Експерт з НЛО", "Критик ресторанів", "Сомельє"
    ],
    genders: ["Чоловік", "Жінка"],
    health_base: ["Ідеальне здоров'я", "Абсолютно здоровий", "Здоровий як бик", "Міцний імунітет", "Жодних скарг", "Спортивна статура"],
    health_diseases: [
        "Астма", "Короткозорість", "Цукровий діабет", "Хронічний кашель", "Сліпота на одне око", "Алергія на пилок", 
        "Глухота на одне вухо", "Епілепсія", "Подагра", "Гемороїдальні вузли", "Алергія на арахіс (навіть на запах)", 
        "Відсутність правої нирки", "Тахікардія", "Мігрені", "Лунатизм", "Шизофренія", "Хронічний гастрит", "Псоріаз", "Безсоння"
    ],
    health_stages: ["легкий", "середній", "важкий", "критичний"], 
    hobbies: [
        "Виживання в лісі", "В'язання", "Радіоаматорство", "Швидкісне читання", "Ботаніка", "Стрільба з лука", 
        "Колекціонування марок", "Орігамі", "Скелелазіння", "Варіння крафтового пива", "Історична реконструкція", 
        "Паркур", "Гра на баяні", "Езотерика", "Риболовля", "Метання ножів", "Створення отрут з рослин", "Збирання пазлів", "Астрономія", "Злом замків"
    ],
    additional_info: [
        "Прочитав всі книги Стівена Кінга", "Вміє затримувати дихання на 3 хвилини", "Колишній чемпіон з покеру", 
        "Має чорний пояс з карате", "Пережив удар блискавки", "Відсидів 3 роки за шахрайство", 
        "Має імунітет до всіх штамів грипу", "Знає напам'ять карту міста", "Володіє навичками гіпнозу", 
        "Хронічно не переносить брехню", "Є таємним агентом під прикриттям (можливо)", "Носить перуку", 
        "Вміє відкривати замки шпилькою", "Жодного разу в житті не мив посуд", "Має татуювання на все тіло", "Колишній монах-самітник"
    ],
    inventory: [
        "Військова аптечка", "Набір викруток", "Динамо-ліхтарик", "Гітара", "Ящик тушонки", "Насіння овочів", 
        "Пляшка елітного віскі", "Том енциклопедії (літера 'К')", "Набір для пікніка", "Сонячна панель", 
        "Рація", "Пачка презервативів", "Кілограм солі", "Мисливський ніж", "Намет на 2 особи", 
        "Квадрокоптер", "Довідник з виживання", "Рулон армованого скотчу", "Колекція коміксів", "Протигаз", "Коробка цвяхів", "Сигнальна ракетниця"
    ],
    phobias: [
        "Клаустрофобія (страх замкнутих просторів)", "Ніктофобія (страх темряви)", "Арахнофобія (страх павуків)", 
        "Мізофобія (страх бруду та мікробів)", "Коулрофобія (страх клоунів)", "Номофобія (страх залишитися без телефону)", 
        "Гемофобія (страх вигляду крові)", "Акрофобія (страх висоти)", "Анатидаефобія (страх, що за тобою стежить качка)", 
        "Агорафобія (страх відкритого простору/натовпу)", "Фагофобія (страх подавитися їжею)", "Гідрофобія (страх води/плавання)",
        "Аквафобія (панічна боязнь потонути)"
    ],
    traits: [
        "Патологічний брехун (бреше без причини)", "Клептоманія (нав'язливе бажання красти)", 
        "Абсолютна пам'ять (пам'ятає кожну деталь життя)", "Педант (дратується, якщо речі лежать нерівно)",
        "Агресивний (легко провокується на конфлікт)", "Пацифіст (відмовляється від будь-якого насильства)",
        "Оптиміст (жартує навіть під час апокаліпсису)", "Параноїк (нікому не довіряє, чекає зради)",
        "Маніпулятор (майстерно стравлює людей між собою)", "Егоїст (завжди думає тільки про себе)",
        "Альтруїст (готовий пожертвувати собою заради інших)"
    ],
    specials: [
        "Забрати здоров'я в будь-якого гравця", "Перероздати всім здоров'я", "Дізнатися фобію будь-якого гравця", 
        "Імунітет на одне голосування", "Вкрасти рюкзак сусіда", "Скасувати чужу карту Стоп Бункер",
        "Змусити двох гравців помінятися рюкзаками", "Відкрити роль (Хто ти) обраного гравця",
        "Отримати подвійний голос на наступному голосуванні", "Заборонити обраному гравцю розмовляти один раунд",
        "Змусити будь-якого гравця відкрити випадкову картку", "Врятувати гравця від вигнання (скасувати результати голосування)"
    ]
};

const imgMale = `<img src="man.jpg" style="width: 100%; height: 100%; object-fit: contain; background-color: white; border-radius: 4px;">`;
const imgFemale = `<img src="woman.jpg" style="width: 100%; height: 100%; object-fit: contain; background-color: white; border-radius: 4px;">`;

const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

let isTypingGlobal = false; 
let playWithRoles = true; 

// Утиліти
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getExperienceD6 = () => {
    const r = Math.floor(Math.random() * 6) + 1;
    return r === 1 ? "Дилетант (до 1 місяця)" : r === 2 ? "Новачок (від 1 до 12 місяців)" :
           r === 3 ? "Любитель (від 1 до 2 років)" : r === 4 ? "Досвідчений (від 2 до 5 років)" :
           r === 5 ? "Експерт (від 5 до 10 років)" : "Професіонал (понад 10 років)";
};
const getConstitutionText = () => {
    const r = Math.floor(Math.random() * 5) + 1;
    return r === 1 ? "(Худорлява)" : r === 2 ? "(Струнка)" : r === 3 ? "(Середня)" : r === 4 ? "(Щільна)" : "(З надмірною вагою)";
};
const generateHealth = () => Math.random() > 0.4 ? getRandomItem(db.health_base) : `${getRandomItem(db.health_diseases)} (ступінь: ${getRandomItem(db.health_stages)})`;

function startGame() {
    const fName = document.getElementById('firstNameInput').value.trim();
    const lName = document.getElementById('lastNameInput').value.trim();
    
    playWithRoles = document.getElementById('enableRole').checked;
    
    if (!fName) { alert("Будь ласка, введіть хоча б Ім'я!"); return; }
    
    document.getElementById('start-modal').style.display = 'none';
    const nameDisplay = document.getElementById('candidate-name');
    nameDisplay.textContent = `ПІБ: ${fName} ${lName}`.trim();
    nameDisplay.style.display = 'block';

    generateCharacter();
    document.getElementById('generateBtn').style.display = 'block';
}

function generateCharacter() {
    document.getElementById('global-lock').style.display = 'flex';
    document.getElementById('role-box').style.display = playWithRoles ? 'flex' : 'none';

    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    const gender = getRandomItem(db.genders);
    const role = Math.random() > 0.4 ? "Звичайний" : getRandomItem(["Потрібний", "Зрадник"]);

    let sp1 = getRandomItem(db.specials);
    let sp2 = getRandomItem(db.specials);
    while (sp1 === sp2) sp2 = getRandomItem(db.specials);

    const charData = {
        role: role,
        bio: `${gender}, ${age} років\nСтатура: ${getConstitutionText()}`,
        profession: `${getRandomItem(db.professions)}\nДосвід: ${getExperienceD6()}`,
        health: generateHealth(),
        phobia: getRandomItem(db.phobias),
        trait: getRandomItem(db.traits),
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
            container.textContent = ""; 
        }
    }
    document.getElementById('character-sheet').classList.remove('hidden');
}

// ОПТИМІЗОВАНО: Чиста функція друку (не смикає DOM на кожній літері)
async function printText(element, text) {
    let currentString = "";
    for (let i = 0; i < text.length; i++) {
        currentString += text.charAt(i);
        element.textContent = currentString; // textContent набагато швидший за innerHTML
        await new Promise(r => setTimeout(r, 25)); 
    }
}

async function unlockSheet() {
    document.getElementById('global-lock').style.display = 'none';
    if (isTypingGlobal) return;
    isTypingGlobal = true;
    
    try { 
        const playPromise = typingAudio.play();
        if (playPromise !== undefined) await playPromise;
    } catch(e) {}

    let fields = ['bio', 'profession', 'health', 'phobia', 'trait', 'hobby', 'inventory', 'info', 'special1', 'special2'];
    if (playWithRoles) fields.unshift('role');
    
    // Запускаємо всі функції printText паралельно
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

// Кнопка реролу [↻]
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
    } else if (elementId === 'special1' || elementId === 'special2') {
        const otherId = elementId === 'special1' ? 'special2' : 'special1';
        const otherCardValue = document.getElementById(otherId).dataset.value;
        newItem = getRandomItem(db.specials);
        while (newItem === otherCardValue) newItem = getRandomItem(db.specials);
    } else {
        newItem = getRandomItem(db[dbKey]);
    }

    container.dataset.value = newItem;

    if (container.classList.contains('revealed')) {
        isTypingGlobal = true;
        try { 
            const playPromise = typingAudio.play();
            if (playPromise !== undefined) await playPromise;
        } catch(e) {}
        
        await printText(container, newItem);
        
        typingAudio.pause(); 
        typingAudio.currentTime = 0; 
        isTypingGlobal = false;
    } else {
        container.textContent = "";
    }
}