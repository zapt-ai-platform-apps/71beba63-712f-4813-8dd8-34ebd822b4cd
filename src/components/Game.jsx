import React, { useState, useEffect, useRef } from 'react';
import { useAudioInput } from '../hooks/useAudioInput';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { useGameLoop } from '../hooks/useGameLoop';
import { checkCollision } from '../utils/collision';
import { drawSpaceship, drawMeteor, drawEnemyShip, drawPitchIndicator } from '../utils/draw';
import * as Sentry from '@sentry/browser';

const GAME_HEIGHT = 500;
const GAME_WIDTH = 800;
const SPACESHIP_WIDTH = 60;
const SPACESHIP_HEIGHT = 30;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPEED_MIN = 150; // pixels per second
const OBSTACLE_SPEED_MAX = 350; // pixels per second
const OBSTACLE_INTERVAL_MIN = 1.0; // seconds
const OBSTACLE_INTERVAL_MAX = 2.5; // seconds
const DIFFICULTY_INCREASE_RATE = 0.05; // How much to increase difficulty per second

const Game = () => {
  const [gameState, setGameState] = useState('start'); // 'start', 'calibration', 'playing', 'gameover'
  const [spaceshipY, setSpaceshipY] = useState(GAME_HEIGHT / 2 - SPACESHIP_HEIGHT / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [calibrationNote, setCalibrationNote] = useState(null);
  const canvasRef = useRef(null);
  const lastObstacleTimeRef = useRef(0);

  const { isRecording, startRecording, stopRecording, getAudioData, error } = useAudioInput();
  const { pitch, note, cents } = usePitchDetection(getAudioData, isRecording);
  const { time, deltaTime } = useGameLoop(gameState === 'playing');

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('pitchPerfectSpaceHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Start calibration
  const startCalibration = () => {
    setGameState('calibration');
    startRecording();
    setCalibrationNote(null);
  };

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setSpaceshipY(GAME_HEIGHT / 2 - SPACESHIP_HEIGHT / 2);
    setObstacles([]);
    setScore(0);
    setDifficulty(0);
    startRecording();
    lastObstacleTimeRef.current = 0;
    console.log('Game started');
  };

  // End the game
  const endGame = () => {
    try {
      setGameState('gameover');
      
      // Update high score if needed
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('pitchPerfectSpaceHighScore', score.toString());
      }
      
      console.log('Game over. Score:', score);
    } catch (error) {
      console.error('Error ending game:', error);
      Sentry.captureException(error);
    }
  };

  // Handle calibration
  useEffect(() => {
    if (gameState === 'calibration' && note && !calibrationNote) {
      console.log('Calibration note detected:', note);
      setCalibrationNote(note);
    }
  }, [gameState, note, calibrationNote]);

  // Update spaceship position based on pitch
  useEffect(() => {
    if (gameState !== 'playing' || cents === null || isNaN(cents)) return;

    // Map cents to Y position
    // Center (0 cents) should be middle of screen
    // +50 cents (quarter tone sharp) should be top
    // -50 cents (quarter tone flat) should be bottom
    const targetY = GAME_HEIGHT * (1 - ((cents + 50) / 100));
    
    // Constrain to game boundaries
    const clampedY = Math.max(0, Math.min(GAME_HEIGHT - SPACESHIP_HEIGHT, targetY));
    
    setSpaceshipY(clampedY);
  }, [cents, gameState]);

  // Game update loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    try {
      // Update score (10 points per second)
      setScore(Math.floor(time * 10));
      
      // Increase difficulty over time
      setDifficulty(Math.min(1, time * DIFFICULTY_INCREASE_RATE));
      
      // Calculate current obstacle speed and interval based on difficulty
      const currentSpeed = OBSTACLE_SPEED_MIN + (OBSTACLE_SPEED_MAX - OBSTACLE_SPEED_MIN) * difficulty;
      const currentInterval = OBSTACLE_INTERVAL_MAX - (OBSTACLE_INTERVAL_MAX - OBSTACLE_INTERVAL_MIN) * difficulty;
      
      // Generate new obstacles
      if (time - lastObstacleTimeRef.current > currentInterval) {
        lastObstacleTimeRef.current = time;
        
        // Randomly choose between meteor and enemy ship
        const isEnemyShip = Math.random() > 0.7;
        
        const newObstacle = {
          id: Date.now(),
          x: GAME_WIDTH,
          y: Math.random() * (GAME_HEIGHT - OBSTACLE_HEIGHT),
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          type: isEnemyShip ? 'ship' : 'meteor',
          speed: currentSpeed * (0.8 + Math.random() * 0.4), // Add some speed variation
        };
        
        setObstacles(prevObstacles => [...prevObstacles, newObstacle]);
      }
      
      // Move obstacles
      setObstacles(prevObstacles => 
        prevObstacles
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - obstacle.speed * deltaTime
          }))
          .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH) // Remove off-screen obstacles
      );
      
      // Check for collisions
      const spaceship = {
        x: 50, // Fixed X position
        y: spaceshipY,
        width: SPACESHIP_WIDTH,
        height: SPACESHIP_HEIGHT
      };
      
      const hasCollision = obstacles.some(obstacle => 
        checkCollision(spaceship, obstacle)
      );
      
      if (hasCollision) {
        endGame();
      }
      
      // Draw game
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw pitch indicator
        drawPitchIndicator(ctx, canvas, cents);
        
        // Draw spaceship
        drawSpaceship(ctx, 50, spaceshipY, SPACESHIP_WIDTH, SPACESHIP_HEIGHT);
        
        // Draw obstacles
        obstacles.forEach(obstacle => {
          if (obstacle.type === 'meteor') {
            drawMeteor(ctx, obstacle.x, obstacle.y, obstacle.width);
          } else {
            drawEnemyShip(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          }
        });
      }
    } catch (error) {
      console.error('Error in game loop:', error);
      Sentry.captureException(error);
    }
  }, [time, deltaTime, spaceshipY, obstacles, gameState, cents, difficulty]);

  return (
    <div className="game-container flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2 text-blue-700">Pitch Perfect Space</h1>
      
      {gameState === 'start' && (
        <div className="start-screen text-center mb-4 bg-white p-6 rounded-lg shadow-lg max-w-md">
          <p className="mb-4 text-lg">Control the spaceship with your voice or instrument!</p>
          <div className="mb-6 bg-gray-100 p-4 rounded-lg">
            <p className="font-semibold mb-2">How to play:</p>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Play in tune = center</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span>Play sharp = move up</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span>Play flat = move down</span>
            </div>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors shadow-md text-lg mb-4 w-full"
            onClick={startCalibration}
          >
            Start Calibration
          </button>
          <p className="text-sm text-gray-600">Calibration helps you understand how to control the ship before playing.</p>
        </div>
      )}
      
      {gameState === 'calibration' && (
        <div className="calibration-screen text-center mb-4 bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Calibration</h2>
          
          {!calibrationNote ? (
            <>
              <p className="mb-4">Play a note on your instrument or sing a steady tone...</p>
              <div className="animate-pulse h-8 bg-gray-200 rounded w-full mb-4"></div>
            </>
          ) : (
            <>
              <p className="mb-2">Reference note detected: <span className="font-bold">{calibrationNote}</span></p>
              <p className="mb-4">
                Play this note to stay in the center.<br />
                Play slightly sharp to move up.<br />
                Play slightly flat to move down.
              </p>
              <div className="flex justify-center items-center h-20 mb-4 relative">
                <div className="h-full w-1 bg-gray-200"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-yellow-500">↑ Sharp</div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-yellow-500">↓ Flat</div>
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors shadow-md text-lg w-full"
                onClick={startGame}
              >
                Start Game
              </button>
            </>
          )}
          
          {error && (
            <div className="error-message mt-4 text-red-500 p-3 bg-red-100 rounded">
              <p className="font-bold">Microphone Error:</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">Please make sure your microphone is connected and you've given permission to use it.</p>
            </div>
          )}
        </div>
      )}
      
      {(gameState === 'playing' || gameState === 'gameover') && (
        <>
          <div className="game-stats flex justify-between w-full max-w-screen-lg mb-2 bg-white rounded-lg p-2 shadow">
            <div className="text-lg font-bold">Score: {score}</div>
            <div className="text-lg">High Score: {highScore}</div>
            {note && <div className="text-lg">Note: {note} ({cents > 0 ? '+' : ''}{cents} cents)</div>}
          </div>
          
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={GAME_WIDTH} 
              height={GAME_HEIGHT} 
              className="border border-gray-300 bg-gray-900 rounded-lg shadow-lg"
            />
            
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-lg">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4">
                  <h2 className="text-2xl font-bold mb-2 text-center text-red-600">Game Over!</h2>
                  <p className="text-xl text-center mb-6">Your score: <span className="font-bold">{score}</span></p>
                  {score >= highScore && score > 0 && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-3 rounded mb-6 text-center">
                      🎉 New High Score! 🎉
                    </div>
                  )}
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer w-full"
                    onClick={startGame}
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="made-on-zapt mt-4">
        <a href="https://www.zapt.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-blue-500">
          Made on ZAPT
        </a>
      </div>
    </div>
  );
};

export default Game;