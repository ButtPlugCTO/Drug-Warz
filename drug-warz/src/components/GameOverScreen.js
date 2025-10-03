import React from 'react';
import styled from 'styled-components';

const GameOverContainer = styled.div`
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

const GameOverTitle = styled.h1`
  color: #f00;
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 0 0 20px #f00;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const GameOverMessage = styled.div`
  color: #0f0;
  font-size: 18px;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
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

const GameOverScreen = ({ reason, onRestart }) => {
  const getGameOverMessage = () => {
    switch (reason) {
      case 'health':
        return 'You died from your wounds! The streets got the best of you.';
      case 'debt':
        return 'Your debt became too much to handle! The loan sharks got you.';
      default:
        return 'Game Over! Better luck next time.';
    }
  };

  return (
    <GameOverContainer>
      <GameOverTitle>GAME OVER</GameOverTitle>
      <GameOverMessage>
        {getGameOverMessage()}
      </GameOverMessage>
      <RestartButton onClick={onRestart}>
        TRY AGAIN
      </RestartButton>
    </GameOverContainer>
  );
};

export default GameOverScreen;
