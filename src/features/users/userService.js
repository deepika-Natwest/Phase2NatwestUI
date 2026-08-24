import api from '../../services/api';

export const getUsers = (search = '') => {
  return api.get(`/users?search=${search}`);
};

export const createUser = (formData) => {
  return api.post('/users', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateUser = (id, formData) => {
  return api.put(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};