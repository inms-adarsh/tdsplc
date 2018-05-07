(function () {
    'use strict';

    angular
        .module('app.dashboards.customers')
        .controller('DashboardCustomersController', DashboardCustomersController);

    /** @ngInject */
    function DashboardCustomersController($state, auth, accounts, $mdToast, firebaseUtils, $compile, users, $firebaseStorage, $firebaseObject, authService, dxUtils, msUtils, $firebaseArray, $scope, $mdDialog, $document, adminRequestService, customers) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            gridInstance,
            employeeDropdown,
            employeeGridInstance;

        // Data

        var role = JSON.parse(localStorage.getItem('role'));

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
        var paymentMode = [{
            id: 'prepaid',
            name: 'Prepaid'
        }, {
            id: 'postpaid',
            name: 'Postpaid'
        }];

        //
        init();


        /**
        * Init
        */
        function init() {
            vm.gridOptions = dxUtils.createGrid(),

            vm.pendingPaymentGridOptions = dxUtils.createGrid();

            var ref = rootRef.child('tenants').child(tenantId);
            ref.on('value', function (data) {                
                $scope.tenant = data.val();
                if($scope.tenant.requiredBalance > 0) {
                    vm.debitBalance = $scope.tenant.requiredBalance || 0;
                    vm.requiredBalance = $scope.tenant.requiredBalance - $scope.tenant.creditBalance;
                    DevExpress.ui.dialog.alert('Low credit balance ! please recharge with minimum '+ vm.requiredBalance +' to view all acknowledgements ', 'Balance Low !');
                } else {
                    vm.debitBalance = 0;
                    vm.requiredBalance = 0;
                }

                if($scope.tenant.creditBalance >= $scope.tenant.requiredBalance) {
                    vm.requiredBalance = 0;
                }
            });

            var ref = rootRef.child('tenant-tin-requests').child(tenantId).orderByChild('status').equalTo(1);

            vm.gridData = $firebaseArray(ref);

            var ref = rootRef.child('tenant-payments').orderByChild('tenantId').equalTo(tenantId);

            ref.on('value', function(data) {
                var data = data.val();
                vm.pendingPaymentData = data.filter(function(payment) {
                    return payment.status == 0;
                });
            });

            vm.requestGridOptions = {
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                summary: {
                    totalItems: [{
                        column: '#',
                        summaryType: 'count'
                    }]
                },

                editing: {
                    allowUpdating: false,
                    allowDeleting: false
                },
                columns: [
                    {
                        caption: '#',
                        cellTemplate: function (cellElement, cellInfo) {
                            cellElement.text(cellInfo.row.dataIndex + 1)
                        }
                    }, {
                        dataField: 'date',
                        caption: 'Date',
                        dataType: 'date',
                        validationRules: [{
                            type: 'required',
                            message: 'Date is required'
                        }],
                        allowEditing: false
                    },
                    {
                        dataField: 'refNo',
                        caption: 'Order Id #'
                    },
                    {
                        dataField: 'barcode',
                        caption: 'Barcode'
                    },
                    {
                        dataField: 'attachment27a',
                        caption: '27A',
                        cellTemplate: function (container, options) {
                            if (options.data.form27AUrl) {
                                $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.form27AUrl + '" download target="_blank"><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'FVU',
                        cellTemplate: function (container, options) {
                            if (options.data.fvuFileUrl) {
                                $compile($('<a class="md-button md-raised md-normal" href="' + options.data.fvuFileUrl + '" download target="_blank"><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }],
                onToolbarPreparing: function (e) {
                    var dataGrid = e.component;

                },
                export: {
                    enabled: true,
                    fileName: 'Requests',
                    allowExportSelectedData: true
                },
                onCellPrepared: function (e) {
                    if (e.rowType == 'data' && e.row.data.acknowledged === true) {
                        e.cellElement.find(".dx-link-delete").remove();
                        //e.cellElement.find(".dx-link-edit").remove();
                    }
                },
                onContentReady: function (e) {
                    gridInstance = e.component
                }

            };


            vm.pendingPayments = {
                columnAutoWidth: true,
                bindingOptions: {
                    dataSource: 'vm.pendingPaymentData'
                },
                summary: {
                    totalItems: [{
                        column: '#',
                        summaryType: 'count'
                    }]
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
                }]
            }
            angular.extend(vm.gridOptions, vm.requestGridOptions);
        }


        /**
         * Popup For assign employee
         */
        vm.assignedToPopupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '70%',
            height: 'auto',
            title: "Assign Selected Requests To",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            }
        };

        /**
       * Assign Button
       */
        vm.assignButtonOptions = {
            text: "Assign",
            type: "success",
            useSubmitBehavior: true,
            onClick: function (e) {
                assignRequests();
                $scope.visiblePopup = false;
                gridInstance.clearSelection();
                employeeGridInstance.clearSelection();
            }
        };
        //////////

        /**
         * assign requests function
         */
        function assignRequests() {

            var data = gridInstance.getSelectedRowKeys();
            var mergeObj = {};

            for (var i = 0; i < data.length; i++) {
                if (!data[i].acknowledged) {

                    var ref = rootRef.child('admin-tin-requests').child(data[i].$id);
                    ref.once("value", function (request) {
                        var request = request.val();
                        request.latest = true;

                        if (request.assignedTo) {
                            mergeObj['employee-tin-requests/' + request.assignedTo + '/' + data[i].$id] = null;
                        }
                        var assignedTo = employeeGridInstance.getSelectedRowKeys()[0].$id;
                        request.assignedTo = assignedTo;
                        mergeObj['employee-tin-requests/' + assignedTo + '/' + data[i].$id] = request;
                        mergeObj['admin-tin-requests/' + data[i].$id + '/latest'] = false;
                        mergeObj['admin-tin-requests/' + data[i].$id + '/assignedTo'] = assignedTo;
                        mergeObj['tenant-tin-requests/' + request.tenantId + '/' + data[i].$id + '/assignedTo'] = assignedTo;
                        mergeObj['tin-requests/' + request.requestId + '/assignedTo'] = assignedTo;

                    });

                }
            }

            rootRef.update(mergeObj).then(function () {
                $mdToast.show({
                    template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Request Submitted Successfully</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                    hideDelay: 7000,
                    controller: 'ToastController',
                    position: 'top right',
                    parent: '#content',
                    locals: {
                        cssStyle: {
                        }
                    }
                });
            });
        }
        /**
         * Employee Grid
         */
        vm.employeeGrid = {
            onContentReady: function (e) {
                employeeGridInstance = e.component
            },
            summary: {
                totalItems: [{
                    column: 'name',
                    summaryType: 'count'
                }]
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            }, {
                dataField: 'name',
                caption: 'Name',
                validationRules: [{
                    type: 'required',
                    message: 'Name is required'
                }],
            },
            {
                dataField: 'phone',
                caption: 'Phone',
                dataType: 'number',
                validationRules: [{
                    type: 'required',
                    message: 'Phone number is required'
                }]
            }, {
                dataField: 'pendingRequests',
                caption: 'Pending Requests'
            }],
            dataSource: users,
            selection: {
                mode: 'single',
                showCheckBoxesMode: 'always'
            }
        };

      

        vm.paymentRequests = {
            bindingOptions: {
                dataSource: 'vm.paymentRequestsgridData'
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
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
            }]
        };

        vm.mostRevenueClients = {
            bindingOptions: {
                dataSource: 'vm.revenueClientsData'
            },
            columns: [{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            }, {
                dataField: '$id',
                caption: 'Client',
                allowEditing: false,
                lookup: {
                    dataSource: customers,
                    displayExpr: "company",
                    valueExpr: "$id"
                }
            }, {
                dataField: 'totalRevenue',
                caption: 'Total Revenue'
            }],
        }
    }

})();