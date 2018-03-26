(function ()
{
    'use strict';

    angular
        .module('tdsplc')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController($scope, $rootScope)
    {
        // Data

        //////////

        // Remove the splash screen
        $scope.$on('$viewContentAnimationEnded', function (event)
        {
            if ( event.targetScope.$id === $scope.$id )
            {
                $rootScope.$broadcast('msSplashScreen::remove');
            }
        });

        $scope.isTenantActive = JSON.parse(localStorage.getItem('tenantId'));
    }
})();