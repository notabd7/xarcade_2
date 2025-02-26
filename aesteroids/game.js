// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Make canvas fill most of the window while maintaining aspect ratio
function resizeCanvas() {
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.85;
    
    // Maintain 4:3 aspect ratio
    let newWidth = maxWidth;
    let newHeight = newWidth * 0.75; // 3:4 ratio
    
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * 1.33; // 4:3 ratio
    }
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

// Set actual canvas resolution
canvas.width = 1200;
canvas.height = 900;

// Initial resize
resizeCanvas();

// Listen for window resize events
window.addEventListener('resize', resizeCanvas);

const audio = {
    theme: new Audio('./sounds/asteroid.wav'),
    gameOver: new Audio('./sounds/asteroid.wav'), // Placeholder for game over music
    asteroid: new Audio('./sounds/asteroid.wav'),
    bloopHigh: new Audio('./sounds/bloop_hi.wav'),
    bloopLow: new Audio('./sounds/bloop_lo.wav'),
    explode: new Audio('./sounds/explode.wav'),
    shoot: new Audio('./sounds/shoot.wav'),
    thrust: new Audio('./sounds/thrust.wav')
};

audio.theme.loop = true;
audio.theme.volume = 0.5;

let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Start theme music
        audio.theme.play().catch(e => console.log("Audio playback failed:", e));
    }
}

// Vector class for physics
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
    }

    clone() {
        return new Vector(this.x, this.y);
    }
}

class Particle {
    constructor(position, velocity, size, color, lifespan) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.size = size;
        this.color = color;
        this.lifespan = lifespan;
    }

    update() {
        this.position.add(this.velocity);
        this.lifespan--;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Ship {
    constructor() {
        this.position = new Vector(canvas.width / 2, canvas.height / 2);
        this.velocity = new Vector(0, 0);
        this.rotation = 0;
        this.thrust = 0.1;
        this.rotationSpeed = 0.05;
        this.size = 25; // Increased ship size for better visibility
        this.isThrusting = false;
        this.bullets = [];
        this.shootCooldown = 0;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.thrustSound = false;
    }

    update() {
        if (this.isThrusting && !this.thrustSound) {
            playSound(audio.thrust);
            this.thrustSound = true;
        } else if (!this.isThrusting && this.thrustSound) {
            audio.thrust.pause();
            audio.thrust.currentTime = 0;
            this.thrustSound = false;
        }

        // Apply thrust if the ship is thrusting
        if (this.isThrusting) {
            const thrustVector = new Vector(
                Math.cos(this.rotation) * this.thrust,
                Math.sin(this.rotation) * this.thrust
            );
            this.velocity.add(thrustVector);
        }

        // Add drag to prevent infinite acceleration
        this.velocity.multiply(0.99);
        
        this.position.add(this.velocity);

        // Screen wrap-around
        if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.x > canvas.width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvas.height;
        if (this.position.y > canvas.height) this.position.y = 0;

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (keys[' '] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 10;
        }

        if (this.invulnerable) {
            this.invulnerabilityTime--;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }

        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.lifespan > 0);
    }

    draw() {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // Skip drawing to create blinking effect
        }

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        // Draw improved ship shape
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.lineTo(-this.size / 3, 0);  // Added indent
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.closePath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw improved thruster flame if thrusting
        if (this.isThrusting) {
            ctx.beginPath();
            
            // Flicker effect for flame
            const flickerOffset = Math.random() * 0.3 + 0.7;
            
            // Main flame
            ctx.moveTo(-this.size / 3, 0);
            ctx.lineTo(-this.size * 1.2 * flickerOffset, 0);
            
            // Flame width varies
            const flameWidth = this.size / 4 * flickerOffset;
            
            // Draw flame edges
            ctx.lineTo(-this.size * 0.8, flameWidth);
            ctx.lineTo(-this.size / 3, 0);
            ctx.lineTo(-this.size * 0.8, -flameWidth);
            ctx.lineTo(-this.size * 1.2 * flickerOffset, 0);
            
            // Flame gradient
            const gradient = ctx.createLinearGradient(
                -this.size / 3, 0, 
                -this.size * 1.2, 0
            );
            gradient.addColorStop(0, '#ff6600');
            gradient.addColorStop(0.5, '#ffcc00');
            gradient.addColorStop(1, '#ff9900');
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        ctx.restore();
        this.bullets.forEach(bullet => bullet.draw());
    }

    hit() {
        if (this.invulnerable) return false;
        
        playSound(audio.explode);
        this.lives--;
        if (this.lives > 0) {
            this.position = new Vector(canvas.width / 2, canvas.height / 2);
            this.velocity = new Vector(0, 0);
            this.invulnerable = true;
            this.invulnerabilityTime = 120;
            return false;
        }
        return true;
    }

    rotateLeft() { this.rotation -= this.rotationSpeed; }
    rotateRight() { this.rotation += this.rotationSpeed; }
    startThrust() { this.isThrusting = true; }
    stopThrust() { this.isThrusting = false; }

    shoot() {
        const bulletVelocity = new Vector(Math.cos(this.rotation), Math.sin(this.rotation));
        bulletVelocity.multiply(5);
        bulletVelocity.add(this.velocity);
        this.bullets.push(new Bullet(this.position, bulletVelocity));
        playSound(audio.shoot);
    }
}

class Bullet {
    constructor(position, velocity) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.size = 3; // Increased bullet size
        this.lifespan = 60;
    }

    update() {
        this.position.add(this.velocity);
        // Screen wrap-around for bullets
        if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.x > canvas.width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvas.height;
        if (this.position.y > canvas.height) this.position.y = 0;
        this.lifespan--;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0';
        ctx.fill();
    }
}

class Asteroid {
    constructor(size = 3, position = null) {
        this.size = size; // 3: large, 2: medium, 1: small
        this.radius = size * 15; // Increased asteroid size
        this.position = position ? position.clone() : this.randomEdgePosition();
        
        // Increase asteroid speed for faster gameplay
        this.velocity = new Vector(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5);
        this.velocity.multiply(1 + (3 - size) * 0.5); // Smaller asteroids move faster
        
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.05 - 0.025;
        this.points = this.generatePoints();
    }

    randomEdgePosition() {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: return new Vector(Math.random() * canvas.width, -this.radius);
            case 1: return new Vector(canvas.width + this.radius, Math.random() * canvas.height);
            case 2: return new Vector(Math.random() * canvas.width, canvas.height + this.radius);
            case 3: return new Vector(-this.radius, Math.random() * canvas.height);
        }
    }

    generatePoints() {
        const points = [];
        // More points for better detail
        const numPoints = 10 + this.size * 2;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // More variation in asteroid shapes
            const variation = Math.random() * 0.6 + 0.7; // 0.7 to 1.3
            const radius = this.radius * variation;
            points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        return points;
    }

    update() {
        this.position.add(this.velocity);
        this.rotation += this.rotationSpeed;
        if (this.position.x < -this.radius) this.position.x = canvas.width + this.radius;
        if (this.position.x > canvas.width + this.radius) this.position.x = -this.radius;
        if (this.position.y < -this.radius) this.position.y = canvas.height + this.radius;
        if (this.position.y > canvas.height + this.radius) this.position.y = -this.radius;
    }

    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        this.points.forEach((point, i) => i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

// Game state
let ship = new Ship();
let asteroids = [];
let particles = [];
let score = 0;
let gameOver = false;
let level = 1;
let gameStarted = false;

function playSound(sound) {
    if (!audioCtx) return; // Don't play if audio isn't initialized
    
    if (sound.currentTime > 0) {
        sound.currentTime = 0;
    }
    sound.play().catch(e => console.log("Sound playback failed:", e));
}

function spawnAsteroids(count = 7) { // Increased default asteroid count
    for (let i = 0; i < count; i++) {
        asteroids.push(new Asteroid());
    }
}

function circlesCollide(pos1, radius1, pos2, radius2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy) < radius1 + radius2;
}

function startGame() {
    if (!gameStarted && !gameOver) {
        gameStarted = true;
        initAudio();
    }
}

function returnToHome() {
    window.location.href = "../index.html";
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Not started state
    if (!gameStarted) {
        ctx.font = '40px Courier New';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('AESTEROIDS', canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.font = '30px Courier New';
        ctx.fillText('Click or Press Any Key to Start', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Courier New';
        ctx.fillText('Controls: Arrow Keys or WASD to move, SPACE to shoot', canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText('ESC to return to home page', canvas.width / 2, canvas.height / 2 + 100);
        
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameOver) {
        audio.theme.pause();
        audio.theme.currentTime = 0;
        playSound(audio.gameOver);

        ctx.font = '50px Courier New';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.font = '30px Courier New';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText('ESC to Return to Home', canvas.width / 2, canvas.height / 2 + 110);
        
        ctx.textAlign = 'left';
        
        if (keys[' ']) {
            ship = new Ship();
            asteroids = [];
            particles = [];
            spawnAsteroids(6 + level);
            score = 0;
            level = 1;
            gameOver = false;
        }
        
        requestAnimationFrame(gameLoop);
        return;
    }

    // Handle input
    if (keys['a'] || keys['arrowleft']) ship.rotateLeft();
    if (keys['d'] || keys['arrowright']) ship.rotateRight();
    if (keys['w'] || keys['arrowup']) ship.startThrust();
    else ship.stopThrust();
    
    // Check for ESC key to return to home
    if (keys['escape']) {
        returnToHome();
    }

    // Update game objects
    ship.update();
    asteroids.forEach(asteroid => asteroid.update());
    particles.forEach(particle => particle.update());
    particles = particles.filter(p => p.lifespan > 0);

    // Check collisions
    asteroids.forEach(asteroid => {
        if (circlesCollide(ship.position, ship.size / 2, asteroid.position, asteroid.radius)) {
            if (ship.hit()) {
                gameOver = true;
            }
        }
    });

    // Handle bullet collisions
    ship.bullets.forEach((bullet, bIdx) => {
        asteroids.forEach((asteroid, aIdx) => {
            if (circlesCollide(bullet.position, bullet.size, asteroid.position, asteroid.radius)) {
                // Remove bullet
                ship.bullets.splice(bIdx, 1);

                if (asteroid.size > 1) {
                    playSound(audio.bloopHigh);
                } else {
                    playSound(audio.bloopLow);
                }
                
                // Split asteroid
                if (asteroid.size > 1) {
                    for (let i = 0; i < 2; i++) {
                        asteroids.push(new Asteroid(asteroid.size - 1, asteroid.position));
                    }
                }
                
                // Create more particles for better explosion effect
                for (let i = 0; i < 15; i++) {
                    const vel = new Vector(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5);
                    vel.multiply(2);
                    particles.push(new Particle(asteroid.position, vel, 2, '#0f0', 40));
                }
                
                // Remove asteroid and update score
                asteroids.splice(aIdx, 1);
                score += (4 - asteroid.size) * 100;
            }
        });
    });

    // Add spontaneous asteroids to keep the game from getting empty
    if (asteroids.length < 3 + level) {
        asteroids.push(new Asteroid());
    }

    // Check for level completion - now requires fewer asteroids
    if (asteroids.length <= 2) {
        level++;
        spawnAsteroids(6 + level); // Increased asteroid count per level
    }

    // Draw everything
    ship.draw();
    asteroids.forEach(asteroid => asteroid.draw());
    particles.forEach(particle => particle.draw());

    // Draw HUD with better positioning
    const padding = 20; // Add padding
    ctx.font = '25px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, padding, padding + 25);
    ctx.fillText(`Lives: ${ship.lives}`, padding, padding + 60);
    ctx.fillText(`Level: ${level}`, padding, padding + 95);

    // Draw ESC hint
    ctx.textAlign = 'right';
    ctx.font = '16px Courier New';
    ctx.fillText('ESC to return home', canvas.width - padding, padding + 25);

    requestAnimationFrame(gameLoop);
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => { 
    keys[e.key.toLowerCase()] = true; 
    if (!gameStarted) startGame();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// Add click handler to initialize audio and start game
window.addEventListener('click', startGame);

// Start the game
spawnAsteroids(7); // Start with more asteroids
gameLoop();