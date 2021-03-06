var Question = require('../models/question');
var Option = require('../models/option');
var Skill = require('../models/skill');
var Tag = require('../models/tag');

var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;

var sanitizeHtml = require('sanitize-html');

var AWS = require('aws-sdk');
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.AWS_IDENTITY_POOL_ID,
});

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
                        next({
                            status: 404,
                            message: "Question not found."
                        });
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
                        next({
                            status: 404,
                            message: "Option not found."
                        });
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
                    next({
                        status: 404,
                        message: "Question not found."
                    });
                }
            })
    }
};


//Display questions for a specific Skill.
exports.question_for_skill = function (req, res, next) {
    const skill_id = mongoose.Types.ObjectId(req.params.id);
    const question_level = req.params.level;

    Question.count({ difficulty: question_level, skill: skill_id }, function (err, result) {
        if (err) return next(err);

        if (result != 0) {
            res.render('same_page_question');
        } else {
            next({
                message: "No question found for this level of the skill.",
                status: 404,
            });
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
    //removed the frist and last<p><br></p>
    if (req.body.text.substring(0, 11) === '<p><br></p>') {
        req.body.text = req.body.text.substring(11);
    }

    if (req.body.text.substring(req.body.text.length - 11) === '<p><br></p>') {
        req.body.text = req.body.text.substring(0, req.body.text.length - 11);
    }

    //sanitize html
    req.body.text = sanitizeHtml(req.body.text, {
        allowedTags: ['p', 'a', 'ul', 'ol', 'img', 'audio', 'source',
            'li', 'b', 'i', 'hr', 'br', 'span', 'iframe',
            'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        allowedAttributes: false,
        selfClosing: ['img', 'br', 'hr', 'link', 'source'],
        allowedSchemes: ['http', 'https'],
        allowedSchemesAppliedToAttributes: ['href', 'src'],
        allowProtocolRelative: true,
        allowedIframeHostnames: false,
    }); 

    const skill_id = mongoose.Types.ObjectId(req.body.skill);

    const new_question = {
        html: req.body.text,
        skill: skill_id,
        difficulty: req.body.difficulty,
        attempts: req.body.attempts,
        creator: res.locals.user_id,
    }

    var question = new Question(new_question);

    const option_list = [];
    const file_links = [];
    const upload_list = [];
    const question_tag_list = [];
    var new_tags = [];
    var count = 0;
    var correct_count = 0;
    var question_doc;
    async.series([
        function (callback) {
            question.save(function (err, doc) {
                if (err) {
                    callback(err, null);
                } else {
                    //handle options for update
                    question_doc = doc;
                    const question_id = doc._id;
                    const date = (new Date()).getTime();
                    for (var i = 1; i <= 5; i++) {
                        const option_text = req.body["option_text_" + i];
                        const option_feedback = req.body["option_feedback_" + i];
                        const option_correct = req.body["option_correct_" + i];
                        const option_file = req.files["option_file_" + i];

                        if (!option_text && !option_file) continue;
                        count++;
                        if (option_correct == "true") correct_count++;

                        const new_option = {
                            correct: option_correct,
                            question: question_id,
                        }

                        if (option_feedback) new_option.feedback = option_feedback;

                        if (!option_file) {
                            new_option.text = option_text;
                            new_option.category = 'text';
                        } else {
                            const file_type = option_file[0].mimetype.substring(0, 5);
                            const file_extension = '.' + option_file[0].mimetype.substring(6);
                            const file_name = date + (i + "_temp") + file_extension;
                            const bucket_name = process.env.AWS_S3_BUCKET_NAME;
                            let s3_key = '';
                            if (file_type == 'audio') {
                                s3_key = "Option_Audio/" + file_name;
                                new_option.category = 'audio';
                                new_option.audio = process.env.AWS_S3_LINK + s3_key;
                            } else if (file_type == 'image') {
                                s3_key = "Option_Images/" + file_name;
                                new_option.category = 'picture';
                                new_option.picture = process.env.AWS_S3_LINK + s3_key;
                            }

                            file_links.push(function (callback) {
                                s3.deleteObject({ Key: s3_key }, callback);
                            });

                            upload_list.push(function (callback) {
                                var s3 = new AWS.S3();
                                s3.putObject({
                                    Key: s3_key,
                                    Body: option_file[0].buffer,
                                    ACL: 'public-read',
                                    Bucket: bucket_name,
                                }, callback);
                            })
                        }

                        //create option list
                        var option = new Option(new_option);   
                        option_list.push(new Option(new_option));
                    }

                    callback(null);
                }
            })
        },
        function (callback) {//upload to S3
            async.series(upload_list, function (err) {
                if (err) {
                    callback(err, null);
                    return;
                }

                //validation
                if (count < 2) {
                    const new_error = {
                        status: 400,
                        message: "You must have at least two options for this question.",
                    }
                    callback(new_error, null);
                } else if (correct_count < 1) {
                    const new_error = {
                        status: 400,
                        message: "You must have at least 1 correct option.",
                    }
                    callback(new_error, null);
                } else if (correct_count > 3) {
                    const new_error = {
                        status: 400,
                        message: "You must have at least 1 correct option.",
                    }
                    callback(new_error, null);
                } else {
                    callback(null);
                }
            })
        },
        function (callback) {//save options
            Option.insertMany(option_list, callback);
        },
        function (callback) {//update old tags
            const tags = JSON.parse(req.body.tags);
            const tag_names = [];
            for (var tag of tags) {
                tag_names.push(tag.text);
            }

            Tag.find({ name: { $in: tag_names } }, function (err, tag_list) {
                if (err) {
                    callback(err, null);
                } else {
                    if (tag_list.length != 0) {
                        //create new tags list
                        check_loop: for (var tag_obj of tags) {
                            for (var tag of tag_list) {                        
                                if (tag.name === tag_obj.text) continue check_loop;
                            }

                            new_tags.push(tag_obj.text);
                        }

                        const tag_function_list = [];
                        for (let tag of tag_list) {
                            tag_function_list.push(function (callback) {
                                Tag.update({ _id: tag._id }, { $inc: { count: 1 } }, callback);
                            })
                        }

                        async.parallel(tag_function_list, function (err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                //save id list
                                for (var tag of tag_list) {
                                    question_tag_list.push(tag._id);
                                }

                                callback(null);
                            }
                        });
                    } else {
                        new_tags = tag_names;
                        callback(null);
                    }    
                }
            })
        },
        function (callback) {//save new tags
            if (new_tags.length != 0) {
                const new_tag_list = [];
                for (let tag_name of new_tags) {
                    const new_tag = new Tag({
                        name: tag_name,
                        count: 1
                    })

                    new_tag_list.push(new_tag);
                }

                Tag.insertMany(new_tag_list, function (err, docs) {
                    if (err) {
                        callback(err, null);
                    } else {
                        //save id list
                        for (var tag of docs) {
                            question_tag_list.push(tag._id);
                        }

                        callback(null);
                    }
                });
            } else {
                callback(null);
            }    
        },
        function (callback) {//update question doc
            Question.update({ _id: question_doc._id }, { $set: { tags: question_tag_list } }, callback);
        }
    ], function (err, result) {
        if (err) {
            file_links.push(function (callback) {
                Question.remove({ _id: question_doc._id }).exec(callback);
            })
            async.parallel(file_links, function (error) {
                const res_err = err || error;
                res.status(res_err.status || 500).send(res_err.message);
            })
        } else {
            res.json(question_doc.url);
        }
    })
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