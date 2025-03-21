import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameStateManager } from './managers/GameStateManager';

// Initialize game state manager and make it globally accessible
const gameStateManager = new GameStateManager();
window.gameStateManager = gameStateManager; // Make accessible globally

// Add some debug code to ensure game state is properly initialized
console.log("Initial game state:", window.gameState);
console.log("Available stats:", window.gameState?.stats);

// Give some starting gold for testing upgrades
if (window.gameState && typeof window.gameState.gold === 'number') {
    window.gameState.gold = 5000;
    console.log("Set testing gold to 5000");
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [LoadingScene, MenuScene, GameScene, UpgradeScene, GameOverScene]
};

const game = new Phaser.Game(config);

// Game state is now fully managed by GameStateManager
console.log("Game initialized with GameStateManager"); 