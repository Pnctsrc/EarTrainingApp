$(document).ready(function () {
    if (Cookies.get("google_token")) {
        $("div.after-login").css("display", "block");
    } else {
        $("div.before-login").css("display", "block");
    }
})

window.onGoogleYoloLoad = (googleyolo) => {
    $("a.login-button").click(function (event) {
        const retrievePromise = googleyolo.retrieve({
            supportedAuthMethods: [
                "https://accounts.google.com",
            ],
            supportedIdTokenProviders: [
                {
                    uri: "https://accounts.google.com",
                    clientId: "755339202275-cfk242cgh1bedk9fbvuddrc4dpsoph1f.apps.googleusercontent.com",
                }
            ]
        });

        retrievePromise.then((credential) => {
            if (credential.idToken) {
                $("div.login-box").css("display", "none");
                $("div.during-login").css("display", "block");

                $.ajax({
                    type: "POST",
                    url: '/users/authenticate',
                    data: { token: credential.idToken },
                    success: function (data) {
                        Cookies.set("google_token", data.token, { expires: new Date(data.exp * 1000) });
                        $("div.login-box").css("display", "none");
                        $("div.after-login").css("display", "block");
                    },
                    dataType: 'json'
                }).fail(function (err) {
                    window.alert(err.statusText);
                    Cookies.remove("google_token", { path: '' });
                    $("div.login-box").css("display", "none");
                    $("div.before-login").css("display", "block");
                });
            } 
        }, (error) => {
            if (error.type === 'noCredentialsAvailable') {
                const hintPromise = googleyolo.hint({
                    supportedAuthMethods: [
                        "https://accounts.google.com",
                    ],
                    supportedIdTokenProviders: [
                        {
                            uri: "https://accounts.google.com",
                            clientId: "755339202275-cfk242cgh1bedk9fbvuddrc4dpsoph1f.apps.googleusercontent.com",
                        }
                    ]
                });

                hintPromise.then((credential) => {
                    if (credential.idToken) {
                        $("div.login-box").css("display", "none");
                        $("div.during-login").css("display", "block");

                        $.ajax({
                            type: "POST",
                            url: '/users/authenticate',
                            data: { token: credential.idToken },
                            success: function (data) {
                                Cookies.set("google_token", data.token, { expires: new Date(data.exp * 1000) });
                                $("div.login-box").css("display", "none");
                                $("div.after-login").css("display", "block");
                            },
                            dataType: 'json'
                        }).fail(function (err) {
                            window.alert(err.statusText);
                            Cookies.remove("google_token", { path: '' });
                            $("div.login-box").css("display", "none");
                            $("div.before-login").css("display", "block");
                        });
                    }
                }, (error) => {
                    switch (error.type) {
                        case "noCredentialsAvailable":
                            window.alert(error.message + " Either you don't currently have any Google account signed in, or your browser doesn't support Google one tap login.")
                            Cookies.remove("google_token", { path: '' });
                            $("div.login-box").css("display", "none");
                            $("div.before-login").css("display", "block");
                            break;
                    }
                });
            }
        });
    })

    $("a.logout-button").click(function (event) {
        Cookies.remove("google_token", { path: '' });
        $("div.login-box").css("display", "none");
        $("div.before-login").css("display", "block");
        googleyolo.disableAutoSignIn();
    })
};