import API from '../api/axios';

export const getAllBranches = () => {
  return API.get('/branches');
};

// 2. Get Single Branch (Dynamic ID)
export const getBranchDetails = (id) => {
  return API.get(`/branch/${id}`);
};