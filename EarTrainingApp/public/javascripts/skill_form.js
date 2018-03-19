$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();

    $("input[type='radio'][class!='replace-radio']").change(function (event) {
        if ($(this)[0].attributes[4]) {
            $(".separate-skill").css("display", "block");
        } else {
            $(".separate-skill").css("display", "none");
            $("input.replace-radio").removeAttr("checked");
            $(".sep-skill-box").css("display", "none");
            $("#sep_skill_name").val('');
            $("#sep_skill_description").val('');
        }
    })

    $("input[type='radio'][class='replace-radio']").change(function (event) {
        if ($(this)[0].id.match(/true/)) {
            $(".sep-skill-box").css("display", "none");
            $("#sep_skill_name").val('');
            $("#sep_skill_description").val('');
        } else {
            $(".sep-skill-box").css("display", "block");
        }
    })

    $(".toggle-chevron").click(function (event) {
        const toggle_target = $(this)[0].classList[2];
        const if_up = toggle_target.substring(toggle_target.lastIndexOf("-") + 1) == "up";
        const show_target = if_up
            ? toggle_target.substring(0, toggle_target.lastIndexOf("-")) + "-down"
            : toggle_target.substring(0, toggle_target.lastIndexOf("-")) + "-up"

        $("." + toggle_target).css("display", "none");
        $("." + show_target).css("display", "inline-block");

        const toggle_box = toggle_target.substring(0, toggle_target.indexOf("-"));
        if (!if_up) {
            $("." + toggle_box + "-box").css("display", "block");
        } else {
            $("." + toggle_box + "-box").css("display", "none");
        }
    })
})