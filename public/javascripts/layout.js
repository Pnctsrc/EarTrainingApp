function google_oauth() {
    const url = '/users/auth/google';
    const name = 'google_oauth';
    const width = 500, height = 500;
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    const specs = `width=${width},height=${height},top=${top},left=${left}`;
    window.open(url, name, specs);
}

$(document).ready(function () {
    //wait for login success
    window.addEventListener('message', function (e) {
        if (e.data == 'google-auth-auccess') window.location.reload();
    });

    $("a.login-button").click(function (event) {
        event.preventDefault();
        google_oauth();
    });
})