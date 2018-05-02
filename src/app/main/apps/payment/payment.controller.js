(function () {
    'use strict';

    angular
        .module('app.payment')
        .controller('PaymentRequestController', PaymentRequestController);

    /** @ngInject */
    function PaymentRequestController(currentAuth, msUtils, $mdDialog, users, accounts, dxUtils, auth, $firebaseArray, $firebaseObject, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
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
                }
            }, {
                dataField: 'remarks',
                caption: 'Remarks'
            }],
            onCellPrepared: function (e) {
                if (e.rowType == 'data' && e.row.data.status === "received") {
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
                                    locals: { isAdmin: false, prerequisites: {
                                        customers: {},
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
        }

        init();


        $scope.$watch('tenant', function (newVal) {
            vm.creditBalance = 'Credit Balance: ' + newVal.creditBalance;
            $scope.buttonType = newVal.creditBalance < 0 ? 'danger' : 'success';
        });

    }
})();