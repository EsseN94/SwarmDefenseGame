export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.musicTracks = {};
        this.music = null;
        this.currentMusicKey = '';
        this.audioEnabled = false; // Always disabled
        
        console.log('Audio system disabled for simplification');
    }
    
    loadAudio() {
        // Do nothing - audio disabled
        return;
    }
    
    createMockSound(key, isMusic = false) {
        // Create a dummy sound object that safely does nothing
        return {
            key: key,
            isPlaying: false,
            isMusic: isMusic,
            play: function() { return this; },
            stop: function() { return this; },
            pause: function() { return this; },
            resume: function() { return this; },
            destroy: function() { return true; },
            setVolume: function() { return this; },
            setLoop: function() { return this; },
            setRate: function() { return this; },
            setDetune: function() { return this; },
            setSeek: function() { return this; },
            setMute: function() { return this; },
            once: function() { return this; },
            on: function() { return this; },
            off: function() { return this; }
        };
    }
    
    playSfx(key, config = {}) {
        // Do nothing - audio disabled
        return null;
    }
    
    playRandomSfx(keys, config = {}) {
        // Do nothing - audio disabled
        return null;
    }
    
    playMusic(key, fadeIn = true) {
        // Do nothing - audio disabled
        return;
    }
    
    startNewMusic(key, fadeIn) {
        // Do nothing - audio disabled
        return;
    }
    
    stopMusic(fadeOut = true) {
        // Do nothing - audio disabled
        return;
    }
    
    pauseMusic() {
        // Do nothing - audio disabled
        return;
    }
    
    resumeMusic() {
        // Do nothing - audio disabled
        return;
    }
    
    setMusicVolume(volume) {
        // Do nothing - audio disabled
        return;
    }
    
    setSfxVolume(volume) {
        // Do nothing - audio disabled
        return;
    }
    
    playPositionalSfx(key, x, y, maxDistance = 500, config = {}) {
        // Do nothing - audio disabled
        return null;
    }
    
    playSfxWithVariation(key, pitchVariation = 0.1, volumeVariation = 0.1) {
        // Do nothing - audio disabled
        return null;
    }
    
    update() {
        // Do nothing - audio disabled
        return;
    }
    
    shutdown() {
        // Do nothing - audio disabled
        return;
    }
} 