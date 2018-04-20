(function () {
    'use strict';

    angular
        .module('app.admin.employees')
        .factory('userService', userService);

    /** @ngInject */
    function userService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            dxFormInstance,
            gridInstance;
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

        var roles = [{
            id: 'superuser',
            name: 'Admin'
        }, {
            id: 'employee',
            name: 'Employee'
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
                    formData: 'vm.users'
                },
                colCount: 2,
                items: [
                    {
                        dataField: 'email',
                        label: {
                            text: 'Email'
                        },
                        validationRules: [{
                            type: 'email',
                            message: 'Please enter valid e-mail address'
                        }, {
                            type: 'required',
                            message: 'Name is required'
                        }]
                    }, {
                        dataField: 'usrPassword',
                        label: {
                            text: 'Password'
                        },
                        validationRules: [ {
                            type: 'required',
                            message: 'Password is required'
                        }],
                        name: 'usrPassword',
                        editorOptions: {
                            mode: 'password'
                        }
                    }, {
                        dataField: 'name',
                        label: {
                            text: 'Name'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }]
                    }, {
                        dataField: 'phone',
                        label: {
                            text: 'Phone'
                        },
                        editorType: 'dxNumberBox',
                        validationRules: [{
                            type: 'required',
                            message: 'Phone number is required'
                        }],
                        formItem: {
                            visible: true
                          }
                    },  {
                        dataField: 'role',
                        label: {
                            text: 'Role'
                        },
                        editorType: 'dxSelectBox',
                        editorOptions: {
                            dataSource: roles,
                            displayExpr: 'name',
                            valueExpr: 'id'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Select a Role'
                        }]
                    }, {
                        dataField: 'position',
                        label: {
                            text: 'Position'
                        },
                        editorType: 'dxSelectBox',
                        editorOptions: {
                            dataSource: clientStatus,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            value: 'active'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Select a Position'
                        }]
                    }, {
                        dataField: 'address',
                        label: {
                            text: 'Address'
                        }
                    }, {
                        dataField: 'city',
                        label: {
                            text: 'City'
                        }
                    }, {
                        dataField: 'state',
                        label: {
                            text: 'State'
                        }
                    }, {
                        dataField: 'zipcode',
                        label: {
                            text: 'ZIP/Pincode'
                        },
                        editorOptions: {
                            mask: '000000'
                        }
                    }],
                onContentReady: function (e) {
                    dxFormInstance = e.component;
                }
            };
            return formOptionsItems;
        }

        /**
         * Grid Options for user list
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
                        insert: function (userObj) {
                            Object.assign(userObj, dxFormInstance.option('formData'));
                            saveUser(userObj);
                        },
                        update: function (key, userObj) {
                            updateUser(key, userObj);
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
                        caption: '#',
                        cellTemplate: function(cellElement, cellInfo) {
                            cellElement.text(cellInfo.row.rowIndex + 1)
                        }
                    },{
                        dataField: 'name',
                        caption: 'Name',
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }],
                    }, {
                        dataField: 'role',
                        caption: 'Role',
                        lookup: {
                            dataSource: roles,
                            displayExpr: "name",
                            valueExpr: "id"
                        }
                    }, {
                        dataField: 'pendingRequests',
                        caption: 'Total Pending Requests'
                    },
                    {
                        dataField: 'phone',
                        caption: 'Phone',
                        dataType: 'number',
                        validationRules: [{
                            type: 'required',
                            message: 'Phone number is required'
                        }]
                    }, {
                        dataField: 'email',
                        caption: 'Email/User Id',
                        validationRules: [{
                            type: 'email',
                            message: 'Please enter valid e-mail address'
                        }]
                    }, {
                        dataField: 'address',
                        caption: 'Address'
                    }, {
                        dataField: 'city',
                        caption: 'City'
                    }, {
                        dataField: 'position',
                        caption: 'Position',
                        lookup: {
                            dataSource: clientStatus,
                            displayExpr: "name",
                            valueExpr: "id"
                        }
                    }],
                    export: {
                        enabled: true,
                        fileName: 'Users',
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
                        var ref = rootRef.child('tenant-user-records').child(tenantId).child(e.data.$id).child('records').orderByChild('deactivated').equalTo(null);
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
                    },
                    onContentReady: function(e) {
                        gridInstance = e.component;
                    }
                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        };

        /**
         * Save form data
         * @returns {Object} User Form data
         */
        function saveUser(userObj) {
            var user = {                
                email: userObj.email,
                password: userObj.usrPassword,
                role: userObj.role,
                username: userObj.name
              };

            authService.registerUser(user).then(function(data) {
                authService.createProfile(user, data, tenantId).then(function() {
                    var ref = rootRef.child('tenant-users').child(tenantId).child(data.uid);
                    delete userObj.usrPassword;
                    if (!userObj.date) {
                        userObj.date = new Date();
                    }
                    userObj.date = userObj.date.toString();
                    userObj.user = auth.$getAuth().uid;
                    ref.set(userObj).then(function(data) {
                        
                    });

                    var ref = rootRef.child('employees').child(data.uid);
                    ref.set(userObj).then(function(data) {
                        gridInstance.refresh();  
                    });

                });
                // var ref = rootRef.child('tenant-users').child(tenantId);

                // if (!userObj.date) {
                //     userObj.date = new Date();
                // }
                // userObj.date = userObj.date.toString();
                // userObj.user = auth.$getAuth().uid;
                // return firebaseUtils.addData(ref, userObj);
            });
           
        }

        /**
         * Fetch user list
         * @returns {Object} User data
         */
        function fetchUserList() {
            var ref = rootRef.child('tenant-users').child(tenantId);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch user list
         * @returns {Object} User data
         */
        function updateUser(key, userData) {
            var ref = rootRef.child('tenant-users').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, userData);

            var ref = rootRef.child('employees').child(key['$id']);
            firebaseUtils.updateData(ref, userData);

        }

        /**
         * Delete User
         * @returns {Object} user data
         */
        function deleteUser(key) {
            var ref = rootRef.child('tenant-users').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, { deactivated: false });

            var ref = rootRef.child('employees').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());