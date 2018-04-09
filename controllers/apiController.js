var Question = require('../models/question');
var Option = require('../models/option');
var Skill = require('../models/skill');
var mongoose = require('mongoose');

var async = require('async');
var fs = require('fs');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;

const question_images_path = "./public/question_images/";
const question_audio_path = "./public/question_audio/";

// Get the list of all questions for a specific level of a skill
exports.questions_list = function (req, res, next) {
    var skill_id = mongoose.Types.ObjectId(req.body.skill);
    var question_level = req.body.level;

    Question.find({ difficulty: question_level, skill: skill_id })
        .populate('options')
        .populate('skill')
        .exec(function (err, questions) {
            if (err) return next(err);

            if (questions) {
                res.json(questions);
            } else {
                res.status(404).send("This level has no questions yet.");
            }
        })
};

// Check the answer and feedback of a question
exports.question_answer = function (req, res, next) {
    const body_options = req.body["options[]"];

    if (!body_options) {
        res.status(404).send("No choice made.");
    } else {
        const question_id = mongoose.Types.ObjectId(req.body.question);
        const user_options = [];

        if (typeof body_options === "string") {
            user_options.push(body_options)
        } else {
            for (option of body_options) {
                user_options.push(mongoose.Types.ObjectId(option));
            }
        }

        async.series({
            docs: function (callback) {
                Option.find({ _id: { $in: user_options } }, "feedback correct", function (err, docs) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, docs)
                    }
                });
            },
            count: function (callback) {
                Option.count({ question: question_id, correct: true }, function (err, count) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, count);
                    }
                })
            }
        }, function (err, results) {
            if (err) {
                return next(err);
            } else {
                var correct_answers = 0;
                for (var option of results.docs) {
                    if (option.correct) correct_answers++;
                }

                const result = {
                    list: results.docs
                }

                if (correct_answers != results.count && results.count > 1) {
                    result.not_all = true;
                }

                res.json(result);
            }
        })
    }
};

// Handle image upload
exports.upload_image = function (req, res, next) {
    if (!fs.existsSync(question_images_path)) {
        fs.mkdirSync(question_images_path);
    }
    const file_list = [];

    var index = 0;
    for (let file of req.files) {
        const file_type = file.mimetype.substring(0, 5);
        const file_extension = '.' + file.mimetype.substring(6);
        const date = (new Date()).getTime();

        let file_name =  date + "_" + index++ + "_temp" + file_extension;

        file_list.push(function (callback) {
            fs.writeFile(question_images_path + file_name, file.buffer, function (err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, question_images_path.substring(8) + file_name);
                }
            })
        })
    }

    async.series(file_list, function (err, results) {
        if (err) {
            return next(err);
        } else {
            res.json(results);
        }
    })
};

exports.delete_image = function (req, res, next) {
    const file_name = req.body.src.substring(req.body.src.lastIndexOf("/") + 1);

    if (!fs.existsSync(question_images_path + file_name)) {
        res.status(404).send();
    } else {
        fs.unlink(question_images_path + file_name, function (err) {
            if (err) {
                return next(err);
            } else {
                res.status(200).send();
            }
        })
    }
}

// Handle audio upload
exports.upload_audio = function (req, res, next) {
    if (!fs.existsSync(question_audio_path)) {
        fs.mkdirSync(question_audio_path);
    }

    const file = req.files[0];
    
    const file_type = file.mimetype.substring(0, 5);
    const file_extension = '.' + file.mimetype.substring(6);
    const date = (new Date()).getTime();

    let file_name = date + "_temp" + file_extension;

    fs.writeFile(question_audio_path + file_name, file.buffer, function (err) {
        if (err) {
            next(err);
        } else {
            res.json(question_audio_path.substring(8) + file_name)
        }
    })
};

exports.delete_audio = function (req, res, next) {
    const file_name = req.body.src.substring(req.body.src.lastIndexOf("/") + 1);

    if (!fs.existsSync(question_audio_path + file_name)) {
        res.status(404).send();
    } else {
        fs.unlink(question_audio_path + file_name, function (err) {
            if (err) {
                return next(err);
            } else {
                res.status(200).send();
            }
        })
    }
}

exports.sorted_skill_list = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .populate("sub_skills")
        .lean()
        .exec(function (err, skill_list) {
            if (err) { return next(err); }
            var sorted_list = [];

            for (let skill of skill_list) {
                if (!skill.parent) {
                    fetch_skill_levels(skill, 0, skill_list, sorted_list);
                }
            }

            var max_level = 0;
            for (let skill of sorted_list) {
                if (skill.level > max_level) max_level = skill.level;
            }

            const populate_depth = {
                path: 'parent',
            };
            function deep_populate(current_depth, n) {
                n++;
                if (n <= max_level) {
                    current_depth.populate = {
                        path: "parent",
                    }

                    deep_populate(current_depth.populate, n);
                } 
            }

            deep_populate(populate_depth, 0);

            Skill.populate(sorted_list, populate_depth, function (err, results) {
                if (err) {
                    return next(err);
                } else {
                    res.json(results);
                }
            })
        });
}

exports.skill_detail = function (req, res, next) {
    const skill_id = mongoose.Types.ObjectId(req.body.skill);
    const user_id = mongoose.Types.ObjectId(req.user_id);

    async.parallel({
        skill_doc: function (callback) {
            Skill.findById(skill_id)
                .lean()
                .exec(function (err, doc) {
                    if (err) {
                        next(err);
                    } else {
                        //make sure it's the same user
                        if (doc.creator.toString() !== user_id.toString()) {
                            next({
                                message: "You can't modify a skill created by another instructor."
                            })
                        } else {
                            callback(null, doc);
                        }
                    }
                })
        },
        children: function (callback) {
            Skill.find({ parent: skill_id }, "_id").lean().exec(callback);
        },
    }, function (err, results) {
        if (err) {
            next(err);
        } else {
            const data = {
                skill: results.skill_doc,
                children: [],
            }
            delete data.skill.id;
            delete data.skill.creator;
            delete data.skill.__v;

            for (var child of results.children) {
                data.children.push(child._id);
            }

            res.json(data);
        }
    })
}