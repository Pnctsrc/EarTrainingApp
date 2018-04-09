$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();

    $('#text_input').summernote({
        toolbar: [
            ['fontsize', ['fontsize']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'hr', 'picture', 'video', 'audio']],
        ],
        placeholder: 'Write the question here...',
        tabsize: 2,
        height: 250,
        callbacks: {
            onImageUpload: function (files) {
                //client side validation
                data = new FormData();
                for (file of files) {
                    if (file.size > 10485760) {
                        window.alert("Image size can't be larger than 10MB.");
                        return;
                    } else if (!file.type.match(/(png|jpeg|jpg)/)) {
                        window.alert("Only allow png, jpg or jpeg image.");
                        return;
                    } else {
                        data.append("images", file);
                    }
                }

                $.ajax({
                    data: data,
                    type: "POST",
                    url: "/api/upload_image",
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: function (urls) {
                        for (url of urls) {
                            $('#text_input').summernote('insertImage', url);
                        }
                    },
                    error: function (err) {
                        window.alert(err.statusText + "[" + err.status + "]");
                    }
                });
            },
            onMediaDelete: function ($img) {
                $.ajax({
                    type: "POST",
                    url: "/api/delete_image",
                    data: {
                        src: $img[0].src,
                    },
                    dataType: "application/json"
                });
            },
        }
    });
})

var app = new Vue({
    el: '#app',
    data: {
        options: [],
    },
    created: function () {
    },
    methods: {
        submit: function (event) {
            event.preventDefault();
            $("button.submit-button").attr("disabled", true);
            $("button.submit-button")[0].innerText = "Checking...";

            //client-side validate
            function validate() {
                if (app.options.length < 2) {
                    window.alert("You must have at least two options for this question.");
                    return false;
                }

                var correct_count = 0;
                for (var i = 0; i < app.options.length; i++) {
                    const option_number = i + 1;
                    const current_option = app.options[i];

                    if (current_option.is_text) {
                        if (!current_option.content) {
                            window.alert("Option " + option_number + " text is empty.");
                            return false;
                        }
                    } else {
                        if (!current_option.content) {
                            window.alert("Option " + option_number + " file is empty.");
                            return false;
                        } else {
                            const file_type = current_option.content[0].type.substring(0, 5);
                            const file_extension = current_option.content[0].type.substring(6);
                            if (file_type != "audio" && file_type != "image") {
                                window.alert("Option " + option_number + " must have an audio or image file.");
                                console.log(file_type);
                                console.log(file_extension);
                                return false;
                            } else if (!file_extension.match(/^(mp3|wav|jpg|jpeg|png)$/gi)) {
                                window.alert("Option " + option_number + " must have one of the following file types: mp3, wav, jpg, jpeg, or png.");
                                return false;
                            } else if (current_option.content[0].size > 10485760) {
                                window.alert("Option " + option_number + " can't have a file that is larger than 10MB.");
                                return false;
                            }
                        }
                    }

                    if (!current_option.if_correct && !current_option.feedback) {
                        window.alert("Please add feedback for option " + option_number + ".");
                        return false;
                    }

                    if (current_option.if_correct) correct_count++;
                }

                if (correct_count > 3) {
                    window.alert("You can have at most 3 correct options.");
                    return false;
                } else if (correct_count < 1) {
                    window.alert("You can have at least 1 correct option.");
                    return false;
                }

                return true;
            }

            if (!validate()) {
                $("button.submit-button").removeAttr("disabled", false);
                $("button.submit-button")[0].innerText = "Submit";
                return;
            }

            //collect data
            var data = new FormData();
            for (var i = 0; i < app.options.length; i++) {
                const option_number = i + 1;
                const current_option = app.options[i];

                if (!current_option.is_text) {
                    data.append("option_file_" + option_number, current_option.content[0]);
                } else {
                    data.append("option_text_" + option_number, current_option.content);
                }

                data.append("option_correct_" + option_number, current_option.if_correct);
                if (!current_option.if_correct) {
                    data.append("option_feedback_" + option_number, current_option.feedback);
                }
            }

            data.append("text", $('#text_input').summernote('code'));
            data.append("skill", $("#skill_input").val());
            data.append("difficulty", $("#difficulty").val());
            data.append("attempts", $("#attempts").val());

            $.ajax({
                type: "POST",
                url: '/catalog/question/create',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (data) {
                    window.location = data;
                    $("button.submit-button").removeAttr("disabled", false);
                    $("button.submit-button")[0].innerText = "Submit";
                },
                error: function (err) {
                    window.alert(err.message);
                    $("button.submit-button").removeAttr("disabled", false);
                    $("button.submit-button")[0].innerText = "Submit";
                },
            })
        },
        push_text: function (event) {
            if (app.options.length == 5) {
                window.alert("You can have at most 5 options.");
                return;
            }

            app.options.push({
                content: '',
                feedback: '',
                if_correct: false,
                is_text: true,
            })
        },
        push_file: function (event) {
            if (app.options.length == 5) {
                window.alert("You can have at most 5 options.");
                return;
            }

            app.options.push({
                content: '',
                feedback: '',
                if_correct: false,
                is_text: false,
            })
        },
        delete_option: function (event, target) {
            const option_index = $(event.target.parentNode).index();
            app.options.splice(option_index, 1);
        },
        file_input: function (event) {
            console.log()
            const option_index = $(event.target.parentNode.parentNode.parentNode.parentNode).index();
            if (event.target.files.length == 0) {
                app.options[option_index].content = "";
            } else {
                app.options[option_index].content = event.target.files;
            }
        },
        check_correct: function (event) {
            if ($(event.target).is(":checked")) {
                const option_index = $(event.target.parentNode.parentNode.parentNode.parentNode).index();
                app.options[option_index].feedback = "";
            }
        }
    },
})