(function ()
{
    'use strict';

    angular
        .module('app.requests',
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
            .state('app.requests', {
                abstract: true,
                url     : '/requests'
            })
            .state('app.requests.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/apps/requests/views/list-view/requests.html',
                        controller : 'RequestsController as vm'
                    }
                },
                 resolve : {
                    currentAuth: ["auth", function (auth) {
                        // returns a promisse so the resolve waits for it to complete
                        return auth.$requireSignIn();
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
                bodyClass: 'requests'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/apps/requests');

        // // Navigation
        // msNavigationServiceProvider.saveItem('apps', {
        //     title : 'Applications',
        //     group : true,
        //     weight: 1
        // });

        // Navigation

        msNavigationServiceProvider.saveItem('requests', {
            weight: 2,
            title: 'New/Pending TIN Requests',
            state: 'app.requests.list',
            icon: 'icon-sale',
            roles: ['customer']
        });
    }
})();