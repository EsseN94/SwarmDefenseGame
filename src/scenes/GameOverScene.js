import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalWave = data.wave || 0;
        this.goldEarned = data.gold || 0;
    }

    create() {
        // Background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
        
        // Game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'GAME OVER',
            {
                font: 'bold 64px Arial',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Stats panel
        const statsPanel = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'panel'
        ).setDisplaySize(500, 250);
        
        // Display game stats
        const waveText = this.add.text(
            statsPanel.x,
            statsPanel.y - 80,
            `Final Wave: ${this.finalWave}`,
            {
                font: '28px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        const goldText = this.add.text(
            statsPanel.x,
            statsPanel.y - 30,
            `Gold Earned: ${this.goldEarned}`,
            {
                font: '28px Arial',
                fill: '#ffff00'
            }
        ).setOrigin(0.5);
        
        // Display total stats
        const totalGoldText = this.add.text(
            statsPanel.x,
            statsPanel.y + 20,
            `Total Gold: ${window.gameState.gold}`,
            {
                font: '28px Arial',
                fill: '#ffff00'
            }
        ).setOrigin(0.5);
        
        // Display highest wave
        const highestWaveText = this.add.text(
            statsPanel.x,
            statsPanel.y + 70,
            `Highest Wave: ${window.gameState.highestWave}`,
            {
                font: '28px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Play again button
        const playAgainButton = this.add.image(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height * 0.75,
            'button'
        ).setDisplaySize(250, 60);
        
        const playAgainText = this.add.text(
            playAgainButton.x,
            playAgainButton.y,
            'PLAY AGAIN',
            {
                font: 'bold 26px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Make button interactive
        playAgainButton.setInteractive({ useHandCursor: true });
        playAgainButton.on('pointerover', () => {
            playAgainButton.setTint(0xaaaaff);
        });
        playAgainButton.on('pointerout', () => {
            playAgainButton.clearTint();
        });
        playAgainButton.on('pointerdown', () => {
            playAgainButton.setTint(0x8888ff);
        });
        playAgainButton.on('pointerup', () => {
            this.scene.start('GameScene');
        });
        
        // Menu button
        const menuButton = this.add.image(
            this.cameras.main.width / 2 + 150,
            this.cameras.main.height * 0.75,
            'button'
        ).setDisplaySize(250, 60);
        
        const menuText = this.add.text(
            menuButton.x,
            menuButton.y,
            'MAIN MENU',
            {
                font: 'bold 26px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Make button interactive
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerover', () => {
            menuButton.setTint(0xaaaaff);
        });
        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });
        menuButton.on('pointerdown', () => {
            menuButton.setTint(0x8888ff);
        });
        menuButton.on('pointerup', () => {
            this.scene.start('MenuScene');
        });
        
        // Flavor text
        const flavorText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            "Reality may be broken, but your spirit isn't. Fight on, champion!",
            {
                font: 'italic 18px Arial',
                fill: '#aaaaaa'
            }
        ).setOrigin(0.5);
    }
} 