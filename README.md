# Pitch Perfect Space

A space game controlled by musical pitch. Play an instrument or sing into your microphone to control the position of your spaceship.

## How to Play

1. Start the game and allow microphone access
2. During calibration, play a note to establish your reference pitch
3. Control your spaceship by adjusting your pitch:
   - Play in tune = ship stays in center
   - Play sharp (higher pitch) = ship moves up
   - Play flat (lower pitch) = ship moves down
4. Avoid obstacles that come from the right side of the screen
5. Your score increases the longer you survive

## Development

This project uses:
- React for the UI
- Web Audio API for pitch detection
- Canvas for game rendering

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

- Real-time pitch detection
- Dynamic obstacle generation
- Increasing difficulty over time
- High score tracking
- Visual pitch indicator