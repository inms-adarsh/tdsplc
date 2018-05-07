(function () {
    'use strict';

    angular
        .module('app.admin.payment')
        .controller('PaymentController', PaymentController);

    /** @ngInject */
    function PaymentController(currentAuth, $mdDialog, msUtils, dxUtils, users, auth, customers, accounts, $firebaseArray, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
        var vm = this,
            formInstance,
            tenantId = authService.getCurrentTenant(),
            gridInstance;
        vm.payment = [];
        vm.settings = settings;
        vm.tenantInfo = tenantInfo;
        vm.payment.count = 0;

        vm.paymentModes = [{
            id: 'cheque',
            name: 'Cheque'
        }, {
            id: 'neft',
            name: 'NEFT/Bank Deposit'
        }, {
            id: 'cash',
            name: 'Cash'
        }];

        vm.paymentStatus = [{
            id: 0,
            name: 'Pending'
        }, {
            id: 1,
            name: 'Received'
        }, {
            id: 2,
            name: 'Rejected'
        }];

        vm.gridOptions = dxUtils.createGrid();

        
        vm.uploadPopupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '50%',
            height: 'auto',
            title: "Add Payment Request",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            }
        };

        vm.paymentOptions = {
            onToolbarPreparing: function (e) {
                var dataGrid = e.component;

                e.toolbarOptions.items.unshift(
                    {
                        location: "before",
                        widget: "dxButton",
                        options: {
                            text: 'Add New Payment',
                            icon: "plus",
                            type: 'default',
                            onClick: function (e) {
                                $mdDialog.show({
                                    controller: 'AddPaymentDialogController',
                                    templateUrl: 'app/main/apps/payment/addNewPaymentDialog/add-new-payment-dialog.html',
                                    parent: angular.element(document.body),
                                    controllerAs: 'vm',
                                    clickOutsideToClose: false,
                                    fullscreen: true, // Only for -xs, -sm breakpoints.,
                                    bindToController: true,
                                    locals: { isAdmin: true, prerequisites: {
                                        customers: customers,
                                        accounts: accounts,
                                        users: users,
                                        paymentModes: vm.paymentModes,
                                        paymentStatus: vm.paymentStatus
                                    } }
                                })
                                .then(function (answer) {
                                    
                                }, function () {
                                    $scope.status = 'You cancelled the dialog.';
                                });
                            }

                        }
                    },
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
                                    return request.status == 0;
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
                                var result = DevExpress.ui.dialog.confirm("Do you want to approve selected records? Once approved, record can not be modified", "Confirm changes");
                                result.done(function (dialogResult) {
                                    if(dialogResult == true) {
                                        var latestRecords = gridInstance.getSelectedRowKeys(),
                                            zip = new JSZip(),
                                            count = 0,
                                            mergeObj = {},
                                            zipFilename;

                                        approveAll(latestRecords, auth.$getAuth().uid);
                                    }
                                });
                                
                            }
                        }
                    }
                );

            },
            bindingOptions: {
                dataSource: 'vm.gridData'
            },
            editing: {
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: false,
                mode: 'row'
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                },
                allowEditing: false
            }, {
                dataField: 'date',
                caption: 'Date',
                dataType: 'date',
                allowEditing: false
            }, {
                dataField: 'tenantId',
                caption: 'Client',
                lookup: {
                    dataSource: customers,
                    displayExpr: "company",
                    valueExpr: "$id"
                },
                allowEditing: false
            },
            {
                dataField: 'paymentMode',
                caption: 'Payment Mode',
                calculateCellValue: function (data) {
                    var index = msUtils.getIndexByArray(vm.paymentModes, 'id', data.paymentMode);
                    if (index > -1) {
                        return vm.paymentModes[index].name;
                    } else {
                        return '';
                    }
                },
                allowEditing: false
            }, {
                dataField: 'amount',
                caption: 'Amount',
                allowEditing: false
            }, {
                dataField: 'chequeNumber',
                caption: 'Cheque No',
                allowEditing: false
            }, {
                dataField: 'bankAccount',
                caption: 'Bank Account',
                allowEditing: false,
                lookup: {
                    dataSource: accounts,
                    displayExpr: 'bankname',
                    valueExpr: "$id"
                }
            }, {
                dataField: 'cashBy',
                caption: 'Received By',
                allowEditing: false,
                lookup: {
                    dataSource: users,
                    displayExpr: "name",
                    valueExpr: "$id"
                }
            }, {
                dataField: 'status',
                caption: 'Status',
                allowEditing: true,
                lookup: {
                    dataSource: vm.paymentStatus,
                    displayExpr: "name",
                    valueExpr: "id"
                },
                sortIndex: 0,
                sortOrder: "asc"
            }, {
                dataField: 'remarks',
                caption: 'Remarks',
                allowEditing: true
            }],
            onRowUpdated: function (e) {
                var component = e.component;

                if (e.key.status == 1) {
                    paymentService.approveSingleRecord(e.key, auth.$getAuth().uid);
                }
            },
            onCellPrepared: function (e) {
                var role = JSON.parse(localStorage.getItem('role'));
                if (e.rowType == 'data' && e.row.data.status === 1) {
                    e.cellElement.find(".dx-link-delete").remove();
                    e.cellElement.find(".dx-link-edit").remove();
                }

                if (e.rowType == 'data' && e.row.data.status === 2) {
                    e.cellElement.find(".dx-link-edit").remove();
                }
            },
            onRowRemoving: function (e) {
                var component = e.component;

                var ref = rootRef.child('tenant-payments').child(e.key.$id);
                firebaseUtils.deleteData(ref);
            },
            export: {
                enabled: true,
                fileName: 'Requests',
                allowExportSelectedData: true
            },
            onContentReady: function (e) {
                gridInstance = e.component;
            },
            summary: {
                totalItems: [{
                    column: '#',
                    summaryType: 'count'
                }]
            },
            onRowPrepared: function (info) {
                if (info.rowType == 'data' && info.data.status == 0)
                    info.rowElement.addClass("md-light-blue-50-bg");

                if (info.rowType == 'data' && info.data.status == 1)
                    info.rowElement.addClass("md-green-50-bg");

                if (info.rowType == 'data' && info.data.status == 2)
                    info.rowElement.addClass("md-red-50-bg");

            }


        }

        angular.extend(vm.gridOptions, vm.paymentOptions);


        /**
         * Redirect to invoice page
         */

        function init() {
            var ref = rootRef.child('tenant-payments');
            vm.gridData = $firebaseArray(ref);

        }

       
        /**
         * Approve all records
         * @param {*} latestRecords 
         */
        function approveAll(latestRecords) {
            latestRecords.forEach(function (record) {
                record.status = 1;
                paymentService.approveSingleRecord(record, auth.$getAuth().uid);
            });

            DevExpress.ui.dialog.alert('All requests approved', 'Success'); 
        }

        /**
         * Init function
         */
        init();
    }
})();