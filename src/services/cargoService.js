import API from "../api/axios";

export const createCargo = (data) => {
  return API.post('/cargo', data);
};

export const getCargoList = (page = 1, branchId = null) => {
  const params = { page };
  if (branchId) params.branch_id = branchId;
  return API.get('/cargos', { params });
};

const extractCargoList = (payload) => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data) return [payload.data];
  return [];
};

const incrementBookingNo = (bookingNo) => {
  if (!bookingNo) return '';
  const match = String(bookingNo).match(/^(.*?)(\d+)$/);
  if (!match) return bookingNo;

  const [, prefix, numericPart] = match;
  const nextNumber = String(parseInt(numericPart, 10) + 1).padStart(numericPart.length, '0');
  return `${prefix}${nextNumber}`;
};

export const getNextInvoiceNumber = async (branchId = null) => {
  const response = await getCargoList(1, branchId);
  const cargos = extractCargoList(response);
  const latestBookingNo = cargos.find(item => item?.booking_no)?.booking_no;

  return incrementBookingNo(latestBookingNo);
};

export const searchCargoByBookingNo = (bookingNo) => {
  return API.get('/cargos/filter-by-booking-no', {
    params: { booking_no: bookingNo }
  });
};

export const getCargoDetails = (id) => {
  return API.get(`/cargo/${id}`);
};

export const updateCargo = (id, data) => {
  return API.patch(`/cargo/${id}`, data);
};
