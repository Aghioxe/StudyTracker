/**
 * Pomodoro Timer Module
 * Focus timer with work/break intervals
 */

const Timer = {
    // Timer state
    timeLeft: 25 * 60, // seconds
    totalTime: 25 * 60,
    isRunning: false,
    interval: null,
    mode: 'work', // work, shortBreak, longBreak

    // Mode configurations
    modes: {
        work: { time: 25, label: 'Work' },
        shortBreak: { time: 5, label: 'Short Break' },
        longBreak: { time: 15, label: 'Long Break' }
    },

    // Audio context for notifications
    audioContext: null,

    /**
     * Initialize timer
     */
    init() {
        this.loadState();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateProgress();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Control buttons
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        const resetBtn = document.getElementById('timerReset');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

        // Mode buttons
        document.querySelectorAll('.timer-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = parseInt(e.target.dataset.time);
                this.setMode(time);
            });
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.saveState();
            }
        });

        // Before unload
        window.addEventListener('beforeunload', () => {
            if (this.isRunning) {
                this.saveState();
            }
        });
    },

    /**
     * Start timer
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateControls();
        this.saveState();

        this.interval = setInterval(() => {
            this.tick();
        }, 1000);

        // Update button states
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
    },

    /**
     * Pause timer
     */
    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.interval);
        this.updateControls();
        this.saveState();

        // Update button states
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    },

    /**
     * Reset timer
     */
    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateProgress();
        this.saveState();

        // Update button states
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    },

    /**
     * Timer tick
     */
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        this.updateProgress();

        if (this.timeLeft <= 0) {
            this.complete();
        }
    },

    /**
     * Timer complete
     */
    complete() {
        this.pause();
        this.playNotificationSound();
        
        // Show notification
        const modeLabel = this.modes[this.mode]?.label || 'Timer';
        UI.showToast(`${modeLabel} completed!`, 'success');

        // Request notification permission and show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Study Tracker', {
                body: `${modeLabel} session completed!`,
                icon: '📚'
            });
        }

        // Reset to default
        this.setMode(25);
    },

    /**
     * Set timer mode
     * @param {number} minutes - Minutes for this mode
     */
    setMode(minutes) {
        this.pause();
        
        // Determine mode
        if (minutes === 25) this.mode = 'work';
        else if (minutes === 5) this.mode = 'shortBreak';
        else if (minutes === 15) this.mode = 'longBreak';

        this.totalTime = minutes * 60;
        this.timeLeft = this.totalTime;
        
        this.updateDisplay();
        this.updateProgress();
        this.updateModeButtons();
        this.saveState();
    },

    /**
     * Update timer display
     */
    updateDisplay() {
        const display = document.getElementById('timerTime');
        if (display) {
            display.textContent = Utils.formatTime(this.timeLeft);
        }

        // Update page title when timer is running
        if (this.isRunning) {
            document.title = `${Utils.formatTime(this.timeLeft)} - Study Tracker`;
        } else {
            document.title = 'Study Tracker - Productivity Dashboard';
        }
    },

    /**
     * Update progress circle
     */
    updateProgress() {
        const progress = document.getElementById('timerProgress');
        if (progress) {
            const circumference = 2 * Math.PI * 45; // r=45
            const offset = circumference - (this.timeLeft / this.totalTime) * circumference;
            progress.style.strokeDashoffset = offset;
        }
    },

    /**
     * Update mode buttons
     */
    updateModeButtons() {
        document.querySelectorAll('.timer-mode').forEach(btn => {
            btn.classList.remove('active');
            const time = parseInt(btn.dataset.time);
            if (time === this.totalTime / 60) {
                btn.classList.add('active');
            }
        });
    },

    /**
     * Update control buttons
     */
    updateControls() {
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');

        if (startBtn) {
            startBtn.textContent = this.isRunning ? 'Running...' : 'Start';
            startBtn.classList.toggle('btn-primary', !this.isRunning);
            startBtn.classList.toggle('btn-secondary', this.isRunning);
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isRunning;
        }
    },

    /**
     * Save timer state
     */
    saveState() {
        const state = {
            timeLeft: this.timeLeft,
            totalTime: this.totalTime,
            isRunning: this.isRunning,
            mode: this.mode,
            timestamp: Date.now()
        };
        Storage.saveTimerState(state);
    },

    /**
     * Load timer state
     */
    loadState() {
        const state = Storage.getTimerState();
        if (!state) return;

        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
        
        if (state.isRunning && elapsed > 0) {
            this.timeLeft = Math.max(0, state.timeLeft - elapsed);
            this.totalTime = state.totalTime;
            this.mode = state.mode;
            
            if (this.timeLeft > 0) {
                this.start();
            } else {
                this.complete();
            }
        } else {
            this.timeLeft = state.timeLeft;
            this.totalTime = state.totalTime;
            this.mode = state.mode;
        }

        this.updateModeButtons();
    },

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);

            // Play second tone
            setTimeout(() => {
                const osc2 = this.audioContext.createOscillator();
                const gain2 = this.audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(this.audioContext.destination);
                osc2.frequency.value = 1000;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                osc2.start(this.audioContext.currentTime);
                osc2.stop(this.audioContext.currentTime + 0.5);
            }, 200);
        } catch (error) {
            console.log('Audio notification not available');
        }
    },

    /**
     * Request notification permission
     */
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};

// Request notification permission on user interaction
document.addEventListener('click', () => {
    Timer.requestNotificationPermission();
}, { once: true });
