var express = require('express');
var router = express.Router();

// Require controller modules.
var user_controller = require('../controllers/userController');

// Require token validation
var token_validation = require('../utils/router_utils').validate_token;
/// USER ROUTES ///

// POST request to authenticate the user
router.post('/authenticate', token_validation, user_controller.autenticate);

// GET request for user profile. 
router.get('/profile', token_validation, user_controller.user_profile_get);

// POST request to modify user profile. 
router.post('/profile', token_validation, user_controller.user_profile_post);

// GET request for user report. 
router.get('/report', token_validation, user_controller.report_get);

module.exports = router;
