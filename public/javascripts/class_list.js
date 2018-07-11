$(document).ready(function () {
    $(".enrollment-button").click(function (event) {
        event.preventDefault();
        $('.enrollment-panel').modal('toggle');
    })

    $('.enrollment-panel').on('hidden.bs.modal', function (e) {
        $("#enrollment-input").val("");
    })

    $(".enrollment-submit-button").click(function (event) {
        event.preventDefault();

        const class_id = $("#enrollment-input").val();

        if (!class_id) {
            window.alert("Please enter the class id.");
            return;
        }

        $(".enrollment-submit-button").text("Processing...");
        $(".enrollment-submit-button").prop("disabled", true);
        $(".enrollment-close-button").prop("disabled", true);
        $.ajax({
            type: "POST",
            url: '/class/enrollment/post',
            data: {
                class_id: class_id,
            },
            success: function () {
                //$('.enrollment-panel').modal('hide');
                //$(".enrollment-submit-button").text("Enroll");
                //$(".enrollment-submit-button").prop("disabled", false);
                //$("#enrollment-input").val("");

                window.location.reload();
            },
            error: function (err) {
                if (!err.responseJSON) {
                    window.alert($(err.responseText).find("h1").text());
                } else {
                    window.alert(err.responseJSON.message);
                }

                $('.enrollment-panel').focus();
                $(".enrollment-submit-button").text("Enroll");
                $(".enrollment-submit-button").prop("disabled", false);
                $(".enrollment-close-button").prop("disabled", false);
            },
            dataType: 'json',
        })
    })
})