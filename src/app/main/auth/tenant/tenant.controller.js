(function () {
    'use strict';

    angular
        .module('app.auth.tenant')
        .controller('TenantController', TenantController);

    /** @ngInject */
    function TenantController($scope, authService, currentAuth, $mdToast, loginRedirectPath, auth) {
        var vm = this;
        // Data
        vm.tenant = [];
        vm.tenantIdExist = false;
        vm.editMode = false;
        // Methods
        vm.addTenant = addTenant;
        vm.editTenant = editTenant;
        init();

        /**
         * Init function 
         */
        function init() {
            authService.getCurrentUser(currentAuth.uid).then(function (data) {
                vm.userInfo = data;
                if ('tenantId' in vm.userInfo || vm.userInfo.hasOwnProperty('tenantId') === true) {
                    vm.editMode = true;
                    vm.tenantIdExist = true;
                    authService.retrieveTenant(vm.userInfo.tenantId).then(function (tenantData) {
                        vm.tenant = tenantData;
                        vm.tenantId = vm.userInfo.tenantId;
                    });
                } else {
                    vm.tenant.email = currentAuth.email;
                }
            });
        }

        /**
         * Add new tenant
         * @param tenant Information object
         */
        function addTenant(tenant) {
            $scope.disableBtn = true;
            if (vm.editMode === true) {
                vm.editTenant(tenant);
            } else {
                tenant.date = new Date();
                tenant.date = new Date().toString();
                tenant.creditBalance = 0;
                tenant.paymentType = 'prepaid';
                authService.addTenant(tenant).then(function (key) {
                    authService.updateUserTenantId(currentAuth.uid, key, vm.userInfo).then(function () {
                        authService.setCurrentTenant(key);
                        vm.editMode = true;                        
                        auth.$signOut();
                        $state.go(loginRedirectPath);
                        vm.authData = null;
                        localStorage.clear();
                        DevExpress.ui.dialog.alert('Details Saved Successfully', 'Success');
                        authService.removeCurrentUser();
                    });
                    return key;
                }).catch(function (err) {

                });
            }
        }

        /**
         * Edit Existing tenant
         * @param tenant Information object
         */
        function editTenant(tenant) {
            authService.updateTenantInfo(tenant, vm.tenantId).then(function (data) {
                //authService.updateUserInfo(currentAuth.uid, data);
                DevExpress.ui.dialog.alert('Details Saved Successfully', 'Success');
                $scope.disableBtn = false;
            }).catch(function (err) {

            });
        }
    }
})();