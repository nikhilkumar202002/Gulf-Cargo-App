import API from "../api/axios";

export const createCargo = (data) => {
  return API.post('/cargo', data);
};

export const getCargoList = (page = 1) => {
  return API.get(`/cargos?page=${page}`);
};

export const searchCargoByBookingNo = (bookingNo) => {
  return API.get('/cargos/filter-by-booking-no', {
    params: { booking_no: bookingNo }
  });
};

export const getCargoDetails = (id) => {
  return API.get(`/cargo/${id}`);
};