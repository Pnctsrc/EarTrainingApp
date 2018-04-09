var limit = 3;
$('input.form-check-input').on('change', function (event) {
    if ($("input[type=checkbox]:checked").length > limit) {
        this.checked = false;
        window.alert("You can choose at most " + limit + " options.");
    }
});