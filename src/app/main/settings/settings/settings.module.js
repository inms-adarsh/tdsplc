(function ()
{
    'use strict';

    angular
        .module('app.settings',
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
            .state('app.settings', {
                abstract: true,
                url     : '/settings'
            })
            .state('app.settings.list', {
                url      : '/list',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/settings/settings/views/list-view/settings.html',
                        controller : 'SettingsController as vm'
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
                    settings: function(settingsService) {
                        return settingsService.getCurrentSettings();
                    }
                },
                bodyClass: 'settings'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/settings/settings');

        // Api
        msApiProvider.register('settings.dashboard', ['app/data/e-commerce/dashboard.json']);
        msApiProvider.register('settings.products', ['app/data/e-commerce/products.json']);
        msApiProvider.register('settings.product', ['app/data/e-commerce/product.json']);
        msApiProvider.register('settings.orders', ['app/data/e-commerce/orders.json']);
        msApiProvider.register('settings.statuses', ['app/data/e-commerce/statuses.json']);
        msApiProvider.register('settings.order', ['app/data/e-commerce/order.json']);

        // Navigation

        msNavigationServiceProvider.saveItem('settings', {
            title: 'Settings',
            weight: 7,
            state: 'app.settings.list',
            roles: ['superuser']
        });
    }
})();