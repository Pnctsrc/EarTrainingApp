var express = require('express');
var router = express.Router();

// Require controller modules.
var api_controller = require('../controllers/apiController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;

//handle mutipart form
var multer = require('multer')
var upload = multer({
    limits: {
        fileSize: 10485760 //10MB
    }
})

// POST request for a particular level of questions of the Skill (for data).
router.post('/question_list', require_login, api_controller.questions_list);

// POST request for the answer of a question
router.post('/question_answer', api_controller.question_answer);

// POST request for image upload
router.post('/upload_image', require_login, require_role, upload.array('images'), api_controller.upload_image);

// POST request for image delete
router.post('/delete_image', require_login, require_role, api_controller.delete_image);

module.exports = router;