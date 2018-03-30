(function ()
{
    'use strict';

    angular
        .module('app.auth.tenant')
        .controller('TenantController', TenantController);

    /** @ngInject */
    function TenantController(authService, currentAuth, $mdToast)
    {
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
            authService.getCurrentUser(currentAuth.uid).then(function(data) {
                vm.userInfo = data;
                if('tenantId' in vm.userInfo || vm.userInfo.hasOwnProperty('tenantId') === true) {
                    vm.editMode = true;
                    vm.tenantIdExist = true;
                    authService.retrieveTenant(vm.userInfo.tenantId).then(function(tenantData){
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
          
           if(vm.editMode === true) {
             vm.editTenant(tenant);
           } else {
               tenant.date = new Date();
               tenant.date = new Date().toString();
               tenant.creditBalance = 0;
               authService.addTenant(tenant).then(function(key){
                    authService.updateUserTenantId(currentAuth.uid, key, vm.userInfo).then(function(){
                        authService.setCurrentTenant(key);
                        vm.editMode = true;
                        $mdToast.show({
                            template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Details Saved Successfully</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                            hideDelay: 7000,
                            controller: 'ToastController',
                            position : 'top right',
                            parent   : '#content',
                            locals: {
                                cssStyle: {

                                }
                            }
                        });
                    });
                  return key;
               }).catch(function(err){

               });
           }
        }

        /**
         * Edit Existing tenant
         * @param tenant Information object
         */
        function editTenant(tenant) {
           authService.updateTenantInfo(tenant, vm.tenantId).then(function(data){
                //authService.updateUserInfo(currentAuth.uid, data);
                $mdToast.show({
                    template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Details Saved Successfully</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                    hideDelay: 7000,
                    controller: 'ToastController',
                    position : 'top right',
                    parent   : '#content',
                    locals: {
                        cssStyle: {

                        }
                    }
                });
           }).catch(function(err){

           });
        }
    }
})();