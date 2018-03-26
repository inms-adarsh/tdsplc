(function ()
{
    'use strict';

    angular
        .module('app.admin.accounts')
        .controller('AccountsController', AccountsController);

    /** @ngInject */
    function AccountsController($state, $scope, $mdDialog, $document, accountService)
    {
        var vm = this;

        // Data
        
      
        init();
        //////////

        function init() {
            vm.accountGridOptions = accountService.gridOptions('vm.accounts');
        }


    }
})();