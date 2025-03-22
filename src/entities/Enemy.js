import Phaser from 'phaser';
import { XPOrb } from './XPOrb';
import { HealthPickup } from './HealthPickup';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        this.scene = scene;
        
        // Add enemy to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Default stats
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 20;
        this.speed = 50; // Reduced by 50% from 100
        this.xpValue = 10;
        this.active = false;
        this.damageTaken = 0; // Track damage taken for XP drops
        
        // AI properties
        this.aiType = 'chase'; // Default AI type
        this.detectionRange = 500;
        this.changeDirectionTimer = 0;
        this.changeDirectionInterval = 2; // seconds
        this.avoidOthersWeight = 0.5;
        this.flockingRadius = 100;
        this.flockingWeight = 0.3;
        this.specialAbilityCooldown = 0;
        
        // Create health bar
        this.healthBarBg = this.scene.add.rectangle(0, -20, 40, 5, 0x000000, 0.7);
        this.healthBar = this.scene.add.rectangle(0, -20, 40, 5, 0xff0000);
        
        // Add health bar to the scene but make it invisible initially
        this.healthBarBg.setDepth(6);
        this.healthBar.setDepth(7);
        this.healthBarBg.visible = false;
        this.healthBar.visible = false;
        
        // Set depth for layering
        this.setDepth(5);
    }

    setup(health, damage, speed, aiType = 'chase') {
        // Set stats based on wave difficulty
        this.health = health;
        this.maxHealth = health;
        this.damage = damage;
        this.speed = speed * 0.5; // Apply 50% speed reduction
        this.xpValue = Math.floor(health / 10); // XP scales with health
        this.aiType = aiType;
        this.damageTaken = 0; // Reset damage taken
        
        // Reset state
        this.active = true;
        this.visible = true;
        this.alpha = 1;
        this.tint = 0xffffff;
        this.changeDirectionTimer = 0;
        this.specialAbilityCooldown = 0;
        
        // Set physics properties
        this.body.reset(this.x, this.y);
        this.setVelocity(0, 0);
        
        console.log(`Enemy setup with ${health} health, ${damage} damage, ${speed * 0.5} speed (reduced), type: ${aiType}`);
        
        return this;
    }

    update(deltaTime) {
        if (!this.active) {
            // Ensure health bars are hidden and not accessed if they've been destroyed
            if (this.healthBarBg && this.healthBar) {
                this.healthBarBg.visible = false;
                this.healthBar.visible = false;
            }
            return;
        }
        
        // Basic AI behavior
        this.updateAI(deltaTime);
        
        // Update special ability cooldown
        if (this.specialAbilityCooldown > 0) {
            this.specialAbilityCooldown -= deltaTime;
        }
        
        // Only update health bars if they exist and are visible (enemy has taken damage)
        if (this.healthBar && this.healthBarBg && this.damageTaken > 0) {
            // Update health bar position and width
            this.healthBarBg.x = this.x;
            this.healthBarBg.y = this.y - 20;
            this.healthBar.x = this.x - 20 + (this.health / this.maxHealth * 40) / 2;
            this.healthBar.y = this.y - 20;
            this.healthBar.width = (this.health / this.maxHealth) * 40;
        }
    }

    updateAI(deltaTime) {
        // Get distance to player
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Update direction change timer
        this.changeDirectionTimer -= deltaTime;
        
        // Ignore AI type and distance - all enemies will aggressively chase the player
        this.aggressiveChase(player);
    }

    aggressiveChase(player) {
        // Calculate direction directly to player
        const dirX = player.x - this.x;
        const dirY = player.y - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        
        // Skip if we got a NaN or infinite (probably due to division by zero)
        if (!isFinite(length) || length === 0) {
            return;
        }
        
        // Set velocity to move directly toward player at full speed
        // Ignore any detection range checks - always chase like a moth to flame
        this.setVelocity(
            (dirX / length) * this.speed,
            (dirY / length) * this.speed
        );
        
        // Apply slight avoidance to prevent perfect stacking of enemies
        this.applyMinimalAvoidance();
    }

    applyMinimalAvoidance() {
        try {
            // Get nearby enemies
            const nearbyEnemies = this.scene.enemies.getChildren().filter(e => {
                if (!e.active || e === this) return false;
                
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const distSquared = dx * dx + dy * dy;
                
                return distSquared < 400; // Only consider very close enemies (~20 pixels)
            });
            
            if (nearbyEnemies.length > 0) {
                // Calculate avoidance vector
                let avoidX = 0;
                let avoidY = 0;
                
                for (const enemy of nearbyEnemies) {
                    const dx = this.x - enemy.x;
                    const dy = this.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        // Add repulsion vector (stronger when closer)
                        const factor = 0.2 / dist; // Keep avoidance minimal
                        avoidX += dx * factor;
                        avoidY += dy * factor;
                    }
                }
                
                // Add the avoidance to the current velocity
                const vx = this.body.velocity.x + avoidX * this.speed;
                const vy = this.body.velocity.y + avoidY * this.speed;
                
                // Normalize and apply
                const totalSpeed = Math.sqrt(vx * vx + vy * vy);
                if (totalSpeed > 0) {
                    this.setVelocity(
                        (vx / totalSpeed) * this.speed,
                        (vy / totalSpeed) * this.speed
                    );
                }
            }
        } catch (error) {
            console.error('Error in applyMinimalAvoidance:', error);
        }
    }

    updateAI(deltaTime) {
        // Get distance to player
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Update direction change timer
        this.changeDirectionTimer -= deltaTime;
        
        // Ignore AI type and distance - all enemies will aggressively chase the player
        this.aggressiveChase(player);
    }

    // Keep the original methods for future reference but they won't be used anymore
    chasePlayer(player, distToPlayer) {
        // This method is kept for backward compatibility
        // All enemies now use aggressiveChase instead
        this.aggressiveChase(player);
    }

    flankPlayer(player, distToPlayer, deltaTime) {
        if (distToPlayer <= this.detectionRange) {
            // Flankers try to circle around the player
            const dirX = player.x - this.x;
            const dirY = player.y - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Calculate perpendicular direction for circling
            let perpX = -dirY / length;
            let perpY = dirX / length;
            
            // Change direction periodically
            if (this.changeDirectionTimer <= 0) {
                this.changeDirectionTimer = this.changeDirectionInterval;
                // 50% chance to reverse circling direction
                if (Math.random() < 0.5) {
                    perpX = -perpX;
                    perpY = -perpY;
                }
            }
            
            // Combine movement vectors (towards player + perpendicular)
            const moveX = (dirX / length * 0.5 + perpX * 0.5) * this.speed;
            const moveY = (dirY / length * 0.5 + perpY * 0.5) * this.speed;
            
            // Apply velocity
            this.setVelocity(moveX, moveY);
            
            // Apply avoidance
            this.applyAvoidance();
        } else {
            // Chase when out of range
            this.chasePlayer(player, distToPlayer);
        }
    }

    rangedAttack(player, distToPlayer, deltaTime) {
        // Ranged enemies maintain distance while attacking
        const optimalRange = 300;
        const minRange = 200;
        
        if (distToPlayer <= this.detectionRange) {
            const dirX = player.x - this.x;
            const dirY = player.y - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            let moveX, moveY;
            
            if (distToPlayer < minRange) {
                // Too close, move away
                moveX = -(dirX / length) * this.speed;
                moveY = -(dirY / length) * this.speed;
            } else if (distToPlayer > optimalRange) {
                // Too far, move closer
                moveX = (dirX / length) * this.speed * 0.7;
                moveY = (dirY / length) * this.speed * 0.7;
            } else {
                // At good range, strafe
                const perpX = -dirY / length;
                const perpY = dirX / length;
                
                // Change direction periodically
                if (this.changeDirectionTimer <= 0) {
                    this.changeDirectionTimer = this.changeDirectionInterval;
                    // 50% chance to reverse strafing direction
                    if (Math.random() < 0.5) {
                        moveX = perpX * this.speed * 0.8;
                        moveY = perpY * this.speed * 0.8;
                    } else {
                        moveX = -perpX * this.speed * 0.8;
                        moveY = -perpY * this.speed * 0.8;
                    }
                }
            }
            
            // Apply velocity
            this.setVelocity(moveX, moveY);
            
            // Shoot at player
            if (this.specialAbilityCooldown <= 0) {
                this.shootAtPlayer(player);
                this.specialAbilityCooldown = 2; // 2 second cooldown
            }
            
            // Apply avoidance
            this.applyAvoidance();
        } else {
            // Wander when player is out of range
            this.wander();
        }
    }

    swarmBehavior(player, distToPlayer) {
        if (distToPlayer <= this.detectionRange) {
            // Calculate direction to player
            const dirX = player.x - this.x;
            const dirY = player.y - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Base movement is towards player
            let moveX = (dirX / length) * this.speed;
            let moveY = (dirY / length) * this.speed;
            
            // Apply flocking behavior
            this.applyFlocking(moveX, moveY);
            
            // Apply avoidance
            this.applyAvoidance();
        } else {
            // Group wander behavior
            this.wander();
            this.applyFlocking(this.body.velocity.x, this.body.velocity.y);
        }
    }

    bomberBehavior(player, distToPlayer) {
        // Bomber enemies rush the player and explode
        if (distToPlayer <= this.detectionRange) {
            // Calculate direction to player
            const dirX = player.x - this.x;
            const dirY = player.y - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Set velocity to rush player
            const rushSpeed = this.speed * 1.2; // Bombers are faster
            this.setVelocity(
                (dirX / length) * rushSpeed,
                (dirY / length) * rushSpeed
            );
            
            // Flash red when close to exploding
            if (distToPlayer < 150) {
                this.setTint(0xff0000);
                
                // Explode when very close
                if (distToPlayer < 50) {
                    this.explode();
                }
            } else {
                this.clearTint();
            }
        } else {
            // Chase when out of range
            this.chasePlayer(player, distToPlayer);
        }
    }

    shieldedBehavior(player, distToPlayer) {
        // Shielded enemies are slower but take reduced damage from the front
        if (distToPlayer <= this.detectionRange) {
            // Calculate direction to player
            const dirX = player.x - this.x;
            const dirY = player.y - this.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Set velocity (slower than normal enemies)
            const shieldedSpeed = this.speed * 0.8;
            this.setVelocity(
                (dirX / length) * shieldedSpeed,
                (dirY / length) * shieldedSpeed
            );
            
            // Apply avoidance behavior
            this.applyAvoidance();
            
            // Update shield rotation to face player
            const angle = Math.atan2(dirY, dirX);
            this.rotation = angle;
        } else {
            // Wander when player is out of range
            this.wander();
        }
    }

    applyAvoidance() {
        // Get nearby enemies
        const enemies = this.scene.enemies.getChildren();
        let avoidX = 0;
        let avoidY = 0;
        let count = 0;
        
        for (const enemy of enemies) {
            if (enemy === this) continue;
            
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Apply avoidance force if enemy is too close
            if (dist < 50) {
                avoidX += dx / dist;
                avoidY += dy / dist;
                count++;
            }
        }
        
        // Apply avoidance force to velocity
        if (count > 0) {
            const currentVx = this.body.velocity.x;
            const currentVy = this.body.velocity.y;
            
            this.setVelocity(
                currentVx + avoidX * this.speed * this.avoidOthersWeight,
                currentVy + avoidY * this.speed * this.avoidOthersWeight
            );
        }
    }

    applyFlocking(baseVelX, baseVelY) {
        // Get nearby flock members
        const enemies = this.scene.enemies.getChildren();
        let avgDirX = 0;
        let avgDirY = 0;
        let count = 0;
        
        for (const enemy of enemies) {
            if (enemy === this || enemy.aiType !== this.aiType) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Consider enemies within flocking radius
            if (dist < this.flockingRadius) {
                avgDirX += enemy.body.velocity.x;
                avgDirY += enemy.body.velocity.y;
                count++;
            }
        }
        
        // Apply flocking alignment to velocity
        if (count > 0) {
            avgDirX /= count;
            avgDirY /= count;
            
            // Normalize
            const avgLength = Math.sqrt(avgDirX * avgDirX + avgDirY * avgDirY);
            if (avgLength > 0) {
                avgDirX /= avgLength;
                avgDirY /= avgLength;
            }
            
            // Combine with base velocity
            this.setVelocity(
                baseVelX * (1 - this.flockingWeight) + avgDirX * this.speed * this.flockingWeight,
                baseVelY * (1 - this.flockingWeight) + avgDirY * this.speed * this.flockingWeight
            );
        }
    }

    wander() {
        // Random wandering behavior
        if (this.changeDirectionTimer <= 0) {
            this.changeDirectionTimer = this.changeDirectionInterval;
            
            // Choose random direction
            const angle = Math.random() * Math.PI * 2;
            const wanderSpeed = this.speed * 0.5;
            
            this.setVelocity(
                Math.cos(angle) * wanderSpeed,
                Math.sin(angle) * wanderSpeed
            );
        }
    }

    shootAtPlayer(player) {
        // Ranged attack
        const dirX = player.x - this.x;
        const dirY = player.y - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        
        // Create projectile
        const bullet = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
        bullet.setTint(0xff0000); // Red for enemy bullets
        bullet.setVelocity(
            (dirX / length) * 300,
            (dirY / length) * 300
        );
        
        // Set bullet damage
        bullet.damage = this.damage;
        
        // Add collision with player
        this.scene.physics.add.overlap(
            bullet,
            player,
            (bullet, player) => {
                player.takeDamage(bullet.damage);
                bullet.destroy();
            }
        );
        
        // Destroy bullet after a timeout
        this.scene.time.delayedCall(2000, () => {
            if (bullet && bullet.active) {
                bullet.destroy();
            }
        });
    }

    explode() {
        // Create explosion effect
        const explosion = this.scene.add.sprite(this.x, this.y, 'bullet')
            .setTint(0xff0000)
            .setScale(1);
        
        // Explosion animation
        this.scene.tweens.add({
            targets: explosion,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Damage player if within blast radius
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        if (distToPlayer < 150) {
            // Damage falls off with distance
            const damageMultiplier = 1 - (distToPlayer / 150);
            player.takeDamage(this.damage * 2 * damageMultiplier);
        }
        
        // Kill this enemy
        this.die();
    }

    takeDamage(amount) {
        // Check if active
        if (!this.active) return;
        
        // Apply damage
        this.health -= amount;
        this.damageTaken += amount; // Track total damage taken
        
        // Make health bars visible when damaged
        if (this.healthBar && this.healthBarBg) {
            this.healthBarBg.visible = true;
            this.healthBar.visible = true;
            
            // Update health bar
            this.healthBar.width = (this.health / this.maxHealth) * 40;
            this.healthBar.x = this.x - 20 + (this.health / this.maxHealth * 40) / 2;
            
            // Change color based on health percentage
            const healthPercent = this.health / this.maxHealth;
            if (healthPercent < 0.3) {
                this.healthBar.fillColor = 0xff0000; // Red
            } else if (healthPercent < 0.6) {
                this.healthBar.fillColor = 0xffff00; // Yellow
            } else {
                this.healthBar.fillColor = 0x00ff00; // Green
            }
        }
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
            return;
        }
        
        // Hit effect
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.5, to: 1 },
            duration: 100,
            ease: 'Linear'
        });
        
        // Flash effect when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            // Reset tint based on enemy type
            if (this.active) {
                switch(this.aiType) {
                    case 'chase': 
                        this.setTint(0xff0000); // Red for basic enemies
                        break;
                    case 'flanker': 
                        this.setTint(0xff00ff); // Purple for flankers
                        break;
                    case 'ranged': 
                        this.setTint(0x00ffff); // Cyan for ranged
                        break;
                    case 'swarm': 
                        this.setTint(0xffff00); // Yellow for swarm
                        break;
                    case 'bomber': 
                        this.setTint(0xff6600); // Orange for bombers
                        break;
                    case 'shielded': 
                        this.setTint(0x0000ff); // Blue for shielded
                        break;
                    default:
                        this.setTint(0xff0000); // Default red
                }
            }
        });
    }

    die() {
        try {
            // Capture position before we destroy anything
            const enemyX = this.x;
            const enemyY = this.y;
            console.log(`Enemy dying at position: (${enemyX}, ${enemyY})`);
            
            // Destroy health bars FIRST before anything else
            if (this.healthBar) {
                this.healthBar.visible = false;
                this.healthBar.destroy();
                this.healthBar = null;
            }
            
            if (this.healthBarBg) {
                this.healthBarBg.visible = false;
                this.healthBarBg.destroy();
                this.healthBarBg = null;
            }
            
            // Then deactivate the enemy
            this.active = false;
            this.setActive(false);
            this.setVisible(false);
            
            // Create death effect
            this.scene.particleManager?.createExplosion(enemyX, enemyY);
            
            // Calculate XP based on damage taken (minimum value of 1)
            const xpToGive = Math.max(10, Math.floor(this.damageTaken / 10));
            
            // Improved XP orb spawning - create multiple orbs
            const xpCount = Math.max(1, Math.min(3, Math.floor(xpToGive / 5))); // At most 3 orbs
            
            console.log(`Dropping ${xpCount} XP orbs with total value ${xpToGive}`);
            
            // DIRECT XP ORB CREATION - no method call
            if (this.scene && this.scene.xpOrbs) {
                for (let i = 0; i < xpCount; i++) {
                    try {
                        // Random position near enemy
                        const offsetX = (Math.random() * 40) - 20;
                        const offsetY = (Math.random() * 40) - 20;
                        const orbX = enemyX + offsetX;
                        const orbY = enemyY + offsetY;
                        
                        // Get orb from pool if possible
                        const xpOrb = this.scene.xpOrbs.get(orbX, orbY);
                        
                        if (xpOrb) {
                            const orbValue = Math.ceil(xpToGive / xpCount);
                            console.log(`Created XP orb at (${orbX}, ${orbY}) with value ${orbValue}`);
                            
                            xpOrb.setPosition(orbX, orbY);
                            xpOrb.setActive(true);
                            xpOrb.setVisible(true);
                            
                            // Use setup method if it exists
                            if (typeof xpOrb.setup === 'function') {
                                xpOrb.setup(orbValue);
                            } else {
                                // Manual setup
                                xpOrb.value = orbValue;
                                xpOrb.attractionRange = 100;
                                xpOrb.attractionSpeed = 0;
                                xpOrb.collected = false;
                                
                                // Set random velocity for scatter effect
                                const angle = Math.random() * Math.PI * 2;
                                const speed = Math.random() * 50 + 50;
                                xpOrb.setVelocity(
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed
                                );
                            }
                            
                            // Add delay before allowing collection
                            this.scene.time.delayedCall(300, () => {
                                if (xpOrb && xpOrb.active) {
                                    xpOrb.readyForCollection = true;
                                }
                            });
                        }
                    } catch (orbError) {
                        console.error('Failed to create XP orb:', orbError);
                    }
                }
            } else if (this.scene && typeof this.scene.spawnXPOrb === 'function') {
                // Fallback to scene's spawnXPOrb method if direct creation failed
                for (let i = 0; i < xpCount; i++) {
                    const offsetX = (Math.random() * 40) - 20;
                    const offsetY = (Math.random() * 40) - 20;
                    this.scene.spawnXPOrb(
                        enemyX + offsetX,
                        enemyY + offsetY,
                        Math.ceil(xpToGive / xpCount)
                    );
                }
            } else {
                console.error('Failed to spawn XP orbs: scene or xpOrbs group not available');
            }
            
            // Reset body and position to ensure it's fully removed
            if (this.body) {
                this.body.reset(-1000, -1000);
                // Explicitly disable the physics body to prevent any further interactions
                this.body.enable = false;
            }
            
            // Small chance to spawn a health pickup
            if (Math.random() < 0.05) {
                if (this.scene && typeof this.scene.spawnHealthPickup === 'function') {
                    this.scene.spawnHealthPickup(enemyX, enemyY, 50);
                }
            }
        } catch (error) {
            console.error('Error in enemy die method:', error);
        }
    }

    spawnHealthPickup() {
        // Create health pickup
        this.scene.spawnHealthPickup(
            this.x,
            this.y,
            50 // Fixed health value for pickups
        );
    }
} 