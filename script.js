// Ссылки на элементы
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('start-button');
const retryButton = document.getElementById('retry-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Звук прыжка
const jumpSound = document.getElementById('jump-sound');

// Получаем элемент audio
const backgroundAudio = document.getElementById('background-audio');

// Запускаем музыку сразу при загрузке страницы
window.addEventListener('load', () => {
  backgroundAudio.play().catch(error => {
    console.log("Не удалось воспроизвести музыку:", error);
  });
});

// Настройки игры
const gravity = 0.35;
const jumpStrength = -8;
const birdSize = 40;
const pipeWidth = 50;
const pipeGap = 200; // Увеличенное расстояние между трубами
const pipeSpeed = 2;
let bird = { x: 150, y: 150, width: birdSize, height: birdSize, velocity: 0 };
let pipes = [];
let trail = []; // Хвост птицы
const trailMaxLength = 400; // Максимальная длина хвоста
let score = 0;
let isGameRunning = false;
let gameInterval;

// Изображения
const birdImg = new Image();
birdImg.src = "bird.png";

const pipeImg = new Image();
pipeImg.src = "pipe-pattern.png";

let pipePattern = null;
pipeImg.onload = () => {
  // Создаем паттерн из изображения
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = pipeImg.width / 16;
  tempCanvas.height = pipeImg.height / 16;
  tempCtx.drawImage(pipeImg, 0, 0, tempCanvas.width, tempCanvas.height);
  pipePattern = ctx.createPattern(tempCanvas, "repeat");
};

// Установить размер canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Начать игру
function startGame() {
  backgroundAudio.volume = 0.2; // Устанавливаем громкость на 50%
  backgroundAudio.play(); // Запустить аудио

  bird.y = canvas.height / 3;
  bird.velocity = 0;
  pipes = [];
  trail = [];
  score = 0;
  isGameRunning = true;
  showScreen(gameScreen);
  
  // Фиксированная частота кадров (например, 60 FPS)
  gameInterval = setInterval(gameLoop, 1000 / 80); 
}

// Закончить игру
function endGame() {
  isGameRunning = false;
  clearInterval(gameInterval); // Остановить игровой цикл
  scoreDisplay.textContent = score;
  showScreen(endScreen);
}

// Обработчики прыжка
function jump() {
  bird.velocity = jumpStrength;
  jumpSound.play(); // Воспроизведение звука прыжка
}

// Обработчик для пробела
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && isGameRunning) {
    jump();
  }
});

// Обработчик для клика мыши (для ПК)
canvas.addEventListener('click', (e) => {
  if (isGameRunning) {
    jump();
  }
});

// Обработчик для касания экрана (для мобильных устройств)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();  // Предотвратить стандартное поведение для мобильных устройств
  if (isGameRunning) {
    jump();
  }
});

// Показать экран
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// Генерация труб
function generatePipes() {
  const pipeHeight = Math.random() * (canvas.height - pipeGap - 50) + 25;
  // Мы создаем новые трубы заранее, сразу за экраном
  pipes.push({ x: canvas.width, y: pipeHeight, passed: false });
}

// Основной игровой цикл
function gameLoop() {
  if (!isGameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Гравитация
  bird.velocity += gravity;
  bird.y += bird.velocity;

  // Проверка столкновений
  if (bird.y + bird.height > canvas.height) { // Птица не должна выходить за нижнюю границу
    endGame();
    return;
  }

  // Обновление хвоста
  trail.push({ x: bird.x + bird.width / 2, y: bird.y + bird.height / 2 });
  if (trail.length > trailMaxLength) {
    trail.shift();
  }

  // Двигаем все точки хвоста влево
  for (let i = 0; i < trail.length; i++) {
    trail[i].x -= pipeSpeed;
  }

// Отрисовка хвоста (ломаная линия)
ctx.strokeStyle = "orange";
ctx.lineWidth = 2;
ctx.setLineDash([]);  // Отключаем сглаживание (антиалиасинг)
ctx.beginPath();

// Начальная точка хвоста
ctx.moveTo(trail[0].x, trail[0].y);

// Рисуем ломаную линию по точкам
for (let i = 1; i < trail.length; i++) {
  ctx.lineTo(trail[i].x, trail[i].y);
}

ctx.stroke();


  // Генерация труб только, если последняя труба ушла за экран
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
    generatePipes();
  }

  // Перебор труб и движение
  pipes.forEach((pipe, index) => {
    pipe.x -= pipeSpeed; // Двигаем все трубы влево

    // Проверка столкновения с трубами
    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipeGap)
    ) {
      endGame();
      return;
    }

    // Увеличиваем счет, если птичка прошла через трубу
    if (pipe.x + pipeWidth < bird.x && !pipe.passed) {
      score++; // Увеличиваем счет
      pipe.passed = true; // Отмечаем, что птичка прошла через трубу
    }

  });

  // Отрисовка труб
  pipes.forEach(pipe => {
    if (pipePattern) {
      // Верхняя труба
      ctx.save();
      ctx.translate(pipe.x, 0);
      ctx.fillStyle = pipePattern;
      ctx.fillRect(0, 0, pipeWidth, pipe.y);
      ctx.restore();

      // Нижняя труба
      ctx.save();
      ctx.translate(pipe.x, pipe.y + pipeGap);
      ctx.fillStyle = pipePattern;
      ctx.fillRect(0, 0, pipeWidth, canvas.height - pipe.y - pipeGap);
      ctx.restore();
    }
  });

  // Отрисовка птицы
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // Отрисовка счета
  ctx.fillStyle = 'black';
  ctx.font = "20px 'Pixelify Sans', sans-serif";  // Пиксельный шрифт
  ctx.fillText(`Score: ${score}`, 10, 30);
}

// Обработчики кнопок
startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', startGame);


