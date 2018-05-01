var express = require('express');
var router = express.Router();

// Require controller modules.
var report_controller = require('../controllers/reportController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;

/// REPORT ROUTES ///

// GET request for viewing user report
router.get('/', require_login, report_controller.report_get);

// POST request for retrieving user's report
router.post('/get_report_data', require_login, report_controller.report_data_post);

// POST request for retrieving user's report
router.post('/get_overview_data', require_login, report_controller.report_overview_post);

module.exports = router;