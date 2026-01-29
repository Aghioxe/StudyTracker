/**
 * Task Manager Module
 * Core business logic for task CRUD operations and filtering
 */

const TaskManager = {
    // Current tasks array
    tasks: [],
    
    // Current filter/sort state
    filters: {
        status: 'all',
        category: 'all',
        search: '',
        sortBy: 'newest'
    },

    /**
     * Initialize task manager
     */
    init() {
        this.tasks = Storage.getTasks();
        this.migrateOldData();
        return this;
    },

    /**
     * Migrate old data format if needed
     */
    migrateOldData() {
        const needsMigration = this.tasks.some(task => 
            !task.id || typeof task.id === 'number'
        );
        
        if (needsMigration) {
            this.tasks = this.tasks.map(task => ({
                ...task,
                id: task.id ? String(task.id) : Utils.generateId(),
                priority: task.priority || 'medium',
                createdAt: task.createdAt || new Date().toISOString()
            }));
            this.save();
        }
    },

    /**
     * Create new task
     * @param {object} taskData - Task data
     * @returns {object} Created task
     */
    create(taskData) {
        const task = {
            id: Utils.generateId(),
            title: taskData.title.trim(),
            description: (taskData.description || '').trim(),
            category: taskData.category || 'study',
            priority: taskData.priority || 'medium',
            deadline: taskData.deadline,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.save();
        
        // Update stats
        this.updateStats('created');
        
        return task;
    },

    /**
     * Update existing task
     * @param {string} id - Task ID
     * @param {object} updates - Updates to apply
     * @returns {object|null} Updated task or null
     */
    update(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return null;

        const oldStatus = this.tasks[index].status;
        const newStatus = updates.status;

        // Handle status change to completed
        if (newStatus === 'completed' && oldStatus !== 'completed') {
            updates.completedAt = new Date().toISOString();
            this.updateStats('completed');
            
            // Update daily stats
            const today = Utils.getTodayString();
            Storage.updateDailyStats(today, { 
                completed: Storage.getCompletedCountByDate(today) + 1 
            });
        }
        
        // Handle status change from completed
        if (oldStatus === 'completed' && newStatus !== 'completed') {
            updates.completedAt = null;
        }

        this.tasks[index] = { ...this.tasks[index], ...updates };
        this.save();
        
        return this.tasks[index];
    },

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {boolean}
     */
    delete(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== id);
        
        if (this.tasks.length < initialLength) {
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Get task by ID
     * @param {string} id - Task ID
     * @returns {object|null}
     */
    getById(id) {
        return this.tasks.find(t => t.id === id) || null;
    },

    /**
     * Get all tasks
     * @returns {Array}
     */
    getAll() {
        return [...this.tasks];
    },

    /**
     * Get filtered and sorted tasks
     * @returns {Array}
     */
    getFiltered() {
        let result = [...this.tasks];

        // Apply status filter
        if (this.filters.status !== 'all') {
            result = result.filter(t => t.status === this.filters.status);
        }

        // Apply category filter
        if (this.filters.category !== 'all') {
            result = result.filter(t => t.category === this.filters.category);
        }

        // Apply search filter
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        result = this.sortTasks(result, this.filters.sortBy);

        return result;
    },

    /**
     * Sort tasks
     * @param {Array} tasks - Tasks to sort
     * @param {string} sortBy - Sort criteria
     * @returns {Array}
     */
    sortTasks(tasks, sortBy) {
        const sorted = [...tasks];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                
            case 'deadline':
                return sorted.sort((a, b) => {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
                
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return sorted.sort((a, b) => 
                    priorityOrder[a.priority] - priorityOrder[b.priority]
                );
                
            case 'alphabetical':
                return sorted.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                
            default:
                return sorted;
        }
    },

    /**
     * Set filter
     * @param {string} key - Filter key
     * @param {*} value - Filter value
     */
    setFilter(key, value) {
        this.filters[key] = value;
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {
            status: 'all',
            category: 'all',
            search: '',
            sortBy: 'newest'
        };
    },

    /**
     * Get tasks by status
     * @param {string} status - Status to filter by
     * @returns {Array}
     */
    getByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    },

    /**
     * Get tasks by category
     * @param {string} category - Category to filter by
     * @returns {Array}
     */
    getByCategory(category) {
        return this.tasks.filter(t => t.category === category);
    },

    /**
     * Get overdue tasks
     * @returns {Array}
     */
    getOverdue() {
        return this.tasks.filter(t => 
            t.status !== 'completed' && 
            t.status !== 'skipped' && 
            t.deadline && 
            Utils.isOverdue(t.deadline)
        );
    },

    /**
     * Get tasks due today
     * @returns {Array}
     */
    getDueToday() {
        const today = Utils.getTodayString();
        return this.tasks.filter(t => 
            t.status !== 'completed' && 
            t.status !== 'skipped' && 
            t.deadline === today
        );
    },

    /**
     * Get completion statistics
     * @returns {object}
     */
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const skipped = this.tasks.filter(t => t.status === 'skipped').length;
        
        return {
            total,
            completed,
            pending,
            inProgress,
            skipped,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    },

    /**
     * Get category distribution
     * @returns {object}
     */
    getCategoryDistribution() {
        const distribution = {};
        const categories = ['study', 'work', 'personal', 'health'];
        
        categories.forEach(cat => {
            distribution[cat] = this.tasks.filter(t => t.category === cat).length;
        });
        
        return distribution;
    },

    /**
     * Get weekly completion data
     * @returns {object}
     */
    getWeeklyData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = new Array(7).fill(0);
        const today = new Date();
        
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = this.tasks.filter(t => 
                t.status === 'completed' && 
                t.completedAt && 
                t.completedAt.startsWith(dateStr)
            ).length;
            
            data[6 - i] = count;
        }
        
        // Get day labels for last 7 days
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(days[date.getDay()]);
        }
        
        return { labels, data };
    },

    /**
     * Get daily activity for contribution graph
     * @param {number} days - Number of days to get
     * @returns {Array}
     */
    getDailyActivity(days = 30) {
        const activity = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const completed = this.tasks.filter(t => 
                t.status === 'completed' && 
                t.completedAt && 
                t.completedAt.startsWith(dateStr)
            ).length;
            
            activity.push({
                date: dateStr,
                count: completed,
                level: this.getActivityLevel(completed)
            });
        }
        
        return activity;
    },

    /**
     * Get activity level based on completed tasks
     * @param {number} count - Number of completed tasks
     * @returns {number} Level 0-4
     */
    getActivityLevel(count) {
        if (count === 0) return 0;
        if (count === 1) return 1;
        if (count <= 3) return 2;
        if (count <= 5) return 3;
        return 4;
    },

    /**
     * Get current streak
     * @returns {number}
     */
    getStreak() {
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const completed = this.tasks.filter(t => 
                t.status === 'completed' && 
                t.completedAt && 
                t.completedAt.startsWith(dateStr)
            ).length;
            
            if (completed > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    },

    /**
     * Clear all completed tasks
     * @returns {number} Number of tasks cleared
     */
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.status === 'completed').length;
        this.tasks = this.tasks.filter(t => t.status !== 'completed');
        this.save();
        return completedCount;
    },

    /**
     * Bulk update tasks
     * @param {Array} ids - Task IDs to update
     * @param {object} updates - Updates to apply
     * @returns {number} Number of tasks updated
     */
    bulkUpdate(ids, updates) {
        let count = 0;
        ids.forEach(id => {
            if (this.update(id, updates)) count++;
        });
        return count;
    },

    /**
     * Bulk delete tasks
     * @param {Array} ids - Task IDs to delete
     * @returns {number} Number of tasks deleted
     */
    bulkDelete(ids) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => !ids.includes(t.id));
        if (this.tasks.length < initialLength) {
            this.save();
        }
        return initialLength - this.tasks.length;
    },

    /**
     * Save tasks to storage
     */
    save() {
        Storage.saveTasks(this.tasks);
    },

    /**
     * Update statistics
     * @param {string} action - Action type
     */
    updateStats(action) {
        const stats = Storage.getStats();
        
        if (action === 'created') {
            stats.totalTasksCreated++;
        } else if (action === 'completed') {
            stats.totalTasksCompleted++;
        }
        
        // Update streak
        const today = Utils.getTodayString();
        const lastActive = stats.lastActiveDate;
        
        if (lastActive) {
            const lastDate = new Date(lastActive);
            const todayDate = new Date(today);
            const diffDays = (todayDate - lastDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                stats.currentStreak++;
            } else if (diffDays > 1) {
                stats.currentStreak = 1;
            }
        } else {
            stats.currentStreak = 1;
        }
        
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
        
        stats.lastActiveDate = today;
        Storage.saveStats(stats);
    },

    /**
     * Export tasks to JSON
     */
    export() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        Utils.downloadJSON(data, `tasks-${Utils.getTodayString()}.json`);
    },

    /**
     * Import tasks from JSON
     * @param {object} data - Import data
     * @returns {number} Number of tasks imported
     */
    import(data) {
        if (!data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('Invalid task data');
        }
        
        const newTasks = data.tasks.map(t => ({
            ...t,
            id: Utils.generateId(), // Generate new IDs to avoid conflicts
            createdAt: t.createdAt || new Date().toISOString()
        }));
        
        this.tasks = [...this.tasks, ...newTasks];
        this.save();
        return newTasks.length;
    }
};
