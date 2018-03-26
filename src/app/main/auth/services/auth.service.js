(function() {
    'use strict';

    angular
        .module('app.auth')
        .factory('authService', authService);

    /** @ngInject */
    function authService($firebaseArray, $firebaseObject, auth, $q, $timeout) {
        var service = {
            setCurrentTenant: setCurrentTenant,
            getCurrentTenant: getCurrentTenant,
            updateUserInfo: updateUserInfo,
            getCurrentUser: getCurrentUser,
            removeCurrentUser: removeCurrentUser,
            registerUser: registerUser,
            createProfile: createProfile,
            addTenant: addTenant,
            updateUserTenantId: updateUserTenantId,
            retrieveTenant: retrieveTenant,
            updateTenantInfo: updateTenantInfo,
            addUserToTenant: addUserToTenant,
            updatePassword: updatePassword,
            forgotPassword: forgotPassword
        };

        return service;

        //////////
        /**
         * Set Current Tenant
         * @param {Object} User information object
         */
        function setCurrentTenant(data) {
            if(data.tenantId) {
                localStorage.setItem('tenantId', JSON.stringify(data.tenantId));
            }
            localStorage.setItem('role', JSON.stringify(data.role));
        }

         /**
         * get Current Tenant Id
         */
        function getCurrentTenant(data) {
             return localStorage.getItem('tenantId') ? localStorage.getItem('tenantId').replace(/["']/g, ""):null;
        }

        /**
         * update User Information
         * @param {Object} user Update User information object
         */
        function updateUserInfo(user) {
            var def = $q.defer(),
                ref = rootRef.child('users').child(uid),
                obj = $firebaseObject(ref);
            obj = user;
            obj.$save().then(function(ref) {
              ref.key() === obj.$id; // true
            }, function(error) {
              console.log("Error:", error);
            });
        }

         /**
         * update User Information
         * @param {Object} user Update User information object
         */
        function updateUserInfo(user) {
            var def = $q.defer(),
                ref = rootRef.child('users').child(uid),
                obj = $firebaseObject(ref);
           
        }
        /**
         * Get Current User
         * @param {String} Current User Id
         */
        function getCurrentUser(uid) {
            var def = $q.defer(),
                ref = rootRef.child('users').child(uid),
                obj = $firebaseObject(ref);

            obj.$loaded().then(function(data) {
                def.resolve(data);
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Remove Current User
         * @param data
         */
        function removeCurrentUser() {
            localStorage.removeItem('userObj')
        }

        /**
         * Register a tenant
         * @param {Object} user User information Object
         */
        function registerUser(user) {
            var def = $q.defer();

            auth.$createUserWithEmailAndPassword(user.email, user.password).then(function(data) {
                def.resolve(data);
            }).catch(function(err) {
                def.reject(err);
            });
            return def.promise;
        }

        /**
         * Create a Profile
         * @param {Object} user user information object
         * @param {Object} authData current User authentication information
         * @param {String} tenantId current Tenant Id
         */
        function createProfile(user, authData, tenantId) {
            var userObj = rootRef.child('users').child(authData.uid),
                def = $q.defer(),
                userData = {
                    email: user.email,
                    name: user.username,
                    role: user.role
                };

            if (tenantId) {
                userData.tenantId = tenantId;
            }
            userObj.set(userData, function(err) {
                $timeout(function() {
                    if (err) {
                        def.reject(err);
                    } else {
                        def.resolve(userObj);
                    }
                });
            });
            return def.promise;
        }

        /**
         * Create a Tenant
         * @param {Object} tenant Tenant Information object
         */
        function addTenant(tenant) {
            var tenantObj = rootRef.child('tenants'),
                def = $q.defer();

            $firebaseArray(tenantObj).$add(tenant).then(function(ref) {
                $timeout(function() {
                    if (ref.key) {
                        def.resolve(ref.key);
                    }
                });
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Add new tenantId
         * @param {String} tenant Id 
         */
        function updateUserTenantId(uid, tenantId, user) {
            var def = $q.defer(),
                mergeObj = {},
                userObj = {
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            mergeObj['users/' + uid + '/tenantId'] = tenantId;
            mergeObj['tenant-users/' + tenantId + '/' + uid] = userObj;
            rootRef.update(mergeObj, function(data) { 
                def.resolve(data);
            });
            return def.promise;
        }
        /**
         * Retrieve a tenant
         * @param {String} tenant Id
         */
        function retrieveTenant(tenantId) {
            if(!tenantId) {
                tenantId = this.getCurrentTenant();
            }
            var def = $q.defer(),
                ref = rootRef.child('tenants').child(tenantId),
                obj = $firebaseObject(ref);

           
            obj.$loaded().then(function(data) {
                def.resolve(data);
            }).catch(function(err){
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Update Tenant Information
         * @param {Object} tenant Information object
         */
        function updateTenantInfo(tenant, tenantId) {
             if(!tenantId) {
                tenantId = this.getCurrentTenant();
            }
            var tenantObj = rootRef.child('tenants').child(tenantId),
                def = $q.defer(),
                obj = $firebaseObject(tenantObj);

            obj.$loaded(tenant).then(function(ref) {
                obj = tenant;
                obj.$save().then(function(data){
                    def.resolve(data);
                }).catch(function(err){
                    def.reject(err);
                });
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Add User to a tenant
         * @param {String} tenant ID
         * @param {Object} user Information object
         */
        function addUserToTenant(tenantId, user) {
             var tenantObj = rootRef.child('tenants').child(tenantId),
                def = $q.defer();

            $firebaseArray(user).$add(tenant).then(function(ref) {
                $timeout(function() {
                    if (ref.key) {
                        def.resolve(ref.key);
                    }
                });
            }).catch(function(err) {
                def.reject(err);
            });

            return def.promise;
        }

        /**
         * Update user's password
         */
        function updatePassword(passwordObj) {
            var def = $q.defer();
            auth.$updatePassword(passwordObj.password, function(response) {
               def.resolve(response);
            }, function(error) {
              def.reject(errot);
            });

            return def.promise;
        }

        /**
         * Forgot Password
         */
        function forgotPassword(email) {
            var def = $q.defer();

            auth.$sendPasswordResetEmail(email).then(function() {
                  console.log("Password reset email sent successfully!");
            }).catch(function(error) {
                  console.error("Error: ", error);
             });
        }
    }

})();