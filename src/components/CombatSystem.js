import React, { useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import soundManager from '../utils/soundManager';

const CombatContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
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

const CombatTitle = styled.h2`
  color: #f00;
  font-size: 32px;
  margin-bottom: 30px;
  text-shadow: 0 0 10px #f00;
`;

const CombatStats = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }
`;

const FighterStats = styled.div`
  text-align: center;
  color: #00ffff;
  font-size: 16px;
`;

const FighterName = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 18px;
`;

const HealthBar = styled.div`
  width: 200px;
  height: 20px;
  background: #000;
  border: 2px solid #00ffff;
  margin: 10px 0;
  position: relative;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 250px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    max-width: 200px;
    height: 16px;
  }
`;

const HealthFill = styled.div`
  height: 100%;
  background: ${props => props.health > 50 ? '#00ffff' : props.health > 25 ? '#ffff00' : '#ff0066'};
  width: ${props => props.health}%;
  transition: width 0.3s ease;
`;

const HealthText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #000;
  font-weight: bold;
`;

const CombatActions = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 300px;
  }
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const CombatButton = styled.button`
  padding: 15px 30px;
  background: ${props => props.primary ? '#ff0066' : '#00ffff'};
  color: ${props => props.primary ? '#fff' : '#000'};
  border: 2px solid ${props => props.primary ? '#ff0066' : '#00ffff'};
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  
  &:hover {
    background: ${props => props.primary ? '#cc0055' : '#00cccc'};
    box-shadow: 0 0 20px ${props => props.primary ? '#ff0066' : '#00ffff'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 12px 20px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 10px 15px;
    font-size: 12px;
  }
`;

const CombatLog = styled.div`
  width: 100%;
  max-width: 600px;
  height: 200px;
  background: #001a1a;
  border: 2px solid #00ffff;
  padding: 15px;
  overflow-y: auto;
  margin-bottom: 20px;
  font-size: 14px;
  color: #00ffff;
  
  @media (max-width: 768px) {
    height: 150px;
    font-size: 12px;
  }
  
  @media (max-width: 480px) {
    height: 120px;
    font-size: 11px;
    padding: 10px;
  }
`;

const CombatSystem = ({ enemy, onEndCombat }) => {
  const { state, actions } = useGame();
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [combatLog, setCombatLog] = useState([]);
  const [combatEnded, setCombatEnded] = useState(false);

  // Play combat start sound
  React.useEffect(() => {
    soundManager.playSound('combat');
  }, []);

  const addLogMessage = (message) => {
    setCombatLog(prev => [...prev, message]);
  };

  const calculateDamage = (attacker, defender) => {
    const baseDamage = Math.floor(Math.random() * 20) + 5;
    const weaponBonus = attacker === 'player' ? 
      (state.player.guns.length > 0 ? state.player.guns[0].damage : 0) : 0;
    return Math.max(1, baseDamage + weaponBonus);
  };

  const handleAttack = () => {
    if (combatEnded) return;

    // Player attacks
    const playerDamage = calculateDamage('player', 'enemy');
    const newEnemyHealth = Math.max(0, enemyHealth - playerDamage);
    setEnemyHealth(newEnemyHealth);
    
    addLogMessage(`You attack for ${playerDamage} damage!`);
    soundManager.playSound('gunshot');
    
    if (newEnemyHealth <= 0) {
      addLogMessage(`You defeated the ${enemy}!`);
      setCombatEnded(true);
      setTimeout(() => {
        actions.addMessage({ type: 'success', text: `You defeated the ${enemy}!` });
        onEndCombat('victory');
      }, 2000);
      return;
    }

    // Enemy attacks back
    setTimeout(() => {
      if (!combatEnded) {
        const enemyDamage = calculateDamage('enemy', 'player');
        actions.takeDamage(enemyDamage);
        addLogMessage(`${enemy} attacks for ${enemyDamage} damage!`);
        
        if (state.player.health <= enemyDamage) {
          addLogMessage(`You were defeated by the ${enemy}!`);
          setCombatEnded(true);
          setTimeout(() => {
            onEndCombat('defeat');
          }, 2000);
        }
      }
    }, 1000);
  };

  const handleFlee = () => {
    const fleeChance = 0.6; // 60% chance to flee
    if (Math.random() < fleeChance) {
      addLogMessage('You successfully fled from combat!');
      soundManager.playSound('flee');
      setTimeout(() => {
        onEndCombat('fled');
      }, 1500);
    } else {
      addLogMessage('You failed to flee!');
      soundManager.playSound('miss');
      // Enemy gets a free attack
      setTimeout(() => {
        const enemyDamage = calculateDamage('enemy', 'player');
        actions.takeDamage(enemyDamage);
        addLogMessage(`${enemy} attacks for ${enemyDamage} damage!`);
        soundManager.playSound('hit');
      }, 1000);
    }
  };

  return (
    <CombatContainer>
      <CombatTitle>COMBAT!</CombatTitle>
      
      <CombatStats>
        <FighterStats>
          <FighterName>{state.player.name}</FighterName>
          <div>Health: {state.player.health}/100</div>
          <HealthBar>
            <HealthFill health={state.player.health} />
            <HealthText>{state.player.health}/100</HealthText>
          </HealthBar>
          <div>Weapons: {state.player.guns.length}</div>
        </FighterStats>
        
        <FighterStats>
          <FighterName>{enemy}</FighterName>
          <div>Health: {enemyHealth}/100</div>
          <HealthBar>
            <HealthFill health={enemyHealth} />
            <HealthText>{enemyHealth}/100</HealthText>
          </HealthBar>
          <div>Type: Enemy</div>
        </FighterStats>
      </CombatStats>
      
      <CombatLog>
        {combatLog.map((message, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {message}
          </div>
        ))}
      </CombatLog>
      
      <CombatActions>
        <CombatButton 
          primary 
          onClick={handleAttack}
          disabled={combatEnded}
        >
          ATTACK
        </CombatButton>
        
        <CombatButton 
          onClick={handleFlee}
          disabled={combatEnded}
        >
          FLEE
        </CombatButton>
      </CombatActions>
    </CombatContainer>
  );
};

export default CombatSystem;
