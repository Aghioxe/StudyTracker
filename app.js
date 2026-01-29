/**
 * Study Tracker - Main Application
 * Productivity dashboard with task management, analytics, and Pomodoro timer
 * 
 * @version 1.0.0
 * @author CS Portfolio Project
 */

// Application namespace
const App = {
    /**
     * Application version
     */
    version: '1.0.0',

    /**
     * Initialize application
     */
    init() {
        console.log(`🚀 Study Tracker v${this.version} initializing...`);

        // Check for LocalStorage support
        if (!Storage.isAvailable()) {
            console.warn('LocalStorage not available - data will not persist');
        }

        // Initialize modules
        TaskManager.init();
        UI.init();
        Timer.init();
        Charts.init();

        // Setup drag and drop
        this.setupDragAndDrop();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Add demo data if first visit
        this.addDemoData();

        // Update daily
        this.checkDailyReset();

        console.log('✅ Study Tracker initialized successfully');
        console.log(`📊 ${TaskManager.getAll().length} tasks loaded`);
    },

    /**
     * Setup drag and drop for tasks
     */
    setupDragAndDrop() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        let draggedItem = null;

        taskList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        taskList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });

        taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(taskList, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    taskList.appendChild(draggedItem);
                } else {
                    taskList.insertBefore(draggedItem, afterElement);
                }
            }
        });

        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            // Could implement reordering persistence here
        });
    },

    /**
     * Get element after drag position
     * @param {HTMLElement} container - Container element
     * @param {number} y - Mouse Y position
     * @returns {HTMLElement|null}
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N - New task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskTitle')?.focus();
            }

            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }

            // Ctrl/Cmd + D - Toggle dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                UI.toggleTheme();
            }

            // Escape - Close modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('editModal');
                if (modal?.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            }
        });
    },

    /**
     * Add demo data for first-time users
     */
    addDemoData() {
        const tasks = TaskManager.getAll();
        
        // Only add demo data if no tasks exist
        if (tasks.length === 0) {
            console.log('📝 Adding demo data...');

            const demoTasks = [
                {
                    title: 'Complete CS Assignment',
                    description: 'Finish the data structures homework before the deadline.',
                    category: 'study',
                    priority: 'high',
                    deadline: Utils.getTodayString(),
                    status: 'in-progress'
                },
                {
                    title: 'Read Research Paper',
                    description: 'Read and summarize the latest ML research paper.',
                    category: 'study',
                    priority: 'medium',
                    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    status: 'pending'
                },
                {
                    title: 'Morning Exercise',
                    description: '30 minutes of cardio workout.',
                    category: 'health',
                    priority: 'medium',
                    deadline: Utils.getTodayString(),
                    status: 'completed',
                    completedAt: new Date().toISOString()
                },
                {
                    title: 'Update Resume',
                    description: 'Update CV with recent projects and skills.',
                    category: 'work',
                    priority: 'low',
                    deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                    status: 'pending'
                }
            ];

            demoTasks.forEach(task => {
                TaskManager.create(task);
            });

            UI.showToast('Welcome! Demo tasks have been added.', 'info', 5000);
        }
    },

    /**
     * Check and handle daily reset
     */
    checkDailyReset() {
        const stats = Storage.getStats();
        const today = Utils.getTodayString();
        
        if (stats.lastActiveDate && stats.lastActiveDate !== today) {
            // New day - could show daily summary here
            console.log('📅 New day detected');
            
            // Check streak
            const lastDate = new Date(stats.lastActiveDate);
            const todayDate = new Date(today);
            const diffDays = (todayDate - lastDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays > 1) {
                // Streak broken
                UI.showToast('Your streak was reset. Start fresh today! 💪', 'info');
            }
        }
    },

    /**
     * Get application info
     * @returns {object}
     */
    getInfo() {
        return {
            version: this.version,
            tasks: TaskManager.getStats(),
            storage: Storage.getUsage(),
            theme: document.documentElement.getAttribute('data-theme') || 'light'
        };
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose to global scope for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.StudyTracker = App;
}
