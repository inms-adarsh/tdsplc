(function ()
{
    'use strict';

    angular
        .module('app.adminpaymentledger', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.admin_paymentledger_credit', {
            url      : '/admin/paymentledger',
            views    : {
               
                'content@app': {
                    templateUrl: 'app/main/admin/paymentledger/paymentledger.html',
                    controller : 'AdminPaymentLedgerRequestController as vm', 
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
            state : 'app.admin_paymentledger_credit',
            icon  : 'icon-store',
            weight: 5,
            roles: ['superuser']
        });

    }

})();