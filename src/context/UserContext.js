import React, { createContext, useState, useContext } from 'react';

// Create the context
export const UserContext = createContext();

// Create the provider
export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: '',
    branchName: '',
    email: '',
    profilePic: null,
  });

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use it easily
export const useUser = () => useContext(UserContext);