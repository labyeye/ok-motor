const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/role');

router.route('/')
  .get(protect, roleCheck(['admin']), getUsers)
  .post(protect, roleCheck(['admin']), createUser);

router.route('/:id')
  .put(protect, roleCheck(['admin']), updateUser)
  .delete(protect, roleCheck(['admin']), deleteUser);

module.exports = router;