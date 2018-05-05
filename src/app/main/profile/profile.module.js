(function ()
{
    'use strict';

    angular
        .module('app.profile',
            [
                // 3rd Party Dependencies
                'dx'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.profile', {
                abstract: true,
                url     : '/profile'
            })
            .state('app.profile.details', {
                url      : '/details',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/profile/views/list-view/profile.html',
                        controller : 'ProfileController as vm'
                    }
                },
                 resolve : {
                    currentAuth: ["auth", function (auth) {
                        // returns a promisse so the resolve waits for it to complete
                        return auth.$requireSignIn(true);
                    }],
                    tenantInfo: function(auth, authService, currentAuth){
                        return authService.retrieveTenant();
                    }
                },
                bodyClass: 'profile'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/profile');

        // Navigation

    }
})();