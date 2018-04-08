var Skill = require('../models/skill');
var Question = require('../models/question');
var Option = require('../models/option');

var async = require('async');
var mongoose = require('mongoose');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;
var _ = require('../utils/underscore');

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
exports.skill_list = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .exec(function (err, skill_list) {
            if (err) { return next(err); }

            res.render('skill_list', { title: 'Skill List', skill_list: skill_list });
        });
};

// Display detail page for a specific Skill.
exports.skill_detail = function (req, res, next) {
    var skill_id = mongoose.Types.ObjectId(req.params.id); 

    async.parallel({
        skill_list: function (callback) {
            Skill.findById(skill_id, 'name description parent')
                .populate('requirements')
                .populate('sub_skills')
                .exec(callback);
        },
        basic_count: function (callback) {
            Question.count({ skill: skill_id, difficulty: 'basic' }, callback);
        },
        intermediate_count: function (callback) {
            Question.count({ skill: skill_id, difficulty: 'intermediate' }, callback);
        },
        advanced_count: function (callback) {
            Question.count({ skill: skill_id, difficulty: 'advanced' }, callback);
        },
    }, function (err, result) {
        if (err) return next(err);
        console.log(result)
        res.render('skill_detail', {
            title: 'Skill Detail',
            the_skill: result.skill_list,
            basic_count: result.basic_count,
            intermediate_count: result.intermediate_count,
            advanced_count: result.advanced_count
        });
    })
};

// Display Skill create form on GET.
exports.skill_create_get = function (req, res) {
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

            res.render('skill_form', { title: 'Create New Skill', skill_list: sorted_list });
        });
};

// Handle Skill create on POST.
exports.skill_create_post = function (req, res, next) {
    const skill_name = req.body.skill_name;
    const skill_description = req.body.skill_description;
    const skill_parent = req.body.skill_parent;
    const sep_skill_name = req.body.sep_skill_name;
    const sep_skill_description = req.body.sep_skill_description;
    const skill_children = req.body.skill_children;
    const skill_requirements = req.body.skill_requirements;
    const if_replace_parent = req.body.if_replace_parent == 1;

    const new_skill = {
        name: skill_name,
        description: skill_description,
    }

    if (skill_parent) {
        new_skill.parent = skill_parent;
    }

    if (skill_requirements) {
        new_skill.requirements = skill_requirements;
    }

    const functions = [];

    //save the skill
    functions.push(function (callback) {
        var skill = new Skill(new_skill);
        skill.save(function (err, skill_doc) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, skill_doc, null);
            }
        });
    })

    //save the separate skill
    if (sep_skill_name) {
        if (if_replace_parent) {
            //modify the parent of the affected questions
            functions.push(function (skill_doc, arg, callback) {
                Question.updateMany({ parent: skill_doc.prent }, { parent: skill_doc._id }, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, skill_doc, null);
                    }
                })
            })
        } else {
            //find the skill to which the affected questions belongs
            functions.push(function (skill_doc, arg, callback) {
                Skill.findById(skill_doc.parent, "requirements", function (err, original_parent_doc) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, skill_doc, original_parent_doc);
                    }
                })
            })

            //create and save the separate skill
            functions.push(function (skill_doc, original_parent_doc, callback) {
                const sep_skill = {
                    name: sep_skill_name,
                    description: sep_skill_description,
                    parent: skill_doc.parent,
                    requirements: original_parent_doc.requirements
                }

                var skill = new Skill(sep_skill);
                skill.save(function (err, sep_skill_doc) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, skill_doc, sep_skill_doc);
                    }
                })
            })

            //modify the parent of the affected questions
            functions.push(function (skill_doc, sep_skill_doc, callback) {
                Question.updateMany({ skill: skill_doc.parent }, { skill: sep_skill_doc._id }, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, skill_doc, sep_skill_doc);
                    }
                })
            })
        }
    }

    //handle children
    if (skill_children) {
        functions.push(function (skill_doc, sep_skill_doc, callback) {
            Skill.updateMany({ _id: { $in: skill_children } }, { parent: skill_doc._id }, function (err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, skill_doc, sep_skill_doc);
                }
            })
        })
    }

    async.waterfall(functions, function (err, skill_doc, sep_skill_doc) {
        if (err) {
            async.parallel([
                function (callback) {
                    if (skill_doc) {
                        Skill.remove({ _id: skill_doc._id }, callback);
                    } else {
                        callback(null, 'done');
                    }
                },
                function (callback) {
                    if (sep_skill_doc) {
                        Skill.remove({ _id: sep_skill_doc._id }, callback);
                    } else {
                        callback(null, 'done');
                    }
                }
            ], function (error) {
                if (error) {
                    return next(error);
                } else {
                    return next(err);
                }
            })
        } else {
            res.redirect(skill_doc.url);
        }
    })
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