(function ()
{
    'use strict';

    angular
        .module('app.payment')
        .controller('AddPaymentDialogController', AddPaymentDialogController);

    /** @ngInject */
    function AddPaymentDialogController(auth, $state, $firebaseObject, isAdmin, authService, $mdToast, $scope, $mdDialog, $document, $firebaseStorage, firebaseUtils, paymentService, prerequisites)
    {
        var vm = this,
            formInstance,
            tenantId = authService.getCurrentTenant();

        // Data

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
                        },
                        max: new Date()
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Date is required'
                    }]
                }, {
                    dataField: 'tenantId',
                    label: {
                        text: 'Select Tenant'
                    },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: prerequisites.customers,
                        displayExpr: "company",
                        valueExpr: "$id",
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Date is required'
                    }],
                    visible: isAdmin
                }, {
                    dataField: 'status',
                    label: {
                        text: 'Select Status'
                    },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: prerequisites.paymentStatus,
                        displayExpr: "name",
                        valueExpr: "id",
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Status is required'
                    }],
                    visible: isAdmin
                }, {
                    dataField: 'paymentMode',
                    label: {
                        text: 'Payment Mode'
                    },
                    name: 'paymentMode',
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: prerequisites.paymentModes,
                        displayExpr: "name",
                        valueExpr: "id",
                        onValueChanged: function (e) {
                            resetFormInstance(formInstance);
                            if (e.value == 'cheque') {
                                formInstance.itemOption('amount', 'visible', true);
                                formInstance.itemOption('chequeNumber', 'visible', true);
                            } else if (e.value == 'cash') {
                                formInstance.itemOption('amount', 'visible', true);
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
                        dataSource: prerequisites.accounts,
                        displayExpr: "bankname",
                        valueExpr: "$id",
                        onValueChanged: function (e) {
                        }
                    }
                }
            ]
        };


        /**
         * Add Payment
         */
        vm.addPayment = function uploadFiles() {
            var result = formInstance.validate();

            if (!result || result.isValid == true) {
                var formObj = formInstance.option('formData');

                if(!formObj.tenantId) {
                    formObj.tenantId = tenantId;
                }

                if(!formObj.status) {
                    formObj.status = 0;
                }
                paymentService.addPayment(formObj).then(function(key) { 
                    if(formObj.status == 1) {
                        formObj.$id = key;
                        paymentService.approveSingleRecord(formObj, auth.$getAuth().uid);
                    }
                    DevExpress.ui.dialog.alert('New request added successfully', 'Success');                   
                    $mdDialog.hide();  
                });

                
            }
        }

        /**
         * Reset Form Instance
         * @param {*} formInstance 
         */
        function resetFormInstance(formInstance) {
            //formInstance.itemOption('payment.chequeAmount', 'visible', false);
            formInstance.itemOption('chequeNumber', 'visible', false);
            formInstance.itemOption('amount', 'visible', false);
            formInstance.itemOption('bankAccount', 'visible', false);
            //formInstance.itemOption('payment.neftAmount', 'visible', false);
        }
    }
})();