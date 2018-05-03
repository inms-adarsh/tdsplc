(function () {
    'use strict';

    angular
        .module('app.paymentledger')
        .controller('PaymentLedgerRequestController', PaymentLedgerRequestController);

    /** @ngInject */
    function PaymentLedgerRequestController(currentAuth, msUtils, $mdDialog, users, accounts, dxUtils, auth, $firebaseArray, $firebaseObject, firebaseUtils, authService, settings, tenantInfo, $scope, paymentledgerService, $state) {
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
                dataField: 'particulars',
                caption: 'Description',
                calculateCellValue: function (data) {
                    var index = msUtils.getIndexByArray(vm.paymentledgerModes, 'id', data.paymentledgerMode);
                    if (index > -1) {
                        return vm.paymentledgerModes[index].name;
                    } else {
                        return '';
                    }
                }
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
                if (e.rowType == 'data' && e.row.data.status === "received") {
                    e.cellElement.find(".dx-link-delete").remove();
                }
            },
            onRowRemoving: function (e) {
                var component = e.component;

                var ref = rootRef.child('tenant-paymentledgers').child(e.key.$id);
                firebaseUtils.deleteData(ref);
            },
            onToolbarPreparing: function (e) {
                var dataGrid = e.component;

                e.toolbarOptions.items.unshift(
                    {
                        location: "before",
                        widget: "dxButton",
                        options: {
                            text: 'Add New paymentledger',
                            icon: "plus",
                            type: 'default',
                            onClick: function (e) {
                                $mdDialog.show({
                                    controller: 'AddpaymentledgerDialogController',
                                    templateUrl: 'app/main/apps/paymentledger/addNewpaymentledgerDialog/add-new-paymentledger-dialog.html',
                                    parent: angular.element(document.body),
                                    controllerAs: 'vm',
                                    clickOutsideToClose: true,
                                    fullscreen: true, // Only for -xs, -sm breakpoints.,
                                    bindToController: true,
                                    locals: { isAdmin: false, prerequisites: {
                                        customers: {},
                                        accounts: accounts,
                                        users: users,
                                        paymentledgerModes: vm.paymentledgerModes,
                                        paymentledgerStatus: vm.paymentledgerStatus
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
                            hint: 'Credit Balance',
                            icon: "money",
                            type: 'danger',
                            bindingOptions: {
                                text: 'vm.creditBalance',
                                type: 'buttonType'
                            }
                        }
                    });
            }
        }

        angular.extend(vm.gridOptions, vm.paymentledgerOptions);


        /**
         * Redirect to invoice page
         */
        function redirect() {
            $state.go('app.pages_auth_invoice');
        }

        function init() {
            var ref = rootRef.child('tenant-payment-ledger').child(tenantId);
            vm.gridData = $firebaseArray(ref);
        }

        init();


    }
})();