(function() {
    'use strict';

    angular
        .module('app.core')
        .factory('paymentService', paymentService);

    /** @ngInject */
    function paymentService($firebaseArray, $firebaseObject, auth, $q, $timeout, authService) {
        var currentUser;
        var service = {
            setCurrentToken: setCurrentToken,
            retrievePaymentHistory: retrievePaymentHistory
        };

        return service;

        //////////
        /**
         * Set Current User
         * @param {Object} User information object
         */
        function setCurrentToken(token, payObject) {
            token.tenantId = authService.getCurrentTenant();
            token.payObject = payObject;
            var tenantObj = rootRef.child('credit-requests'),
                def = $q.defer();

            $firebaseArray(tenantObj).$add(token).then(function(ref) {
                $timeout(function() {
                    if (ref.key) {
                        def.resolve(ref.key);
                    }
                });
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Get Current Settings
         * @param {String} Current Tenant Id
         */
        function retrievePaymentHistory() {
            var def = $q.defer(),
                ref = rootRef.child('settings'),
                obj = $firebaseObject(ref);

            obj.$loaded().then(function(data) {
                def.resolve(data);
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

 
    }

})();