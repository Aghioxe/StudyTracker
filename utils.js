/**
 * Utility Functions
 * Helper functions for dates, formatting, and DOM manipulation
 */

const Utils = {
    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset time for comparison
        const dateNoTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowNoTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

        if (dateNoTime.getTime() === todayNoTime.getTime()) {
            return 'Today';
        } else if (dateNoTime.getTime() === tomorrowNoTime.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    },

    /**
     * Check if date is overdue
     * @param {string} dateString - ISO date string
     * @returns {boolean}
     */
    isOverdue(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    },

    /**
     * Check if date is due soon (within 2 days)
     * @param {string} dateString - ISO date string
     * @returns {boolean}
     */
    isDueSoon(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);
        
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        twoDaysFromNow.setHours(0, 0, 0, 0);
        
        return date >= today && date <= twoDaysFromNow;
    },

    /**
     * Get relative time string
     * @param {string} dateString - ISO date string
     * @returns {string}
     */
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Raw text
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Milliseconds limit
     * @returns {Function}
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Get today's date in YYYY-MM-DD format
     * @returns {string}
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Get date N days ago
     * @param {number} days - Number of days
     * @returns {Date}
     */
    getDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    },

    /**
     * Format time (seconds to MM:SS)
     * @param {number} seconds - Total seconds
     * @returns {string}
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Get category color
     * @param {string} category - Category name
     * @returns {string} Color code
     */
    getCategoryColor(category) {
        const colors = {
            study: '#6366f1',
            work: '#10b981',
            personal: '#f59e0b',
            health: '#ef4444'
        };
        return colors[category] || '#94a3b8';
    },

    /**
     * Get priority value for sorting
     * @param {string} priority - Priority level
     * @returns {number}
     */
    getPriorityValue(priority) {
        const values = { high: 3, medium: 2, low: 1 };
        return values[priority] || 0;
    },

    /**
     * Get status value for sorting
     * @param {string} status - Status name
     * @returns {number}
     */
    getStatusValue(status) {
        const values = { 'in-progress': 1, pending: 2, completed: 3, skipped: 4 };
        return values[status] || 0;
    },

    /**
     * Animate number counting
     * @param {HTMLElement} element - Element to animate
     * @param {number} target - Target number
     * @param {number} duration - Animation duration
     */
    animateNumber(element, target, duration = 500) {
        const start = parseInt(element.textContent) || 0;
        const range = target - start;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const current = Math.round(start + range * easeProgress);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    },

    /**
     * Create confetti effect
     * @param {HTMLElement} element - Origin element
     */
    createConfetti(element) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = centerX + 'px';
            confetti.style.top = centerY + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            
            const angle = (Math.PI * 2 * i) / 30;
            const velocity = 5 + Math.random() * 5;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - 5;
            
            document.body.appendChild(confetti);
            
            let x = centerX;
            let y = centerY;
            let opacity = 1;
            
            const animate = () => {
                x += vx;
                y += vy + (10 - opacity * 10);
                opacity -= 0.02;
                confetti.style.left = x + 'px';
                confetti.style.top = y + 'px';
                confetti.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    confetti.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    },

    /**
     * Download data as JSON file
     * @param {object} data - Data to download
     * @param {string} filename - Filename
     */
    downloadJSON(data, filename = 'data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Read file as JSON
     * @param {File} file - File to read
     * @returns {Promise<object>}
     */
    readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    resolve(JSON.parse(e.target.result));
                } catch (err) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Get days in month
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {number}
     */
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    /**
     * Get week number
     * @param {Date} date - Date
     * @returns {number}
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * Group array by key
     * @param {Array} array - Array to group
     * @param {string} key - Key to group by
     * @returns {object}
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) result[groupKey] = [];
            result[groupKey].push(item);
            return result;
        }, {});
    },

    /**
     * Sort array by multiple criteria
     * @param {Array} array - Array to sort
     * @param {Array} criteria - Sort criteria [{key, order}]
     * @returns {Array}
     */
    multiSort(array, criteria) {
        return [...array].sort((a, b) => {
            for (const { key, order = 'asc' } of criteria) {
                let valA = a[key];
                let valB = b[key];
                
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                
                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
