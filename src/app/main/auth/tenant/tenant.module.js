(function ()
{
    'use strict';

    angular
        .module('app.auth.tenant', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.auth_tenant', {
            url      : '/auth/tenant',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/auth/tenant/tenant.html',
                    controller : 'TenantController as vm', 
                    resolve : {
                        currentAuth: ["auth", function (auth) {
                            // returns a promisse so the resolve waits for it to complete
                            return auth.$requireSignIn(true);
                        }]
                    }
                }
            },
            bodyClass: 'tenant'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/auth/tenant');

        // Navigation
        msNavigationServiceProvider.saveItem('admin', {
            title : 'Admin',
            group : true,
            weight: 1
        });
       
        msNavigationServiceProvider.saveItem('tenant', {
            weight: 8,
            title: 'Tenant Information',
            state: 'app.auth_tenant',
            roles: ['superuser', 'customer']
        });
    }

})();