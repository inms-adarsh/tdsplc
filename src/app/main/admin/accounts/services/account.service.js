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
                        dataField: 'bankname',
                        label: {
                            text: 'Bank Name'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }]
                    }, {
                        dataField: 'ifsc',
                        label: {
                            text: 'IFSC Code'
                        }
                    }, {
                        dataField: 'accountNo',
                        label: {
                            text: 'Account No'
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
                        dataField: 'bankname',
                        caption: 'Bank Name',
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }],
                    }, {
                        dataField: 'ifsc',
                        caption: 'IFSC Code'
                    },
                    {
                        dataField: 'accountNo',
                        caption: 'Account No'
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
                        mode: 'row',
                        form: formOptions()
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
                    var ref = rootRef.child('tenant-accounts');
                    if (!accountObj.date) {
                        accountObj.date = new Date();
                    }
                    accountObj.date = accountObj.date.toString();
                    accountObj.uid = auth.$getAuth().uid;
                    firebaseUtils.addData(ref, accountObj).then(function(data) {
                        gridInstance.refresh();  
                    });
                // var ref = rootRef.child('tenant-accounts').child(tenantId);

                // if (!accountObj.date) {
                //     accountObj.date = new Date();
                // }
                // accountObj.date = accountObj.date.toString();
                // accountObj.account = auth.$getAuth().uid;
                // return firebaseUtils.addData(ref, accountObj);
           
        }

        /**
         * Fetch account list
         * @returns {Object} Account data
         */
        function fetchAccountList() {
            var ref = rootRef.child('tenant-accounts');
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch account list
         * @returns {Object} Account data
         */
        function updateAccount(key, accountData) {
            var ref = rootRef.child('tenant-accounts');
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