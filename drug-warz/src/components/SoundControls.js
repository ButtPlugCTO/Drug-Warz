import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import soundManager from '../utils/soundManager';

const SoundControlsContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    top: 5px;
    right: 5px;
  }
`;

const SoundButton = styled.button`
  width: 40px;
  height: 40px;
  background: ${props => props.enabled ? '#00ffff' : '#000'};
  color: ${props => props.enabled ? '#000' : '#00ffff'};
  border: 2px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.enabled ? '#00cccc' : '#00ffff'};
    color: ${props => props.enabled ? '#000' : '#000'};
  }
  
  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    font-size: 16px;
  }
`;

const VolumeContainer = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  background: rgba(0, 26, 26, 0.95);
  border: 1px solid #00ffff;
  padding: 8px;
  border-radius: 4px;
  backdrop-filter: blur(5px);
  display: ${props => props.show ? 'block' : 'none'};
  
  @media (max-width: 768px) {
    top: 40px;
    padding: 6px;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  background: #001a1a;
  outline: none;
  border-radius: 2px;
  height: 4px;
  border: 1px solid #00ffff;
  
  &::-webkit-slider-track {
    background: #001a1a;
    border-radius: 2px;
    height: 4px;
  }
  
  &::-webkit-slider-thumb {
    background: #00ffff;
    border: 2px solid #00ffff;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
    transition: all 0.2s ease;
    
    &:hover {
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      transform: scale(1.1);
    }
  }
  
  &::-moz-range-track {
    background: #001a1a;
    border-radius: 2px;
    height: 4px;
    border: none;
  }
  
  &::-moz-range-thumb {
    background: #00ffff;
    border: 2px solid #00ffff;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
    transition: all 0.2s ease;
    
    &:hover {
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      transform: scale(1.1);
    }
  }
  
  @media (max-width: 768px) {
    width: 70px;
    
    &::-webkit-slider-thumb, &::-moz-range-thumb {
      width: 16px;
      height: 16px;
    }
  }
`;

const VolumeLabel = styled.div`
  color: #00ffff;
  font-size: 10px;
  text-align: center;
  margin-top: 4px;
  
  @media (max-width: 768px) {
    font-size: 9px;
  }
`;

const SoundControls = () => {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [showVolume, setShowVolume] = useState(false);
  const containerRef = useRef(null);

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowVolume(false);
      }
    };

    if (showVolume) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolume]);

  const toggleSound = () => {
    const newEnabled = soundManager.toggle();
    setEnabled(newEnabled);
    
    // Play a test sound when toggling
    if (newEnabled) {
      soundManager.playSound('success');
    }
  };

  const toggleVolumeSlider = () => {
    setShowVolume(!showVolume);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    soundManager.setVolume(newVolume);
    setVolume(newVolume);
    
    // Play a test sound when adjusting volume
    if (enabled) {
      soundManager.playSound('buy');
    }
  };

  return (
    <SoundControlsContainer ref={containerRef}>
      <SoundButton 
        enabled={enabled} 
        onClick={enabled ? toggleVolumeSlider : toggleSound} 
        title={enabled ? "Click to adjust volume" : "Toggle Sound"}
      >
        {enabled ? '🔊' : '🔇'}
      </SoundButton>
      
      {enabled && (
        <VolumeContainer show={showVolume}>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            title="Volume"
          />
          <VolumeLabel>
            {Math.round(volume * 100)}%
          </VolumeLabel>
        </VolumeContainer>
      )}
    </SoundControlsContainer>
  );
};

export default SoundControls;
