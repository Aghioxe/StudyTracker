/**
 * Charts Module
 * Data visualization using Chart.js
 */

const Charts = {
    // Chart instances
    categoryChart: null,
    weeklyChart: null,

    // Default chart colors
    colors: {
        study: '#6366f1',
        work: '#10b981',
        personal: '#f59e0b',
        health: '#ef4444',
        primary: 'rgba(99, 102, 241, 0.8)',
        primaryLight: 'rgba(99, 102, 241, 0.2)',
        success: 'rgba(16, 185, 129, 0.8)',
        grid: 'rgba(148, 163, 184, 0.1)',
        text: '#64748b'
    },

    /**
     * Initialize all charts
     */
    init() {
        this.initCategoryChart();
        this.initWeeklyChart();
        this.update();
    },

    /**
     * Initialize category distribution chart (Doughnut)
     */
    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Study', 'Work', 'Personal', 'Health'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        this.colors.study,
                        this.colors.work,
                        this.colors.personal,
                        this.colors.health
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: textColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f8fafc' : '#1e293b',
                        bodyColor: isDark ? '#cbd5e1' : '#475569',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} tasks (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Initialize weekly progress chart (Bar)
     */
    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';

        this.weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Completed Tasks',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: this.colors.primary,
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f8fafc' : '#1e293b',
                        bodyColor: isDark ? '#cbd5e1' : '#475569',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y || 0;
                                return `${value} task${value !== 1 ? 's' : ''} completed`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            },
                            stepSize: 1,
                            precision: 0
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    /**
     * Update all charts with current data
     */
    update() {
        this.updateCategoryChart();
        this.updateWeeklyChart();
        this.renderContributionGraph();
    },

    /**
     * Update category chart
     */
    updateCategoryChart() {
        if (!this.categoryChart) return;

        const distribution = TaskManager.getCategoryDistribution();
        const data = [
            distribution.study || 0,
            distribution.work || 0,
            distribution.personal || 0,
            distribution.health || 0
        ];

        this.categoryChart.data.datasets[0].data = data;
        this.categoryChart.update('active');
    },

    /**
     * Update weekly chart
     */
    updateWeeklyChart() {
        if (!this.weeklyChart) return;

        const weeklyData = TaskManager.getWeeklyData();
        
        this.weeklyChart.data.labels = weeklyData.labels;
        this.weeklyChart.data.datasets[0].data = weeklyData.data;
        this.weeklyChart.update('active');
    },

    /**
     * Render contribution graph (GitHub-style heatmap)
     */
    renderContributionGraph() {
        const container = document.getElementById('contributionGraph');
        if (!container) return;

        const activity = TaskManager.getDailyActivity(30);
        container.innerHTML = '';

        activity.forEach(day => {
            const cell = document.createElement('div');
            cell.className = `contrib-cell level-${day.level}`;
            cell.title = `${day.date}: ${day.count} task${day.count !== 1 ? 's' : ''} completed`;
            container.appendChild(cell);
        });
    },

    /**
     * Update chart colors when theme changes
     */
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';

        // Update category chart
        if (this.categoryChart) {
            this.categoryChart.options.plugins.legend.labels.color = textColor;
            this.categoryChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            this.categoryChart.options.plugins.tooltip.titleColor = isDark ? '#f8fafc' : '#1e293b';
            this.categoryChart.options.plugins.tooltip.bodyColor = isDark ? '#cbd5e1' : '#475569';
            this.categoryChart.options.plugins.tooltip.borderColor = isDark ? '#334155' : '#e2e8f0';
            this.categoryChart.update('none');
        }

        // Update weekly chart
        if (this.weeklyChart) {
            this.weeklyChart.options.scales.x.ticks.color = textColor;
            this.weeklyChart.options.scales.y.ticks.color = textColor;
            this.weeklyChart.options.scales.y.grid.color = gridColor;
            this.weeklyChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            this.weeklyChart.options.plugins.tooltip.titleColor = isDark ? '#f8fafc' : '#1e293b';
            this.weeklyChart.options.plugins.tooltip.bodyColor = isDark ? '#cbd5e1' : '#475569';
            this.weeklyChart.options.plugins.tooltip.borderColor = isDark ? '#334155' : '#e2e8f0';
            this.weeklyChart.update('none');
        }
    },

    /**
     * Create mini progress chart (Canvas)
     * @param {HTMLElement} canvas - Canvas element
     * @param {number} percentage - Progress percentage
     */
    createProgressRing(canvas, percentage) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const center = size / 2;
        const radius = (size - 10) / 2;
        const circumference = 2 * Math.PI * radius;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Background circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'var(--border)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Progress circle
        const offset = circumference - (percentage / 100) * circumference;
        ctx.beginPath();
        ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + (percentage / 100) * 2 * Math.PI);
        ctx.strokeStyle = 'var(--primary)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Text
        ctx.font = 'bold 20px Inter';
        ctx.fillStyle = 'var(--text)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, center, center);
    },

    /**
     * Destroy all charts
     */
    destroy() {
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        if (this.weeklyChart) {
            this.weeklyChart.destroy();
            this.weeklyChart = null;
        }
    },

    /**
     * Reinitialize charts (useful after theme change)
     */
    reinit() {
        this.destroy();
        this.init();
    }
};
