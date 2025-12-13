import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "csrf_token", // Add this
  xsrfHeaderName: "X-CSRF-TOKEN", // Add this
});

export default api;
