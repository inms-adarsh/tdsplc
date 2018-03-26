(function ()
{
    'use strict';

    angular
        .module('app.admin.accounts',
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
            .state('app.accounts', {
                abstract: true,
                url     : '/accounts'
            })
            .state('app.accounts.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/admin/accounts/views/list-view/accounts.html',
                        controller : 'AccountsController as vm'
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
                bodyClass: 'accounts'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/admin/accounts');


        // Navigation

        msNavigationServiceProvider.saveItem('admin.accounts', {
            title: 'Employees',
            state: 'app.accounts.list',
            weight: 2,
            icon: 'icon-person-plus',
            roles: ['superaccount']
        });
    }
})();