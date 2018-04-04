(function ()
{
    'use strict';

    angular
        .module('app.admin.requests',
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
            .state('app.tinrequests', {
                abstract: true,
                url     : '/admin/requests'
            })
            .state('app.tinrequests.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/admin/requests/views/list-view/requests.html',
                        controller : 'AdminRequestsController as vm'
                    }
                },
                 resolve : {
                    currentAuth: ["auth", function (auth) {
                        // returns a promisse so the resolve waits for it to complete
                        return auth.$requireSignIn();
                    }],
                    tenantInfo: function(auth, authService){
                        return authService.retrieveTenant();
                    },
                    customers: function(adminService) {
                        return adminService.getCurrentCustomers();
                    },
                    users: function(userService) {
                        return userService.fetchUserList();
                    }
                },
                bodyClass: 'requests'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/admin/requests');

        // // Navigation
        msNavigationServiceProvider.saveItem('apps', {
            title : 'Applications',
            group : true,
            weight: 1
        });

        // Navigation

        msNavigationServiceProvider.saveItem('adminrequests', {
            weight: 0,
            title: 'TIN Requests',
            state: 'app.tinrequests.list',
            icon: 'icon-sale',
            roles: ['superuser', 'employee'],
            badgeId: 'new_requests'
        });
    }
})();