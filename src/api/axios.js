import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({
  baseURL: "https://developmentapi.gulfcargoksa.com/public/api",
  timeout: 10000, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    const sessionStart = await AsyncStorage.getItem('session_start');
    const lastActivity = await AsyncStorage.getItem('last_activity');
    
    if (token) {
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

      // Local Inactivity check
      if (lastActivity && (now - parseInt(lastActivity) > ONE_WEEK)) {
        await AsyncStorage.clear();
        return Promise.reject(new Error("SESSION_EXPIRED_INACTIVITY"));
      }

      // Local Absolute Session check
      if (sessionStart && (now - parseInt(sessionStart) > ONE_MONTH)) {
        await AsyncStorage.clear();
        return Promise.reject(new Error("SESSION_EXPIRED_MONTHLY"));
      }

      await AsyncStorage.setItem('last_activity', now.toString());
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR (New Fix for 401) ---
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the server returns 401, the token is invalid or expired on the backend
    if (error.response && error.response.status === 401) {
      await AsyncStorage.multiRemove(['userToken', 'session_start', 'last_activity']);
      // Note: You may want to use a navigation reference or an event emitter 
      // here to force a redirect to the Login screen.
    }
    return Promise.reject(error);
  }
);

export default API;