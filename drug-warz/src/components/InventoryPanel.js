import React, { useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';

const InventoryContainer = styled.div`
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 6px;
  }
`;

const InventoryTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #00ffff;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #00ffff;
  padding-bottom: 5px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 6px;
  background: ${props => props.active ? '#00ffff' : 'transparent'};
  color: ${props => props.active ? '#000' : '#00ffff'};
  border: 1px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:first-child {
    border-right: none;
  }
  
  &:hover {
    background: ${props => props.active ? '#00ffff' : 'rgba(0, 255, 255, 0.1)'};
  }
`;

const InventoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  
  /* Custom scrollbar */
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
`;

const InventoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  margin-bottom: 4px;
  background: #001a1a;
  border: 1px solid #00ffff;
  font-size: 11px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #002222;
    border-color: #00cccc;
  }
`;

const ItemName = styled.div`
  color: #00ffff;
  font-weight: bold;
  font-size: 11px;
`;

const ItemQuantity = styled.div`
  color: #ffff00;
  font-weight: bold;
  font-size: 12px;
`;

const ItemDetails = styled.div`
  color: #888;
  font-size: 9px;
  margin-top: 2px;
`;

const InventoryPanel = () => {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState('drugs');
  const { player, drugs, guns } = state;

  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id === drugId);
    return drug ? drug.name : 'Unknown';
  };

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : 'Unknown';
  };

  const getGunDetails = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? `Dmg: ${gun.damage}, Space: ${gun.space}` : '';
  };

  return (
    <InventoryContainer>
      <InventoryTitle>INVENTORY</InventoryTitle>
      {/* Debug info - remove this later */}
      <div style={{ 
        fontSize: '9px', 
        color: '#666', 
        textAlign: 'center', 
        marginBottom: '5px',
        border: '1px solid #333',
        padding: '2px',
        background: '#001111'
      }}>
        Debug: Drugs: {player.drugs.length}, Guns: {player.guns.length}
      </div>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'drugs'} 
          onClick={() => setActiveTab('drugs')}
        >
          DRUGS
        </Tab>
        <Tab 
          active={activeTab === 'guns'} 
          onClick={() => setActiveTab('guns')}
        >
          GUNS
        </Tab>
      </TabContainer>
      
      <InventoryList>
        {activeTab === 'drugs' && (
          <>
            {player.drugs.length === 0 ? (
              <div style={{ 
                color: '#00ffff', 
                textAlign: 'center', 
                padding: '20px', 
                fontSize: '12px',
                border: '1px dashed #00ffff',
                background: 'rgba(0, 255, 255, 0.05)',
                borderRadius: '4px',
                margin: '10px 0'
              }}>
                📦 No drugs in inventory<br/>
                <span style={{ fontSize: '10px', color: '#888' }}>
                  Buy drugs from the market to see them here
                </span>
              </div>
            ) : (
              player.drugs.map((drug, index) => (
                <InventoryItem key={index}>
                  <div>
                    <ItemName>{getDrugName(drug.id)}</ItemName>
                    <ItemDetails>ID: {drug.id}</ItemDetails>
                  </div>
                  <ItemQuantity>{drug.quantity}</ItemQuantity>
                </InventoryItem>
              ))
            )}
          </>
        )}
        
        {activeTab === 'guns' && (
          <>
            {player.guns.length === 0 ? (
              <div style={{ 
                color: '#00ffff', 
                textAlign: 'center', 
                padding: '20px', 
                fontSize: '12px',
                border: '1px dashed #00ffff',
                background: 'rgba(0, 255, 255, 0.05)',
                borderRadius: '4px',
                margin: '10px 0'
              }}>
                🔫 No guns in inventory<br/>
                <span style={{ fontSize: '10px', color: '#888' }}>
                  Buy guns from the gun shop to see them here
                </span>
              </div>
            ) : (
              player.guns.map((gun, index) => (
                <InventoryItem key={index}>
                  <div>
                    <ItemName>{getGunName(gun.id)}</ItemName>
                    <ItemDetails>{getGunDetails(gun.id)}</ItemDetails>
                  </div>
                  <ItemQuantity>{gun.quantity || 1}</ItemQuantity>
                </InventoryItem>
              ))
            )}
          </>
        )}
      </InventoryList>
    </InventoryContainer>
  );
};

export default InventoryPanel;
