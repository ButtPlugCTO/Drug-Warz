const express = require('express');
const redis = require('redis');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// X/Twitter OAuth Configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID || 'your_x_client_id';
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || 'your_x_client_secret';
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || `http://localhost:${PORT}/api/auth/x/callback`;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const db = new sqlite3.Database('./dopewars_data.db');

// Redis client
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.log('Redis server refused connection, retrying...');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize Redis connection
redisClient.connect().catch(console.error);

// Helper function to get drug prices from SQLite
function getDrugPricesFromSQLite(sessionId, currentDay, locationId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT dp.drug_id, dp.price, d.name as drug_name, d.is_cheap, d.is_expensive
      FROM drug_prices dp
      JOIN drugs d ON dp.drug_id = d.id
      WHERE dp.day = ? AND dp.location_id = ?
    `;
    
    db.all(query, [currentDay, locationId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const prices = {};
        rows.forEach(row => {
          prices[row.drug_id] = {
            price: row.price,
            name: row.drug_name,
            isCheap: row.is_cheap,
            isExpensive: row.is_expensive
          };
        });
        resolve(prices);
      }
    });
  });
}

// Helper function to cache prices in Redis
async function cachePricesInRedis(sessionId, currentDay, locationId, prices) {
  try {
    const key = `prices:${sessionId}:${currentDay}:${locationId}`;
    await redisClient.setEx(key, 3600, JSON.stringify(prices));
  } catch (error) {
    console.log('Failed to cache prices in Redis:', error.message);
  }
}

// Helper function to get prices from Redis or fallback to SQLite
async function getDrugPrices(sessionId, currentDay, locationId) {
  try {
    // Try Redis first
    const key = `prices:${sessionId}:${currentDay}:${locationId}`;
    const cached = await redisClient.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If not in Redis, get from SQLite
    const prices = await getDrugPricesFromSQLite(sessionId, currentDay, locationId);
    
    // Cache in Redis for next time
    await cachePricesInRedis(sessionId, currentDay, locationId, prices);
    
    return prices;
    
  } catch (error) {
    console.log('Redis failed, falling back to SQLite:', error.message);
    
    // Fallback to SQLite only
    try {
      return await getDrugPricesFromSQLite(sessionId, currentDay, locationId);
    } catch (sqliteError) {
      console.error('SQLite also failed:', sqliteError.message);
      throw new Error('Both Redis and SQLite failed');
    }
  }
}

// Game state structure (same as frontend)
const initialGameState = {
  player: {
    name: 'Player',
    cash: 2000,
    debt: 5000,
    bank: 0,
    health: 100,
    location: 3, // Start in Manhattan
    coatSize: 100,
    turn: 1,
    guns: [],
    drugs: [],
    bitches: 0
  },
  locations: [
    { id: 0, name: 'Bronx', policePresence: 10, minDrug: 7, maxDrug: 12 },
    { id: 1, name: 'Ghetto', policePresence: 5, minDrug: 8, maxDrug: 12 },
    { id: 2, name: 'Central Park', policePresence: 15, minDrug: 6, maxDrug: 12 },
    { id: 3, name: 'Manhattan', policePresence: 90, minDrug: 4, maxDrug: 10 },
    { id: 4, name: 'Coney Island', policePresence: 20, minDrug: 6, maxDrug: 12 },
    { id: 5, name: 'Brooklyn', policePresence: 70, minDrug: 4, maxDrug: 11 },
    { id: 6, name: 'Queens', policePresence: 50, minDrug: 6, maxDrug: 12 },
    { id: 7, name: 'Staten Island', policePresence: 20, minDrug: 6, maxDrug: 12 }
  ],
  drugs: [
    { id: 0, name: 'Acid', minPrice: 1000, maxPrice: 4400, cheap: true, expensive: false },
    { id: 1, name: 'Cocaine', minPrice: 15000, maxPrice: 29000, cheap: false, expensive: true },
    { id: 2, name: 'Hashish', minPrice: 480, maxPrice: 1280, cheap: true, expensive: false },
    { id: 3, name: 'Heroin', minPrice: 5500, maxPrice: 13000, cheap: false, expensive: true },
    { id: 4, name: 'Ludes', minPrice: 11, maxPrice: 60, cheap: true, expensive: false },
    { id: 5, name: 'MDA', minPrice: 1500, maxPrice: 4400, cheap: false, expensive: false },
    { id: 6, name: 'Opium', minPrice: 540, maxPrice: 1250, cheap: false, expensive: true },
    { id: 7, name: 'PCP', minPrice: 1000, maxPrice: 2500, cheap: false, expensive: false },
    { id: 8, name: 'Peyote', minPrice: 220, maxPrice: 700, cheap: false, expensive: false },
    { id: 9, name: 'Shrooms', minPrice: 630, maxPrice: 1300, cheap: false, expensive: false },
    { id: 10, name: 'Speed', minPrice: 90, maxPrice: 250, cheap: false, expensive: true },
    { id: 11, name: 'Weed', minPrice: 315, maxPrice: 890, cheap: true, expensive: false }
  ],
  guns: [
    { id: 0, name: 'Baretta', price: 3000, space: 4, damage: 5 },
    { id: 1, name: '.38 Special', price: 3500, space: 4, damage: 9 },
    { id: 2, name: 'Ruger', price: 2900, space: 4, damage: 4 },
    { id: 3, name: 'Saturday Night Special', price: 3100, space: 4, damage: 7 }
  ],
  cops: [
    { id: 0, name: 'Beat Cop', armor: 20, minDeputies: 0, maxDeputies: 0, attackPenalty: 0, defendPenalty: 0 },
    { id: 1, name: 'Detective', armor: 40, minDeputies: 0, maxDeputies: 0, attackPenalty: 10, defendPenalty: 10 },
    { id: 2, name: 'Sergeant', armor: 60, minDeputies: 1, maxDeputies: 2, attackPenalty: 20, defendPenalty: 20 },
    { id: 3, name: 'Lieutenant', armor: 80, minDeputies: 2, maxDeputies: 4, attackPenalty: 30, defendPenalty: 30 },
    { id: 4, name: 'Captain', armor: 100, minDeputies: 3, maxDeputies: 6, attackPenalty: 40, defendPenalty: 40 }
  ],
  gameState: {
    currentDay: 1,
    isPlaying: true,
    messages: [],
    events: []
  },
  specialLocations: {
    bank: 0,
    loanShark: 3,
    gunShop: 1,
    hospital: 2
  }
};

// Helper functions
const getGameKey = (sessionId) => `dopewars:game:${sessionId}`;
const getPlayerKey = (sessionId) => `dopewars:player:${sessionId}`;

// Game reducer (same logic as frontend)
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'BUY_DRUG':
      const { drugId, quantity, price } = action.payload;
      const totalCost = quantity * price;
      
      if (state.player.cash >= totalCost && state.player.coatSize >= quantity) {
        const existingDrug = state.player.drugs.find(d => d.id === drugId);
        const newDrugs = existingDrug 
          ? state.player.drugs.map(d => 
              d.id === drugId 
                ? { ...d, quantity: d.quantity + quantity }
                : d
            )
          : [...state.player.drugs, { id: drugId, quantity }];
        
        return {
          ...state,
          player: {
            ...state.player,
            cash: state.player.cash - totalCost,
            coatSize: state.player.coatSize - quantity,
            drugs: newDrugs
          }
        };
      }
      return state;
    
    case 'SELL_DRUG':
      const { drugId: sellDrugId, quantity: sellQuantity, price: sellPrice } = action.payload;
      const totalRevenue = sellQuantity * sellPrice;
      
      const playerDrug = state.player.drugs.find(d => d.id === sellDrugId);
      if (playerDrug && playerDrug.quantity >= sellQuantity) {
        const updatedDrugs = state.player.drugs.map(d => 
          d.id === sellDrugId 
            ? { ...d, quantity: d.quantity - sellQuantity }
            : d
        ).filter(d => d.quantity > 0);
        
        return {
          ...state,
          player: {
            ...state.player,
            cash: state.player.cash + totalRevenue,
            coatSize: state.player.coatSize + sellQuantity,
            drugs: updatedDrugs
          }
        };
      }
      return state;
    
    case 'CHANGE_LOCATION':
      return {
        ...state,
        player: {
          ...state.player,
          location: action.payload
        }
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        gameState: {
          ...state.gameState,
          messages: [...state.gameState.messages, action.payload]
        }
      };
    
    case 'NEXT_TURN':
      return {
        ...state,
        player: {
          ...state.player,
          turn: state.player.turn + 1
        },
        gameState: {
          ...state.gameState,
          currentDay: state.gameState.currentDay + 1
        }
      };
    
    case 'SET_PLAYER_NAME':
      return {
        ...state,
        player: {
          ...state.player,
          name: action.payload
        }
      };
    
    default:
      return state;
  }
};

// API Routes

// Initialize new game session
app.post('/api/game/init', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await redisClient.setEx(getGameKey(sessionId), 3600, JSON.stringify(initialGameState));
    
    res.json({ 
      success: true, 
      sessionId,
      gameState: initialGameState 
    });
  } catch (error) {
    console.error('Error initializing game:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current game state
app.get('/api/game/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const gameData = await redisClient.get(getGameKey(sessionId));
    
    if (!gameData) {
      return res.status(404).json({ success: false, error: 'Game session not found' });
    }
    
    const gameState = JSON.parse(gameData);
    res.json({ success: true, gameState });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update game state
app.post('/api/game/:sessionId/action', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body;
    
    const gameData = await redisClient.get(getGameKey(sessionId));
    if (!gameData) {
      return res.status(404).json({ success: false, error: 'Game session not found' });
    }
    
    const currentState = JSON.parse(gameData);
    const newState = gameReducer(currentState, action);
    
    await redisClient.setEx(getGameKey(sessionId), 3600, JSON.stringify(newState));
    
    res.json({ success: true, gameState: newState });
  } catch (error) {
    console.error('Error updating game state:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get drug prices for current location
app.get('/api/game/:sessionId/prices', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const gameData = await redisClient.get(getGameKey(sessionId));
    
    if (!gameData) {
      return res.status(404).json({ success: false, error: 'Game session not found' });
    }
    
    const gameState = JSON.parse(gameData);
    const currentDay = gameState.gameState.currentDay;
    const locationId = gameState.player.location;
    
    // Get prices from SQLite (with Redis caching)
    const sqlitePrices = await getDrugPrices(sessionId, currentDay, locationId);
    
    // Convert to simple price format for frontend
    const prices = {};
    Object.keys(sqlitePrices).forEach(drugId => {
      prices[drugId] = sqlitePrices[drugId].price;
    });
    
    res.json({ 
      success: true, 
      prices,
      source: 'sqlite', // Indicate data source
      day: currentDay,
      location: gameState.locations[locationId].name
    });
  } catch (error) {
    console.error('Error getting prices:', error);
    
    // Fallback to local calculation if both Redis and SQLite fail
    try {
      const gameData = await redisClient.get(getGameKey(req.params.sessionId));
      if (gameData) {
        const gameState = JSON.parse(gameData);
        const prices = {};
        
        gameState.drugs.forEach(drug => {
          const seed = drug.id * 100 + gameState.gameState.currentDay;
          const randomFactor = (Math.sin(seed) + 1) / 2;
          let price = drug.minPrice + randomFactor * (drug.maxPrice - drug.minPrice);
          
          const location = gameState.locations[gameState.player.location];
          if (location.name === 'Bronx' || location.name === 'Ghetto') {
            price *= 0.7;
          }
          
          if (drug.cheap) price /= 4;
          if (drug.expensive) price *= 4;
          
          prices[drug.id] = Math.floor(price);
        });
        
        return res.json({ 
          success: true, 
          prices,
          source: 'fallback',
          warning: 'Using fallback calculation - database unavailable'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback calculation also failed:', fallbackError);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// X OAuth Endpoints (Mock Implementation for Testing)
app.get('/api/auth/x', (req, res) => {
  try {
    console.log('X OAuth endpoint hit');
    
    // Generate a mock state and redirect to callback
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const mockAuthUrl = `http://localhost:${PORT}/api/auth/x/callback?state=${state}&code=mock_code_123`;
    
    // Redirect to callback after a short delay
    setTimeout(() => {
      res.redirect(mockAuthUrl);
    }, 1000);
    
  } catch (error) {
    console.error('X OAuth error:', error);
    res.status(500).json({ error: 'Failed to initiate X authentication' });
  }
});

app.get('/api/auth/x/callback', (req, res) => {
  try {
    const { state, code } = req.query;
    
    console.log('X OAuth callback hit:', { state, code });
    
    // Mock user data for testing
    const mockUser = {
      id: '123456789',
      username: 'dopewars_player',
      name: 'DopeWars Player',
      profile_image_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
    };
    
    // Generate session token
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    // Send success response to popup
    const htmlResponse = `
      <html>
        <head>
          <title>X Authentication</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              background: #000; 
              color: #00ffff; 
              text-align: center; 
              padding: 50px;
            }
            .success { 
              border: 2px solid #00ffff; 
              padding: 20px; 
              margin: 20px auto; 
              max-width: 400px;
              background: #001a1a;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>🎮 Authentication Successful!</h2>
            <p>Welcome to DopeWars, @${mockUser.username}!</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.opener.postMessage({
                type: 'X_AUTH_SUCCESS',
                token: '${sessionToken}',
                user: {
                  id: '${mockUser.id}',
                  username: '${mockUser.username}',
                  name: '${mockUser.name}',
                  profile_image_url: '${mockUser.profile_image_url}'
                }
              }, window.location.origin);
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `;
    
    res.send(htmlResponse);
  } catch (error) {
    console.error('X OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  // Test SQLite connection
  let sqliteStatus = 'unknown';
  db.get('SELECT 1', (err) => {
    if (err) {
      sqliteStatus = 'error';
    } else {
      sqliteStatus = 'connected';
    }
  });
  
  res.json({ 
    success: true, 
    message: 'DopeWars API is running',
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
    sqlite: sqliteStatus,
    database: 'dopewars_data.db'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DopeWars API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`SQLite database: dopewars_data.db`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await redisClient.quit();
    console.log('Redis connection closed');
  } catch (error) {
    console.log('Error closing Redis:', error.message);
  }
  
  try {
    db.close();
    console.log('SQLite database closed');
  } catch (error) {
    console.log('Error closing SQLite:', error.message);
  }
  
  process.exit(0);
});
