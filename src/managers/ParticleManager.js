export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.emitters = {};
        
        // Initialize particle emitters
        this.createEmitters();
    }
    
    createEmitters() {
        // Blood particles
        this.emitters.blood = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 800,
            speed: { min: 40, max: 100 },
            scale: { start: 0.4, end: 0.1 },
            gravityY: 300,
            blendMode: 'ADD',
            tint: 0xff0000,
            emitting: false
        });
        
        // Explosion particles
        this.emitters.explosion = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 600,
            speed: { min: 80, max: 180 },
            scale: { start: 0.6, end: 0.1 },
            rotate: { start: 0, end: 360 },
            blendMode: 'ADD',
            tint: [0xff9900, 0xff0000, 0xffff00],
            emitting: false
        });
        
        // XP orb collect effect
        this.emitters.xpCollect = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 500,
            speed: { min: 30, max: 80 },
            scale: { start: 0.4, end: 0.1 },
            rotate: { start: 0, end: 180 },
            blendMode: 'ADD',
            tint: 0x00ffff,
            emitting: false
        });
        
        // Health pickup collect effect
        this.emitters.healthCollect = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 500,
            speed: { min: 30, max: 80 },
            scale: { start: 0.4, end: 0.1 },
            rotate: { start: 0, end: 180 },
            blendMode: 'ADD',
            tint: 0x00ff00,
            emitting: false
        });
        
        // Level up effect
        this.emitters.levelUp = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 1000,
            speed: { min: 100, max: 200 },
            scale: { start: 0.6, end: 0.1 },
            rotate: { start: 0, end: 360 },
            blendMode: 'ADD',
            tint: 0xffff00,
            emitting: false
        });
        
        // Footstep dust effect
        this.emitters.footstep = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 300,
            speed: { min: 5, max: 20 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.4, end: 0 },
            tint: 0xdddddd,
            emitting: false
        });
        
        // Projectile hit effect
        this.emitters.projectileHit = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 300,
            speed: { min: 40, max: 100 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            tint: 0xffffff,
            emitting: false
        });
        
        // Dash effect
        this.emitters.dash = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            lifespan: 400,
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: 0x6666ff,
            emitting: false
        });
        
        // Set all emitters to high depth
        Object.values(this.emitters).forEach(emitter => {
            emitter.setDepth(5);
        });
    }
    
    createBloodSplash(x, y, scale = 1) {
        this.emitters.blood.setPosition(x, y);
        this.emitters.blood.setScale(scale);
        this.emitters.blood.explode(10 * scale);
    }
    
    createExplosion(x, y, scale = 1) {
        this.emitters.explosion.setPosition(x, y);
        this.emitters.explosion.setScale(scale);
        this.emitters.explosion.explode(20 * scale);
        
        // Add light flash effect
        const light = this.scene.lights.addLight(x, y, 200 * scale, 0xff9900, 0.8);
        this.scene.tweens.add({
            targets: light,
            intensity: 0,
            radius: 0,
            duration: 300,
            onComplete: () => {
                this.scene.lights.removeLight(light);
            }
        });
    }
    
    createXPCollectEffect(x, y) {
        this.emitters.xpCollect.setPosition(x, y);
        this.emitters.xpCollect.explode(10);
    }
    
    createHealthCollectEffect(x, y) {
        this.emitters.healthCollect.setPosition(x, y);
        this.emitters.healthCollect.explode(10);
    }
    
    createLevelUpEffect(x, y) {
        this.emitters.levelUp.setPosition(x, y);
        this.emitters.levelUp.explode(30);
        
        // Add expanding circle effect
        const circle = this.scene.add.circle(x, y, 10, 0xffff00, 0.7);
        circle.setDepth(4);
        
        this.scene.tweens.add({
            targets: circle,
            radius: 100,
            alpha: 0,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
                circle.destroy();
            }
        });
    }
    
    createFootstep(x, y, direction) {
        // Offset the position slightly based on direction
        const offsetX = Math.cos(direction) * 5;
        const offsetY = Math.sin(direction) * 5;
        
        this.emitters.footstep.setPosition(x - offsetX, y - offsetY);
        this.emitters.footstep.explode(3);
    }
    
    createProjectileTrail(projectile, color = 0xffffff) {
        // Create a custom trail for a projectile
        const trail = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            follow: projectile,
            lifespan: 300,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            tint: color,
            frequency: 15,
            emitting: true
        });
        
        trail.setDepth(3);
        
        return trail;
    }
    
    createProjectileHitEffect(x, y, color = 0xffffff) {
        this.emitters.projectileHit.setPosition(x, y);
        this.emitters.projectileHit.setTint(color);
        this.emitters.projectileHit.explode(8);
    }
    
    createDashEffect(x, y, rotation) {
        this.emitters.dash.setPosition(x, y);
        
        // Set emitter angle based on rotation
        const angle = Phaser.Math.RadToDeg(rotation);
        this.emitters.dash.setAngle(angle - 180); // Emit particles in opposite direction
        
        this.emitters.dash.explode(10);
    }
    
    createAreaEffect(x, y, radius, color = 0x6666ff, duration = 500) {
        // Create a pulsing circle effect
        const circle = this.scene.add.circle(x, y, radius, color, 0.3);
        circle.setStrokeStyle(2, color, 0.8);
        circle.setDepth(2);
        
        // Create a pulsing effect
        this.scene.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 1.2,
            duration: duration,
            ease: 'Sine.easeOut',
            onComplete: () => {
                circle.destroy();
            }
        });
        
        return circle;
    }
    
    createHealingEffect(target) {
        // Create particles that spiral upward around the target
        const particles = this.scene.add.particles(0, 0, 'particle', {
            frame: 0,
            x: 0,
            y: 0,
            lifespan: 1000,
            speed: { min: 20, max: 50 },
            scale: { start: 0.4, end: 0 },
            quantity: 1,
            blendMode: 'ADD',
            tint: 0x00ff00,
            emitting: true,
            frequency: 50
        });
        
        particles.setDepth(4);
        
        // Create a path for particles to follow
        const path = new Phaser.Curves.Path(0, 0);
        path.splineTo([
            { x: -15, y: -10 },
            { x: -10, y: -20 },
            { x: 0, y: -30 },
            { x: 10, y: -20 },
            { x: 15, y: -10 },
            { x: 0, y: 0 }
        ]);
        
        // Follow path
        particles.setEmitterConfig({
            emitZone: {
                type: 'edge',
                source: path,
                quantity: 6,
                yoyo: false
            }
        });
        
        // Track the target
        this.scene.tweens.add({
            targets: particles,
            duration: 1000,
            ease: 'Linear',
            onUpdate: () => {
                particles.setPosition(target.x, target.y);
            },
            onComplete: () => {
                particles.setEmitting(false);
                // Destroy after last particles fade out
                this.scene.time.delayedCall(1000, () => {
                    particles.destroy();
                });
            }
        });
        
        return particles;
    }
    
    createShieldEffect(target, radius = 30, duration = 3000) {
        // Create shield bubble effect
        const shield = this.scene.add.circle(target.x, target.y, radius, 0x6666ff, 0.2);
        shield.setStrokeStyle(2, 0x6666ff, 0.8);
        shield.setDepth(3);
        
        // Add ripple effect
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.3,
            yoyo: true,
            repeat: -1,
            duration: 500,
            ease: 'Sine.easeInOut'
        });
        
        // Track the target
        this.scene.tweens.add({
            targets: shield,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                shield.setPosition(target.x, target.y);
            },
            onComplete: () => {
                // Fade out and destroy
                this.scene.tweens.add({
                    targets: shield,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => {
                        shield.destroy();
                    }
                });
            }
        });
        
        return shield;
    }
    
    createChargeEffect(x, y, radius, color = 0xffff00, duration = 1000) {
        // Particles that spiral inward
        const particles = this.scene.add.particles(x, y, 'particle', {
            frame: 0,
            lifespan: 500,
            speed: { min: 100, max: 200 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            tint: color,
            emitting: true,
            frequency: 20
        });
        
        particles.setDepth(4);
        
        // Make particles converge to center
        particles.createEmitter({
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, radius),
                quantity: 32
            },
            moveToX: 0,
            moveToY: 0
        });
        
        // Auto-destroy after duration
        this.scene.time.delayedCall(duration, () => {
            particles.destroy();
        });
        
        return particles;
    }
    
    update() {
        // Update any persistent effects here
    }
    
    shutdown() {
        // Clean up all particle emitters
        Object.values(this.emitters).forEach(emitter => {
            emitter.destroy();
        });
        
        this.emitters = {};
    }
} 