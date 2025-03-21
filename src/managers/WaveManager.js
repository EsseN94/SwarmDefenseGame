export class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.spawnRate = 1; // seconds between spawns
        this.difficultyMultiplier = 1;
        this.waveInProgress = false;
        this.enemyTypes = ['chase'];
        this.specialEnemyChance = 0;
        
        // Enemy type unlocks by wave
        this.enemyTypeUnlocks = {
            3: 'flanker',
            5: 'ranged',
            7: 'swarm',
            10: 'bomber',
            15: 'shielded'
        };
    }

    update(deltaTime) {
        // Update spawn timer
        if (this.waveInProgress && this.enemiesSpawned < this.getWaveEnemyCount()) {
            this.spawnTimer -= deltaTime;
            
            if (this.spawnTimer <= 0) {
                this.spawnNextEnemy();
                this.spawnTimer = this.spawnRate;
            }
        }
        
        // Check if wave is complete
        this.checkWaveComplete();
        
        // Check if a minute has passed to start a new wave
        if (!this.waveInProgress) {
            this.scene.waveTime += deltaTime;
            if (this.scene.waveTime >= 60) {
                this.scene.waveTime = 0;
                this.startNextWave();
            }
        }
    }

    startNextWave() {
        // Increment wave number
        this.currentWave++;
        
        // Set wave parameters
        this.enemiesRemaining = this.getWaveEnemyCount();
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveInProgress = true;
        this.spawnTimer = 0.5; // Start first spawn after a short delay
        
        // Increase difficulty multiplier (health and damage)
        this.difficultyMultiplier = 1 + (this.currentWave - 1) * 0.2; // 20% increase per wave
        
        // Update special enemy chance
        this.specialEnemyChance = Math.min(0.6, this.currentWave * 0.05); // Up to 60% chance
        
        // Unlock new enemy types based on wave number
        this.unlockEnemyTypes();
        
        // Update UI
        this.scene.ui.updateWave(this.currentWave);
        
        console.log(`Wave ${this.currentWave} started with ${this.enemiesRemaining} enemies. Difficulty: ${this.difficultyMultiplier.toFixed(1)}x`);
    }

    unlockEnemyTypes() {
        // Check for new enemy type unlocks
        const wave = this.currentWave;
        
        Object.entries(this.enemyTypeUnlocks).forEach(([unlockWave, enemyType]) => {
            if (wave >= parseInt(unlockWave) && !this.enemyTypes.includes(enemyType)) {
                this.enemyTypes.push(enemyType);
                console.log(`New enemy type unlocked: ${enemyType}`);
            }
        });
    }

    getWaveEnemyCount() {
        // Calculate number of enemies for this wave
        // Start with 10 enemies on wave 1, then increase by 5 each wave
        return 10 + (this.currentWave - 1) * 5;
    }

    getRandomSpawnPosition() {
        const player = this.scene.player;
        const mapSize = this.scene.mapSize;
        const minDistance = 500; // Minimum spawn distance from player
        const maxDistance = 800; // Maximum spawn distance from player
        
        let x, y, distanceToPlayer;
        
        // Try to find a position within distance constraints
        do {
            x = Phaser.Math.Between(100, mapSize.width - 100);
            y = Phaser.Math.Between(100, mapSize.height - 100);
            
            const dx = player.x - x;
            const dy = player.y - y;
            distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        } while (distanceToPlayer < minDistance || distanceToPlayer > maxDistance);
        
        return { x, y };
    }

    getRandomEnemyType() {
        // Base enemies are more common
        if (Math.random() > this.specialEnemyChance) {
            return 'chase';
        }
        
        // Pick a random special enemy type from unlocked types
        const specialTypes = this.enemyTypes.filter(type => type !== 'chase');
        return specialTypes[Math.floor(Math.random() * specialTypes.length)];
    }

    spawnNextEnemy() {
        // Get spawn position
        const spawnPos = this.getRandomSpawnPosition();
        
        // Get enemy type
        const enemyType = this.getRandomEnemyType();
        
        // Calculate enemy stats based on wave difficulty
        const baseHealth = this.getEnemyBaseHealth(enemyType);
        const baseDamage = this.getEnemyBaseDamage(enemyType);
        const baseSpeed = this.getEnemyBaseSpeed(enemyType);
        
        const health = Math.floor(baseHealth * this.difficultyMultiplier);
        const damage = Math.floor(baseDamage * this.difficultyMultiplier);
        const speed = baseSpeed; // Speed doesn't scale with difficulty
        
        // Spawn enemy
        const enemy = this.scene.spawnEnemy(
            enemyType,
            spawnPos.x,
            spawnPos.y,
            health,
            damage,
            speed
        );
        
        // Update counters
        this.enemiesSpawned++;
        
        return enemy;
    }

    getEnemyBaseHealth(type) {
        // Base health values for different enemy types
        switch (type) {
            case 'chase': return 100;
            case 'flanker': return 80;
            case 'ranged': return 70;
            case 'swarm': return 60;
            case 'bomber': return 90;
            case 'shielded': return 150;
            default: return 100;
        }
    }

    getEnemyBaseDamage(type) {
        // Base damage values for different enemy types
        switch (type) {
            case 'chase': return 20;
            case 'flanker': return 15;
            case 'ranged': return 10;
            case 'swarm': return 10;
            case 'bomber': return 50; // High damage but self-destructs
            case 'shielded': return 25;
            default: return 20;
        }
    }

    getEnemyBaseSpeed(type) {
        // Base speed values for different enemy types
        switch (type) {
            case 'chase': return 100;
            case 'flanker': return 140;
            case 'ranged': return 80;
            case 'swarm': return 120;
            case 'bomber': return 130;
            case 'shielded': return 70;
            default: return 100;
        }
    }

    enemyKilled() {
        this.enemiesKilled++;
        this.enemiesRemaining--;
    }

    checkWaveComplete() {
        // Check if all enemies are killed
        if (this.waveInProgress && this.enemiesKilled >= this.getWaveEnemyCount()) {
            this.waveInProgress = false;
            
            // Update high score
            if (this.currentWave > window.gameState.highestWave) {
                window.gameState.highestWave = this.currentWave;
            }
            
            console.log(`Wave ${this.currentWave} complete!`);
        }
    }

    isWaveComplete() {
        // Return true if the wave is complete (all enemies killed and wave not in progress)
        return !this.waveInProgress && this.enemiesKilled >= this.getWaveEnemyCount() && this.currentWave > 0;
    }
    
    getCurrentWave() {
        return this.currentWave;
    }
    
    get maxWaves() {
        // Maximum number of waves in the game (can be adjusted)
        return 30;
    }

    resetWaves() {
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.difficultyMultiplier = 1;
        this.waveInProgress = false;
        this.enemyTypes = ['chase'];
        this.specialEnemyChance = 0;
    }
} 