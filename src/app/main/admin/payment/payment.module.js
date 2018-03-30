(function ()
{
    'use strict';

    angular
        .module('app.admin.payment', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.payment_requests', {
            url      : '/payment-requests',
            views    : {
               
                'content@app': {
                    templateUrl: 'app/main/admin/payment/payment.html',
                    controller : 'PaymentController as vm', 
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
                        },
                        customers: function(adminService) {
                                return adminService.getCurrentCustomers();
                        },
                        users: function(userService) {
                            return userService.fetchUserList();
                        }
                    }
                }
            },
            bodyClass: 'paymment'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/admin/payment');

        // Navigation
        msNavigationServiceProvider.saveItem('payments', {
            title : 'Payment Requests',
            state : 'app.payment_requests',
            icon  : 'icon-store',
            weight: 1, 
            roles: ['superuser']
        });

    }

})();