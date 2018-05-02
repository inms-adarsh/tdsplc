(function () {
    'use strict';

    angular
        .module('app.payment')
        .controller('PaymentRequestController', PaymentRequestController);

    /** @ngInject */
    function PaymentRequestController(currentAuth, msUtils, users, accounts, dxUtils, auth, $firebaseArray, $firebaseObject, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
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


        vm.paymentRequestForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            colCount: 2,
            items: [
                {
                    dataField: 'date',
                    name: 'paymentDate',
                    label: {
                        text: 'Date'
                    },
                    editorType: 'dxDateBox',
                    width: '100%',
                    editorOptions: {
                        onInitialized: function (e) {
                            e.component.option('value', new Date());
                        }
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Date is required'
                    }]
                }, {
                    dataField: 'paymentMode',
                    label: {
                        text: 'Payment Mode'
                    },
                    name: 'paymentMode',
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: vm.paymentModes,
                        displayExpr: "name",
                        valueExpr: "id",
                        onValueChanged: function (e) {
                            resetFormInstance(formInstance);
                            if (e.value == 'cheque') {
                                formInstance.itemOption('amount', 'visible', true);
                                formInstance.itemOption('chequeNumber', 'visible', true);
                            } else if (e.value == 'cash') {
                                formInstance.itemOption('amount', 'visible', true);
                                formInstance.itemOption('cashBy', 'visible', true);
                            } else if (e.value == 'neft') {
                                formInstance.itemOption('bankAccount', 'visible', true);
                                formInstance.itemOption('amount', 'visible', true);
                            }
                        }
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Please select a customer'
                    }]
                }, {
                    dataField: "chequeNumber",
                    name: 'chequeNumber',
                    visible: false,
                    label: {
                        text: 'Cheque Number'
                    },
                    width: 125,
                    editorType: 'dxNumberBox',
                    validationRules: [{
                        type: 'required',
                        message: 'Please enter cheque number'
                    }, {
                        type: 'pattern',
                        pattern: '^[1-9][0-9]*$',
                        message: 'Value must be more then 0'
                    }
                    ]
                }, {
                    dataField: "amount",
                    name: 'amount',
                    visible: false,
                    label: {
                        text: 'Amount'
                    },
                    width: 125,
                    editorType: 'dxNumberBox',
                    validationRules: [{
                        type: 'required',
                        message: 'Please enter a value'
                    }, {
                        type: 'pattern',
                        pattern: '^[1-9][0-9]*$',
                        message: 'Value must be more then 0'
                    }
                    ]
                }, {
                    dataField: "bankAccount",
                    name: 'cashAccount',
                    label: {
                        text: 'Select Account'
                    },
                    width: 125,
                    visible: false,
                    editorType: 'dxSelectBox',
                    validationRules: [{
                        type: 'required',
                        message: 'Please select bank name'
                    }],
                    editorOptions: {
                        dataSource: accounts,
                        displayExpr: "bankname",
                        valueExpr: "$id",
                        onValueChanged: function (e) {
                        }
                    }
                }, {
                    dataField: "cashBy",
                    name: 'cashBy',
                    label: {
                        text: 'Cash By'
                    },
                    visible: false,
                    width: 125,
                    editorType: 'dxSelectBox',
                    validationRules: [{
                        type: 'required',
                        message: 'Please select a name'
                    }],
                    editorOptions: {
                        dataSource: users,
                        displayExpr: "name",
                        valueExpr: "$id"
                    }
                }
            ]
        };

        vm.buttonOptions = {
            text: "Submit",
            type: "success",
            useSubmitBehavior: false,
            bindingOptions: {
                'disabled': 'vm.btnDisabled'
            },
            validationGroup: "customerData",
            onClick: function (e) {
                //vm.btnDisabled = true;
                //saveRequest();
                submitForm(e);
            }
        };

        function submitForm(e) {
            var result = e.validationGroup.validate();

            if (result.isValid == true) {
                $scope.visiblePopup = false;
                var formData = formInstance.option('formData');
                formData.status = 'pending';
                if (!formData.date) {
                    formData.date = new Date();
                }
                formData.date = formData.date.toString();
                formData.tenantId = tenantId;
                var ref = rootRef.child('tenant-payments');

                formData.user = auth.$getAuth().uid;
                firebaseUtils.addData(ref, formData).then(function () {
                    formInstance.resetValues();
                    resetFormInstance(formInstance);
                    // var ref = rootRef.child('tenants').child(tenantId);

                    // vm.customer = $firebaseObject(ref);
                    // vm.customer.creditBalance = vm.customer.creditBalance ? vm.customer.creditBalance + formData.amount : formData.amount;
                    // firebaseUtils.updateData(ref, { creditBalance: vm.customer.creditBalance });
                });
            }
        }

        function resetFormInstance(formInstance) {
            //formInstance.itemOption('payment.chequeAmount', 'visible', false);
            formInstance.itemOption('chequeNumber', 'visible', false);
            formInstance.itemOption('amount', 'visible', false);
            formInstance.itemOption('cashBy', 'visible', false);
            formInstance.itemOption('bankAccount', 'visible', false);
            //formInstance.itemOption('payment.neftAmount', 'visible', false);
        }
        /*
            Calculate Payment
         */
        // $scope.$watch(angular.bind(vm, function () { 
        //     return vm.payment.count;
        // }), function(value) {
        //     var total = value * vm.settings.cost;
        //     vm.payment.cost = isNaN(total) ? 0 : total;
        // });

        // vm.payment.cost = vm.payment.count * vm.settings.cost;
        // // Data
        // bolt.launch({
        //     key: 'KEY',
        //     txnid: 'mtx',
        //     hash: 'hash',
        //     amount: '1',
        //     firstname: 'Jaysinh',
        //     email: 'dummyemail@dummy.com',
        //     phone: '6111111111',
        //     productinfo: 'Bag',
        //     surl : 'https://sucess-url.in',
        //     furl: 'https://fail-url.in'

        //     },{ responseHandler: function(token){
        //     // your payment response Code goes here
        //         var payObject = {
        //             amount: vm.payment.cost,
        //             currency: 'usd',
        //             words: vm.payment.count,
        //             cost: vm.settings.cost
        //         };
        //         paymentService.setCurrentToken(token, payObject).then(function(){
        //             vm.redirect();
        //         });
        //     },
        //     catchException: function(response){
        //     // the code you use to handle the integration errors goes here
        //     }
        // });


        // // Methods
        // vm.pay = pay;
        // vm.redirect = redirect;

        /**
         * Buy Words(Opens stripe checkout form)
         */
        function pay() {
            handler.open({
                name: 'Stripe.com',
                description: '2 widgets',
                zipCode: true,
                amount: vm.payment.cost * 100
            });
        }

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