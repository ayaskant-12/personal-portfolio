// Theme Management System
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
        this.setupThemeObserver();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        // Dispatch custom event for theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun text-yellow-300';
                themeIcon.title = 'Switch to Light Mode';
            } else {
                themeIcon.className = 'fas fa-moon text-indigo-600';
                themeIcon.title = 'Switch to Dark Mode';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Add animation class for smooth transition
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 500);
    }

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Keyboard shortcut (Alt + T)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    setupThemeObserver() {
        // Observe system preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Check if dark mode is active
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    // Check if light mode is active
    isLightMode() {
        return this.currentTheme === 'light';
    }

    // Set specific theme
    setTheme(theme) {
        if (['dark', 'light'].includes(theme)) {
            this.applyTheme(theme);
        }
    }
}

// Theme-dependent utility functions
const ThemeUtils = {
    // Get appropriate color for current theme
    getTextColor() {
        return window.themeManager.isDarkMode() ? '#f1f5f9' : '#1e293b';
    },

    getBackgroundColor() {
        return window.themeManager.isDarkMode() ? '#0f172a' : '#f8fafc';
    },

    getBorderColor() {
        return window.themeManager.isDarkMode() ? '#334155' : '#e2e8f0';
    },

    // Update CSS variables dynamically
    updateCSSVariables() {
        const root = document.documentElement;
        if (window.themeManager.isDarkMode()) {
            root.style.setProperty('--text-primary', '#f1f5f9');
            root.style.setProperty('--bg-primary', '#0f172a');
        } else {
            root.style.setProperty('--text-primary', '#1e293b');
            root.style.setProperty('--bg-primary', '#f8fafc');
        }
    }
};

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.themeUtils = ThemeUtils;

    // Add theme transitioning class to body for CSS transitions
    document.body.classList.add('theme-transition-ready');

    // Listen for theme changes to update components
    window.addEventListener('themeChanged', (event) => {
        const { theme } = event.detail;
        console.log(`Theme changed to: ${theme}`);
        
        // Update any theme-dependent components
        this.updateThemeDependentComponents(theme);
    });
});

// Function to update theme-dependent components
function updateThemeDependentComponents(theme) {
    // Update charts if they exist
    if (window.updateChartsTheme) {
        window.updateChartsTheme(theme);
    }
    
    // Update map themes if they exist
    if (window.updateMapTheme) {
        window.updateMapTheme(theme);
    }
    
    // Update code syntax highlighting if exists
    if (window.updateCodeTheme) {
        window.updateCodeTheme(theme);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ThemeUtils };
}
