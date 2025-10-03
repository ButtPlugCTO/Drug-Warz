import React from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';

const StatsContainer = styled.div`
  padding: 15px;
  border-bottom: 1px solid #00ffff;
  min-width: 200px;
  
  @media (max-width: 768px) {
    padding: 10px;
    min-width: 150px;
    flex-shrink: 0;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    min-width: 120px;
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
    margin-bottom: 4px;
  }
`;

const StatLabel = styled.span`
  color: #00ffff;
`;

const StatValue = styled.span`
  color: ${props => props.color || '#00ffff'};
  font-weight: bold;
`;

const HealthBar = styled.div`
  width: 100%;
  height: 20px;
  background: #000;
  border: 1px solid #00ffff;
  margin-top: 10px;
  position: relative;
  
  @media (max-width: 768px) {
    height: 16px;
    margin-top: 8px;
  }
  
  @media (max-width: 480px) {
    height: 14px;
    margin-top: 6px;
  }
`;

const HealthFill = styled.div`
  height: 100%;
  background: ${props => props.health > 50 ? '#00ffff' : props.health > 25 ? '#ffff00' : '#ff0066'};
  width: ${props => props.health}%;
  transition: width 0.3s ease;
`;

const HealthText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #000;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 9px;
  }
`;

const CoatSizeBar = styled.div`
  width: 100%;
  height: 20px;
  background: #000;
  border: 1px solid #ffff00;
  margin-top: 10px;
  position: relative;
  
  @media (max-width: 768px) {
    height: 16px;
    margin-top: 8px;
  }
  
  @media (max-width: 480px) {
    height: 14px;
    margin-top: 6px;
  }
`;

const CoatSizeFill = styled.div`
  height: 100%;
  background: #ffff00;
  width: ${props => Math.min(100, (props.coatSize / 100) * 100)}%;
  transition: width 0.3s ease;
`;

const CoatSizeText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #000;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 9px;
  }
`;

const PlayerStats = () => {
  const { state } = useGame();
  const { player } = state;

  const formatMoney = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  // Debug: Log player data
  console.log('PlayerStats - player data:', player);

  return (
    <StatsContainer>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ffff' }}>PLAYER STATS</h3>
      
      <StatRow>
        <StatLabel>Name:</StatLabel>
        <StatValue>{player.name}</StatValue>
      </StatRow>
      
      <StatRow>
        <StatLabel>Cash:</StatLabel>
        <StatValue color="#00ffff">{formatMoney(player.cash)}</StatValue>
      </StatRow>
      
      <StatRow>
        <StatLabel>Bank:</StatLabel>
        <StatValue color="#00ffff">{formatMoney(player.bank)}</StatValue>
      </StatRow>
      
      <StatRow>
        <StatLabel>Debt:</StatLabel>
        <StatValue color="#ff0066">{formatMoney(player.debt)}</StatValue>
      </StatRow>
      
      <StatRow>
        <StatLabel>Coat Size:</StatLabel>
        <StatValue color="#ffff00">{player.coatSize || 'N/A'}</StatValue>
      </StatRow>
      
      <StatRow>
        <StatLabel>Bitches:</StatLabel>
        <StatValue color="#ff00ff">{player.bitches}</StatValue>
      </StatRow>
      
      <HealthBar>
        <HealthFill health={player.health} />
        <HealthText>{player.health}/100</HealthText>
      </HealthBar>
    </StatsContainer>
  );
};

export default PlayerStats;
