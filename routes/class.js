var express = require('express');
var router = express.Router();

// Require controller modules.
var class_controller = require('../controllers/classController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;

/// API ///

// GET request for enrollment
router.get('/enrollment/get', require_login, class_controller.class_enrollment_get);

// POST request for enrollment
router.post('/enrollment/post', require_login, class_controller.class_enrollment_post);

// POST request for creating a new class
router.post('/create', require_login, require_role, class_controller.class_create_post);

// POST request for modifying a class
router.post('/:id/edit', require_login, require_role, class_controller.class_edit_post);

/// CLASS ROUTES ///

// GET request for list of enrolled class
router.get('/', require_login, class_controller.class_list_get);

// GET request for creating a new class
router.get('/create', require_login, require_role, class_controller.class_create_get);

// GET request for modifying a class
router.get('/:id/edit', require_login, require_role, class_controller.class_edit_get);

// GET request for class details
router.get('/:id', require_login, class_controller.class_get);

// GET request for the list of assignments of a class
router.get('/:id/assignments', require_login, class_controller.class_assignment_list_get);

// GET request for creating a new assignment
router.get('/:id/assignment/create', require_login, class_controller.class_assignment_create_get);

// POST request for creating a new assignment
router.post('/:id/assignment/create', require_login, class_controller.class_assignment_create_post);

// GET request for editing an assignment
router.get('/:id/assignment/edit', require_login, class_controller.class_assignment_edit_get);

// POST request for editing an assignment
router.post('/:id/assignment/edit', require_login, class_controller.class_assignment_edit_post);

// GET request for a class assignment
router.get('/:class_id/assignment/:assignment_id', require_login, class_controller.class_assignment_get);

module.exports = router;