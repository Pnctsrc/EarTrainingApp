var Skill = require('../models/skill');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all Skills.
exports.skill_list = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill list');
};

// Display detail page for a specific Skill.
exports.skill_detail = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill detail: ' + req.params.id);
};

// Display Skill create form on GET.
exports.skill_create_get = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill create GET');
};

// Handle Skill create on POST.
exports.skill_create_post = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill create POST');
};

// Display Skill delete form on GET.
exports.skill_delete_get = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill delete GET');
};

// Handle Skill delete on POST.
exports.skill_delete_post = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill delete POST');
};

// Display Skill update form on GET.
exports.skill_update_get = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill update GET');
};

// Handle Skill update on POST.
exports.skill_update_post = function (req, res) {
	res.send('NOT IMPLEMENTED: Skill update POST');
};