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
            console.log(err);
        });
    },
    methods: {
        submit: function (event) {
            event.preventDefault();
            app.current_attempt++;
        },
        skip: function (event) {
            event.preventDefault();
            app.current_attempt = 1;
            app.current_index++;
        }
    },
    watch: {
        current_index: function (val, oldVal) {
            const question_length = app.questions.length;

            if (val == question_length) {
                app.questions = shuffle(app.questions);
                app.question_html = app.questions[0].html;
                app.options = app.questions[0].options;
                app.max_attempts = app.questions[0].attempts;
                app.current_index = 0;
            } else {
                app.question_html = app.questions[val].html;
                app.options = app.questions[val].options;
                app.max_attempts = app.questions[val].attempts;
            }
        }
    }
})