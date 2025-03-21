import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        this.scene = scene;
        
        // Add player to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set player properties
        this.setCollideWorldBounds(true);
        this.setDepth(10);
        
        // Player stats
        this.baseHealth = 1000;
        this.maxHealth = this.baseHealth;
        this.health = this.maxHealth;
        this.baseDamage = 50;
        this.baseSpeed = 300;
        this.shootCooldown = 0.2; // seconds
        this.shootTimer = 0;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 0.1; // seconds for damage feedback
        
        // Set up ability timers and cooldowns
        this.stealthAbility = {
            active: false,
            timer: 0, 
            duration: 10, // 10 seconds active time
            cooldownTimer: 0,
            cooldown: 20, // 20 second cooldown
            key: 'shift'
        };
        
        this.katanaUltimate = {
            active: false,
            timer: 0,
            duration: 10, // 10 seconds active time
            cooldownTimer: 0,
            cooldown: 30, // 30 second cooldown
            key: 'space'
        };
        
        // Apply stat modifiers
        this.updateStats();
        
        // Set up animations
        this.setupAnimations();
        
        // Start player in idle state
        this.play('player-idle');
        
        // Debug flag for stealth
        this.debug_lastAlphaValue = 1;
    }

    update(time, delta) {
        if (!this.active) return;

        this.handleMovement();
        this.handleShooting();
        
        // Convert delta to seconds for easier timer handling
        const deltaSeconds = delta / 1000;
        
        // Update ability timers
        this.updateAbilities(deltaSeconds);
        
        // Handle input for abilities
        this.handleAbilitiesInput();

        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= deltaSeconds;
            
            // Only apply flicker effect if NOT in stealth mode
            if (!this.stealthAbility.active) {
                this.alpha = this.invulnerableTime % 0.2 < 0.1 ? 0.5 : 1;
            }
        } else if (!this.stealthAbility.active) {
            // Only reset alpha if not in stealth mode
            this.alpha = 1;
        }

        // Handle XP
        this.updateXp();
    }

    updateStats() {
        try {
            // Check if gameState and required properties exist
            if (window.gameState && window.gameState.stats) {
                // Apply global stat modifiers to player stats with appropriate checks
                if (window.gameState.stats.maxHealth && typeof window.gameState.stats.maxHealth.value === 'number') {
                    this.maxHealth = this.baseHealth * (1 + window.gameState.stats.maxHealth.value / 1000);
                } else {
                    this.maxHealth = this.baseHealth;
                }
                
                if (window.gameState.stats.damage && typeof window.gameState.stats.damage.value === 'number') {
                    this.damage = this.baseDamage * window.gameState.stats.damage.value;
                } else {
                    this.damage = this.baseDamage;
                }
                
                if (window.gameState.stats.moveSpeed && typeof window.gameState.stats.moveSpeed.value === 'number') {
                    this.speed = this.baseSpeed * window.gameState.stats.moveSpeed.value;
                } else {
                    this.speed = this.baseSpeed;
                }
            } else {
                // Use base values if window.gameState is not available
                this.maxHealth = this.baseHealth;
                this.damage = this.baseDamage;
                this.speed = this.baseSpeed;
            }
        } catch (e) {
            console.warn('Error updating player stats:', e);
            // Fall back to base values on error
            this.maxHealth = this.baseHealth;
            this.damage = this.baseDamage;
            this.speed = this.baseSpeed;
        }
        
        // Set physics values
        if (this.body) {
            this.body.setMaxSpeed(this.speed);
        }
    }

    setupAnimations() {
        // Since we're using placeholder assets, we'll create single-frame animations
        if (!this.scene.anims.exists('player-idle')) {
            this.scene.anims.create({
                key: 'player-idle',
                frames: [{ key: 'player' }],
                frameRate: 10,
                repeat: -1
            });
        }
        
        if (!this.scene.anims.exists('player-walk')) {
            this.scene.anims.create({
                key: 'player-walk',
                frames: [{ key: 'player' }],
                frameRate: 10,
                repeat: -1
            });
        }
    }

    handleMovement() {
        // Get input
        const keys = this.scene.keys;
        let dirX = 0;
        let dirY = 0;
        
        if (keys.up.isDown) {
            dirY = -1;
        } else if (keys.down.isDown) {
            dirY = 1;
        }
        
        if (keys.left.isDown) {
            dirX = -1;
        } else if (keys.right.isDown) {
            dirX = 1;
        }
        
        // Normalize diagonal movement
        if (dirX !== 0 && dirY !== 0) {
            dirX *= 0.7071; // 1/sqrt(2)
            dirY *= 0.7071;
        }
        
        // Apply movement
        this.setVelocity(dirX * this.speed, dirY * this.speed);
        
        // Set animation based on movement
        if (dirX !== 0 || dirY !== 0) {
            this.play('player-walk', true);
            
            // Flip sprite based on direction
            if (dirX < 0) {
                this.setFlipX(true);
            } else if (dirX > 0) {
                this.setFlipX(false);
            }
        } else {
            this.play('player-idle', true);
        }
    }

    handleAbilities(deltaTime) {
        try {
            // Safely access keys - use optional chaining to prevent errors
            const keys = this.scene?.keys || {};
            
            // Handle Stealth ability - check that keys.ability exists first
            if (keys.ability && keys.ability.isDown && !this.stealthAbility.active && this.stealthAbility.cooldownTimer <= 0) {
                this.activateStealth();
            }
            
            // Update stealth ability
            if (this.stealthAbility.active) {
                this.stealthAbility.timer -= deltaTime;
                
                // Force alpha to stay at stealth value - this is critical!
                this.alpha = 0.3;
                
                // Check if stealth has expired
                if (this.stealthAbility.timer <= 0) {
                    this.deactivateStealth();
                }
            } else if (this.stealthAbility.cooldownTimer > 0) {
                this.stealthAbility.cooldownTimer -= deltaTime;
            }
            
            // Handle Katana Ultimate ability - check that keys.ultimate exists first
            if (keys.ultimate && keys.ultimate.isDown && !this.katanaUltimate.active && this.katanaUltimate.cooldownTimer <= 0) {
                this.activateUltimate();
            }
            
            // Update katana ultimate
            if (this.katanaUltimate.active) {
                this.katanaUltimate.timer -= deltaTime;
                
                // Attack at regular intervals
                if (this.katanaUltimate.attackTimer > 0) {
                    this.katanaUltimate.attackTimer -= deltaTime;
                } else {
                    this.performKatanaSlash();
                    this.katanaUltimate.attackTimer = this.katanaUltimate.attackSpeed;
                }
                
                // Check if ultimate has expired
                if (this.katanaUltimate.timer <= 0) {
                    this.deactivateUltimate();
                }
            } else if (this.katanaUltimate.cooldownTimer > 0) {
                this.katanaUltimate.cooldownTimer -= deltaTime;
            }
        } catch (e) {
            console.warn('Error in handleAbilities:', e);
        }
    }

    shoot(targetX, targetY) {
        try {
            // Check if on cooldown
            if (this.shootTimer > 0 || this.katanaUltimate.active) return;
            
            // Reset cooldown
            this.shootTimer = this.shootCooldown;
            
            // Calculate direction
            const dirX = targetX - this.x;
            const dirY = targetY - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            const normalizedDirX = dirX / length;
            const normalizedDirY = dirY / length;
            
            // Get projectile count from stats - default to 1 if not available
            let projectileCount = 1;
            try {
                if (window.gameState && window.gameState.stats && window.gameState.stats.projectileCount) {
                    projectileCount = Math.max(1, Math.floor(window.gameState.stats.projectileCount.value));
                }
            } catch (e) {
                console.warn('Error accessing projectile count stats:', e);
            }
            
            // Create projectiles
            if (projectileCount === 1) {
                // Single projectile
                const projectile = this.scene.projectiles.get(this.x, this.y);
                if (projectile) {
                    projectile.fire(this.x, this.y, normalizedDirX, normalizedDirY, this.damage);
                }
            } else {
                // Multiple projectiles in a spread pattern
                const spreadAngle = Math.min(40, (projectileCount - 1) * 10); // Max 40 degree spread
                const angleStep = spreadAngle / (projectileCount - 1);
                const startAngle = -spreadAngle / 2;
                
                for (let i = 0; i < projectileCount; i++) {
                    const angle = startAngle + i * angleStep;
                    const radians = Phaser.Math.DegToRad(angle);
                    
                    // Calculate rotated direction
                    const rotatedDirX = normalizedDirX * Math.cos(radians) - normalizedDirY * Math.sin(radians);
                    const rotatedDirY = normalizedDirX * Math.sin(radians) + normalizedDirY * Math.cos(radians);
                    
                    // Create projectile with rotated direction
                    const projectile = this.scene.projectiles.get(this.x, this.y);
                    if (projectile) {
                        projectile.fire(this.x, this.y, rotatedDirX, rotatedDirY, this.damage);
                    }
                }
            }
        } catch (e) {
            console.warn('Error in shoot method:', e);
        }
    }

    activateStealth() {
        console.log('Activating stealth ability');
        this.stealthAbility.active = true;
        this.stealthAbility.timer = this.stealthAbility.duration;
        
        // Apply stealth effects - more transparent to better indicate invisibility
        this.alpha = 0.3;
        
        // Safely get the movement speed value with error handling
        try {
            if (window.gameState && window.gameState.stats && window.gameState.stats.moveSpeed && 
                typeof window.gameState.stats.moveSpeed.value === 'number') {
                // Apply 20% speed boost if stats are available
                this.speed = this.baseSpeed * window.gameState.stats.moveSpeed.value * 1.2;
            } else {
                // Fallback to default speed boost if stats are not available
                this.speed = this.baseSpeed * 1.2; 
            }
        } catch (e) {
            console.warn('Error applying stealth speed boost:', e);
            this.speed = this.baseSpeed * 1.2; // Fallback to 20% speed boost on base speed
        }
        
        // Visual effect with error handling
        try {
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.add({
                    targets: this,
                    alpha: { from: 1, to: 0.3 },
                    duration: 200,
                    ease: 'Linear'
                });
            }
        } catch (e) {
            console.warn('Error creating stealth visual effect:', e);
            // Set alpha directly as fallback
            this.alpha = 0.3;
        }
        
        console.log('Stealth activated, alpha:', this.alpha);
    }

    deactivateStealth() {
        console.log('Deactivating stealth ability');
        this.stealthAbility.active = false;
        this.stealthAbility.cooldownTimer = this.stealthAbility.cooldown;
        
        // Revert effects
        this.alpha = 1;
        
        // Completely fail-safe speed reset with maximum error handling
        try {
            let speedMultiplier = 1;
            
            // Use optional chaining and nullish coalescing for complete safety
            const moveSpeedValue = window?.gameState?.stats?.moveSpeed?.value ?? undefined;
            
            // Only use the value if it's a valid number
            if (moveSpeedValue !== undefined && 
                moveSpeedValue !== null && 
                !isNaN(moveSpeedValue) && 
                typeof moveSpeedValue === 'number') {
                speedMultiplier = moveSpeedValue;
            }
            
            // Apply speed with the multiplier (default to baseSpeed if issues)
            this.speed = this.baseSpeed * speedMultiplier;
            
        } catch (e) {
            console.warn('Error reverting stealth speed:', e);
            this.speed = this.baseSpeed; // Fallback to base speed
        }
        
        // Visual effect with error handling
        try {
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.add({
                    targets: this,
                    alpha: { from: 0.3, to: 1 },
                    duration: 200,
                    ease: 'Linear'
                });
            }
        } catch (e) {
            console.warn('Error creating deactivate stealth visual effect:', e);
            // Set alpha directly as fallback
            this.alpha = 1;
        }
        
        console.log('Stealth deactivated, alpha:', this.alpha);
    }

    activateUltimate() {
        this.katanaUltimate.active = true;
        this.katanaUltimate.timer = this.katanaUltimate.duration;
        this.katanaUltimate.attackTimer = 0; // Attack immediately
        
        // Visual effect - emitter for katana slashes
        const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
            lifespan: 500,
            speed: { min: 200, max: 400 },
            scale: { start: 1, end: 0 },
            quantity: 1,
            blendMode: 'ADD',
            emitting: false
        });
        
        particles.startFollow(this);
        this.katanaUltimate.particles = particles;
    }

    deactivateUltimate() {
        this.katanaUltimate.active = false;
        this.katanaUltimate.cooldownTimer = this.katanaUltimate.cooldown;
        
        // Clean up particles
        if (this.katanaUltimate.particles) {
            this.katanaUltimate.particles.destroy();
            this.katanaUltimate.particles = null;
        }
    }

    performKatanaSlash() {
        // Get nearby enemies within range
        const range = 200; // Katana slash range
        const enemies = this.scene.enemies.getChildren();
        
        // Get slash direction - use player velocity or a default direction if mouse is not available
        let angle = 0; // Default direction
        
        try {
            if (this.scene.input && this.scene.input.mousePointer) {
                angle = Math.atan2(
                    this.scene.input.mousePointer.worldY - this.y, 
                    this.scene.input.mousePointer.worldX - this.x
                );
            } else if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
                // Default to player's facing direction based on velocity
                angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            } else {
                // Use sprite flip state as fallback
                angle = this.flipX ? Math.PI : 0;
            }
        } catch (e) {
            console.warn("Error getting mouse position, using default angle", e);
            // Already set to default at the beginning
        }
        
        const coneAngle = Math.PI / 3; // 60 degree cone
        
        // Create slash effect
        if (this.katanaUltimate.particles) {
            this.katanaUltimate.particles.explode(20);
        }
        
        // Deal damage to enemies in cone
        for (const enemy of enemies) {
            // Check if enemy is within range
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                // Check if enemy is within cone angle
                const enemyAngle = Math.atan2(dy, dx);
                const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - angle);
                
                if (Math.abs(angleDiff) <= coneAngle / 2) {
                    // Deal damage
                    const damage = this.katanaUltimate.damage * window.gameState.stats.damage.value;
                    enemy.takeDamage(damage);
                    
                    // Show damage text
                    this.scene.ui.showDamageText(enemy.x, enemy.y, damage, false);
                }
            }
        }
    }

    takeDamage(amount) {
        // Check if invulnerable
        if (this.invulnerableTime > 0 || this.stealthAbility.active) return;
        
        // Apply armor reduction
        let reducedDamage = amount;
        try {
            if (window.gameState && window.gameState.stats && window.gameState.stats.armor) {
                const armor = window.gameState.stats.armor.value;
                const damageReduction = armor / (armor + 100); // Damage reduction formula
                reducedDamage = amount * (1 - damageReduction);
            }
        } catch (e) {
            console.warn('Error applying armor reduction:', e);
        }
        
        // Apply damage
        this.health -= reducedDamage;
        
        // Clamp health
        this.health = Math.max(0, this.health);
        
        // Update UI
        if (this.scene && this.scene.ui) {
            this.scene.ui.updateHealth(this.health, this.maxHealth);
        }
        
        // Set invulnerable briefly
        this.invulnerableTime = this.invulnerableDuration;
        
        // Create hit effect
        try {
            this.scene.tweens.add({
                targets: this,
                alpha: { from: 0.2, to: 1 },
                duration: 100,
                ease: 'Linear'
            });
        } catch (e) {
            console.warn('Error creating hit effect tween:', e);
        }
    }

    heal(amount) {
        // Apply healing
        this.health += amount;
        
        // Clamp health
        this.health = Math.min(this.health, this.maxHealth);
        
        // Update UI
        this.scene.ui.updateHealth(this.health, this.maxHealth);
    }

    updateAbilities(deltaSeconds) {
        // Update stealth ability
        if (this.stealthAbility.active) {
            // Decrement timer if active
            this.stealthAbility.timer -= deltaSeconds;
            
            // Force alpha to stealth value to maintain consistency
            this.alpha = 0.3;
            this.setTint(0x44aaff);
            
            // If timer expires, deactivate
            if (this.stealthAbility.timer <= 0) {
                this.deactivateStealth();
            }
        } else if (this.stealthAbility.cooldownTimer > 0) {
            // Decrement cooldown if on cooldown
            this.stealthAbility.cooldownTimer -= deltaSeconds;
            if (this.stealthAbility.cooldownTimer < 0) {
                this.stealthAbility.cooldownTimer = 0;
            }
        }
        
        // Update katana ultimate ability
        if (this.katanaUltimate.active) {
            // Decrement timer if active
            this.katanaUltimate.timer -= deltaSeconds;
            
            // If timer expires, deactivate
            if (this.katanaUltimate.timer <= 0) {
                this.deactivateUltimate();
            }
        } else if (this.katanaUltimate.cooldownTimer > 0) {
            // Decrement cooldown if on cooldown
            this.katanaUltimate.cooldownTimer -= deltaSeconds;
            if (this.katanaUltimate.cooldownTimer < 0) {
                this.katanaUltimate.cooldownTimer = 0;
            }
        }
        
        // Update UI with ability status
        if (this.scene.ui) {
            this.scene.ui.updateAbilityCooldowns(
                1 - (this.stealthAbility.cooldownTimer / this.stealthAbility.cooldown),
                1 - (this.katanaUltimate.cooldownTimer / this.katanaUltimate.cooldown),
                this.stealthAbility.active,
                this.katanaUltimate.active
            );
        }
    }

    handleAbilitiesInput() {
        // Handle stealth ability activation
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT))) {
            if (!this.stealthAbility.active && this.stealthAbility.cooldownTimer <= 0) {
                this.activateStealth();
            }
        }
        
        // Handle ultimate ability activation
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            if (!this.katanaUltimate.active && this.katanaUltimate.cooldownTimer <= 0) {
                this.activateUltimate();
            }
        }
    }

    updateXp() {
        // Implementation of updateXp method
    }

    handleShooting() {
        // Check if on cooldown
        if (this.shootTimer > 0) {
            this.shootTimer -= this.scene.time.deltaTime / 1000;
            if (this.shootTimer < 0) this.shootTimer = 0;
        }
        
        // Get mouse input
        const pointer = this.scene.input.mousePointer;
        
        // Shoot on mouse click (left button)
        if (pointer.isDown && pointer.button === 0 && this.shootTimer <= 0) {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.shoot(worldPoint.x, worldPoint.y);
        }
    }
} 