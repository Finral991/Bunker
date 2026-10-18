// js/wallpaper.js

export function createStaticWallpaper() {
    const bg = document.getElementById('emojiWallpaper');
    if (!bg) return;
    
    const icons = [
        'science', 'skull', 'backpack', 'medication', 
        'flashlight_on', 'camping', 'hardware', 'water_drop', 
        'public', 'bug_report', 'warning', 'shield', 
        'radar', 'map', 'key', 'restaurant', 'bolt', 'explore'
    ];
    
    const canvasWidth = Math.max(window.innerWidth, 400) + 120;
    const canvasHeight = Math.max(window.innerHeight, 700) + 120;
    const cellSize = 110;
    
    const cols = Math.ceil(canvasWidth / cellSize);
    const rows = Math.ceil(canvasHeight / cellSize);
    
    let content = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.6) continue;
            
            const icon = icons[Math.floor(Math.random() * icons.length)];
            const rot = Math.floor(Math.random() * 360); 
            const op = ((Math.random() * 0.04) + 0.02).toFixed(3);
            
            const baseX = c * cellSize + (cellSize / 2);
            const baseY = r * cellSize + (cellSize / 2);
            const jitterX = Math.round((Math.random() - 0.5) * 40); 
            const jitterY = Math.round((Math.random() - 0.5) * 40); 
            
            content += `<span class="material-symbols-outlined" style="position: absolute; left: ${baseX + jitterX}px; top: ${baseY + jitterY}px; transform: translate(-50%, -50%) rotate(${rot}deg); opacity: ${op}; font-size: 38px; user-select: none;">${icon}</span>`;
        }
    }
    bg.innerHTML = content;
}