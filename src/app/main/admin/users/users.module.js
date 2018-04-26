(function ()
{
    'use strict';

    angular
        .module('app.admin.employees',
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
            .state('app.employees', {
                abstract: true,
                url     : '/employees'
            })
            .state('app.employees.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/admin/users/views/list-view/users.html',
                        controller : 'UsersController as vm'
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
                    settings: function(adminService) {
                        return adminService.getCurrentSettings();
                    }
                },
                bodyClass: 'users'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/admin/users');


        // Navigation

        msNavigationServiceProvider.saveItem('employees', {
            title: 'Employees',
            state: 'app.employees.list',
            weight: 2,
            icon: 'icon-person-plus',
            roles: ['superuser']
        });
    }
})();