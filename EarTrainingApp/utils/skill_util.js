exports.fetch_skill_levels = function fetch_levels(current_level, level, skill_list, result) {
	//update level
	current_level.level = level;
	level++;
	result.push(current_level);

	if (current_level.sub_skills.length !== 0) {
		for (let sub_skill of current_level.sub_skills) {
			for (let skill of skill_list) {
                if (sub_skill._id.toString() == skill._id.toString()) {
					fetch_levels(skill, level, skill_list, result);
				}
			}
		}
    } else {
        if (current_level.parent) current_level.is_bottom = true;
	}
}

function if_ancestor_parent(doc_id, data) {
    if (data.current_parent_index == -1) return false;

    var current_doc = data.parent;
    if (!current_doc.parent) {
        if (current_doc._id === doc_id) return true;
    }
    while (current_doc.parent) {
        if (current_doc._id === doc_id) return true;
        current_doc = current_doc.parent;
    }
    if (!current_doc.parent) {
        if (current_doc._id === doc_id) return true;
    }

    return false;
}

function if_descendant_children(doc_id, if_inclusive, data) {
    const index = data.index_list[doc_id];
    data.children = {};
    for (var child of data.children_list) {
        const child_index = data.index_list[child];
        data.children[child] = data.skill_list[child_index];
    }

    outer_loop: for (var child in data.children) {
        const current_child = data.children[child];
        if (current_child._id == data.skill_list[index]._id && if_inclusive) return true;

        const current_child_index = data.index_list[current_child._id];

        var current_lookup_index = current_child_index + 1;
        if (current_lookup_index >= data.skill_list.length) continue outer_loop;
        var current_lookup_child = data.skill_list[current_lookup_index];
        while (current_lookup_child.level > current_child.level) {
            if (current_lookup_child._id == data.skill_list[index]._id) return true;
            current_lookup_index++;
            if (current_child_index >= data.skill_list.length) continue outer_loop;
            current_lookup_child = data.skill_list[current_lookup_index];
        }
    }

    return false;
}

function if_descendant_requirements(doc_id, if_inclusive, data) {
    const index = data.index_list[doc_id];
    data.requirements = {};
    for (var req of data.req_list) {
        const req_index = data.index_list[req];
        data.children[req] = data.skill_list[req_index];
    }

    outer_loop: for (var req in data.requirements) {
        const current_req = data.requirements[req];
        if (current_req._id == data.skill_list[index]._id && if_inclusive) return true;

        const current_req_index = data.index_list[current_req._id];

        var current_lookup_index = current_req_index + 1;
        if (current_lookup_index >= data.skill_list.length) continue outer_loop;
        var current_lookup_req = data.skill_list[current_lookup_index];
        while (current_lookup_req.level > current_req.level) {
            if (current_lookup_req._id == data.skill_list[index]._id) return true;
            current_lookup_index++;
            if (current_req_index >= data.skill_list.length) continue outer_loop;
            current_lookup_req = data.skill_list[current_lookup_index];
        }
    }

    return false;
}

exports.if_disable_parent = function (doc_id, data) {
    if (if_descendant_children(doc_id.toString(), true, data)) return true;
    if (if_descendant_requirements(doc_id.toString(), true, data)) return true;
    return false;
}

exports.if_disable_children = function (doc_id, data) {
    if (if_ancestor_parent(doc_id.toString(), data)) return true;
    if (if_descendant_children(doc_id.toString(), false, data)) return true;
    if (if_descendant_requirements(doc_id.toString(), true, data)) return true;
    return false;
}

exports.if_disable_req = function (doc_id, data) {
    if (if_ancestor_parent(doc_id.toString(), data)) return true;
    if (if_descendant_children(doc_id.toString(), true, data)) return true;
    if (if_descendant_requirements(doc_id.toString(), false, data)) return true;
    return false;
}