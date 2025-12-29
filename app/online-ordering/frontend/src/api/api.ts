// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://itmbu-canteeen.onrender.com/api/items",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
//   xsrfCookieName: "csrf_token", // Add this
//   xsrfHeaderName: "X-CSRF-TOKEN", // Add this
// });

// //fetch all items
// export const fetchItems = async () => {
//   const res = await api.get("/");
//   return res.data;
// };
import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://itmbu-canteeen.onrender.com/api" // Production backend
      : "http://localhost:5000/api", // Local backend
  withCredentials: true,
});

export const loginUser = async (
  enrollmentId: string,
  password: string
): Promise<any> => {
  const response = await api.post("/auth/login", { enrollmentId, password });
  return response.data;
};

export const getMe = async (): Promise<any> => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logoutUser = async (): Promise<any> => {
  const response = await api.post("/auth/logout");
  return response.data;
};
