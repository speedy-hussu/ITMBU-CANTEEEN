import axios from "axios";

const api = axios.create({
  baseURL: "https://itmbu-canteeen.onrender.com/api/items",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "csrf_token", // Add this
  xsrfHeaderName: "X-CSRF-TOKEN", // Add this
});

//fetch all items
export const fetchItems = async () => {
  const res = await api.get("/");
  return res.data;
};
