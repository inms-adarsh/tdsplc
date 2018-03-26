(function () {
    'use strict';

    angular
        .module('app.admin.roles')
        .factory('UserRoleService', UserRoleService);

    /** @ngInject */
    function UserRoleService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            dxFormInstance;
        // Private variables

        var service = {
            formOptions: formOptions,
            gridOptions: gridOptions,
            saveUser: saveUser,
            updateUser: updateUser,
            fetchUserList: fetchUserList
        };

        var clientStatus = [{
            id: 'active',
            name: 'Enabled'
        }, {
            id: 'deactive',
            name: 'Disabled'
        }];
        return service;

        //////////

        /**
         * Return form Item Configuration
         * @returns {Object} Item configuration
         */
        function formOptions() {
            var formOptionsItems = {

                bindingOptions: {
                    formData: 'vm.roles'
                },
                colCount: 2,
                items: [
                    {
                        dataField: 'name',
                        label: {
                            text: 'Name'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }],
                        name: 'rolename'
                    }, {
                        dataField: 'desc',
                        label: {
                            text: 'Description'
                        },
                        editorType: 'dxNumberBox',
                        validationRules: [{
                            type: 'required',
                            message: 'Phone number is required'
                        }],
                        name: 'desc'
                    }, {
                        dataField: 'access',
                        label: {
                            text: 'Access'
                        }
                    }],
                onContentReady: function (e) {
                    dxFormInstance = e.component;
                }
            };
            return formOptionsItems;
        }

        /**
         * Grid Options for role list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchUserList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (roleObj) {
                            roleObj = dxFormInstance.option('formData');
                            saveUser(roleObj);
                        },
                        update: function (key, roleObj) {
                            updateUser(key, roleObj);
                        },
                        remove: function (key) {
                            deleteUser(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'name',
                            summaryType: 'count'
                        }]
                    },
                    columns: [{
                        dataField: 'name',
                        caption: 'Name',
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }],
                    }, {
                        dataField: 'desc',
                        caption: 'Desc'
                    }],
                    export: {
                        enabled: true,
                        fileName: 'UsersRoles',
                        allowExportSelectedData: true
                    },
                    editing: {
                        allowAdding: true,
                        allowUpdating: true,
                        allowDeleting: false,
                        mode: 'form',
                        form: formOptions()
                    }, onRowRemoving: function (e) {
                        var d = $.Deferred();
                        var ref = rootRef.child('tenant-role-records').child(tenantId).child(e.data.$id).child('records').orderByChild('deactivated').equalTo(null);
                        firebaseUtils.fetchList(ref).then(function (data) {
                            if (data.length > 0) {
                                d.reject("Can not delete the record");
                            } else {
                                d.resolve();
                            }
                        });
                        e.cancel = d.promise();
                    },
                    onRowUpdated: function (e) {
                        var ref = rootRef.child('tenants').child(e.key.$id);
                        firebaseUtils.updateData(ref, e.data);
                    }
                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        };

        /**
         * Save form data
         * @returns {Object} User Form data
         */
        function saveUser(roleObj) {
            var role = {
                email: roleObj.email,
                password: roleObj.usrPassword,
                role: roleObj.role
            };

            authService.registerUser(role).then(function (data) {
                var ref = rootRef.child('tenant-roles').child(tenantId);

                if (!roleObj.date) {
                    roleObj.date = new Date();
                }
                roleObj.date = roleObj.date.toString();
                roleObj.role = auth.$getAuth().uid;
                return firebaseUtils.addData(ref, roleObj);
            });

        }

        /**
         * Fetch role list
         * @returns {Object} User data
         */
        function fetchUserList() {
            var ref = rootRef.child('tenant-roles').orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch role list
         * @returns {Object} User data
         */
        function updateUser(key, roleData) {
            var ref = rootRef.child('tenant-roles').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, roleData);
        }

        /**
         * Delete User
         * @returns {Object} role data
         */
        function deleteUser(key) {
            var ref = rootRef.child('tenant-roles').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());