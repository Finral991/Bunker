// background.js

// Генерація ХАОТИЧНОГО фону
function createMaterialWallpaper() {
    const bg = document.getElementById('emojiWallpaper');
    if (!bg) return;
    
    // Надійні іконки, які не перетворюються на текст
    const icons = [
        'science', 'skull', 'backpack', 'medication', 
        'flashlight_on', 'camping', 'hardware', 'water_drop', 
        'public', 'bug_report', 'warning', 'shield', 
        'radar', 'map', 'key', 'restaurant', 'bolt', 'explore'
    ];
    let content = '';
    
    for (let i = 0; i < 65; i++) {
        const icon = icons[Math.floor(Math.random() * icons.length)];
        const rot = Math.floor(Math.random() * 60) - 30; // Легкий нахил
        
        // Базова прозорість
        const op = (Math.random() * 0.15) + 0.10; 
        
        const left = Math.random() * 100; 
        const top = Math.random() * 100; 
        
        // Випадкова швидкість дрейфу по "воді"
        const floatDur = Math.floor(Math.random() * 10) + 15; // Від 15с до 25с
        const floatDel = Math.floor(Math.random() * 10); 
        
        // ЗМІНЕНО: Тепер ми передаємо CSS-змінні (--base-rot та --base-op), щоб анімація не збивала нахил
        content += `
            <div class="bg-icon-wrapper" style="left: ${left}vw; top: ${top}vh; --base-rot: ${rot}deg; --base-op: ${op};">
                <span class="material-symbols-outlined bg-icon-inner" style="font-size: 48px; animation-duration: ${floatDur}s; animation-delay: -${floatDel}s;">${icon}</span>
            </div>`;
    }
    bg.innerHTML = content;
    
    // Запускаємо логіку неонового світіння
    startRandomGlow();
}

// Функція, яка постійно "запалює" рандомні іконки
function startRandomGlow() {
    const wrappers = document.querySelectorAll('.bg-icon-wrapper');
    if (wrappers.length === 0) return;
    
    // Нові іконки запалюються раз на 3 секунди
    setInterval(() => {
        // Одночасно підсвічуємо від 1 до 3 іконок
        const numToGlow = Math.floor(Math.random() * 3) + 1;
        
        for(let i = 0; i < numToGlow; i++) {
            const randomWrapper = wrappers[Math.floor(Math.random() * wrappers.length)];
            
            if(!randomWrapper.classList.contains('glowing')) {
                // Додаємо клас анімації
                randomWrapper.classList.add('glowing');
                
                // Знімаємо клас точно після завершення анімації (12 секунд)
                setTimeout(() => {
                    randomWrapper.classList.remove('glowing');
                }, 12000); 
            }
        }
    }, 3000); 
}

// Запускаємо генерацію фону
window.addEventListener('DOMContentLoaded', createMaterialWallpaper);