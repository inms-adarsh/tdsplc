(function ()
{
    'use strict';

    angular
        .module('app.auth.reset-password')
        .controller('ResetPasswordController', ResetPasswordController);

    /** @ngInject */
    function ResetPasswordController(currentAuth, authService, $mdToast)
    {
        // Data
        var vm = this;
        // Methods
        vm.updatePassword = updatePassword;
        //////////
        /**
         * Update user's password
         */
        function updatePassword(form) {
            authService.updatePassword(form).then(function(data){
                console.log(data);
            }).catch(function(){
                $mdToast.show({
                    template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Password Change Failed ! </span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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
        }
    }
})();