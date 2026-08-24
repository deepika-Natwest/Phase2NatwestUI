const express = require('express');
const router = express.Router();
const multer = require("multer");

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = multer({ dest: "uploads/users/" });

router.get('/', userController.getUsers);

router.post(
  '/',
  authMiddleware,
  upload.single('profilePic'),
  userController.createUser
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('profilePic'),
  userController.updateUser
);

router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;