$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();

    $('#text_input').summernote({
        toolbar: [
            ['fontsize', ['fontsize']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'hr', 'image', 'video', 'audio']],
        ],
        placeholder: 'Write the question here...',
        tabsize: 2,
        height: 250,
        callbacks: {
            onMediaDelete: function ($img) {
                $.ajax({
                    type: "POST",
                    url: "/api/delete_image_s3",
                    data: {
                        src: $img[0].src,
                    },
                    dataType: "application/json"
                });
            },
        }
    });

    $('.tag-inputbox').keyup(function (event) {
        var code = event.keyCode || event.which;
        if (code == 13) { 
            const tag = $(".tag-inputbox").val();
            app.tags.push({
                text: tag,
            })
            $(".tag-inputbox").val("");
        }
    })
})

var app = new Vue({
    el: '#app',
    data: {
        options: [],
        tags: [],
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
            data.append("tags", JSON.stringify(app.tags));

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
                    console.log(err);
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
            const option_index = $(event.target.parentNode.parentNode.parentNode.parentNode).index();
            if (event.target.files.length == 0) {
                app.options[option_index].content = "";
            } else {
                app.options[option_index].content = event.target.files;
            }

            if (event.target.files && event.target.files[0]) {
                const type = event.target.files[0].type.substring(0, 5);
                if (type == "image") {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $('#option_image_' + option_index).attr('src', e.target.result);
                    }
                    reader.readAsDataURL(event.target.files[0]);
                } else if (type == "audio") {
                    var sound = $('#option_audio_' + option_index)[0];
                    sound.src = URL.createObjectURL(event.target.files[0]);
                    sound.onend = function (e) {
                        URL.revokeObjectURL(this.src);
                    }
                }
            }
        },
        check_correct: function (event) {
            if ($(event.target).is(":checked")) {
                const option_index = $(event.target.parentNode.parentNode.parentNode.parentNode).index();
                app.options[option_index].feedback = "";
            }
        },
        check_audio: function (index) {
            if (!app.options[index].content) return false;
            return app.options[index].content[0].type.substring(0, 5) == "audio";
        },
        check_image: function (index) {
            if (!app.options[index].content) return false;
            return app.options[index].content[0].type.substring(0, 5) == "image";
        },
        delete_file_input: function (index) {
            app.options[index].content = "";
            $("#option_file_" + index).val("");
            $('#option_image_' + index).attr('src', "");
            $('#option_audio_' + index).attr('src', "");
        },
        delete_tag: function (index) {
            app.tags.splice(index, 1);
        },
    },
})