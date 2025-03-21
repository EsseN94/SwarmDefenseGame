export class GameStateManager {
    constructor() {
        // Initialize game state
        window.gameState = {
            // Player stats
            playerLevel: 1,
            playerXP: 0,
            xpToNextLevel: 100,
            gold: 0,
            
            // Game progression
            highestWaveReached: 0,
            highestWave: 0, // For backward compatibility
            totalEnemiesKilled: 0,
            totalPlayTime: 0,
            
            // Stats configuration for gameplay
            stats: {
                damage: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                armor: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 8 },
                maxHealth: { level: 0, value: 1000, maxLevel: 5, cost: 500, increment: 150 },
                healthRegen: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 4 },
                moveSpeed: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.09 },
                pickupRadius: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.35 },
                areaSize: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.11 },
                duration: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.12 },
                critChance: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 0.08 },
                critDamage: { level: 0, value: 1.5, maxLevel: 5, cost: 500, increment: 0.2 },
                abilityHaste: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 10 },
                experienceGain: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                projectileCount: { level: 0, value: 1, maxLevel: 3, cost: 750, increment: 1, oddLevelsOnly: true },
                goldMultiplier: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                chronoCataclysmDuration: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.12 },
                tren: { 
                    level: 0, 
                    value: 1, 
                    maxLevel: 5, 
                    cost: 750, 
                    increment: 0.05,
                    description: "Combined bonus (Ability Haste +5, Damage +5%, Movement Speed +5%, Pickup Radius +15%)"
                },
                
                // Stats tracking
                totalGoldEarned: 0,
                totalXPEarned: 0,
                highestKillStreak: 0,
                fastestWaveClear: {},
                totalDeaths: 0,
                gamesPlayed: 0
            },
            
            // Permanent upgrades
            permanentUpgrades: {
                maxHealth: 0,
                damage: 0,
                speed: 0,
                armor: 0,
                critChance: 0,
                critDamage: 0,
                xpGain: 0,
                goldGain: 0,
                healthRegeneration: 0,
                projectileSpeed: 0,
                projectileSize: 0,
                projectilePiercing: 0
            },
            
            // Settings
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.5,
                showDamageNumbers: true,
                highPerformanceMode: false
            },
            
            // Unlocked abilities
            unlockedAbilities: [],
            activeAbilities: []
        };
        
        this.loadState();
    }
    
    loadState() {
        try {
            const savedState = localStorage.getItem('swarmGameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Merge saved state with default state
                window.gameState = {
                    ...window.gameState,
                    ...parsedState
                };
                
                console.log('Game state loaded successfully');
            } else {
                console.log('No saved game state found, using defaults');
                this.saveState(); // Initialize with defaults
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            // Continue with default state
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('swarmGameState', JSON.stringify(window.gameState));
            console.log('Game state saved successfully');
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }
    
    resetGameState() {
        // Reset only in-game state, preserve permanent upgrades and stats
        window.gameState.playerLevel = 1;
        window.gameState.playerXP = 0;
        window.gameState.xpToNextLevel = 100;
        
        // Save the reset state
        this.saveState();
    }
    
    calculateXPToNextLevel(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }
    
    addXP(amount) {
        const xpMultiplier = 1 + (window.gameState.permanentUpgrades.xpGain * 0.05);
        const adjustedAmount = amount * xpMultiplier;
        
        window.gameState.playerXP += adjustedAmount;
        window.gameState.stats.totalXPEarned += adjustedAmount;
        
        // Check for level up
        while (window.gameState.playerXP >= window.gameState.xpToNextLevel) {
            this.levelUp();
        }
        
        // Save state after significant XP gain
        if (amount > 50) {
            this.saveState();
        }
        
        return adjustedAmount;
    }
    
    levelUp() {
        window.gameState.playerXP -= window.gameState.xpToNextLevel;
        window.gameState.playerLevel++;
        window.gameState.xpToNextLevel = this.calculateXPToNextLevel(window.gameState.playerLevel);
        
        console.log(`Leveled up to ${window.gameState.playerLevel}!`);
        
        // Save state on level up
        this.saveState();
        
        return window.gameState.playerLevel;
    }
    
    addGold(amount) {
        const goldMultiplier = 1 + (window.gameState.permanentUpgrades.goldGain * 0.05);
        const adjustedAmount = Math.round(amount * goldMultiplier);
        
        window.gameState.gold += adjustedAmount;
        window.gameState.stats.totalGoldEarned += adjustedAmount;
        
        // Save state after significant gold gain
        if (amount > 100) {
            this.saveState();
        }
        
        return adjustedAmount;
    }
    
    spendGold(amount) {
        if (window.gameState.gold >= amount) {
            window.gameState.gold -= amount;
            this.saveState();
            return true;
        }
        return false;
    }
    
    upgradePermanentStat(stat, amount = 1) {
        if (!window.gameState.permanentUpgrades.hasOwnProperty(stat)) {
            console.error(`Invalid stat: ${stat}`);
            return false;
        }
        
        // Calculate the cost
        const currentLevel = window.gameState.permanentUpgrades[stat];
        const cost = this.calculateUpgradeCost(stat, currentLevel);
        
        if (this.spendGold(cost)) {
            window.gameState.permanentUpgrades[stat] += amount;
            this.saveState();
            return true;
        }
        
        return false;
    }
    
    calculateUpgradeCost(stat, level) {
        const baseCost = {
            maxHealth: 100,
            damage: 150,
            speed: 120,
            armor: 200,
            critChance: 180,
            critDamage: 200,
            xpGain: 250,
            goldGain: 300,
            healthRegeneration: 280,
            projectileSpeed: 150,
            projectileSize: 180,
            projectilePiercing: 350
        };
        
        return Math.floor(baseCost[stat] * Math.pow(1.15, level));
    }
    
    updateHighestWave(wave) {
        if (wave > window.gameState.highestWaveReached) {
            window.gameState.highestWaveReached = wave;
            this.saveState();
        }
    }
    
    addPlayTime(seconds) {
        window.gameState.totalPlayTime += seconds;
        // Save only periodically to avoid too frequent saves
        if (Math.floor(window.gameState.totalPlayTime / 60) !== Math.floor((window.gameState.totalPlayTime - seconds) / 60)) {
            this.saveState();
        }
    }
    
    registerKill() {
        window.gameState.totalEnemiesKilled++;
        // Save every 100 kills
        if (window.gameState.totalEnemiesKilled % 100 === 0) {
            this.saveState();
        }
    }
    
    updateSettings(newSettings) {
        window.gameState.settings = {
            ...window.gameState.settings,
            ...newSettings
        };
        this.saveState();
    }
    
    getUpgradeEffect(stat) {
        const level = window.gameState.permanentUpgrades[stat];
        
        const effects = {
            maxHealth: level * 10, // +10 health per level
            damage: level * 0.05, // +5% damage per level
            speed: level * 0.03, // +3% speed per level
            armor: level * 0.03, // +3% damage reduction per level
            critChance: level * 0.02, // +2% crit chance per level
            critDamage: level * 0.05, // +5% crit damage per level
            xpGain: level * 0.05, // +5% XP gain per level
            goldGain: level * 0.05, // +5% gold gain per level
            healthRegeneration: level * 0.2, // +0.2 health regen per level
            projectileSpeed: level * 0.05, // +5% projectile speed per level
            projectileSize: level * 0.05, // +5% projectile size per level
            projectilePiercing: level * 0.1 // +10% pierce chance per level
        };
        
        return effects[stat] || 0;
    }
    
    unlockAbility(abilityId) {
        if (!window.gameState.unlockedAbilities.includes(abilityId)) {
            window.gameState.unlockedAbilities.push(abilityId);
            this.saveState();
            return true;
        }
        return false;
    }
    
    registerDeath() {
        window.gameState.stats.totalDeaths++;
        this.saveState();
    }
    
    registerGamePlayed() {
        window.gameState.stats.gamesPlayed++;
        this.saveState();
    }
    
    clearSavedData() {
        localStorage.removeItem('swarmGameState');
        window.gameState = {
            // Player stats
            playerLevel: 1,
            playerXP: 0,
            xpToNextLevel: 100,
            gold: 0,
            
            // Game progression
            highestWaveReached: 0,
            highestWave: 0, // For backward compatibility
            totalEnemiesKilled: 0,
            totalPlayTime: 0,
            
            // Stats configuration for gameplay
            stats: {
                damage: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                armor: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 8 },
                maxHealth: { level: 0, value: 1000, maxLevel: 5, cost: 500, increment: 150 },
                healthRegen: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 4 },
                moveSpeed: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.09 },
                pickupRadius: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.35 },
                areaSize: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.11 },
                duration: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.12 },
                critChance: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 0.08 },
                critDamage: { level: 0, value: 1.5, maxLevel: 5, cost: 500, increment: 0.2 },
                abilityHaste: { level: 0, value: 0, maxLevel: 5, cost: 500, increment: 10 },
                experienceGain: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                projectileCount: { level: 0, value: 1, maxLevel: 3, cost: 750, increment: 1, oddLevelsOnly: true },
                goldMultiplier: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.1 },
                chronoCataclysmDuration: { level: 0, value: 1, maxLevel: 5, cost: 500, increment: 0.12 },
                tren: { 
                    level: 0, 
                    value: 1, 
                    maxLevel: 5, 
                    cost: 750, 
                    increment: 0.05,
                    description: "Combined bonus (Ability Haste +5, Damage +5%, Movement Speed +5%, Pickup Radius +15%)"
                },
                
                // Stats tracking
                totalGoldEarned: 0,
                totalXPEarned: 0,
                highestKillStreak: 0,
                fastestWaveClear: {},
                totalDeaths: 0,
                gamesPlayed: 0
            },
            
            // Permanent upgrades
            permanentUpgrades: {
                maxHealth: 0,
                damage: 0,
                speed: 0,
                armor: 0,
                critChance: 0,
                critDamage: 0,
                xpGain: 0,
                goldGain: 0,
                healthRegeneration: 0,
                projectileSpeed: 0,
                projectileSize: 0,
                projectilePiercing: 0
            },
            
            // Settings
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.5,
                showDamageNumbers: true,
                highPerformanceMode: false
            },
            
            // Unlocked abilities
            unlockedAbilities: [],
            activeAbilities: []
        };
        console.log('Game data reset to defaults');
    }
} 