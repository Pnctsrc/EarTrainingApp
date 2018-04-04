var express = require('express');
var router = express.Router();

// Require controller modules.
var api_controller = require('../controllers/apiController');

//user validations
var require_login = require('../utils/router_utils').require_login;

// POST request for a particular level of questions of the Skill (for data).
router.post('/question_list', require_login, api_controller.questions_list);

// POST request for the answer of a question
router.post('/question_answer', api_controller.question_answer);

module.exports = router;