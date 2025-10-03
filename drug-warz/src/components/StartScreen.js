import React, { useState, memo } from 'react';
import styled from 'styled-components';

const StartContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const Title = styled.h1`
  color: #00ffff;
  font-size: 64px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px #00ffff;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  @media (max-width: 480px) {
    font-size: 36px;
    margin-bottom: 10px;
  }
`;

const Subtitle = styled.div`
  color: #00ffff;
  font-size: 18px;
  margin-bottom: 40px;
  text-align: center;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 30px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
`;

const NameInput = styled.input`
  padding: 15px;
  background: #001a1a;
  color: #00ffff;
  border: 2px solid #00ffff;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-align: center;
  margin-bottom: 30px;
  width: 300px;
  max-width: 90%;
  box-sizing: border-box;
  min-height: 50px;
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #00cccc;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
    background: #002222;
  }
  
  &:hover {
    border-color: #00cccc;
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: #006666;
  }
  
  @media (max-width: 768px) {
    width: 280px;
    padding: 12px;
    font-size: 16px;
    min-height: 48px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 12px;
    font-size: 16px; /* Prevent zoom on iOS */
    margin-bottom: 20px;
    min-height: 48px;
  }
`;

const StartButton = styled.button`
  padding: 15px 40px;
  background: #00ffff;
  color: #000;
  border: 2px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 48px; /* Touch-friendly minimum size */
  
  &:hover {
    background: #00cccc;
    box-shadow: 0 0 20px #00ffff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 12px 30px;
    font-size: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 10px 25px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
  }
`;

const Instructions = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  color: #666;
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
`;

const StartScreen = memo(({ onStart }) => {
  const [playerName, setPlayerName] = useState('');

  // Function to sanitize input - only allow letters, numbers, and spaces
  const sanitizeInput = (input) => {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  };

  const handleNameChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    setPlayerName(sanitized);
  };

  const handleStart = () => {
    if (playerName.trim()) {
      onStart(playerName.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <StartContainer>
      <Title>DRUG WARZ</Title>
      <Subtitle>
        A React remake of the classic drug dealing simulation
      </Subtitle>
      
      <NameInput
        type="text"
        placeholder="Enter your name..."
        value={playerName}
        onChange={handleNameChange}
        onKeyPress={handleKeyPress}
        maxLength={20}
      />
      
      <StartButton 
        onClick={handleStart}
        disabled={!playerName.trim()}
      >
        START GAME
      </StartButton>
      
      <Instructions>
        You start with $2,000 cash and $5,000 debt.<br/>
        Buy drugs cheap, sell them expensive. Avoid the cops!<br/>
        Pay off your debt before it's too late.
      </Instructions>
    </StartContainer>
  );
});

export default StartScreen;
