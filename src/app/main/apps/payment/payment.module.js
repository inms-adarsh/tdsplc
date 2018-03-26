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
                            return auth.$requireSignIn();
                        }],
                        tenantInfo: function(auth, authService){
                            return authService.retrieveTenant();
                        },
                        settings: function(adminService) {
                            return adminService.getCurrentSettings();
                        }
                    }
                }
            },
            bodyClass: 'paymment'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/apps/payment');

        // Navigation
        msNavigationServiceProvider.saveItem('apps.payment', {
            title : 'Payment/Recharge',
            state : 'app.payment_credit',
            icon  : 'icon-store',
            weight: 5,
            roles: ['customer']
        });

    }

})();