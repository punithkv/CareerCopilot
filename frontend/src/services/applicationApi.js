
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/applications";

export const getApplications = async (status = "All", search = "") => {
  const response = await axios.get(`${API_URL}/`, {
    params: { status, search },
  });
  return response.data;
};

export const getApplicationStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};

export const createApplication = async (application) => {
  const response = await axios.post(`${API_URL}/`, application);
  return response.data;
};

export const updateApplication = async (id, updates) => {
  const response = await axios.patch(`${API_URL}/${id}`, updates);
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
