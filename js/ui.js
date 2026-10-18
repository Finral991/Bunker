// js/ui.js
import { FIELD_NAMES } from './config.js';

export const typingAudio = new Audio('typewriter.mp3');
typingAudio.loop = true; 
typingAudio.preload = 'auto';

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function showToast(message, icon = 'bolt') {
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

export function initSavedTheme() {
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
}

export function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('bunkerTheme', themeName);
}

export function setCustomTheme(hueValue) {
    document.body.setAttribute('data-theme', 'custom');
    document.body.style.setProperty('--hue', hueValue);
    localStorage.setItem('bunkerTheme', 'custom');
    localStorage.setItem('bunkerCustomHue', hueValue);
}

export async function printText(element, text) {
    let currentString = "";
    const str = String(text || "");
    for (let i = 0; i < str.length; i++) {
        currentString += str.charAt(i);
        element.textContent = currentString; 
        await new Promise(r => setTimeout(r, 15)); 
    }
}

export function getCardLabel(fieldId) {
    if (FIELD_NAMES[fieldId]) return FIELD_NAMES[fieldId];
    const card = document.getElementById('card-' + fieldId);
    if (!card) return fieldId;
    const labelEl = card.querySelector('.label');
    return labelEl ? labelEl.textContent.trim() : fieldId;
}