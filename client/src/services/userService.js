import api from "./api";

export const updateProfile = (payload) => api.put("/users/profile", payload).then((r) => r.data.data.user);
export const changePassword = (payload) => api.put("/users/password", payload).then((r) => r.data.data.user);
