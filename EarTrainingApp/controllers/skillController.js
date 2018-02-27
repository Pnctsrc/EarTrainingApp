var Skill = require('../models/skill');
var Question = require('../models/question');
var Option = require('../models/option');

var async = require('async');
var mongoose = require('mongoose');

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
//function fetch_levels(current_level, level, skill_list, result) {
//    //update level
//    current_level.level = level;
//    level++;
//    result.push(current_level);

//    if (current_level.sub_skills) {
//        for (let sub_skill of current_level.sub_skills) {
//            for (let skill of skill_list) {
//                if (sub_skill.id == skill._id) {
//                    fetch_levels(skill, level, skill_list, result);
//                }
//            }
//        }
//    }
//}

exports.skill_list = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .exec(function (err, skill_list) {
            if (err) { return next(err); }
            //Successful, so render

            ////display as nested list
            //var sorted_list = [];

            //for (let skill of skill_list) {
            //    if (!skill.parent) {
            //        fetch_levels(skill, 0, skill_list, sorted_list);
            //    }
            //}

            res.render('skill_list', { title: 'Skill List', skill_list: skill_list });
        });
};

// Display detail page for a specific Skill.
exports.skill_detail = function (req, res) {
    var skill_id = mongoose.Types.ObjectId(req.params.id); 

    Skill.findById(skill_id, 'name description parent')
        .populate('sub_skills')
        .exec(function (err, the_skill) {
            if (err) { return next(err); }

            res.render('skill_detail', { title: 'Skill Detail', the_skill: the_skill });
        });
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