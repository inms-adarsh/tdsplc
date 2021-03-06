(function () {
    'use strict';

    angular
        .module('app.admin.customers')
        .factory('customerService', customerService);

    /** @ngInject */
    function customerService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            gridInstance;
        // Private variables

        var service = {
            formOptions: formOptions,
            gridOptions: gridOptions,
            saveCustomer: saveCustomer,
            updateCustomer: updateCustomer,
            fetchCustomerList: fetchCustomerList
        };

        var clientStatus = [{
            id: 'active',
            name: 'Enabled'
        }, {
            id: 'deactive',
            name: 'Disabled'
        }];

        var paymentMode = [{
            id: 'prepaid',
            name: 'Prepaid'
        }, {
            id: 'postpaid',
            name: 'Postpaid'
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
                    formData: 'vm.customers'
                },
                colCount: 2,
                items: [{
                    dataField: 'company',
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
                    }]
                }, {
                    dataField: 'email',
                    label: {
                        text: 'Email'
                    },
                    validationRules: [{
                        type: 'email',
                        message: 'Please enter valid e-mail address'
                    }]
                }, {
                    dataField: 'alias',
                    label: {
                        text: 'Short Name'
                    }
                }, {
                    dataField: 'gstno',
                    label: {
                        text: 'GST No'
                    },
                    editorOptions: {
                        mask: '00AAAAAAAAAA0A0'
                    }
                }, {
                    dataField: 'adress',
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
                onContentReady: function () {
                    var dxFormInstance = $('#customer-form').dxForm('instance');
                }
            };
            return formOptionsItems;
        }

        /**
         * Grid Options for customer list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchCustomerList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (customerObj) {
                            saveCustomer(customerObj);
                        },
                        update: function (key, customerObj) {
                            updateCustomer(key, customerObj);
                        },
                        remove: function (key) {
                            deleteCustomer(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'name',
                            summaryType: 'count'
                        }]
                    },
                    onToolbarPreparing: function (e) {
                        var dataGrid = e.component;
        
                        e.toolbarOptions.items.unshift(
                            {
                                location: "before",
                                widget: "dxButton",
                                options: {
                                    text: 'Select Pending Requests',
                                    icon: "check",
                                    onClick: function (e) {
                                        var data = vm.gridData,
                                            count = 0,
                                            mergeObj = {},
                                            latestRecords,
                                            zipFilename;
        
                                        latestRecords = vm.gridData.filter(function (request) {
                                            return request.status == 1;
                                        });
                                        gridInstance.selectRows(latestRecords);
                                    }
                                }
                            }, {
                                location: "before",
                                widget: "dxButton",
                                options: {
                                    type: 'success',
                                    text: 'Approve Selected',
                                    onClick: function (e) {
                                        var latestRecords = gridInstance.getSelectedRowKeys(),
                                            zip = new JSZip(),
                                            count = 0,
                                            mergeObj = {},
                                            zipFilename;
                                        
                                        approveAll(latestRecords);
                                    }
                                }
                            }
                        );
        
                    },
                    columns: [{
                        caption: '#',
                        cellTemplate: function(cellElement, cellInfo) {
                            cellElement.text(cellInfo.row.dataIndex + 1)
                        }
                    }, {
                        dataField: 'company',
                        caption: 'Firm name',
                        validationRules: [{
                            type: 'required',
                            message: 'Name is required'
                        }],
                    },{
                        dataField: 'creditBalance',
                        caption: 'Credit Balance'
                    }, {
                        dataField: 'requiredBalance',
                        caption: 'Required Balance'
                    }, {
                        dataField: 'phone',
                        caption: 'Phone',
                        dataType: 'number',
                        validationRules: [{
                            type: 'required',
                            message: 'Phone number is required'
                        }]
                    },  {
                        dataField: 'email',
                        caption: 'Email',
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
                        dataField: 'profession',
                        caption: 'Profession'
                    }, {
                        dataField: 'discount',
                        caption: 'Discount',
                        dataType: 'number'
                    }, {
                        dataField: 'date',
                        caption: 'Member since',
                        dataType: 'date',
                        validationRules: [{
                            type: 'required',
                            message: 'Field is required'
                        }]
        
                    }, {
                        dataField: 'paymentType',
                        caption: 'Customer Type',
                        lookup: {
                            dataSource: paymentMode,
                            displayExpr: "name",
                            valueExpr: "id"
                        },
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
                        fileName: 'Customers',
                        allowExportSelectedData: true
                    },
                    editing: {
                        allowAdding: false,
                        allowUpdating: true,
                        allowDeleting: false,
                        mode: 'row',
                        form: formOptions()
                    }, onRowRemoving: function (e) {
                        var d = $.Deferred();
                        var ref = rootRef.child('tenant-customer-records').child(tenantId).child(e.data.$id).child('records').orderByChild('deactivated').equalTo(null);
                        firebaseUtils.fetchList(ref).then(function (data) {
                            if (data.length > 0) {
                                d.reject("Can not delete the record");
                            } else {
                                d.resolve();
                            }
                        });
                        e.cancel = d.promise();
                    }, 
                    onRowUpdated: function(e) {
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
         * @returns {Object} Customer Form data
         */
        function saveCustomer(customerObj) {
            var ref = rootRef.child('tenants').child(tenantId);
            customerObj.membersSince = customerObj.membersSince.toString();
            if(customerObj.anniversary) {
                customerObj.anniversary = customerObj.anniversary.toString();
            }
             if (!customerObj.date) {
                customerObj.date = new Date();
            }
            customerObj.date = customerObj.date.toString();
            customerObj.user = auth.$getAuth().uid;
            firebaseUtils.addData(ref, customerObj).then(function(data) {
                gridInstance.refresh();  
            });
        }

        /**
         * Fetch customer list
         * @returns {Object} Customer data
         */
        function fetchCustomerList() {
            var ref = rootRef.child('tenants').orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch customer list
         * @returns {Object} Customer data
         */
        function updateCustomer(key, customerData) {
            var ref = rootRef.child('tenants').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, customerData).then(function(data) {
                gridInstance.refresh();  
            });
        }

        /**
         * Delete Customer
         * @returns {Object} customer data
         */
        function deleteCustomer(key) {
            var ref = rootRef.child('tenants').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());