export class AbilityManager {
    constructor(scene) {
        this.scene = scene;
        this.abilities = this.defineAbilities();
        this.levelUpUI = null;
        this.abilityChoices = [];
    }

    defineAbilities() {
        return {
            // Passive stat upgrades
            abilityHaste: {
                name: "Ability Haste",
                description: "Reduces ability cooldowns by 10%",
                type: "passive",
                effect: (player) => {
                    // Reduce ability cooldowns
                    player.stealthAbility.cooldown *= 0.9;
                    player.katanaUltimate.cooldown *= 0.9;
                }
            },
            areaSize: {
                name: "Area Size",
                description: "Increases the radius of all area effects by 11%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            armor: {
                name: "Armor",
                description: "Gain 8 armor, reducing damage taken",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            criticalChance: {
                name: "Critical Chance",
                description: "Increases chance to deal double damage by 8%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            damage: {
                name: "Damage",
                description: "Increases all damage dealt by 10%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            duration: {
                name: "Duration",
                description: "Increases the duration of all effects by 12%",
                type: "passive",
                effect: (player) => {
                    // Increase ability durations
                    player.stealthAbility.duration *= 1.12;
                    player.katanaUltimate.duration *= 1.12;
                }
            },
            experienceGain: {
                name: "XP Gain",
                description: "Increases experience gained by 10%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            healthRegen: {
                name: "Health Regeneration",
                description: "Regenerate 4 health per second",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            maxHealth: {
                name: "Max Health",
                description: "Increases maximum health by 150",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in Player class
                    player.updateStats();
                    player.heal(150); // Heal for the amount increased
                }
            },
            moveSpeed: {
                name: "Movement Speed",
                description: "Increases movement speed by 9%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in Player class
                    player.updateStats();
                }
            },
            pickupRadius: {
                name: "Pickup Radius",
                description: "Increases pickup collection range by 35%",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in GameScene
                }
            },
            projectileCount: {
                name: "Projectile Count",
                description: "Adds an additional projectile to your attacks",
                type: "passive",
                effect: (player) => {
                    // Applied through modifier in Player class
                }
            },
            
            // Active abilities
            explosiveMines: {
                name: "Explosive Mines",
                description: "Deploy mines that detonate for heavy area damage",
                type: "active",
                cooldown: 5,
                effect: (scene, player, x, y) => {
                    // Create mines around the player
                    const mineCount = 3;
                    const mineRadius = 100;
                    
                    for (let i = 0; i < mineCount; i++) {
                        const angle = (i / mineCount) * Math.PI * 2;
                        const mineX = player.x + Math.cos(angle) * mineRadius;
                        const mineY = player.y + Math.sin(angle) * mineRadius;
                        
                        this.createMine(scene, mineX, mineY);
                    }
                }
            },
            bouncingExplosive: {
                name: "Bouncing Explosive",
                description: "Launch explosives bouncing between enemies causing successive damage",
                type: "active",
                cooldown: 8,
                effect: (scene, player) => {
                    // Create bouncing bomb
                    const bomb = scene.physics.add.sprite(player.x, player.y, 'bullet');
                    bomb.setTint(0xff9900); // Orange
                    bomb.setScale(1.5);
                    
                    // Get closest enemy
                    const enemies = scene.enemies.getChildren();
                    if (enemies.length === 0) return;
                    
                    let closestEnemy = null;
                    let closestDist = Infinity;
                    
                    for (const enemy of enemies) {
                        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestEnemy = enemy;
                        }
                    }
                    
                    // Set bomb properties
                    bomb.bounceCount = 5;
                    bomb.damage = player.damage * 1.5;
                    bomb.speed = 300;
                    bomb.targetEnemy = closestEnemy;
                    
                    // Update function for bomb
                    bomb.update = function(time, delta) {
                        if (this.targetEnemy && this.targetEnemy.active) {
                            // Move towards target
                            const dx = this.targetEnemy.x - this.x;
                            const dy = this.targetEnemy.y - this.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            this.setVelocity(
                                (dx / dist) * this.speed,
                                (dy / dist) * this.speed
                            );
                            
                            // Check if hit target
                            if (dist < 20) {
                                this.hitEnemy(this.targetEnemy);
                            }
                        } else {
                            // Find new target if current one is gone
                            this.findNewTarget();
                        }
                    };
                    
                    // Hit function
                    bomb.hitEnemy = function(enemy) {
                        // Deal damage
                        enemy.takeDamage(this.damage);
                        scene.ui.showDamageText(enemy.x, enemy.y, this.damage, false);
                        
                        // Create explosion effect
                        const explosion = scene.add.sprite(this.x, this.y, 'bullet')
                            .setTint(0xff9900)
                            .setScale(1);
                        
                        scene.tweens.add({
                            targets: explosion,
                            scale: 3,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => explosion.destroy()
                        });
                        
                        // Decrement bounce count
                        this.bounceCount--;
                        
                        if (this.bounceCount <= 0) {
                            this.destroy();
                            return;
                        }
                        
                        // Find new target
                        this.findNewTarget();
                    };
                    
                    // Find new target function
                    bomb.findNewTarget = function() {
                        const enemies = scene.enemies.getChildren();
                        if (enemies.length === 0) {
                            this.destroy();
                            return;
                        }
                        
                        // Filter out current target
                        const validTargets = enemies.filter(e => e !== this.targetEnemy && e.active);
                        if (validTargets.length === 0) {
                            this.destroy();
                            return;
                        }
                        
                        // Select random target
                        this.targetEnemy = validTargets[Math.floor(Math.random() * validTargets.length)];
                    };
                    
                    // Add to scene update list
                    scene.sys.updateList.add(bomb);
                }
            },
            coneProjectileBarrage: {
                name: "Cone Projectile Barrage",
                description: "Fire multiple projectiles in a cone pattern",
                type: "active",
                cooldown: 3,
                effect: (scene, player) => {
                    // Get mouse position for direction
                    const pointer = scene.input.activePointer;
                    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    
                    // Calculate direction
                    const dirX = worldPoint.x - player.x;
                    const dirY = worldPoint.y - player.y;
                    const length = Math.sqrt(dirX * dirX + dirY * dirY);
                    const normalizedDirX = dirX / length;
                    const normalizedDirY = dirY / length;
                    
                    // Fire projectiles in a cone
                    const projectileCount = 7;
                    const spreadAngle = 60; // degrees
                    const startAngle = -spreadAngle / 2;
                    const angleStep = spreadAngle / (projectileCount - 1);
                    
                    for (let i = 0; i < projectileCount; i++) {
                        const angle = startAngle + i * angleStep;
                        const radians = Phaser.Math.DegToRad(angle);
                        
                        // Calculate rotated direction
                        const rotatedDirX = normalizedDirX * Math.cos(radians) - normalizedDirY * Math.sin(radians);
                        const rotatedDirY = normalizedDirX * Math.sin(radians) + normalizedDirY * Math.cos(radians);
                        
                        // Create projectile
                        const projectile = scene.projectiles.get(player.x, player.y, 'bullet');
                        if (projectile) {
                            projectile.fire(player.x, player.y, rotatedDirX, rotatedDirY, player.damage * 0.8);
                        }
                    }
                }
            },
            returningBlade: {
                name: "Returning Blade",
                description: "Throw a blade that returns to you, damaging enemies in its path",
                type: "active",
                cooldown: 5,
                effect: (scene, player) => {
                    // Get mouse position for direction
                    const pointer = scene.input.activePointer;
                    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    
                    // Calculate direction
                    const dirX = worldPoint.x - player.x;
                    const dirY = worldPoint.y - player.y;
                    const length = Math.sqrt(dirX * dirX + dirY * dirY);
                    const normalizedDirX = dirX / length;
                    const normalizedDirY = dirY / length;
                    
                    // Create blade
                    const blade = scene.physics.add.sprite(player.x, player.y, 'shuriken');
                    blade.setTint(0xccccff); // Light blue
                    blade.setScale(2);
                    
                    // Set blade properties
                    blade.damage = player.damage * 1.5;
                    blade.speed = 400;
                    blade.returnSpeed = 600;
                    blade.maxDistance = 500;
                    blade.distanceTraveled = 0;
                    blade.isReturning = false;
                    blade.hitEnemies = new Set();
                    
                    // Set velocity
                    blade.setVelocity(
                        normalizedDirX * blade.speed,
                        normalizedDirY * blade.speed
                    );
                    
                    // Add collision with enemies
                    scene.physics.add.overlap(
                        blade,
                        scene.enemies,
                        (blade, enemy) => {
                            // Only hit each enemy once
                            if (!blade.hitEnemies.has(enemy)) {
                                blade.hitEnemies.add(enemy);
                                enemy.takeDamage(blade.damage);
                                scene.ui.showDamageText(enemy.x, enemy.y, blade.damage, false);
                            }
                        }
                    );
                    
                    // Update function
                    blade.update = function(time, delta) {
                        const deltaTime = delta / 1000;
                        
                        // Update distance traveled
                        const dx = this.body.velocity.x * deltaTime;
                        const dy = this.body.velocity.y * deltaTime;
                        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
                        
                        // Check if should return
                        if (!this.isReturning && this.distanceTraveled >= this.maxDistance) {
                            this.startReturning();
                        }
                        
                        // If returning, move towards player
                        if (this.isReturning) {
                            // Calculate direction to player
                            const dx = player.x - this.x;
                            const dy = player.y - this.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            // Check if reached player
                            if (dist < 30) {
                                this.destroy();
                                return;
                            }
                            
                            // Move towards player
                            this.setVelocity(
                                (dx / dist) * this.returnSpeed,
                                (dy / dist) * this.returnSpeed
                            );
                        }
                        
                        // Rotate blade
                        this.rotation += 10 * deltaTime;
                    };
                    
                    // Start returning function
                    blade.startReturning = function() {
                        this.isReturning = true;
                        this.hitEnemies = new Set(); // Reset hit enemies so they can be hit again
                    };
                    
                    // Add to scene update list
                    scene.sys.updateList.add(blade);
                }
            },
            spinningProjectiles: {
                name: "Spinning Projectiles",
                description: "Create a ring of projectiles that orbit around you, damaging enemies",
                type: "active",
                cooldown: 10,
                effect: (scene, player) => {
                    // Create orbiting projectiles
                    const projectileCount = 8;
                    const radius = 100;
                    const duration = 10; // seconds
                    const rotationSpeed = 2; // radians per second
                    
                    // Create container to hold projectiles
                    const container = scene.add.container(player.x, player.y);
                    container.timeLeft = duration;
                    
                    // Create projectiles
                    const projectiles = [];
                    for (let i = 0; i < projectileCount; i++) {
                        const angle = (i / projectileCount) * Math.PI * 2;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        // Create projectile
                        const projectile = scene.add.sprite(x, y, 'bullet');
                        projectile.setTint(0x00ffff); // Cyan
                        projectile.angle = angle;
                        container.add(projectile);
                        projectiles.push(projectile);
                    }
                    
                    // Make container follow player
                    scene.tweens.add({
                        targets: container,
                        x: player.x,
                        y: player.y,
                        duration: 100,
                        ease: 'Linear',
                        repeat: -1
                    });
                    
                    // Update container
                    container.update = function(time, delta) {
                        const deltaTime = delta / 1000;
                        
                        // Update time left
                        this.timeLeft -= deltaTime;
                        if (this.timeLeft <= 0) {
                            this.destroy();
                            return;
                        }
                        
                        // Update position to follow player
                        this.x = player.x;
                        this.y = player.y;
                        
                        // Rotate projectiles
                        for (let i = 0; i < projectiles.length; i++) {
                            const projectile = projectiles[i];
                            projectile.angle += rotationSpeed * deltaTime;
                            
                            // Update position
                            projectile.x = Math.cos(projectile.angle) * radius;
                            projectile.y = Math.sin(projectile.angle) * radius;
                            
                            // Check for enemy collisions
                            const worldX = container.x + projectile.x;
                            const worldY = container.y + projectile.y;
                            
                            // Find enemies in range
                            const enemies = scene.enemies.getChildren();
                            for (const enemy of enemies) {
                                const dx = enemy.x - worldX;
                                const dy = enemy.y - worldY;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                
                                if (dist < 20) {
                                    enemy.takeDamage(player.damage * 0.5);
                                    scene.ui.showDamageText(enemy.x, enemy.y, player.damage * 0.5, false);
                                    
                                    // Create hit effect
                                    const hitEffect = scene.add.sprite(worldX, worldY, 'bullet')
                                        .setTint(0x00ffff)
                                        .setScale(0.5);
                                    
                                    scene.tweens.add({
                                        targets: hitEffect,
                                        scale: 1.5,
                                        alpha: 0,
                                        duration: 200,
                                        onComplete: () => hitEffect.destroy()
                                    });
                                }
                            }
                        }
                    };
                    
                    // Add to scene update list
                    scene.sys.updateList.add(container);
                }
            }
        };
    }

    createMine(scene, x, y) {
        // Create mine sprite
        const mine = scene.physics.add.sprite(x, y, 'bullet');
        mine.setTint(0xff0000); // Red
        mine.setScale(1.5);
        
        // Set mine properties
        mine.damage = scene.player.damage * 2;
        mine.triggerRadius = 100 * window.gameState.stats.areaSize.value;
        mine.explosionRadius = 150 * window.gameState.stats.areaSize.value;
        mine.lifetime = 10 * window.gameState.stats.duration.value; // seconds
        
        // Add pulsing effect
        scene.tweens.add({
            targets: mine,
            scale: { from: 1.2, to: 1.5 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Update function
        mine.update = function(time, delta) {
            const deltaTime = delta / 1000;
            
            // Update lifetime
            this.lifetime -= deltaTime;
            if (this.lifetime <= 0) {
                this.explode();
                return;
            }
            
            // Check for nearby enemies
            const enemies = scene.enemies.getChildren();
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.triggerRadius) {
                    this.explode();
                    return;
                }
            }
        };
        
        // Explode function
        mine.explode = function() {
            // Create explosion effect
            const explosion = scene.add.sprite(this.x, this.y, 'bullet')
                .setTint(0xff0000)
                .setScale(1);
            
            scene.tweens.add({
                targets: explosion,
                scale: this.explosionRadius / 50, // Scale to match explosion radius
                alpha: 0,
                duration: 300,
                onComplete: () => explosion.destroy()
            });
            
            // Damage enemies in radius
            const enemies = scene.enemies.getChildren();
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.explosionRadius) {
                    // Damage falls off with distance
                    const damageMultiplier = 1 - (dist / this.explosionRadius);
                    const damage = this.damage * damageMultiplier;
                    
                    enemy.takeDamage(damage);
                    scene.ui.showDamageText(enemy.x, enemy.y, damage, false);
                }
            }
            
            // Destroy mine
            this.destroy();
        };
        
        // Add to scene update list
        scene.sys.updateList.add(mine);
        
        return mine;
    }

    showLevelUpChoices() {
        // Create ability choices UI
        this.createLevelUpUI();
    }

    createLevelUpUI() {
        const scene = this.scene;
        
        // Create UI container
        const panel = scene.add.container(0, 0);
        panel.setDepth(100);
        
        // Darken background
        const bg = scene.add.rectangle(
            scene.cameras.main.worldView.x,
            scene.cameras.main.worldView.y,
            scene.cameras.main.width,
            scene.cameras.main.height,
            0x000000,
            0.7
        );
        panel.add(bg);
        
        // Level up title
        const title = scene.add.text(
            scene.cameras.main.worldView.x + scene.cameras.main.width / 2,
            scene.cameras.main.worldView.y + 100,
            'LEVEL UP!',
            {
                font: 'bold 48px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        panel.add(title);
        
        // Choose ability text
        const subtitle = scene.add.text(
            scene.cameras.main.worldView.x + scene.cameras.main.width / 2,
            scene.cameras.main.worldView.y + 160,
            'Choose an ability:',
            {
                font: '24px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        panel.add(subtitle);
        
        // Generate 3 random abilities to choose from
        const abilities = this.getRandomAbilities(3);
        this.abilityChoices = abilities;
        
        // Create ability choice buttons
        const buttonHeight = 150;
        const buttonWidth = 500;
        const buttonSpacing = 20;
        const startY = scene.cameras.main.worldView.y + 250;
        
        for (let i = 0; i < abilities.length; i++) {
            const ability = abilities[i];
            const y = startY + i * (buttonHeight + buttonSpacing);
            
            // Button background
            const button = scene.add.rectangle(
                scene.cameras.main.worldView.x + scene.cameras.main.width / 2,
                y,
                buttonWidth,
                buttonHeight,
                0x444444,
                0.9
            ).setStrokeStyle(2, 0x888888);
            
            button.isStroked = true;
            panel.add(button);
            
            // Ability name
            const nameText = scene.add.text(
                scene.cameras.main.worldView.x + scene.cameras.main.width / 2 - buttonWidth / 2 + 20,
                y - 40,
                ability.name,
                {
                    font: 'bold 24px Arial',
                    fill: ability.type === 'passive' ? '#00ffff' : '#ffff00'
                }
            );
            panel.add(nameText);
            
            // Ability type
            const typeText = scene.add.text(
                scene.cameras.main.worldView.x + scene.cameras.main.width / 2 - buttonWidth / 2 + 20,
                y - 10,
                ability.type.toUpperCase(),
                {
                    font: '18px Arial',
                    fill: '#aaaaaa'
                }
            );
            panel.add(typeText);
            
            // Ability description
            const descText = scene.add.text(
                scene.cameras.main.worldView.x + scene.cameras.main.width / 2 - buttonWidth / 2 + 20,
                y + 20,
                ability.description,
                {
                    font: '18px Arial',
                    fill: '#ffffff',
                    wordWrap: { width: buttonWidth - 40 }
                }
            );
            panel.add(descText);
            
            // Make button interactive
            button.setInteractive({ useHandCursor: true });
            
            // Hover effects
            button.on('pointerover', () => {
                button.setFillStyle(0x666666);
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x444444);
            });
            
            // Select ability
            button.on('pointerup', () => {
                this.selectAbility(i);
                panel.destroy();
                scene.scene.resume();
            });
        }
        
        // Store UI reference
        this.levelUpUI = panel;
    }

    getRandomAbilities(count) {
        const availableAbilities = Object.values(this.abilities);
        const selectedAbilities = [];
        
        // Create a copy of the abilities array to avoid modifying the original
        const abilitiesCopy = [...availableAbilities];
        
        // Ensure a mix of passive and active abilities
        const passiveAbilities = abilitiesCopy.filter(a => a.type === 'passive');
        const activeAbilities = abilitiesCopy.filter(a => a.type === 'active');
        
        // Always include at least one passive if available
        if (passiveAbilities.length > 0) {
            const randomPassive = passiveAbilities[Math.floor(Math.random() * passiveAbilities.length)];
            selectedAbilities.push(randomPassive);
            
            // Remove selected passive from the copy
            const index = abilitiesCopy.findIndex(a => a.name === randomPassive.name);
            if (index !== -1) {
                abilitiesCopy.splice(index, 1);
            }
        }
        
        // Always include at least one active if available
        if (activeAbilities.length > 0 && selectedAbilities.length < count) {
            const randomActive = activeAbilities[Math.floor(Math.random() * activeAbilities.length)];
            selectedAbilities.push(randomActive);
            
            // Remove selected active from the copy
            const index = abilitiesCopy.findIndex(a => a.name === randomActive.name);
            if (index !== -1) {
                abilitiesCopy.splice(index, 1);
            }
        }
        
        // Fill remaining slots with random abilities
        while (selectedAbilities.length < count && abilitiesCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * abilitiesCopy.length);
            selectedAbilities.push(abilitiesCopy[randomIndex]);
            abilitiesCopy.splice(randomIndex, 1);
        }
        
        return selectedAbilities;
    }

    selectAbility(index) {
        const selectedAbility = this.abilityChoices[index];
        
        if (!selectedAbility) return;
        
        console.log(`Selected ability: ${selectedAbility.name}`);
        
        // Initialize playerUpgrades if needed
        if (!window.gameState.playerUpgrades) {
            window.gameState.playerUpgrades = {};
        }
        
        // Check if this ability has been selected before
        const abilityKey = selectedAbility.name.replace(/\s+/g, '');
        let isExistingAbility = false;
        
        if (window.gameState.playerUpgrades[abilityKey]) {
            // This ability already exists - upgrade it
            isExistingAbility = true;
            
            // Check if already at max level
            if (window.gameState.playerUpgrades[abilityKey].level >= 
                (window.gameState.playerUpgrades[abilityKey].maxLevel || 5)) {
                console.log(`${selectedAbility.name} is already at max level`);
            } else {
                // Increase the level
                window.gameState.playerUpgrades[abilityKey].level += 1;
                console.log(`Upgraded ${selectedAbility.name} to level ${window.gameState.playerUpgrades[abilityKey].level}`);
            }
        } else {
            // New ability - add to player upgrades
            window.gameState.playerUpgrades[abilityKey] = {
                name: selectedAbility.name,
                level: 1,
                maxLevel: 5,
                type: selectedAbility.type,
                description: selectedAbility.description || ''
            };
        }
        
        // Apply ability effect
        if (selectedAbility.type === 'passive') {
            // Apply passive effect immediately
            selectedAbility.effect(this.scene.player);
            
            // Store in active abilities for reference
            window.gameState.activeAbilities.push({
                name: selectedAbility.name,
                type: 'passive',
                level: window.gameState.playerUpgrades[abilityKey].level
            });
        } else if (selectedAbility.type === 'active') {
            // For active abilities, add to player's active abilities
            const player = this.scene.player;
            
            // Create active ability in player's system
            player.activeAbilities = player.activeAbilities || [];
            
            // If this ability already exists, enhance its effects
            const abilityLevel = window.gameState.playerUpgrades[abilityKey].level;
            
            // Apply level-based enhancements
            let cooldown = selectedAbility.cooldown;
            if (abilityLevel > 1) {
                // Reduce cooldown for higher levels
                cooldown = cooldown * Math.pow(0.9, abilityLevel - 1);
            }
            
            // Add the ability with level information
            player.activeAbilities.push({
                name: selectedAbility.name,
                cooldown: cooldown,
                currentCooldown: 0,
                level: abilityLevel,
                effect: selectedAbility.effect
            });
            
            // Store in game state for reference
            window.gameState.activeAbilities.push({
                name: selectedAbility.name,
                type: 'active',
                level: abilityLevel
            });
            
            // Update UI to show active abilities
            this.scene.ui.updateActiveAbilities(player.activeAbilities);
        }
        
        // Show level-up effect for upgrading the same ability
        if (isExistingAbility) {
            this.showUpgradeEffect(selectedAbility.name);
        }
        
        // Clean up
        this.abilityChoices = [];
        if (this.levelUpUI) {
            this.levelUpUI.destroy();
            this.levelUpUI = null;
        }
    }

    // New method to show a visual effect when upgrading an ability
    showUpgradeEffect(abilityName) {
        const scene = this.scene;
        
        // Create a text effect that shows the upgrade
        const text = scene.add.text(
            scene.cameras.main.worldView.x + scene.cameras.main.width / 2,
            scene.cameras.main.worldView.y + scene.cameras.main.height / 2,
            `${abilityName} Upgraded!`,
            {
                font: 'bold 36px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Add glow effect
        text.setBlendMode(Phaser.BlendModes.ADD);
        
        // Animation
        scene.tweens.add({
            targets: text,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }
} 