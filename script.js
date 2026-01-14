const FREE_TIME = 10;
const FOCUS_TIME = 25;
const BREAK_TIME = 5;

document.addEventListener('DOMContentLoaded', () => {
	const renameBtn = document.getElementById('rename');
	if (!renameBtn) return;

	function createTitleElement(text) {
		const h6 = document.createElement('h6');
		h6.className = 'txt-lg btn-wide';
		h6.id = 'focus_title_text';
		h6.textContent = text;
		return h6;
	}

	function createInput(value) {
		const input = document.createElement('input');
		input.type = 'text';
		input.id = 'focus_title_input';
		input.className = 'input input-sm';
		input.value = value;
		input.placeholder = 'Type the new focus title here';
		return input;
	}

	renameBtn.addEventListener('click', () => {
		const existingInput = document.getElementById('focus_title_input');
		if (existingInput) {
			const newText = existingInput.value.trim() || 'Focus Title';
			const newH6 = createTitleElement(newText);
			existingInput.replaceWith(newH6);
		} else {
			const titleEl = document.getElementById('focus_title_text');
			const currentText = titleEl ? titleEl.textContent : '';
			const input = createInput(currentText);
			if (titleEl) titleEl.replaceWith(input);
			input.focus();
			input.select();

			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					renameBtn.click();
				} else if (e.key === 'Escape') {
					const origH6 = createTitleElement(currentText || 'Focus Title');
					input.replaceWith(origH6);
				}
			});
		}
	});

	/* Pomodoro timer implementation */
	const playPauseBtn = document.getElementById('play_pause');
	const skipBtn = document.getElementById('skip');
	const restartBtn = document.getElementById('restart');
	const clockContainer = document.getElementById('clock');
	const countdownSpan = clockContainer ? clockContainer.querySelector('.countdown') : null;
	const pomodoroStageEl = document.getElementById('pomodoro_stage');

	// SVGs for play / pause 
	const SVG_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause-icon lucide-pause"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>`;
	const SVG_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-icon lucide-play"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`;

	function setPlayPauseIcon(running) {
		if (!playPauseBtn) return;
		playPauseBtn.innerHTML = running ? SVG_PAUSE : SVG_PLAY;
	}

	// Define the sequence: 10min free, then four cycles of 25min focus + 5min break
	const phases = [
		{ key: 'free', label: 'Free', minutes: FREE_TIME },
		{ key: 'focus', label: 'Focus', minutes: FOCUS_TIME },
		{ key: 'break', label: 'Break', minutes: BREAK_TIME },
		{ key: 'focus', label: 'Focus', minutes: FOCUS_TIME },
		{ key: 'break', label: 'Break', minutes: BREAK_TIME },
		{ key: 'focus', label: 'Focus', minutes: FOCUS_TIME },
		{ key: 'break', label: 'Break', minutes: BREAK_TIME },
		{ key: 'focus', label: 'Focus', minutes: FOCUS_TIME },
		{ key: 'break', label: 'Break', minutes: BREAK_TIME }
	];

	let currentPhaseIndex = 0;
	let timeLeft = phases[0].minutes * 60; // seconds
	let timerInterval = null;
	let isRunning = false;

	function pad(n) { return String(n).padStart(2, '0'); }

	function renderClock(seconds) {
		if (!countdownSpan) return;
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		countdownSpan.innerHTML = `
			<span style="--value:${m}; --digits: 2;" aria-live="polite" aria-label="${pad(m)}">${pad(m)}</span>
			:
			<span style="--value:${s}; --digits: 2;" aria-live="polite" aria-label="${pad(s)}">${pad(s)}</span>`;
	}

	function updatePhaseDisplay() {
		// optionally update document title or aria attributes with phase label
		const phase = phases[currentPhaseIndex];
		if (phase && clockContainer) {
			clockContainer.setAttribute('data-phase', phase.key);
			clockContainer.setAttribute('aria-label', `${phase.label} — ${Math.floor(timeLeft/60)}:${pad(timeLeft%60)}`);
		}

		// Update the textual stage indicator, e.g. (1/4) focusing
		if (pomodoroStageEl && phase) {
			const totalOfKind = phases.filter(p => p.key === phase.key).length || 1;
			const indexOfKind = phases.slice(0, currentPhaseIndex + 1).filter(p => p.key === phase.key).length;
			let stageLabel = '';
			switch (phase.key) {
				case 'focus':
					stageLabel = 'focusing';
					break;
				case 'break':
					stageLabel = 'break time';
					break;
				case 'free':
					stageLabel = 'preparing time';
					break;
				default:
					stageLabel = phase.label.toLowerCase();
			}
			pomodoroStageEl.textContent = `(${indexOfKind}/${totalOfKind}) ${stageLabel}`;
		}
	}

	function startTimer() {
		if (isRunning) return;
		isRunning = true;
		playPauseBtn && (playPauseBtn.title = 'Pause');
		setPlayPauseIcon(true);
		clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			timeLeft -= 1;
			if (timeLeft < 0) {
				advancePhase();
				return;
			}
			renderClock(timeLeft);
			updatePhaseDisplay();
		}, 1000);
	}

	function pauseTimer() {
		if (!isRunning) return;
		isRunning = false;
		playPauseBtn && (playPauseBtn.title = 'Play');
		setPlayPauseIcon(false);
		clearInterval(timerInterval);
	}

	function resetTimer() {
		pauseTimer();
		currentPhaseIndex = 0;
		timeLeft = phases[0].minutes * 60;
		renderClock(timeLeft);
		updatePhaseDisplay();
		setPlayPauseIcon(false);
	}

	function advancePhase() {
		// move to next phase, or stop if none
		if (currentPhaseIndex < phases.length - 1) {
			currentPhaseIndex += 1;
			timeLeft = phases[currentPhaseIndex].minutes * 60;
			// continue running if currently running, otherwise stay paused
			if (isRunning) {
				// allow immediate tick update
				renderClock(timeLeft);
				updatePhaseDisplay();
			} else {
				renderClock(timeLeft);
				updatePhaseDisplay();
			}
		} else {
			// finished all phases
			pauseTimer();
			currentPhaseIndex = phases.length - 1;
			timeLeft = 0;
			renderClock(timeLeft);
			updatePhaseDisplay();
		}
	}

	// Skip to next phase (used by skip button)
	function skipPhase() {
		if (currentPhaseIndex < phases.length - 1) {
			currentPhaseIndex += 1;
			timeLeft = phases[currentPhaseIndex].minutes * 60;
			// if running, keep running; otherwise remain paused
			renderClock(timeLeft);
			updatePhaseDisplay();
		}
	}

	// Wire up controls
	if (playPauseBtn) {
		playPauseBtn.addEventListener('click', () => {
			if (isRunning) pauseTimer(); else startTimer();
		});
	}

	if (skipBtn) {
		skipBtn.addEventListener('click', () => {
			skipPhase();
		});
	}

	if (restartBtn) {
		restartBtn.addEventListener('click', () => {
			resetTimer();
		});
	}

	// initial render
	renderClock(timeLeft);
	updatePhaseDisplay();
	setPlayPauseIcon(false);
});