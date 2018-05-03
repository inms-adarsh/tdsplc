(function ()
{
    'use strict';

    angular
        .module('app.admin', [
            'app.admin.customers',
            'app.admin.requests',
            'app.admin.payment',
            'app.admin.employees',
            'app.admin.accounts',
            'app.adminpaymentledger'
           // 'app.admin.beers'
            //'app.admin.kegs'
        ])
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider)
    {
        // Navigation
        // msNavigationServiceProvider.saveItem('admin', {
        //     title : 'Admin',
        //     group : true,
        //     weight: 2
        // });

    }
})();