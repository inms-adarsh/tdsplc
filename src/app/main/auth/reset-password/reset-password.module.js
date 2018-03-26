(function ()
{
    'use strict';

    angular
        .module('app.auth.reset-password', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.auth_reset-password', {
            url      : '/auth/reset-password',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/auth/reset-password/reset-password.html',
                    controller : 'ResetPasswordController as vm',
                    resolve : {
                        currentAuth: ["auth", function (auth) {
                            // returns a promisse so the resolve waits for it to complete
                            return auth.$requireSignIn();
                        }]
                        
                    }
                }
            },
            bodyClass: 'tenant'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/auth/reset-password');

        // Navigation
    }

})();