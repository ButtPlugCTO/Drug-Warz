import React, { useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';

const InventoryContainer = styled.div`
  padding: 15px;
  flex: 1;
  overflow-y: auto;
  min-width: 200px;
  
  @media (max-width: 768px) {
    padding: 10px;
    min-width: 150px;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    min-width: 120px;
  }
`;

const InventoryTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #00ffff;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 8px;
  background: ${props => props.active ? '#00ffff' : 'transparent'};
  color: ${props => props.active ? '#000' : '#00ffff'};
  border: 1px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  
  &:first-child {
    border-right: none;
  }
`;

const InventoryList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    max-height: 200px;
  }
  
  @media (max-width: 480px) {
    max-height: 150px;
  }
`;

const InventoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  background: #001a1a;
  border: 1px solid #00ffff;
  font-size: 12px;
`;

const ItemName = styled.div`
  color: #00ffff;
  font-weight: bold;
`;

const ItemQuantity = styled.div`
  color: #ffff00;
`;

const ItemDetails = styled.div`
  color: #00ffff;
  font-size: 10px;
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
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No drugs in inventory
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
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No guns in inventory
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
