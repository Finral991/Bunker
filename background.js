// background.js

// Генерація СТАТИЧНОЇ сітки іконок (0% CPU/GPU)
function createStaticWallpaper() {
    const bg = document.getElementById('emojiWallpaper');
    if (!bg) return;
    
    const icons = [
        'science', 'skull', 'backpack', 'medication', 
        'flashlight_on', 'camping', 'hardware', 'water_drop', 
        'public', 'bug_report', 'warning', 'shield', 
        'radar', 'map', 'key', 'restaurant', 'bolt', 'explore'
    ];
    
    // Створюємо величезне віртуальне полотно (наприклад, 2000x3000px), 
    // щоб при скролінгі фон завжди був заповнений
    const canvasWidth = 2000;
    const canvasHeight = 3000;
    const cellSize = 110; // Розмір "квадрата" сітки (іконки ніколи не перетнуться)
    
    const cols = Math.ceil(canvasWidth / cellSize);
    const rows = Math.ceil(canvasHeight / cellSize);
    
    let content = '';
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Спавнимо іконку лише у 60% квадратів, щоб був "хаос" і пусті місця
            if (Math.random() > 0.6) continue;
            
            const icon = icons[Math.floor(Math.random() * icons.length)];
            const rot = Math.floor(Math.random() * 360); 
            const op = (Math.random() * 0.04) + 0.02; // Дуже тьмяні (2-6% непрозорості)
            
            // Базова позиція по центру клітинки
            const baseX = c * cellSize + (cellSize / 2);
            const baseY = r * cellSize + (cellSize / 2);
            
            // Легке зміщення (jitter) в межах клітинки, щоб не виглядало як армійський стрій
            const jitterX = (Math.random() - 0.5) * 40; 
            const jitterY = (Math.random() - 0.5) * 40; 
            
            content += `<span class="material-symbols-outlined" style="position: absolute; left: ${baseX + jitterX}px; top: ${baseY + jitterY}px; transform: translate(-50%, -50%) rotate(${rot}deg); opacity: ${op}; font-size: 38px; user-select: none;">${icon}</span>`;
        }
    }
    bg.innerHTML = content;
}

window.addEventListener('DOMContentLoaded', createStaticWallpaper);