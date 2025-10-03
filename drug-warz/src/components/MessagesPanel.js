import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import soundManager from '../utils/soundManager';

const MessagesContainer = styled.div`
  height: 100%;
  padding: 15px 15px 0 15px;
  background: #000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: 10px 10px 0 10px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 8px 0 8px;
  }
`;

const MessagesTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #00ffff;
  font-size: 14px;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #001a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #00ffff;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #00cccc;
  }
`;

const MessageItem = styled.div`
  margin-bottom: 5px;
  padding: 5px;
  font-size: 12px;
  color: #00ffff;
  background: ${props => props.type === 'system' ? '#001a1a' : 'transparent'};
  border-left: 2px solid ${props => {
    switch (props.type) {
      case 'error': return '#ff0066';
      case 'success': return '#00ffff';
      case 'warning': return '#ffff00';
      default: return '#00ffff';
    }
  }};
`;

const MessagesContent = styled.div`
  flex: 1;
  padding-bottom: 15px;
`;

const GameMessages = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #00ffff;
`;

const TurnButton = styled.button`
  width: 100%;
  padding: 15px;
  background: #00ffff;
  color: #000;
  border: 2px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 50px;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  position: sticky;
  bottom: 0;
  z-index: 10;
  
  &:hover {
    background: #00cccc;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
    min-height: 48px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
    min-height: 46px;
    letter-spacing: 0.5px;
  }
`;

const MessagesPanel = ({ onStartCombat }) => {
  const { state, actions } = useGame();
  const { gameState } = state;
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gameState.messages]);

  // Add some sample messages for demo
  useEffect(() => {
    const sampleMessages = [
      { type: 'system', text: 'Welcome to Drug Warz! Your goal is to make money and pay off your debt.' },
      { type: 'system', text: 'Buy drugs when prices are cheap, sell when they are expensive.' },
      { type: 'warning', text: 'Watch out for cops in dangerous areas!' }
    ];

    sampleMessages.forEach((msg, index) => {
      setTimeout(() => {
        actions.addMessage(msg);
      }, index * 1000);
    });
  }, [actions]);

  const handleNextTurn = () => {
    actions.nextTurn();
    soundManager.playSound('nextTurn');
    
    // Random events
    const events = [
      { type: 'system', text: 'Another day in the streets...' },
      { type: 'warning', text: 'You hear sirens in the distance...' },
      { type: 'system', text: 'The city never sleeps...' },
      { type: 'success', text: 'You found some money on the ground!' },
      { type: 'warning', text: 'A shady character is watching you...' },
      { type: 'system', text: 'The drug prices are fluctuating...' }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    actions.addMessage(randomEvent);
    
    // Debt interest
    if (state.player.debt > 0) {
      actions.addDebtInterest();
      const interest = Math.floor(state.player.debt * 0.1);
      actions.addMessage({ 
        type: 'warning', 
        text: `Interest added to debt: $${interest.toLocaleString()}` 
      });
    }
    
    // Random cop encounter based on location police presence
    const currentLocation = state.locations[state.player.location];
    const encounterChance = currentLocation.policePresence * 0.1; // 10% per police level
    
    if (Math.random() < encounterChance) {
      const copTypes = ['Beat Cop', 'Detective', 'Sergeant', 'Lieutenant', 'Captain'];
      const copType = copTypes[Math.min(currentLocation.policePresence - 1, copTypes.length - 1)];
      
      soundManager.playSound('siren');
      actions.addMessage({ 
        type: 'warning', 
        text: `${copType} spotted you! Prepare for combat!` 
      });
      
      // Start combat instead of just taking damage
      setTimeout(() => {
        onStartCombat(copType);
      }, 1000);
    }
    
    // Random money find
    if (Math.random() < 0.1) { // 10% chance
      const foundMoney = Math.floor(Math.random() * 500) + 100;
      actions.foundMoney(foundMoney);
      soundManager.playSound('money');
      actions.addMessage({ 
        type: 'success', 
        text: `You found $${foundMoney} on the ground!` 
      });
    }
  };

  return (
    <MessagesContainer>
      <MessagesTitle>MESSAGES</MessagesTitle>
      
      <MessagesContent>
        <MessageList>
          {gameState.messages.map((message, index) => (
            <MessageItem key={index} type={message.type}>
              {message.text}
            </MessageItem>
          ))}
          <div ref={messagesEndRef} />
        </MessageList>
      </MessagesContent>
      
      <GameMessages>
        <TurnButton onClick={handleNextTurn}>
          NEXT TURN
        </TurnButton>
      </GameMessages>
    </MessagesContainer>
  );
};

export default MessagesPanel;
