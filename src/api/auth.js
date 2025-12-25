import API from './axios';

export const login = (email, password) => {
  return API.post('/login', {
    email,
    password
  });
};
