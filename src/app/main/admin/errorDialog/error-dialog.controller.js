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
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                },
                width: 50
            },{
                dataField: 'description',
                caption: 'Description' 
             }, {
                 dataField: 'reason',
                 caption: 'Reason'
             }],
             summary: {
                totalItems: [{
                    column: 'description',
                    summaryType: 'count'
                }]
            }
            
        };

        vm.closeDialog = function closeDialog() {
            $mdDialog.hide();
        };
       
    }
})();