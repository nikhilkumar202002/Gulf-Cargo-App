import API from '../api/axios';

export const getAllBranches = () => {
  return API.get('/branches');
};

export const getBranchDetails = (id) => {
  return API.get(`/branch/${id}`);
};

// --- SHIPMENT METHODS ---
export const getAllShipmentMethods = () => {
  return API.get('/shipment-methods');
};

export const getActiveShipmentMethods = () => {
  return API.get('/shipment-methods', { params: { status: 1 } });
};

// --- CUSTOMER TYPES ---
export const getAllCustomerTypes = () => {
  return API.get('/customer-types');
};

export const getActiveCustomerTypes = () => {
  return API.get('/customer-types', { params: { status: 1 } });
};

// --- DELIVERY TYPES ---
export const getAllDeliveryTypes = () => {
  return API.get('/delivery-types');
};

export const getActiveDeliveryTypes = () => {
  return API.get('/delivery-types', { params: { status: 1 } });
};

// --- COLLECTED BY ---
export const getAllCollectedBy = () => {
  return API.get('/collected');
};

export const getActiveCollectedBy = (branchId) => {
  const params = { status: 1 };
  if (branchId) params.branch_id = branchId;
  return API.get('/collected', { params });
};

// --- PAYMENT METHODS ---
export const getAllPaymentMethods = () => {
  return API.get('/payment-methods');
};

export const getActivePaymentMethods = () => {
  return API.get('/payment-methods', { params: { status: 1 } });
};

// --- SHIPMENT STATUS ---
export const getAllShipmentStatuses = () => {
  return API.get('/shipment-status');
};

export const getActiveShipmentStatuses = () => {
  return API.get('/shipment-status', { params: { status: 1 } });
};

// --- NEW METHODS FOR PARTIES FORM (Step 2) --- //

// 1. Phone Codes
export const getAllPhoneCodes = () => {
  return API.get('/phone-codes');
};

// 2. Locations
export const getAllCountries = () => {
  return API.get('/countries');
};

export const getStatesByCountry = (countryId) => {
  return API.get(`/states`, { params: { country_id: countryId } });
};

export const getDistrictsByState = (stateId) => {
  return API.get(`/districts`, { params: { state_id: stateId } });
};

// 3. Documents
export const getAllDocumentTypes = () => {
  return API.get('/document-types'); 
};