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
    let gameOver = false;
    let scores = {
        X: 0,
        O: 0,
        draw: 0,
    };

    function updateScoreboard() {
        playerXScore.textContent = `Player X: ${scores.X}`;
        playerOScore.textContent = `Player O: ${scores.O}`;
        drawScore.textContent = `Draws: ${scores.draw}`;
    }

    function setMessage(message) {
        instructions.textContent = message;
    }

    function checkWinner() {
        return winningCombinations.some((combination) => {
            const [a, b, c] = combination;
            return board[a] && board[a] === board[b] && board[a] === board[c];
        });
    }

    function startNewGame() {
        board = Array(9).fill("");
        currentPlayer = "X";
        gameOver = false;

        cells.forEach((cell) => {
            cell.textContent = "";
            cell.classList.remove("x", "o");
        });

        setMessage("Click on a cell to make your move. Player X goes first.");
    }

    function finishRound(message) {
        gameOver = true;
        setMessage(`${message} Starting a new game...`);

        setTimeout(startNewGame, 1200);
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

        if (checkWinner()) {
            scores[currentPlayer] += 1;
            updateScoreboard();
            finishRound(`Player ${currentPlayer} wins!`);
            return;
        }

        if (board.every(Boolean)) {
            scores.draw += 1;
            updateScoreboard();
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
