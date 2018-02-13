var Skill = require('../models/skill');
var Question = require('../models/question');
var Option = require('../models/option');

var async = require('async');

exports.index = function (req, res) {
    async.parallel({
        skill_count: function (callback) {
            Skill.count(callback);
        },
        question_count: function (callback) {
            Question.count(callback);
        },
        option_count: function (callback) {
            Option.count(callback);
        },
    }, function (err, results) {
        res.render('index', { title: 'EarTraining Home', error: err, data: results });
    });
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