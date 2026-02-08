import API from "../api/axios";

export const createCargo = (data) => {
  return API.post('/cargo', data);
};

export const getCargoList = (page = 1, branchId = null) => {
  const params = { page };
  if (branchId) params.branch_id = branchId;
  return API.get('/cargos', { params });
};

export const searchCargoByBookingNo = (bookingNo) => {
  return API.get('/cargos/filter-by-booking-no', {
    params: { booking_no: bookingNo }
  });
};

export const getCargoDetails = (id) => {
  return API.get(`/cargo/${id}`);
};

// NEW: Update existing cargo
export const updateCargo = (id, data) => {
  return API.post(`/cargo/${id}`, { ...data, _method: 'PUT' });
};