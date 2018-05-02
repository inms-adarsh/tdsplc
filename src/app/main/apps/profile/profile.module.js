(function ()
{
    'use strict';

    angular
        .module('app.profile', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        $stateProvider.state('app.profile', {
            url      : '/profile',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/apps/profile/profile.html',
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
                },
                settings: function(adminService, currentAuth) {
                    return adminService.getCurrentSettings();
                },
                customers: function(adminService, currentAuth) {
                    return adminService.getCurrentCustomers();
                }
            },
            bodyClass: 'profile'
        });

        // Translation

        // Navigation
        msNavigationServiceProvider.saveItem('profile', {
            title : 'Profile',
            icon  : 'icon-account',
            state : 'app.profile',
            weight: 6
        });
    }

})();