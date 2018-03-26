(function () {
    'use strict';

    angular
        .module('app.admin.payment')
        .controller('PaymentController', PaymentController);

    /** @ngInject */
    function PaymentController(currentAuth, msUtils, dxUtils, auth, customers, $firebaseArray, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
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

        vm.paymentOptions = {
            bindingOptions: {
                dataSource: 'vm.gridData'
            },
            editing: {
                allowUpdating: true,
                allowDeleting: true,
                mode: 'row'
            },
            columns: [{
                dataField: 'date',
                caption: 'Date',
                dataType: 'date',
                allowEditing: false
            }, {
                dataField: 'tenantId',
                caption: 'Client',
                allowEditing: false,
                lookup: {
                    dataSource: customers,
                    displayExpr: "company",
                    valueExpr: "$id"
                }
            },
            {
                dataField: 'paymentMode',
                caption: 'Payment Mode',
                allowEditing: false,
                calculateCellValue: function(data) {
                    var index = msUtils.getIndexByArray(vm.paymentModes, 'id', data.paymentMode);
                    if (index > -1) {
                        return vm.paymentModes[index].name;
                    } else {
                        return '';
                    } 
                }
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
                allowEditing: false
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
            onRowUpdated: function(e) {
                var component = e.component;

                var ref = rootRef.child('tenant-payments').child(e.key.$id);
                firebaseUtils.updateData(ref, e.data);

                if(e.key.status == 'received') {
                    var ref = rootRef.child('tenants').child(e.key.tenantId);
                    firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                        var creditBalance = data.creditBalance ? data.creditBalance: 0;
                        firebaseUtils.updateData(ref, {creditBalance: creditBalance + e.key.amount});
                    });
                    
                }
            },
            onCellPrepared: function(e) {
                if (e.rowType == 'data' && e.row.data.status === "received") {                
                    e.cellElement.find(".dx-link-delete").remove();
                    e.cellElement.find(".dx-link-edit").remove();
                }
            },

        }

        angular.extend(vm.gridOptions, vm.paymentOptions);


        vm.paymentRequestForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            items: [{
                itemType: "group",
                caption: "Add Payment",
                colCount: 2,
                name: 'payment',
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
                                    formInstance.itemOption('payment.amount', 'visible', true);
                                    formInstance.itemOption('payment.chequeNumber', 'visible', true);
                                } else if(e.value == 'cash'){
                                    formInstance.itemOption('payment.amount', 'visible', true);
                                    formInstance.itemOption('payment.cashBy', 'visible', true);
                                } else if(e.value == 'neft') {
                                    formInstance.itemOption('payment.bankAccount', 'visible', true);
                                    formInstance.itemOption('payment.amount', 'visible', true);
                                }
                            }
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Please select a customer'
                        }]
                    },  {
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
                        }]
                    }, {
                        dataField: "cashBy",
                        name: 'cashBy',
                        label: {
                            text: 'Cash By'
                        },
                        visible: false,
                        width: 125,
                        editorType: 'dxNumberBox',
                        validationRules: [{
                            type: 'required',
                            message: 'Please enter a value'
                        }
                        ]
                    }
                ]
            }]
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

            if(result.isValid == true) {
                var formData = formInstance.option('formData');
                formData.status = 'pending';
                if(!formData.date) {
                    formData.date = new Date();
                }
                formData.date = formData.date.toString();
                var ref = rootRef.child('tenant-payments').child(tenantId);

                formData.user = auth.$getAuth().uid;
                firebaseUtils.addData(ref, formData).then(function() {
                    formInstance.resetValues();
                    resetFormInstance(formInstance);  
                });
            }
        }

        function resetFormInstance(formInstance){
                //formInstance.itemOption('payment.chequeAmount', 'visible', false);
                formInstance.itemOption('payment.chequeNumber', 'visible', false);
                formInstance.itemOption('payment.amount', 'visible', false);
                formInstance.itemOption('payment.cashBy', 'visible', false);
                formInstance.itemOption('payment.bankAccount', 'visible', false);
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
            var ref = rootRef.child('tenant-payments').orderByChild('date');
            vm.gridData = $firebaseArray(ref);

        }

        init();
    }
})();