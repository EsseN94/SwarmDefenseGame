import Phaser from 'phaser';

export class HealthPickup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'healthPickup');
        this.scene = scene;
        
        // Add health pickup to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set properties
        this.value = 50;
        this.attractionSpeed = 0;
        this.attractionRange = 100;
        this.active = false;
        this.collected = false;
        
        // Set depth for layering
        this.setDepth(3);
    }

    setup(value) {
        // Set healing value
        this.value = value;
        
        // Reset state
        this.active = true;
        this.collected = false;
        this.attractionSpeed = 0;
        
        // Set starting velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(50, 100);
        this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Slow down over time
        this.scene.tweens.add({
            targets: this.body.velocity,
            x: 0,
            y: 0,
            duration: 500,
            ease: 'Power2'
        });
        
        // Set visibility
        this.setActive(true);
        this.setVisible(true);
        
        // Set size and scaling effect
        this.setScale(0);
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });
        
        // Add glow effect
        this.addGlowEffect();
        
        // Calculate attraction range based on player's pickup radius stat
        this.attractionRange = 100 * window.gameState.stats.pickupRadius.value;
        
        return this;
    }

    update(time, delta) {
        if (!this.active || this.collected) return;
        
        // Check if player is within attraction range
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        if (distToPlayer <= this.attractionRange) {
            // Calculate attraction direction
            const dirX = dx / distToPlayer;
            const dirY = dy / distToPlayer;
            
            // Increase attraction speed over time
            this.attractionSpeed += delta * 0.01;
            this.attractionSpeed = Math.min(this.attractionSpeed, 15);
            
            // Apply velocity towards player
            this.setVelocity(
                dirX * this.attractionSpeed * 100,
                dirY * this.attractionSpeed * 100
            );
        }
    }

    collect() {
        // Mark as collected
        this.collected = true;
        
        // Create collection effect
        this.createCollectEffect();
        
        // Disable physics
        this.body.reset(0, 0);
        
        // Hide pickup
        this.active = false;
        this.setActive(false);
        this.setVisible(false);
    }

    getValue() {
        return this.value;
    }

    createCollectEffect() {
        // Create a small particle effect on collection
        const particles = this.scene.add.particles(this.x, this.y, 'healthPickup', {
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

    addGlowEffect() {
        // Create a pulsing effect - health is pink/red
        this.setTint(0xff00ff);
        
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Create a slight wobble effect
        this.scene.tweens.add({
            targets: this,
            y: this.y + 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
} 