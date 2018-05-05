(function ()
{
    'use strict';

    angular
        .module('app.admin.roles')
        .controller('UsersRolesController', UsersRolesController);

    /** @ngInject */
    function UsersRolesController($state, $scope, $mdDialog, $document, UserRoleService)
    {
        var vm = this;

        // Data
        
        // Methods
        vm.addDialog = addDialog;
        vm.editDialog = editDialog;
        init();
        //////////

        function init() {
            vm.roleGridOptions = UserRoleService.gridOptions('vm.roles');
        }

         /**
         * Add New Row
         */
        function addDialog(ev)
        {
            $mdDialog.show({
                controller         : 'UserDialogController',
                controllerAs       : 'vm',
                templateUrl        : 'app/main/admin/roles/views/dialogs/role-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: false,
                locals             : {
                    dialogData: {
                        dialogType: 'add'
                    }
                }
            });
        }

        /**
         * Edit Dialog
         */
        function editDialog(ev, formView, formData)
        {
            $mdDialog.show({
                controller         : 'UserDialogController',
                controllerAs       : 'vm',
                templateUrl        : 'app/main/apps/roles/views/dialogs/add-edit/edit-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: false,
                locals             : {
                    dialogData: {
                        chartData : vm.data,
                        dialogType: 'edit',
                        formView  : formView,
                        formData  : formData
                    }
                }
            });
        }

    }
})();