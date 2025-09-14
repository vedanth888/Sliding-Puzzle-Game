import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const App = () => {
  const [gridSize, setGridSize] = useState(4);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(gridSize * gridSize - 1);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [time, setTime] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [particles, setParticles] = useState([]);

  // Initialize the game board
  const initializeGame = useCallback(() => {
    const totalTiles = gridSize * gridSize;
    const newTiles = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    newTiles.push(0); // 0 represents the empty space
    
    // Fisher-Yates shuffle algorithm to ensure it's solvable
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    
    setTiles(newTiles);
    setEmptyIndex(newTiles.indexOf(0));
    setMoves(0);
    setGameStarted(true);
    setGameWon(false);
    setTime(0);
    setParticles([]);
  }, [gridSize]);

  // Create celebration particles
  const createParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }
    setParticles(newParticles);
  }, []);

  // Check if the puzzle is solved
  const checkWin = useCallback(() => {
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }, [tiles]);

  // Move a tile if it's adjacent to the empty space
  const moveTile = useCallback((index) => {
    if (gameWon || !gameStarted) return;
    
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;
    
    // Check if the tile is adjacent to the empty space
    if (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    ) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      
      setTiles(newTiles);
      setEmptyIndex(index);
      setMoves(moves + 1);
      
      if (checkWin()) {
        setGameWon(true);
        createParticles();
      }
    }
  }, [tiles, emptyIndex, gridSize, gameWon, gameStarted, moves, checkWin, createParticles]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameWon) return;
      
      let newIndex = -1;
      const row = Math.floor(emptyIndex / gridSize);
      const col = emptyIndex % gridSize;
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (row < gridSize - 1) newIndex = emptyIndex + gridSize;
          break;
        case 'arrowdown':
        case 's':
          if (row > 0) newIndex = emptyIndex - gridSize;
          break;
        case 'arrowleft':
        case 'a':
          if (col < gridSize - 1) newIndex = emptyIndex + 1;
          break;
        case 'arrowright':
        case 'd':
          if (col > 0) newIndex = emptyIndex - 1;
          break;
        default:
          return;
      }
      
      if (newIndex >= 0 && newIndex < tiles.length) {
        moveTile(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emptyIndex, gridSize, moveTile, gameStarted, gameWon, tiles.length]);

  // Touch device detection
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  // Initialize game on grid size change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle swipe gestures
  const handleSwipe = (direction) => {
    if (!gameStarted || gameWon) return;
    
    let newIndex = -1;
    const row = Math.floor(emptyIndex / gridSize);
    const col = emptyIndex % gridSize;
    
    switch (direction) {
      case 'up':
        if (row < gridSize - 1) newIndex = emptyIndex + gridSize;
        break;
      case 'down':
        if (row > 0) newIndex = emptyIndex - gridSize;
        break;
      case 'left':
        if (col < gridSize - 1) newIndex = emptyIndex + 1;
        break;
      case 'right':
        if (col > 0) newIndex = emptyIndex - 1;
        break;
      default:
        break;
    }
    
    if (newIndex >= 0 && newIndex < tiles.length) {
      moveTile(newIndex);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mobile control buttons
  const ControlButton = ({ direction, icon }) => (
    <motion.button
      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:shadow-xl active:scale-95"
      onClick={() => handleSwipe(direction)}
      aria-label={`Move ${direction}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
    </motion.button>
  );

  // Tile colors based on value
  const getTileColor = (value) => {
    const hue = (value * 25) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-200 opacity-20"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 30 - 15, 0],
              x: [0, Math.random() * 30 - 15, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Celebration particles */}
      <AnimatePresence>
        {gameWon && particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-yellow-400"
            style={{
              left: `${particle.x}vw`,
              top: `${particle.y}vh`,
            }}
            initial={{  
              opacity: 0,  
              scale: 0,
            }}
            animate={{  
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -100],
              x: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              ease: "easeOut"
            }}
          />
        ))}
      </AnimatePresence>

      <motion.h1 
        className="text-5xl font-bold text-gray-800 mb-2"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Sliding Puzzle
      </motion.h1>
      
      <motion.p 
        className="text-gray-600 mb-6 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Arrange the tiles in numerical order
      </motion.p>
      
      {/* Game Stats */}
      <motion.div 
        className="flex justify-between w-full max-w-md mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="text-center">
          <p className="text-sm text-gray-600">Moves</p>
          <p className="text-2xl font-bold text-gray-800">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Time</p>
          <p className="text-2xl font-bold text-gray-800">{formatTime(time)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Size</p>
          <select 
            className="text-lg font-bold text-gray-800 bg-transparent border-none focus:ring-0 cursor-pointer"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            disabled={gameStarted && !gameWon}
          >
            <option value={3}>3x3</option>
            <option value={4}>4x4</option>
            <option value={5}>5x5</option>
          </select>
        </div>
      </motion.div>
      
      {/* Game Board */}
      <motion.div 
        className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-2 mb-6 border-2 border-white/30"
        style={{
          width: `${Math.min(gridSize * 80, window.innerWidth * 0.8)}px`,
          height: `${Math.min(gridSize * 80, window.innerWidth * 0.8)}px`,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {tiles.map((tile, index) => (
          tile !== 0 && (
            <motion.div
              key={tile}
              className={`absolute flex items-center justify-center text-white text-xl font-bold rounded-xl cursor-pointer shadow-md`}
              style={{
                width: `calc(100% / ${gridSize} - 8px)`,
                height: `calc(100% / ${gridSize} - 8px)`,
                left: `${(index % gridSize) * (100 / gridSize)}%`,
                top: `${Math.floor(index / gridSize) * (100 / gridSize)}%`,
                transform: 'translate(4px, 4px)',
                userSelect: 'none',
                backgroundColor: gameWon ? '#4ade80' : getTileColor(tile)
              }}
              onClick={() => moveTile(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {tile}
            </motion.div>
          )
        ))}
      </motion.div>
      
      {/* Win Message */}
      <AnimatePresence>
        {gameWon && (
          <motion.div 
            className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-6 py-4 rounded-xl mb-6 text-center shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="font-bold text-2xl mb-2">Congratulations!</p>
            <p>You solved the {gridSize}x{gridSize} puzzle in {moves} moves and {formatTime(time)}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Controls */}
      <motion.div 
        className="flex flex-col items-center gap-4 w-full max-w-md"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {isTouchDevice && (
          <motion.button
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 shadow-md"
            onClick={() => setShowControls(!showControls)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </motion.button>
        )}
        
        <AnimatePresence>
        {isTouchDevice && showControls && (
          <motion.div 
            className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-center mb-4">
              <ControlButton direction="up" icon="↑" />
            </div>
            <div className="flex justify-between items-center">
              <ControlButton direction="left" icon="←" />
              <div className="w-16 h-16"></div>
              <ControlButton direction="right" icon="→" />
            </div>
            <div className="flex justify-center mt-4">
              <ControlButton direction="down" icon="↓" />
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        
        {!isTouchDevice && (
          <motion.p 
            className="text-gray-600 text-sm mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Use WASD or Arrow Keys to move tiles
          </motion.p>
        )}
        
        <div className="flex gap-4">
          <motion.button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl"
            onClick={initializeGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {gameWon || !gameStarted ? 'New Game' : 'Restart'}
          </motion.button>
        </div>
      </motion.div>
      
    </div>
  );
};

export default App;

