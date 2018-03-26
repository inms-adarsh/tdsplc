(function ()
{
    'use strict';

    /**
     * Main module of the tdsplc
     */
    angular
        .module('tdsplc', [

            // Core
            'app.core',

            // Navigation
            'app.navigation',

            // Toolbar
            'app.toolbar',

            // Quick Panel
            'app.quick-panel',

            // Authentication
            'app.auth',

            //Firebase
            'firebase',

            //Email
            //'app.mail',

            //Admin
            'app.admin',

            //'app.bookings',
            //'app.vendings',
            //'app.records',
            'app.requests',
            'app.payment'
            //'app.bulkbuys'
        ]);
})();