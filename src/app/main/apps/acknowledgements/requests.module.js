(function ()
{
    'use strict';

    angular
        .module('app.acknowledgements',
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
            .state('app.acknowledgements', {
                abstract: true,
                url     : '/acknowledgements'
            })
            .state('app.acknowledgements.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/apps/acknowledgements/views/list-view/requests.html',
                        controller : 'AcknowledgementsController as vm'
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
                bodyClass: 'acknowledgements'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/apps/acknowledgements');

        // // Navigation
        // msNavigationServiceProvider.saveItem('apps', {
        //     title : 'Applications',
        //     group : true,
        //     weight: 1
        // });

        // Navigation

        msNavigationServiceProvider.saveItem('acknowledgements', {
            weight: 2,
            title: 'Uploaded TIN Requests',
            state: 'app.acknowledgements.list',
            icon: 'icon-sale',
            roles: ['customer']
        });
    }
})();