(function () {
    'use strict';

    angular
        .module('app.admin.accounts')
        .factory('accountService', accountService);

    /** @ngInject */
    function accountService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            dxFormInstance,
            gridInstance;
        // Private variables

        var service = {
            formOptions: formOptions,
            gridOptions: gridOptions,
            saveAccount: saveAccount,
            updateAccount: updateAccount,
            fetchAccountList: fetchAccountList
        };

        var clientStatus = [{
            id: 'active',
            name: 'Enabled'
        }, {
            id: 'deactive',
            name: 'Disabled'
        }];

        var roles = [{
            id: 'superaccount',
            name: 'Admin'
        }, {
            id: 'account',
            name: 'account'
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
                    formData: 'vm.accounts'
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
                            text: 'role'
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
         * Grid Options for account list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchAccountList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (accountObj) {
                            Object.assign(accountObj, dxFormInstance.option('formData'));
                            saveAccount(accountObj);
                        },
                        update: function (key, accountObj) {
                            updateAccount(key, accountObj);
                        },
                        remove: function (key) {
                            deleteAccount(key);
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
                        dataField: 'role',
                        caption: 'Role',
                        lookup: {
                            dataSource: roles,
                            displayExpr: "name",
                            valueExpr: "id"
                        }
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
                        caption: 'Email/Account Id',
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
                        dataField: 'membersSince',
                        caption: 'Member since',
                        dataType: 'date',
                        validationRules: [{
                            type: 'required',
                            message: 'Field is required'
                        }]

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
                        fileName: 'Accounts',
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
                        var ref = rootRef.child('tenant-account-records').child(tenantId).child(e.data.$id).child('records').orderByChild('deactivated').equalTo(null);
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
         * @returns {Object} Account Form data
         */
        function saveAccount(accountObj) {
            var account = {                
                email: accountObj.email,
                password: accountObj.usrPassword,
                role: accountObj.role,
                accountname: accountObj.name
              };

            authService.registerAccount(account).then(function(data) {
                authService.createProfile(account, data, tenantId).then(function() {
                    var ref = rootRef.child('tenant-accounts').child(tenantId);
                    delete accountObj.usrPassword;
                    if (!accountObj.date) {
                        accountObj.date = new Date();
                    }
                    accountObj.date = accountObj.date.toString();
                    accountObj.account = auth.$getAuth().uid;
                    accountObj.uid = data.uid;
                    firebaseUtils.addData(ref, accountObj).then(function(data) {
                        gridInstance.refresh();  
                    });
                });
                // var ref = rootRef.child('tenant-accounts').child(tenantId);

                // if (!accountObj.date) {
                //     accountObj.date = new Date();
                // }
                // accountObj.date = accountObj.date.toString();
                // accountObj.account = auth.$getAuth().uid;
                // return firebaseUtils.addData(ref, accountObj);
            });
           
        }

        /**
         * Fetch account list
         * @returns {Object} Account data
         */
        function fetchAccountList() {
            var ref = rootRef.child('tenant-accounts').child(tenantId).orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch account list
         * @returns {Object} Account data
         */
        function updateAccount(key, accountData) {
            var ref = rootRef.child('tenant-accounts').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, accountData);
        }

        /**
         * Delete Account
         * @returns {Object} account data
         */
        function deleteAccount(key) {
            var ref = rootRef.child('tenant-accounts').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());