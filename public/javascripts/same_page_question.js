function shuffle(array) {
    var m = array.length, t, i;

    while (m) {
        i = Math.floor(Math.random() * m--);

        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

var app = new Vue({
    el: '#app',
    data: {
        questions: [],
        question_html: '',
        options: [],
        no_question: false,
        current_attempt: 1,
        current_index: 0,
        max_attempts: 0,
        feedback: [],
        skill: {},
        session: '',
    },
    created: function () {
        const url_path = window.location.pathname.split('/');
        const skill_id = url_path[3];
        const question_level = url_path[5]; 

        $.ajax({
            type: "POST",
            url: '/api/question_list',
            data: {
                skill: skill_id,
                level: question_level,
            },
            success: function (data) {
                if (data.questions.length !== 0) {
                    //apply session data
                    if (!data.session) {
                        app.questions = shuffle(data.questions);

                        //choose the first one
                        app.options = shuffle(app.questions[0].options);
                        app.max_attempts = app.questions[0].attempts == "unlimited" ? '0' : app.questions[0].attempts;
                        app.skill = app.questions[0].skill;
                        app.question_html = app.questions[0].html;
                    } else if (data.session.questions.length == 0) {
                        app.questions = shuffle(data.questions);
                        app.session = data.session;

                        //choose the first one
                        app.options = shuffle(app.questions[0].options);
                        app.max_attempts = app.questions[0].attempts == "unlimited" ? '0' : app.questions[0].attempts;
                        app.skill = app.questions[0].skill;

                        //send the shuffled list back to server
                        const question_id_list = [];
                        for (var question of app.questions) question_id_list.push(question._id);
                        $.ajax({
                            type: "POST",
                            url: '/api/update_session',
                            data: {
                                session_id: app.session._id,
                                questions: question_id_list,
                            },
                            success: function (data) {
                                //display the content
                                app.question_html = app.questions[0].html;
                            },
                            error: function (err) {
                                window.alert(err.message);
                            },
                            dataType: 'json',
                        })
                    } else {
                        app.session = data.session;
                    
                        //build lookup_list
                        const lookup_list = {};
                        for (var question of data.questions) {
                            lookup_list[question._id] = question;
                        }

                        const question_list = [];
                        for (var question_id of data.session.questions) {
                            question_list.push(lookup_list[question_id]);
                        }

                        //add data
                        app.questions = question_list;
                        app.current_attempt = app.session.current_attempt;
                        app.current_index = app.session.current_index;
                        app.options = shuffle(app.questions[data.session.current_index].options);
                        app.max_attempts = app.questions[data.session.current_index].attempts == "unlimited" ? '0' : app.questions[data.session.current_index].attempts;
                        app.skill = app.questions[data.session.current_index].skill;
                        app.question_html = app.questions[data.session.current_index].html;
                    }
                } else {
                    app.no_question = true;
                }
            },
            dataType: 'json'
        }).fail(function (err) {
            window.alert(err.message);
        });
    },
    methods: {
        submit: function (event) {
            event.preventDefault();
            $("button.function-button").attr("disabled", true);
            $("button.submit-button")[0].innerText = "Checking...";

            //collect answers
            const options = [];
            for (var option of $("input:checked")) {
                options.push(option.value);
            }

            if (options.length == 0) {
                window.alert("Please make at least one choice.");
                $("button.function-button").removeAttr("disabled", false);
                $("button.submit-button")[0].innerText = "Submit";
                return;
            }

            //check session
            if (app.session) {
                const data = {
                    options: options,
                    question: app.questions[app.current_index]._id,
                    current_attempt: app.current_attempt,
                    current_index: app.current_index,
                    session_id: app.session._id,
                }
                if (app.session.questions.length == 0) {
                    data.questions = [];
                    for (var question of app.questions) {
                        data.questions.push(question._id.toString());
                    }
                }

                $.ajax({
                    type: "POST",
                    url: '/api/question_answer',
                    data: data,
                    success: function (data) {
                        if (data.if_refresh) {
                            window.location = '';
                            return;
                        }

                        //clear saved answers and feedback
                        for (var option of app.options) {
                            Vue.set(option, "if_correct", undefined);
                            app.feedback = [];
                        }

                        const feedback_list = {};
                        for (var result of data.list) {
                            const option_id = result._id;
                            const option_index = $("div#option-" + option_id).index();
                            Vue.set(app.options[option_index], "if_correct", result.correct);

                            if (result.feedback) {
                                const feedback = {
                                    text: result.feedback,
                                    option_index: option_index,
                                }

                                feedback_list[option_index] = feedback;
                            }
                        }

                        if (data.not_all) {
                            app.feedback.push("not all");
                        }

                        for (var i = 0; i < 5; i++) {
                            if (feedback_list[i]) app.feedback.push(feedback_list[i]);
                        }

                        app.current_attempt++;

                        if (!data.if_perfect) {
                            $("button.function-button").removeAttr("disabled", false);
                            $("button.submit-button")[0].innerText = "Submit";
                        } else {
                            $("button.skip-button").removeAttr("disabled", false);
                            $("button.end-session-button").removeAttr("disabled", false);
                            $("button.submit-button")[0].innerText = "Perfect";
                        }
                        
                    },
                    error: function (err) {
                        window.alert(err.message);
                        $("button.function-button").removeAttr("disabled", false);
                        $("button.submit-button")[0].innerText = "Submit";
                    },
                    dataType: 'json',
                })
            } else {
                $.ajax({
                    type: "POST",
                    url: '/api/question_answer',
                    data: {
                        options: options,
                        question: app.questions[app.current_index]._id,
                        current_attempt: app.current_attempt,
                    },
                    success: function (data) {
                        //clear saved answers and feedback
                        for (var option of app.options) {
                            Vue.set(option, "if_correct", undefined);
                            app.feedback = [];
                        }

                        const feedback_list = {};
                        for (var result of data.list) {
                            const option_id = result._id;
                            const option_index = $("div#option-" + option_id).index();
                            Vue.set(app.options[option_index], "if_correct", result.correct);

                            if (result.feedback) {
                                const feedback = {
                                    text: result.feedback,
                                    option_index: option_index,
                                }

                                feedback_list[option_index] = feedback;
                            }
                        }

                        if (data.not_all) {
                            app.feedback.push("not all");
                        }

                        for (var i = 0; i < 5; i++) {
                            if (feedback_list[i]) app.feedback.push(feedback_list[i]);
                        }

                        app.current_attempt++;
                        $("button.function-button").removeAttr("disabled", false);
                        $("button.submit-button")[0].innerText = "Submit";
                    },
                    error: function (err) {
                        window.alert(err.message);
                        $("button.function-button").removeAttr("disabled", false);
                        $("button.submit-button")[0].innerText = "Submit";
                    },
                    dataType: 'json',
                })
            }
        },
        skip: function (event) {
            event.preventDefault();
            $("button.function-button").attr("disabled", true);

            if (app.session) {
                //The session already skipped on the server if the current result is perfect
                if ($("button.submit-button").html() != "Perfect") {
                    $.ajax({
                        type: "POST",
                        url: '/api/update_session',
                        data: {
                            session_id: app.session._id,
                        },
                        success: function (data) {
                            if (data.if_refresh) {
                                window.location = '';
                            } else {
                                //clear saved answers and feedback
                                for (var option of app.options) {
                                    Vue.set(option, "if_correct", undefined);
                                    app.feedback = [];
                                }
                                app.current_attempt = 1;
                                app.current_index++;

                                $("button.function-button").removeAttr("disabled", false);
                            }
                        },
                        error: function (err) {
                            window.alert(err.message);
                            $("button.function-button").removeAttr("disabled", false);
                        },
                        dataType: 'json',
                    })
                } else {
                    //clear saved answers and feedback
                    for (var option of app.options) {
                        Vue.set(option, "if_correct", undefined);
                        app.feedback = [];
                    }
                    app.current_attempt = 1;
                    app.current_index++;

                    $("button.function-button").removeAttr("disabled", false);
                }
            } else {
                //clear saved answers and feedback
                for (var option of app.options) {
                    Vue.set(option, "if_correct", undefined);
                    app.feedback = [];
                }
                app.current_attempt = 1;
                app.current_index++;

                $("button.function-button").removeAttr("disabled", false);
            }
        },
        end: function (event) {
            event.preventDefault();
            $("button.function-button").attr("disabled", true);

            $.ajax({
                type: "POST",
                url: '/api/delete_session',
                data: {
                    session_id: app.session._id,
                },
                success: function () {
                    window.location = '';
                },
                error: function (err) {
                    window.alert(err.message);
                    $("button.function-button").removeAttr("disabled", false);
                },
                dataType: 'json',
            })
        },
        check_option: function () {
            var limit = 3;
            $('input.form-check-input').on('change', function (event) {
                if ($("input:checked").length > limit) {
                    this.checked = false;
                    window.alert("You can choose at most " + limit + " options.");
                }
            });
        },
    },
    watch: {
        current_index: function (val, oldVal) {
            const question_length = app.questions.length;

            if (val == question_length) {
                if (app.session) {
                    $.ajax({
                        type: "POST",
                        url: '/api/delete_session',
                        data: data,
                        success: function () {
                            window.location = '';
                        },
                        error: function (err) {
                            window.alert(err.message);
                            $("button.function-button").removeAttr("disabled", false);
                            $("button.submit-button")[0].innerText = "Submit";
                        },
                        dataType: 'json',
                    })
                } else {
                    app.questions = shuffle(app.questions);
                    app.question_html = app.questions[0].html;
                    app.options = app.questions[0].options;
                    app.max_attempts = app.questions[0].attempts == "unlimited" ? '0' : app.questions[0].attempts;
                    app.current_index = 0;
                }
                const data = {
                    skill_id: app.skill._id,
                }
            } else {
                app.question_html = app.questions[val].html;
                app.options = app.questions[val].options;
                app.max_attempts = app.questions[val].attempts == "unlimited" ? '0' : app.questions[val].attempts;
            }
        }
    }
})