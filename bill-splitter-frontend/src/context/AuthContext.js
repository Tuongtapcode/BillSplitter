import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [people, setPeople] = useState(['Người 1', 'Người 2', 'Người 3', 'Người 4']);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedPeople = localStorage.getItem('people');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Load people từ localStorage hoặc API
        if (savedPeople) {
          setPeople(JSON.parse(savedPeople));
        } else {
          // Nếu chưa có people trong localStorage, load từ API
          loadPeopleFromAPI(savedToken);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('people');
      }
    }
    setLoading(false);
  }, []);

  const loadPeopleFromAPI = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.people) {
          setPeople(data.user.people);
          localStorage.setItem('people', JSON.stringify(data.user.people));
        }
      }
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    
    // Load people từ API sau khi login
    loadPeopleFromAPI(token);
  };

  const logout = () => {
    setUser(null);
    setPeople(['Người 1', 'Người 2', 'Người 3', 'Người 4']);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('people');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const updatePeople = async (newPeople) => {
    setPeople(newPeople);
    localStorage.setItem('people', JSON.stringify(newPeople));
    
    // Save to API if authenticated
    if (user && getToken()) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/profile/people`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ people: newPeople })
        });
        
        if (!response.ok) {
          console.error('Failed to save people to API');
        }
      } catch (error) {
        console.error('Error saving people:', error);
      }
    }
  };

  const value = {
    user,
    people,
    login,
    logout,
    getToken,
    updatePeople,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};