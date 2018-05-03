(function ()
{
    'use strict';

    angular
        .module('app.paymentledger', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.paymentledger_credit', {
            url      : '/paymentledger',
            views    : {
               
                'content@app': {
                    templateUrl: 'app/main/apps/paymentledger/paymentledger.html',
                    controller : 'PaymentLedgerRequestController as vm', 
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
        $translatePartialLoaderProvider.addPart('app/main/apps/paymentledger');

        // Navigation
        msNavigationServiceProvider.saveItem('paymentledger', {
            title : 'credit/debit history',
            state : 'app.paymentledger_credit',
            icon  : 'icon-store',
            weight: 5,
            roles: ['customer']
        });

    }

})();