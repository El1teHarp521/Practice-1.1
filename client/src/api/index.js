import axios from "axios";

const apiClient = axios.create({ baseURL: "http://localhost:3000/api", headers: { "Content-Type": "application/json" } });

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) { localStorage.clear(); return Promise.reject(error); }
        try {
            const response = await axios.post("http://localhost:3000/api/auth/refresh", {}, { headers: { "x-refresh-token": refreshToken } });
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return apiClient(originalRequest);
        } catch (err) {
            localStorage.clear(); window.location.reload(); return Promise.reject(err);
        }
    }
    return Promise.reject(error);
});

export const api = {
    register: (data) => apiClient.post("/auth/register", data).then(res => res.data),
    login: async (data) => {
        const res = await apiClient.post("/auth/login", data);
        if (res.data.accessToken) {
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        return res.data;
    },
    logout: () => localStorage.clear(),
    getMe: () => apiClient.get("/auth/me").then(res => res.data),

    getProducts: () => apiClient.get("/products").then(res => res.data),
    createProduct: (data) => apiClient.post("/products", data).then(res => res.data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data).then(res => res.data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`).then(res => res.data),

    // Маршруты Админа
    getUsers: () => apiClient.get("/users").then(res => res.data),
    updateUserRole: (id, role) => apiClient.put(`/users/${id}`, { role }).then(res => res.data),
    toggleBlockUser: (id) => apiClient.delete(`/users/${id}`).then(res => res.data),
};