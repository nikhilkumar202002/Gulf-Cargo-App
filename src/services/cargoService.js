import API from "../api/axios";

export const createCargo = (data) => {
  return API.post('/cargo', data);
};