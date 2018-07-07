$(document).ready(function () {
    if (window.opener) {
        window.opener.postMessage("google-auth-auccess", "*");
        window.close();
    }
})