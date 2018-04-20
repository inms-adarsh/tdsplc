(function ()
{
    'use strict';

    angular
        .module('app.admin.customers')
        .controller('CustomersController', CustomersController);

    /** @ngInject */
    function CustomersController($state, $scope, $mdDialog, $firebaseArray, $document, dxUtils, authService, auth, customerService)
    {
        var vm = this,
         tenantId = authService.getCurrentTenant(),
            gridInstance;;

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

        // Data
        
        // Methods
        vm.addDialog = addDialog;
        vm.editDialog = editDialog;
        init();
        //////////

        function init() {
            vm.customerGridOptions = customerService.gridOptions('vm.customers');
            var ref = rootRef.child('tenants');

            vm.gridData = $firebaseArray(ref);
            vm.gridOptions = dxUtils.createGrid();

            var otherConfig = {
                bindingOptions: {
                    dataSource: 'vm.gridData'
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
                                text: 'Select Pending Approvals',
                                icon: "check",
                                onClick: function (e) {
                                    var data = vm.gridData,
                                        count = 0,
                                        mergeObj = {},
                                        latestRecords,
                                        zipFilename;
    
                                    latestRecords = vm.gridData.filter(function (request) {
                                        return request.position !== 'active';
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
                        cellElement.text(cellInfo.row.rowIndex + 1)
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
                    mode: 'row'
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

            angular.extend(vm.gridOptions, otherConfig);
        }

         /**
         * Add New Row
         */
        function addDialog(ev)
        {
            $mdDialog.show({
                controller         : 'CustomerDialogController',
                controllerAs       : 'vm',
                templateUrl        : 'app/main/admin/customers/views/dialogs/customer-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: true,
                locals             : {
                    dialogData: {
                        dialogType: 'add'
                    }
                }
            });
        }

        /**
         * Edit Dialog
         */
        function editDialog(ev, formView, formData)
        {
            $mdDialog.show({
                controller         : 'CustomerDialogController',
                controllerAs       : 'vm',
                templateUrl        : 'app/main/apps/customers/views/dialogs/add-edit/edit-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: true,
                locals             : {
                    dialogData: {
                        chartData : vm.data,
                        dialogType: 'edit',
                        formView  : formView,
                        formData  : formData
                    }
                }
            });
        }

        /**
         * Approve All
         */
        function approveAll(latestRecords) {
            var mergeObj = {};
            latestRecords.forEach(function(record) {
                var ref = rootRef.child('tenants').child(record.$id);
                mergeObj['tenants/'+record.$id+'/position'] = 'active';
            });
            rootRef.update(mergeObj);
        }

    }
})();