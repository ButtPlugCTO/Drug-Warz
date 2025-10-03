import React, { useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import soundManager from '../utils/soundManager';

const SpecialContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const SpecialTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #00ffff;
  text-align: center;
`;

const LocationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const LocationCard = styled.div`
  background: #001a1a;
  border: 2px solid #00ffff;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const LocationName = styled.h3`
  margin: 0 0 15px 0;
  color: #00ffff;
  font-size: 18px;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: #00ffff;
  color: #000;
  border: 1px solid #00ffff;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #00cccc;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const AmountInput = styled.input`
  flex: 1;
  padding: 10px;
  background: #001a1a;
  color: #00ffff;
  border: 2px solid #00ffff;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  text-align: center;
  font-size: 14px;
  min-height: 44px;
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #00cccc;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    background: #002222;
  }
  
  &:hover {
    border-color: #00cccc;
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: #006666;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    font-size: 16px; /* Prevent zoom on iOS */
    min-height: 48px;
  }
`;

const InfoText = styled.div`
  font-size: 12px;
  color: #00ffff;
  margin-bottom: 10px;
  line-height: 1.4;
`;

const StatusMessage = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: ${props => props.type === 'success' ? '#001a1a' : '#1a0000'};
  border: 1px solid ${props => props.type === 'success' ? '#00ffff' : '#ff0066'};
  color: ${props => props.type === 'success' ? '#00ffff' : '#ff0066'};
  font-size: 12px;
  text-align: center;
`;

const SpecialLocations = () => {
  const { state, actions } = useGame();
  const { player, locations } = state;
  const [amounts, setAmounts] = useState({
    bank: '',
    loan: '',
    gun: '',
    heal: ''
  });
  const [statusMessage, setStatusMessage] = useState('');

  // Function to sanitize numeric input - only allow numbers
  const sanitizeNumericInput = (input) => {
    return input.replace(/[^0-9]/g, '');
  };

  const handleAmountChange = (type, value) => {
    // Sanitize input to only allow numbers
    const sanitizedValue = sanitizeNumericInput(value);
    const numericValue = sanitizedValue === '' ? 0 : parseInt(sanitizedValue) || 0;
    
    setAmounts(prev => ({
      ...prev,
      [type]: sanitizedValue === '' ? '' : Math.max(0, numericValue)
    }));
  };

  const handleDeposit = () => {
    const amount = parseInt(amounts.bank) || 0;
    if (amount <= 0 || amount > player.cash) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Invalid deposit amount!' });
      return;
    }
    actions.depositBank(amount);
    soundManager.playSound('money');
    setStatusMessage({ type: 'success', text: `Deposited $${amount.toLocaleString()} to bank` });
    setAmounts(prev => ({ ...prev, bank: '' }));
  };

  const handleWithdraw = () => {
    const amount = parseInt(amounts.bank) || 0;
    if (amount <= 0 || amount > player.bank) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Invalid withdrawal amount!' });
      return;
    }
    actions.withdrawBank(amount);
    soundManager.playSound('money');
    setStatusMessage({ type: 'success', text: `Withdrew $${amount.toLocaleString()} from bank` });
    setAmounts(prev => ({ ...prev, bank: '' }));
  };

  const handleTakeLoan = () => {
    const amount = amounts.loan;
    if (amount <= 0) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Enter a valid loan amount!' });
      return;
    }
    actions.takeLoan(amount);
    soundManager.playSound('money');
    setStatusMessage({ type: 'success', text: `Took loan of $${amount.toLocaleString()}` });
    setAmounts(prev => ({ ...prev, loan: '' }));
  };

  const handlePayDebt = () => {
    const amount = parseInt(amounts.loan) || 0;
    if (amount <= 0 || amount > player.cash || amount > player.debt) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Invalid payment amount!' });
      return;
    }
    actions.payDebt(amount);
    soundManager.playSound('money');
    setStatusMessage({ type: 'success', text: `Paid $${amount.toLocaleString()} toward debt` });
    setAmounts(prev => ({ ...prev, loan: '' }));
  };

  const handleHeal = () => {
    const amount = parseInt(amounts.heal) || 0;
    const healCost = amount * 10; // $10 per health point
    if (amount <= 0 || amount > (100 - player.health) || healCost > player.cash) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Invalid heal amount!' });
      return;
    }
    actions.heal(healCost);
    soundManager.playSound('heal');
    setStatusMessage({ type: 'success', text: `Healed ${amount} points for $${healCost.toLocaleString()}` });
    setAmounts(prev => ({ ...prev, heal: '' }));
  };

  const getAvailableGuns = () => {
    return state.guns.filter(gun => !player.guns.find(pg => pg.id === gun.id));
  };

  const handleBuyGun = (gunId) => {
    const gun = state.guns.find(g => g.id === gunId);
    
    if (player.cash < gun.price) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Not enough cash!' });
      return;
    }
    
    if (player.coatSize < gun.space) {
      soundManager.playSound('error');
      setStatusMessage({ type: 'error', text: 'Not enough coat space!' });
      return;
    }
    
    actions.buyGun(gunId);
    soundManager.playSound('cashRegister');
    setStatusMessage({ type: 'success', text: `Bought ${gun.name} for $${gun.price.toLocaleString()}` });
  };

  const currentLocation = locations[player.location];

  return (
    <SpecialContainer>
      <SpecialTitle>SPECIAL LOCATIONS</SpecialTitle>
      
      <LocationGrid>
        {/* Bank */}
        <LocationCard>
          <LocationName>🏦 BANK</LocationName>
          <InfoText>
            Deposit money to keep it safe from cops.<br/>
            Current Balance: ${player.bank.toLocaleString()}
          </InfoText>
          
          <InputGroup>
            <AmountInput
              type="number"
              placeholder="Amount"
              value={amounts.bank}
              onChange={(e) => handleAmountChange('bank', e.target.value)}
            />
          </InputGroup>
          
          <ActionButton onClick={handleDeposit}>
            DEPOSIT
          </ActionButton>
          
          <ActionButton onClick={handleWithdraw}>
            WITHDRAW
          </ActionButton>
        </LocationCard>

        {/* Loan Shark */}
        <LocationCard>
          <LocationName>💰 LOAN SHARK</LocationName>
          <InfoText>
            Take loans to get cash quickly.<br/>
            Current Debt: ${player.debt.toLocaleString()}<br/>
            Interest: 10% per turn
          </InfoText>
          
          <InputGroup>
            <AmountInput
              type="number"
              placeholder="Amount"
              value={amounts.loan}
              onChange={(e) => handleAmountChange('loan', e.target.value)}
            />
          </InputGroup>
          
          <ActionButton onClick={handleTakeLoan}>
            TAKE LOAN
          </ActionButton>
          
          <ActionButton onClick={handlePayDebt}>
            PAY DEBT
          </ActionButton>
        </LocationCard>

        {/* Gun Shop */}
        <LocationCard>
          <LocationName>🔫 GUN SHOP</LocationName>
          <InfoText>
            Buy weapons to defend yourself.<br/>
            Available guns:
          </InfoText>
          
          {getAvailableGuns().map(gun => (
            <div key={gun.id} style={{ marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{gun.name}</span>
                <span>${gun.price.toLocaleString()}</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px' }}>
                Damage: {gun.damage} | Space: {gun.space} | Available: {player.coatSize}
              </div>
              <ActionButton 
                style={{ marginTop: '5px', fontSize: '10px', padding: '5px' }}
                onClick={() => handleBuyGun(gun.id)}
                disabled={player.cash < gun.price || player.coatSize < gun.space}
              >
                BUY
              </ActionButton>
            </div>
          ))}
        </LocationCard>

        {/* Hospital */}
        <LocationCard>
          <LocationName>🏥 HOSPITAL</LocationName>
          <InfoText>
            Heal your wounds.<br/>
            Current Health: {player.health}/100<br/>
            Cost: $10 per health point
          </InfoText>
          
          <InputGroup>
            <AmountInput
              type="number"
              placeholder="Health Points"
              value={amounts.heal}
              onChange={(e) => handleAmountChange('heal', e.target.value)}
              max={100 - player.health}
            />
          </InputGroup>
          
          <ActionButton 
            onClick={handleHeal}
            disabled={player.health >= 100}
          >
            HEAL (${amounts.heal * 10})
          </ActionButton>
        </LocationCard>
      </LocationGrid>
      
      {statusMessage && (
        <StatusMessage type={statusMessage.type}>
          {statusMessage.text}
        </StatusMessage>
      )}
    </SpecialContainer>
  );
};

export default SpecialLocations;
