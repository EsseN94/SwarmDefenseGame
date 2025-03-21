export class UI {
    constructor(scene) {
        this.scene = scene;
        this.uiContainer = scene.add.container(0, 0);
        this.uiContainer.setDepth(100);
        this.uiContainer.setScrollFactor(0); // Fix to camera
        
        // UI components
        this.healthBar = null;
        this.healthText = null;
        this.xpBar = null;
        this.xpText = null;
        this.levelText = null;
        this.waveText = null;
        this.timerText = null;
        this.abilityIcons = [];
        this.ultimateIcon = null;
        this.activeAbilities = [];
        this.inventoryButton = null;
        this.inventoryOpen = false;
        this.playerUpgrades = {
            passive: [],
            ability: []
        };
        
        // Initialize UI elements
        this.createHealthBar();
        this.createXPBar();
        this.createWaveDisplay();
        this.createTimerDisplay();
        this.createAbilityDisplay();
        this.createInventoryButton();
    }

    update(deltaTime) {
        // Update timer display
        this.updateTimer(this.scene.elapsedTime);
        
        // Update health in real-time
        this.updateHealthRealTime();
        
        // Update ability cooldowns
        this.updateAbilityCooldowns(
            this.scene.player.stealthAbility.cooldownTimer > 0 ? 
                1 - (this.scene.player.stealthAbility.cooldownTimer / this.scene.player.stealthAbility.cooldown) : 1,
            this.scene.player.katanaUltimate.cooldownTimer > 0 ? 
                1 - (this.scene.player.katanaUltimate.cooldownTimer / this.scene.player.katanaUltimate.cooldown) : 1,
            this.scene.player.stealthAbility.active,
            this.scene.player.katanaUltimate.active
        );
        
        // Update active ability cooldowns
        this.updateActiveAbilityCooldowns(deltaTime);
    }

    createHealthBar() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Health bar background
        const healthBarBg = this.scene.add.rectangle(20, 20, 300, 30, 0x000000, 0.7)
            .setOrigin(0, 0);
        
        // Health bar fill
        this.healthBar = this.scene.add.rectangle(25, 25, 290, 20, 0xff0000)
            .setOrigin(0, 0);
        
        // Health text
        this.healthText = this.scene.add.text(170, 35, '1000/1000', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        // Add to UI container
        this.uiContainer.add(healthBarBg);
        this.uiContainer.add(this.healthBar);
        this.uiContainer.add(this.healthText);
    }

    createXPBar() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // XP bar background
        const xpBarBg = this.scene.add.rectangle(0, height - 30, width, 30, 0x000000, 0.7)
            .setOrigin(0, 0);
        
        // XP bar fill
        this.xpBar = this.scene.add.rectangle(0, height - 30, 0, 30, 0x00ffff)
            .setOrigin(0, 0);
        
        // XP text
        this.xpText = this.scene.add.text(width / 2, height - 15, '0/100 XP', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        // Level text
        this.levelText = this.scene.add.text(80, height - 15, 'Level 1', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        // Add to UI container
        this.uiContainer.add(xpBarBg);
        this.uiContainer.add(this.xpBar);
        this.uiContainer.add(this.xpText);
        this.uiContainer.add(this.levelText);
    }

    createWaveDisplay() {
        const width = this.scene.cameras.main.width;
        
        // Wave text
        this.waveText = this.scene.add.text(width - 20, 20, 'Wave: 0', {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0);
        
        // Add to UI container
        this.uiContainer.add(this.waveText);
    }

    createTimerDisplay() {
        const width = this.scene.cameras.main.width;
        
        // Timer text
        this.timerText = this.scene.add.text(width - 20, 60, 'Time: 0:00', {
            font: '20px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);
        
        // Add to UI container
        this.uiContainer.add(this.timerText);
    }

    createAbilityDisplay() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Ability 1 (Stealth)
        const ability1Bg = this.scene.add.rectangle(width - 200, height - 80, 60, 60, 0x000000, 0.7)
            .setStrokeStyle(2, 0x444444);
        
        const ability1Icon = this.scene.add.sprite(width - 200, height - 80, 'bullet')
            .setTint(0x00ff00)
            .setScale(1.5);
        
        const ability1Key = this.scene.add.text(width - 200, height - 45, 'SHIFT', {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        // Cooldown overlay
        const ability1Overlay = this.scene.add.rectangle(width - 200, height - 110, 60, 60, 0x000000, 0.7)
            .setOrigin(0.5, 0);
        
        // Timer text for ability 1
        const ability1Timer = this.scene.add.text(width - 200, height - 100, '', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Circular cooldown indicator for ability 1
        const ability1Cooldown = this.scene.add.graphics();
        ability1Cooldown.setPosition(width - 200, height - 80);
        
        // Ability 2 (Ultimate)
        const ability2Bg = this.scene.add.rectangle(width - 120, height - 80, 60, 60, 0x000000, 0.7)
            .setStrokeStyle(2, 0x444444);
        
        const ability2Icon = this.scene.add.sprite(width - 120, height - 80, 'bullet')
            .setTint(0xff0000)
            .setScale(1.5);
        
        const ability2Key = this.scene.add.text(width - 120, height - 45, 'SPACE', {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        // Cooldown overlay
        const ability2Overlay = this.scene.add.rectangle(width - 120, height - 110, 60, 60, 0x000000, 0.7)
            .setOrigin(0.5, 0);
        
        // Timer text for ability 2
        const ability2Timer = this.scene.add.text(width - 120, height - 100, '', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Circular cooldown indicator for ability 2
        const ability2Cooldown = this.scene.add.graphics();
        ability2Cooldown.setPosition(width - 120, height - 80);
        
        // Store ability icons for cooldown updates
        this.abilityIcons = [
            { 
                bg: ability1Bg, 
                icon: ability1Icon, 
                key: ability1Key, 
                overlay: ability1Overlay,
                timer: ability1Timer,
                cooldownGraphic: ability1Cooldown,
                active: false 
            },
            { 
                bg: ability2Bg, 
                icon: ability2Icon, 
                key: ability2Key, 
                overlay: ability2Overlay,
                timer: ability2Timer,
                cooldownGraphic: ability2Cooldown,
                active: false 
            }
        ];
        
        // Add to UI container
        this.uiContainer.add(ability1Bg);
        this.uiContainer.add(ability1Icon);
        this.uiContainer.add(ability1Key);
        this.uiContainer.add(ability1Overlay);
        this.uiContainer.add(ability1Timer);
        this.uiContainer.add(ability1Cooldown);
        this.uiContainer.add(ability2Bg);
        this.uiContainer.add(ability2Icon);
        this.uiContainer.add(ability2Key);
        this.uiContainer.add(ability2Overlay);
        this.uiContainer.add(ability2Timer);
        this.uiContainer.add(ability2Cooldown);
    }

    createInventoryButton() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create inventory button
        const buttonBg = this.scene.add.rectangle(
            width - 40, 80, 60, 60, 0x000000, 0.7
        ).setStrokeStyle(2, 0xffffff);
        
        const buttonIcon = this.scene.add.text(
            width - 40, 80, 'INV', 
            { font: 'bold 20px Arial', fill: '#ffffff' }
        ).setOrigin(0.5);
        
        // Make button interactive
        buttonBg.setInteractive({ useHandCursor: true });
        
        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setStrokeStyle(3, 0xffff00);
            buttonIcon.setFill('#ffff00');
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setStrokeStyle(2, 0xffffff);
            buttonIcon.setFill('#ffffff');
        });
        
        // Click to toggle inventory
        buttonBg.on('pointerup', () => {
            this.toggleInventory();
        });
        
        // Store button reference
        this.inventoryButton = {
            bg: buttonBg,
            icon: buttonIcon
        };
        
        // Add to UI container
        this.uiContainer.add(buttonBg);
        this.uiContainer.add(buttonIcon);
    }

    toggleInventory() {
        if (this.inventoryOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    openInventory() {
        if (this.inventoryOpen) return;
        
        this.inventoryOpen = true;
        
        // Pause game while inventory is open
        this.scene.scene.pause();
        
        // Create inventory UI
        this.createInventoryUI();
    }

    closeInventory() {
        if (!this.inventoryOpen) return;
        
        this.inventoryOpen = false;
        
        // Clean up inventory UI elements
        if (this.inventoryContainer) {
            this.inventoryContainer.destroy();
            this.inventoryContainer = null;
        }
        
        // Resume game
        this.scene.scene.resume();
    }

    createInventoryUI() {
        const scene = this.scene;
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        // Create UI container
        this.inventoryContainer = scene.add.container(0, 0);
        this.inventoryContainer.setDepth(200);
        
        // Darken background
        const bg = scene.add.rectangle(
            0, 0, width, height, 0x000000, 0.8
        ).setOrigin(0, 0);
        this.inventoryContainer.add(bg);
        
        // Inventory panel
        const panel = scene.add.rectangle(
            width / 2, height / 2, width * 0.8, height * 0.8, 0x333333, 0.9
        ).setStrokeStyle(2, 0xffffff);
        this.inventoryContainer.add(panel);
        
        // Title
        const title = scene.add.text(
            width / 2, height * 0.15, 'INVENTORY', 
            { font: 'bold 36px Arial', fill: '#ffffff' }
        ).setOrigin(0.5);
        this.inventoryContainer.add(title);
        
        // Close button
        const closeBtn = scene.add.text(
            width * 0.85, height * 0.15, 'X',
            { font: 'bold 36px Arial', fill: '#ffffff' }
        ).setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerup', () => this.closeInventory());
        closeBtn.on('pointerover', () => closeBtn.setFill('#ff0000'));
        closeBtn.on('pointerout', () => closeBtn.setFill('#ffffff'));
        this.inventoryContainer.add(closeBtn);
        
        // Tab headers
        const tabY = height * 0.22;
        const passiveTab = scene.add.text(
            width * 0.35, tabY, 'PASSIVE UPGRADES',
            { font: 'bold 24px Arial', fill: '#ffffff' }
        ).setOrigin(0.5);
        passiveTab.setInteractive({ useHandCursor: true });
        
        const abilitiesTab = scene.add.text(
            width * 0.65, tabY, 'ABILITY UPGRADES',
            { font: 'bold 24px Arial', fill: '#cccccc' }
        ).setOrigin(0.5);
        abilitiesTab.setInteractive({ useHandCursor: true });
        
        this.inventoryContainer.add(passiveTab);
        this.inventoryContainer.add(abilitiesTab);
        
        // Create divider
        const divider = scene.add.rectangle(
            width / 2, tabY + 20, width * 0.7, 2, 0xffffff
        );
        this.inventoryContainer.add(divider);
        
        // Content area
        const contentArea = scene.add.container(0, 0);
        this.inventoryContainer.add(contentArea);
        
        // Initial display of passive upgrades
        this.displayPassiveUpgrades(contentArea);
        
        // Tab switching
        passiveTab.on('pointerup', () => {
            passiveTab.setFill('#ffffff');
            abilitiesTab.setFill('#cccccc');
            contentArea.removeAll(true);
            this.displayPassiveUpgrades(contentArea);
        });
        
        abilitiesTab.on('pointerup', () => {
            passiveTab.setFill('#cccccc');
            abilitiesTab.setFill('#ffffff');
            contentArea.removeAll(true);
            this.displayAbilityUpgrades(contentArea);
        });
    }

    displayPassiveUpgrades(container) {
        const scene = this.scene;
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        // Get passive upgrades from player upgrades
        if (!window.gameState || !window.gameState.playerUpgrades || 
            Object.keys(window.gameState.playerUpgrades).length === 0) {
            // No upgrades yet
            const emptyText = scene.add.text(
                width / 2, height / 2, 'No passive upgrades yet!',
                { font: '24px Arial', fill: '#aaaaaa' }
            ).setOrigin(0.5);
            container.add(emptyText);
            return;
        }
        
        // Get passive upgrades (limited to 5)
        const passiveUpgrades = this.getPassiveUpgrades();
        
        if (passiveUpgrades.length === 0) {
            // No passive upgrades
            const emptyText = scene.add.text(
                width / 2, height / 2, 'No passive upgrades yet!',
                { font: '24px Arial', fill: '#aaaaaa' }
            ).setOrigin(0.5);
            container.add(emptyText);
            return;
        }
        
        // Display upgrades in a grid
        const startY = height * 0.3;
        const startX = width * 0.25;
        const itemWidth = width * 0.2;
        const itemHeight = height * 0.15;
        const itemsPerRow = 3;
        const spacing = 20;
        
        passiveUpgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            const x = startX + col * (itemWidth + spacing);
            const y = startY + row * (itemHeight + spacing);
            
            // Upgrade card background
            const card = scene.add.rectangle(
                x, y, itemWidth, itemHeight, 0x222222, 0.8
            ).setStrokeStyle(2, 0x00ffff);
            
            // Upgrade name
            const nameText = scene.add.text(
                x, y - itemHeight * 0.25, upgrade.name,
                { font: 'bold 18px Arial', fill: '#00ffff', align: 'center' }
            ).setOrigin(0.5);
            
            // Upgrade level
            const levelText = scene.add.text(
                x, y, `Level: ${upgrade.level}/${upgrade.maxLevel || 5}`,
                { font: '16px Arial', fill: '#ffffff' }
            ).setOrigin(0.5);
            
            // Description
            const desc = this.formatDescription(upgrade);
            const descText = scene.add.text(
                x, y + itemHeight * 0.25, desc,
                { font: '14px Arial', fill: '#aaaaaa', align: 'center', wordWrap: { width: itemWidth - 20 } }
            ).setOrigin(0.5);
            
            container.add(card);
            container.add(nameText);
            container.add(levelText);
            container.add(descText);
        });
    }

    displayAbilityUpgrades(container) {
        const scene = this.scene;
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        // Get ability upgrades from player upgrades
        if (!window.gameState || !window.gameState.activeAbilities || 
            window.gameState.activeAbilities.length === 0) {
            // No upgrades yet
            const emptyText = scene.add.text(
                width / 2, height / 2, 'No ability upgrades yet!',
                { font: '24px Arial', fill: '#aaaaaa' }
            ).setOrigin(0.5);
            container.add(emptyText);
            return;
        }
        
        // Get ability upgrades (limited to 5)
        const abilityUpgrades = this.getAbilityUpgrades();
        
        if (abilityUpgrades.length === 0) {
            // No ability upgrades
            const emptyText = scene.add.text(
                width / 2, height / 2, 'No ability upgrades yet!',
                { font: '24px Arial', fill: '#aaaaaa' }
            ).setOrigin(0.5);
            container.add(emptyText);
            return;
        }
        
        // Display ability upgrades in a list
        const startY = height * 0.3;
        const centerX = width / 2;
        const itemHeight = height * 0.15;
        const itemWidth = width * 0.7;
        const spacing = 20;
        
        abilityUpgrades.forEach((ability, index) => {
            const y = startY + index * (itemHeight + spacing);
            
            // Ability card background
            const card = scene.add.rectangle(
                centerX, y, itemWidth, itemHeight, 0x222222, 0.8
            ).setStrokeStyle(2, 0xffff00);
            
            // Ability name
            const nameText = scene.add.text(
                centerX - itemWidth * 0.4, y - itemHeight * 0.25, ability.name,
                { font: 'bold 22px Arial', fill: '#ffff00' }
            ).setOrigin(0, 0.5);
            
            // Ability level if available
            const levelText = scene.add.text(
                centerX + itemWidth * 0.4, y - itemHeight * 0.25, `Level: ${ability.level || 1}/${ability.maxLevel || 5}`,
                { font: '18px Arial', fill: '#ffffff' }
            ).setOrigin(1, 0.5);
            
            // Description
            const descText = scene.add.text(
                centerX - itemWidth * 0.4, y + itemHeight * 0.1, ability.description || "No description available",
                { font: '16px Arial', fill: '#aaaaaa', wordWrap: { width: itemWidth * 0.7 } }
            ).setOrigin(0, 0.5);
            
            container.add(card);
            container.add(nameText);
            container.add(levelText);
            container.add(descText);
        });
    }

    getPassiveUpgrades() {
        // Get passive upgrades from game state, limited to 5
        const passiveUpgrades = [];
        
        if (window.gameState && window.gameState.stats) {
            // Extract passive upgrades from stats
            Object.entries(window.gameState.stats).forEach(([key, stat]) => {
                if (stat.level > 0) {
                    passiveUpgrades.push({
                        id: key,
                        name: this.getStatDisplayName(key),
                        level: stat.level,
                        maxLevel: stat.maxLevel || 5,
                        description: this.getStatDescription(key, stat),
                        baseValue: stat.increment
                    });
                }
            });
        }
        
        // Sort by level (highest first) and limit to 5
        return passiveUpgrades
            .sort((a, b) => b.level - a.level)
            .slice(0, 5);
    }

    getAbilityUpgrades() {
        // Get ability upgrades from game state, limited to 5
        const abilityUpgrades = [];
        
        if (window.gameState && window.gameState.activeAbilities) {
            // Count abilities by name to track levels
            const abilityCounts = {};
            window.gameState.activeAbilities.forEach(ability => {
                if (ability.type === 'active') {
                    abilityCounts[ability.name] = (abilityCounts[ability.name] || 0) + 1;
                    
                    // Only add each unique ability once
                    const existingIndex = abilityUpgrades.findIndex(a => a.name === ability.name);
                    if (existingIndex === -1) {
                        abilityUpgrades.push({
                            name: ability.name,
                            level: abilityCounts[ability.name],
                            maxLevel: 5,
                            description: this.getAbilityDescription(ability.name),
                            type: 'active'
                        });
                    } else {
                        // Update level of existing ability
                        abilityUpgrades[existingIndex].level = abilityCounts[ability.name];
                    }
                }
            });
        }
        
        // Sort by level (highest first) and limit to 5
        return abilityUpgrades
            .sort((a, b) => b.level - a.level)
            .slice(0, 5);
    }

    getStatDisplayName(statKey) {
        const displayNames = {
            damage: "Damage",
            armor: "Armor",
            maxHealth: "Max Health",
            healthRegen: "Health Regeneration",
            moveSpeed: "Movement Speed",
            pickupRadius: "Pickup Radius",
            areaSize: "Area Size",
            duration: "Duration",
            critChance: "Critical Chance",
            critDamage: "Critical Damage",
            abilityHaste: "Ability Haste",
            experienceGain: "Experience Gain",
            projectileCount: "Projectile Count",
            goldMultiplier: "Gold Multiplier",
            tren: "Tren (Combined)"
        };
        
        return displayNames[statKey] || statKey;
    }

    getStatDescription(statKey, stat) {
        const baseDescriptions = {
            damage: `+${Math.round(stat.increment * 100)}% damage per level`,
            armor: `+${stat.increment} armor per level`,
            maxHealth: `+${stat.increment} maximum health per level`,
            healthRegen: `+${stat.increment} health per second per level`,
            moveSpeed: `+${Math.round(stat.increment * 100)}% movement speed per level`,
            pickupRadius: `+${Math.round(stat.increment * 100)}% pickup radius per level`,
            areaSize: `+${Math.round(stat.increment * 100)}% area size per level`,
            duration: `+${Math.round(stat.increment * 100)}% effect duration per level`,
            critChance: `+${Math.round(stat.increment * 100)}% critical chance per level`,
            critDamage: `+${Math.round(stat.increment * 100)}% critical damage per level`,
            abilityHaste: `+${stat.increment} ability haste per level`,
            experienceGain: `+${Math.round(stat.increment * 100)}% experience gain per level`,
            projectileCount: `+${stat.increment} projectile per level`,
            goldMultiplier: `+${Math.round(stat.increment * 100)}% gold gain per level`,
            tren: "Combined bonus to multiple stats"
        };
        
        return baseDescriptions[statKey] || "Enhances your character";
    }

    getAbilityDescription(abilityName) {
        const descriptions = {
            "Explosive Mines": "Deploy mines that detonate for heavy area damage",
            "Bouncing Explosive": "Launch explosives bouncing between enemies causing successive damage",
            "Cone Projectile Barrage": "Fire projectiles in a cone, with critical hits piercing enemies",
            "Returning Blade": "Throw blades that damage enemies and return to you",
            "Orbital Laser Strikes": "Randomly target enemies from above with damaging lasers",
            "Spinning Projectiles": "Summon spinning orbs around you, knocking back foes",
            "Ricocheting Blades": "Shoot projectiles bouncing off walls, gaining increased damage per bounce",
            "Summoned Train": "Summon a destructive train barreling through enemies, leaving explosions",
            "Cone of Continuous Fire": "Emit ongoing fire damage in a forward cone area",
            "Freezing Shield": "Form a shield freezing nearby enemies, scaled with armor and max health",
            "Crescent Projectiles": "Launch crescent-shaped energy waves slicing through enemies",
            "Poison Trail": "Leave a trail of toxic gas damaging pursuing enemies",
            "Damaging Aura": "Generate a damaging aura continuously harming nearby foes",
            "Burning Projectiles": "Fire flaming shots that leave burning patches on the ground",
            "Chaining Lightning": "Cast lightning bolts chaining between multiple targets",
            "Mechanical Guardian": "Deploy a mechanical ally attacking and damaging enemies",
            "Massive Orbital Strike": "Call down devastating strikes instantly eliminating standard foes",
            "Laser Barrage": "Continuously fire targeted lasers for sustained single-target damage",
            "Rotating Projectile Stream": "Emit a continuous rotating stream of projectiles around you",
            "Support Drone": "Release a drone damaging enemies and automatically collecting XP"
        };
        
        return descriptions[abilityName] || "Special ability that enhances your character";
    }

    formatDescription(upgrade) {
        if (!upgrade.description) return '';
        
        // For passive stats, show current value based on level
        if (upgrade.level > 1 && upgrade.baseValue) {
            // Extract numeric values from description if possible
            const matches = upgrade.description.match(/\+(\d+)([%]?)/);
            if (matches) {
                const baseValue = parseInt(matches[1]);
                const isPercent = matches[2] === '%';
                const currentValue = Math.round(baseValue * upgrade.level);
                
                return upgrade.description.replace(
                    /\+(\d+)([%]?)/,
                    `+${currentValue}${isPercent ? '%' : ''}`
                );
            }
        }
        
        return upgrade.description;
    }

    updateHealth(currentHealth, maxHealth) {
        // Update health bar
        const healthPercent = currentHealth / maxHealth;
        this.healthBar.width = 290 * healthPercent;
        
        // Update health text
        this.healthText.setText(`${Math.ceil(currentHealth)}/${Math.ceil(maxHealth)}`);
        
        // Change color based on health
        if (healthPercent < 0.3) {
            this.healthBar.fillColor = 0xff0000; // Red
        } else if (healthPercent < 0.6) {
            this.healthBar.fillColor = 0xffff00; // Yellow
        } else {
            this.healthBar.fillColor = 0x00ff00; // Green
        }
    }

    updateXP() {
        const xpPercent = window.gameState.playerXP / window.gameState.xpToNextLevel;
        const width = this.scene.cameras.main.width;
        
        // Update XP bar
        this.xpBar.width = width * xpPercent;
        
        // Update XP text
        this.xpText.setText(`${Math.floor(window.gameState.playerXP)}/${window.gameState.xpToNextLevel} XP`);
        
        // Update level text
        this.levelText.setText(`Level ${window.gameState.playerLevel}`);
    }

    updateWave(wave) {
        this.waveText.setText(`Wave: ${wave}`);
    }

    updateTimer(elapsedTime) {
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);
        
        // Format time as MM:SS
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(`Time: ${formattedTime}`);
    }

    updateAbilityCooldowns(stealth, ultimate, stealthActive, ultimateActive) {
        // Update stealth ability (index 0)
        const stealthAbility = this.scene.player.stealthAbility;
        const stealthCooldownPct = stealthAbility.cooldownTimer / stealthAbility.cooldown;
        const stealthTimerPct = stealthAbility.timer / stealthAbility.duration;
        
        // Update ultimate ability (index 1)
        const ultimateAbility = this.scene.player.katanaUltimate;
        const ultimateCooldownPct = ultimateAbility.cooldownTimer / ultimateAbility.cooldown;
        const ultimateTimerPct = ultimateAbility.timer / ultimateAbility.duration;
        
        // Update UI for stealth ability
        this.updateAbilityUI(0, stealthActive, stealthCooldownPct, stealthTimerPct, stealthAbility);
        
        // Update UI for ultimate ability
        this.updateAbilityUI(1, ultimateActive, ultimateCooldownPct, ultimateTimerPct, ultimateAbility);
    }

    updateAbilityUI(index, isActive, cooldownPct, timerPct, abilityData) {
        const ability = this.abilityIcons[index];
        ability.active = isActive;
        
        // Reset graphics
        ability.cooldownGraphic.clear();
        
        if (isActive) {
            // Ability is active - show timer
            const timerSeconds = Math.ceil(abilityData.timer);
            ability.timer.setText(timerSeconds.toString());
            ability.timer.setFill('#00ff00');
            
            // Update border to show active state
            ability.bg.setStrokeStyle(3, index === 0 ? 0x00ff00 : 0xff0000);
            
            // Draw timer arc (countdown) - from full to empty
            ability.cooldownGraphic.lineStyle(4, index === 0 ? 0x00ff00 : 0xff0000, 1);
            ability.cooldownGraphic.beginPath();
            
            // Draw arc from top (270 degrees) clockwise, proportion based on remaining time
            const startAngle = Phaser.Math.DegToRad(270);
            const endAngle = startAngle + Phaser.Math.DegToRad(360 * timerPct);
            ability.cooldownGraphic.arc(0, 0, 35, startAngle, endAngle, false);
            ability.cooldownGraphic.strokePath();
            
            // Set overlay to be transparent
            ability.overlay.alpha = 0;
        } else if (cooldownPct > 0) {
            // On cooldown - show cooldown
            const cooldownSeconds = Math.ceil(abilityData.cooldownTimer);
            ability.timer.setText(cooldownSeconds.toString());
            ability.timer.setFill('#ff6666');
            
            // Update border to show cooldown state
            ability.bg.setStrokeStyle(2, 0x444444);
            
            // Draw cooldown arc (filling up) - from empty to full
            ability.cooldownGraphic.lineStyle(4, 0x888888, 1);
            ability.cooldownGraphic.beginPath();
            
            // Draw arc from top (270 degrees) clockwise, proportion based on cooldown progress
            const startAngle = Phaser.Math.DegToRad(270);
            const endAngle = startAngle + Phaser.Math.DegToRad(360 * (1 - cooldownPct));
            ability.cooldownGraphic.arc(0, 0, 35, startAngle, endAngle, false);
            ability.cooldownGraphic.strokePath();
            
            // Set overlay opacity based on cooldown
            ability.overlay.alpha = cooldownPct;
        } else {
            // Ready to use
            ability.timer.setText('Ready');
            ability.timer.setFill('#ffffff');
            
            // Update border to show ready state
            ability.bg.setStrokeStyle(2, 0x888888);
            
            // Draw full circle to indicate ready
            ability.cooldownGraphic.lineStyle(4, 0x888888, 0.5);
            ability.cooldownGraphic.beginPath();
            ability.cooldownGraphic.arc(0, 0, 35, 0, Phaser.Math.DegToRad(360), false);
            ability.cooldownGraphic.strokePath();
            
            // Set overlay to be transparent
            ability.overlay.alpha = 0;
        }
    }

    updateActiveAbilities(abilities) {
        // Clear existing active ability icons
        if (this.activeAbilities.length > 0) {
            for (const abilityUI of this.activeAbilities) {
                abilityUI.bg.destroy();
                abilityUI.icon.destroy();
                abilityUI.overlay.destroy();
            }
        }
        
        this.activeAbilities = [];
        
        // Add new active ability icons
        if (!abilities || abilities.length === 0) return;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        abilities.forEach((ability, index) => {
            // Calculate position
            const x = width - 280 - (index * 70);
            const y = height - 80;
            
            // Create ability UI elements
            const bg = this.scene.add.rectangle(x, y, 60, 60, 0x000000, 0.7)
                .setStrokeStyle(2, 0x444444);
            
            const icon = this.scene.add.sprite(x, y, 'bullet')
                .setTint(0xffff00)
                .setScale(1.5);
            
            // Cooldown overlay
            const overlay = this.scene.add.rectangle(x, y, 60, 60, 0x000000, 0.7)
                .setOrigin(0.5, 0.5);
            
            // Store ability UI reference
            this.activeAbilities.push({ 
                ability, 
                bg, 
                icon, 
                overlay,
                x, 
                y 
            });
            
            // Add to UI container
            this.uiContainer.add(bg);
            this.uiContainer.add(icon);
            this.uiContainer.add(overlay);
        });
    }

    updateActiveAbilityCooldowns(deltaTime) {
        // Update active ability cooldowns
        const player = this.scene.player;
        if (!player.activeAbilities) return;
        
        player.activeAbilities.forEach((ability, index) => {
            if (ability.currentCooldown > 0) {
                ability.currentCooldown -= deltaTime;
                
                // Update UI
                if (index < this.activeAbilities.length) {
                    const percent = ability.currentCooldown / ability.cooldown;
                    this.activeAbilities[index].overlay.alpha = percent;
                }
            } else {
                // Reset cooldown overlay
                if (index < this.activeAbilities.length) {
                    this.activeAbilities[index].overlay.alpha = 0;
                }
            }
        });
    }

    showDamageText(x, y, amount, isCritical) {
        // Create damage text that floats up and fades out
        const damageText = this.scene.add.text(x, y, `${Math.ceil(amount)}`, {
            font: `bold ${isCritical ? 24 : 16}px Arial`,
            fill: isCritical ? '#ff0000' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);
        
        // Add bounce effect for critical hits
        if (isCritical) {
            this.scene.tweens.add({
                targets: damageText,
                scale: { from: 1, to: 1.5 },
                duration: 100,
                yoyo: true
            });
        }
        
        // Animation to float upwards and fade out
        this.scene.tweens.add({
            targets: damageText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    showPickupText(x, y, text, color) {
        // Create pickup text that floats up and fades out
        const pickupText = this.scene.add.text(x, y, text, {
            font: 'bold 16px Arial',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);
        
        // Animation to float upwards and fade out
        this.scene.tweens.add({
            targets: pickupText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                pickupText.destroy();
            }
        });
    }

    updateHealthRealTime() {
        // Get current player health and max health
        if (this.scene.player) {
            const currentHealth = this.scene.player.health;
            const maxHealth = this.scene.player.maxHealth;
            this.updateHealth(currentHealth, maxHealth);
        }
    }
} 