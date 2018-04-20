(function ()
{
    'use strict';

    angular
        .module('app.dashboards',
            [
                'app.dashboards.analytics'
            ]
        )
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider)
    {
        msNavigationServiceProvider.saveItem('analytics', {
            title: 'Dashboard',
            state: 'app.dashboard.analytics',
            weight: 0
        });
    }

})();