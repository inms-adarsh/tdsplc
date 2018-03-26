(function ()
{
    'use strict';

    angular
        .module('app.admin.roles',
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
            .state('app.roles', {
                abstract: true,
                url     : '/roles'
            })
            .state('app.roles.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/admin/users-roles/views/list-view/users-roles.html',
                        controller : 'UsersRolesController as vm'
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
                    settings: function(adminService) {
                        return adminService.getCurrentSettings();
                    }
                },
                bodyClass: 'roles'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/admin/users-roles');


        // Navigation

        msNavigationServiceProvider.saveItem('admin.roles', {
            title: 'Roles',
            state: 'app.roles.list',
            weight: 2,
            icon: 'icon-person-plus',
            roles: ['superuser']
        });
    }
})();