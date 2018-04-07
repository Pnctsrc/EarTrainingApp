var app = new Vue({
    el: '#app',
    data: {
        skill_list: [],
        ready: false,
        current_parent: '',
        current_parent_index: -1,
        show_parent: false,
        show_children: false,
        show_req: false,
        show_substitute: false,
        show_sep_skill: false,
        requirements: {},
        children: {},
    },
    created: function () {
        $.ajax({
            type: "GET",
            url: '/api/sorted_skill_list',
            success: function (data) {
                app.skill_list = data;
                app.ready = true;
            },
            dataType: 'json'
        })
    },
    updated: function () {
        $("span.glyphicon.glyphicon-question-sign").popover();

        //uncheck disabled children
        if ($("div.children-box label[disabled-label] input[type=checkbox]:checked")[0]) {
            $("div.children-box label[disabled-label] input[type=checkbox]").prop("checked", false);
            const current_children = app.children;

            for (var element of $("div.children-box label[disabled-label] input[type=checkbox]")) {
                if (current_children[$(element).val()]) {
                    delete current_children[$(element).val()];
                }
            }

            app.children = current_children;
        }

        //uncheck disabled parent
        if ($("div.parent-box label[disabled-label] input[type=radio]:checked")[0]) {
            app.current_parent = '';
        }
    },
    methods: {
        check_parent: function (event) {
            const skill_index = $(event.target.parentNode.parentNode).index() - 1;

            if (skill_index != -1) {
                app.current_parent_index = skill_index;
            } else {
                app.current_parent_index = -1;
            }

            if (app.skill_list[skill_index].is_bottom) {
                app.show_substitute = true;
            } else {
                app.show_substitute = false;
                app.show_sep_skill = false;
            }
        },
        check_children: function (event) {
            const child_index = $(event.target.parentNode.parentNode).index();
            const current_children = app.children;
            if (current_children[app.skill_list[child_index]._id]) {
                delete current_children[app.skill_list[child_index]._id]
            } else {
                current_children[app.skill_list[child_index]._id] = app.skill_list[child_index];
            }
            app.children = {};
            app.children = current_children;
        },
        check_none: function (event) {
            app.current_parent_index = -1;
        },
        generate_dashes: function (index) {
            var dashes = '';
            for (var i = 0; i < app.skill_list[index].level * 4; i++) {
                dashes += "-";
            }
            return dashes;
        },
        if_ancestor: function (index) {
            if (app.current_parent_index == -1) return false;

            const current_parent = app.skill_list[app.current_parent_index];

            var current_doc = current_parent;
            if (!current_doc.parent) {
                if (current_doc._id === app.skill_list[index]._id) return true;
            }
            while (current_doc.parent) {
                if (current_doc._id === app.skill_list[index]._id) return true;
                current_doc = current_doc.parent;
            }
            if (!current_doc.parent) {
                if (current_doc._id === app.skill_list[index]._id) return true;
            }

            return false;
        },
        if_descendant: function (index) {
            outer_loop: for (var child in app.children) {
                const current_child = app.children[child];
                if (current_child._id == app.skill_list[index]._id) return true;

                const current_child_index = $($("div.children-box input[value=\"" + current_child._id + "\"]")[0].parentNode.parentNode).index();
                const current_child_level = current_child.level;

                var current_lookup_index = current_child_index + 1;
                if (current_lookup_index >= app.skill_list.length) continue outer_loop;
                var current_lookup_child = app.skill_list[current_lookup_index];
                while (current_lookup_child.level > current_child.level) {
                    if (current_lookup_child._id == app.skill_list[index]._id) return true;
                    current_lookup_index++;
                    if (current_child_index >= app.skill_list.length) continue outer_loop;
                    current_lookup_child = app.skill_list[current_lookup_index];
                }
            }

            return false;
        },
    },
    watch: {
        current_parent: function (val, oldVal) {
            if ($("div.parent-box input[value=\"" + val + "\"]")[0]) {
                const new_index = $($("div.parent-box input[value=\"" + val + "\"]")[0].parentNode.parentNode).index() - 1;
                app.current_parent_index = new_index;
            } else {
                app.current_parent_index = -1;
            }
        },
    }
})

$(document).ready(function () {
    $("span.glyphicon.glyphicon-question-sign").popover();
})

function validateForm() {
    $("button.submit-button").attr("disabled", true);
    $("button.submit-button")[0].innerText = "Checking...";


    function validate() {
        if (!$("#skill_name").val()) {
            window.alert("Please input the name of the skill.");
            return false;
        }

        if (!$("#skill_description").val()) {
            window.alert("Please input the description of the skill.");
            return false;
        }

        if (app.current_parent_index != -1 && app.skill_list[app.current_parent_index].is_bottom) {
            if (!$("#if_replace_parent_true").is(":checked")) {
                if (!$("#sep_skill_name").val()) {
                    window.alert("Please input the name of the separate skill.");
                    return false;
                }

                if (!$("#sep_skill_description").val()) {
                    window.alert("Please input the description of the separate skill.");
                    return false;
                }
            }
        }
        
        return true;
    }

    if (!validate()) {
        $("button.submit-button").removeAttr("disabled", false);
        $("button.submit-button")[0].innerText = "Submit";
        return false;
    } 

    return true;
}