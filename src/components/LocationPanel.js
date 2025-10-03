import React from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import soundManager from '../utils/soundManager';

const LocationContainer = styled.div`
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

const LocationTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #00ffff;
`;

const LocationItem = styled.button`
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 5px;
  background: ${props => props.active ? '#00ffff' : 'transparent'};
  color: ${props => props.active ? '#000' : '#00ffff'};
  border: 1px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch-friendly */
  
  &:hover {
    background: #00ffff;
    color: #000;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 10px;
    margin-bottom: 3px;
  }
`;

const LocationName = styled.div`
  font-weight: bold;
`;

const LocationDetails = styled.div`
  font-size: 10px;
  margin-top: 2px;
`;

const LocationPanel = () => {
  const { state, actions } = useGame();
  const { locations, player } = state;

  const getPoliceDescription = (presence) => {
    const descriptions = [
      'Very Safe',
      'Safe', 
      'Moderate',
      'Dangerous',
      'Very Dangerous',
      'Extremely Dangerous'
    ];
    return descriptions[presence] || 'Unknown';
  };

  const getPoliceColor = (presence) => {
    if (presence <= 1) return '#00ffff';
    if (presence <= 3) return '#ffff00';
    return '#ff0066';
  };

  return (
    <LocationContainer>
      <LocationTitle>LOCATIONS</LocationTitle>
      {locations.map((location) => (
        <LocationItem
          key={location.id}
          active={location.id === player.location}
          onClick={() => {
            actions.changeLocation(location.id);
            soundManager.playSound('travel');
          }}
        >
          <LocationName>{location.name}</LocationName>
          <LocationDetails style={{ color: getPoliceColor(location.policePresence) }}>
            Police: {getPoliceDescription(location.policePresence)}
          </LocationDetails>
        </LocationItem>
      ))}
    </LocationContainer>
  );
};

export default LocationPanel;
