import API from "../api/axios";

// 1. Create Customer (POST /party)
export const createParty = (data) => {
  return API.post('/party', data);
};

// 2. Get All Customers (GET /parties)
export const getAllParties = () => {
  return API.get('/parties');
};

// 3. Get Active Customers (GET /parties?status=1)
export const getActiveParties = () => {
  return API.get('/parties', {
    params: { status: 1 }
  });
};

// 4. Get Senders (GET /parties?customer_type_id=1)
export const getSenderParties = () => {
  return API.get('/parties', {
    params: { customer_type_id: 1 }
  });
};

// 5. Get Receivers (GET /parties?status=0&customer_type_id=2)
export const getReceiverParties = () => {
  return API.get('/parties', {
    params: { 
      status: 1,  // <--- CHANGE THIS FROM 0 TO 1
      customer_type_id: 2 
    }
  });
};

// 1. Get Single Party Details
export const getPartyDetails = (id) => {
  return API.get(`/party/${id}`);
};

// 2. Delete Party
export const deleteParty = (id) => {
  return API.delete(`/party/${id}`);
};

// 3. Update Party (POST with _method: PUT for FormData support)
export const updateParty = (id, data, config = {}) => {
  // We use POST because React Native FormData often has issues with PUT method directly
  // The backend should handle _method: 'PUT'
  data.append('_method', 'PUT'); 
  return API.post(`/party/${id}`, data, config);
};