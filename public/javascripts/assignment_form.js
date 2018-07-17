$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();
})

function validateForm() {

    return false;
}

function process_tag_data(data) {
    const result = [];
    const name_count_map = {};
    const name_id_map = {};

    for (var question of data.tags) {
        for (var tag of question.tags) {
            if (!name_count_map[tag.name]) {
                name_count_map[tag.name] = 1;
                name_id_map[tag.name] = tag._id;
            } else {
                name_count_map[tag.name]++;
            }
        }  
    }

    for (var tag_name in name_count_map) {
        const tag_item = {
            name: `${tag_name} (count: ${name_count_map[tag_name]})`,
            value: name_id_map[tag_name],
        }

        result.push(tag_item);
    }

    return result;
}

var app = new Vue({
    el: '#app',
    data: {
        skills: [],
        tags: [],
        skill_name: "",
        skill_description: "",
        assignment_due_date: "",
        assignment_due_time: "",
    },
    updated: function () {
        $(".tag-list").dropdown({
            placeholder: "Choose tags for this skill", 
        });
    },
    methods: {
        push_skill: function () {
            const skill_content = {
                skill: "",
                tags: [],
                if_instructor_only: false,
            }

            app.skills.push(skill_content);
        },
        delete_skill: function (index) {

        },
        update_tags: function (index) {
            const $dropdown = $("#skill_tags_div_" + index + " .ui.search")
            $dropdown.addClass("loading");
            $("#skill_input_" + index + " .default-option").remove();

            const skill_id = $("#skill_input_" + index).val();           
            $.ajax({
                type: "POST",
                url: "/class/skill/tags",
                data: {
                    skill_id: skill_id,
                },
                dataType: "json",
                success: function (data) {
                    console.log(data);
                    $dropdown.removeClass("loading");
                    $dropdown.removeClass("disabled");
                    $dropdown.dropdown({
                        values: process_tag_data(data),
                        onAdd: function (addedValue, addedText, $addedChoice) {
                            const tag_text = $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html().replace(/ \(count: \d+\)/, "");
                            $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html(tag_text);
                        }
                    });
                },
                error: function (err) {
                    console.log(err);
                    $dropdown.removeClass("loading");
                    $dropdown.removeClass("disabled");
                }
            });
        }, 
        update_options: function (index) {

        },
    },
})