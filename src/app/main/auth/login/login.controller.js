(function ()
{
    'use strict';

    angular
        .module('app.auth.login')
        .controller('LoginController', LoginController);

    /** @ngInject */
    function LoginController(auth, $rootScope, $state, $mdToast, $firebaseObject, authService, $scope, $timeout)
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
           $rootScope.loadingProgress = true;
             auth.$signInWithEmailAndPassword(vm.form.email, vm.form.password)
              .then(function (authData) {
                vm.retrieveTenantId(authData);
                $rootScope.loadingProgress = false;
              })
              .catch(function (error) {
               // showError(error);
               $mdToast.show({
                template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Invalid Username or Password</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                hideDelay: 7000,
                controller: 'ToastController',
                position : 'top right',
                parent   : '#content',
                locals: {
                    cssStyle: {

                    }
                }
              });
              
              $rootScope.loadingProgress = false;
              });
        }

        function retrieveTenantId(authData) {
            var userObj = rootRef.child('users').child(authData.uid);
            var obj = $firebaseObject(userObj);
            obj.$loaded().then(function(data) {
                authService.setCurrentTenant(data);
                if(!data.tenantId) {
                  $state.go('app.auth_tenant');
                } else {
                  if(data.role == 'customer') {
                    var tenantObj = rootRef.child('tenants').child(data.tenantId);
                    
                    $firebaseObject(tenantObj).$loaded(function(data) {
                      if(data.position == 'active') {
                        $state.go('app.requests.list');
                      } else {
                        $mdToast.show({
                          template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Account Not active!</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                          hideDelay: 7000,
                          controller: 'ToastController',
                          position : 'top right',
                          parent   : '#content',
                          locals: {
                              cssStyle: {

                              }
                          }
                        });
                      }
                    });
                  } else {
                    $state.go('app.tinrequests.list')
                  }
                }
            });
        }
    }
})();