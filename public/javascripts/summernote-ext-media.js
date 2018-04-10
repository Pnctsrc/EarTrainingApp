(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {

    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    $.extend($.summernote.plugins, {
        /**
         * @param {Object} context - context object has status of editor.
         */
        'audio': function (context) {
            var self = this;
            var ui = $.summernote.ui;

            context.memo('button.audio', function () {
                var button = ui.button({
                    contents: '<i class="fas fa-music"></i>',
                    click: function () {
                        $('#audio_panel').modal({
                            keyboard: false,
                            backdrop: 'static',
                        })
                    }
                });

                var $audio = button.render();
                return $audio;
            });

            this.initialize = function () {
                const html = [
                    '<div id="audio_panel" class="modal fade" tabindex="-1" role="dialog">',
                        '<div class="modal-dialog" role="document">',
                            '<div class="modal-content">',
                                '<div class="modal-header">',
                                    '<h4 class="modal-title">Insert Audio</h4>',
                                '</div>',
                                '<div class="modal-body">',
                                    '<div class="form-group">',
                                        '<label for="audio_file_input">Select from files</label>',
                                        '<input id="audio_file_input" type="file" accept=".ma3, .wav">',
                                    '</div>',
                                    '<div class="form-group" style="overflow:auto;">',
                                        '<label for="audio_url_input">Audio URL</label>',
                                        '<input id="audio_url_input" class="form-control col-md-12" type="text">',
                                    '</div>',
                                '</div>',
                                '<div class="modal-footer">',
                                    '<button type="button" class="btn btn-default audio-close-button" data-dismiss="modal">Close</button>',
                                    '<button type="button" class="btn btn-primary audio-insert-button">Insert</button>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>',
                ].join('');
                this.$panel = $(html);

                this.$panel.appendTo('body');

                //attach events
                $('#audio_panel').on('show.bs.modal', function (e) {
                    $("#audio_file_input").val('');
                    $("#audio_url_input").val('');

                    $(".audio-close-button").removeAttr("disabled", false);
                    $(".audio-insert-button").removeAttr("disabled", false);
                    $("#audio_url_input").removeAttr("disabled", false);
                    $(".audio-insert-button")[0].innerText = "Insert";
                })

                $("button.audio-insert-button").click(function () {
                    const url_input = $("#audio_url_input").val();
                    const file_input = $("#audio_file_input").prop("files")[0];

                    const audio_node_html = [
                        '<p>',
                            '<audio controls>',
                                '<source src="' + url_input + '">',
                            '</audio>',
                        '</p>',
                    ].join('');
                    const audio_node = $(audio_node_html);
                    $('#text_input').summernote('insertNode', audio_node[0]);
                    $('#audio_panel').modal('hide');
                });

                $("#audio_file_input").change(function () {
                    const files = $(this).prop("files");
                    if (files.length > 1) {
                        window.alert("You can only insert one audio file at a time.");
                        $("#audio_file_input").val('');
                    } else if (files.length == 1) {
                        const current_audio_file = files[0];
                        const file_size = current_audio_file.size;
                        const file_extension = current_audio_file.type.substring(current_audio_file.type.lastIndexOf("/") + 1);
                        if (file_extension !== 'mp3' && file_extension !== 'wav') {
                            window.alert("Only mp3 and wav files are allowed.");
                            $("#audio_file_input").val('');
                            return;
                        } else if (file_size > 10485760) {
                            window.alert("Audio file can't be larger than 10MB.");
                            $("#audio_file_input").val('');
                            return;
                        }

                        //upload file
                        $(".audio-close-button").prop("disabled", true);
                        $(".audio-insert-button").prop("disabled", true);
                        $("#audio_url_input").prop("disabled", true);
                        $("#audio_url_input").val('');
                        $(".audio-insert-button")[0].innerText = "Uploading...";

                        var data = new FormData();
                        data.append("audio", current_audio_file);

                        $.ajax({
                            type: "POST",
                            url: '/api/upload_audio_s3_signature',
                            data: data,
                            cache: false,
                            contentType: false,
                            processData: false,
                            success: function (signature) {
                                $.ajax({
                                    type: 'PUT',
                                    url: signature.signedRequest,
                                    contentType: current_audio_file.type,
                                    processData: false,
                                    data: current_audio_file,
                                    success: function (upload_result) {
                                        const audio_node_html = [
                                            '<p>',
                                                '<audio controls>',
                                                    '<source src="' + signature.url + '">',
                                                '</audio>',
                                            '</p>',
                                        ].join('');
                                        const audio_node = $(audio_node_html);
                                        $('#text_input').summernote('insertNode', audio_node[0]);
                                        $('#audio_panel').modal('hide'); 
                                    },
                                    error: function (err) {
                                        $("#audio_file_input").val('');
                                        window.alert(err.statusText + " [" + err.status + "]");
                                        $(".audio-close-button").removeAttr("disabled", false);
                                        $(".audio-insert-button").removeAttr("disabled", false);
                                        $("#audio_url_input").removeAttr("disabled", false);
                                        $(".audio-insert-button")[0].innerText = "Insert";
                                    },
                                })
                            },
                            error: function (err) {
                                $("#audio_file_input").val('');
                                window.alert(err.statusText + " [" + err.status + "]");
                                $(".audio-close-button").removeAttr("disabled", false);
                                $(".audio-insert-button").removeAttr("disabled", false);
                                $("#audio_url_input").removeAttr("disabled", false);
                                $(".audio-insert-button")[0].innerText = "Insert";
                            },
                        })
                    }
                });
            };

            this.destroy = function () {
                this.$panel.remove();
                this.$panel = null;
            };
        },
        'image': function (context) {
            var self = this;
            var ui = $.summernote.ui;

            context.memo('button.image', function () {
                var button = ui.button({
                    contents: '<i class="fas fa-image"></i>',
                    click: function () {
                        $('#image_panel').modal({
                            keyboard: false,
                            backdrop: 'static',
                        })
                    }
                });

                var $image = button.render();
                return $image;
            });

            this.initialize = function () {
                const html = [
                    '<div id="image_panel" class="modal fade" tabindex="-1" role="dialog">',
                        '<div class="modal-dialog" role="document">',
                            '<div class="modal-content">',
                                '<div class="modal-header">',
                                    '<h4 class="modal-title">Insert Image</h4>',
                                '</div>',
                                '<div class="modal-body">',
                                    '<div class="form-group">',
                                        '<label for="image_file_input">Select from files</label>',
                                        '<input id="image_file_input" type="file" accept=".jpg, .jpeg, .png">',
                                    '</div>',
                                    '<div class="form-group" style="overflow:auto;">',
                                        '<label for="image_url_input">Audio URL</label>',
                                        '<input id="image_url_input" class="form-control col-md-12" type="text">',
                                    '</div>',
                                '</div>',
                                '<div class="modal-footer">',
                                    '<button type="button" class="btn btn-default image-close-button" data-dismiss="modal">Close</button>',
                                    '<button type="button" class="btn btn-primary image-insert-button">Insert</button>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>',
                ].join('');
                this.$panel = $(html);

                this.$panel.appendTo('body');

                //attach events
                $('#image_panel').on('show.bs.modal', function (e) {
                    $("#image_file_input").val('');
                    $("#image_url_input").val('');

                    $(".image-close-button").removeAttr("disabled", false);
                    $(".image-insert-button").removeAttr("disabled", false);
                    $("#image_url_input").removeAttr("disabled", false);
                    $(".image-insert-button")[0].innerText = "Insert";
                })

                $("button.image-insert-button").click(function () {
                    const url_input = $("#image_url_input").val();
                    $('#text_input').summernote('insertImage', url_input);
                    $('#image_panel').modal('hide');
                });

                $("#image_file_input").change(function () {
                    const files = $(this).prop("files");
                    if (files.length > 1) {
                        window.alert("You can only insert one image file at a time.");
                        $("#image_file_input").val('');
                    } else if (files.length == 1) {
                        const current_image_file = files[0];
                        const file_size = current_image_file.size;
                        const file_extension = current_image_file.type.substring(current_image_file.type.lastIndexOf("/") + 1);
                        if (file_extension !== 'png' && file_extension !== 'jpg' && file_extension !== 'jpeg') {
                            window.alert("Only png, jpg and jpeg files are allowed.");
                            $("#image_file_input").val('');
                            return;
                        } else if (file_size > 10485760) {
                            window.alert("Image file can't be larger than 10MB.");
                            $("#image_file_input").val('');
                            return;
                        }

                        //upload file
                        $(".image-close-button").prop("disabled", true);
                        $(".image-insert-button").prop("disabled", true);
                        $("#image_url_input").prop("disabled", true);
                        $("#image_url_input").val('');
                        $(".image-insert-button")[0].innerText = "Uploading...";

                        var data = new FormData();
                        data.append("images", current_image_file);

                        $.ajax({
                            type: "POST",
                            url: '/api/upload_image_s3_signature',
                            data: data,
                            cache: false,
                            contentType: false,
                            processData: false,
                            success: function (signature) {
                                $.ajax({
                                    type: 'PUT',
                                    url: signature.signedRequest,
                                    contentType: current_image_file.type,
                                    processData: false,
                                    data: current_image_file,
                                    success: function (upload_result) {
                                        $('#text_input').summernote('insertImage', signature.url);
                                        $('#image_panel').modal('hide');
                                    },
                                    error: function (err) {
                                        $("#image_file_input").val('');
                                        window.alert(err.statusText + " [" + err.status + "]");
                                        $(".image-close-button").removeAttr("disabled", false);
                                        $(".image-insert-button").removeAttr("disabled", false);
                                        $("#image_url_input").removeAttr("disabled", false);
                                        $(".image-insert-button")[0].innerText = "Insert";
                                    },
                                })
                            },
                            error: function (err) {
                                $("#image_file_input").val('');
                                window.alert(err.statusText + " [" + err.status + "]");
                                $(".image-close-button").removeAttr("disabled", false);
                                $(".image-insert-button").removeAttr("disabled", false);
                                $("#image_url_input").removeAttr("disabled", false);
                                $(".image-insert-button")[0].innerText = "Insert";
                            },
                        })
                    }
                });
            };

            this.destroy = function () {
                this.$panel.remove();
                this.$panel = null;
            };
        }
    });
}));