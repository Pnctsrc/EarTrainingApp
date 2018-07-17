$(document).ready(function () {
    $(".new-assignment").click(function (event) {
        event.preventDefault();
        window.location += "/assignment/create";
    })
})