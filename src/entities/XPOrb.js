import Phaser from 'phaser';

export class XPOrb extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'xpOrb');
        this.scene = scene;
        
        // Add XP orb to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set properties
        this.value = 10;
        this.attractionSpeed = 0;
        this.attractionRange = 100;
        this.active = false;
        this.collected = false;
        this.readyForCollection = false;
        
        // Make it highly visible
        this.setScale(1.5);
        this.setTint(0x00ffff); // Cyan color
        
        // Set depth for layering
        this.setDepth(3);
        
        // Initialize alpha to 0 for fade-in effect
        this.alpha = 0;
        
        console.log('XPOrb constructor called');
    }

    setup(value) {
        console.log(`XPOrb setup called with value: ${value}`);
        
        // Set XP value
        this.value = value;
        
        // Reset state
        this.active = true;
        this.collected = false;
        this.readyForCollection = false;
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
        
        // Make sure it's visible
        this.setActive(true);
        this.setVisible(true);
        
        // Fade in effect
        this.alpha = 0;
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: 'Linear'
        });
        
        // Set size and scaling effect
        this.setScale(0);
        this.scene.tweens.add({
            targets: this,
            scale: 1.5,
            duration: 300,
            ease: 'Back.out'
        });
        
        // Add glow effect
        this.addGlowEffect();
        
        // Calculate attraction range based on player's pickup radius stat
        const pickupRadiusValue = window.gameState?.stats?.pickupRadius?.value || 1;
        this.attractionRange = 100 * pickupRadiusValue;
        
        // Enable collection after a short delay
        this.scene.time.delayedCall(300, () => {
            this.readyForCollection = true;
        });
        
        return this;
    }

    update(time, delta) {
        if (!this.active || this.collected) return;
        
        // Check if player is within attraction range
        const player = this.scene.player;
        if (!player) return;
        
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
        if (this.body) {
            this.body.reset(0, 0);
            this.body.enable = false;
        }
        
        // Hide orb
        this.active = false;
        this.setActive(false);
        this.setVisible(false);
        
        console.log(`XP orb collected with value ${this.value}`);
    }

    getValue() {
        return this.value;
    }

    createCollectEffect() {
        // Create a small particle effect on collection
        try {
            const particles = this.scene.add.particles(this.x, this.y, 'xpOrb', {
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
        } catch (error) {
            console.error('Error creating collect effect:', error);
        }
    }

    addGlowEffect() {
        // Create a pulsing effect
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