(() => {
  const canvas = document.querySelector('#game-board');
  const scoreElement = document.querySelector('#game-score');
  const highScoreElement = document.querySelector('#game-high-score');
  const statusElement = document.querySelector('#game-status');
  const startButton = document.querySelector('#game-start');
  const pauseButton = document.querySelector('#game-pause');
  const restartButton = document.querySelector('#game-restart');
  const controlButtons = document.querySelectorAll('[data-direction]');

  if (!canvas || !scoreElement || !highScoreElement || !statusElement || !startButton || !pauseButton || !restartButton) return;

  const context = canvas.getContext('2d');
  const cellSize = 18;
  const gridSize = canvas.width / cellSize;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const state = {
    snake: [],
    direction: directions.right,
    nextDirection: directions.right,
    food: null,
    enemy: null,
    score: 0,
    highScore: Number(window.localStorage.getItem('sangwoo-snake-high-score')) || 0,
    timerId: null,
    running: false,
    paused: false,
    gameOver: false,
    enemyTick: 0
  };

  const samePoint = (first, second) => first.x === second.x && first.y === second.y;

  function isSnakePoint(point) {
    return state.snake.some((segment) => samePoint(segment, point));
  }

  function randomEmptyPoint() {
    const available = [];
    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const point = { x, y };
        if (!isSnakePoint(point) && (!state.enemy || !samePoint(point, state.enemy))) available.push(point);
      }
    }
    return available[Math.floor(Math.random() * available.length)] || { x: 1, y: 1 };
  }

  function resetGame() {
    state.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    state.direction = directions.right;
    state.nextDirection = directions.right;
    state.score = 0;
    state.food = randomEmptyPoint();
    state.enemy = randomEmptyPoint();
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.enemyTick = 0;
    updateScore();
    setStatus('Ready to play');
    render();
  }

  function updateScore() {
    scoreElement.textContent = String(state.score);
    highScoreElement.textContent = String(state.highScore);
  }

  function setStatus(message) {
    statusElement.textContent = message;
  }

  function scheduleLoop() {
    if (state.timerId !== null) return;
    state.timerId = window.setInterval(tick, 140);
  }

  function stopLoop() {
    if (state.timerId === null) return;
    window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function startGame() {
    if (state.running) return;
    if (state.gameOver) resetGame();
    state.running = true;
    state.paused = false;
    setStatus('Playing');
    scheduleLoop();
  }

  function togglePause() {
    if (!state.running || state.gameOver) return;
    state.paused = !state.paused;
    setStatus(state.paused ? 'Paused' : 'Playing');
  }

  function endGame() {
    state.running = false;
    state.gameOver = true;
    stopLoop();
    if (state.score > state.highScore) {
      state.highScore = state.score;
      window.localStorage.setItem('sangwoo-snake-high-score', String(state.highScore));
    }
    updateScore();
    setStatus('Game over');
  }

  function setDirection(directionName) {
    const nextDirection = directions[directionName];
    if (!nextDirection || (nextDirection.x + state.direction.x === 0 && nextDirection.y + state.direction.y === 0)) return;
    state.nextDirection = nextDirection;
  }

  function moveEnemy() {
    const options = Object.values(directions).filter((direction) => {
      const next = { x: state.enemy.x + direction.x, y: state.enemy.y + direction.y };
      return next.x >= 0 && next.x < gridSize && next.y >= 0 && next.y < gridSize && !isSnakePoint(next) && !samePoint(next, state.food);
    });
    if (options.length === 0) return;
    const direction = options[Math.floor(Math.random() * options.length)];
    state.enemy = { x: state.enemy.x + direction.x, y: state.enemy.y + direction.y };
  }

  function tick() {
    if (!state.running || state.paused) return;
    state.direction = state.nextDirection;
    const nextHead = { x: state.snake[0].x + state.direction.x, y: state.snake[0].y + state.direction.y };
    const hitsWall = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
    const hitsSelf = state.snake.some((segment) => samePoint(segment, nextHead));
    const hitsEnemy = samePoint(nextHead, state.enemy);
    if (hitsWall || hitsSelf || hitsEnemy) {
      endGame();
      render();
      return;
    }
    state.snake.unshift(nextHead);
    if (samePoint(nextHead, state.food)) {
      state.score += 1;
      state.food = randomEmptyPoint();
      updateScore();
    } else {
      state.snake.pop();
    }
    state.enemyTick += 1;
    if (state.enemyTick % 2 === 0) moveEnemy();
    render();
  }

  function drawCell(point, color) {
    context.fillStyle = color;
    context.fillRect(point.x * cellSize + 1, point.y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function render() {
    context.fillStyle = '#071018';
    context.fillRect(0, 0, canvas.width, canvas.height);
    state.snake.forEach((segment, index) => drawCell(segment, index === 0 ? '#7dd3fc' : '#38bdf8'));
    drawCell(state.food, '#fbbf24');
    drawCell(state.enemy, '#fb7185');
  }

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', () => { stopLoop(); resetGame(); startGame(); });
  controlButtons.forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
  window.addEventListener('keydown', (event) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
      return;
    }
    const directionName = keyMap[event.key];
    if (!directionName) return;
    event.preventDefault();
    setDirection(directionName);
  });

  resetGame();
})();
