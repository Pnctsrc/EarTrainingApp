var Question = require('../models/question');

// Display list of all Questions.
exports.question_list = function (req, res) {
    res.send('NOT IMPLEMENTED: Question list');
};

// Display detail page for a specific Question.
exports.question_detail = function (req, res) {
    res.send('NOT IMPLEMENTED: Question detail: ' + req.params.id);
};

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