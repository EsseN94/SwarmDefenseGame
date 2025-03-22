import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    preload() {
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Update loading bar as assets load
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
        
        // We'll create all placeholders directly in create() instead of trying to load external assets
        // This prevents file not found errors
    }

    create() {
        // Create placeholder assets
        this.createPlaceholderAssets();
        
        // Start the menu scene
        this.scene.start('MenuScene');
    }

    // Create simple placeholder assets during development
    createPlaceholderAssets() {
        // Debug logging
        console.log('Creating placeholder assets');
        
        // Player
        this.createColoredCircle('player', 0xffffff, 24);
        
        // Enemy
        this.createColoredCircle('enemy', 0xff0000, 20);
        
        // Projectile
        this.createColoredCircle('bullet', 0x00ffff, 8);
        
        // Create a special XP orb with glow effect
        this.createXPOrbTexture();
        
        // Health pickup placeholder
        this.createColoredCircle('healthPickup', 0xff00ff, 16);
        
        // Simple background
        this.createBackground('background');
        
        // Panel textures
        this.createPanel('panel', 0x3333aa, 200, 200);
        
        // Button texture
        this.createPanel('button', 0x4444cc, 150, 50);
        
        console.log('Placeholder assets created');
    }

    createColoredCircle(key, color, size) {
        try {
            // Check if the texture already exists to avoid recreation
            if (this.textures.exists(key)) {
                console.log(`Texture already exists: ${key}`);
                return;
            }
            
            // Create a graphics object
            const graphics = this.add.graphics();
            
            // Draw the circle
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillCircle(size / 2, size / 2, size / 2);
            
            // Generate texture and add to texture manager
            graphics.generateTexture(key, size, size);
            graphics.destroy();
            
            console.log(`Created texture: ${key}`);
        } catch (e) {
            console.warn(`Failed to create texture ${key}:`, e);
            // Create a fallback texture as a last resort
            this.createFallbackTexture(key, size);
        }
    }

    createStar(key, color, size) {
        try {
            // Check if the texture already exists to avoid recreation
            if (this.textures.exists(key)) {
                console.log(`Texture already exists: ${key}`);
                return;
            }
            
            // Create a graphics object
            const graphics = this.add.graphics();
            graphics.clear();
            graphics.fillStyle(color);
            
            // Draw a star shape
            const centerX = size / 2;
            const centerY = size / 2;
            const spikes = 4;
            const outerRadius = size / 2;
            const innerRadius = size / 4;
            
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            
            graphics.beginPath();
            graphics.moveTo(centerX, centerY - outerRadius);
            
            for (let i = 0; i < spikes; i++) {
                graphics.lineTo(
                    centerX + Math.cos(rot) * outerRadius,
                    centerY + Math.sin(rot) * outerRadius
                );
                rot += step;
                
                graphics.lineTo(
                    centerX + Math.cos(rot) * innerRadius,
                    centerY + Math.sin(rot) * innerRadius
                );
                rot += step;
            }
            
            graphics.lineTo(centerX, centerY - outerRadius);
            graphics.closePath();
            graphics.fillPath();
            
            // Generate texture and add to texture manager
            graphics.generateTexture(key, size, size);
            graphics.destroy();
            
            console.log(`Created texture: ${key}`);
        } catch (e) {
            console.warn(`Failed to create texture ${key}:`, e);
            // Create a fallback texture as a last resort
            this.createFallbackTexture(key, size);
        }
    }

    createBackground(key, color, width, height) {
        try {
            // Check if the texture already exists to avoid recreation
            if (this.textures.exists(key)) {
                console.log(`Texture already exists: ${key}`);
                return;
            }
            
            // Create a graphics object
            const graphics = this.add.graphics();
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, width, height);
            
            // Generate texture and add to texture manager
            graphics.generateTexture(key, width, height);
            graphics.destroy();
            
            console.log(`Created texture: ${key}`);
        } catch (e) {
            console.warn(`Failed to create texture ${key}:`, e);
            // Create a fallback texture as a last resort
            this.createFallbackTexture(key, Math.max(width, height));
        }
    }

    createColoredRectangle(key, color, width, height, cornerRadius = 0) {
        try {
            // Check if the texture already exists
            if (this.textures.exists(key)) {
                console.log(`Texture already exists: ${key}`);
                return;
            }
            
            // Create a graphics object
            const graphics = this.add.graphics();
            
            // Define the rectangle
            graphics.clear();
            graphics.fillStyle(color, 1);
            
            // Draw with rounded corners if specified
            if (cornerRadius > 0) {
                graphics.fillRoundedRect(0, 0, width, height, cornerRadius);
                
                // Add a border
                graphics.lineStyle(2, 0x555555, 1);
                graphics.strokeRoundedRect(0, 0, width, height, cornerRadius);
            } else {
                graphics.fillRect(0, 0, width, height);
                
                // Add a border
                graphics.lineStyle(2, 0x555555, 1);
                graphics.strokeRect(0, 0, width, height);
            }
            
            // Generate texture
            graphics.generateTexture(key, width, height);
            graphics.destroy();
            
            console.log(`Created rectangle texture: ${key} (${width}x${height})`);
            
            // Verify the texture was created
            if (this.textures.exists(key)) {
                const texture = this.textures.get(key);
                console.log(`Verified texture ${key} - source size: ${texture.source[0].width}x${texture.source[0].height}`);
            } else {
                console.error(`Failed to create texture: ${key}`);
                this.createFallbackTexture(key, Math.max(width, height));
            }
        } catch (e) {
            console.error(`Error creating texture ${key}:`, e);
            this.createFallbackTexture(key, Math.max(width, height));
        }
    }

    createButton(key, color, width, height) {
        return this.createColoredRectangle(key, color, width, height, 8);
    }

    createPanel(key, color, width, height) {
        return this.createColoredRectangle(key, color, width, height, 16);
    }

    // Create a minimal fallback texture that won't cause rendering issues
    createFallbackTexture(key, size = 32) {
        try {
            // Create a 1x1 pixel canvas as a last resort
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(2, size);
            canvas.height = Math.max(2, size);
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add directly to the texture manager
            this.textures.addCanvas(key, canvas);
            console.log(`Created fallback texture for: ${key}`);
        } catch (e) {
            console.error(`Critical error: Failed to create fallback texture for ${key}:`, e);
        }
    }

    // Create a special XP orb texture with glow effect
    createXPOrbTexture() {
        try {
            const size = 24; // Larger size for better visibility
            
            // Check if the texture already exists
            if (this.textures.exists('xpOrb')) {
                console.log('XP orb texture already exists');
                return;
            }
            
            // Create a graphics object
            const graphics = this.add.graphics();
            
            // Draw outer glow
            graphics.fillStyle(0x00ffff, 0.3);
            graphics.fillCircle(size/2, size/2, size/2);
            
            // Draw inner circle
            graphics.fillStyle(0x00ffff, 0.7);
            graphics.fillCircle(size/2, size/2, size/3);
            
            // Draw bright center
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(size/2, size/2, size/6);
            
            // Generate texture
            graphics.generateTexture('xpOrb', size, size);
            graphics.destroy();
            
            console.log('Created XP orb texture with glow effect');
        } catch (error) {
            console.error('Failed to create XP orb texture:', error);
            // Fallback to simple circle
            this.createColoredCircle('xpOrb', 0x00ffff, 16);
        }
    }
} 