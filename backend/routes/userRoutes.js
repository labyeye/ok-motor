const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/role');

router.get('/', protect, roleCheck(['admin']), getUsers);

module.exports = router;