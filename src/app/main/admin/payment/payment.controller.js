(function () {
    'use strict';

    angular
        .module('app.admin.payment')
        .controller('PaymentController', PaymentController);

    /** @ngInject */
    function PaymentController(currentAuth, msUtils, dxUtils, users, auth, customers, $firebaseArray, firebaseUtils, authService, settings, tenantInfo, $scope, paymentService, $state) {
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

        vm.paymentOptions = {
            onToolbarPreparing: function (e) {
                var dataGrid = e.component;

                e.toolbarOptions.items.unshift(
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
                mode: 'row'
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.rowIndex + 1)
                }
            }, {
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

                // var ref = rootRef.child('tenant-payments').child(e.key.$id);
                // firebaseUtils.updateData(ref, e.data);

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
            }

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
                                } else if (e.value == 'cash') {
                                    formInstance.itemOption('payment.amount', 'visible', true);
                                    formInstance.itemOption('payment.cashBy', 'visible', true);
                                } else if (e.value == 'neft') {
                                    formInstance.itemOption('payment.bankAccount', 'visible', true);
                                    formInstance.itemOption('payment.amount', 'visible', true);
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
                        }]
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
                            message: 'Please select a value'
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

            if (result.isValid == true) {
                var formData = formInstance.option('formData');
                formData.status = 'pending';
                if (!formData.date) {
                    formData.date = new Date();
                }
                formData.date = formData.date.toString();
                var ref = rootRef.child('tenant-payments').child(tenantId);

                formData.user = auth.$getAuth().uid;
                firebaseUtils.addData(ref, formData).then(function () {
                    formInstance.resetValues();
                    resetFormInstance(formInstance);
                });
            }
        }

        function resetFormInstance(formInstance) {
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

        function init() {
            var ref = rootRef.child('tenant-payments').orderByChild('date');
            vm.gridData = $firebaseArray(ref);

        }

        /**
         * calculate revenues
         * @param {*} data 
         */
        function calculateRevenue(data) {
            var date = new Date(),
                month = date.getMonth(),
                year = date.getFullYear();

            var ref = rootRef.child("/tenant-monthly-revenues/" + year + "/" + month + "/" + data.tenantId),
                totalref = rootRef.child("/tenant-revenues/" + data.tenantId);
            // Attach an asynchronous callback to read the data at our posts reference
            var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
            var totalCost = data.fees + extraCharge;
            ref.on("value", function (snapshot) {
                var totalRevenue = 0;
                if(snapshot.val() && snapshot.val().totalRevenue) {
                    totalRevenue = snapshot.val().totalRevenue;
                } else {
                    totalRevenue = 0;
                }
                ref.update({ 'totalRevenue': totalRevenue + totalCost });
                totalref.update({ 'totalRevenue': totalRevenue + totalCost });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }

        /**
         * Approve all records
         * @param {*} latestRecords 
         */
        function approveAll(latestRecords) {
            latestRecords.forEach(function (record) {
                record.status = 'received';               
                approveSingleRecord(record);
            });

        }

        function settleDues(e) {
            var ref = rootRef.child('tenants').child(e.key.tenantId);
            firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                var creditBalance = data.creditBalance ? data.creditBalance : 0;
                firebaseUtils.updateData(ref, { 'creditBalance': creditBalance + e.key.amount }).then(function (data) {
                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + e.key.tenantId);
                    var creditBalance = data.creditBalance,
                        requiredBalance = data.requiredBalance;
                    firebaseUtils.fetchList(ref).then(function (requests) {
                        requests.forEach(function (request) {
                            var id = request.$id;
                            delete request.$id;
                            delete request.$conf;
                            delete request.$priority;
                            if (request.fees <= creditBalance || data.paymentType == 'postpaid') {
                                var obj = { ackAttached: true, remarks: '', status: 'acknowledged' };
                                rootRef.child('tenant-tin-requests-token/' + e.key.tenantId + '/' + id).update(Object.assign(request, obj));
                                rootRef.child('tenant-tin-requests/' + e.key.tenantId + '/' + request['barcode']).update(Object.assign(request, obj));
                                creditBalance = creditBalance - request.fees;
                                requiredBalance = requiredBalance - requests.fees;
                                rootRef.child('tenants').child(e.key.tenantId).update({ 'creditBalance': creditBalance, 'requiredBalance': requiredBalance });
                                calculateRevenue(request);
                                var ref = rootRef.child('tenant-pending-tin-requests-token/' + e.key.tenantId + '/' + request.token);
                                firebaseUtils.deleteData(ref);
                            }
                        });
                    })
                });
            });

        }

        /**
         * Approve Single Record
         * @param {*} record 
         */
        function approveSingleRecord(record) {
            var paymentId = record.$id;
            delete record.$id;
            delete record.$conf;
            delete record.$priority;

            var ref = rootRef.child('tenant-payments').child(paymentId);
            firebaseUtils.updateData(ref, record);

            var tenantLedger = rootRef.child('tenant-payment-ledger').child(record.tenantId);
            record.mode = 'credit';
            record.credit = record.amount;
            firebaseUtils.addData(tenantLedger, record);

            var ref = rootRef.child('tenants').child(record.tenantId);
            firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                var creditBalance = data.creditBalance ? data.creditBalance : 0,
                    requiredBalance = data.requiredBalance ? data.requiredBalance : 0;
                firebaseUtils.updateData(ref, { 'creditBalance': creditBalance + record.amount }).then(function (data) {
                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + record.tenantId);
                    var creditBalance = data.creditBalance;
                    firebaseUtils.fetchList(ref).then(function (requests) {
                        requests.forEach(function (request) {
                            var id = request.$id;
                            delete request.$id;
                            delete request.$conf;
                            delete request.$priority;
                            var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
                            var totalCost = request.fees + extraCharge;
                            if (totalCost <= creditBalance || data.paymentType == 'postpaid') {
                                var obj = { ackAttached: true, remarks: '', status: 'acknowledged' };
                                rootRef.child('tenant-tin-requests-token/' + record.tenantId + '/' + id).update(Object.assign(request, obj));
                                rootRef.child('tenant-tin-requests/' + record.tenantId + '/' + request['barcode']).update(Object.assign(request, obj));
                                creditBalance = creditBalance - totalCost;
                                requiredBalance = requiredBalance - totalCost;
                                rootRef.child('tenants').child(record.tenantId).update({ 'creditBalance': creditBalance, 'requiredBalance': requiredBalance }).then(function() {
                                    var tenantLedger = rootRef.child('tenant-payment-ledger').child(request.tenantId);
                                    request.mode = 'debit';
                                    request.debit = totalCost;
                                    request.acknowledgementNo = id;
                                    firebaseUtils.addData(tenantLedger, request);

                                    calculateRevenue(request);
                                    
                                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + request.tenantId + '/' + request.token);
                                    ref.update(null);
                                });

                            }
                        });
                    })
                });
            });

        }

        /**
         * Init function
         */
        init();
    }
})();