/**
 * UI Module
 * DOM manipulation, rendering, and user interface interactions
 */

const UI = {
    // Toast container
    toastContainer: null,

    /**
     * Initialize UI
     */
    init() {
        this.toastContainer = document.getElementById('toastContainer');
        this.setupEventListeners();
        this.setupTheme();
        this.render();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Task form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        }

        // Filters
        const searchInput = document.getElementById('searchInput');
        const filterStatus = document.getElementById('filterStatus');
        const filterCategory = document.getElementById('filterCategory');
        const sortBy = document.getElementById('sortBy');

        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                TaskManager.setFilter('status', e.target.value);
                this.renderTasks();
            });
        }

        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                TaskManager.setFilter('category', e.target.value);
                this.renderTasks();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                TaskManager.setFilter('sortBy', e.target.value);
                this.renderTasks();
            });
        }

        // Clear completed
        const clearBtn = document.getElementById('clearCompleted');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearCompleted());
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Export/Import
        const exportBtn = document.getElementById('exportData');
        const importBtn = document.getElementById('importData');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.handleImport(e));
        }

        // Modal
        this.setupModalListeners();

        // Set today's date as min for deadline
        const deadlineInput = document.getElementById('taskDeadline');
        if (deadlineInput) {
            deadlineInput.min = Utils.getTodayString();
            deadlineInput.value = Utils.getTodayString();
        }
    },

    /**
     * Setup theme
     */
    setupTheme() {
        const savedTheme = Storage.getTheme();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcon('dark');
        }
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.saveTheme(newTheme);
        this.updateThemeIcon(newTheme);
        
        // Update charts
        Charts.updateTheme();
    },

    /**
     * Update theme icon
     * @param {string} theme - Current theme
     */
    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    /**
     * Setup modal listeners
     */
    setupModalListeners() {
        const modal = document.getElementById('editModal');
        if (!modal) return;

        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const form = document.getElementById('editForm');

        const closeModal = () => modal.classList.remove('active');

        if (overlay) overlay.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    },

    /**
     * Handle task form submission
     * @param {Event} e - Submit event
     */
    handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            deadline: formData.get('deadline')
        };

        const task = TaskManager.create(taskData);
        
        if (task) {
            this.showToast('Task added successfully!', 'success');
            e.target.reset();
            
            // Reset deadline to today
            const deadlineInput = document.getElementById('taskDeadline');
            if (deadlineInput) {
                deadlineInput.value = Utils.getTodayString();
            }
            
            this.render();
        }
    },

    /**
     * Handle search
     * @param {string} query - Search query
     */
    handleSearch(query) {
        TaskManager.setFilter('search', query);
        this.renderTasks();
    },

    /**
     * Handle clear completed
     */
    handleClearCompleted() {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            const count = TaskManager.clearCompleted();
            this.showToast(`${count} task(s) deleted`, 'info');
            this.render();
        }
    },

    /**
     * Handle task completion
     * @param {string} id - Task ID
     */
    handleComplete(id) {
        const task = TaskManager.update(id, { status: 'completed' });
        if (task) {
            this.showToast('Task completed! 🎉', 'success');
            
            // Confetti effect
            const button = document.querySelector(`[data-task-id="${id}"] .btn-icon.complete`);
            if (button) {
                Utils.createConfetti(button);
            }
            
            this.render();
        }
    },

    /**
     * Handle task deletion
     * @param {string} id - Task ID
     */
    handleDelete(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            if (TaskManager.delete(id)) {
                this.showToast('Task deleted', 'info');
                this.render();
            }
        }
    },

    /**
     * Handle task edit
     * @param {string} id - Task ID
     */
    handleEdit(id) {
        const task = TaskManager.getById(id);
        if (!task) return;

        const modal = document.getElementById('editModal');
        if (!modal) return;

        // Populate form
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editDescription').value = task.description || '';
        document.getElementById('editCategory').value = task.category;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editDeadline').value = task.deadline;
        document.getElementById('editStatus').value = task.status;

        modal.classList.add('active');
    },

    /**
     * Handle edit form submission
     * @param {Event} e - Submit event
     */
    handleEditSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('editTaskId').value;
        const updates = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            category: document.getElementById('editCategory').value,
            priority: document.getElementById('editPriority').value,
            deadline: document.getElementById('editDeadline').value,
            status: document.getElementById('editStatus').value
        };

        const task = TaskManager.update(id, updates);
        if (task) {
            this.showToast('Task updated successfully!', 'success');
            document.getElementById('editModal').classList.remove('active');
            this.render();
        }
    },

    /**
     * Handle status change
     * @param {string} id - Task ID
     * @param {string} status - New status
     */
    handleStatusChange(id, status) {
        const task = TaskManager.update(id, { status });
        if (task) {
            const statusLabels = {
                'pending': 'moved to pending',
                'in-progress': 'started',
                'completed': 'completed! 🎉',
                'skipped': 'skipped'
            };
            this.showToast(`Task ${statusLabels[status]}`, 'success');
            this.render();
        }
    },

    /**
     * Handle export
     */
    handleExport() {
        Storage.backup();
        this.showToast('Data exported successfully!', 'success');
    },

    /**
     * Handle import
     * @param {Event} e - Change event
     */
    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const success = await Storage.restore(file);
            if (success) {
                TaskManager.init();
                this.showToast('Data imported successfully!', 'success');
                this.render();
            } else {
                this.showToast('Failed to import data', 'error');
            }
        } catch (error) {
            this.showToast('Invalid file format', 'error');
        }

        e.target.value = ''; // Reset input
    },

    /**
     * Render everything
     */
    render() {
        this.renderStats();
        this.renderTasks();
        Charts.update();
    },

    /**
     * Render statistics
     */
    renderStats() {
        const stats = TaskManager.getStats();
        
        const totalEl = document.getElementById('totalTasks');
        const completedEl = document.getElementById('completedTasks');
        const rateEl = document.getElementById('completionRate');

        if (totalEl) Utils.animateNumber(totalEl, stats.total);
        if (completedEl) Utils.animateNumber(completedEl, stats.completed);
        if (rateEl) rateEl.textContent = `${stats.completionRate}%`;
    },

    /**
     * Render task list
     */
    renderTasks() {
        const container = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const clearBtn = document.getElementById('clearCompleted');
        
        if (!container) return;

        const tasks = TaskManager.getFiltered();

        // Show/hide empty state
        if (tasks.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.add('active');
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.classList.remove('active');
        
        // Show clear button if there are completed tasks
        const hasCompleted = tasks.some(t => t.status === 'completed');
        if (clearBtn) clearBtn.style.display = hasCompleted ? 'block' : 'none';

        // Render tasks
        container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');

        // Add event listeners to task buttons
        tasks.forEach(task => {
            const el = container.querySelector(`[data-task-id="${task.id}"]`);
            if (!el) return;

            const completeBtn = el.querySelector('.btn-icon.complete');
            const editBtn = el.querySelector('.btn-icon.edit');
            const deleteBtn = el.querySelector('.btn-icon.delete');

            if (completeBtn) {
                completeBtn.addEventListener('click', () => this.handleComplete(task.id));
            }
            if (editBtn) {
                editBtn.addEventListener('click', () => this.handleEdit(task.id));
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.handleDelete(task.id));
            }
        });
    },

    /**
     * Create task HTML
     * @param {object} task - Task object
     * @returns {string} HTML string
     */
    createTaskHTML(task) {
        const isOverdue = Utils.isOverdue(task.deadline) && task.status !== 'completed';
        const isDueSoon = Utils.isDueSoon(task.deadline) && task.status !== 'completed';
        
        const deadlineClass = isOverdue ? 'overdue' : (isDueSoon ? 'due-soon' : '');
        const deadlineIcon = isOverdue ? '⚠️' : '📅';

        return `
            <div class="task-item ${task.status}" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <h3 class="task-title">${Utils.escapeHtml(task.title)}</h3>
                    <div class="task-badges">
                        <span class="badge ${task.category}">${this.getCategoryLabel(task.category)}</span>
                        <span class="badge priority-${task.priority}">${task.priority}</span>
                        <span class="badge status-${task.status}">${task.status.replace('-', ' ')}</span>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${Utils.escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="task-deadline ${deadlineClass}">
                        ${deadlineIcon} ${Utils.formatDate(task.deadline)}
                    </span>
                    <div class="task-actions">
                        ${task.status !== 'completed' ? `
                            <button class="btn-icon complete" title="Complete task">
                                ✓
                            </button>
                        ` : ''}
                        <button class="btn-icon edit" title="Edit task">
                            ✎
                        </button>
                        <button class="btn-icon delete" title="Delete task">
                            🗑
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get category label
     * @param {string} category - Category code
     * @returns {string} Label
     */
    getCategoryLabel(category) {
        const labels = {
            study: '📖 Study',
            work: '💼 Work',
            personal: '🏠 Personal',
            health: '💪 Health'
        };
        return labels[category] || category;
    },

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type (success, error, info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove
        const timeout = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeToast(toast);
        });
    },

    /**
     * Remove toast with animation
     * @param {HTMLElement} toast - Toast element
     */
    removeToast(toast) {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }
};
