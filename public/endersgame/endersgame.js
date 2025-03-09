// endersgame.js - Asteroids-style game with advanced features

const EndersGame = {
    // Game state variables
    player: null,
    asteroids: [],
    bullets: [],
    enemyShips: [], // Add enemy ships array
    particles: [], // Add particles array
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    animationFrameId: null,
    keys: {},
    canvas: null,
    ctx: null,
    lastTime: 0,
    isInitialized: false,
    enemySpawnTimer: 0, // Timer for enemy spawning
    
    // Initialize the game
    init(canvasElement) {
      if (!canvasElement) {
        console.error('Canvas element is missing');
        return this;
      }
      
      console.log('Initializing Enders Game with canvas:', canvasElement);
      
      // Prevent double initialization
      if (this.isInitialized) {
        this.cleanup();
      }
      
      // Set up canvas
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      
      if (!this.ctx) {
        console.error('Failed to get canvas context');
        return this;
      }
      
      // Reset game state
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.gameOver = false;
      this.asteroids = [];
      this.bullets = [];
      this.enemyShips = [];
      this.particles = [];
      this.keys = {};
      this.enemySpawnTimer = 1200; // Initial enemy spawn timer
      
      // Create player ship with turrets
      this.player = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        radius: 15,
        angle: 0,
        rotation: 0,
        speedX: 0,
        speedY: 0,
        maxSpeed: 5,
        isThrusting: false,
        invulnerable: true,
        invulnerableTime: 3000,
        invulnerableTimer: 3000,
        // Add turret properties
        activeTurret: 'left', // Track which turret to fire from
        leftTurretRecoil: 0,  // Recoil animation for left turret
        rightTurretRecoil: 0  // Recoil animation for right turret
      };
      
      // Set up input listeners
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      this.gameLoop = this.gameLoop.bind(this);
      
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      
      // Start the first level
      this.startLevel();
      
      // Start the game loop
      this.lastTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
      this.isInitialized = true;
      
      console.log('Enders Game initialized successfully');
      
      // Return the game instance for cleanup
      return this;
    },
    
    // Handle cleanup
    cleanup() {
      console.log('Cleaning up Enders Game');
      
      // Stop animation frame
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      
      // Remove event listeners
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      
      // Clear game state
      this.player = null;
      this.asteroids = [];
      this.bullets = [];
      this.enemyShips = [];
      this.particles = [];
      this.canvas = null;
      this.ctx = null;
      this.isInitialized = false;
      
      console.log('Enders Game cleanup complete');
    },
    
    // Create a particle
    createParticle(x, y, speedX, speedY, size, color, lifeTime) {
      return {
        x,
        y,
        speedX,
        speedY,
        size,
        color,
        lifeTime,
        lifeTimer: lifeTime
      };
    },
    
    // Create an explosion effect at the given position
    createExplosion(x, y, size, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        
        // Random color from red to yellow
        const r = 255;
        const g = Math.floor(Math.random() * 200 + 55);
        const b = 0;
        const color = `rgb(${r}, ${g}, ${b})`;
        
        // Random particle size and lifespan
        const particleSize = Math.random() * size/5 + 1;
        const lifeTime = Math.random() * 30 + 30;
        
        this.particles.push(this.createParticle(
          x, y, speedX, speedY, particleSize, color, lifeTime
        ));
      }
    },
    
    // Create an enemy ship
    createEnemyShip() {
      // Choose a random edge to spawn from
      const position = this.randomEdgePosition();
      
      // Speed increases with game level
      const speed = 1 + this.level * 0.1;
      
      // Health increases with level
      const health = 5 + Math.floor(this.level / 2);
      
      return {
        x: position.x,
        y: position.y,
        speedX: Math.random() * speed - speed/2,
        speedY: Math.random() * speed - speed/2,
        radius: 30,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: 0.02,
        health,
        maxHealth: health,
        bullets: [],
        shootCooldown: 0,
        shootInterval: Math.max(90 - this.level * 5, 40), // Shoots faster at higher levels
        hitEffect: 0 // Flash effect when hit
      };
    },
    
    // Get a random position on the edge of the screen
    randomEdgePosition() {
      if (!this.canvas) return { x: 0, y: 0 };
      
      const edge = Math.floor(Math.random() * 4);
      const padding = 50;
      
      switch (edge) {
        case 0: return { x: Math.random() * this.canvas.width, y: -padding };
        case 1: return { x: this.canvas.width + padding, y: Math.random() * this.canvas.height };
        case 2: return { x: Math.random() * this.canvas.width, y: this.canvas.height + padding };
        case 3: return { x: -padding, y: Math.random() * this.canvas.height };
        default: return { x: -padding, y: Math.random() * this.canvas.height };
      }
    },
    
    // Start a new level
    startLevel() {
      if (!this.canvas || !this.player) return;
      
      // Create asteroids for this level
      this.asteroids = [];
      // Added more asteroids per level like in first game
      const numAsteroids = 8 + this.level; 
      
      for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        // Make sure asteroids don't spawn too close to the player
        do {
          x = Math.random() * this.canvas.width;
          y = Math.random() * this.canvas.height;
        } while (this.distanceBetween(x, y, this.player.x, this.player.y) < 150);
        
        // Determine if asteroid should target the player
        const shouldTarget = Math.random() < 0.4; // 40% chance to target player
        
        if (shouldTarget) {
          // Set a direction towards the player
          const dx = this.player.x - x;
          const dy = this.player.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          const size = 'large';
          const asteroid = this.createAsteroid(x, y, size);
          asteroid.angle = angle;
          this.asteroids.push(asteroid);
        } else {
          const size = 'large';
          this.asteroids.push(this.createAsteroid(x, y, size));
        }
      }
      
      // Make player invulnerable at the start of the level
      this.player.invulnerable = true;
      this.player.invulnerableTimer = this.player.invulnerableTime;
      
      // Reset enemy spawn timer
      this.enemySpawnTimer = 1200 - this.level * 100; // Spawn faster in higher levels
      if (this.enemySpawnTimer < 600) this.enemySpawnTimer = 600;
    },
    
    // Create an asteroid with the given parameters
    createAsteroid(x, y, size) {
      let radius, speed;
      
      switch (size) {
        case 'large':
          radius = 50;
          speed = Math.random() * 1 + 0.5;
          break;
        case 'medium':
          radius = 30;
          speed = Math.random() * 1.5 + 0.7;
          break;
        case 'small':
          radius = 15;
          speed = Math.random() * 2 + 1;
          break;
        default:
          radius = 50;
          speed = Math.random() * 1 + 0.5;
      }
      
      return {
        x,
        y,
        radius,
        size,
        angle: Math.random() * Math.PI * 2,
        speed,
        vertices: this.generateAsteroidVertices(radius)
      };
    },
    
    // Generate random vertices for an asteroid
    generateAsteroidVertices(radius) {
      const numVertices = Math.floor(Math.random() * 5) + 7; // 7-12 vertices
      const vertices = [];
      
      for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const vertexRadius = radius * (0.8 + Math.random() * 0.4); // Random radius between 80-120% of base radius
        vertices.push({
          x: Math.cos(angle) * vertexRadius,
          y: Math.sin(angle) * vertexRadius
        });
      }
      
      return vertices;
    },
    
    // Main game loop
    gameLoop(currentTime) {
      if (!this.isInitialized || !this.canvas || !this.ctx) {
        console.warn('Game loop running but game is not properly initialized');
        cancelAnimationFrame(this.animationFrameId);
        return;
      }
      
      try {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.update(deltaTime);
        this.render();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
      } catch (error) {
        console.error('Error in game loop:', error);
        cancelAnimationFrame(this.animationFrameId);
      }
    },
    
    // Update game state
    update(deltaTime) {
      if (!this.player || this.gameOver) return;
      
      // Update player
      this.updatePlayer(deltaTime);
      
      // Update bullets
      this.updateBullets(deltaTime);
      
      // Update asteroids
      this.updateAsteroids(deltaTime);
      
      // Update enemy ships
      this.updateEnemyShips(deltaTime);
      
      // Update particles
      this.updateParticles(deltaTime);
      
      // Check for collisions
      this.checkCollisions();
      
      // Enemy ship spawning
      this.enemySpawnTimer -= deltaTime;
      if (this.enemySpawnTimer <= 0 && this.enemyShips.length < 1 + Math.floor(this.level / 3)) {
        this.enemyShips.push(this.createEnemyShip());
        // Reset timer
        this.enemySpawnTimer = Math.max(1200 - this.level * 50, 600);
      }
      
      // Check if level is complete (when no asteroids and no enemy ships)
      if (this.asteroids.length === 0 && this.enemyShips.length === 0) {
        this.level++;
        this.startLevel();
      }
      
      // If asteroids are too few, spawn more
      if (this.asteroids.length < 3 + this.level && Math.random() < 0.01) {
        // Target player with 40% chance
        if (Math.random() < 0.4) {
          const position = this.randomEdgePosition();
          const asteroid = this.createAsteroid(position.x, position.y, 'large');
          
          // Set direction towards player
          const dx = this.player.x - position.x;
          const dy = this.player.y - position.y;
          asteroid.angle = Math.atan2(dy, dx);
          
          this.asteroids.push(asteroid);
        } else {
          const position = this.randomEdgePosition();
          this.asteroids.push(this.createAsteroid(position.x, position.y, 'large'));
        }
      }
    },
    
    // Update particles
    updateParticles(deltaTime) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Update lifetime
        particle.lifeTimer -= deltaTime;
        if (particle.lifeTimer <= 0) {
          this.particles.splice(i, 1);
        }
      }
    },
    
    // Update enemy ships
    updateEnemyShips(deltaTime) {
      for (let i = this.enemyShips.length - 1; i >= 0; i--) {
        const enemy = this.enemyShips[i];
        
        // Sometimes change direction to follow the player
        if (Math.random() < 0.01) {
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          enemy.speedX = (dx / distance) * (1 + this.level * 0.1);
          enemy.speedY = (dy / distance) * (1 + this.level * 0.1);
        }
        
        // Occasionally change rotation
        if (Math.random() < 0.02) {
          enemy.angle += Math.random() * Math.PI - Math.PI/2;
        }
        
        // Move
        enemy.x += enemy.speedX;
        enemy.y += enemy.speedY;
        
        // Rotate
        enemy.angle += enemy.rotationSpeed;
        
        // Screen wrapping
        this.wrapObject(enemy);
        
        // Shooting logic
        enemy.shootCooldown -= deltaTime;
        if (enemy.shootCooldown <= 0) {
          this.enemyShoot(enemy);
          enemy.shootCooldown = enemy.shootInterval;
        }
        
        // Update enemy bullets
        for (let j = enemy.bullets.length - 1; j >= 0; j--) {
          const bullet = enemy.bullets[j];
          
          // Update position
          bullet.x += Math.cos(bullet.angle) * bullet.speed;
          bullet.y += Math.sin(bullet.angle) * bullet.speed;
          
          // Screen wrapping
          this.wrapObject(bullet);
          
          // Update lifetime
          bullet.lifeTimer -= deltaTime;
          if (bullet.lifeTimer <= 0) {
            enemy.bullets.splice(j, 1);
          }
        }
        
        // Decrease hit effect
        if (enemy.hitEffect > 0) {
          enemy.hitEffect -= deltaTime;
        }
      }
    },
    
    // Enemy ship shoots at player
    enemyShoot(enemy) {
      if (!this.player) return;
      
      // Calculate direction to player
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      
      // Add some inaccuracy
      const angle = Math.atan2(dy, dx);
      const inaccuracy = Math.random() * 0.3 - 0.15; // +/- 0.15 radians
      
      const bullet = {
        x: enemy.x,
        y: enemy.y,
        radius: 3,
        angle: angle + inaccuracy,
        speed: 4,
        lifeTimer: 1500,
        color: '#ff0000'
      };
      
      enemy.bullets.push(bullet);
    },
    
    // Update player state
    updatePlayer(deltaTime) {
      if (!this.player) return;
      
      // Handle player input
      if (this.keys["ArrowLeft"] || this.keys["a"]) {
        this.player.rotation = -0.05;
      } else if (this.keys["ArrowRight"] || this.keys["d"]) {
        this.player.rotation = 0.05;
      } else {
        this.player.rotation = 0;
      }
      
      this.player.isThrusting = this.keys["ArrowUp"] || this.keys["w"];
      
      // Fire bullets
      if ((this.keys[" "] || this.keys["f"]) && this.bullets.length < 5) {
        // Only create a new bullet if space was just pressed (not held)
        if (!this.keys.spacePressed) {
          this.keys.spacePressed = true;
          this.fireBullet();
        }
      } else {
        this.keys.spacePressed = false;
      }
      
      // Update player angle
      this.player.angle += this.player.rotation;
      
      // Update player speed based on thrust
      if (this.player.isThrusting) {
        const thrustX = Math.cos(this.player.angle) * 0.1;
        const thrustY = Math.sin(this.player.angle) * 0.1;
        
        this.player.speedX = (this.player.speedX || 0) + thrustX;
        this.player.speedY = (this.player.speedY || 0) + thrustY;
        
        // Limit speed
        const currentSpeed = Math.sqrt(this.player.speedX * this.player.speedX + this.player.speedY * this.player.speedY);
        if (currentSpeed > this.player.maxSpeed) {
          const ratio = this.player.maxSpeed / currentSpeed;
          this.player.speedX *= ratio;
          this.player.speedY *= ratio;
        }
      }
      
      // Apply velocity
      this.player.x += this.player.speedX || 0;
      this.player.y += this.player.speedY || 0;
      
      // Screen wrapping
      this.wrapObject(this.player);
      
      // Update invulnerability timer
      if (this.player.invulnerable) {
        this.player.invulnerableTimer -= deltaTime;
        if (this.player.invulnerableTimer <= 0) {
          this.player.invulnerable = false;
        }
      }
      
      // Update turret recoil animation
      if (this.player.leftTurretRecoil > 0) {
        this.player.leftTurretRecoil -= deltaTime * 0.05;
        if (this.player.leftTurretRecoil < 0) this.player.leftTurretRecoil = 0;
      }
      
      if (this.player.rightTurretRecoil > 0) {
        this.player.rightTurretRecoil -= deltaTime * 0.05;
        if (this.player.rightTurretRecoil < 0) this.player.rightTurretRecoil = 0;
      }
    },
    
    // Fire a bullet from the player's ship's turrets
    fireBullet() {
      if (!this.player) return;
      
      let bulletX, bulletY;
      
      // Determine which turret to fire from
      if (this.player.activeTurret === 'left') {
        // Calculate left turret position
        const turretX = Math.cos(this.player.angle) * (this.player.radius/2) - Math.sin(this.player.angle) * (this.player.radius/3);
        const turretY = Math.sin(this.player.angle) * (this.player.radius/2) + Math.cos(this.player.angle) * (this.player.radius/3);
        bulletX = this.player.x + turretX;
        bulletY = this.player.y + turretY;
        
        // Apply recoil
        this.player.leftTurretRecoil = 5;
        
        // Switch turret for next shot
        this.player.activeTurret = 'right';
      } else {
        // Calculate right turret position
        const turretX = Math.cos(this.player.angle) * (this.player.radius/2) + Math.sin(this.player.angle) * (this.player.radius/3);
        const turretY = Math.sin(this.player.angle) * (this.player.radius/2) - Math.cos(this.player.angle) * (this.player.radius/3);
        bulletX = this.player.x + turretX;
        bulletY = this.player.y + turretY;
        
        // Apply recoil
        this.player.rightTurretRecoil = 5;
        
        // Switch turret for next shot
        this.player.activeTurret = 'left';
      }
      
      const bullet = {
        x: bulletX,
        y: bulletY,
        radius: 3,
        angle: this.player.angle,
        speed: 10,
        lifeTime: 60 * (1000/60), // Shorter bullet lifetime like in first game (60 frames)
        lifeTimer: 60 * (1000/60),
        color: '#0f0'
      };
      
      this.bullets.push(bullet);
    },
    
    // Update all bullets
    updateBullets(deltaTime) {
      if (!this.canvas) return;
      
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        
        // Update position
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // Screen wrapping
        this.wrapObject(bullet);
        
        // Update lifetime
        bullet.lifeTimer -= deltaTime;
        if (bullet.lifeTimer <= 0) {
          this.bullets.splice(i, 1);
        }
      }
    },
    
    // Update all asteroids
    updateAsteroids(deltaTime) {
      if (!this.canvas) return;
      
      for (const asteroid of this.asteroids) {
        // Update position
        asteroid.x += Math.cos(asteroid.angle) * asteroid.speed;
        asteroid.y += Math.sin(asteroid.angle) * asteroid.speed;
        
        // Screen wrapping
        this.wrapObject(asteroid);
      }
    },
    
    // Check all collisions
    checkCollisions() {
      if (!this.player) return;
      
      if (!this.player.invulnerable) {
        // Check player-asteroid collisions
        for (let i = 0; i < this.asteroids.length; i++) {
          if (this.checkCollision(this.player, this.asteroids[i])) {
            this.handlePlayerHit();
            break;
          }
        }
        
        // Check player-enemy bullet collisions
        for (const enemy of this.enemyShips) {
          for (let i = enemy.bullets.length - 1; i >= 0; i--) {
            const bullet = enemy.bullets[i];
            if (this.checkCollision(this.player, bullet)) {
              // Remove bullet
              enemy.bullets.splice(i, 1);
              
              // Hit player
              this.handlePlayerHit();
              break;
            }
          }
        }
        
        // Check player-enemy ship collisions
        for (let i = this.enemyShips.length - 1; i >= 0; i--) {
          const enemy = this.enemyShips[i];
          if (this.checkCollision(this.player, enemy)) {
            // Hit player
            this.handlePlayerHit();
            
            // Damage enemy
            enemy.health--;
            enemy.hitEffect = 500;
            
            if (enemy.health <= 0) {
              // Create explosion
              this.createExplosion(enemy.x, enemy.y, enemy.radius, 30);
              
              // Remove enemy
              this.enemyShips.splice(i, 1);
              
              // Award points
              this.score += 1000;
            }
            
            break;
          }
        }
      }
      
      // Check bullet-asteroid collisions
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        
        for (let j = this.asteroids.length - 1; j >= 0; j--) {
          const asteroid = this.asteroids[j];
          
          if (this.checkCollision(bullet, asteroid)) {
            // Remove bullet
            this.bullets.splice(i, 1);
            
            // Create particles/explosion
            this.createExplosion(asteroid.x, asteroid.y, asteroid.radius/2, 15);
            
            // Split asteroid or remove it
            this.splitAsteroid(j);
            
            // Only hit one asteroid per bullet
            break;
          }
        }
      }
      
      // Check bullet-enemy ship collisions
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        
        for (let j = this.enemyShips.length - 1; j >= 0; j--) {
          const enemy = this.enemyShips[j];
          
          if (this.checkCollision(bullet, enemy)) {
            // Remove bullet
            this.bullets.splice(i, 1);
            
            // Damage enemy
            enemy.health--;
            enemy.hitEffect = 500;
            
            if (enemy.health <= 0) {
              // Create explosion
              this.createExplosion(enemy.x, enemy.y, enemy.radius, 30);
              
              // Remove enemy
              this.enemyShips.splice(j, 1);
              
              // Award points
              this.score += 1000;
            }
            
            // Only hit one enemy per bullet
            break;
          }
        }
      }
    },
    
    // Update score based on asteroid size
    updateScore(asteroidSize) {
      switch (asteroidSize) {
        case 'large':
          this.score += 20;
          break;
        case 'medium':
          this.score += 50;
          break;
        case 'small':
          this.score += 100;
          break;
      }
    },
    
    // Handle player getting hit by an asteroid
    handlePlayerHit() {
      if (!this.player || !this.canvas) return;
      
      this.lives--;
      
      // Create explosion at player position
      this.createExplosion(this.player.x, this.player.y, this.player.radius, 20);
      
      if (this.lives <= 0) {
        this.gameOver = true;
      } else {
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.speedX = 0;
        this.player.speedY = 0;
        this.player.angle = 0;
        
        // Make player invulnerable temporarily
        this.player.invulnerable = true;
        this.player.invulnerableTimer = this.player.invulnerableTime;
      }
    },
    
    // Split an asteroid or remove it
    splitAsteroid(asteroidIndex) {
      const asteroid = this.asteroids[asteroidIndex];
      
      // Update score based on size
      this.updateScore(asteroid.size);
      
      // Remove the original asteroid
      this.asteroids.splice(asteroidIndex, 1);
      
      // Split asteroid if it's not the smallest size
      if (asteroid.size !== 'small') {
        const newSize = asteroid.size === 'large' ? 'medium' : 'small';
        
        // Create two new asteroids
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = asteroid.speed * 1.3; // Slightly faster
          
          const newAsteroid = this.createAsteroid(
            asteroid.x,
            asteroid.y,
            newSize
          );
          
          // Adjust angle and speed
          newAsteroid.angle = angle;
          newAsteroid.speed = speed;
          
          this.asteroids.push(newAsteroid);
        }
      }
    },
    
    // Check collision between two objects
    checkCollision(obj1, obj2) {
      const distance = this.distanceBetween(obj1.x, obj1.y, obj2.x, obj2.y);
      return distance < obj1.radius + obj2.radius;
    },
    
    // Calculate distance between two points
    distanceBetween(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Wrap object position around the screen edges
    wrapObject(obj) {
      if (!this.canvas) return;
      
      if (obj.x < 0) {
        obj.x = this.canvas.width;
      } else if (obj.x > this.canvas.width) {
        obj.x = 0;
      }
      
      if (obj.y < 0) {
        obj.y = this.canvas.height;
      } else if (obj.y > this.canvas.height) {
        obj.y = 0;
      }
    },
    
    // Handle keydown events
    handleKeyDown(e) {
      this.keys[e.key] = true;
      
      // Prevent scrolling with arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    },
    
    // Handle keyup events
    handleKeyUp(e) {
      this.keys[e.key] = false;
    },
    
    // Render the game
    render() {
      if (!this.ctx || !this.canvas) return;
      
      // Clear the canvas
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render particles
      this.renderParticles();
      
      // Render player
      this.renderPlayer();
      
      // Render bullets
      this.renderBullets();
      
      // Render asteroids
      this.renderAsteroids();
      
      // Render enemy ships
      this.renderEnemyShips();
      
      // Render UI
      this.renderUI();
      
      // Render game over message if needed
      if (this.gameOver) {
        this.renderGameOver();
      }
    },
    
    // Render particles
    renderParticles() {
      if (!this.ctx) return;
      
      for (const particle of this.particles) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.fill();
      }
    },
    
    // Render enemy ships
    renderEnemyShips() {
      if (!this.ctx) return;
      
      for (const enemy of this.enemyShips) {
        this.ctx.save();
        
        // Move to enemy position and rotate
        this.ctx.translate(enemy.x, enemy.y);
        this.ctx.rotate(enemy.angle);
        
        // Draw hexagonal enemy ship
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * enemy.radius;
          const y = Math.sin(angle) * enemy.radius;
          
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();
        
        // Fill with color based on hit effect
        if (enemy.hitEffect > 0) {
          this.ctx.fillStyle = '#ff0000';
          this.ctx.fill();
        }
        
        // Outline
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw health bar
        const healthBarWidth = enemy.radius * 2;
        const healthBarHeight = 5;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(-healthBarWidth/2, -enemy.radius - 10, healthBarWidth * healthPercent, healthBarHeight);
        
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.strokeRect(-healthBarWidth/2, -enemy.radius - 10, healthBarWidth, healthBarHeight);
        
        this.ctx.restore();
        
        // Draw enemy bullets
        for (const bullet of enemy.bullets) {
          this.ctx.beginPath();
          this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#ff0000';
          this.ctx.fill();
        }
      }
    },
    
    // Render the player's ship
    renderPlayer() {
      if (!this.ctx || !this.player || this.gameOver) return;
      
      this.ctx.save();
      
      // Move to player position and rotate
      this.ctx.translate(this.player.x, this.player.y);
      this.ctx.rotate(this.player.angle);
      
      // Flash player if invulnerable
      if (this.player.invulnerable && Math.floor(this.lastTime / 200) % 2 === 0) {
        this.ctx.globalAlpha = 0.5;
      }
      
      // Draw improved ship shape based on first file
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.radius, 0);
      this.ctx.lineTo(-this.player.radius / 2, this.player.radius / 2);
      this.ctx.lineTo(-this.player.radius / 3, 0);  // Indent
      this.ctx.lineTo(-this.player.radius / 2, -this.player.radius / 2);
      this.ctx.closePath();
      this.ctx.strokeStyle = '#0f0';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw left turret with recoil
      const leftTurretLength = 10 - this.player.leftTurretRecoil;
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.radius/2, -this.player.radius/3);
      this.ctx.lineTo(this.player.radius/2 + leftTurretLength, -this.player.radius/3);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#0f0';
      this.ctx.stroke();
      
      // Draw right turret with recoil
      const rightTurretLength = 10 - this.player.rightTurretRecoil;
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.radius/2, this.player.radius/3);
      this.ctx.lineTo(this.player.radius/2 + rightTurretLength, this.player.radius/3);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#0f0';
      this.ctx.stroke();
      
      // Draw thrust flame if thrusting
      if (this.player.isThrusting) {
        this.ctx.beginPath();
        
        // Flicker effect for flame
        const flickerOffset = Math.random() * 0.3 + 0.7;
        
        // Main flame
        this.ctx.moveTo(-this.player.radius / 3, 0);
        this.ctx.lineTo(-this.player.radius * 1.2 * flickerOffset, 0);
        
        // Flame width varies
        const flameWidth = this.player.radius / 4 * flickerOffset;
        
        // Draw flame edges
        this.ctx.lineTo(-this.player.radius * 0.8, flameWidth);
        this.ctx.lineTo(-this.player.radius / 3, 0);
        this.ctx.lineTo(-this.player.radius * 0.8, -flameWidth);
        this.ctx.lineTo(-this.player.radius * 1.2 * flickerOffset, 0);
        
        // Flame gradient
        const gradient = this.ctx.createLinearGradient(
          -this.player.radius / 3, 0, 
          -this.player.radius * 1.2, 0
        );
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#ffcc00');
        gradient.addColorStop(1, '#ff9900');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
      
      this.ctx.restore();
    },
    
    // Render all bullets
    renderBullets() {
      if (!this.ctx) return;
      
      this.ctx.fillStyle = '#0f0';
      
      for (const bullet of this.bullets) {
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    },
    
    // Render all asteroids
    renderAsteroids() {
      if (!this.ctx) return;
      
      this.ctx.strokeStyle = '#0f0';
      this.ctx.lineWidth = 2;
      
      for (const asteroid of this.asteroids) {
        this.ctx.beginPath();
        
        // Draw asteroid shape using vertices
        this.ctx.save();
        this.ctx.translate(asteroid.x, asteroid.y);
        
        const firstVertex = asteroid.vertices[0];
        this.ctx.moveTo(firstVertex.x, firstVertex.y);
        
        for (let i = 1; i < asteroid.vertices.length; i++) {
          const vertex = asteroid.vertices[i];
          this.ctx.lineTo(vertex.x, vertex.y);
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
      }
    },
    
    // Render UI (score, lives, level)
    renderUI() {
      if (!this.ctx || !this.canvas) return;
      
      const padding = 20; // Add padding
      
      // Render score
      this.ctx.fillStyle = '#0f0';
      this.ctx.font = '25px Courier New';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`Score: ${this.score}`, padding, padding + 25);
      this.ctx.fillText(`Lives: ${this.lives}`, padding, padding + 60);
      this.ctx.fillText(`Level: ${this.level}`, padding, padding + 95);
      
      // Show enemy count if there are any
      if (this.enemyShips.length > 0) {
        this.ctx.fillText(`Enemy ships: ${this.enemyShips.length}`, padding, padding + 130);
      }
      
      // Draw ESC hint
      this.ctx.textAlign = 'right';
      this.ctx.font = '16px Courier New';
      this.ctx.fillText('ESC to quit', this.canvas.width - padding, padding + 25);
    },
    
    // Render game over message
    renderGameOver() {
      if (!this.ctx || !this.canvas) return;
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#0f0';
      this.ctx.font = '40px Courier New';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
      this.ctx.font = '24px Courier New';
      this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
      this.ctx.fillText('PRESS SPACE TO RESTART', this.canvas.width / 2, this.canvas.height / 2 + 50);
      
      // Check for restart
      if (this.keys[" "]) {
        // Reset game
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.speedX = 0;
        this.player.speedY = 0;
        this.player.angle = 0;
        this.player.invulnerable = true;
        this.player.invulnerableTimer = this.player.invulnerableTime;
        
        // Clear game objects
        this.asteroids = [];
        this.bullets = [];
        this.enemyShips = [];
        this.particles = [];
        
        //start new level
        this.startLevel();
      }
    }
};

export default EndersGame;