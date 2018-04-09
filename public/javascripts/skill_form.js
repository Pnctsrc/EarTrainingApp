var app = new Vue({
    el: '#app',
    data: {
        skill_list: [],
        list_ready: false,
        update_ready: false,
        current_parent: '',
        show_parent: false,
        show_children: false,
        show_req: false,
        show_substitute: false,
        show_sep_skill: false,
        requirements: {},
        children: {},
        skill_name: '',
        skill_description: '',
        index_list: {},
    },
    created: function () {
        $.ajax({
            type: "GET",
            url: '/api/sorted_skill_list',
            success: function (data) {
                app.skill_list = data;
                app.list_ready = true;

                //check if it's update
                const match_result = window.location.pathname.match(/^\/catalog\/skill\/([a-f\d]{24})\/update$/i);
                if (match_result) {
                    const skill_id = match_result[1];

                    $.ajax({
                        type: "POST",
                        data: {
                            skill: skill_id,
                        },
                        url: '/api/get_skill_detail',
                        success: function (data) {
                            const parent = data.skill.parent;
                            const children = data.children;
                            const requirements = data.skill.requirements;

                            app.skill_name = data.skill.name;
                            app.skill_description = data.skill.description;

                            //build index list
                            const index_list = {};
                            for (var i = 0; i < app.skill_list.length; i++) {
                                index_list[app.skill_list[i]._id] = i;
                            }
                            app.index_list = index_list;

                            if (parent) app.current_parent = parent;

                            if (children.length != 0) {
                                for (var child of children) {
                                    app.children[child] = app.skill_list[index_list[child]];
                                }
                            }

                            if (requirements.length != 0) {
                                for (var req of requirements) {
                                    app.requirements[req] = app.skill_list[index_list[req]];
                                }
                            }

                            app.update_ready = true;
                        },
                        dataType: 'json'
                    })
                } else {
                    //build index list
                    const index_list = {};
                    for (var i = 0; i < app.skill_list.length; i++) {
                        index_list[app.skill_list[i]._id] = i;
                    }
                    app.index_list = index_list;

                    app.update_ready = true;
                }
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

        //uncheck disabled requirements
        if ($("div.req-box label[disabled-label] input[type=checkbox]:checked")[0]) {
            $("div.req-box label[disabled-label] input[type=checkbox]").prop("checked", false);
            const current_req = app.requirements;

            for (var element of $("div.req-box label[disabled-label] input[type=checkbox]")) {
                if (current_req[$(element).val()]) {
                    delete current_req[$(element).val()];
                }
            }

            app.requirements = current_req;
        }
    },
    methods: {
        check_parent: function (event) {
            const skill_index = $(event.target.parentNode.parentNode).index() - 1;

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
        check_req: function (event) {
            const req_index = $(event.target.parentNode.parentNode).index();
            const current_req = app.requirements;
            if (current_req[app.skill_list[req_index]._id]) {
                delete current_req[app.skill_list[req_index]._id]
            } else {
                current_req[app.skill_list[req_index]._id] = app.skill_list[req_index];
            }

            app.requirements = {};
            app.requirements = current_req;
        },
        generate_dashes: function (index) {
            var dashes = '';
            for (var i = 0; i < app.skill_list[index].level * 4; i++) {
                dashes += "-";
            }
            return dashes;
        },
        if_ancestor_parent: function (index) {
            if (!app.current_parent) return false;

            const current_parent = app.skill_list[app.index_list[app.current_parent]];

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
        if_ancestor_children: function (index) {
            for (var child in app.children) {
                const current_req = app.children[child];

                var current_doc = current_req;
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
            }

            return false;
        },
        if_ancestor_req: function (index) {
            for (var req in app.requirements) {
                const current_req = app.requirements[req];

                var current_doc = current_req;
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
            }

            return false;
        },
        if_descendant_parent: function (index) {
            const current_parent_index = app.index_list[app.current_parent]
            const current_parent = app.skill_list[current_parent_index];
            if (current_parent._id == app.skill_list[index]._id) return true;

            var current_lookup_index = current_parent_index + 1;
            if (current_lookup_index >= app.skill_list.length) return false;
            var current_lookup_req = app.skill_list[current_lookup_index];
            while (current_lookup_req.level > current_parent.level) {
                if (current_lookup_req._id == app.skill_list[index]._id) return true;
                current_lookup_index++;
                if (current_parent_index >= app.skill_list.length) return false;
                current_lookup_req = app.skill_list[current_lookup_index];
            }

            return false;
        },
        if_descendant_children: function (index, if_inclusive) {
            outer_loop: for (var child in app.children) {
                const current_child_index = app.index_list[child];
                const current_child = app.children[child];
                if (current_child._id == app.skill_list[index]._id && if_inclusive) return true;


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
        if_descendant_requirements: function (index, if_inclusive) {
            outer_loop: for (var req in app.requirements) {
                const current_req_index = app.index_list[req];
                const current_req = app.requirements[req];
                if (current_req._id == app.skill_list[index]._id && if_inclusive) return true;

                var current_lookup_index = current_req_index + 1;
                if (current_lookup_index >= app.skill_list.length) continue outer_loop;
                var current_lookup_req = app.skill_list[current_lookup_index];
                while (current_lookup_req.level > current_req.level) {
                    if (current_lookup_req._id == app.skill_list[index]._id) return true;
                    current_lookup_index++;
                    if (current_req_index >= app.skill_list.length) continue outer_loop;
                    current_lookup_req = app.skill_list[current_lookup_index];
                }
            }

            return false;
        },
        if_disable_parent: function (index) {
            if (app.if_descendant_children(index, true)) return true;
            if (app.if_descendant_requirements(index, true)) return true;
            return false;
        },
        if_disable_children: function (index) {
            if (app.if_ancestor_parent(index)) return true;
            if (app.if_descendant_children(index, false)) return true;
            if (app.if_descendant_requirements(index, true)) return true;
            return false;
        },
        if_disable_req: function (index) {
            if (app.if_ancestor_parent(index)) return true;
            if (app.if_descendant_children(index, true)) return true;
            if (app.if_descendant_requirements(index, false)) return true;
            return false;
        },
        if_in_children: function (index) {
            return app.children[app.skill_list[index]._id] != undefined;
        },
        if_in_req: function (index) {
            return app.requirements[app.skill_list[index]._id] != undefined;
        },
    },
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

        const current_parent_index = app.index_list[app.current_parent];
        if (current_parent_index && app.skill_list[current_parent_index].is_bottom) {
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