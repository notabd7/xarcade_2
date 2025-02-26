// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

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
        this.size = 20;
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
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.closePath();
        ctx.strokeStyle = '#0f0';
        ctx.stroke();

        if (this.isThrusting) {
            ctx.beginPath();
            ctx.moveTo(-this.size / 2, 0);
            ctx.lineTo(-this.size, 0);
            ctx.stroke();
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
        this.size = 2;
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
        this.radius = size * 10;
        this.position = position ? position.clone() : this.randomEdgePosition();
        this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
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
        const numPoints = 8 + this.size * 2;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = this.radius + (Math.random() - 0.5) * this.radius / 2;
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

function playSound(sound) {
    if (!audioCtx) return; // Don't play if audio isn't initialized
    
    if (sound.currentTime > 0) {
        sound.currentTime = 0;
    }
    sound.play().catch(e => console.log("Sound playback failed:", e));
}
function spawnAsteroids(count = 5) {
    for (let i = 0; i < count; i++) {
        asteroids.push(new Asteroid());
    }
}

function circlesCollide(pos1, radius1, pos2, radius2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy) < radius1 + radius2;
}
let x= false

function gameLoop() {

    if (!audioCtx) {
        // Show "Click to Start" message
        ctx.font = '30px Courier New';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {

        audio.theme.pause();
        audio.theme.currentTime = 0;
        playSound(audio.gameOver);

        ctx.font = '40px Courier New';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px Courier New';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
        
        if (keys[' ']) {
            ship = new Ship();
            asteroids = [];
            particles = [];
            spawnAsteroids(4 + level);
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
                
                // Create particles
                for (let i = 0; i < 10; i++) {
                    const vel = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
                    vel.multiply(2);
                    particles.push(new Particle(asteroid.position, vel, 2, '#0f0', 30));
                }
                
                // Remove asteroid and update score
                asteroids.splice(aIdx, 1);
                score += (4 - asteroid.size) * 100;
            }
        });
    });

    // Check for level completion
    if (asteroids.length === 0) {
        level++;
        spawnAsteroids(4 + level);
    }

    // Draw everything
    ship.draw();
    asteroids.forEach(asteroid => asteroid.draw());
    particles.forEach(particle => particle.draw());

    // Draw HUD
    ctx.font = '20px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${ship.lives}`, 10, 60);
    ctx.fillText(`Level: ${level}`, 10, 90);

    requestAnimationFrame(gameLoop);
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
// Add click handler to initialize audio
window.addEventListener('click', initAudio);
// Start the game
spawnAsteroids();
gameLoop();