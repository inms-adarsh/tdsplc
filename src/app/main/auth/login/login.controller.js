(function ()
{
    'use strict';

    angular
        .module('app.auth.login')
        .controller('LoginController', LoginController);

    /** @ngInject */
    function LoginController(auth, $state, $firebaseObject, authService, $scope, $timeout)
    {
        // Data
        var vm = this;
        // Methods
        vm.login = login;
        vm.retrieveTenantId = retrieveTenantId;
        //////////

        // auth.$onAuthStateChanged(function (authData) {
        //   if (authData) {
        //     if(!authService.getCurrentTenant()) {
        //       var userData = rootRef.child('users').child(authData.uid);
        //       var obj = $firebaseObject(userData);
        //       obj.$loaded().then(function(data) {
        //         $timeout(function() {
        //           $scope.userObj = data;
        //           authService.setCurrentTenant($scope.userObj);
        //           if($scope.userObj.role == 'customer') {
        //             $state.go('app.requests.list');
        //           } else {
        //             $state.go('app.tinrequests.list')
        //           }
        //           $state.go($state.current, {reload: true});
        //         });
        //       });
        //     } else {
        //       var role = JSON.parse(localStorage.getItem('role'));
        //       if(role == 'customer') {
        //         $state.go('app.requests.list');
        //       } else {
        //         $state.go('app.tinrequests.list')
        //       }
        //     }
        //   } else {
        //     $state.go('app.auth_login');
        //     localStorage.clear();
        //   }
        // });
        
        function login(loginForm) {
             auth.$signInWithEmailAndPassword(vm.form.email, vm.form.password)
              .then(function (authData) {
                vm.retrieveTenantId(authData);
              })
              .catch(function (error) {
               // showError(error);
                console.log("error: " + error);
              });
        }

        function retrieveTenantId(authData) {
            var tenantObj = rootRef.child('users').child(authData.uid);
            var obj = $firebaseObject(tenantObj);
            obj.$loaded().then(function(data) {
                authService.setCurrentTenant(data);
                if(!data.tenantId) {
                  $state.go('app.auth_tenant');
                } else {
                  if(data.role == 'customer') {
                    $state.go('app.requests.list');
                  } else {
                    $state.go('app.tinrequests.list')
                  }
                }
            });
        }
    }
})();