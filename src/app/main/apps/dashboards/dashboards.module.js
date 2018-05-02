(function ()
{
    'use strict';

    angular
        .module('app.dashboards',
            [
                'app.dashboards.analytics',
                'app.dashboards.customers'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
        .state('app.dashboard', {
            abstract: true,
            url     : '/dashboard'
        })
        .state('app.dashboard.analytics', {
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
                tenantInfo: function(auth, authService, currentAuth){
                    return authService.retrieveTenant();
                },
                settings: function(adminService, currentAuth) {
                    return adminService.getCurrentSettings();
                },
                customers: function(adminService, currentAuth) {
                    return adminService.getCurrentCustomers();
                },
                users: function(adminService, currentAuth) {
                    return adminService.fetchEmployeeList();
                }
            },
            bodyClass: 'analytics'
        }).state('app.dashboard.customers', {
            url      : '/customers',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/apps/dashboards/customers/dashboard-customers.html',
                    controller : 'DashboardCustomersController as vm'
                }
            },
            resolve  : {
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
                },
                users: function(adminService, currentAuth) {
                    return adminService.fetchEmployeeList();
                },
                accounts: function( accountService){
                    return accountService.fetchAccountList();
                }
            },
            bodyClass: 'customers'
        });

        msNavigationServiceProvider.saveItem('analytics', {
            title: 'Dashboard',
            state: 'app.dashboard.analytics',
            weight: 0,
            roles: ['superuser']
        });

        msNavigationServiceProvider.saveItem('customer-dashboard', {
            title: 'Dashboard',
            state: 'app.dashboard.customers',
            weight: 0,
            roles: ['customer']
        });
    }

})();