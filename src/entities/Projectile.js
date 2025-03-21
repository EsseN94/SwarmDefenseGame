import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        this.scene = scene;
        
        // Add projectile to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set projectile properties
        this.speed = 600;
        this.maxDistance = 800;
        this.damage = 0;
        this.piercing = false;
        this.active = false;
        this.startPos = { x: 0, y: 0 };
        
        // Set depth for layering
        this.setDepth(5);
    }

    fire(x, y, dirX, dirY, damage) {
        // Set initial position
        this.setPosition(x, y);
        this.startPos = { x, y };
        
        // Set damage
        this.damage = damage;
        
        // Set velocity
        this.setVelocity(dirX * this.speed, dirY * this.speed);
        
        // Set rotation
        this.rotation = Math.atan2(dirY, dirX);
        
        // Set active
        this.setActive(true);
        this.setVisible(true);
        this.active = true;
        
        // Add rotation animation
        this.rotationSpeed = 10;
        
        // Optional effects
        this.addTrailEffect();
        
        return this;
    }

    update(time, delta) {
        // Check if active
        if (!this.active) return;
        
        // Update rotation animation
        this.rotation += this.rotationSpeed * (delta / 1000);
        
        // Check distance traveled
        const dx = this.x - this.startPos.x;
        const dy = this.y - this.startPos.y;
        const distTraveled = Math.sqrt(dx * dx + dy * dy);
        
        // Destroy if traveled too far
        if (distTraveled > this.maxDistance) {
            this.hit();
        }
    }

    hit() {
        // If piercing, only destroy after multiple hits
        if (this.piercing) {
            this.pierceCount--;
            if (this.pierceCount <= 0) {
                this.destroy();
            }
            return;
        }
        
        // Otherwise, destroy on first hit
        this.destroy();
    }

    destroy() {
        // Create hit effect
        this.createHitEffect();
        
        // Destroy projectile
        this.active = false;
        this.setActive(false);
        this.setVisible(false);
    }

    createHitEffect() {
        // Create a small particle effect on hit
        const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            quantity: 5,
            lifespan: 300,
            blendMode: 'ADD'
        });
        
        // Auto-destroy particles after animation
        this.scene.time.delayedCall(300, () => {
            particles.destroy();
        });
    }

    addTrailEffect() {
        // Add a trailing effect behind projectile
        const trail = this.scene.add.particles(this.x, this.y, 'bullet', {
            speed: 0,
            scale: { start: 0.5, end: 0 },
            quantity: 1,
            lifespan: 200,
            alpha: { start: 0.5, end: 0 },
            follow: this
        });
        
        // Store trail reference for cleanup
        this.trail = trail;
        
        // Auto-destroy trail when projectile is destroyed
        this.once('destroy', () => {
            if (this.trail) {
                this.trail.destroy();
            }
        });
    }

    setPiercing(count) {
        // Set projectile to pierce through multiple enemies
        this.piercing = true;
        this.pierceCount = count;
        return this;
    }

    setSpeed(speed) {
        // Set custom speed
        this.speed = speed;
        return this;
    }

    setMaxDistance(distance) {
        // Set custom maximum travel distance
        this.maxDistance = distance;
        return this;
    }
} 