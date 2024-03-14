const express = require('express');
const createClientRequest = require('../controllers/userController')

const router = express.Router();

router.post('/user-requests', createClientRequest); 

module.exports = router;