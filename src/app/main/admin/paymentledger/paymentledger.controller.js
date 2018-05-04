(function () {
    'use strict';

    angular
        .module('app.adminpaymentledger')
        .controller('AdminPaymentLedgerRequestController', AdminPaymentLedgerRequestController);

    /** @ngInject */
    function AdminPaymentLedgerRequestController(currentAuth, msUtils, $mdDialog, users, customers, accounts, dxUtils, auth, $firebaseArray, $firebaseObject, firebaseUtils, authService, settings, tenantInfo, $scope, adminpaymentledgerService, $state) {
        var vm = this,
            formInstance,
            tenantId = authService.getCurrentTenant();


        vm.paymentledger = [];
        vm.settings = settings;
        vm.tenantInfo = tenantInfo;
        vm.paymentledger.count = 0;

        vm.paymentledgerModes = [{
            id: 'cheque',
            name: 'Cheque'
        }, {
            id: 'neft',
            name: 'NEFT/Bank Deposit'
        }, {
            id: 'cash',
            name: 'Cash'
        }];

        vm.paymentledgerStatus = [{
            id: 0,
            name: 'Pending'
        }, {
            id: 1,
            name: 'Received'
        }];

        vm.gridOptions = dxUtils.createGrid();

        vm.uploadPopupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '50%',
            height: 'auto',
            title: "Add paymentledger Request",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            }
        };

        vm.addpaymentledgerButton = {
            text: 'Add paymentledger',
            icon: "plus",
            type: 'default',
            onClick: function (e) {
                $scope.visiblePopup = true;
            }
        };

        vm.paymentledgerOptions = {
            bindingOptions: {
                dataSource: 'vm.gridData'
            },
            editing: {
                allowUpdating: false,
                allowDeleting: false
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            }, {
                dataField: 'date',
                caption: 'Date',
                dataType: 'date'
            }, {
                dataField: 'tenantId',
                caption: 'Client',
                lookup: {
                    dataSource: customers,
                    displayExpr: "company",
                    valueExpr: "$id"
                },
                allowEditing: false
            }, {
                dataField: 'particulars',
                caption: 'Description',
                cellTemplate: function (container, options) {
                    var str = '<div>',
                        data = options.data;
                    if (data.debit) {
                        if (data.barcode) {
                            str += 'Barcode: ' + data.barcode + '</br>';
                        }
                        if (data.qtr) {
                            str += 'QTR: ' + data.qtr + '</br>';
                        }
                        if (data.deductor) {
                            str += 'Deductor/Collector Name: ' + data.deductor + '</br';
                        }

                        str += '</div>';
                    } else if (data.credit) {
                        if (data.paymentMode) {
                            var index = msUtils.getIndexByArray(vm.paymentledgerModes, 'id', data.paymentMode);
                            str += 'Payment Mode: ' + vm.paymentledgerModes[index].name + '</br>';

                        }

                        if (data.chequeNumber) {
                            str += 'Cheque No: ' + data.chequeNumber + '</br>';
                        }
                        if (data.bankAccount) {
                            var index = msUtils.getIndexByArray(accounts, '$id', data.bankAccount);
                            str += 'Account Name: ' + accounts[index].bankName + '</br>';
                        }
                        if (data.cashBy) {
                            var index = msUtils.getIndexByArray(users, '$id', data.cashBy);
                            str += 'Received By: ' + users[index].name + '</br>';
                        }
                        str += '</div>';
                    }
                    $(str).appendTo(container);
                },
                calculateCellValue: function (data) {
                    var str = '';
                    if (data.debit) {
                        if (data.barcode) {
                            str += 'Barcode: ' + data.barcode + '';
                        }
                        if (data.qtr) {
                            str += 'QTR: ' + data.qtr + '';
                        }
                        if (data.deductor) {
                            str += 'Deductor/Collector Name: ' + data.deductor + '</br';
                        }

                        str += '';
                    } else if (data.credit) {
                        if (data.paymentMode) {
                            var index = msUtils.getIndexByArray(vm.paymentledgerModes, 'id', data.paymentMode);
                            str += 'Payment Mode: ' + vm.paymentledgerModes[index].name + '';
                        }

                        if (data.chequeNumber) {
                            str += 'Cheque No: ' + data.chequeNumber + '';
                        }
                        if (data.bankAccount) {
                            var index = msUtils.getIndexByArray(accounts, '$id', data.bankAccount);
                            str += 'Account Name: ' + accounts[index].bankname + '';
                        }
                        if (data.cashBy) {
                            var index = msUtils.getIndexByArray(users, '$id', data.cashBy);
                            str += 'Received By: ' + users[index].name + '';
                        }
                        str += '';
                    }
                    return str;
                }

            }, {
                dataField: 'mode',
                caption: 'Mode'
            }, {
                dataField: 'token',
                caption: 'Token No'
            }, {
                dataField: 'reference',
                caption: 'Reference'
            },
            {
                dataField: 'debit',
                caption: 'Debit'
            }, {
                dataField: 'credit',
                caption: 'Credit'
            }],
            onCellPrepared: function (e) {
                if (e.rowType == 'data' && e.row.data.status === 1) {
                    e.cellElement.find(".dx-link-delete").remove();
                }
            },
            onRowRemoving: function (e) {
                var component = e.component;

                var ref = rootRef.child('tenant-paymentledgers').child(e.key.$id);
                firebaseUtils.deleteData(ref);
            },
            onContentReady: function (e) {
                var gridInstance = e.component;
                $scope.creditBalance = gridInstance.getTotalSummaryValue('credit');
                $scope.debitBalance = gridInstance.getTotalSummaryValue('debit');
            },
            summary: {
                totalItems: [{
                    column: "credit",
                    summaryType: "sum",
                    name: "credit"
                }, {
                    column: "debit",
                    summaryType: "sum",
                    name: "debit"
                }]
            }, export: {
                enabled: true,
                fileName: 'Account History',
                allowExportSelectedData: true
            }
        }

        angular.extend(vm.gridOptions, vm.paymentledgerOptions);


        function init() {
            var ref = rootRef.child('payment-ledger').orderByChild('date');
            vm.gridData = $firebaseArray(ref);
        }

        init();


    }
})();