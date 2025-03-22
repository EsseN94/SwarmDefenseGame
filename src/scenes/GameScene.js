import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { XPOrb } from '../entities/XPOrb';
import { HealthPickup } from '../entities/HealthPickup';
import { WaveManager } from '../managers/WaveManager';
import { AbilityManager } from '../managers/AbilityManager';
import { ParticleManager } from '../managers/ParticleManager';
import { UI } from '../ui/UI';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.enemies = null;
        this.projectiles = null;
        this.xpOrbs = null;
        this.healthPickups = null;
        this.waveManager = null;
        this.abilityManager = null;
        this.particleManager = null;
        this.ui = null;
        this.keys = null;
        this.gameOver = false;
        this.elapsedTime = 0;
        this.waveTime = 0;
        this.mapSize = {
            width: 3000,
            height: 3000
        };
        this.transitioningToUpgrade = false;
    }

    create() {
        console.log('GameScene create method started');
        
        // Enable debugging
        this.debugMode = true;
        
        // Initialize game state if it doesn't exist
        if (!window.gameState) {
            console.log('Creating new game state in GameScene');
            window.gameState = {
                gold: 5000,
                playerXP: 0,
                playerLevel: 1,
                xpToNextLevel: 100,
                highestWave: 0,
                stats: {
                    damage: { level: 0, value: 1, baseCost: 100, maxLevel: 5, increment: 0.1, displayName: "Attack Damage", description: "Increases damage dealt to enemies" },
                    armor: { level: 0, value: 0, baseCost: 100, maxLevel: 5, increment: 8, displayName: "Defense", description: "Reduces damage taken from enemies" },
                    maxHealth: { level: 0, value: 1000, baseCost: 100, maxLevel: 5, increment: 150, displayName: "Maximum Health", description: "Increases your maximum health" },
                    healthRegen: { level: 0, value: 0, baseCost: 200, maxLevel: 5, increment: 4, displayName: "Health Regeneration", description: "Regenerate health over time" },
                    moveSpeed: { level: 0, value: 1, baseCost: 150, maxLevel: 5, increment: 0.09, displayName: "Movement Speed", description: "Move faster" },
                    pickupRadius: { level: 0, value: 1, baseCost: 150, maxLevel: 5, increment: 0.35, displayName: "Pickup Radius", description: "Collect items from further away" },
                    experienceGain: { level: 0, value: 1, baseCost: 150, maxLevel: 5, increment: 0.1, displayName: "Experience Gain", description: "Increases XP gained from orbs" }
                }
            };
        }
        
        console.log('Game state:', window.gameState);
        
        // Setup world bounds
        this.physics.world.setBounds(0, 0, this.mapSize.width, this.mapSize.height);
        
        // Create background
        this.createBackground();
        
        // Create game objects
        this.createGroups();
        this.createPlayer();
        this.createInputs();
        
        // Create game managers
        this.waveManager = new WaveManager(this);
        this.abilityManager = new AbilityManager(this);
        this.particleManager = new ParticleManager(this);
        
        // Create UI
        this.ui = new UI(this);
        
        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, this.mapSize.width, this.mapSize.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Reset game state for this run
        this.resetGameState();
        
        // Start first wave immediately
        this.waveManager.startNextWave();
        
        // Create XP orbs pool
        this.xpOrbs = this.physics.add.group({
            classType: XPOrb,
            maxSize: 50,
            runChildUpdate: true
        });
        
        // Enable collision between player and XP orbs
        this.physics.add.overlap(
            this.player,
            this.xpOrbs,
            this.handlePlayerXPCollision,
            null,
            this
        );
        
        // Initialize XP UI
        this.updateXPUI();
        
        console.log('GameScene create method completed');
    }

    update(time, delta) {
        // Calculate delta seconds
        const deltaSeconds = delta / 1000;
        
        // Update elapsed time
        this.elapsedTime += deltaSeconds;
        
        // Skip updates if game over
        if (this.gameOver) return;
        
        // Check if wave is complete
        if (this.waveManager.isWaveComplete() && this.enemies.countActive() === 0) {
            // Check if this is the final wave
            if (this.waveManager.getCurrentWave() >= this.waveManager.maxWaves) {
                // If final wave completed, transition to game over with victory
                this.transitionToGameOver(true);
            } else {
                // Instead of transitioning to upgrade scene, immediately start next wave
                this.waveManager.startNextWave();
                
                // Show a wave notification
                this.showNextWaveNotification();
            }
        }
        
        // Update player if alive
        this.player.update(time, delta);
        
        // Update projectiles
        this.projectiles.getChildren().forEach(projectile => {
            projectile.update(time, delta);
        });
        
        // Debug XP collection status
        if (this.debugMode && time % 1000 < 20) {
            console.log("XP orbs in scene:", this.xpOrbs ? this.xpOrbs.countActive() : 'xpOrbs not defined');
            console.log("Player XP:", window.gameState.playerXP);
        }
        
        // Update XP orbs
        if (this.xpOrbs) {
            let activeOrbCount = 0;
            this.xpOrbs.getChildren().forEach(orb => {
                if (orb && orb.active) {
                    activeOrbCount++;
                    orb.update(delta, this.player);
                }
            });
            
            if (this.debugMode && time % 5000 < 20) {
                console.log(`Active XP orbs: ${activeOrbCount}`);
            }
        }
        
        // Update health pickups
        this.healthPickups.getChildren().forEach(pickup => {
            pickup.update(deltaSeconds);
        });
        
        // Update UI
        this.ui.update(deltaSeconds);
        
        // Update wave manager
        this.waveManager.update(deltaSeconds);
    }

    createBackground() {
        // Create a tiled background
        const bg = this.add.tileSprite(0, 0, this.mapSize.width, this.mapSize.height, 'background');
        bg.setOrigin(0, 0);
        bg.setDepth(-1);
    }

    createGroups() {
        // Create physics groups for game objects
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true,  // Make sure updates are run
            maxSize: 100,          // Limit number of enemies to prevent performance issues
            collideWorldBounds: true,  // Keep enemies inside game world
            createCallback: (enemy) => {
                // Make sure newly created enemies are visible
                enemy.setActive(true);
                enemy.setVisible(true);
                console.log('Enemy created in group');
            }
        });
        
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: false,
            defaultKey: 'bullet'
        });
        
        this.healthPickups = this.physics.add.group({
            classType: HealthPickup,
            runChildUpdate: false
        });
    }

    createPlayer() {
        // Create player at center of map
        this.player = new Player(
            this,
            this.mapSize.width / 2,
            this.mapSize.height / 2
        );
        
        // Setup player collisions
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.handlePlayerEnemyCollision,
            null,
            this
        );
        
        this.physics.add.overlap(
            this.player,
            this.healthPickups,
            this.handlePlayerHealthCollision,
            null,
            this
        );
    }

    createInputs() {
        // Setup keyboard inputs
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            ability: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            ultimate: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        
        // Setup mouse click for shooting
        this.input.on('pointerdown', (pointer) => {
            if (this.gameOver) return;
            
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.player.shoot(worldPoint.x, worldPoint.y);
        });
    }

    handlePlayerEnemyCollision(player, enemy) {
        // Player takes damage from enemy
        player.takeDamage(enemy.damage);
        
        // Check if player is dead
        if (player.health <= 0 && !this.gameOver) {
            this.endGame();
        }
    }

    handlePlayerXPCollision(player, xpOrb) {
        // Debug log for XP collection
        console.log("Player collided with XP orb", xpOrb.active ? "active" : "inactive", "value:", xpOrb.value);
        
        try {
            // Skip if orb is not active (already collected)
            if (!xpOrb.active || xpOrb.collected) {
                return;
            }
            
            // Mark as collected immediately to prevent double collection
            xpOrb.collected = true;
            
            // Log XP collection
            console.log(`Collecting XP orb with value: ${xpOrb.value}`);
            
            // Get XP multiplier if available from game state
            let xpMultiplier = 1;
            if (window.gameState && 
                window.gameState.stats && 
                window.gameState.stats.experienceGain && 
                typeof window.gameState.stats.experienceGain.value === 'number') {
                xpMultiplier = window.gameState.stats.experienceGain.value;
                console.log(`Applied XP multiplier: ${xpMultiplier}`);
            }
            
            // Apply XP multiplier
            const xpGained = Math.max(1, Math.round(xpOrb.value * xpMultiplier));
            
            // Update player XP - ensure gameState exists
            if (!window.gameState) {
                console.error("Game state not initialized before XP collection!");
                window.gameState = {
                    playerXP: 0,
                    playerLevel: 1,
                    xpToNextLevel: 100,
                    gold: 0,
                    stats: {}
                };
            }
            
            window.gameState.playerXP = (window.gameState.playerXP || 0) + xpGained;
            
            // Show XP value as floating text
            this.createFloatingText(xpOrb.x, xpOrb.y, `+${xpGained} XP`, 0x00ffff);
            
            // Check for level up
            this.checkLevelUp();
            
            // Update UI with new XP
            this.updateXPUI();
            
            // Create particle effect
            if (xpOrb.createCollectEffect) {
                xpOrb.createCollectEffect();
            }
            
            // Return XP orb to pool - delayed to allow particle effects
            this.time.delayedCall(100, () => {
                xpOrb.setActive(false);
                xpOrb.setVisible(false);
            });
            
            // Play sound
            if (this.sound && this.sound.add) {
                try {
                    const collectSound = this.sound.add('collectXP', { volume: 0.3 });
                    collectSound.play();
                } catch (e) {
                    // Sound might not be available, ignore
                }
            }
            
        } catch (error) {
            console.error("Error in XP collection:", error);
            // Make sure orb is deactivated even if error occurs
            if (xpOrb && xpOrb.active) {
                xpOrb.setActive(false);
                xpOrb.setVisible(false);
            }
        }
    }

    handlePlayerHealthCollision(player, healthPickup) {
        // Collect health
        player.heal(healthPickup.getValue());
        
        // Destroy health pickup
        healthPickup.collect();
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        // Add debug logging
        console.log('Projectile hit enemy:', projectile, enemy);
        
        try {
            // Destroy projectile immediately at the beginning of the function
            if (projectile && projectile.active) {
                if (typeof projectile.hit === 'function') {
                    projectile.hit();
                } else {
                    // Fallback destroy
                    projectile.setActive(false);
                    projectile.setVisible(false);
                }
            }
            
            // Calculate damage
            let damage = this.player.damage;
            let isCritical = false;
            
            console.log('Player damage value:', damage);
            
            // Check for critical hit
            const critChance = window.gameState?.stats?.critChance?.value || 0;
            const critDamage = window.gameState?.stats?.critDamage?.value || 1.5;
            
            if (Math.random() < critChance) {
                damage *= critDamage;
                isCritical = true;
                console.log('Critical hit!', damage);
            }
            
            // Display damage text over enemy
            if (isCritical) {
                this.ui.showDamageText(enemy.x, enemy.y, damage, true);
            } else {
                this.ui.showDamageText(enemy.x, enemy.y, damage, false);
            }
            
            // Apply damage to enemy - Force a high value to ensure it's noticeable
            const effectiveDamage = Math.max(damage, 100); // Ensure minimum damage of 100
            console.log('Applying damage to enemy:', effectiveDamage);
            
            // Direct health reduction if takeDamage isn't working
            if (enemy && enemy.active) {
                // Try normal method first
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(effectiveDamage);
                    console.log('Used takeDamage method, new health:', enemy.health);
                } else {
                    // Direct manipulation fallback
                    console.warn('Enemy missing takeDamage method, using direct approach');
                    if (typeof enemy.health !== 'undefined') {
                        enemy.health -= effectiveDamage;
                        
                        // Update health bar if it exists
                        if (enemy.healthBar) {
                            enemy.healthBar.width = (enemy.health / enemy.maxHealth) * 40;
                            enemy.healthBar.x = enemy.x - 20 + (enemy.health / enemy.maxHealth * 40) / 2;
                        }
                        
                        // If enemy has died
                        if (enemy.health <= 0) {
                            if (typeof enemy.die === 'function') {
                                enemy.die();
                            } else {
                                // Manual death
                                enemy.setActive(false);
                                enemy.setVisible(false);
                                
                                // Try to create XP orbs
                                this.spawnXPOrb(enemy.x, enemy.y, 10);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in projectile-enemy collision handling:', error);
        }
    }

    spawnEnemy(type, x, y, health, damage, speed) {
        // Try to get from the group first
        let enemy = this.enemies.get(x, y);
        
        // If no enemy was obtained from the group, create a new one
        if (!enemy) {
            console.log('Creating new enemy instance');
            enemy = new Enemy(this, x, y);
            this.enemies.add(enemy);
        }
        
        if (enemy) {
            // Make sure the enemy is visible
            enemy.setActive(true);
            enemy.setVisible(true);
            enemy.setPosition(x, y);
            
            // Initialize with proper type and stats
            enemy.setup(health, damage, speed, type);
            
            // Set the appropriate texture based on type
            enemy.setTexture('enemy');
            
            // Add color tint based on enemy type for differentiation
            switch(type) {
                case 'chase': 
                    enemy.setTint(0xff0000); // Red for basic enemies
                    break;
                case 'flanker': 
                    enemy.setTint(0xff00ff); // Purple for flankers
                    break;
                case 'ranged': 
                    enemy.setTint(0x00ffff); // Cyan for ranged
                    break;
                case 'swarm': 
                    enemy.setTint(0xffff00); // Yellow for swarm
                    break;
                case 'bomber': 
                    enemy.setTint(0xff6600); // Orange for bombers
                    break;
                case 'shielded': 
                    enemy.setTint(0x0000ff); // Blue for shielded
                    break;
                default:
                    enemy.setTint(0xff0000); // Default red
            }
            
            // Add collision with projectiles
            this.physics.add.overlap(
                this.projectiles,
                enemy,
                this.handleProjectileEnemyCollision,
                null,
                this
            );
            
            console.log(`Spawned ${type} enemy at (${x}, ${y}) with ${health} health`);
            return enemy;
        }
        
        return null;
    }

    spawnXPOrb(x, y, value) {
        try {
            console.log(`Spawning XP orb at (${x}, ${y}) with value ${value}`);
            
            // Check if XP orbs group exists
            if (!this.xpOrbs) {
                console.error('XP orbs group not initialized!');
                return null;
            }
            
            // Try to get an XP orb from the pool
            const xpOrb = this.xpOrbs.get(x, y);
            
            if (xpOrb) {
                // Configure the XP orb
                console.log('Setting up XP orb:', xpOrb);
                xpOrb.setPosition(x, y);
                xpOrb.setActive(true);
                xpOrb.setVisible(true);
                
                // If setup method exists, use it
                if (typeof xpOrb.setup === 'function') {
                    xpOrb.setup(value);
                } else {
                    // Fallback initialization
                    xpOrb.value = value;
                    xpOrb.attractionRange = 100;
                    xpOrb.attractionSpeed = 0;
                    xpOrb.collected = false;
                    
                    // Set random velocity for a nice scatter effect
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Phaser.Math.Between(50, 100);
                    xpOrb.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );
                }
                
                // Create a temporary delay before allowing collection
                // This prevents immediate collection if player is close
                this.time.delayedCall(300, () => {
                    if (xpOrb && xpOrb.active) {
                        xpOrb.readyForCollection = true;
                    }
                });
                
                return xpOrb;
            } else {
                console.warn('Failed to get XP orb from pool - may be exhausted');
                
                // Try to create one directly if pool is exhausted
                const newOrb = new XPOrb(this, x, y);
                if (typeof newOrb.setup === 'function') {
                    newOrb.setup(value);
                }
                this.xpOrbs.add(newOrb);
                return newOrb;
            }
        } catch (error) {
            console.error('Error spawning XP orb:', error);
            return null;
        }
    }

    spawnHealthPickup(x, y, value) {
        const healthPickup = this.healthPickups.get(x, y);
        
        if (healthPickup) {
            healthPickup.setup(value);
            return healthPickup;
        }
        
        return null;
    }

    levelUp() {
        try {
            // Make sure gameState exists and is properly initialized
            if (!window.gameState) {
                console.error('Game state is not initialized in levelUp');
                return;
            }
            
            // Increment player level
            window.gameState.playerLevel++;
            
            // Reset XP and set new XP threshold (scales with level)
            window.gameState.playerXP = 0;
            window.gameState.xpToNextLevel = Math.floor(window.gameState.xpToNextLevel * 1.2);
            
            // Show level up UI and offer ability choices
            this.scene.pause();
            
            // Check if AbilityManager exists before trying to show UI
            if (this.abilityManager) {
                this.abilityManager.showLevelUpChoices();
            } else {
                console.warn('AbilityManager not initialized in levelUp');
                this.scene.resume(); // Resume if we can't show abilities
            }
        } catch (e) {
            console.error('Error in levelUp method:', e);
            // Try to resume the scene to prevent freezing
            try {
                this.scene.resume();
            } catch (resumeErr) {
                console.error('Failed to resume scene after levelUp error:', resumeErr);
            }
        }
    }

    resetGameState() {
        // Reset game-specific state (not global stats)
        window.gameState.playerLevel = 1;
        window.gameState.playerXP = 0;
        window.gameState.xpToNextLevel = 100;
        window.gameState.activeAbilities = [];
        
        // Reset wave count
        this.waveManager.resetWaves();
    }

    endGame() {
        this.gameOver = true;
        
        try {
            // Update highest wave if current wave is higher
            if (this.waveManager && this.waveManager.currentWave > (window.gameState?.highestWave || 0)) {
                window.gameState.highestWave = this.waveManager.currentWave;
            }
            
            // Award gold for completing the run - with safe access to properties
            const goldMultiplier = window.gameState?.stats?.goldMultiplier?.value || 1;
            const goldReward = Math.floor(1000 * goldMultiplier);
            
            if (window.gameState && typeof window.gameState.gold !== 'undefined') {
                window.gameState.gold += goldReward;
            }
            
            // Show game over screen after a short delay
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    wave: this.waveManager?.currentWave || 1,
                    gold: goldReward,
                    victory: false
                });
            });
        } catch (error) {
            console.error('Error in endGame method:', error);
            
            // Ensure we still transition to game over screen even if there was an error
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    wave: 1,
                    gold: 0,
                    victory: false,
                    error: true
                });
            });
        }
    }

    showNextWaveNotification() {
        try {
            const waveNumber = this.waveManager.getCurrentWave();
            
            // Create a text notification at the top of the screen
            const notification = this.add.text(
                this.cameras.main.worldView.centerX,
                this.cameras.main.worldView.y + 100,
                `WAVE ${waveNumber} STARTED!`,
                {
                    font: 'bold 32px Arial',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6
                }
            ).setOrigin(0.5);
            
            notification.setScrollFactor(0); // Fix to camera
            notification.setDepth(100); // Ensure it appears on top
            
            // Add a fade-in/fade-out animation
            this.tweens.add({
                targets: notification,
                alpha: { from: 0, to: 1 },
                y: { from: notification.y - 30, to: notification.y },
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.tweens.add({
                        targets: notification,
                        alpha: 0,
                        y: notification.y - 30,
                        delay: 1500,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            notification.destroy();
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error showing wave notification:', error);
        }
    }

    checkLevelUp() {
        if (!window.gameState) return;
        
        // Check if we have enough XP to level up
        while (window.gameState.playerXP >= window.gameState.xpToNextLevel) {
            // Level up
            window.gameState.playerXP -= window.gameState.xpToNextLevel;
            window.gameState.playerLevel++;
            
            // Calculate new XP threshold with scaling difficulty
            window.gameState.xpToNextLevel = Math.floor(100 * Math.pow(1.2, window.gameState.playerLevel - 1));
            
            console.log(`Player leveled up to ${window.gameState.playerLevel}!`);
            console.log(`New XP to next level: ${window.gameState.xpToNextLevel}`);
            
            // Visual feedback for level up
            if (this.player) {
                // Particle effect
                const particles = this.add.particles(this.player.x, this.player.y, 'xpOrb', {
                    speed: { min: 50, max: 200 },
                    scale: { start: 0.5, end: 0 },
                    quantity: 20,
                    lifespan: 800,
                    blendMode: 'ADD',
                    emitting: false
                });
                
                particles.explode(20);
                
                // Scale effect on player
                this.tweens.add({
                    targets: this.player,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 200,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut'
                });
                
                // Level up text
                this.createFloatingText(
                    this.player.x, 
                    this.player.y - 40, 
                    'LEVEL UP!', 
                    0xffff00, 
                    32
                );
                
                // Add sound if available
                try {
                    const levelUpSound = this.sound.add('levelUp', { volume: 0.5 });
                    levelUpSound.play();
                } catch (e) {
                    // Sound might not be available
                }
                
                // Auto-destroy particles
                this.time.delayedCall(1000, () => {
                    particles.destroy();
                });
            }
            
            // Grant gold reward for level up
            window.gameState.gold = (window.gameState.gold || 0) + (window.gameState.playerLevel * 50);
            
            // Show gold reward
            this.createFloatingText(
                this.player.x, 
                this.player.y - 20, 
                `+${window.gameState.playerLevel * 50} Gold`, 
                0xffff00
            );
        }
    }
    
    updateXPUI() {
        try {
            // Update XP bar if UI exists
            if (this.ui && typeof this.ui.updateXP === 'function') {
                this.ui.updateXP();
                return;
            }
            
            // Fallback UI update if no UI module
            if (this.xpBar && this.xpText) {
                const xpPercent = window.gameState.playerXP / window.gameState.xpToNextLevel;
                this.xpBar.clear();
                
                // XP bar background
                this.xpBar.fillStyle(0x222244, 0.8);
                this.xpBar.fillRect(10, this.cameras.main.height - 30, 200, 20);
                
                // XP bar fill
                this.xpBar.fillStyle(0x00ffff, 1);
                this.xpBar.fillRect(10, this.cameras.main.height - 30, 200 * xpPercent, 20);
                
                // XP text update
                this.xpText.setText(`Level ${window.gameState.playerLevel} - XP: ${window.gameState.playerXP}/${window.gameState.xpToNextLevel}`);
            } else {
                // Create XP UI elements if they don't exist
                this.xpBar = this.add.graphics();
                
                // XP bar background
                this.xpBar.fillStyle(0x222244, 0.8);
                this.xpBar.fillRect(10, this.cameras.main.height - 30, 200, 20);
                
                // XP bar fill
                const xpPercent = window.gameState.playerXP / window.gameState.xpToNextLevel;
                this.xpBar.fillStyle(0x00ffff, 1);
                this.xpBar.fillRect(10, this.cameras.main.height - 30, 200 * xpPercent, 20);
                
                // XP text
                this.xpText = this.add.text(
                    10, 
                    this.cameras.main.height - 50,
                    `Level ${window.gameState.playerLevel} - XP: ${window.gameState.playerXP}/${window.gameState.xpToNextLevel}`,
                    {
                        font: '16px Arial',
                        fill: '#ffffff'
                    }
                );
            }
        } catch (error) {
            console.error("Error updating XP UI:", error);
        }
    }
    
    createFloatingText(x, y, text, color = 0xffffff, fontSize = 16) {
        try {
            // Create floating text
            const floatingText = this.add.text(
                x, 
                y,
                text,
                {
                    fontFamily: 'Arial',
                    fontSize: `${fontSize}px`,
                    color: color ? `#${color.toString(16).padStart(6, '0')}` : '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
            
            // Animate the text floating upward and fading out
            this.tweens.add({
                targets: floatingText,
                y: y - 50,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    floatingText.destroy();
                }
            });
            
            return floatingText;
        } catch (error) {
            console.error("Error creating floating text:", error);
            return null;
        }
    }
} 