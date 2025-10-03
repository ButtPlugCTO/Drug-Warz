// API Client for Drug Warz
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.sessionId = null;
  }

  // Initialize a new game session
  async initGame() {
    try {
      const response = await fetch(`${API_BASE_URL}/game/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: this.sessionId })
      });
      
      const data = await response.json();
      if (data.success) {
        this.sessionId = data.sessionId;
        return data.gameState;
      }
      throw new Error(data.error || 'Failed to initialize game');
    } catch (error) {
      console.error('Error initializing game:', error);
      throw error;
    }
  }

  // Get current game state
  async getGameState() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/game/${this.sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.gameState;
      }
      throw new Error(data.error || 'Failed to get game state');
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  // Perform a game action
  async performAction(action) {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/game/${this.sessionId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.gameState;
      }
      throw new Error(data.error || 'Failed to perform action');
    } catch (error) {
      console.error('Error performing action:', error);
      throw error;
    }
  }

  // Get drug prices for current location
  async getDrugPrices() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/game/${this.sessionId}/prices`);
      const data = await response.json();
      
      if (data.success) {
        return {
          prices: data.prices,
          source: data.source || 'unknown',
          day: data.day,
          location: data.location,
          warning: data.warning
        };
      }
      throw new Error(data.error || 'Failed to get drug prices');
    } catch (error) {
      console.error('Error getting drug prices:', error);
      throw error;
    }
  }

  // Check API health
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get current session ID
  getSessionId() {
    return this.sessionId;
  }

  // Set session ID (for reconnecting to existing game)
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
