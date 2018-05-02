(function ()
{
    'use strict';

    angular
        .module('app.dashboards.analytics')
        .controller('DashboardAnalyticsController', DashboardAnalyticsController);

    /** @ngInject */
    function DashboardAnalyticsController($state, auth, $mdToast, firebaseUtils, $compile, users, $firebaseStorage, $firebaseObject, authService, dxUtils, msUtils, $firebaseArray, $scope, $mdDialog, $document, adminRequestService, customers)
    {
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

            var ref = rootRef.child('tenants');
            vm.clients = $firebaseArray(ref);

            if (role == 'employee') {
                var ref = rootRef.child('employee-tin-requests').child(auth.$getAuth().uid).orderByChild('status').equalTo('pending');
            } else {
                var ref = rootRef.child('admin-tin-requests').orderByChild('status').equalTo('pending');
            }

            vm.gridData = $firebaseArray(ref);
            vm.clientGridData = $firebaseArray(rootRef.child('tenants').orderByChild('requiredBalance').startAt(1));
            vm.paymentRequestsgridData = $firebaseArray(rootRef.child('tenant-payments').orderByChild('status').equalTo('pending'));
            var date = new Date(),
                month = date.getMonth(),
                year = date.getFullYear();

            vm.revenueClientsData = $firebaseArray(rootRef.child('tenant-monthly-revenues/'+ year + '/'+ month).orderByChild('totalRevenue').limitToLast(10));

            $firebaseObject(rootRef.child('monthly-revenues/'+ year + '/'+ month)).$bindTo($scope, 'monthlyRevenue');
            $firebaseObject(rootRef.child('yearly-revenues/'+ year)).$bindTo($scope, 'yearlyRevenue');
            vm.requestGridOptions = {
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                editing: {
                    allowUpdating: false,
                    allowDeleting: false
                },
                summary: {
                    totalItems: [{
                        column: '#',
                        summaryType: 'count'
                    }]
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
                        dataField: 'assignedTo',
                        caption: "Assigned To",
                        lookup: {
                            dataSource: users,
                            valueExpr: '$id',
                            displayExpr: 'name'
                        }
                    },
                    {
                        dataField: 'tenantId',
                        caption: 'client',
                        dataType: 'string',
                        calculateCellValue: function (options) {
                            var index = msUtils.getIndexByArray(vm.clients, '$id', options.tenantId);
                            return vm.clients[index].company;
                        },
                        allowEditing: false
                    }, 
                    {
                        dataField: 'attachment27a',
                        caption: '27A',
                        cellTemplate: function (container, options) {
                            if (options.data.form27AUrl) {
                                $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.form27AUrl + '" download><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'FVU',
                        cellTemplate: function (container, options) {
                            if (options.data.fvuFileUrl) {
                                $compile($('<a class="md-button md-raised md-normal" href="' + options.data.fvuFileUrl + '" download><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }],
                onToolbarPreparing: function (e) {
                    var dataGrid = e.component;

                    e.toolbarOptions.items.unshift(
                        {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                text: 'Select Latest Requests',
                                icon: "check",
                                onClick: function (e) {
                                    var data = vm.gridData,
                                        zip = new JSZip(),
                                        count = 0,
                                        mergeObj = {},
                                        latestRecords,
                                        zipFilename;

                                    latestRecords = vm.gridData.filter(function (request) {
                                        return request.latest == true;
                                    });
                                    gridInstance.selectRows(latestRecords);
                                }
                            }
                        }, {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                hint: "Download",
                                icon: "download",
                                text: 'Download Selected FVUs',
                                onClick: function (e) {
                                    var latestRecords = gridInstance.getSelectedRowKeys(),
                                        zip = new JSZip(),
                                        count = 0,
                                        mergeObj = {},
                                        zipFilename;

                                    zipFilename = msUtils.formatDate(new Date()) + latestRecords[0].requestId + "_FVUs.zip";

                                    latestRecords.forEach(function (record) {
                                        var fvuUrl = record.fvuFileUrl,
                                            fileName = record.fvuFileName;
                                        if (role == 'employee') {
                                            mergeObj['employee-tin-requests/' + auth.$getAuth().uid + '/' + record.$id + '/latest'] = false;
                                        } else {
                                            mergeObj['admin-tin-requests/' + record.$id + '/latest'] = false;
                                        }
                                        //var acknowledgementRef = firebase.storage().ref("tenant-tin-requests/" + latestRecords[i].rquestId + "/fvus/" + fvu.name)
                                        JSZipUtils.getBinaryContent(fvuUrl, function (err, data) {
                                            if (err) {
                                                throw err; // or handle the error
                                            }
                                            zip.file(fileName, data, { binary: true });
                                            count++;
                                            if (count == latestRecords.length) {
                                                var zipFile = zip.generateAsync({ type: "blob" }).then(function (blob) { // 1) generate the zip file
                                                    saveAs(blob, zipFilename);
                                                    rootRef.update(mergeObj);                     // 2) trigger the download
                                                }, function (err) {
                                                    alert('erro generating download!');
                                                });
                                            }
                                        });
                                    });
                                }
                            }
                        }, {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                text: 'Assign Selected',
                                icon: "group",
                                onClick: function (e) {
                                    $scope.visiblePopup = true;
                                }
                            }
                        } 
                    );
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

        vm.pendingPayments = {
            bindingOptions: {
                dataSource: 'vm.clientGridData'
            },
            columns: [{
                caption: '#',
                cellTemplate: function(cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            }, {
                dataField: 'company',
                caption: 'Firm name',
                validationRules: [{
                    type: 'required',
                    message: 'Name is required'
                }],
            },{
                dataField: 'creditBalance',
                caption: 'Credit Balance'
            }, {
                dataField: 'requiredBalance',
                caption: 'Required Balance'
            }, {
                dataField: 'phone',
                caption: 'Phone',
                dataType: 'number',
                validationRules: [{
                    type: 'required',
                    message: 'Phone number is required'
                }]
            }, {
                dataField: 'paymentType',
                caption: 'Customer Type',
                lookup: {
                    dataSource: paymentMode,
                    displayExpr: "name",
                    valueExpr: "id"
                },
                validationRules: [{
                    type: 'required',
                    message: 'Field is required'
                }]

            }]
        };

        
        vm.paymentRequests = {
            bindingOptions: {
                dataSource: 'vm.paymentRequestsgridData'
            },
            columns: [{
                caption: '#',
                cellTemplate: function(cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            },{
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
            columns:[{
                caption: '#',
                cellTemplate: function (cellElement, cellInfo) {
                    cellElement.text(cellInfo.row.dataIndex + 1)
                }
            },{
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