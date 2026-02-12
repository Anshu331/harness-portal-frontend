import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  if (req.data && typeof FormData !== "undefined" && req.data instanceof FormData) {
    delete req.headers["Content-Type"];
  }
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.dispatchEvent(new Event("storage"));
    }
    return Promise.reject(err);
  }
);

export default API;
export { baseURL };
