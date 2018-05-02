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
            id: 'pending',
            name: 'Pending'
        }, {
            id: 'received',
            name: 'Received'
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
                                    clickOutsideToClose: true,
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
                                    return request.status == 'pending';
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
                lookup: {
                    dataSource: vm.paymentModes,
                    displayExpr: "name",
                    valueExpr: "$id"
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
                dataField: 'bank',
                caption: 'Bank Account',
                allowEditing: false
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
                }
            }, {
                dataField: 'remarks',
                caption: 'Remarks',
                allowEditing: true
            }],
            onRowUpdated: function (e) {
                var component = e.component;

                if (e.key.status == 'received') {
                    approveSingleRecord(e.key);
                }
            },
            onCellPrepared: function (e) {
                var role = JSON.parse(localStorage.getItem('role'));
                if (e.rowType == 'data' && e.row.data.status === "received" && role != 'superuser') {
                    e.cellElement.find(".dx-link-delete").remove();
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
                record.status = 'received';
                paymentService.approveSingleRecord(record);
            });

        }

        /**
         * Init function
         */
        init();
    }
})();