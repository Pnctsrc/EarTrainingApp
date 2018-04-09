var express = require('express');
var router = express.Router();
//handle mutipart form
var multer = require('multer')
var upload = multer({
    limits: {
        fileSize: 10485760 //10MB
    }
})

// Require controller modules.
var skill_controller = require('../controllers/skillController');
var question_controller = require('../controllers/questionController');
var option_controller = require('../controllers/optionController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;
var validate_skill_create = require('../utils/validation_utils').validate_skill_create;

/// SKILL ROUTES ///

// GET catalog home page.
router.get('/', skill_controller.index);

// GET request for creating a Skill. NOTE This must come before routes that display Skill (uses id).
router.get('/skill/create', require_login, require_role, skill_controller.skill_create_get);

// POST request for creating Skill.
router.post('/skill/create', require_login, require_role, validate_skill_create, skill_controller.skill_create_post);

// GET request to delete Skill.
router.get('/skill/:id/delete', skill_controller.skill_delete_get);

// POST request to delete Skill.
router.post('/skill/:id/delete', skill_controller.skill_delete_post);

// GET request to update Skill.
router.get('/skill/:id/update', require_login, require_role, skill_controller.skill_update_get);

// POST request to update Skill.
router.post('/skill/:id/update', require_login, require_role, skill_controller.skill_update_post);

// GET request for a particular level of questions of the Skill.
router.get('/skill/:id/questions/:level', question_controller.question_for_skill);

// GET request for one Skill.
router.get('/skill/:id', skill_controller.skill_detail);

// GET request for list of all Skill items.
router.get('/skills', skill_controller.skill_list);

/// QUESTION ROUTES ///

// GET request for creating Question. NOTE This must come before route for id (i.e. display question).
router.get('/question/create', require_login, require_role, question_controller.question_create_get);

// POST request for creating Question.
router.post('/question/create',
    require_login,
    require_role,
    upload.fields([
        { name: 'option_file_1', maxCount: 1 },
        { name: 'option_file_2', maxCount: 1 },
        { name: 'option_file_3', maxCount: 1 },
        { name: 'option_file_4', maxCount: 1 },
        { name: 'option_file_5', maxCount: 1 },
    ]),
    question_controller.question_create_post);

// GET request to delete Question.
router.get('/question/:id/delete', question_controller.question_delete_get);

// POST request to delete Question.
router.post('/question/:id/delete', question_controller.question_delete_post);

// GET request to update Question.
router.get('/question/:id/update', question_controller.question_update_get);

// POST request to update Question.
router.post('/question/:id/update', question_controller.question_update_post);

// GET request for one Question.
router.get('/question/:id', question_controller.question_detail);

/// OPTION ROUTES ///

// GET request for creating a Option. NOTE This must come before route that displays Option (uses id).
router.get('/option/create', option_controller.option_create_get);

//POST request for creating Option.
router.post('/option/create', option_controller.option_create_post);

// GET request to delete Option.
router.get('/option/:id/delete', option_controller.option_delete_get);

// POST request to delete Option.
router.post('/option/:id/delete', option_controller.option_delete_post);

// GET request to update Option.
router.get('/option/:id/update', option_controller.option_update_get);

// POST request to update Option.
router.post('/option/:id/update', option_controller.option_update_post);

// GET request for one Option.
router.get('/option/:id', option_controller.option_detail);

// GET request for list of all Option.
router.get('/options', option_controller.option_list);

module.exports = router;