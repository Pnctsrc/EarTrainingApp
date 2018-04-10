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
router.post('/question_list', api_controller.questions_list);

// POST request for the answer of a question
router.post('/question_answer', api_controller.question_answer);

// POST request for image upload
router.post('/upload_image', require_login, require_role, upload.array('images'), api_controller.upload_image);

// POST request for image delete
router.post('/delete_image', require_login, require_role, api_controller.delete_image);

// POST request for image delete using Amazon S3
router.post('/delete_image_s3', require_login, require_role, api_controller.delete_image_s3);

// POST request for image upload using Amazon S3
router.post('/upload_image_s3_signature', require_login, require_role, upload.array('images', 1), api_controller.upload_image_s3_signature);

// POST request for audio upload
//router.post('/upload_audio', require_login, require_role, upload.array('audio', 1), api_controller.upload_audio);

// POST request for audio upload using Amazon S3
router.post('/upload_audio_s3_signature', require_login, require_role, upload.array('audio', 1), api_controller.upload_audio_s3_signature);

// POST request for audio delete
router.post('/delete_audio', require_login, require_role, api_controller.delete_audio);

// POST request for skill detail
router.post('/get_skill_detail', require_login, require_role, api_controller.skill_detail);

// GET request for sorted skill list
router.get('/sorted_skill_list', require_login, require_role, api_controller.sorted_skill_list);

module.exports = router;