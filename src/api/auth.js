import API from './axios';

export const login = (email, password) => {
  return API.post('/login', {
    email,
    password
  });
};

export const getStaffDetails = (id) => {
  return API.get(`/staff/${id}`);
};

export const getRoles = () => {
  return API.get('/roles');
};

export const getProfile = () => {
  return API.get('/profile');
};
