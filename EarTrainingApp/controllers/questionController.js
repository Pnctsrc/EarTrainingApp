var Question = require('../models/question');
var Option = require('../models/option');

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
    if (req.query.options !== undefined) {
        async.parallel({
            question: function (callback) {
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
                            next();
                        }
                    })
            },
            current_option_id: function (callback) {
                var current_option_id = mongoose.Types.ObjectId(req.query.options);

                //check if the option exists
                Option.findById(current_option_id, function (err, option) {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (option) {
                        callback(null, current_option_id)
                    } else {
                        next();
                    }
                })
            }
        }, function (err, results) {
            for (let option of results.question.options) {
                var option_id = mongoose.Types.ObjectId(option._id);

                if (results.current_option_id.equals(option_id)) {
                    option.if_correct = option.correct;
                    option.if_checked = true;
                }
            }

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
exports.question_create_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Question create GET');
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