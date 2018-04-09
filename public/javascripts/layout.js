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
                $("li.login-box").css("display", "none");
                $("li.during-login").css("display", "block");

                $.ajax({
                    type: "POST",
                    url: '/users/authenticate',
                    data: { token: credential.idToken, req_url: document.URL},
                    success: function (data) {
                        window.location.replace(data.url);
                    },
                    dataType: 'json'
                }).fail(function (err) {
                    window.alert(err.statusText);
                    Cookies.remove("google_token");
                    $("li.login-box").css("display", "none");
                    $("li.before-login").css("display", "block");
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
                        $("li.login-box").css("display", "none");
                        $("li.during-login").css("display", "block");

                        $.ajax({
                            type: "POST",
                            url: '/users/authenticate',
                            data: { token: credential.idToken, req_url: document.URL },
                            success: function (data) {
                                window.location.replace(data.url);
                            },
                            dataType: 'json'
                        }).fail(function (err) {
                            window.alert(err.statusText);
                            Cookies.remove("google_token");
                            $("li.login-box").css("display", "none");
                            $("li.before-login").css("display", "block");
                        });
                    }
                }, (error) => {
                    switch (error.type) {
                        case "noCredentialsAvailable":
                            window.alert(error.message + " Either you don't currently have any Google account signed in, or your browser doesn't support Google one tap login.")
                            Cookies.remove("google_token");
                            $("li.login-box").css("display", "none");
                            $("li.before-login").css("display", "block");
                            break;
                    }
                });
            }
        });
    })

    $("a.logout-button").click(function (event) {
        Cookies.remove("google_token");
        location.reload();
        googleyolo.disableAutoSignIn();
    })
};