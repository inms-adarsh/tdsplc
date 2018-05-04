(function () {
    'use strict';

    angular
        .module('app.paymentledger')
        .factory('paymentledgerService', paymentledgerService);

    /** @ngInject */
    function paymentledgerService($rootScope, $firebaseArray, $mdDialog, $mdToast, $firebaseObject, $compile, $q, adminService, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance,
            fvuInstance,
            scope = $rootScope.$new(),
            settings = {};
        // Private variables

        adminService.getCurrentSettings().then(function (data) {
            settings = data;
        });

        var service = {
            addpaymentledger: addpaymentledger
        };

        return service;
        /**
         * Request Form
         */
        /**
         * Grid Options for request list
         * @param {Object} dataSource 
         */
     

        /**
         * Add New tin request
         */

        function addpaymentledger(formData) {
            if (!formData.date) {
                formData.date = new Date();
            }
            formData.date = formData.date.toString();
            var ref = rootRef.child('tenant-paymentledgers');

            formData.user = auth.$getAuth().uid;
            return firebaseUtils.addData(ref, formData);
        }

    



    }
}());