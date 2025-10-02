// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.unsavedChanges = false;
        this.init();
    }

    init() {
        this.setupFileUploads();
        this.setupFormValidation();
        this.setupRealTimeUpdates();
        this.setupDashboardCharts();
        this.setupDataTables();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
        this.setupExportFunctionality();
    }

    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.validateAndPreviewFile(file, e.target);
                }
            });
        });
    }

    validateAndPreviewFile(file, input) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 5MB', 'error');
            input.value = '';
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Please upload a valid image file (JPEG, PNG, GIF, WebP)', 'error');
            input.value = '';
            return;
        }

        this.previewImage(file, input);
    }

    previewImage(file, input) {
        const previewId = input.dataset.preview;
        if (!previewId) return;

        const preview = document.getElementById(previewId);
        const reader = new FileReader();

        reader.onload = (e) => {
            preview.innerHTML = `
                <div class="relative">
                    <img src="${e.target.result}" class="w-full h-32 object-cover rounded-lg" alt="Preview">
                    <button type="button" onclick="this.parentElement.parentElement.innerHTML=''" 
                            class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                        ×
                    </button>
                </div>
            `;
            preview.classList.remove('hidden');
        };

        reader.readAsDataURL(file);
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                    this.markFormAsChanged(form);
                });
            });

            // Form submission validation
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showNotification('Please fix the errors in the form', 'error');
                } else {
                    this.unsavedChanges = false;
                }
            });
        });
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        this.clearFieldError(field);
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL';
            }
        } else if (field.type === 'number') {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            
            if (min && parseInt(value) < parseInt(min)) {
                isValid = false;
                errorMessage = `Value must be at least ${min}`;
            } else if (max && parseInt(value) > parseInt(max)) {
                isValid = false;
                errorMessage = `Value must be at most ${max}`;
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('border-red-400');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-400 text-sm mt-1';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-400');
        const existingError = field.parentNode.querySelector('.text-red-400');
        if (existingError) {
            existingError.remove();
        }
    }

    setupRealTimeUpdates() {
        // Character counters for textareas
        const textareas = document.querySelectorAll('textarea[data-max-length]');
        
        textareas.forEach(textarea => {
            const maxLength = parseInt(textarea.dataset.maxLength);
            const counter = document.createElement('div');
            counter.className = 'text-sm text-gray-400 text-right mt-1';
            counter.textContent = `0/${maxLength}`;
            
            textarea.parentNode.appendChild(counter);

            textarea.addEventListener('input', () => {
                const length = textarea.value.length;
                counter.textContent = `${length}/${maxLength}`;
                
                if (length > maxLength) {
                    counter.classList.add('text-red-400');
                    textarea.classList.add('border-red-400');
                } else {
                    counter.classList.remove('text-red-400');
                    textarea.classList.remove('border-red-400');
                }
            });
        });

        // Live search functionality
        const searchInputs = document.querySelectorAll('[data-search]');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                this.performSearch(input);
            }, 300));
        });
    }

    performSearch(input) {
        const searchTerm = input.value.toLowerCase();
        const targetSelector = input.dataset.search;
        const items = document.querySelectorAll(targetSelector);

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupDashboardCharts() {
        // Simple chart implementation using CSS and data attributes
        const stats = document.querySelectorAll('.stat-card');
        
        stats.forEach(stat => {
            const progress = stat.querySelector('.stat-progress');
            if (progress) {
                const percentage = progress.dataset.percentage;
                setTimeout(() => {
                    progress.style.width = `${percentage}%`;
                }, 500);
            }
        });

        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        }
    }

    initializeCharts() {
        // Projects by category chart
        const projectsCtx = document.getElementById('projectsChart');
        if (projectsCtx) {
            new Chart(projectsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Web Apps', 'Mobile Apps', 'AI/ML', 'Cloud'],
                    datasets: [{
                        data: [12, 5, 8, 3],
                        backgroundColor: [
                            '#22d3ee',
                            '#3b82f6',
                            '#a855f7',
                            '#10b981'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    setupDataTables() {
        // Simple sorting functionality for tables
        const sortableHeaders = document.querySelectorAll('th[data-sort]');
        
        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(header);
            });
        });
    }

    sortTable(header) {
        const table = header.closest('table');
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        const isNumeric = header.dataset.sort === 'numeric';
        const isAscending = !header.classList.contains('asc');
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aValue = a.children[columnIndex].textContent.trim();
            const bValue = b.children[columnIndex].textContent.trim();
            
            if (isNumeric) {
                return isAscending ? aValue - bValue : bValue - aValue;
            } else {
                return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
        });
        
        // Remove existing rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        // Add sorted rows
        rows.forEach(row => tbody.appendChild(row));
        
        // Update header classes
        sortableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
        header.classList.add(isAscending ? 'asc' : 'desc');
    }

    setupAutoSave() {
        const autoSaveForms = document.querySelectorAll('form[data-autosave]');
        
        autoSaveForms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            let autoSaveTimeout;
            
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(() => {
                        this.autoSaveForm(form);
                    }, 2000);
                });
            });
        });
    }

    async autoSaveForm(form) {
        const formData = new FormData(form);
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                this.showNotification('Changes saved automatically', 'success');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentForm();
            }
            
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('[data-search]');
                if (searchInput) searchInput.focus();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    saveCurrentForm() {
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            activeForm.dispatchEvent(new Event('submit'));
        } else {
            this.showNotification('No active form to save', 'info');
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    setupExportFunctionality() {
        const exportButtons = document.querySelectorAll('[data-export]');
        
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                const exportType = button.dataset.export;
                this.exportData(exportType);
            });
        });
    }

    exportData(type) {
        let data, filename, mimeType;
        
        switch (type) {
            case 'projects':
                data = this.getProjectsData();
                filename = 'projects.json';
                mimeType = 'application/json';
                break;
            case 'messages':
                data = this.getMessagesData();
                filename = 'messages.csv';
                mimeType = 'text/csv';
                break;
            default:
                return;
        }
        
        this.downloadFile(data, filename, mimeType);
    }

    getProjectsData() {
        // Implement project data extraction
        return JSON.stringify({ projects: [] }, null, 2);
    }

    getMessagesData() {
        // Implement messages data extraction to CSV
        return 'Name,Email,Subject,Date\n';
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    markFormAsChanged(form) {
        this.unsavedChanges = true;
        form.classList.add('unsaved-changes');
    }

    confirmBeforeUnload(e) {
        if (this.unsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        } text-white font-semibold transform translate-x-full transition-transform duration-300`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'info-circle';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-${icon} mr-2"></i>
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

    // Confirm before delete
    confirmDelete(message = 'Are you sure you want to delete this item?') {
        return confirm(message);
    }

    // Toggle featured status
    toggleFeatured(projectId) {
        fetch(`/admin/projects/${projectId}/toggle-featured`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Project featured status updated', 'success');
                // Update UI
                const featuredIcon = document.querySelector(`[data-project="${projectId}"] .featured-icon`);
                if (featuredIcon) {
                    featuredIcon.className = data.featured ? 
                        'fas fa-star text-yellow-400' : 'far fa-star text-gray-400';
                }
            }
        })
        .catch(error => {
            this.showNotification('Error updating featured status', 'error');
        });
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('admin-page')) {
        window.adminPanel = new AdminPanel();
        
        // Prevent losing unsaved changes
        window.addEventListener('beforeunload', (e) => {
            window.adminPanel.confirmBeforeUnload(e);
        });
        
        // Admin-specific keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + D for dashboard
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                window.location.href = '/admin/dashboard';
            }
            
            // Alt + P for projects
            if (e.altKey && e.key === 'p') {
                e.preventDefault();
                window.location.href = '/admin/projects';
            }
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}
