window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = (canvas.width = window.innerWidth);
  const CANVAS_HEIGHT = (canvas.height = window.innerHeight);

  let score = 0;
  let distance = 0;
  let gameSpeed = 5;
  let enemies = [];
  let particles = [];
  let projectiles = [];
  let backgroundLayers = [];
  const enemyTypes = ["asteroid", "ufo"];

  const backgroundLayer1 = document.getElementById("layer1");
  const backgroundLayer2 = document.getElementById("layer2");
  const backgroundLayer3 = document.getElementById("layer3");
  const backgroundLayer4 = document.getElementById("layer4");
  const backgroundLayer5 = document.getElementById("layer5");

  const scoreEl = document.getElementById("score-el");
  const interface = document.getElementById("interface");
  const gameOverEl = document.getElementById("game-over");
  const distanceEl = document.getElementById("distance-el");
  const startGameEl = document.getElementById("start-game");
  const scoreWrapper = document.getElementById("score-wrapper");
  const startGameBtn = document.getElementById("start-game-btn");
  const finalScoreEl = document.getElementById("final-score-el");
  const restartGameBtn = document.getElementById("restart-game-btn");
  const distanceWrapper = document.getElementById("distance-wrapper");
  const finalDistanceEl = document.getElementById("final-distance-el");

  class Layer {
    constructor(image, speedModifier) {
      this.x = 0;
      this.y = 0;
      this.width = 4096;
      this.height = 4096;
      this.image = image;
      this.speedModifier = speedModifier;
      this.speed = gameSpeed * this.speedModifier;
    }
    update() {
      this.speed = gameSpeed * this.speedModifier;
      if (this.y >= this.height) {
        this.y = 0;
      }
      this.y += this.speed;
      this.draw();
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.x,
        this.y - gameSpeed,
        this.width,
        this.height
      );
      ctx.drawImage(
        this.image,
        this.x,
        this.y - this.height,
        this.width,
        this.height
      );
    }
  }

  class InputHandler {
    constructor() {
      this.keys = [];
      this.canShoot = true;
      window.addEventListener("keydown", ({ key }) => {
        if (
          (key === "w" || key === "s" || key === "a" || key === "d") &&
          !this.keys.includes(key)
        ) {
          this.keys.push(key);
        }
        if (key === " " && this.canShoot) this.isShooting = true;
      });
      window.addEventListener("keyup", ({ key }) => {
        if (key === "w" || key === "s" || key === "a" || key === "d") {
          this.keys.splice(this.keys.indexOf(key), 1);
        }
        if (key === " ") {
          this.isShooting = false;
          this.canShoot = true;
        }
      });
      startGameBtn.addEventListener("click", () => {
        isGameOver = false;
        init();
      });
      restartGameBtn.addEventListener("click", () => {
        isGameOver = false;
        init();
      });
    }
  }

  class Player {
    constructor() {
      this.spriteWidth = 500;
      this.spriteHeight = 500;
      this.width = this.spriteWidth * 0.75;
      this.height = this.spriteHeight * 0.75;
      this.image = document.getElementById("player");
      this.flameImage = document.getElementById("flame1");
      this.position = {
        x: CANVAS_WIDTH * 0.5 - this.width * 0.5,
        y: CANVAS_HEIGHT * 0.5 - this.height * 0.5,
      };
      this.velocity = {
        x: 0,
        y: 0,
      };
      this.hitbox = {
        x: this.position.x,
        y: this.position.y,
        width: this.width / 3,
        height: this.height / 2,
      };
      this.health = 200;
      this.maxHealth = 200;
      this.rotation = 0;
      this.maxRotation = 0.175;
      this.rotationSpeed = 0.005;
      this.maxSpeed = 10;
      this.acceleration = 0.2;
      this.deceleration = 0.99;
      this.flameRadius = 50;
      this.currentFrame = 1;
      this.timeToNewFrame = 0;
      this.frameInterval = 75;
    }
    updateHitbox() {
      this.hitbox.x = this.position.x + this.width / 3;
      this.hitbox.y = this.position.y + this.height / 3.75;
    }
    update(pressedKeys, isShooting, deltaTime) {
      this.draw();
      this.animateFlames(deltaTime);
      this.handleInput(pressedKeys, isShooting);
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.updateHitbox();
      this.handleBoundaries();
    }
    handleInput(keys, isShooting) {
      let accelX = 0;
      let accelY = 0;
      if (keys.includes("a")) {
        accelX = -this.acceleration;
        if (this.rotation >= -this.maxRotation)
          this.rotation -= this.rotationSpeed;
      }
      if (keys.includes("d")) {
        accelX = this.acceleration;
        if (this.rotation <= this.maxRotation)
          this.rotation += this.rotationSpeed;
      }
      if (!keys.includes("a") && !keys.includes("d")) {
        if (this.rotation > 0) {
          this.rotation -= this.rotationSpeed;
          if (this.rotation < 0) this.rotation = 0;
        }
        if (this.rotation < 0) {
          this.rotation += this.rotationSpeed;
          if (this.rotation > 0) this.rotation = 0;
        }
      }
      if (keys.includes("w")) {
        gameSpeed = 7;
        accelY = -this.acceleration;
      }
      if (keys.includes("s")) {
        gameSpeed = 3;
        accelY = this.acceleration;
      }
      this.velocity.x += accelX;
      this.velocity.y += accelY;
      this.velocity.x = Math.max(
        Math.min(this.velocity.x, this.maxSpeed),
        -this.maxSpeed
      );
      this.velocity.y = Math.max(
        Math.min(this.velocity.y, this.maxSpeed),
        -this.maxSpeed
      );
      if (!keys.includes("a") && !keys.includes("d"))
        this.velocity.x *= this.deceleration;
      if (!keys.includes("w") && !keys.includes("s")) {
        gameSpeed = 5;
        this.velocity.y *= this.deceleration;
      }
      if (isShooting && input.canShoot) {
        projectiles.push(
          new Projectile({
            position: {
              x: player.position.x + player.width / 2 + 22,
              y: player.position.y + 140,
            },
            velocity: {
              x: 0,
              y: -20,
            },
          }),
          new Projectile({
            position: {
              x: player.position.x + player.width / 2 - 46,
              y: player.position.y + 140,
            },
            velocity: {
              x: 0,
              y: -20,
            },
          })
        );
        input.canShoot = false;
      }
    }
    handleBoundaries() {
      if (this.position.x <= 0) this.position.x = 0;
      else if (this.position.x >= CANVAS_WIDTH - this.width)
        this.position.x = CANVAS_WIDTH - this.width;
      if (this.position.y <= 0) this.position.y = 0;
      else if (this.position.y >= CANVAS_HEIGHT - this.height)
        this.position.y = CANVAS_HEIGHT - this.height;
    }
    animateFlames(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        this.currentFrame === 1
          ? (this.currentFrame = 2)
          : (this.currentFrame = 1);
        this.flameImage = document.getElementById(`flame${this.currentFrame}`);
        this.animateFlameGlow();
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    animateFlameGlow() {
      if (this.currentFrame === 1) {
        this.flameRadius = 75;
      } else {
        this.flameRadius = 50;
      }
    }
    drawFlames() {
      ctx.drawImage(
        this.flameImage,
        this.position.x - 20,
        this.position.y + 125,
        this.width,
        this.height
      );
      ctx.drawImage(
        this.flameImage,
        this.position.x + 20,
        this.position.y + 125,
        this.width,
        this.height
      );
    }
    drawFlameGlow(x, y) {
      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        this.flameRadius
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      gradient.addColorStop(0.3, "rgba(255, 230, 150, 0.15)");
      gradient.addColorStop(0.6, "rgba(255, 150, 50, 0.1)");
      gradient.addColorStop(0.9, "rgba(255, 50, 0, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    draw() {
      ctx.save();
      ctx.translate(
        this.position.x + this.width * 0.5,
        this.position.y + this.height * 0.5
      );
      ctx.rotate(this.rotation);
      ctx.translate(
        -this.position.x - this.width * 0.5,
        -this.position.y - this.height * 0.5
      );
      this.drawFlames();
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
      this.drawFlameGlow(this.position.x + 160, this.position.y + 310);
      this.drawFlameGlow(this.position.x + 220, this.position.y + 310);
      ctx.restore();
    }
  }

  class Healthbar {
    constructor(player) {
      this.player = player;
      this.x = this.player.position.x;
      this.y = this.player.position.y - 10;
      this.wrapper = document.getElementById("healthbar");
      this.healthbar1 = document.getElementById("healthbar1");
      this.healthbar2 = document.getElementById("healthbar2");
    }
    setHealth(health) {
      const maxWidth = 200;
      const currentHealth = (health / this.player.maxHealth) * maxWidth;
      this.healthbar2.style.width = `${currentHealth}px`;
    }
    update() {
      this.draw();
      if (this.player.health <= 0) {
        isGameOver = true;
        this.setHealth(0);
      } else {
        this.setHealth(this.player.health);
      }
      this.x = this.player.position.x + this.player.width / 2 - 100;
      this.y = this.player.position.y + 20;
    }
    draw() {
      this.healthbar1.style.left = `${this.x}px`;
      this.healthbar1.style.top = `${this.y}px`;
      this.healthbar2.style.left = `${this.x}px`;
      this.healthbar2.style.top = `${this.y}px`;
    }
    init() {
      this.wrapper.style.display = "block";
    }
  }

  class Ufo {
    constructor(x, vx, vy) {
      this.spriteWidth = 512;
      this.spriteHeight = 512;
      this.width = this.spriteWidth * 0.25;
      this.height = this.spriteHeight * 0.25;
      this.image = document.getElementById("ufo1");
      this.velocity = {
        x: vx + (Math.random() * 0.5 - 0.25),
        y: vy + (Math.random() * 2 - 1),
      };
      this.position = {
        x: x,
        y: -this.height,
      };
      this.hitbox = {
        x: this.position.x,
        y: this.position.y,
        width: this.width,
        height: this.height,
      };
      this.maxFrames = 20;
      this.currentFrame = 1;
      this.frameInterval = 10;
      this.timeToNewFrame = 0;
      this.randomMovementFactor = Math.random() * 0.5 + 0.5;
    }
    move() {
      this.position.x +=
        this.velocity.x +
        Math.sin(this.position.y * this.randomMovementFactor) * 0.5;
      this.position.y += this.velocity.y;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        if (this.currentFrame < this.maxFrames) this.currentFrame++;
        else this.currentFrame = 1;
        this.image = document.getElementById(`ufo${this.currentFrame}`);
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    updateHitbox() {
      this.hitbox.x = this.position.x;
      this.hitbox.y = this.position.y;
    }
    update(deltaTime) {
      this.draw();
      this.move();
      this.updateHitbox();
      this.animate(deltaTime);
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
    destroy() {
      createParticles({ object: this, color: "rgba(255, 255, 255, 0.2)" });
      createParticles({ object: this, color: "rgba(255, 230, 150, 0.25)" });
      createParticles({ object: this, color: "rgba(255, 150, 50, 0.2)" });
      createParticles({ object: this, color: "rgba(255, 50, 0, 0.15)" });
    }
  }

  class Asteroid {
    constructor(x, vx, vy) {
      this.spriteWidth = 96;
      this.spriteHeight = 96;
      this.sizeModifier = Math.random() * 3 + 2;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.image = document.getElementById("asteroid");
      this.velocity = {
        x: vx + (Math.random() * 0.5 - 0.25),
        y: vy + (Math.random() * 2 - 1),
      };
      this.position = {
        x: x,
        y: -this.height,
      };
      this.hitbox = this.calculateHitbox();
      this.rotation = Math.random() * Math.PI * 2;
      this.spinSpeed = Math.random() * 0.02 + 0.01;
      this.spinDirection = Math.random() < 0.5 ? 1 : -1;
      this.randomMovementFactor = Math.random() * 0.5 + 0.5;
    }
    calculateHitbox() {
      const halfWidth = this.width * 0.5;
      const halfHeight = this.height * 0.5;
      return {
        x: this.position.x + halfWidth,
        y: this.position.y + halfHeight,
        width: this.width * 0.4,
        height: this.height * 0.4,
      };
    }
    updateHitbox() {
      this.hitbox.x = this.position.x + this.hitbox.width * 0.75;
      this.hitbox.y = this.position.y + this.hitbox.height * 0.75;
    }
    update() {
      this.rotation += this.spinSpeed * this.spinDirection;
      this.position.x +=
        this.velocity.x +
        Math.sin(this.position.y * this.randomMovementFactor) * 0.5;
      this.position.y += this.velocity.y;
      this.updateHitbox();
      this.draw();
    }
    draw() {
      ctx.save();
      ctx.translate(
        this.position.x + this.width * 0.5,
        this.position.y + this.height * 0.5
      );
      ctx.rotate(this.rotation);
      ctx.translate(-this.width * 0.5, -this.height * 0.5);
      ctx.drawImage(this.image, 0, 0, this.width, this.height);
      ctx.restore();
    }
    destroy() {
      createParticles({ object: this });
    }
  }

  class Projectile {
    constructor({ position, velocity }) {
      this.position = position;
      this.velocity = velocity;
      this.spriteWidth = 24;
      this.spriteHeight = 24;
      this.image = document.getElementById("projectile");
      this.hitbox = {
        x: this.position.x + 20,
        y: this.position.y,
        width: 5,
        height: this.spriteHeight,
      };
    }
    update() {
      this.draw();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.updateHitbox();
    }
    updateHitbox() {
      this.hitbox.x = this.position.x + 10;
      this.hitbox.y = this.position.y + 10;
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.spriteWidth,
        this.spriteHeight
      );
    }
  }

  class Particle {
    constructor({ position, velocity, radius, color, lifeSpan }) {
      this.opacity = 1;
      this.color = color || "#966C6C";
      this.radius = radius;
      this.position = position;
      this.velocity = velocity;
      this.lifeSpan = lifeSpan || 100;
      this.age = 0;
    }
    update() {
      this.age++;
      this.opacity -= 0.01;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.draw();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }
    isDead() {
      return this.age >= this.lifeSpan || this.opacity <= 0;
    }
  }

  function checkCollision(thing1, thing2) {
    return (
      thing1.hitbox.x < thing2.hitbox.x + thing2.hitbox.width &&
      thing1.hitbox.x + thing1.hitbox.width > thing2.hitbox.x &&
      thing1.hitbox.y < thing2.hitbox.y + thing2.hitbox.height &&
      thing1.hitbox.y + thing1.hitbox.height > thing2.hitbox.y
    );
  }

  function createParticles({ object, color }) {
    const particleCount = Math.random() * 50 + 50;
    for (let i = 0; i < particleCount; i++) {
      const velocityX = (Math.random() - 0.5) * (Math.random() * 3 + 3);
      const velocityY = (Math.random() - 0.5) * (Math.random() * 3 + 3);
      const radius = Math.random() * 3 + 2;
      const particleColor = color || "#966C6C";
      const lifeSpan = Math.random() * 50 + 50;
      setTimeout(() => {
        particles.push(
          new Particle({
            position: {
              x: object.position.x + object.width / 2,
              y: object.position.y + object.height / 2,
            },
            velocity: {
              x: velocityX,
              y: velocityY,
            },
            radius: radius,
            color: particleColor,
            lifeSpan: lifeSpan,
          })
        );
      }, 0);
    }
  }

  function spawnEnemies(deltaTime) {
    if (timeToNewAsteroid >= asteroidInterval) {
      asteroidInterval = Math.random() * 750 + 250;
      const vx = Math.random() * 10 - 5;
      const vy = Math.random() * 13 + 2;
      const x = Math.random() * CANVAS_WIDTH;
      const enemyToSpawn = Math.random() < 0.9 ? enemyTypes[0] : enemyTypes[1];
      if (enemyToSpawn === "asteroid") enemies.push(new Asteroid(x, vx, vy));
      else if (enemyToSpawn === "ufo") enemies.push(new Ufo(x, vx, vy));
      timeToNewAsteroid = 0;
    } else {
      timeToNewAsteroid += deltaTime;
    }
  }

  function createBackground() {
    backgroundLayers = [];
    const layersToPush = [
      new Layer(backgroundLayer1, 0.2),
      new Layer(backgroundLayer2, 0.4),
      new Layer(backgroundLayer3, 0.6),
      new Layer(backgroundLayer4, 0.8),
      new Layer(backgroundLayer5, 1.0),
    ];
    for (let i = 0; i < layersToPush.length; i++) {
      backgroundLayers.push(layersToPush[i]);
    }
  }

  function addScore(deltaTime) {
    if (timeToScoreIncrement >= scoreInterval) {
      score++;
      distance += 2;
      timeToScoreIncrement = 0;
      if (
        input.keys.includes("w") ||
        input.keys.includes("s") ||
        input.keys.includes("a") ||
        input.keys.includes("d")
      )
        scoreInterval = 150;
      else scoreInterval = 250;
    } else {
      timeToScoreIncrement += deltaTime;
    }
  }

  function updateScore() {
    scoreEl.innerHTML = score;
    distanceEl.innerHTML = distance;
  }

  function init() {
    score = 0;
    interface.style.display = "block";
    distance = 0;
    player.rotation = 0;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.health = player.maxHealth;
    player.position.x = CANVAS_WIDTH * 0.5 - player.width * 0.5;
    player.position.y = CANVAS_HEIGHT * 0.5 - player.height * 0.5;
    enemies = [];
    particles = [];
    projectiles = [];
    healthbar.update();
    gameOverEl.style.display = "none";
    startGameEl.style.display = "none";
    distanceWrapper.style.display = "block";
    scoreWrapper.style.display = "block";
    healthbar.wrapper.style.display = "block";
    createBackground();
    animate(0);
  }

  const input = new InputHandler();
  const player = new Player();
  const healthbar = new Healthbar(player);

  let lastTime = 0;
  let isGameOver = false;
  let timeToNewAsteroid = 0;
  let asteroidInterval = 1000;
  let scoreInterval = 250;
  let timeToScoreIncrement = 0;
  function animate(timestamp) {
    if (player.health <= 0 && !isGameOver) {
      isGameOver = true;
      gameOverEl.style.display = "block";
      scoreWrapper.style.display = "none";
      restartGameBtn.style.display = "block";
      distanceWrapper.style.display = "none";
      finalScoreEl.innerHTML = score;
      finalDistanceEl.innerHTML = distance;
    }
    if (!isGameOver) requestAnimationFrame(animate);
    healthbar.update();
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    backgroundLayers.forEach((background) => {
      background.update();
    });
    projectiles.forEach((projectile, projectileIndex) => {
      if (projectile.position.y + projectile.spriteHeight <= 0)
        projectiles.splice(projectileIndex, 1);
      else projectile.update();
    });
    player.update(input.keys, input.isShooting, deltaTime);
    particles.forEach((particle, particleIndex) => {
      if (particle.isDead()) {
        particles.splice(particleIndex, 1);
      } else {
        particle.update();
      }
    });
    enemies.forEach((enemy, enemyIndex) => {
      if (
        enemy.position.y > CANVAS_HEIGHT + enemy.height ||
        enemy.position.x < -enemy.width ||
        enemy.position.x > CANVAS_WIDTH + enemy.width
      )
        enemies.splice(enemyIndex, 1);
      enemy.update(deltaTime);
      if (checkCollision(player, enemy)) {
        player.health -= Math.random() * 25 + 25;
        enemy.destroy();
        enemies.splice(enemyIndex, 1);
        if (player.health > 0) score += Math.floor(Math.random() * 5 + 5);
      }
      projectiles.forEach((projectile, projectileIndex) => {
        if (checkCollision(projectile, enemy)) {
          score += Math.floor(Math.random() * 20 + 5);
          enemy.destroy();
          enemies.splice(enemyIndex, 1);
          projectiles.splice(projectileIndex, 1);
        }
      });
    });
    addScore(deltaTime);
    updateScore();
    spawnEnemies(deltaTime);
  }
});