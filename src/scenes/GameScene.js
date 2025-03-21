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
    }

    update(time, delta) {
        if (this.gameOver) return;
        
        const deltaSeconds = delta / 1000;
        this.elapsedTime += deltaSeconds;
        this.waveTime += deltaSeconds;
        
        if (!this.player) return; // Exit if player doesn't exist
        
        // Update game state: current wave and enemies
        this.waveManager?.update(time, delta);
        
        // Check if all enemies are defeated in the current wave
        if (this.waveManager && this.waveManager.isWaveComplete() && !this.transitioningToUpgrade) {
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
        
        // Update XP orbs
        this.xpOrbs.getChildren().forEach(orb => {
            orb.update(deltaSeconds);
        });
        
        // Update health pickups
        this.healthPickups.getChildren().forEach(pickup => {
            pickup.update(deltaSeconds);
        });
        
        // Update wave manager
        this.waveManager.update(deltaSeconds);
        
        // Debug: log the number of active enemies every 5 seconds
        if (Math.floor(this.elapsedTime) % 5 === 0 && Math.floor(delta) === 16) {
            const activeEnemies = this.enemies.getChildren().filter(e => e.active).length;
            console.log(`Active enemies: ${activeEnemies}/${this.enemies.getChildren().length}`);
        }
        
        // Update enemy AI - now handled by runChildUpdate in the group
        
        // Apply health regeneration - with error handling
        try {
            if (window.gameState && window.gameState.stats && 
                window.gameState.stats.healthRegen && 
                window.gameState.stats.healthRegen.value > 0) {
                this.player.heal(window.gameState.stats.healthRegen.value * deltaSeconds);
            }
        } catch (e) {
            console.warn('Error applying health regeneration:', e);
        }
        
        // Check for player level up - with error handling
        try {
            if (window.gameState && window.gameState.playerXP >= window.gameState.xpToNextLevel) {
                this.levelUp();
            }
        } catch (e) {
            console.warn('Error checking for level up:', e);
        }
        
        // Update UI
        this.ui.update(deltaSeconds);
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
        
        this.xpOrbs = this.physics.add.group({
            classType: XPOrb,
            runChildUpdate: false
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
            this.xpOrbs,
            this.handlePlayerXPCollision,
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
        // Collect XP
        const xpValue = xpOrb.getValue();
        window.gameState.playerXP += xpValue * window.gameState.stats.experienceGain.value;
        
        // Update UI
        this.ui.updateXP();
        
        // Destroy XP orb
        xpOrb.collect();
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
                // Critical hit - multiply damage
                damage *= critDamage;
                isCritical = true;
            }
            
            // Show damage text
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
        const xpOrb = this.xpOrbs.get(x, y);
        
        if (xpOrb) {
            xpOrb.setup(value);
            return xpOrb;
        }
        
        return null;
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
} 