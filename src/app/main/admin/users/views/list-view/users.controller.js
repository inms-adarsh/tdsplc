(function ()
{
    'use strict';

    angular
        .module('app.admin.employees')
        .controller('UsersController', UsersController);

    /** @ngInject */
    function UsersController($state, $scope, $mdDialog, $document, userService)
    {
        var vm = this;

        // Data
        
      
        init();
        //////////

        function init() {
            vm.userGridOptions = userService.gridOptions('vm.users');
        }


    }
})();