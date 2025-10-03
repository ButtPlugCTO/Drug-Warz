import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on app load
    const token = localStorage.getItem('drugwarz_token');
    const userData = localStorage.getItem('drugwarz_user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('drugwarz_token');
        localStorage.removeItem('drugwarz_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const signInWithX = async () => {
    try {
      // Open X OAuth popup
      const popup = window.open(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/x`,
        'xAuth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
        }
      }, 1000);

      // Listen for auth success message from popup
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'X_AUTH_SUCCESS') {
          const { token, user: userData } = event.data;
          
          // Store auth data
          localStorage.setItem('drugwarz_token', token);
          localStorage.setItem('drugwarz_user', JSON.stringify(userData));
          
          setUser(userData);
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);
      
    } catch (error) {
      console.error('X sign-in error:', error);
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('drugwarz_token');
    localStorage.removeItem('drugwarz_user');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    signInWithX,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
