var Question = require('../models/question');
var Skill = require('../models/skill');

var mongoose = require('mongoose');
var async = require('async');

exports.class_enrollment_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_enrollment_post = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_create_post = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_edit_post = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_list_get = function (req, res, next) {
    res.render('class_list', { title: "Class list", class_list: [] });
}

exports.class_create_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_edit_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_assignment_list_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_assignment_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

