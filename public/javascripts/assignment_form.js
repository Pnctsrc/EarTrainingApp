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
        skill_index_map: {},
        skill_list: [],
        skill_ready: false,
        old_input_values: {},
        skill_tags_map: {},
        function_list: [],
    },
    created: function () {
        $.ajax({
            type: "GET",
            url: '/api/sorted_skill_list',
            success: function (data) {
                app.skill_list = data;

                //build skill_index_map
                for (var skill of data) {
                    app.skill_index_map[skill._id] = -1;
                }

                app.skill_ready = true;
            },
            error: function (err) {
                window.alert(err.responseText);
            },
            dataType: 'json'
        })
    },
    updated: function () {
        //jQuery DOM update
        for (var f of app.function_list) {
            f();
        }
        app.function_list = [];
    },
    methods: {
        update_dropdown: function () {
            //update mutiple selections
            for (var i = 0; i < app.skills.length; i++) {
                const skill_content = app.skills[i];

                //update menu
                if (app.skill_tags_map[skill_content.skill]) {
                    $("#skill_tags_" + i).dropdown("change values", app.skill_tags_map[skill_content.skill]);
                } else {
                    $("#skill_tags_" + i).dropdown("change values", []);
                }

                //update selection
                if (skill_content.tags.length != 0) {
                    $("#skill_tags_" + i).dropdown("set selected", skill_content.tags);
                } else {
                    $("#skill_tags_" + i).dropdown("clear");
                }
            }
        },
        dashes: function (level) {
            var dashes = '';
            for (var i = 0; i < level * 4; i++) {
                dashes += "-";
            }

            return dashes;
        },
        push_skill: function () {
            const skill_content = {
                skill: "",
                tags: [],
                if_instructor_only: false,
            }

            const new_skill_content_index = app.skills.length;

            app.function_list.push(function () {
                $("#skill_tags_" + new_skill_content_index).dropdown({
                    placeholder: "Choose tags for this skill",
                    onAdd: function (addedValue, addedText, $addedChoice) {
                        const tag_text = $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html().replace(/ \(count: \d+\)/, "");
                        $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html(tag_text);
                    },
                });
            })

            app.skills.push(skill_content);
            app.update_dropdown();
        },
        delete_skill: function (delete_index) {
            const skill_id = app.skills[delete_index].skill;
            app.skills.splice(delete_index, 1);
            app.update_skill_id(delete_index, null);

            //update index
            const new_old_input_values = {};
            for (var index in app.old_input_values) {
                if (index == delete_index) continue;
                if (index > delete_index) new_old_input_values[index - 1] = app.old_input_values[index];
                if (index < delete_index) new_old_input_values[index] = app.old_input_values[index];
            }

            app.old_input_values = new_old_input_values;
            app.skill_index_map[skill_id] = -1;

            app.update_dropdown();
        },
        fetch_tags: function (index) {
            const $dropdown = $("#skill_tags_div_" + index + " .ui.search")
            $dropdown.addClass("loading");

            const skill_id = $("#skill_input_" + index).val();       
            if (app.skill_tags_map[skill_id]) {
                $dropdown.removeClass("loading");
                $dropdown.removeClass("disabled");
                $dropdown.dropdown({
                    values: app.skill_tags_map[skill_id],
                    onAdd: function (addedValue, addedText, $addedChoice) {
                        const tag_text = $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html().replace(/ \(count: \d+\)/, "");
                        $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html(tag_text);
                    },
                });
            } else {
                $.ajax({
                    type: "POST",
                    url: "/class/skill/tags",
                    data: {
                        skill_id: skill_id,
                    },
                    dataType: "json",
                    success: function (data) {
                        app.skill_tags_map[skill_id] = process_tag_data(data);

                        $dropdown.removeClass("loading");
                        $dropdown.removeClass("disabled");
                        $dropdown.dropdown({
                            values: process_tag_data(data),
                            onAdd: function (addedValue, addedText, $addedChoice) {
                                const tag_text = $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html().replace(/ \(count: \d+\)/, "");
                                $(`.ui.label[data-value=${$addedChoice[0].dataset.value}]`).html(tag_text);
                            },
                        });
                    },
                    error: function (err) {
                        window.alert(err.responseText);
                        $dropdown.removeClass("loading");
                    }
                });
            }
        }, 
        update_skill_id: function (skill_content_index, event) {
            console.log("update")
            const old_input_values = app.old_input_values;
            const skill_index_map = app.skill_index_map;

            //update old value
            const old_skill_id = old_input_values[skill_content_index]
            if (old_skill_id) {
                skill_index_map[old_skill_id] = -1;
            }

            //set new value
            if (!event) {
                delete old_input_values[skill_content_index];
            } else {
                const new_skill_id = $(event.target).val();
                skill_index_map[new_skill_id] = skill_content_index;
                old_input_values[skill_content_index] = new_skill_id;
                app.skills[skill_content_index].skill = new_skill_id;
            }

            //update app data
            app.old_input_values = "";
            app.skill_index_map = "";
            app.old_input_values = old_input_values;
            app.skill_index_map = skill_index_map;
        },
        update_tags: function (skill_content_index) {
            app.function_list.push(function () {
                const tag_list = $(`#skill_tags_${skill_content_index} input[type=hidden]`).val().split(",");
                if (tag_list.length == 1 && !tag_list[0]) {

                } else {
                    app.skills[skill_content_index].tags = tag_list;
                }
            })

            //force reload
            const t_f = app.skills[skill_content_index].if_instructor_only
            app.skills[skill_content_index].if_instructor_only = !t_f;
            app.skills[skill_content_index].if_instructor_only = t_f;
        },
        check_skill: function (skill_id, skill_content_index) {
            if (app.skill_index_map[skill_id] == -1) {
                return false;
            } else {
                return app.skill_index_map[skill_id] != skill_content_index;
            }
        },
    },
})