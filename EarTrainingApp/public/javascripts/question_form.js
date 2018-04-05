$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();

    $('#text_input').summernote({
        toolbar: [
            ['fontsize', ['fontsize']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'hr', 'picture', 'video']],
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