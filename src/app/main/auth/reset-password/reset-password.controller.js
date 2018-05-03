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
                DevExpress.ui.dialog.alert('Password Updated Successfully', 'Success');
            }).catch(function(){
                DevExpress.ui.dialog.alert('Password Updated Failed ! Please check current password', 'Error');
            });
        }
    }
})();