(function ()
{
    'use strict';

    angular
        .module('app.auth.register')
        .controller('RegisterController', RegisterController);

    /** @ngInject */
    function RegisterController(auth, $state, $q, $firebaseArray, $timeout, authService)
    {
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
            var user = {
              username: vm.form.username,
              email: vm.form.email,
              password: vm.form.password,
              role: 'customer'
            };
            authService.registerUser(user).then(function(data) {
              authService.createProfile(user, data).then(function(data) {
                redirect();
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
            $state.go('app.auth_tenant');
        }
    }
})();