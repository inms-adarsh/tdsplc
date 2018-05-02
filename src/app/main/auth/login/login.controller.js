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

        auth.$onAuthStateChanged(function (authData) {
          if (authData) {
            if(authData.emailVerified) {
              vm.retrieveTenantId(authData);
            }
          } else {
            $state.go('app.auth_login');
            localStorage.clear();
          }
        });
        
        function login(loginForm) {
           $rootScope.loadingProgress = true;
             auth.$signInWithEmailAndPassword(vm.form.email, vm.form.password)
              .then(function (authData) {
                if(authData.emailVerified) {
                  vm.retrieveTenantId(authData);
                } else {
                  DevExpress.ui.dialog.alert('You have not yet verified your registered email address! Please verify your email to login. A verification link has been sent to you', 'Verify Email');
                  firebase.auth().currentUser.sendEmailVerification();
                  $rootScope.loadingProgress = false;
                }
              })
              .catch(function (error) {
               // showError(error);
                  DevExpress.ui.dialog.alert('Invalid Username or Password', 'Error');
              });
              
              $rootScope.loadingProgress = false;
        }

        function retrieveTenantId(authData) {
            var userObj = rootRef.child('users').child(authData.uid);
            var obj = $firebaseObject(userObj);
            obj.$loaded().then(function(data) {
                authService.setCurrentTenant(data);
                if(!data.tenantId) {
                  $state.go('app.auth_tenant');
                } else {
                  if(data.role == 'customer' || data.role == 'employee') {
                    var tenantObj;
                    if(data.role == 'customer') {
                      tenantObj = rootRef.child('tenants').child(data.tenantId);
                    } else if(data.role == 'employee') {
                      tenantObj = rootRef.child('employees').child(auth.$getAuth().uid);
                    }

                    $firebaseObject(tenantObj).$loaded(function(tenant) {
                      if(tenant.position == 'active') {
                        data.role == 'customer' ? $state.go('app.requests.list') : $state.go('app.tinrequests.list');
                      } else {
                        DevExpress.ui.dialog.alert('Account not Active ! Please wait untill administrator approves your account', 'Error');
                        auth.$signOut();
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