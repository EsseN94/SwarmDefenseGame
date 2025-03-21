import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Background with overlay for depth
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
        
        // Add subtle gradient overlay
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x000022, 0x000022, 0x111133, 0x111133, 0.5);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // Game logo/title with glow effect
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 4,
            'SWARM DEFENDER',
            {
                font: 'bold 68px Arial',
                fill: '#ffffff',
                stroke: '#3355aa',
                strokeThickness: 8
            }
        ).setOrigin(0.5);
        
        // Add a subtle animation to the title
        this.tweens.add({
            targets: titleText,
            scale: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Subtitle with improved styling
        const subtitle = this.add.text(
            this.cameras.main.width / 2,
            titleText.y + titleText.height/2 + 20,
            "Battle hordes of enemies as reality's last defender",
            {
                font: '24px Arial',
                fill: '#aaccff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Create an enhanced stats panel with proper styling
        const statsPanel = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            500,
            140,
            0x111122,
            0.85
        ).setOrigin(0.5);
        
        // Add decorative border to stats panel
        const statsBorder = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            500,
            140,
            0x3039a0,
            0
        ).setOrigin(0.5);
        statsBorder.setStrokeStyle(2, 0x4444bb);
        
        // Panel header
        const panelHeader = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 30,
            440,
            36,
            0x3039a0,
            0.9
        ).setOrigin(0.5);
        
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 30,
            'PLAYER STATS',
            {
                font: 'bold 20px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Gold stat with icon effect
        const goldIcon = this.add.rectangle(
            this.cameras.main.width / 2 - 180,
            this.cameras.main.height / 2 + 10,
            24,
            24,
            0xffcc00,
            1
        ).setOrigin(0.5);
        
        const goldText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2 + 10,
            `Gold: ${window.gameState?.gold || 0}`,
            {
                font: 'bold 22px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0, 0.5);
        
        // Wave stat with icon
        const waveIcon = this.add.rectangle(
            this.cameras.main.width / 2 - 180,
            this.cameras.main.height / 2 + 50,
            24,
            24,
            0x33aaff,
            1
        ).setOrigin(0.5);
        
        const waveText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2 + 50,
            `Highest Wave: ${window.gameState?.highestWave || 0}`,
            {
                font: '22px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(0, 0.5);
        
        // Create a button container for consistent button styling
        const buttonContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height * 0.75);
        
        // Start game button with enhanced styling
        const startButton = this.add.rectangle(
            0,
            0,
            240,
            60,
            0x3039a0,
            0.9
        ).setOrigin(0.5);
        
        // Add button shadow
        const startButtonShadow = this.add.rectangle(
            3,
            3,
            240,
            60,
            0x000000,
            0.4
        ).setOrigin(0.5);
        startButtonShadow.setDepth(-1);
        
        const startText = this.add.text(
            0,
            0,
            'START GAME',
            {
                font: 'bold 26px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        buttonContainer.add([startButtonShadow, startButton, startText]);
        
        // Make button interactive with premium effects
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x4048c0);
            this.tweens.add({
                targets: startButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
            this.tweens.add({
                targets: startText,
                scale: 1.05,
                duration: 100
            });
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x3039a0);
            this.tweens.add({
                targets: [startButton, startText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        startButton.on('pointerdown', () => {
            startButton.setFillStyle(0x202880);
            this.tweens.add({
                targets: startButton,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50
            });
        });
        
        startButton.on('pointerup', () => {
            // Add click effects
            this.cameras.main.flash(300, 0, 0, 0, 0.3);
            
            if (this.textures.exists('particle')) {
                const particles = this.add.particles(startButton.x + buttonContainer.x, startButton.y + buttonContainer.y, 'particle', {
                    speed: { min: 50, max: 150 },
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 800,
                    quantity: 20,
                    blendMode: 'ADD',
                    tint: 0x3399ff
                });
                
                // Auto-destroy after transition
                this.time.delayedCall(500, () => {
                    particles.destroy();
                });
            }
            
            this.scene.start('GameScene');
        });
        
        // Upgrade button with the same styling pattern
        const upgradeButtonContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height * 0.75 + 80);
        
        const upgradeButton = this.add.rectangle(
            0,
            0,
            240,
            60,
            0x3039a0,
            0.9
        ).setOrigin(0.5);
        
        // Add button shadow
        const upgradeButtonShadow = this.add.rectangle(
            3,
            3,
            240,
            60,
            0x000000,
            0.4
        ).setOrigin(0.5);
        upgradeButtonShadow.setDepth(-1);
        
        const upgradeText = this.add.text(
            0,
            0,
            'UPGRADES',
            {
                font: 'bold 26px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        upgradeButtonContainer.add([upgradeButtonShadow, upgradeButton, upgradeText]);
        
        // Make upgrade button interactive with same effects
        upgradeButton.setInteractive({ useHandCursor: true });
        upgradeButton.on('pointerover', () => {
            upgradeButton.setFillStyle(0x4048c0);
            this.tweens.add({
                targets: upgradeButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
            this.tweens.add({
                targets: upgradeText,
                scale: 1.05,
                duration: 100
            });
        });
        
        upgradeButton.on('pointerout', () => {
            upgradeButton.setFillStyle(0x3039a0);
            this.tweens.add({
                targets: [upgradeButton, upgradeText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        upgradeButton.on('pointerdown', () => {
            upgradeButton.setFillStyle(0x202880);
            this.tweens.add({
                targets: upgradeButton,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50
            });
        });
        
        upgradeButton.on('pointerup', () => {
            // Add click effects
            this.cameras.main.flash(300, 0, 0, 0, 0.3);
            
            if (this.textures.exists('particle')) {
                const particles = this.add.particles(upgradeButton.x + upgradeButtonContainer.x, upgradeButton.y + upgradeButtonContainer.y, 'particle', {
                    speed: { min: 50, max: 150 },
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 800,
                    quantity: 20,
                    blendMode: 'ADD',
                    tint: 0xffcc33
                });
                
                // Auto-destroy after transition
                this.time.delayedCall(500, () => {
                    particles.destroy();
                });
            }
            
            this.scene.start('UpgradeScene');
        });
        
        // Footer text with improved styling
        const footerText = this.add.text(
            this.cameras.main.width - 20,
            this.cameras.main.height - 20,
            'Character: Lik Hung (Shuriken Master)',
            {
                font: 'italic 16px Arial',
                fill: '#aaccff'
            }
        ).setOrigin(1, 1);
    }
} 