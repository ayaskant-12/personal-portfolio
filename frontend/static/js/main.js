// Main Portfolio Application
class PortfolioApp {
    constructor() {
        this.currentProjectFilter = 'all';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupSkillBars();
        this.setupContactForm();
        this.setupProjectFilters();
        this.setupScrollEffects();
        this.setupImageLazyLoading();
        this.setupTooltips();
        this.setupCopyToClipboard();
        this.setupServiceWorker();
    }

    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const level = entry.target.dataset.level;
                    setTimeout(() => {
                        entry.target.style.width = `${level}%`;
                    }, 200);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        skillBars.forEach(bar => {
            observer.observe(bar);
        });
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (this.isLoading) return;
                
                const formData = new FormData(contactForm);
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;

                // Disable button and show loading
                this.isLoading = true;
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                try {
                    const response = await fetch('/contact', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                        contactForm.reset();
                    } else {
                        this.showNotification('Error sending message: ' + data.message, 'error');
                    }
                } catch (error) {
                    console.error('Contact form error:', error);
                    this.showNotification('Error sending message. Please try again or email me directly.', 'error');
                } finally {
                    this.isLoading = false;
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                }
            });

            // Real-time validation
            this.setupFormValidation(contactForm);
        }
    }

    setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    validateField(field) {
        this.clearFieldError(field);
        
        const value = field.value.trim();
        const fieldName = field.getAttribute('name');
        
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (fieldName === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (fieldName === 'message' && value.length < 10) {
            isValid = false;
            errorMessage = 'Message should be at least 10 characters long';
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error text-red-400 text-sm mt-1';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    setupProjectFilters() {
        const filterButtons = document.querySelectorAll('.project-filter');
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active', 'bg-cyan-400/20'));
                // Add active class to clicked button
                button.classList.add('active', 'bg-cyan-400/20');

                const filterValue = button.dataset.filter;
                this.currentProjectFilter = filterValue;

                projectCards.forEach(card => {
                    const categories = card.dataset.category.split(' ');
                    
                    if (filterValue === 'all' || categories.includes(filterValue)) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 100);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });

                // Update URL hash
                history.replaceState(null, null, `#projects-${filterValue}`);
            });
        });

        // Load more projects functionality
        const loadMoreBtn = document.getElementById('loadMoreProjects');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProjects();
            });
        }
    }

    async loadMoreProjects() {
        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();
            
            // Implement load more logic here
            this.showNotification(`Loaded ${projects.length} projects`, 'success');
        } catch (error) {
            this.showNotification('Error loading more projects', 'error');
        }
    }

    setupScrollEffects() {
        // Back to top button
        const backToTop = document.createElement('button');
        backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTop.className = 'fixed bottom-8 right-8 z-40 w-12 h-12 bg-cyan-400 text-white rounded-full shadow-lg hover:bg-cyan-500 transition-all duration-300 opacity-0 transform translate-y-10';
        backToTop.id = 'backToTop';
        document.body.appendChild(backToTop);

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.remove('opacity-0', 'translate-y-10');
                backToTop.classList.add('opacity-100', 'translate-y-0');
            } else {
                backToTop.classList.remove('opacity-100', 'translate-y-0');
                backToTop.classList.add('opacity-0', 'translate-y-10');
            }
        });

        // Progress bar
        this.setupProgressBar();
    }

    setupProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'fixed top-0 left-0 w-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 z-50 transition-all duration-100';
        progressBar.id = 'progressBar';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = `${progress}%`;
        });
    }

    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg';
                tooltip.textContent = element.dataset.tooltip;
                document.body.appendChild(tooltip);

                const rect = element.getBoundingClientRect();
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;

                element.dataset.tooltipId = tooltip;
            });

            element.addEventListener('mouseleave', () => {
                const tooltip = element.dataset.tooltipId;
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
        });
    }

    setupCopyToClipboard() {
        const copyButtons = document.querySelectorAll('[data-copy]');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const textToCopy = button.dataset.copy;
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    this.showNotification('Copied to clipboard!', 'success');
                } catch (err) {
                    console.error('Failed to copy: ', err);
                    this.showNotification('Failed to copy to clipboard', 'error');
                }
            });
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification fixed top-20 right-6 z-50 px-6 py-3 rounded-lg glassmorphism border-l-4 ${
            type === 'success' ? 'border-green-400' : 
            type === 'error' ? 'border-red-400' : 
            'border-blue-400'
        } text-white font-semibold transform translate-x-full transition-transform duration-300 max-w-sm`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'info-circle';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-${icon} text-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-400"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Utility function to format dates
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Utility function to debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
    
    // Add loaded class to body when everything is ready
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = '👋 Come back! - Ayaskant Dash';
        } else {
            document.title = 'Ayaskant Dash - Portfolio';
        }
    });
});

// Error boundary for the application
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    
    // Show user-friendly error message
    if (window.portfolioApp) {
        window.portfolioApp.showNotification('Something went wrong. Please refresh the page.', 'error');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
}
