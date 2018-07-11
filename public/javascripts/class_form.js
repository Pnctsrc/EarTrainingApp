function validateForm() {
    const class_name = $("#class-name").val();
    const class_description = $("#class-description").val();

    if (!class_name) {
        window.alert("Please enter the name of the class.");
        return false;
    } else if (!class_description) {
        window.alert("Please enter the description of the class.");
        return false;
    } else {
        return true;
    }
}