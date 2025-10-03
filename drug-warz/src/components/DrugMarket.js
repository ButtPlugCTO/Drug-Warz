import React, { useState, useEffect, memo } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import soundManager from '../utils/soundManager';

const MarketContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const MarketTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #00ffff;
  text-align: center;
`;

const DrugList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const DrugCard = styled.div`
  background: #001a1a;
  border: 2px solid #00ffff;
  padding: 15px;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const DrugName = styled.h3`
  margin: 0 0 10px 0;
  color: #00ffff;
  font-size: 16px;
`;

const DrugPrice = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const PriceIndicator = styled.span`
  color: ${props => {
    if (props.cheap) return '#00ffff';
    if (props.expensive) return '#ff0066';
    return '#ffff00';
  }};
`;

const TradeControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 15px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  padding: 8px;
  background: #001a1a;
  color: #00ffff;
  border: 2px solid #00ffff;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  text-align: center;
  font-size: 14px;
  min-height: 44px; /* Touch-friendly */
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #00cccc;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    background: #002222;
  }
  
  &:hover {
    border-color: #00cccc;
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: #006666;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 10px;
    font-size: 16px; /* Prevent zoom on iOS */
    min-height: 48px;
  }
`;

const TradeButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.buy ? '#00ffff' : '#ff0066'};
  color: ${props => props.buy ? '#000' : '#fff'};
  border: 1px solid ${props => props.buy ? '#00ffff' : '#ff0066'};
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch-friendly */
  
  &:hover {
    background: ${props => props.buy ? '#00cccc' : '#cc0055'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 10px 8px;
    font-size: 14px;
  }
`;

const StatusMessage = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: ${props => props.type === 'success' ? '#001a1a' : '#1a0000'};
  border: 1px solid ${props => props.type === 'success' ? '#00ffff' : '#ff0066'};
  color: ${props => props.type === 'success' ? '#00ffff' : '#ff0066'};
  font-size: 12px;
  text-align: center;
`;

const DrugMarket = memo(({ getCurrentDrugPrice }) => {
  const { state, actions } = useGame();
  const { drugs, player } = state;
  const [quantities, setQuantities] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  // Removed price caching to prevent flickering

  // Function to sanitize numeric input - only allow numbers
  const sanitizeNumericInput = (input) => {
    return input.replace(/[^0-9]/g, '');
  };

  const handleQuantityChange = (drugId, value) => {
    // Sanitize input to only allow numbers
    const sanitizedValue = sanitizeNumericInput(value);
    const numericValue = sanitizedValue === '' ? 0 : parseInt(sanitizedValue) || 0;
    
    setQuantities(prev => ({
      ...prev,
      [drugId]: sanitizedValue === '' ? '' : Math.max(0, numericValue)
    }));
  };

  const handleBuy = (drugId) => {
    const quantity = parseInt(quantities[drugId]) || 0;
    const price = getCurrentDrugPrice(drugId);
    const totalCost = quantity * price;
    
    if (quantity <= 0) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Enter a quantity to buy' });
      return;
    }
    
    if (player.cash < totalCost) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Not enough cash!' });
      return;
    }
    
    if (player.coatSize < quantity) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Not enough coat space!' });
      return;
    }
    
    actions.buyDrug(drugId, quantity, price);
    soundManager.playSound('cashRegister');
    setStatusMessage({ type: 'success', text: `Bought ${quantity} ${drugs.find(d => d.id === drugId).name} for $${totalCost.toLocaleString()}` });
    setQuantities(prev => ({ ...prev, [drugId]: '' }));
  };

  const handleSell = (drugId) => {
    const quantity = parseInt(quantities[drugId]) || 0;
    const playerDrug = player.drugs.find(d => d.id === drugId);
    
    if (!playerDrug || quantity <= 0) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Enter a valid quantity to sell' });
      return;
    }
    
    if (playerDrug.quantity < quantity) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: "You don't have that much!" });
      return;
    }
    
    const price = getCurrentDrugPrice(drugId);
    const totalRevenue = quantity * price;
    
    actions.sellDrug(drugId, quantity, price);
    soundManager.playSound('sell');
    setStatusMessage({ type: 'success', text: `Sold ${quantity} ${drugs.find(d => d.id === drugId).name} for $${totalRevenue.toLocaleString()}` });
    setQuantities(prev => ({ ...prev, [drugId]: '' }));
  };

  const getPlayerDrugQuantity = (drugId) => {
    const playerDrug = player.drugs.find(d => d.id === drugId);
    return playerDrug ? playerDrug.quantity : 0;
  };

  return (
    <MarketContainer>
      <MarketTitle>DRUG MARKET - {state.locations[state.player.location].name}</MarketTitle>
      
      <DrugList>
        {drugs.map((drug) => {
          const currentPrice = getCurrentDrugPrice(drug.id);
          const playerQuantity = getPlayerDrugQuantity(drug.id);
          const quantity = quantities[drug.id] || '';
          const totalCost = (parseInt(quantity) || 0) * currentPrice;
          
          return (
            <DrugCard key={drug.id}>
              <DrugName>{drug.name}</DrugName>
              <DrugPrice>
                Price: <PriceIndicator cheap={drug.cheap} expensive={drug.expensive}>
                  ${currentPrice.toLocaleString()}
                </PriceIndicator>
                {drug.cheap && ' (CHEAP!)'}
                {drug.expensive && ' (EXPENSIVE!)'}
              </DrugPrice>
              
              <div style={{ fontSize: '12px', marginBottom: '10px', color: '#00ffff' }}>
                Range: ${drug.minPrice.toLocaleString()} - ${drug.maxPrice.toLocaleString()}
              </div>
              
              <div style={{ fontSize: '12px', marginBottom: '10px', color: '#ffff00' }}>
                You have: {playerQuantity}
              </div>
              
              <TradeControls>
                <QuantityInput
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(drug.id, e.target.value)}
                />
                <TradeButton
                  buy
                  onClick={() => handleBuy(drug.id)}
                  disabled={!quantity || quantity <= 0 || player.cash < totalCost || player.coatSize < quantity}
                >
                  BUY (${totalCost.toLocaleString()})
                </TradeButton>
                <TradeButton
                  buy={false}
                  onClick={() => handleSell(drug.id)}
                  disabled={!quantity || quantity <= 0 || playerQuantity < quantity}
                >
                  SELL (${((parseInt(quantity) || 0) * currentPrice).toLocaleString()})
                </TradeButton>
              </TradeControls>
            </DrugCard>
          );
        })}
      </DrugList>
      
      {statusMessage && (
        <StatusMessage type={statusMessage.type}>
          {statusMessage.text}
        </StatusMessage>
      )}
    </MarketContainer>
  );
});

export default DrugMarket;
