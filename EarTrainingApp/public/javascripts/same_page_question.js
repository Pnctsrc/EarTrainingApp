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
                if (data.length !== 0) {
                    app.questions = shuffle(data);

                    //choose the first one
                    app.question_html = app.questions[0].html;
                    app.options = shuffle(app.questions[0].options);
                    app.max_attempts = app.questions[0].attempts == "unlimited" ? '0' : app.questions[0].attempts;
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
            $("button.submit-button").attr("disabled", true);
            $("button.submit-button")[0].innerText = "Checking...";

            //collect answers
            const options = [];
            for (var option of $("input:checked")) {
                options.push(option.value);
            }

            if (options.length == 0) {
                window.alert("Please make at least one choice.");
                $("button.submit-button").removeAttr("disabled", false);
                $("button.submit-button")[0].innerText = "Submit";
                return;
            }

            $.ajax({
                type: "POST",
                url: '/api/question_answer',
                data: {
                    options: options,
                },
                success: function (data) {
                    //clear saved answers and feedback
                    for (var option of app.options) {
                        Vue.set(option, "if_correct", undefined);
                        Vue.set(option, "feedback", undefined);
                    }

                    for (var result of data) {
                        const option_id = result._id;
                        const option_index = $("div#option-" + option_id).index();
                        Vue.set(app.options[option_index], "if_correct", result.correct);
                    }


                    app.current_attempt++;
                    $("button.submit-button").removeAttr("disabled", false);
                    $("button.submit-button")[0].innerText = "Submit";
                },
                dataType: 'json'
            }).fail(function (err) {
                window.alert(err.message);
                $("button.submit-button").removeAttr("disabled", false);
                $("button.submit-button")[0].innerText = "Submit";
            })
        },
        skip: function (event) {
            event.preventDefault();

            //clear saved answers and feedback
            for (var option of app.options) {
                Vue.set(option, "if_correct", undefined);
                Vue.set(option, "feedback", undefined);
            }

            app.current_attempt = 1;
            app.current_index++;
        },
        check_option: function () {
            var limit = 3;
            $('input.form-check-input').on('change', function (event) {
                if ($("input:checked").length > limit) {
                    this.checked = false;
                    window.alert("You can choose at most " + limit + " options.");
                }
            });
        }
    },
    watch: {
        current_index: function (val, oldVal) {
            const question_length = app.questions.length;

            if (val == question_length) {
                app.questions = shuffle(app.questions);
                app.question_html = app.questions[0].html;
                app.options = app.questions[0].options;
                app.max_attempts = app.questions[0].attempts == "unlimited" ? '0' : app.questions[0].attempts;
                app.current_index = 0;
            } else {
                app.question_html = app.questions[val].html;
                app.options = app.questions[val].options;
                app.max_attempts = app.questions[val].attempts == "unlimited" ? '0' : app.questions[val].attempts;
            }
        }
    }
})