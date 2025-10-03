import React from 'react';
import styled from 'styled-components';

const VictoryContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const VictoryTitle = styled.h1`
  color: #0f0;
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 0 0 20px #0f0;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const VictoryMessage = styled.div`
  color: #0f0;
  font-size: 18px;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const StatsContainer = styled.div`
  background: #001100;
  border: 2px solid #0f0;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #0f0;
`;

const StatLabel = styled.span`
  font-weight: bold;
`;

const StatValue = styled.span`
  color: #ff0;
`;

const RestartButton = styled.button`
  padding: 15px 30px;
  background: #0f0;
  color: #000;
  border: 2px solid #0f0;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #00ff00;
    box-shadow: 0 0 20px #0f0;
  }
`;

const VictoryScreen = ({ finalStats, onRestart }) => {
  return (
    <VictoryContainer>
      <VictoryTitle>VICTORY!</VictoryTitle>
      <VictoryMessage>
        Congratulations! You've successfully paid off your debt and made it big in the streets!
      </VictoryMessage>
      
      <StatsContainer>
        <h3 style={{ color: '#00ffff', margin: '0 0 15px 0' }}>Final Statistics</h3>
        <StatRow>
          <StatLabel>Final Cash:</StatLabel>
          <StatValue>${finalStats.cash.toLocaleString()}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Days Survived:</StatLabel>
          <StatValue>{finalStats.days}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Total Turns:</StatLabel>
          <StatValue>{finalStats.turns}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Drugs Sold:</StatLabel>
          <StatValue>{finalStats.drugsSold || 0}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Enemies Defeated:</StatLabel>
          <StatValue>{finalStats.enemiesDefeated || 0}</StatValue>
        </StatRow>
      </StatsContainer>
      
      <RestartButton onClick={onRestart}>
        PLAY AGAIN
      </RestartButton>
    </VictoryContainer>
  );
};

export default VictoryScreen;
