(function ()
{
    'use strict';

    angular
        .module('app.payment', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.payment_credit', {
            url      : '/payment',
            views    : {
               
                'content@app': {
                    templateUrl: 'app/main/apps/payment/payment.html',
                    controller : 'PaymentRequestController as vm', 
                    resolve : {
                        currentAuth: ["auth", function (auth) {
                            // returns a promisse so the resolve waits for it to complete
                            return auth.$requireSignIn(true);
                        }],
                        tenantInfo: function(auth, authService, currentAuth){
                            return authService.retrieveTenant();
                        },
                        settings: function(adminService, currentAuth) {
                            return adminService.getCurrentSettings();
                        },
                        accounts: function( accountService){
                            return accountService.fetchAccountList();
                        },
                        users: function(adminService, currentAuth) {
                            return adminService.fetchEmployeeList();
                        }
                    }
                }
            },
            bodyClass: 'paymment'
        });

        
        // Translation
        $translatePartialLoaderProvider.addPart('app/main/apps/payment');

        // Navigation
        msNavigationServiceProvider.saveItem('payment', {
            title : 'Payment/Recharge',
            state : 'app.payment_credit',
            icon  : 'icon-store',
            weight: 2,
            roles: ['customer'],
            badgeId: ['new_requests']
        });

    }

})();