(function () {
    'use strict';

    angular
        .module('app.payment')
        .controller('PaymentRequestController', PaymentRequestController);

    /** @ngInject */
    function PaymentRequestController(currentAuth, msUtils, accountService, $mdDialog, users, accounts, dxUtils, auth, $firebaseArray, $firebaseObject, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
        var vm = this,
            formInstance,
            tenantId = authService.getCurrentTenant();


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

        vm.addPaymentButton = {
            text: 'Add Payment',
            icon: "plus",
            type: 'default',
            onClick: function (e) {
                $scope.visiblePopup = true;
            }
        };

        vm.paymentOptions = {
            bindingOptions: {
                dataSource: 'vm.gridData'
            },
            editing: {
                allowUpdating: false,
                allowDeleting: true
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
                dataField: 'paymentMode',
                caption: 'Payment Mode',
                calculateCellValue: function (data) {
                    var index = msUtils.getIndexByArray(vm.paymentModes, 'id', data.paymentMode);
                    if (index > -1) {
                        return vm.paymentModes[index].name;
                    } else {
                        return '';
                    }
                }
            }, {
                dataField: 'amount',
                caption: 'Amount'
            }, {
                dataField: 'chequeNumber',
                caption: 'Cheque No'
            },
            {
                dataField: 'bankAccount',
                caption: 'Bank Account',
                lookup: {
                    dataSource: accounts,
                    displayExpr: 'bankname',
                    valueExpr: "$id"
                }
            }, {
                dataField: 'cashBy',
                caption: 'Received By',
                lookup: {
                    dataSource: users,
                    displayExpr: 'name',
                    valueExpr: "$id"
                }

            }, {
                dataField: 'status',
                caption: 'Status',
                lookup: {
                    dataSource: vm.paymentStatus,
                    displayExpr: "name",
                    valueExpr: "id"
                },
                sortIndex: 0,
                sortOrder: "asc"
            }, {
                dataField: 'remarks',
                caption: 'Remarks'
            }],
            onCellPrepared: function (e) {
                if (e.rowType == 'data' && e.row.data.status === 1) {
                    e.cellElement.find(".dx-link-delete").remove();
                }
                
            },
            onRowRemoving: function (e) {
                var component = e.component;

                var ref = rootRef.child('tenant-payments').child(e.key.$id);
                firebaseUtils.deleteData(ref);
            },
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
                                    locals: {
                                        isAdmin: false, prerequisites: {
                                            customers: {},
                                            accounts: accounts,
                                            users: users,
                                            paymentModes: vm.paymentModes,
                                            paymentStatus: vm.paymentStatus
                                        }
                                    }
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
        function redirect() {
            $state.go('app.pages_auth_invoice');
        }

        function init() {
            var ref = rootRef.child('tenant-payments').orderByChild('tenantId').equalTo(tenantId);
            vm.gridData = $firebaseArray(ref);

            var tenantRef = rootRef.child('tenants').child(tenantId);
            $firebaseObject(tenantRef).$bindTo($scope, 'tenant');

            var ref = rootRef.child('tenant-accounts');

            vm.accountsData = $firebaseArray(ref);
        }

        init();


        $scope.$watch('tenant', function (newVal) {
            vm.creditBalance = 'Credit Balance: ' + newVal.creditBalance;
            $scope.buttonType = newVal.creditBalance < 0 ? 'danger' : 'success';
        });

        vm.accountGridOptions = {
            bindingOptions: {
                dataSource: 'vm.accountsData'
            },
            columns: [{
                dataField: 'accountHolder',
                caption: 'Account Holder Name'
            }, {
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
            },
            {
                dataField: 'accountType',
                caption: 'Account Type',
                lookup: {
                    dataSource: [{
                        name: 'Current',
                        id: 'current'
                    }, {
                        name: 'Saving',
                        id: 'saving'
                    }],
                    displayExpr: 'name',
                    valueExpr: 'id'
                }

            }]
        }

    }
})();