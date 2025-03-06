// Canvas setup
const canvas = window.gameCanvas || document.getElementById('gameCanvas');
const ctx = window.gameContext || (canvas ? canvas.getContext('2d') : null);

// Make canvas fill most of the window while maintaining aspect ratio
if (!canvas || !ctx) {
    console.error("Cannot find game canvas or context!");
  } else {
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
  
    // Add a global cleanup function that the React component can call
    window.cleanupAsteroidsGame = function() {
      // Stop game loop if it's running
      if (typeof cancelAnimationFrame === 'function' && window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
      }
      
      // Stop audio
      Object.values(audio).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
      
      // Remove event listeners
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('click', startGame);
      }
      
      console.log("Game resources cleaned up");
    };
  
  }
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
        return this;
    }

    clone() {
        return new Vector(this.x, this.y);
    }
    
    // Get direction from this vector to target vector
    directionTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return new Vector(dx, dy).normalize();
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
        this.size = 25; // Ship size
        this.isThrusting = false;
        this.bullets = [];
        this.shootCooldown = 0;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.thrustSound = false;
        this.activeTurret = 'left'; // Track which turret to fire from
        this.leftTurretRecoil = 0;  // Recoil animation for left turret
        this.rightTurretRecoil = 0; // Recoil animation for right turret
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
        
        // Update bullet positions
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.lifespan > 0);
        
        // Update turret recoil animation
        if (this.leftTurretRecoil > 0) {
            this.leftTurretRecoil -= 0.5;
        }
        
        if (this.rightTurretRecoil > 0) {
            this.rightTurretRecoil -= 0.5;
        }
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
        ctx.lineTo(-this.size / 3, 0);  // Indent
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.closePath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw left turret with recoil
        const leftTurretLength = 10 - this.leftTurretRecoil;
        ctx.beginPath();
        ctx.moveTo(this.size/2, -this.size/3);
        ctx.lineTo(this.size/2 + leftTurretLength, -this.size/3);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f0';
        ctx.stroke();
        
        // Draw right turret with recoil
        const rightTurretLength = 10 - this.rightTurretRecoil;
        ctx.beginPath();
        ctx.moveTo(this.size/2, this.size/3);
        ctx.lineTo(this.size/2 + rightTurretLength, this.size/3);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f0';
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
        // Get bullet direction based on ship rotation
        const bulletVelocity = new Vector(Math.cos(this.rotation), Math.sin(this.rotation));
        bulletVelocity.multiply(5);
        bulletVelocity.add(this.velocity);
        
        // Create bullet from the appropriate turret
        let bulletPosition;
        if (this.activeTurret === 'left') {
            // Calculate left turret position
            const turretX = Math.cos(this.rotation) * (this.size/2) - Math.sin(this.rotation) * (this.size/3);
            const turretY = Math.sin(this.rotation) * (this.size/2) + Math.cos(this.rotation) * (this.size/3);
            bulletPosition = new Vector(this.position.x + turretX, this.position.y + turretY);
            this.leftTurretRecoil = 5; // Apply recoil to left turret
            this.activeTurret = 'right'; // Switch to right turret for next shot
        } else {
            // Calculate right turret position
            const turretX = Math.cos(this.rotation) * (this.size/2) + Math.sin(this.rotation) * (this.size/3);
            const turretY = Math.sin(this.rotation) * (this.size/2) - Math.cos(this.rotation) * (this.size/3);
            bulletPosition = new Vector(this.position.x + turretX, this.position.y + turretY);
            this.rightTurretRecoil = 5; // Apply recoil to right turret
            this.activeTurret = 'left'; // Switch to left turret for next shot
        }
        
        this.bullets.push(new Bullet(bulletPosition, bulletVelocity));
        playSound(audio.shoot);
    }
}

class Bullet {
    constructor(position, velocity) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.size = 3; // Bullet size
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
    constructor(size = 3, position = null, targetPosition = null) {
        this.size = size; // 3: large, 2: medium, 1: small
        this.radius = size * 15; // Asteroid size
        this.position = position ? position.clone() : this.randomEdgePosition();
        
        // If target position is provided, set velocity towards it
        if (targetPosition) {
            const direction = this.position.directionTo(targetPosition);
            // Base speed depends on asteroid size (smaller = faster)
            const speed = 1.5 + (3 - size) * 0.5;
            this.velocity = new Vector(direction.x * speed, direction.y * speed);
        } else {
            // Random velocity with slight targeting
            this.velocity = new Vector(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5);
            this.velocity.multiply(1 + (3 - size) * 0.5); // Smaller asteroids move faster
        }
        
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

class EnemyShip {
    constructor(level) {
        // Choose a random edge to spawn from
        this.position = this.randomEdgePosition();
        
        // Speed increases with game level
        const speed = 1 + level * 0.1;
        this.velocity = new Vector(Math.random() * speed - speed/2, Math.random() * speed - speed/2);
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
        this.size = 30;
        
        // Health increases with level
        this.health = 5 + Math.floor(level / 2);
        this.maxHealth = this.health;
        
        this.bullets = [];
        this.shootCooldown = 0;
        this.shootInterval = Math.max(90 - level * 5, 40); // Shoots faster at higher levels
        
        // Flash effect when hit
        this.hitEffect = 0;
    }
    
    randomEdgePosition() {
        const edge = Math.floor(Math.random() * 4);
        const padding = 50;
        switch (edge) {
            case 0: return new Vector(Math.random() * canvas.width, -padding);
            case 1: return new Vector(canvas.width + padding, Math.random() * canvas.height);
            case 2: return new Vector(Math.random() * canvas.width, canvas.height + padding);
            case 3: return new Vector(-padding, Math.random() * canvas.height);
        }
    }
    
    update(shipPosition) {
        // Sometimes change direction to follow the player
        if (Math.random() < 0.01) {
            const direction = this.position.directionTo(shipPosition);
            this.velocity = new Vector(direction.x, direction.y);
            this.velocity.multiply(1.5);
        }
        
        // Occasionally change rotation
        if (Math.random() < 0.02) {
            this.rotation += Math.random() * Math.PI - Math.PI/2;
        }
        
        // Move
        this.position.add(this.velocity);
        
        // Rotate
        this.rotation += this.rotationSpeed;
        
        // Screen wrap-around
        if (this.position.x < -this.size) this.position.x = canvas.width + this.size;
        if (this.position.x > canvas.width + this.size) this.position.x = -this.size;
        if (this.position.y < -this.size) this.position.y = canvas.height + this.size;
        if (this.position.y > canvas.height + this.size) this.position.y = -this.size;
        
        // Shooting logic
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot(shipPosition);
            this.shootCooldown = this.shootInterval;
        }
        
        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.lifespan > 0);
        
        // Decrease hit effect
        if (this.hitEffect > 0) {
            this.hitEffect--;
        }
    }
    
    shoot(targetPosition) {
        // Calculate direction to player
        const direction = this.position.directionTo(targetPosition);
        
        // Add some inaccuracy
        const angle = Math.atan2(direction.y, direction.x);
        const inaccuracy = Math.random() * 0.3 - 0.15; // +/- 0.15 radians
        const bulletDirection = new Vector(
            Math.cos(angle + inaccuracy),
            Math.sin(angle + inaccuracy)
        );
        
        // Set bullet velocity
        const bulletVelocity = new Vector(bulletDirection.x * 4, bulletDirection.y * 4);
        
        // Create the bullet
        this.bullets.push(new EnemyBullet(this.position.clone(), bulletVelocity));
        
        // Play shooting sound
        playSound(audio.shoot);
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        // Draw enemy ship (hexagonal shape)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Fill with color based on hit effect
        if (this.hitEffect > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        }
        
        // Outline
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw health bar
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-healthBarWidth/2, -this.size - 10, healthBarWidth * healthPercent, healthBarHeight);
        
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(-healthBarWidth/2, -this.size - 10, healthBarWidth, healthBarHeight);
        
        ctx.restore();
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw());
    }
    
    hit() {
        this.health--;
        this.hitEffect = 10;
        
        // Play hit sound
        playSound(audio.bloopHigh);
        
        // Return true if destroyed
        return this.health <= 0;
    }
}

class EnemyBullet {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
        this.size = 3;
        this.lifespan = 120;
    }
    
    update() {
        this.position.add(this.velocity);
        
        // Screen wrap-around
        if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.x > canvas.width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvas.height;
        if (this.position.y > canvas.height) this.position.y = 0;
        
        this.lifespan--;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
    }
}

// Game state
let ship = new Ship();
let asteroids = [];
let enemyShips = [];
let particles = [];
let score = 0;
let gameOver = false;
let level = 1;
let gameStarted = false;
let enemySpawnTimer = 0;
let keys = {};

function playSound(sound) {
    if (!audioCtx) return; // Don't play if audio isn't initialized
    
    if (sound.currentTime > 0) {
        sound.currentTime = 0;
    }
    sound.play().catch(e => console.log("Sound playback failed:", e));
}

function spawnAsteroids(count = 10) { // Increased asteroid count
    for (let i = 0; i < count; i++) {
        // Determine if asteroid should target the player
        const shouldTarget = Math.random() < 0.4; // 40% chance to target player
        
        if (shouldTarget && ship) {
            asteroids.push(new Asteroid(3, null, ship.position));
        } else {
            asteroids.push(new Asteroid());
        }
    }
}

function spawnEnemyShip() {
    enemyShips.push(new EnemyShip(level));
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
    // Instead of redirecting to another page, clean up and let React handle navigation
    if (window.cleanupAsteroidsGame) {
        window.cleanupAsteroidsGame();
    }
}

function createExplosion(position, size, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const velocity = new Vector(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Random color from red to yellow
        const r = 255;
        const g = Math.floor(Math.random() * 200 + 55);
        const b = 0;
        const color = `rgb(${r}, ${g}, ${b})`;
        
        // Random particle size and lifespan
        const particleSize = Math.random() * size/5 + 1;
        const lifespan = Math.random() * 30 + 30;
        
        particles.push(new Particle(position, velocity, particleSize, color, lifespan));
    }
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
        
        window.gameLoopId = requestAnimationFrame(gameLoop);
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
            enemyShips = [];
            particles = [];
            spawnAsteroids(8 + level);
            score = 0;
            level = 1;
            gameOver = false;
        }
        
        window.gameLoopId = requestAnimationFrame(gameLoop);
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
    enemyShips.forEach(enemy => enemy.update(ship.position));
    particles.forEach(particle => particle.update());
    
    // Filter out dead particles
    particles = particles.filter(p => p.lifespan > 0);

    // Enemy ship spawning
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0 && enemyShips.length < 1 + Math.floor(level / 3)) {
        spawnEnemyShip();
        // Spawn enemy ships less frequently at higher levels
        enemySpawnTimer = Math.max(1200 - level * 50, 600);
    }

    // Check ship-asteroid collisions
    asteroids.forEach(asteroid => {
        if (circlesCollide(ship.position, ship.size / 2, asteroid.position, asteroid.radius)) {
            if (ship.hit()) {
                gameOver = true;
            }
        }
    });
    
    // Check ship-enemy bullet collisions
    enemyShips.forEach(enemy => {
        enemy.bullets.forEach((bullet, bulletIndex) => {
            if (circlesCollide(ship.position, ship.size / 2, bullet.position, bullet.size)) {
                // Remove the bullet
                enemy.bullets.splice(bulletIndex, 1);
                
                // Hit the player
                if (ship.hit()) {
                    gameOver = true;
                }
            }
        });
    });
    
    // Check ship-enemy ship collisions
    enemyShips.forEach((enemy, enemyIndex) => {
        if (circlesCollide(ship.position, ship.size, enemy.position, enemy.size/2)) {
            if (ship.hit()) {
                gameOver = true;
            }
            
            // Also damage enemy
            if (enemy.hit()) {
                // Create explosion
                createExplosion(enemy.position, enemy.size, 30);
                
                // Remove enemy
                enemyShips.splice(enemyIndex, 1);
                
                // Award points
                score += 1000;
            }
        }
    })

    // Handle ship bullets collisions with asteroids
    ship.bullets.forEach((bullet, bIdx) => {
        // Check bullet-asteroid collisions
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
        
        // Check bullet-enemy ship collisions
        enemyShips.forEach((enemy, enemyIdx) => {
            if (circlesCollide(bullet.position, bullet.size, enemy.position, enemy.size / 2)) {
                // Remove bullet
                ship.bullets.splice(bIdx, 1);
                
                // Damage enemy
                if (enemy.hit()) {
                    // Create explosion
                    createExplosion(enemy.position, enemy.size, 30);
                    
                    // Remove enemy
                    enemyShips.splice(enemyIdx, 1);
                    
                    // Award points
                    score += 1000;
                }
            }
        });
    });

    // Add spontaneous asteroids to keep the game from getting empty
    if (asteroids.length < 3 + level) {
        // Target player with 40% chance
        if (Math.random() < 0.4) {
            asteroids.push(new Asteroid(3, null, ship.position));
        } else {
            asteroids.push(new Asteroid());
        }
    }

    // Check for level completion - now requires fewer asteroids
    if (asteroids.length <= 2 && enemyShips.length === 0) {
        level++;
        spawnAsteroids(8 + level); // Increased asteroid count per level
        
        // Spawn an enemy ship for the new level
        if (level >= 2) {
            enemySpawnTimer = 300; // Spawn enemy soon after new level
        }
    }

    // Draw everything
    ship.draw();
    asteroids.forEach(asteroid => asteroid.draw());
    enemyShips.forEach(enemy => enemy.draw());
    particles.forEach(particle => particle.draw());

    // Draw HUD with better positioning
    const padding = 20; // Add padding
    ctx.font = '25px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, padding, padding + 25);
    ctx.fillText(`Lives: ${ship.lives}`, padding, padding + 60);
    ctx.fillText(`Level: ${level}`, padding, padding + 95);
    
    // Show enemy count if there are any
    if (enemyShips.length > 0) {
        ctx.fillText(`Enemy ships: ${enemyShips.length}`, padding, padding + 130);
    }

    // Draw ESC hint
    ctx.textAlign = 'right';
    ctx.font = '16px Courier New';
    ctx.fillText('ESC to return home', canvas.width - padding, padding + 25);

    window.gameLoopId = requestAnimationFrame(gameLoop);
}

// Input handling
function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    if (!gameStarted) startGame();
  }
  
  function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }
// Add click handler to initialize audio and start game
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
if (canvas) {
  canvas.addEventListener('click', startGame);
}
// Start the game
spawnAsteroids(10); // Start with more asteroids
window.gameLoopId = requestAnimationFrame(gameLoop);
gameLoop();