import axios from "axios";

const API = axios.create({
  baseURL: "https://developmentapi.gulfcargoksa.com/public/api", // replace with your API base URL
  timeout: 10000, 
    headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    },
});

export default API;