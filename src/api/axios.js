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

API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    const sessionStart = await AsyncStorage.getItem('session_start');
    const lastActivity = await AsyncStorage.getItem('last_activity');
    
    if (token) {
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

      // Check Inactivity (1 Week)
      if (lastActivity && (now - parseInt(lastActivity) > ONE_WEEK)) {
        await AsyncStorage.clear();
        return Promise.reject(new Error("SESSION_EXPIRED_INACTIVITY"));
      }

      // Check Absolute Session (1 Month)
      if (sessionStart && (now - parseInt(sessionStart) > ONE_MONTH)) {
        await AsyncStorage.clear();
        return Promise.reject(new Error("SESSION_EXPIRED_MONTHLY"));
      }

      // Update Activity Timestamp
      await AsyncStorage.setItem('last_activity', now.toString());
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;