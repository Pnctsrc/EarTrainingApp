var Question = require('../models/question');
var Option = require('../models/option');
var Skill = require('../models/skill')

var mongoose = require('mongoose');
var async = require('async');

// Display list of all Questions.
exports.question_list = function (req, res) {
    res.send('NOT IMPLEMENTED: Question list');
};

// Display detail page for a specific Question.
exports.question_detail = function (req, res, next) {
    var question_id = mongoose.Types.ObjectId(req.params.id);

    //if the user has made a choice
    if (Object.keys(req.query).length > 0) {
        const functions = {};

        //find the question
        functions.question = function (callback) {
            Question.findById(question_id)
                .populate('options', 'category audio picture text correct _id feedback')
                .populate('skill', 'name url')
                .exec(function (err, question) {
                    if (err) {
                        callback(err, question);
                        return;
                    }

                    if (question) {
                        callback(null, question)
                    } else {
                        next();//this part should later be moved to validation section
                    }
                })
        }

        //check existence of each option
        //this part should later be moved to validation section
        var option_id_list = [];
        for (let query in req.query) {
            functions[query] = function (callback) {
               
                var current_option_id = mongoose.Types.ObjectId(req.query[query]);

                //check if the option exists
                Option.findById(current_option_id, function (err, option) {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (option) {
                        option_id_list.push(current_option_id);
                        callback(null, current_option_id);
                    } else {
                        next();
                    }
                })
            } 
        }

        async.parallel(functions, function (err, results) {
            var number_of_correct_answers = 0;
            for (let option of results.question.options) {
                if (option.correct) number_of_correct_answers++;
            }

            var correct_answers_chosen = 0;
            for (let option of results.question.options) {
                for (let current_option_id of option_id_list) {
                    var option_id = mongoose.Types.ObjectId(option._id);

                    if (current_option_id.equals(option_id)) {
                        option.if_correct = option.correct;
                        option.if_checked = true;

                        if (option.if_correct) correct_answers_chosen++;
                    } else {
                        delete option.feedback;//don't show other feedback to the users
                    }
                }
            }

            if (correct_answers_chosen < number_of_correct_answers) results.question.all_correct = false;

            res.render('question_detail', { question: results.question, options: results.question.options });
        })
    } else {
        Question.findById(question_id)
            .populate('options', 'category audio picture text feedback')
            .populate('skill', 'name url')
            .exec(function (err, question) {
                if (err) next(err);

                if (question) {
                    res.render('question_detail', { question: question, options: question.options });
                } else {
                    next();
                }
            })
    }
};

//Display questions for a specific Skill.
exports.question_for_skill = function (req, res, next) {
    var skill_id = mongoose.Types.ObjectId(req.params.id);
    var question_level = req.params.level;

    Question.findOne({ difficulty: question_level, skill: skill_id }, '_id')
        .populate('skill')
        .exec(function (err, question) {
            if (err) next(err);

            if (question) {
                res.redirect(question.url);
            } else {
                //if no questions found, stay on the same page
                res.redirect('/catalog/skill/' + skill_id);
            }
        })
}

// Display Question create form on GET.
function fetch_levels(current_level, level, skill_list, result) {
    //update level
    current_level.level = level;
    level++;
    result.push(current_level);

    if (current_level.sub_skills.length !== 0) {
        for (let sub_skill of current_level.sub_skills) {
            for (let skill of skill_list) {
                if (sub_skill.id == skill._id) {
                    fetch_levels(skill, level, skill_list, result);
                }
            }
        }
    } else {
        current_level.is_bottom = true;
    }
}

exports.question_create_get = function (req, res) {
    Skill.find({}, 'name parent description')
        .populate("sub_skills")
        .exec(function (err, skill_list) {
            if (err) { return next(err); }
            var sorted_list = [];

            for (let skill of skill_list) {
                if (!skill.parent) {
                    fetch_levels(skill, 0, skill_list, sorted_list);
                }
            }

            res.render('question_form', { title: 'Create New Question', skill_list: sorted_list });
        });
};

// Handle Question create on POST.
exports.question_create_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Question create POST');
};

// Display Question delete form on GET.
exports.question_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Question delete GET');
};

// Handle Question delete on POST.
exports.question_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Question delete POST');
};

// Display Question update form on GET.
exports.question_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Question update GET');
};

// Handle Question update on POST.
exports.question_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Question update POST');
};