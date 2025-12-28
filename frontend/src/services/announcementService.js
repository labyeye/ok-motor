import axios from 'axios';

const API_BASE = "https://ok-motor-51l3.vercel.app";

const getCurrent = async () => {
  const res = await axios.get(`${API_BASE}/api/announcements/current`);
  return res.data;
};

const list = async (token) => {
  const res = await axios.get(`${API_BASE}/api/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const create = async (payload, token) => {
  const res = await axios.post(`${API_BASE}/api/announcements`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const update = async (id, payload, token) => {
  const res = await axios.put(`${API_BASE}/api/announcements/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const remove = async (id, token) => {
  const res = await axios.delete(`${API_BASE}/api/announcements/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default { getCurrent, list, create, update, remove };
