var express = require('express');
var router = express.Router();

// Require controller modules.
var user_controller = require('../controllers/userController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;

/// USER ROUTES ///

// POST request to authenticate the user
router.post('/authenticate', user_controller.autenticate);

// GET request for user profile. 
router.get('/profile', require_login, user_controller.user_profile_get);

// POST request to modify user profile. 
router.post('/profile', require_login, user_controller.user_profile_post);

// GET request for user report. 
router.get('/report', require_login, user_controller.report_get);

module.exports = router;
