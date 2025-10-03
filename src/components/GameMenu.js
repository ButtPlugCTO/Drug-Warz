import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  width: 200px;
  padding: 20px;
  border-right: 2px solid #00ffff;
  background: #001a1a;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 15px;
    border-right: none;
    border-bottom: 2px solid #00ffff;
    display: flex;
    flex-direction: row;
    gap: 10px;
    overflow-x: auto;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    gap: 8px;
  }
`;

const MenuTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #00ffff;
  
  @media (max-width: 768px) {
    margin: 0 10px 0 0;
    white-space: nowrap;
  }
  
  @media (max-width: 480px) {
    margin: 0 8px 0 0;
    font-size: 14px;
  }
`;

const MenuButton = styled.button`
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: ${props => props.active ? '#00ffff' : 'transparent'};
  color: ${props => props.active ? '#000' : '#00ffff'};
  border: 1px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch-friendly */
  
  &:hover {
    background: #00ffff;
    color: #000;
  }
  
  @media (max-width: 768px) {
    width: auto;
    min-width: 140px;
    margin-bottom: 0;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  @media (max-width: 480px) {
    min-width: 120px;
    padding: 8px 10px;
    font-size: 12px;
  }
`;

const GameMenu = ({ currentView, setCurrentView }) => {
  return (
    <MenuContainer>
      <MenuTitle>MENU</MenuTitle>
      
      <MenuButton
        active={currentView === 'market'}
        onClick={() => setCurrentView('market')}
      >
        DRUG MARKET
      </MenuButton>
      
      <MenuButton
        active={currentView === 'special'}
        onClick={() => setCurrentView('special')}
      >
        SPECIAL LOCATIONS
      </MenuButton>
    </MenuContainer>
  );
};

export default GameMenu;
