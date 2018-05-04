(function ()
{
    'use strict';

    angular
        .module('app.admin')
        .controller('ErrorDialogController', ErrorDialogController);

    /** @ngInject */
    function ErrorDialogController(auth, $state, $firebaseObject, authService, $mdToast, $scope, $mdDialog, $document, $firebaseStorage, firebaseUtils, errors)
    {
        var vm = this,
            formInstance,
            tenantId = authService.getCurrentTenant();

        // Data

        
        vm.errorGridOptions = {
            dataSource: errors,
            columns: [{
                dataField: 'description',
                caption: 'Description' 
             }, {
                 dataField: 'reason',
                 caption: 'Reason'
             }]
        };

        vm.closeDialog = function closeDialog() {
            $mdDialog.hide();
        };
       
    }
})();