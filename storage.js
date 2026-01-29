/**
 * Storage Module
 * Handles LocalStorage operations with error handling and data validation
 */

const Storage = {
    // Storage keys
    KEYS: {
        TASKS: 'study_tracker_tasks',
        THEME: 'study_tracker_theme',
        TIMER: 'study_tracker_timer',
        STATS: 'study_tracker_stats'
    },

    /**
     * Save data to LocalStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     * @returns {boolean} Success status
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.showStorageError('Storage is full. Please delete some tasks or export data.');
            }
            return false;
        }
    },

    /**
     * Load data from LocalStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Parsed data or default value
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from LocalStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    /**
     * Clear all app data from LocalStorage
     */
    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    },

    /**
     * Get storage usage info
     * @returns {object} Usage statistics
     */
    getUsage() {
        let totalSize = 0;
        const items = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            totalSize += size;
            items[key] = { size, sizeKB: (size / 1024).toFixed(2) };
        }
        
        return {
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            itemCount: localStorage.length,
            items
        };
    },

    /**
     * Check if storage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Export all app data
     * @returns {object} All app data
     */
    exportData() {
        const data = {};
        Object.values(this.KEYS).forEach(key => {
            data[key] = this.load(key);
        });
        data.exportDate = new Date().toISOString();
        data.version = '1.0';
        return data;
    },

    /**
     * Import app data
     * @param {object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            Object.entries(data).forEach(([key, value]) => {
                if (Object.values(this.KEYS).includes(key)) {
                    this.save(key, value);
                }
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },

    /**
     * Backup data to file
     */
    backup() {
        const data = this.exportData();
        const filename = `study-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        Utils.downloadJSON(data, filename);
    },

    /**
     * Restore data from file
     * @param {File} file - Backup file
     * @returns {Promise<boolean>}
     */
    async restore(file) {
        try {
            const data = await Utils.readJSONFile(file);
            return this.importData(data);
        } catch (error) {
            console.error('Restore error:', error);
            return false;
        }
    },

    /**
     * Show storage error notification
     * @param {string} message - Error message
     */
    showStorageError(message) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    // Task-specific methods
    
    /**
     * Get all tasks
     * @returns {Array}
     */
    getTasks() {
        return this.load(this.KEYS.TASKS, []);
    },

    /**
     * Save tasks
     * @param {Array} tasks - Tasks array
     * @returns {boolean}
     */
    saveTasks(tasks) {
        return this.save(this.KEYS.TASKS, tasks);
    },

    /**
     * Add new task
     * @param {object} task - Task object
     * @returns {boolean}
     */
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        return this.saveTasks(tasks);
    },

    /**
     * Update task
     * @param {string} id - Task ID
     * @param {object} updates - Updates to apply
     * @returns {boolean}
     */
    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            return this.saveTasks(tasks);
        }
        return false;
    },

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {boolean}
     */
    deleteTask(id) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== id);
        return this.saveTasks(filtered);
    },

    // Theme methods
    
    /**
     * Get saved theme
     * @returns {string|null}
     */
    getTheme() {
        return this.load(this.KEYS.THEME);
    },

    /**
     * Save theme preference
     * @param {string} theme - Theme name
     */
    saveTheme(theme) {
        this.save(this.KEYS.THEME, theme);
    },

    // Timer methods
    
    /**
     * Get timer state
     * @returns {object|null}
     */
    getTimerState() {
        return this.load(this.KEYS.TIMER);
    },

    /**
     * Save timer state
     * @param {object} state - Timer state
     */
    saveTimerState(state) {
        this.save(this.KEYS.TIMER, state);
    },

    /**
     * Clear timer state
     */
    clearTimerState() {
        this.remove(this.KEYS.TIMER);
    },

    // Stats methods
    
    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return this.load(this.KEYS.STATS, {
            totalTasksCreated: 0,
            totalTasksCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            dailyStats: {}
        });
    },

    /**
     * Save statistics
     * @param {object} stats - Statistics object
     */
    saveStats(stats) {
        this.save(this.KEYS.STATS, stats);
    },

    /**
     * Update daily stats
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {object} data - Stats data
     */
    updateDailyStats(date, data) {
        const stats = this.getStats();
        if (!stats.dailyStats) stats.dailyStats = {};
        
        if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { completed: 0, created: 0 };
        }
        
        stats.dailyStats[date] = { ...stats.dailyStats[date], ...data };
        this.saveStats(stats);
    },

    /**
     * Get tasks completed on specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {number}
     */
    getCompletedCountByDate(date) {
        const tasks = this.getTasks();
        return tasks.filter(t => 
            t.status === 'completed' && 
            t.completedAt && 
            t.completedAt.startsWith(date)
        ).length;
    }
};

// Initialize storage on load
document.addEventListener('DOMContentLoaded', () => {
    if (!Storage.isAvailable()) {
        console.warn('LocalStorage is not available. Data will not persist.');
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Warning: Your browser does not support local storage. Data will not be saved.', 'error');
        }
    }
});
