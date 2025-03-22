import Phaser from 'phaser';
import io from 'socket.io-client';
import { LoadingScene } from './scenes/LoadingScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameStateManager } from './managers/GameStateManager';
import { MultiplayerScene } from './scenes/MultiplayerScene';
import { MultiplayerLobbyScene } from './scenes/MultiplayerLobbyScene';

// Initialize socket.io
let socket;
try {
    // Attempt to initialize socket.io with better error handling
    socket = io({
        reconnectionAttempts: 3,
        timeout: 10000,
        autoConnect: false // Don't connect automatically
    });
    
    // Log connection status
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        window.multiplayer.connected = true;
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        window.multiplayer.connected = false;
    });
    
    // Error handling
    socket.on('connect_error', (error) => {
        console.warn('Connection error:', error);
        window.multiplayer.connected = false;
        window.multiplayer.error = error.message;
    });
    
    socket.on('error', (error) => {
        console.warn('Socket error:', error);
        window.multiplayer.error = error.message;
    });
    
    // Only connect if multiplayer is needed
    // We'll connect later when multiplayer features are actually used
    // socket.connect();
} catch (e) {
    console.warn('Failed to initialize socket.io, multiplayer will be disabled:', e);
    socket = null;
}

window.socket = socket;
window.multiplayer = {
    isMultiplayer: false,
    playerId: null,
    room: null,
    players: {},
    connected: false,
    error: null
};

// Initialize game state manager and make it globally accessible
const gameStateManager = new GameStateManager();
window.gameStateManager = gameStateManager; // Make accessible globally

// Create an initial game state directly with hardcoded values
window.gameState = {
    gold: 5000,
    playerXP: 0,
    playerLevel: 1,
    xpToNextLevel: 100,
    highestWave: 0,
    stats: {
        damage: {
            level: 0,
            value: 1,
            maxLevel: 5,
            baseCost: 100,
            increment: 0.1,
            displayName: "Attack Damage",
            description: "Increases damage dealt to enemies"
        },
        armor: {
            level: 0,
            value: 0,
            maxLevel: 5,
            baseCost: 100,
            increment: 8,
            displayName: "Defense",
            description: "Reduces damage taken from enemies"
        },
        maxHealth: {
            level: 0,
            value: 1000,
            maxLevel: 5,
            baseCost: 100,
            increment: 150,
            displayName: "Maximum Health",
            description: "Increases your maximum health"
        },
        healthRegen: {
            level: 0,
            value: 0,
            maxLevel: 5,
            baseCost: 200,
            increment: 4,
            displayName: "Health Regeneration",
            description: "Regenerate health over time"
        },
        moveSpeed: {
            level: 0,
            value: 1,
            maxLevel: 5,
            baseCost: 150,
            increment: 0.09,
            displayName: "Movement Speed",
            description: "Move faster"
        },
        pickupRadius: {
            level: 0,
            value: 1,
            maxLevel: 5,
            baseCost: 150,
            increment: 0.35,
            displayName: "Pickup Radius",
            description: "Collect items from further away"
        },
        experienceGain: {
            level: 0,
            value: 1,
            maxLevel: 5,
            baseCost: 150,
            increment: 0.1,
            displayName: "Experience Gain",
            description: "Increases XP gained from orbs"
        }
    }
};

// Log the initial state
console.log("Game initialized with stats:", Object.keys(window.gameState.stats));

// Socket.io initialization with error handling
// ... rest of existing code ...

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
    scene: [LoadingScene, MenuScene, GameScene, UpgradeScene, GameOverScene, MultiplayerLobbyScene, MultiplayerScene]
};

const game = new Phaser.Game(config);

// Game state is now fully managed by GameStateManager
console.log("Game initialized with GameStateManager");

// Socket.io event handlers are now set up in the try/catch block above
// No need for duplicate event handlers here 