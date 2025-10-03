import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import apiClient from '../utils/apiClient';

// Game state structure
const initialState = {
  player: {
    name: 'Player',
    cash: 2000,
    debt: 5000,
    bank: 0,
    health: 100,
    location: 3, // Start in Manhattan (like original)
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

// Game actions
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_DRUG_PRICES':
      return {
        ...state,
        drugs: state.drugs.map(drug => ({
          ...drug,
          cheap: Math.random() < 0.05, // Reduced from 10% to 5% chance
          expensive: Math.random() < 0.05 // Reduced from 10% to 5% chance
        }))
      };
    
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
    
    case 'TAKE_LOAN':
      return {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash + action.payload,
          debt: state.player.debt + action.payload
        }
      };
    
    case 'PAY_DEBT':
      const paymentAmount = Math.min(action.payload, state.player.debt, state.player.cash);
      return {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash - paymentAmount,
          debt: state.player.debt - paymentAmount
        }
      };
    
    case 'DEPOSIT_BANK':
      const depositAmount = Math.min(action.payload, state.player.cash);
      return {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash - depositAmount,
          bank: state.player.bank + depositAmount
        }
      };
    
    case 'WITHDRAW_BANK':
      const withdrawAmount = Math.min(action.payload, state.player.bank);
      return {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash + withdrawAmount,
          bank: state.player.bank - withdrawAmount
        }
      };
    
    case 'BUY_GUN':
      const gun = state.guns.find(g => g.id === action.payload);
      if (state.player.cash >= gun.price) {
        return {
          ...state,
          player: {
            ...state.player,
            cash: state.player.cash - gun.price,
            guns: [...state.player.guns, { ...gun, quantity: 1 }]
          }
        };
      }
      return state;
    
    case 'HEAL':
      const healCost = Math.min(action.payload, 100 - state.player.health, state.player.cash);
      return {
        ...state,
        player: {
          ...state.player,
          health: state.player.health + healCost,
          cash: state.player.cash - healCost
        }
      };
    
    case 'TAKE_DAMAGE':
      return {
        ...state,
        player: {
          ...state.player,
          health: Math.max(0, state.player.health - action.payload)
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
    
    case 'RANDOM_EVENT':
      return {
        ...state,
        gameState: {
          ...state.gameState,
          events: [...state.gameState.events, action.payload]
        }
      };
    
    case 'COP_ENCOUNTER':
      const { copDamage, copType } = action.payload;
      return {
        ...state,
        player: {
          ...state.player,
          health: Math.max(0, state.player.health - copDamage),
          cash: Math.max(0, state.player.cash - Math.floor(state.player.cash * 0.1)) // Lose 10% of cash
        }
      };
    
    case 'DEBT_INTEREST':
      const interestAmount = Math.floor(state.player.debt * 0.1);
      return {
        ...state,
        player: {
          ...state.player,
          debt: state.player.debt + interestAmount
        }
      };
    
    case 'FOUND_MONEY':
      return {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash + action.payload
        }
      };
    
    case 'LOAD_GAME_STATE':
      return action.payload;
    
    default:
      return state;
  }
};

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(false);
  const [apiConnected, setApiConnected] = React.useState(false);

  // Initialize game state (offline mode)
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        // Disable API connection for standalone game
        setApiConnected(false);
        console.log('Running in offline mode - no backend server required');
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, []);

  const gameActions = useMemo(() => ({
    buyDrug: async (drugId, quantity, price) => {
      const action = { type: 'BUY_DRUG', payload: { drugId, quantity, price } };
      dispatch(action);
      if (apiConnected) {
        try {
          const newState = await apiClient.performAction(action);
          dispatch({ type: 'LOAD_GAME_STATE', payload: newState });
        } catch (error) {
          console.error('Failed to sync buy drug action:', error);
        }
      }
    },
    
    sellDrug: async (drugId, quantity, price) => {
      const action = { type: 'SELL_DRUG', payload: { drugId, quantity, price } };
      dispatch(action);
      if (apiConnected) {
        try {
          const newState = await apiClient.performAction(action);
          dispatch({ type: 'LOAD_GAME_STATE', payload: newState });
        } catch (error) {
          console.error('Failed to sync sell drug action:', error);
        }
      }
    },
    
    changeLocation: async (locationId) => {
      const action = { type: 'CHANGE_LOCATION', payload: locationId };
      dispatch(action);
      if (apiConnected) {
        try {
          const newState = await apiClient.performAction(action);
          dispatch({ type: 'LOAD_GAME_STATE', payload: newState });
        } catch (error) {
          console.error('Failed to sync change location action:', error);
        }
      }
    },
    
    addMessage: (message) => 
      dispatch({ type: 'ADD_MESSAGE', payload: message }),
    
    nextTurn: async () => {
      const action = { type: 'NEXT_TURN' };
      dispatch(action);
      if (apiConnected) {
        try {
          const newState = await apiClient.performAction(action);
          dispatch({ type: 'LOAD_GAME_STATE', payload: newState });
        } catch (error) {
          console.error('Failed to sync next turn action:', error);
        }
      }
    },
    
    takeLoan: (amount) => 
      dispatch({ type: 'TAKE_LOAN', payload: amount }),
    
    payDebt: (amount) => 
      dispatch({ type: 'PAY_DEBT', payload: amount }),
    
    depositBank: (amount) => 
      dispatch({ type: 'DEPOSIT_BANK', payload: amount }),
    
    withdrawBank: (amount) => 
      dispatch({ type: 'WITHDRAW_BANK', payload: amount }),
    
    buyGun: (gunId) => 
      dispatch({ type: 'BUY_GUN', payload: gunId }),
    
    heal: (amount) => 
      dispatch({ type: 'HEAL', payload: amount }),
    
    takeDamage: (amount) => 
      dispatch({ type: 'TAKE_DAMAGE', payload: amount }),
    
    setPlayerName: (name) => 
      dispatch({ type: 'SET_PLAYER_NAME', payload: name }),
    
    triggerRandomEvent: (event) => 
      dispatch({ type: 'RANDOM_EVENT', payload: event }),
    
    copEncounter: (copDamage, copType) => 
      dispatch({ type: 'COP_ENCOUNTER', payload: { copDamage, copType } }),
    
    addDebtInterest: () => 
      dispatch({ type: 'DEBT_INTEREST' }),
    
    foundMoney: (amount) => 
      dispatch({ type: 'FOUND_MONEY', payload: amount })
  }), [dispatch, apiConnected]);

  const contextValue = useMemo(() => ({
    state,
    actions: gameActions,
    isLoading,
    apiConnected
  }), [state, gameActions, isLoading, apiConnected]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
