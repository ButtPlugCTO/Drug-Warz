import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useGame } from './context/GameContext';
import apiClient from './utils/apiClient';
import PlayerStats from './components/PlayerStats';
import LocationPanel from './components/LocationPanel';
import InventoryPanel from './components/InventoryPanel';
import DrugMarket from './components/DrugMarket';
import SpecialLocations from './components/SpecialLocations';
import MessagesPanel from './components/MessagesPanel';
import GameMenu from './components/GameMenu';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import CombatSystem from './components/CombatSystem';
import VictoryScreen from './components/VictoryScreen';
import soundManager from './utils/soundManager';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: #000;
  color: #00ffff;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  min-height: 100vh;
  
  /* Custom scrollbar styling */
  * {
    scrollbar-width: thin;
    scrollbar-color: #00ffff #001a1a;
  }
  
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: #001a1a;
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb {
    background: #00ffff;
    border-radius: 4px;
    border: 1px solid #001a1a;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: #00cccc;
  }
  
  *::-webkit-scrollbar-corner {
    background: #001a1a;
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  border-bottom: 2px solid #00ffff;
  background: #001a1a;
  min-height: 60px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 15px;
    gap: 5px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 10px;
  }
`;

const GameTitle = styled.h1`
  margin: 0;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
  font-size: 24px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const TurnInfo = styled.div`
  font-size: 14px;
  color: #00ffff;
  
  @media (max-width: 768px) {
    font-size: 12px;
    line-height: 1.3;
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const MainGameArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #00ffff;
  background: #001a1a;
  flex-shrink: 0;
  min-height: 0;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: 35vh;
    border-right: none;
    border-bottom: 2px solid #00ffff;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  @media (max-width: 480px) {
    max-height: 30vh;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
`;

const TopRightPanel = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BottomPanel = styled.div`
  height: 200px;
  border-top: 2px solid #00ffff;
  background: #001a1a;
  flex-shrink: 0;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 140px;
  }
  
  @media (max-width: 480px) {
    height: 100px;
  }
`;

function App() {
  const { state, actions, isLoading, apiConnected } = useGame();
  const [currentView, setCurrentView] = useState('market');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [victory, setVictory] = useState(false);
  const [inCombat, setInCombat] = useState(false);
  const [combatEnemy, setCombatEnemy] = useState(null);
  const [drugPrices, setDrugPrices] = useState({});
  const [priceSource, setPriceSource] = useState('unknown');

  // Load drug prices (offline mode uses local calculation)
  useEffect(() => {
    const loadDrugPrices = async () => {
      if (apiConnected) {
        try {
          const priceData = await apiClient.getDrugPrices();
          setDrugPrices(priceData.prices);
          setPriceSource(priceData.source);
          
          if (priceData.warning) {
            console.warn('Price warning:', priceData.warning);
          }
          
          console.log(`Prices loaded from ${priceData.source} for ${priceData.location} on day ${priceData.day}`);
        } catch (error) {
          console.error('Failed to load drug prices:', error);
          setPriceSource('error');
        }
      } else {
        // Offline mode - use local price calculation
        setPriceSource('local');
      }
    };

    loadDrugPrices();
  }, [apiConnected, state.player.location, state.gameState.currentDay]);

  const getCurrentDrugPrice = useCallback((drugId) => {
    // Use API prices if available
    if (apiConnected && drugPrices[drugId] !== undefined) {
      return drugPrices[drugId];
    }

    // Fallback to local calculation (exact same as source code)
    const drug = state.drugs.find(d => d.id === drugId);
    if (!drug) return 0;
    
    const seed = drugId * 100 + state.gameState.currentDay;
    const randomFactor = (Math.sin(seed) + 1) / 2;
    let price = drug.minPrice + randomFactor * (drug.maxPrice - drug.minPrice);
    
    const location = state.locations[state.player.location];
    if (location.name === 'Bronx' || location.name === 'Ghetto') {
      price *= 0.7;
    }
    
    if (drug.cheap) price /= 4;
    if (drug.expensive) price *= 4;
    
    return Math.floor(price);
  }, [apiConnected, drugPrices, state.drugs, state.gameState.currentDay, state.player.location, state.locations]);

  // Game over and victory conditions
  useEffect(() => {
    if (state.player.health <= 0) {
      setGameOver('health');
    } else if (state.player.debt > 50000) {
      setGameOver('debt');
    } else if (state.player.debt <= 0 && state.player.cash >= 10000) {
      setVictory(true);
    }
  }, [state.player.health, state.player.debt, state.player.cash]);

  const handleStartGame = useCallback((playerName) => {
    actions.setPlayerName(playerName);
    setGameStarted(true);
    soundManager.playSound('success');
  }, [actions]);

  const handleRestart = useCallback(() => {
    // Reset game state
    window.location.reload();
  }, []);

  const handleCombatEnd = useCallback((result) => {
    setInCombat(false);
    setCombatEnemy(null);
    
    if (result === 'victory') {
      // Give some cash reward
      actions.foundMoney(1000);
      soundManager.playSound('victory');
    } else if (result === 'defeat') {
      soundManager.playSound('death');
    } else if (result === 'fled') {
      soundManager.playSound('flee');
    }
  }, [actions]);

  const getFinalStats = () => {
    return {
      cash: state.player.cash,
      days: state.gameState.currentDay,
      turns: state.player.turn,
      drugsSold: state.player.drugs.reduce((total, drug) => total + drug.quantity, 0),
      enemiesDefeated: 0 // Could track this in state if needed
    };
  };

  // Show start screen
  if (!gameStarted) {
    return <StartScreen onStart={handleStartGame} />;
  }

  // Show victory screen
  if (victory) {
    return <VictoryScreen finalStats={getFinalStats()} onRestart={handleRestart} />;
  }

  // Show game over screen
  if (gameOver) {
    return <GameOverScreen reason={gameOver} onRestart={handleRestart} />;
  }

  // Show combat screen
  if (inCombat) {
    return <CombatSystem enemy={combatEnemy} onEndCombat={handleCombatEnd} />;
  }

  return (
    <AppContainer>
      <GameHeader>
        <GameTitle>DRUG WARZ</GameTitle>
        <TurnInfo>
          Day {state.gameState.currentDay} | Turn {state.player.turn} | {state.locations[state.player.location].name}
          {isLoading && <span style={{ color: '#ffff00' }}> | Loading...</span>}
          {apiConnected ? (
            <span style={{ color: '#00ff00' }}> | Redis Connected</span>
          ) : (
            <span style={{ color: '#00ffff' }}> | Offline Mode</span>
          )}
          {priceSource === 'local' && <span style={{ color: '#00ff00' }}> | Local Prices</span>}
          {priceSource === 'sqlite' && <span style={{ color: '#00ffff' }}> | SQLite Prices</span>}
          {priceSource === 'fallback' && <span style={{ color: '#ffff00' }}> | Fallback Prices</span>}
          {priceSource === 'error' && <span style={{ color: '#ff0066' }}> | Price Error</span>}
        </TurnInfo>
      </GameHeader>
      
      <MainGameArea>
        <LeftPanel>
          <PlayerStats />
          <LocationPanel />
          <InventoryPanel />
        </LeftPanel>
        
        <RightPanel>
          <TopRightPanel>
            <GameMenu currentView={currentView} setCurrentView={setCurrentView} />
            {currentView === 'market' && <DrugMarket getCurrentDrugPrice={getCurrentDrugPrice} />}
            {currentView === 'special' && <SpecialLocations />}
          </TopRightPanel>
          
          <BottomPanel>
            <MessagesPanel onStartCombat={(enemy) => {
              setCombatEnemy(enemy);
              setInCombat(true);
            }} />
          </BottomPanel>
        </RightPanel>
      </MainGameArea>
    </AppContainer>
  );
}

export default App;
