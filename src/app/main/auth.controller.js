(function ()
{
    'use strict';

    angular
        .module('tdsplc')
        .controller('AuthController', AuthController);

    /** @ngInject */
    function AuthController($scope, $rootScope)
    {
        // Data
        $scope.isTenantActive = JSON.parse(localStorage.getItem('tenantId'));
    }
})();