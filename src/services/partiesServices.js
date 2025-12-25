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
      status: 0, 
      customer_type_id: 2 
    }
  });
};

// 6. Get Single Party (GET /party/{id})
export const getPartyDetails = (id) => {
  return API.get(`/party/${id}`);
};