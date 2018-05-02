(function () {
    'use strict';

    angular
        .module('app.auth.register')
        .controller('RegisterController', RegisterController);

    /** @ngInject */
    function RegisterController(auth, $state, $rootScope, $q, loginRedirectPath, $firebaseObject, $firebaseArray, $timeout, authService) {
        var vm = this;
        // Data

        // Methods\
        vm.register = register;
        vm.redirect = redirect;
        // auth.$onAuthStateChanged(function (authData) {
        //   if (authData) {
        //     $state.go('app.notes');
        //   }
        // });
        //////////
        function register() {
            $rootScope.loadingProgress = true;
            var user = {
                username: vm.form.username,
                email: vm.form.email,
                password: vm.form.password,
                role: 'customer'
            };

            authService.registerUser(user).then(function (data) {
                authService.createProfile(user, data).then(function () {
                    firebase.auth().currentUser.sendEmailVerification().then(function() {
                        $rootScope.loadingProgress = false;                    
                        DevExpress.ui.dialog.alert('An Verification link has been sent to your registered email Id! Please verify your email to proceed', 'Verify Email');
                        $state.go(loginRedirectPath);
                    }).catch(function(error) {
                    // An error happened.
                    });
                    //redirect();
                    var ref = rootRef.child('tenants');
                    $firebaseArray(ref).$loaded().then(function (tenantdata) {
                        if (tenantdata.length == 0) {
                            user.role = 'superuser';
                        }
                        if (user.role == 'superuser') {
                            delete user.usrPassword;
                            if (!user.date) {
                                user.date = new Date();
                            }
                            user.date = user.date.toString();

                            var ref = rootRef.child('employees').child(data.uid);
                            ref.set(user).then(function (data) {
                            });
                        }
                    });
                });
            });

        }

        // function createTenant(user) {
        //   var tenantObj = rootRef.child('tenants').child(user.uid),
        //       def = $q.defer();

        //   tenantObj.set({email: vm.form.email, name: vm.form.username}, function (err) {
        //       if (err) {
        //         def.reject(err);
        //       }
        //       else {
        //         def.resolve(tenantObj);
        //       }
        //    });
        //   return def.promise;
        // }


        // function createDefaultBook(user) {
        //     var bookObj = rootRef.child('tenant-books').child(user.uid),
        //       def = $q.defer(),
        //       bookData = {
        //         name: 'Default notebook',
        //         type: 'default'
        //       };

        //  $firebaseArray(bookObj).$add(bookData).then(function(ref) {
        //     $timeout(function () {
        //       if (ref.key) {
        //         def.resolve(ref);
        //       }
        //     });
        //   });
        //   return def.promise;
        // }

        // function createNotesBook(user) {
        //   var bookObj = rootRef.child('tenant-notes'),
        //       def = $q.defer();

        //  $firebaseArray(bookObj).$add(user.uid).then(function(ref) {
        //     $timeout(function () {
        //       if (ref.key) {
        //         def.resolve(ref);
        //       }
        //     });
        //   });
        //   return def.promise;
        // }

        // function createTenantUsers(user) {
        //     var tenantObj = rootRef.child('tenant-users').child(user.uid),
        //       def = $q.defer(),
        //       userData = {
        //         email: vm.form.email, 
        //         name: vm.form.username,
        //         userId: user.uid,
        //         role: 'admin'
        //       };

        //   $firebaseArray(tenantObj).$add(userData).then(function(ref) {
        //     $timeout(function () {
        //       if (ref.key) {
        //         def.resolve(ref);
        //       }
        //     });
        //   });
        //   return def.promise;
        // }

        function redirect() {
            var userObj = rootRef.child('users').child(auth.$getAuth().uid);
            var obj = $firebaseObject(userObj);
            obj.$loaded().then(function (data) {
                $rootScope.loadingProgress = false;
                authService.setCurrentTenant(data);
                $state.go('app.auth_tenant');
            });
        }
    }
})();