import Phaser from 'phaser';

export class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
        this.statButtons = [];
        this.scrollPosition = 0;
        this.scrollView = null;
        this.maxScrollPosition = 0;
        this.debugMode = true; // Enable debug features
    }

    create() {
        console.log('UpgradeScene create method started');
        
        // Check if game state is initialized
        if (!window.gameState) {
            console.error("Game state not initialized!");
            window.gameState = {
                gold: 5000,
                stats: {}
            };
        }
        
        // Ensure stats are properly initialized
        this.initializeDefaultStats();
        
        // Background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
        
        // Title
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            50,
            'UPGRADES',
            {
                font: 'bold 48px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Gold display
        this.goldText = this.add.text(
            this.cameras.main.width / 2,
            100,
            `Available Gold: ${window.gameState.gold}`,
            {
                font: '28px Arial',
                fill: '#ffff00'
            }
        ).setOrigin(0.5);
        
        // Create scrollable container for upgrades
        this.createUpgradeList();
    }

    // Initialize default stats if they don't exist
    initializeDefaultStats() {
        if (!window.gameState.stats) {
            window.gameState.stats = {};
        }
        
        // Default stats configuration
        const defaultStats = [
            { key: "damage", displayName: "Attack Damage", description: "Increases damage dealt to enemies", baseCost: 100, maxLevel: 5, increment: 0.1, value: 1 },
            { key: "armor", displayName: "Defense", description: "Reduces damage taken from enemies", baseCost: 100, maxLevel: 5, increment: 8, value: 0 },
            { key: "maxHealth", displayName: "Maximum Health", description: "Increases your maximum health", baseCost: 100, maxLevel: 5, increment: 150, value: 1000 },
            { key: "healthRegen", displayName: "Health Regeneration", description: "Regenerate health over time", baseCost: 200, maxLevel: 5, increment: 4, value: 0 },
            { key: "moveSpeed", displayName: "Movement Speed", description: "Move faster", baseCost: 150, maxLevel: 5, increment: 0.09, value: 1 },
            { key: "pickupRadius", displayName: "Pickup Radius", description: "Collect items from further away", baseCost: 150, maxLevel: 5, increment: 0.35, value: 1 }
        ];
        
        // Initialize each stat if it doesn't exist
        for (const stat of defaultStats) {
            if (!window.gameState.stats[stat.key]) {
                window.gameState.stats[stat.key] = {
                    level: 0,
                    value: stat.value,
                    maxLevel: stat.maxLevel,
                    baseCost: stat.baseCost,
                    increment: stat.increment,
                    displayName: stat.displayName,
                    description: stat.description
                };
            }
        }
        
        console.log('Stats initialized:', Object.keys(window.gameState.stats));
    }

    createUpgradeList() {
        console.log('Creating upgrade list...');
        console.log('Available stats:', Object.keys(window.gameState.stats));
        
        // Basic panel with border for visibility
        const panelBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            700,
            500,
            0x0a0a2a,
            0.95
        ).setOrigin(0.5);
        
        // Header
        const headerBar = this.add.rectangle(
            this.cameras.main.width / 2,
            150,
            650,
            40,
            0x3039a0,
            0.9
        ).setOrigin(0.5);
        
        this.add.text(
            this.cameras.main.width / 2,
            150,
            'CHARACTER UPGRADES',
            {
                font: 'bold 24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Gold display
        const goldIcon = this.add.rectangle(
            120,
            100,
            24,
            24,
            0xffcc00
        ).setOrigin(0.5);
        
        this.goldText = this.add.text(
            150,
            100,
            `Gold: ${window.gameState.gold}`,
            {
                font: 'bold 24px Arial',
                fill: '#ffcc00',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(0, 0.5);
        
        // Back button
        const backButton = this.add.rectangle(
            120,
            50,
            170,
            40,
            0x3039a0,
            0.9
        ).setOrigin(0.5);
        
        const backText = this.add.text(
            120,
            50,
            '← BACK',
            {
                font: 'bold 18px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerup', () => {
            this.scene.start('MenuScene');
        });
        
        // Starting position for the first button
        let y = 200;
        let buttonCount = 0;
        
        // Store button positions separately instead of on the stat objects
        this.buttonPositions = {};
        
        // List of upgradable stat keys (to filter out tracking stats)
        const upgradableStats = [
            'damage', 'armor', 'maxHealth', 'healthRegen', 
            'moveSpeed', 'pickupRadius'
        ];
        
        // Create a button for each upgradable stat
        for (const key of upgradableStats) {
            // Skip if this stat doesn't exist in the game state
            if (!window.gameState.stats[key]) continue;
            
            const stat = window.gameState.stats[key];
            
            // Ensure the stat is an object with the required properties
            if (typeof stat !== 'object' || stat === null || 
                typeof stat.level === 'undefined' || 
                typeof stat.maxLevel === 'undefined' || 
                typeof stat.baseCost === 'undefined') {
                console.error(`Stat ${key} is missing required properties:`, stat);
                continue;
            }
            
            console.log(`Creating button for ${key}:`, stat);
            
            // Calculate cost based on level
            const cost = stat.baseCost + (stat.level * 50);
            
            // Create button background
            const buttonColor = window.gameState.gold >= cost ? 0x3039a0 : 0x222233;
            const button = this.add.rectangle(
                this.cameras.main.width / 2,
                y,
                600,
                70,
                buttonColor,
                0.9
            ).setOrigin(0.5);
            
            // Stat name
            const nameText = this.add.text(
                this.cameras.main.width / 2 - 280,
                y - 15,
                stat.displayName || key,
                {
                    font: 'bold 20px Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0, 0.5);
            
            // Stat description
            const descText = this.add.text(
                this.cameras.main.width / 2 - 280,
                y + 15,
                stat.description || 'Upgrades this stat',
                {
                    font: '16px Arial',
                    fill: '#aaccff'
                }
            ).setOrigin(0, 0.5);
            
            // Level display
            const levelText = this.add.text(
                this.cameras.main.width / 2 + 180,
                y - 15,
                `Level ${stat.level}/${stat.maxLevel}`,
                {
                    font: '18px Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5);
            
            // Cost display
            const costText = this.add.text(
                this.cameras.main.width / 2 + 180,
                y + 15,
                stat.level >= stat.maxLevel ? 'MAXED' : `Cost: ${cost} Gold`,
                {
                    font: '18px Arial',
                    fill: window.gameState.gold >= cost ? '#ffff00' : '#ff6666'
                }
            ).setOrigin(0.5);
            
            // Make the button interactive if not maxed
            if (stat.level < stat.maxLevel) {
                button.setInteractive({ useHandCursor: true });
                
                button.on('pointerover', () => {
                    button.setFillStyle(0x4048c0);
                });
                
                button.on('pointerout', () => {
                    button.setFillStyle(buttonColor);
                });
                
                // Store the statKey in a closure to use in the pointerdown event
                const statKey = key;
                
                button.on('pointerdown', () => {
                    if (window.gameState.gold >= cost) {
                        // Upgrade the stat
                        window.gameState.gold -= cost;
                        stat.level += 1;
                        stat.value += stat.increment;
                        
                        // Update UI
                        levelText.setText(`Level ${stat.level}/${stat.maxLevel}`);
                        const newCost = stat.baseCost + (stat.level * 50);
                        costText.setText(stat.level >= stat.maxLevel ? 'MAXED' : `Cost: ${newCost} Gold`);
                        costText.setFill(window.gameState.gold >= newCost ? '#ffff00' : '#ff6666');
                        this.goldText.setText(`Gold: ${window.gameState.gold}`);
                        
                        // Disable if maxed
                        if (stat.level >= stat.maxLevel) {
                            button.disableInteractive();
                            button.setFillStyle(0x222233);
                            costText.setText('MAXED');
                            costText.setFill('#00ff00');
                        }
                        
                        // Visual effect
                        this.showUpgradeEffect(button.x, button.y);
                        
                        // Save game state
                        this.saveGameState();
                    } else {
                        // Can't afford
                        this.cameras.main.shake(200, 0.01);
                    }
                });
            } else {
                // Already maxed
                button.setFillStyle(0x222233);
                costText.setText('MAXED');
                costText.setFill('#00ff00');
            }
            
            // Store button positions in a separate object
            this.buttonPositions[key] = { x: button.x, y: button.y };
            
            // Move down for next button
            y += 85;
            buttonCount++;
        }
        
        console.log(`Created ${buttonCount} upgrade buttons`);
    }

    // Format stat display names more clearly
    getDisplayName(key) {
        const displayNames = {
            damage: 'Attack Damage',
            armor: 'Defense',
            maxHealth: 'Maximum Health',
            healthRegen: 'Health Regeneration',
            moveSpeed: 'Movement Speed',
            pickupRadius: 'Collection Range'
        };
        return displayNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    // Format stat values appropriately
    formatStatValue(key, value) {
        if (key === 'critChance' || key === 'goldMultiplier' || key === 'experienceGain') {
            return `${(value * 100).toFixed(0)}%`;
        } else if (key === 'critDamage') {
            return `${value.toFixed(1)}x`;
        } else if (key === 'moveSpeed' || key === 'healthRegen' || key === 'pickupRadius') {
            return value.toFixed(1);
        } else {
            return value.toFixed(0);
        }
    }

    showUpgradeEffect(x, y) {
        try {
            // Add visual feedback with flash
            this.cameras.main.flash(200, 255, 255, 255, 0.3);
            
            // Add scale animation to gold text
            this.tweens.add({
                targets: this.goldText,
                scale: 1.3,
                duration: 200,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        } catch (error) {
            console.error('Error showing upgrade effect:', error);
        }
    }

    saveGameState() {
        // Save game state
        try {
            if (window.gameStateManager) {
                window.gameStateManager.saveState();
            } else if (localStorage) {
                localStorage.setItem('swarmGameState', JSON.stringify(window.gameState));
            }
        } catch (e) {
            console.warn('Failed to save game state:', e);
        }
    }

    upgradeStatByKey(statKey) {
        const stats = window.gameState.stats;
        const statData = stats[statKey];
        
        // Check if upgrade is possible
        if (!statData || statData.level >= statData.maxLevel) {
            return false;
        }
        
        const cost = statData.baseCost + (statData.level * 50);
        if (window.gameState.gold < cost) {
            return false;
        }
        
        // Spend gold
        window.gameState.gold -= cost;
        
        // Increment stat level
        statData.level += 1;
        statData.value += statData.increment;
        
        // Save game state
        this.saveGameState();
        
        // Show upgrade effect animation
        if (this.buttonPositions && this.buttonPositions[statKey]) {
            const pos = this.buttonPositions[statKey];
            this.showUpgradeEffect(pos.x, pos.y);
        }
        
        return true;
    }
} 