(function ()
{
    'use strict';

    angular
        .module('app.auth.reset-password')
        .controller('ResetPasswordController', ResetPasswordController);

    /** @ngInject */
    function ResetPasswordController(currentAuth, authService)
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

            });
        }
    }
})();