document.addEventListener("DOMContentLoaded", () => {
    const cells = document.querySelectorAll(".cell");
    const instructions = document.getElementById("instructions");
    const playerXScore = document.getElementById("player-x-score");
    const playerOScore = document.getElementById("player-o-score");
    const drawScore = document.getElementById("draw-score");
    const newMatchButton = document.getElementById("new-match-button");
    const resetScoresButton = document.getElementById("reset-scores-button");

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    let board = Array(9).fill("");
    let currentPlayer = "X";
    let firstPlayer = "X"; // Track who starts each match (alternates)
    let gameOver = false;
    let restartTimer = null;
    let scores = {
        X: 0,
        O: 0,
        draw: 0,
    };

    const boardEl = document.querySelector('.game-board');
    const strikeEl = document.createElement('div');
    strikeEl.className = 'strike';
    boardEl.appendChild(strikeEl);

    // Simple WebAudio sounds: click and win variations
    let audioCtx = null;

    function playClickSound(player) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            // The user requested that X's clicking sound should be O's tone.
            // Use the same triangle low tone for clicks for both players.
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.16, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.warn('Audio play error', e);
        }
    }

    function playWinSound(player) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            if (player === 'X') {
                // X win: descending square-wave chirp (distinct, celebratory)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.28, now + 0.006);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now);
                osc.stop(now + 0.28);
            } else {
                // O win: bright sawtooth pulse
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(660, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.26, now + 0.008);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now);
                osc.stop(now + 0.24);
            }
        } catch (e) {
            console.warn('Audio play error', e);
        }
    }

    function playDrawSound() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Draw: dual ascending tones for a playful, tie effect
            // Low tone ascending
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523, now);
            osc1.frequency.exponentialRampToValueAtTime(784, now + 0.26);

            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.22, now + 0.008);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.26);

            // High tone ascending (offset by 40ms for layered effect)
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659, now + 0.04);
                osc2.frequency.exponentialRampToValueAtTime(988, now + 0.26);

                gain2.gain.setValueAtTime(0, now + 0.04);
                gain2.gain.linearRampToValueAtTime(0.18, now + 0.048);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start(now + 0.04);
                osc2.stop(now + 0.26);
            }, 40);
        } catch (e) {
            console.warn('Audio play error', e);
        }
    }

    function updateScoreboard() {
        playerXScore.textContent = `Player X: ${scores.X}`;
        playerOScore.textContent = `Player O: ${scores.O}`;
        drawScore.textContent = `Draws: ${scores.draw}`;
    }

    function setMessage(message) {
        instructions.textContent = message;
    }

    // Returns the winning combination array if there is a winner, otherwise null
    function checkWinner() {
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return combination;
            }
        }
        return null;
    }

    function drawStrike(combination, winner) {
        const first = cells[combination[0]];
        const last = cells[combination[combination.length - 1]];
        const boardRect = boardEl.getBoundingClientRect();
        const r1 = first.getBoundingClientRect();
        const r2 = last.getBoundingClientRect();

        const x1 = r1.left + r1.width / 2 - boardRect.left;
        const y1 = r1.top + r1.height / 2 - boardRect.top;
        const x2 = r2.left + r2.width / 2 - boardRect.left;
        const y2 = r2.top + r2.height / 2 - boardRect.top;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const strikeHeight = strikeEl.offsetHeight || 10;

        strikeEl.classList.remove('strike-show', 'strike-x', 'strike-o');
        strikeEl.style.width = `${distance}px`;
        strikeEl.style.left = `${x1}px`;
        strikeEl.style.top = `${y1 - strikeHeight / 2}px`;
        strikeEl.style.setProperty('--strike-angle', `${angle}deg`);
        strikeEl.style.transform = `rotate(${angle}deg) scaleX(0)`;
        strikeEl.classList.add(winner === 'X' ? 'strike-x' : 'strike-o');

        void strikeEl.offsetWidth;
        requestAnimationFrame(() => {
            strikeEl.classList.add('strike-show');
        });
    }

    function startNewGame() {
        clearTimeout(restartTimer);
        restartTimer = null;
        board = Array(9).fill("");
        currentPlayer = firstPlayer; // Start with whoever's turn it is
        gameOver = false;
        boardEl.classList.remove('locked');

        cells.forEach((cell) => {
            cell.textContent = "";
            cell.classList.remove("x", "o", "winner-pop");
        });

        strikeEl.classList.remove('strike-show', 'strike-x', 'strike-o');
        strikeEl.style.width = '0px';
        strikeEl.style.transform = 'scaleX(0)';

        setMessage(`Click on a cell to make your move. Player ${firstPlayer} goes first.`);
        
        // Toggle firstPlayer for the next match
        firstPlayer = firstPlayer === "X" ? "O" : "X";
    }

    function finishRound(message, autoStartDelay = 900) {
        gameOver = true;
        boardEl.classList.add('locked');
        setMessage(`${message} Starting a new game...`);

        restartTimer = setTimeout(startNewGame, autoStartDelay);
    }

    function handleCellClick(event) {
        const cell = event.target;
        const index = Number(cell.dataset.index);

        if (gameOver || board[index]) {
            return;
        }

        board[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());
        playClickSound(currentPlayer);

        const winningCombo = checkWinner();
        if (winningCombo) {
            const WIN_LINE_MS = 360;
            const WIN_RESTART_MS = 950;

            gameOver = true;
            boardEl.classList.add('locked');
            scores[currentPlayer] += 1;
            updateScoreboard();
            setMessage(`Player ${currentPlayer} wins! Starting a new game...`);
            playWinSound(currentPlayer);
            drawStrike(winningCombo, currentPlayer);

            setTimeout(() => {
                winningCombo.forEach((idx) => {
                    const c = cells[idx];
                    c.classList.add('winner-pop');
                });
            }, WIN_LINE_MS);

            restartTimer = setTimeout(startNewGame, WIN_RESTART_MS);

            return;
        }

        if (board.every(Boolean)) {
            scores.draw += 1;
            updateScoreboard();
            // play distinct draw sound
            playDrawSound();
            finishRound("It's a draw!");
            return;
        }

        currentPlayer = currentPlayer === "X" ? "O" : "X";
        setMessage(`Player ${currentPlayer}'s turn.`);
    }

    function resetScores() {
        scores.X = 0;
        scores.O = 0;
        scores.draw = 0;
        updateScoreboard();
        startNewGame();
        setMessage("Scores reset! Click on a cell to make your move. Player X goes first.");
    }

    cells.forEach((cell) => {
        cell.addEventListener("click", handleCellClick);
    });

    newMatchButton.addEventListener("click", startNewGame);
    resetScoresButton.addEventListener("click", resetScores);
    updateScoreboard();
});
