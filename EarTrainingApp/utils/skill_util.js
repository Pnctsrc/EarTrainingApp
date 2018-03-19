exports.fetch_skill_levels = function fetch_levels(current_level, level, skill_list, result) {
	//update level
	current_level.level = level;
	level++;
	result.push(current_level);

	if (current_level.sub_skills.length !== 0) {
		for (let sub_skill of current_level.sub_skills) {
			for (let skill of skill_list) {
				if (sub_skill.id == skill._id) {
					fetch_levels(skill, level, skill_list, result);
				}
			}
		}
    } else {
        if (current_level.parent) current_level.is_bottom = true;
	}
}