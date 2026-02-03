const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameSection = document.getElementById('game-section');
const proposalSection = document.getElementById('proposal-section');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const celebration = document.getElementById('celebration');

// Game State
let score = 0;
const WIN_SCORE = 10;
let gameRunning = true;

// Player (Basket)
const player = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 60,
    width: 80,
    height: 50,
    color: '#ff6b6b',
    speed: 10
};

// Hearts
let hearts = [];
const heartSpeed = 3;
const spawnRate = 60; // Frames
let frames = 0;

// Mouse/Touch Handling
let targetX = canvas.width / 2;

function getTargetX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    return (clientX - rect.left) * scaleX;
}

canvas.addEventListener('mousemove', (e) => {
    targetX = getTargetX(e.clientX);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    targetX = getTargetX(e.touches[0].clientX);
}, { passive: false });

function drawPlayer() {
    // Smoothly interpolate towards targetX
    player.x += (targetX - player.width / 2 - player.x) * 0.2;

    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Draw Basket (Simple Arc logic for cute look)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.bezierCurveTo(player.x + player.width, player.y + 50, player.x, player.y + 50, player.x, player.y);
    ctx.fill();

    // Handle decoration
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 10, player.y + 10, player.width - 20, 5);
}

function drawHeart(x, y, size) {
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.8, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.8, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
}

function updateGame() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();

    // Spawn hearts
    frames++;
    if (frames % spawnRate === 0) {
        hearts.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            size: 30
        });
    }

    // Update and draw hearts
    for (let i = 0; i < hearts.length; i++) {
        let h = hearts[i];
        h.y += heartSpeed;
        drawHeart(h.x, h.y, h.size);

        // Collision Detection
        if (
            h.y + h.size > player.y &&
            h.x + h.size > player.x &&
            h.x < player.x + player.width
        ) {
            score++;
            scoreEl.textContent = score;
            hearts.splice(i, 1);
            i--;

            // Check Win
            if (score >= WIN_SCORE) {
                winGame();
            }
        } else if (h.y > canvas.height) {
            // Heart missed
            hearts.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(updateGame);
}

function winGame() {
    gameRunning = false;
    // Simple fade out/in effect
    gameSection.style.opacity = '0';
    setTimeout(() => {
        gameSection.style.display = 'none';
        proposalSection.classList.remove('hidden');
        // Force reflow
        void proposalSection.offsetWidth;
        proposalSection.classList.add('active');
    }, 500);
}

// Start Game
updateGame();


// --- Proposal Logic --- //

// "No" Button Evasion
noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent click handling if touch happens
    moveNoButton();
});

function moveNoButton() {
    // Get viewport dimensions
    const limitWidth = window.innerWidth - noBtn.offsetWidth;
    const limitHeight = window.innerHeight - noBtn.offsetHeight;

    // Switch to fixed on first move if not already
    if (noBtn.style.position !== 'fixed') {
        noBtn.style.position = 'fixed';
    }

    // Safety mechanism: Try various positions until one is found that doesn't overlap
    let newX, newY;
    let overlap = true;
    let attempts = 0;
    const maxAttempts = 50;
    const safetyMargin = 20; // Extra space around Yes button

    const yesRect = yesBtn.getBoundingClientRect();

    while (overlap && attempts < maxAttempts) {
        newX = Math.random() * limitWidth;
        newY = Math.random() * limitHeight;

        // Check collision with Yes button
        // AABB Collision detection
        // No button rect (predicted)
        const noRight = newX + noBtn.offsetWidth;
        const noBottom = newY + noBtn.offsetHeight;

        const yesLeft = yesRect.left - safetyMargin;
        const yesRight = yesRect.right + safetyMargin;
        const yesTop = yesRect.top - safetyMargin;
        const yesBottom = yesRect.bottom + safetyMargin;

        // Check if NOT overlapping
        if (
            newX > yesRight ||
            noRight < yesLeft ||
            newY > yesBottom ||
            noBottom < yesTop
        ) {
            overlap = false;
        }

        attempts++;
    }

    // Apply new position
    noBtn.style.left = newX + 'px';
    noBtn.style.top = newY + 'px';
    noBtn.style.transform = 'none'; // Reset any translation
}

// "Yes" Button Celebration
yesBtn.addEventListener('click', () => {
    celebration.classList.remove('hidden');
    yesBtn.style.display = 'none';
    noBtn.style.display = 'none';
    startConfetti();
});

function startConfetti() {
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502'];

    for (let i = 0; i < 100; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti');

        // Random properties
        const left = Math.random() * 100;
        const animDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;

        conf.style.left = left + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animation = `fall ${animDuration}s linear ${delay}s forwards`;

        // Random shape
        if (Math.random() > 0.5) {
            conf.style.borderRadius = '50%';
        }

        document.body.appendChild(conf);

        // Cleanup after animation
        setTimeout(() => {
            conf.remove();
        }, (animDuration + delay) * 1000);
    }
}
