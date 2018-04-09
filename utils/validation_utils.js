var Skill = require('../models/skill');

var async = require('async');
var mongoose = require('mongoose');
var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;
var utils = require('../utils/skill_util');

exports.validate_skill_create = function (req, res, next) {
    const req_data = {
        skill_parent: req.body.skill_parent,
        skill_children: req.body.skill_children,
        skill_requirements: req.body.skill_requirements,
    }

    async.waterfall([
        function (callback) {
            Skill.find({}, 'name parent description')
                .populate("sub_skills")
                .lean()
                .exec(function (err, skill_list) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
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
                    callback(null, { sorted_list: sorted_list, populate_depth: populate_depth });
                });
        },
        function (data, callback) {
            Skill.populate(data.sorted_list, data.populate_depth, function (err, docs) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, docs);
                }
            })
        },
    ], function (err, docs) {
        if (err) {
            return next(err);
        }

        const skill_children = [];
        const skill_requirements = [];
        if (req_data.skill_children) {
            if (typeof req_data.skill_children == 'string') {
                skill_children.push(mongoose.Types.ObjectId(req_data.skill_children));
            } else {
                for (var child of req_data.skill_children) {
                    skill_children.push(mongoose.Types.ObjectId(child));
                }
            }
        } 

        if (req_data.skill_requirements) {
            if (typeof req_data.skill_requirements == 'string') {
                skill_children.push(mongoose.Types.ObjectId(req_data.skill_requirements));
            } else {
                for (var req of req_data.skill_requirements) {
                    skill_children.push(mongoose.Types.ObjectId(req));
                }
            }
        }

        //data object
        const data = {
            req_list: skill_requirements,
            children_list: skill_children,
            skill_list: docs,
        }

        //generate index_list
        const index_list = {};
        for (var i = 0; i < docs.length; i++) {
            index_list[docs[i]._id] = i;
        }
        data.index_list = index_list;

        //parent index
        if (req_data.skill_parent) {
            const parent_id = mongoose.Types.ObjectId(req_data.skill_parent).toString();
            data.current_parent_index = data.index_list[parent_id];
            data.parent = data.skill_list[data.index_list[parent_id]];
        } else {
            data.current_parent_index = -1;
        }

        //validation

        //Requirements(including all their descendants), 
        //and children(including all their descendants) cannot be the parent.
        if (req_data.skill_parent) {
            const skill_parent_id = mongoose.Types.ObjectId(req_data.skill_parent);
            if (utils.if_disable_parent(skill_parent_id, data)) {
                next({
                    message: "Requirements(including all their descendants), and children(including all their descendants) cannot be the parent."
                });
                return;
            }

        }
        
        //Parent(including all its ancestors), requirements(including all their descendants), 
        //and descendants of the checked children cannot be the children.
        for (var child of data.children_list) {
            if (utils.if_disable_children(child, data)) {
                next({
                    message: "Parent(including all its ancestors), requirements(including all their descendants), and descendants of the checked children cannot be the children."
                });
                return;
            }
        }

        //Parent(including all its ancestors), children(including all their descendants), 
        //and descendants of the checked requirements cannot be the requirements.
        for (var req of data.req_list) {
            if (utils.if_disable_req(req, data)) {
                next({
                    message: "Parent(including all its ancestors), children(including all their descendants), and descendants of the checked requirements cannot be the requirements."
                });
                return;
            }
        }

        next();
    })
}