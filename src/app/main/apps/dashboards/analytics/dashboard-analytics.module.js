(function ()
{
    'use strict';

    angular
        .module('app.dashboards.analytics',
            [
                // 3rd Party Dependencies
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, msApiProvider)
    {
        // State
        $stateProvider
        .state('app.dashboard', {
            abstract: true,
            url     : '/dashboard'
        }).state('app.dashboard.analytics', {
            url      : '/analytics',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/apps/dashboards/analytics/dashboard-analytics.html',
                    controller : 'DashboardAnalyticsController as vm'
                }
            },
            resolve  : {
                currentAuth: ["auth", function (auth) {
                    // returns a promisse so the resolve waits for it to complete
                    return auth.$requireSignIn();
                }],
                tenantInfo: function(auth, authService){
                    return authService.retrieveTenant();
                },
                settings: function(adminService) {
                    return adminService.getCurrentSettings();
                },
                customers: function(adminService) {
                    return adminService.getCurrentCustomers();
                },
                users: function(adminService) {
                    return adminService.fetchEmployeeList();
                }
            },
            bodyClass: 'analytics'
        });

    }

})();