const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../data/users.json');

const readUsers = () => {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

const writeUsers = (users) => {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};

const getAllUsers = (search) => {
  const users = readUsers();
  if (search) {
    return users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  return users;
};

const createUser = (userData) => {
  const users = readUsers();
  users.push(userData);
  writeUsers(users);
  return userData;
};

const updateUser = (id, updatedData) => {
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updatedData };
  writeUsers(users);
  return users[index];
};

const deleteUser = (id) => {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== id);
  writeUsers(filtered);
  return true;
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};