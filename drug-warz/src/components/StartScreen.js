import React, { useState, memo } from 'react';
import styled from 'styled-components';
import ParticleBackground from './ParticleBackground';
import soundManager from '../utils/soundManager';

const StartContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  background: #000000;
  display: flex;
  flex-direction: column;
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
  font-size: 72px;
  margin-top: 40px;
  margin-bottom: 60px;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-weight: 900;
  letter-spacing: 8px;
  position: relative;
  text-shadow: 0 0 20px #00ffff;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
    animation: underlineGlow 2s ease-in-out infinite alternate;
  }
  
  @keyframes underlineGlow {
    0% { box-shadow: 0 0 5px #00ffff; }
    100% { box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
  }
  
  @media (max-width: 768px) {
    font-size: 56px;
    margin-top: 30px;
    margin-bottom: 50px;
    letter-spacing: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 42px;
    margin-top: 20px;
    margin-bottom: 40px;
    letter-spacing: 4px;
  }
`;

const Subtitle = styled.div`
  color: #888;
  font-size: 16px;
  margin-bottom: 50px;
  text-align: center;
  line-height: 1.4;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 40px;
  }
  
  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 30px;
  }
`;

const NameInput = styled.input`
  padding: 18px 24px;
  background: #111;
  color: #00ffff;
  border: 1px solid #333;
  border-radius: 0;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-align: center;
  margin-bottom: 40px;
  width: 320px;
  max-width: 90%;
  box-sizing: border-box;
  min-height: 56px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 0 1px #00ffff;
    background: #0a0a0a;
  }
  
  &:hover {
    border-color: #555;
  }
  
  &::placeholder {
    color: #666;
    text-transform: none;
    letter-spacing: normal;
  }
  
  @media (max-width: 768px) {
    width: 300px;
    padding: 16px 20px;
    font-size: 16px;
    min-height: 52px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 14px 18px;
    font-size: 16px;
    margin-bottom: 30px;
    min-height: 50px;
  }
`;

const StartButton = styled.button`
  padding: 18px 48px;
  background: #00ffff;
  color: #000;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #00cccc;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    
    &:hover {
      &::before {
        opacity: 0;
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 16px 40px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 14px 32px;
    font-size: 12px;
    width: 100%;
    max-width: 200px;
  }
`;

const ContractAddress = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ffff;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #00ffff;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: #00cccc;
  }
  
  &:active {
    background: rgba(0, 255, 255, 0.2);
  }
  
  @media (max-width: 768px) {
    top: 15px;
    right: 15px;
    font-size: 9px;
    padding: 6px 10px;
  }
  
  @media (max-width: 480px) {
    top: 10px;
    right: 10px;
    font-size: 8px;
    padding: 5px 8px;
  }
`;

const Instructions = styled.div`
  position: absolute;
  bottom: 30px;
  left: 30px;
  right: 30px;
  color: #666;
  font-size: 12px;
  text-align: center;
  line-height: 1.8;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 11px;
    bottom: 20px;
    left: 20px;
    right: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 10px;
    bottom: 15px;
    left: 15px;
    right: 15px;
  }
`;

const InstructionSection = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InstructionTitle = styled.div`
  color: #00ffff;
  font-weight: bold;
  margin-bottom: 4px;
`;

const InstructionText = styled.div`
  color: #888;
`;

const StartScreen = memo(({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Contract address - you can replace this with your actual contract address
  const contractAddress = "0x1234567890abcdef1234567890abcdef12345678";

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
      // Test sound system on first user interaction
      soundManager.playSound('gameStart');
      onStart(playerName.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = contractAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <StartContainer>
      <ParticleBackground />
      <ContractAddress onClick={handleCopyContract}>
        {copied ? 'COPIED!' : `CONTRACT: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}
      </ContractAddress>
      <Title>DRUG WARZ</Title>
      
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
        <InstructionSection>
          <InstructionTitle>🎯 OBJECTIVE</InstructionTitle>
          <InstructionText>Start with $2,000 cash and $5,000 debt. Make money by buying drugs cheap and selling expensive. Pay off your debt to win!</InstructionText>
        </InstructionSection>
        
        <InstructionSection>
          <InstructionTitle>📍 LOCATIONS</InstructionTitle>
          <InstructionText>Manhattan (safe) • Brooklyn (moderate) • Queens (moderate) • Bronx (dangerous) • Staten Island (safest) • Ghetto (most dangerous)</InstructionText>
        </InstructionSection>
        
        <InstructionSection>
          <InstructionTitle>🏪 SPECIAL PLACES</InstructionTitle>
          <InstructionText>Bank (deposit money) • Hospital (heal wounds) • Gun Shop (buy weapons) • Loan Shark (borrow money)</InstructionText>
        </InstructionSection>
        
        <InstructionSection>
          <InstructionTitle>⚠️ SURVIVAL TIPS</InstructionTitle>
          <InstructionText>Watch for CHEAP/EXPENSIVE prices • Buy weapons for protection • Bank your money • Avoid cops in dangerous areas</InstructionText>
        </InstructionSection>
      </Instructions>
    </StartContainer>
  );
});

export default StartScreen;
