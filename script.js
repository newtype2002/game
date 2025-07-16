document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const screens = {
        title: document.getElementById('title-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen'),
    };

    const buttons = {
        start: document.getElementById('start-button'),
        difficulty: document.querySelectorAll('.difficulty-btn'),
        register: document.getElementById('register-button'),
        retry: document.getElementById('retry-button'),
        prevMonth: document.getElementById('prev-month-btn'),
        nextMonth: document.getElementById('next-month-btn'),
    };

    const gameElements = {
        timeBar: document.getElementById('time-bar'),
        score: document.getElementById('score'),
        problem: document.getElementById('problem'),
        answerInput: document.getElementById('answer-input'),
        feedback: document.getElementById('feedback'),
        countdownOverlay: document.getElementById('countdown-overlay'),
        countdownText: document.getElementById('countdown-text'),
    };

    const resultElements = {
        finalScore: document.getElementById('final-score'),
        rankingList: document.getElementById('ranking-list'),
        playerName: document.getElementById('player-name'),
        calendarGrid: document.getElementById('calendar-grid'),
        calendarMonthYear: document.getElementById('calendar-month-year'),
    };
    
    const sounds = {
        typing: document.getElementById('typing-sound'),
        correct: document.getElementById('correct-sound'),
        wrong: document.getElementById('wrong-sound'),
        bgm: document.getElementById('bgm-sound'),
    };

    // Game State
    const GAME_DURATION = 60;
    let state = {
        currentScreen: 'title',
        difficulty: 'easy',
        score: 0,
        timeLeft: GAME_DURATION,
        timer: null,
        currentProblem: {
            text: '',
            answer: 0,
        },
        calendarDate: new Date(),
    };

    // --- BGM Control ---
    function playBGM() {
        sounds.bgm.volume = 0.3;
        sounds.bgm.currentTime = 0;
        const playPromise = sounds.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("BGM playback failed:", error);
            });
        }
    }

    function stopBGM() {
        sounds.bgm.pause();
        sounds.bgm.currentTime = 0;
    }

    // --- SCREEN TRANSITIONS ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
        state.currentScreen = screenName;
    }

    // --- EVENT LISTENERS ---
    buttons.start.addEventListener('click', () => showScreen('difficulty'));
    
    buttons.difficulty.forEach(btn => {
        btn.addEventListener('click', () => {
            state.difficulty = btn.dataset.difficulty;
            startGame();
        });
    });

    buttons.retry.addEventListener('click', () => {
        resultElements.playerName.disabled = false;
        buttons.register.disabled = false;
        buttons.register.textContent = 'ランキングに登録';
        showScreen('difficulty');
    });
    
    buttons.register.addEventListener('click', registerScore);
    
    gameElements.answerInput.addEventListener('input', () => {
        sounds.typing.currentTime = 0;
        sounds.typing.play().catch(e => {});
    });

    gameElements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    buttons.prevMonth.addEventListener('click', () => changeMonth(-1));
    buttons.nextMonth.addEventListener('click', () => changeMonth(1));

    // --- GAME LOGIC ---
    function startGame() {
        state.score = 0;
        state.timeLeft = GAME_DURATION;
        gameElements.score.textContent = state.score;
        updateTimerDisplay();
        gameElements.answerInput.value = '';
        gameElements.answerInput.disabled = true;
        
        playBGM(); // Play BGM as soon as difficulty is chosen
        showScreen('game');
        runCountdown();
    }

    function runCountdown() {
        const countdownSteps = ['3', '2', '1', 'GO!'];
        let currentStep = 0;
        gameElements.countdownOverlay.style.display = 'flex';

        const countdownInterval = setInterval(() => {
            if (currentStep < countdownSteps.length) {
                const textElement = gameElements.countdownText;
                textElement.textContent = countdownSteps[currentStep];
                textElement.style.animation = 'none';
                textElement.offsetHeight; // Trigger reflow for animation restart
                textElement.style.animation = ''; 
                currentStep++;
            } else {
                clearInterval(countdownInterval);
                gameElements.countdownOverlay.style.display = 'none';
                startActualGame();
            }
        }, 1000);
    }

    function startActualGame() {
        gameElements.answerInput.disabled = false;
        generateProblem();
        gameElements.answerInput.focus();

        state.timer = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            if (state.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        clearInterval(state.timer);
        stopBGM();
        resultElements.finalScore.textContent = state.score;
        updateTodayRankingDisplay();
        state.calendarDate = new Date();
        renderCalendar();
        showScreen('result');
    }
    
    function updateTimerDisplay() {
        const percentage = (state.timeLeft / GAME_DURATION) * 100;
        gameElements.timeBar.style.width = `${percentage}%`;
        if (state.timeLeft < GAME_DURATION * 0.2) {
            gameElements.timeBar.style.backgroundColor = 'var(--wrong-color)';
        } else if (state.timeLeft < GAME_DURATION * 0.5) {
            gameElements.timeBar.style.backgroundColor = '#ffc107';
        } else {
            gameElements.timeBar.style.backgroundColor = 'var(--correct-color)';
        }
    }

    function generateProblem() {
        let num1, num2;
        switch (state.difficulty) {
            case 'easy':
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                state.currentProblem = { text: `${num1} + ${num2} =`, answer: num1 + num2 };
                break;
            case 'normal':
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * 90) + 10;
                state.currentProblem = { text: `${num1} + ${num2} =`, answer: num1 + num2 };
                break;
            case 'hard':
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                state.currentProblem = { text: `${num1} × ${num2} =`, answer: num1 * num2 };
                break;
        }
        gameElements.problem.textContent = state.currentProblem.text;
    }

    function checkAnswer() {
        const userAnswer = parseInt(gameElements.answerInput.value, 10);
        if (!isNaN(userAnswer) && userAnswer === state.currentProblem.answer) {
            state.score += 100;
            gameElements.score.textContent = state.score;
            showFeedback(true);
            sounds.correct.play().catch(e => {});
            generateProblem();
        } else {
            state.timeLeft = Math.max(0, state.timeLeft - 2);
            updateTimerDisplay();
            showFeedback(false);
            sounds.wrong.play().catch(e => {});
            if (state.timeLeft <= 0) {
                endGame();
            }
        }
        gameElements.answerInput.value = '';
    }
    
    function showFeedback(isCorrect) {
        gameElements.feedback.textContent = isCorrect ? 'O' : 'X';
        gameElements.feedback.className = isCorrect ? 'feedback correct' : 'feedback wrong';
        setTimeout(() => {
            gameElements.feedback.className = 'feedback';
        }, 300);
    }

    // --- RANKING & LOCAL STORAGE LOGIC ---
    function getRankingKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `ranking_${state.difficulty}_${y}-${m}-${d}`;
    }

    function getRankingsForDate(date) {
        const key = getRankingKey(date);
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    function saveRanking(date, rankings) {
        const key = getRankingKey(date);
        localStorage.setItem(key, JSON.stringify(rankings));
    }

    function updateTodayRankingDisplay() {
        const today = new Date();
        const currentRanking = getRankingsForDate(today);
        currentRanking.sort((a, b) => b.score - a.score);
        
        resultElements.rankingList.innerHTML = '';
        currentRanking.slice(0, 10).forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${entry.score}</span>`;
            resultElements.rankingList.appendChild(li);
        });
    }
    
    function registerScore() {
        const name = resultElements.playerName.value.trim();
        if (!name) {
            alert('名前を入力してください。');
            return;
        }
        
        const today = new Date();
        const currentRanking = getRankingsForDate(today);
        currentRanking.push({ name: name, score: state.score });
        saveRanking(today, currentRanking);
        
        resultElements.playerName.disabled = true;
        buttons.register.disabled = true;
        buttons.register.textContent = '登録済み';
        
        updateTodayRankingDisplay();
        renderCalendar();
    }

    // --- CALENDAR LOGIC ---
    function renderCalendar() {
        resultElements.calendarGrid.innerHTML = '';
        const date = state.calendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();

        resultElements.calendarMonthYear.textContent = `${year}年 ${month + 1}月`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            resultElements.calendarGrid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);

            const currentDate = new Date(year, month, day);
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('today');
            }

            const rankings = getRankingsForDate(currentDate);
            if (rankings.length > 0) {
                rankings.sort((a, b) => b.score - a.score);
                const topPlayer = rankings[0];
                const rankInfo = document.createElement('div');
                rankInfo.className = 'rank-info';
                rankInfo.textContent = `1st: ${topPlayer.name} (${topPlayer.score})`;
                dayCell.appendChild(rankInfo);
            }

            resultElements.calendarGrid.appendChild(dayCell);
        }
    }
    
    function changeMonth(offset) {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + offset);
        renderCalendar();
    }

    // Initialize
    showScreen('title');
});