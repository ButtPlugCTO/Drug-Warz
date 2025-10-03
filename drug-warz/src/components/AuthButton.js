import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const AuthContainer = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  
  @media (max-width: 768px) {
    top: 5px;
    left: 5px;
  }
`;

const AuthButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.isAuthenticated ? '#ff0066' : '#00ffff'};
  color: ${props => props.isAuthenticated ? '#fff' : '#000'};
  border: 2px solid ${props => props.isAuthenticated ? '#ff0066' : '#00ffff'};
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
  
  &:hover {
    background: ${props => props.isAuthenticated ? '#cc0055' : '#00cccc'};
    box-shadow: 0 0 8px ${props => props.isAuthenticated ? 'rgba(255, 0, 102, 0.4)' : 'rgba(0, 255, 255, 0.4)'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 11px;
    min-height: 28px;
  }
  
  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 10px;
    gap: 4px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const Avatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #00ffff;
  
  @media (max-width: 480px) {
    width: 16px;
    height: 16px;
  }
`;

const Username = styled.span`
  font-weight: bold;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const AuthButtonComponent = () => {
  const { user, isLoading, signInWithX, signOut, isAuthenticated } = useAuth();

  const handleClick = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      signInWithX();
    }
  };

  if (isLoading) {
    return (
      <AuthContainer>
        <AuthButton disabled>
          Loading...
        </AuthButton>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <AuthButton onClick={handleClick} isAuthenticated={isAuthenticated}>
        {isAuthenticated ? (
          <UserInfo>
            <Avatar src={user?.profile_image_url} alt={user?.username} />
            <Username>@{user?.username}</Username>
            <span>Sign Out</span>
          </UserInfo>
        ) : (
          <>
            <span>𝕏</span>
            <span>Sign in with X</span>
          </>
        )}
      </AuthButton>
    </AuthContainer>
  );
};

export default AuthButtonComponent;
