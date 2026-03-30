/**
 * Dhwani Common Utilities - Theme Toggle and Global Behavior
 */

export function initTheme() {
    const toggleBtns = document.querySelectorAll('.theme-toggle');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('dhwani-theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.setAttribute('data-theme', 'dark');
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('dhwani-theme', newTheme);
        });
    });
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
