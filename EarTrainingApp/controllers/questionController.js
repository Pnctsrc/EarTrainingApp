var Question = require('../models/question');
var Option = require('../models/option');
var Skill = require('../models/skill')

var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;

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
            if (err) {
                return next(err);
            }

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

    Question.findOne({ difficulty: question_level, skill: skill_id }, '_id attempts')
        .populate('skill')
        .exec(function (err, question) {
            if (err) next(err);

            if (question) {
                if (req.validated_token) {
                    res.render('same_page_question', { question: question });
                } else {
                    res.redirect(question.url);
                }
            } else {
                res.status(404).send("No question found for this level of the skill.");
            }
        }) 
}

// Display Question create form on GET.
exports.question_create_get = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .populate("sub_skills")
        .exec(function (err, skill_list) {
            if (err) { return next(err); }
            var sorted_list = [];

            for (let skill of skill_list) {
                if (!skill.parent) {
                    fetch_skill_levels(skill, 0, skill_list, sorted_list);
                }
            }

            res.render('question_form', { title: 'Create New Question', skill_list: sorted_list });
        });
};

// Handle Question create on POST.
exports.question_create_post = function (req, res, next) {
    async.parallel({
        skill_list: function (callback) {
            Skill.find({}, 'name parent description')
                .populate("sub_skills")
                .exec(function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, result);
                    }
                });
        },
        question: function (callback) {
            const skill_id = mongoose.Types.ObjectId(req.body.skill);

            const new_question = {
                html: req.body.text,
                skill: skill_id,
                difficulty: req.body.difficulty,
                attempts: req.body.attempts,
            }

            var question = new Question(new_question);

            question.save(function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            })
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }

        const question_id = results.question._id;

        //skill list
        var sorted_list = [];
        for (let skill of results.skill_list) {
            if (!skill.parent) {
                fetch_skill_levels(skill, 0, results.skill_list, sorted_list);
            }
        }

        //options
        const option_list = [];
        const file_links = [];
        var count = 0;
        for (var i = 1; i <= 5; i++) {
            const option_text = req.body["option_text_" + i];
            const option_feedback = req.body["option_feedback_" + i];
            const option_correct = req.body["option_correct_" + i];
            const option_file = req.files["option_file_" + i];

            if (!option_text && !option_file) continue;
            count++;

            const new_option = {
                correct: !!option_correct,
                feedback: option_feedback,
                question: question_id,
            }

            if (!option_file) {
                new_option.text = option_text;
                new_option.category = 'text';
            } else {
                const file_type = option_file[0].mimetype.substring(0, 5);
                const file_extension = '.' + option_file[0].mimetype.substring(6);
                const file_name = question_id + i + file_extension;

                if (file_type == 'audio') {
                    new_option.category = 'audio';
                    fs.writeFileSync('./public/audio/' + file_name, option_file[0].buffer);
                    new_option.audio = '/audio/' + file_name;
                    file_links.push(function (callback) {
                        fs.unlink('./public/audio/' + file_name, callback);
                    });
                } else if (file_type == 'image'){
                    new_option.category = 'picture';
                    fs.writeFileSync('./public/pics/' + file_name, option_file[0].buffer);
                    new_option.picture = '/pics/' + file_name;
                    file_links.push(function (callback) {
                        fs.unlink('./public/pics/' + file_name, callback);
                    });
                }
            }

            //create option list
            var option = new Option(new_option);
            option_list.push(new Option(new_option));
        }

        if (count < 2) {
            file_links.push(function (callback) {
                Question.remove({ _id: question_id }).exec(callback);
            })
            async.parallel(file_links, function (err) {
                if (err) return next(err);
                return next({ message: "You must have at least two options for this question." });
            })
            
            return;
        }

        //save options
        Option.insertMany(option_list, function (err, docs) {
            if (err) {
                file_links.push(function (callback) {
                    Question.remove({ _id: question_id }).exec(callback);
                })
                async.parallel(file_links, function (error) {
                    if (error) return next(error);
                    return next(err);
                })
            } else {
                res.redirect(results.question.url);
            }
        })
    });
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