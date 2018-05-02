(function () {
    'use strict';

    angular
        .module('app.admin.requests')
        .controller('AdminRequestsController', AdminRequestsController);

    /** @ngInject */
    function AdminRequestsController($rootScope, $state, auth, $mdToast, firebaseUtils, $compile, users, $firebaseStorage, $firebaseObject, authService, dxUtils, msUtils, $firebaseArray, $scope, $mdDialog, $document, adminRequestService, settings, customers) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            requestForm,
            formInstance,
            form27AInstance,
            tdsInstance,
            ackFormInstance,
            ackFileFormInstance,
            gridInstance,
            employeeDropdown,
            employeeGridInstance,
            fvuInstance,
            formTDSInstance
            ;

        // Data

        var role = JSON.parse(localStorage.getItem('role'));

        var requestStatus = [{
            id: 1,
            name: 'Pending'
        }, {
            id: 0,
            name: 'Invalid'
        }, {
            id: 2,
            name: 'Uploaded'
        }];

        vm.uploadReqbtnDisabled = true;

        vm.statusSelectBox = {
            dataSource: requestStatus,
            displayExpr: 'name',
            valueExpr: 'id',
            width: 300,
            label: {
                text: 'Filter By Status'
            },
            onValueChanged: function (e) {

            }
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
                dataField: 'refNo',
                caption: 'Reference No'
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
                dataField: 'email',
                caption: 'Email/User Id',
                validationRules: [{
                    type: 'email',
                    message: 'Please enter valid e-mail address'
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

        /**
         * Assign Button
         */
        vm.assignButtonOptions = {
            text: "Assign",
            type: "success",
            useSubmitBehavior: true,
            onClick: function (e) {
                var assignedTo = employeeGridInstance.getSelectedRowKeys()[0].$id;
                assignRequests(assignedTo);
                
                $scope.visiblePopup = false;
            }
        };

        /**
         * Assign Button
         */
        vm.requestButtonOptions = {
            text: "Upload",
            type: "success",
            useSubmitBehavior: true,
            bindingOptions: {
                'disabled': 'vm.uploadReqbtnDisabled'
            },
            validationGroup: "requestData",
            onClick: function (e) {
                vm.btnDisabled = true;
                var result = e.validationGroup.validate();

                if (result.isValid == true) {
                    saveRequest();
                    $scope.visibleRequestPopup = false
                }
            }
        };
        // Methods
        init();
        //////////

        /**
         * assign requests function
         */
        function assignRequests(assignedTo) {

            if(assignedTo == auth.$getAuth().uid) {
                return;
            }
            var data = gridInstance.getSelectedRowKeys();
            var mergeObj = {};

            data.forEach(function(tinrequest) {
                if (!tinrequest.acknowledged) {
                        tinrequest.latest = true;

                        if (tinrequest.assignedTo) {
                            mergeObj['employee-tin-requests/' + tinrequest.assignedTo + '/' + tinrequest.$id] = null;
                        }
                        
                        tinrequest.assignedTo = assignedTo;
                        mergeObj['admin-tin-requests/' + tinrequest.$id + '/latest'] = false;
                        mergeObj['admin-tin-requests/' + tinrequest.$id + '/assignedTo'] = assignedTo;
                        mergeObj['tenant-tin-requests/' + tinrequest.tenantId + '/' + tinrequest.$id + '/assignedTo'] = assignedTo;
                        mergeObj['tin-requests/' + tinrequest.requestId + '/assignedTo'] = assignedTo;
                        var id = tinrequest.$id;
                        delete tinrequest.$id;
                        delete tinrequest.$priority;
                        mergeObj['employee-tin-requests/' + assignedTo + '/' + id] = tinrequest;

                }
            });

            rootRef.update(mergeObj).then(function () {                
                gridInstance.clearSelection();
                employeeGridInstance.clearSelection();
                DevExpress.ui.dialog.alert('All selected requests assigned successfully ', 'Success'); 
            });
        }

        vm.uploadPopupOptions = {
            contentTemplate: "requestinfo",
            showTitle: true,
            width: '70%',
            height: 'auto',
            title: "Add Tin Requests",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visibleRequestPopup"
            }
        };

        /**
         * Init
         */
        function init() {
            vm.gridOptions = dxUtils.createGrid();

            var ref = rootRef.child('tenants');
            vm.clients = $firebaseArray(ref);

            if (role == 'employee') {
                var ref = rootRef.child('employee-tin-requests').child(auth.$getAuth().uid);
            } else {
                var ref = rootRef.child('admin-tin-requests');
            }

            vm.gridData = $firebaseArray(ref);

            // if(role == 'employee') {
            //     vm.gridData.$loaded(function(data) {
            //         vm.gridData = data.filter(function(request) {
            //          return request.assignedTo == auth.$getAuth().uid;
            //         });
            //     });
            // }

            var groupCellTemplate = function (groupCell, info) {
                var index = msUtils.getIndexByArray(vm.clients, '$id', info.data.items ? info.data.items[0].tenantId : info.data.collapsedItems[0].tenantId);
                var requestDate = msUtils.formatDate(new Date(info.data.items ? info.data.items[0].date : info.data.collapsedItems[0].date));
                vm.selectedRequest = info.data.items ? info.data.items[0] : info.data.collapsedItems[0];
                $('<span>' + vm.clients[index].company + '(Date: ' + requestDate + ' )</span>').append($($compile('<div dx-select-box="selectBox(vm.selectedRequest)"></div>')($scope))).appendTo(groupCell);
            };

            $scope.selectBox = function selectBox(request) {
                var request = request;
                return {
                    width: 200,
                    height: 30,
                    placeholder: 'Assign a Employee',
                    dataSource: users,
                    displayExpr: 'name',
                    valueExpr: '$id',
                    value: request.assignedTo,
                    visible: role == 'employee' ? false : true,
                    onValueChanged: function (e) {
                        var ref = rootRef.child('admin-tin-requests').orderByChild('requestId').equalTo(request.requestId);
                        firebaseUtils.fetchList(ref).then(function (data) {
                            for (var i = 0; i < data.length; i++) {
                                var mergeObj = {};

                                var ref = rootRef.child('admin-tin-requests').child(data[i].$id);
                                ref.once("value", function (request) {
                                    var request = request.val();
                                    request.latest = true;

                                    if (request.assignedTo) {
                                        mergeObj['employee-tin-requests/' + request.assignedTo + '/' + data[i].$id] = null;
                                    }

                                    request.assignedTo = e.value;
                                    mergeObj['employee-tin-requests/' + e.value + '/' + data[i].$id] = request;

                                    mergeObj['admin-tin-requests/' + data[i].$id + '/assignedTo'] = e.value;
                                    mergeObj['tenant-tin-requests/' + request.tenantId + '/' + data[i].$id + '/assignedTo'] = e.value;
                                    mergeObj['tin-requests/' + request.requestId + '/assignedTo'] = e.value;

                                    rootRef.update(mergeObj);
                                });

                            }
                        });

                    }
                };
            };

            vm.requestGridOptions = {
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                editing: {
                    allowUpdating: true,
                    allowDeleting: true
                },
                columns: [
                    {
                        caption: '#',
                        cellTemplate: function (cellElement, cellInfo) {
                            cellElement.text(cellInfo.row.dataIndex + 1)
                        }
                    },
                    {
                        dataField: 'date',
                        caption: 'Date',
                        dataType: 'date',
                        validationRules: [{
                            type: 'required',
                            message: 'Date is required'
                        }],
                        allowEditing: false
                    }, {
                        dataField: 'refNo',
                        caption: 'Order Id #'
                    },  {
                        caption: 'Deductor/Collector Name',
                        dataField: 'deductor',
                        allowEditing: false
                    },
                    {
                        dataField: 'tenantId',
                        caption: 'client',
                        dataType: 'string',
                        calculateCellValue: function (options) {
                            var index = msUtils.getIndexByArray(vm.clients, '$id', options.tenantId);
                            if(index > -1) {
                                return vm.clients[index].company;
                            } else {
                                return '';
                            }
                        },
                        allowEditing: false
                    },{
                        dataField: 'attachment27a',
                        caption: '27A',
                        cellTemplate: function (container, options) {
                            if (options.data.form27AUrl) {
                                $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.form27AUrl + '" download><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            } else {
                                $compile($('<a ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Wrong Form27A! Click to Upload again</a>'))($scope).appendTo(container);
                                //$compile($('<div dx-file-uploader="vm.form27AUploader(' + options.data.barcode + ')"></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'FVU',
                        cellTemplate: function (container, options) {
                            if (options.data.fvuFileUrl) {
                                $compile($('<a class="md-button md-raised md-normal" href="' + options.data.fvuFileUrl + '" download><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            } else {
                                $compile($('<a ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Wrong FVU! Click to Upload again</a>'))($scope).appendTo(container);
                            }
                        },
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
                    }, {
                        dataField: 'token',
                        caption: 'Token Number',
                        allowEditing: false

                    }, {
                        dataField: 'rno',
                        caption: 'R No',
                        allowEditing: false
                    }, {
                        dataField: 'rdate',
                        caption: 'R Date',
                        allowEditing: false
                    }, {
                        dataField: 'barcode',
                        caption: 'Barcode',
                        allowEditing: false
                    }, {
                        dataField: 'module',
                        caption: 'Module',
                        allowEditing: false
                    },  {
                        caption: 'Finacial Year',
                        dataField: 'finYear',
                        allowEditing: false
                    }, {
                        caption: 'QTR',
                        dataField: 'qtr',
                        allowEditing: false
                    }, {
                        caption: 'Form No',
                        dataField: 'formNo',
                        allowEditing: false
                    }, {
                        caption: 'TAN',
                        dataField: 'tan',
                        allowEditing: false
                    }, {
                        caption: 'AO Code',
                        dataField: 'aoCode',
                        allowEditing: false
                    }, {
                        caption: 'Regular/Correction',
                        dataField: 'corrections',
                        allowEditing: false
                    }, {
                        caption: 'Original Token No',
                        dataField: 'origTokenNo',
                        allowEditing: false
                    }, {
                        caption: 'Deductee/Collectee Count',
                        dataField: 'collecteeCount',
                        allowEditing: false
                    }, {
                        caption: 'User ID',
                        dataField: 'userId',
                        allowEditing: false
                    }, {
                        dataField: 'fees',
                        caption: 'Fees',
                        allowEditing: false
                    }, {
                        dataField: 'extra',
                        caption: 'Extra',
                        allowEditing: false
                    }, {
                        dataField: 'discount',
                        caption: 'Discount',
                        alignment: 'right',
                        allowEditing: false,
                        calculateCellValue: function(data) {
                            return data.discount? data.discount + '%' : '';
                        }
                    }, {
                        dataField: 'totalCost',
                        caption: 'Total Cost',
                        dataType: 'number',
                        calculateCellValue: function(data) {
                            var discount = data.discount ? data.discount : 0;
                            return data.fees - (data.fees * discount * 0.01 ) + data.extra;
                        }
                    }, {
                        dataField: 'acknowledgementUrl',
                        caption: 'Acknowledgement',
                        cellTemplate: function (container, options) {
                            if (options.data.acknowledgementUrl) {
                                $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.acknowledgementUrl + '" download><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                            }
                        },
                        allowEditing: false
                    }, {
                        dataField: 'remarks',
                        caption: 'Remarks'
                    }, {
                        dataField: 'status',
                        caption: 'Status',
                        allowEditing: false,
                        lookup: {
                            dataSource: requestStatus,
                            displayExpr: "name",
                            valueExpr: "id"
                        },
                        sortIndex: 0,
                        sortOrder: "asc"
                    }, {
                        dataField: 'ref',
                        caption: 'Reference'
                    }],
                onToolbarPreparing: function (e) {
                    var dataGrid = e.component;

                    e.toolbarOptions.items.unshift(
                        {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                text: 'Add New Request',
                                icon: "plus",
                                type: 'default',
                                onClick: function (e) {
                                    $mdDialog.show({
                                        controller: 'AddRequestDialogController',
                                        templateUrl: 'app/main/apps/requests/views/addNewRequestDialog/add-new-request-dialog.html',
                                        parent: angular.element(document.body),
                                        controllerAs: 'vm',
                                        clickOutsideToClose: true,
                                        fullscreen: true, // Only for -xs, -sm breakpoints.,
                                        bindToController: true,
                                        locals: { isAdmin: true, customers: customers }
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
                customizeColumns: function (columns) {
                    $.each(columns, function (_, element) {
                        element.groupCellTemplate = groupCellTemplate;
                    });
                },
                onCellPrepared: function (e) {
                    if (e.rowType == 'data' && e.row.data.acknowledged === true) {
                        e.cellElement.find(".dx-link-delete").remove();
                        //e.cellElement.find(".dx-link-edit").remove();
                    }
                },
                onRowPrepared: function (info) {
                    if (info.rowType == 'data' && info.data.latest == true)
                        info.rowElement.addClass("md-light-blue-50-bg");
                    if (info.rowType == 'data' && info.data.ackAttached == true)
                        info.rowElement.addClass("md-green-50-bg");
                    if (info.rowType == 'data' && info.data.valid == false) {
                        info.rowElement.addClass("md-red-50-bg");
                    }

                },
                onRowUpdated: function (e) {
                    var mergeObj = {};
                    mergeObj['admin-tin-requests/' + e.key.$id + '/remarks'] = e.key.remarks;
                    mergeObj['tin-requests/' + e.key.requestId + '/' + e.key.$id + '/remarks'] = e.key.remarks;

                    if (e.key.assignedTo) {
                        mergeObj['employee-tin-requests/' + e.key.assignedTo + '/' + e.key.$id + '/remarks'] = e.key.remarks;
                    }

                    mergeObj['tenant-tin-requests/' + e.key.tenantId + '/' + e.key.$id + '/remarks'] = e.key.remarks;
                    rootRef.update(mergeObj).then(function () {
                    });
                },
                onRowRemoving: function (e) {
                    var mergeObj = {};
                    mergeObj['admin-tin-requests/' + e.key.$id] = null;
                    mergeObj['tin-requests/' + e.key.requestId + '/' + e.key.$id] = null;
                    if (e.key.assignedTo) {
                        mergeObj['employee-tin-requests/' + e.key.assignedTo + '/' + e.key.$id] = null;
                    }

                    mergeObj['tenant-tin-requests/' + e.key.tenantId + '/' + e.key.$id] = null;
                    rootRef.update(mergeObj).then(function () {
                    });

                },
                onContentReady: function (e) {
                    gridInstance = e.component
                },
                summary: {
                    totalItems: [{
                        column: '#',
                        summaryType: 'count'
                    }]
                }

            };

            vm.tdsRequestForm = {
                onInitialized: function (e) {
                    formTDSInstance = e.component;
                },
                validationGroup: "customerData",
                items: [{
                    itemType: "group",
                    caption: "Add E-TDS",
                    colCount: 2,
                    items: [
                        {
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: 'application/xls',
                                    selectButtonText: "Select E-TDS",
                                    multiple: 'false',
                                    uploadMode: "useButtons",
                                    onContentReady: function (e) {
                                        tdsInstance = e.component;
                                    },
                                    onValueChanged: function (e) {
                                        var values = e.component.option("values");
                                        $.each(values, function (index, value) {
                                            e.element.find(".dx-fileuploader-upload-button").hide();
                                        });
                                        e.element.find(".dx-fileuploader-upload-button").hide();
                                    }
                                }));

                                // itemElement.append('<div id="button" dx-button="buttonOptions"></div>');
                            }
                        }
                    ]
                }]

            };

            vm.ackRequestForm = {
                onInitialized: function (e) {
                    ackFormInstance = e.component;
                },
                items: [{
                    itemType: "group",
                    caption: "Add Acknowledgements",
                    colCount: 2,
                    items: [
                        {
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: 'application/pdf',
                                    selectButtonText: "Select Acknowledgements to upload",
                                    multiple: true,
                                    uploadMode: "useButtons",
                                    onContentReady: function (e) {
                                        ackFileFormInstance = e.component;
                                    },
                                    onValueChanged: function (e) {
                                        var values = e.component.option("values");
                                        $.each(values, function (index, value) {
                                            e.element.find(".dx-fileuploader-upload-button").hide();
                                        });
                                        e.element.find(".dx-fileuploader-upload-button").hide();

                                    }
                                }));
                            }
                        }
                    ]
                }]

            };

            vm.eTdSButtonOptions = {
                text: "Upload e-TDS",
                type: "success",
                useSubmitBehavior: false,
                onClick: function () {
                    tdsInstance.option('disabled', true);
                    saveTDSRequest();
                }
            };

            vm.ackButtonOptions = {
                text: "Upload Acknowledgements",
                type: "success",
                useSubmitBehavior: false,
                onClick: function () {
                    ackFileFormInstance.option('disabled', true);
                    saveAckRequest();
                }
            };

            angular.extend(vm.gridOptions, vm.requestGridOptions);
        }

        function saveTDSRequest() {

            var value = tdsInstance.option('value');

            if (value.length === 0) {
                tdsInstance.option('disabled', false);
                tdsInstance.reset();
                return;
            }

            adminRequestService.submitEtds(value, settings, vm.gridData);             
            tdsInstance.option('disabled', false);
            tdsInstance.reset();
        }

        function saveAckRequest() {
            var acknowledgements = ackFileFormInstance.option('value');
            var tokens = [],
                invalidTokens = [],
                positionTop = 0,
                positionLeft = 0,
                increment = 65,
                uploadedAcknowledgement = {};

            if (acknowledgements.length === 0) {
                ackFileFormInstance.option('disabled', false);
                ackFileFormInstance.reset();
                return;
            }
            var promises = acknowledgements.map(function (acknowledgement) {
                return new Promise(function (resolve, reject) {
                    var acknowledgementNo = acknowledgement.name.split('.')[0];

                    var index = msUtils.getIndexByArray(vm.gridData, 'token', acknowledgementNo);

                    if (index > -1) {
                        var ref = rootRef.child('tin-requests-token').child(acknowledgementNo);
                        var acknowledgementRef = firebase.storage().ref("tenant-acknowledgements/" + acknowledgement.name),
                            metaData = {
                                customMetadata: {
                                    'fileType': acknowledgement.type,
                                    'fileName': acknowledgement.name,
                                    'fileSize': acknowledgement.size
                                }
                            };
                        ref.once('value', function (data) {
                            var data = data.val();
                            if (!data.ackAttached) {
                                data.ackDate = new Date();
                                data.ackDate = new Date().toString();
                                $firebaseStorage(acknowledgementRef).$put(acknowledgement, metaData).$complete(function (snapshot) {
                                    var obj = { acknowledgementFileName: acknowledgement.name, acknowledgementUrl: snapshot.downloadURL, ackAttached: true, status: 2 };
                                    rootRef.child('admin-tin-requests/' + data['barcode']).update(obj);
                                    if (data.assignedTo) {
                                        rootRef.child('employee-tin-requests/' + data.assignedTo + '/' + data['barcode']).update(obj);
                                    }
                                    rootRef.child('tin-requests/' + data.requestId + '/' + data['barcode']).update(obj);
                                    rootRef.child('tin-requests-token/' + acknowledgementNo).update(obj);
                                    rootRef.child('admin-tin-requests-token/' + acknowledgementNo).update(Object.assign(data, obj));

                                    //rootRef.child('tenant-tin-requests-token/' + data.tenantId + '/' + obj.token).update(obj);
                                    var ref = rootRef.child('tenants').child(data.tenantId);

                                    $firebaseObject(ref).$loaded(function (tenant) {
                                        var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
                                        var discount = tenant.discount ? tenant.discount : 0;
                                        var totalCost = data.fees - (data.fees * discount * 0.01) + extraCharge;
                                        if (tenant.creditBalance >= totalCost || tenant.paymentType == 'postpaid') {

                                            rootRef.child('tenant-tin-requests-token/' + data.tenantId + '/' + acknowledgementNo).update(Object.assign(data, obj));
                                            rootRef.child('tenant-tin-requests/' + data.tenantId + '/' + data['barcode']).update(Object.assign(data, obj));
                                            rootRef.child('tenants/' + data.tenantId).update({ creditBalance: (tenant.creditBalance ? tenant.creditBalance : 0) - parseInt(totalCost) });
                                            var tenantLedger = rootRef.child('tenant-payment-ledger').child(data.tenantId);
                                            data.mode = 'debit';
                                            data.debit = totalCost;
                                            data.acknowledgementNo = acknowledgementNo;
                                            firebaseUtils.addData(tenantLedger, data).then(function () {
                                                if(uploadedAcknowledgement[data.tenantId]) {
                                                    uploadedAcknowledgement[data.tenantId].push(data);
                                                    return resolve(data);
                                                } else {
                                                    uploadedAcknowledgement[data.tenantId] = [];
                                                    uploadedAcknowledgement[data.tenantId].push(data);
                                                    return resolve(data);
                                                }
                                            });
                                        } else {
                                            rootRef.child('tenant-pending-tin-requests-token/' + data.tenantId + '/' + acknowledgementNo).update(Object.assign(data, obj));
                                            calculateRequiredBalance(data);
                                            rootRef.child('tenant-tin-requests/' + data.tenantId + '/' + data['barcode']).update({ status: 3, remarks: 'Credit Balance Low! Please Recharge ' }).then(function () {
                                            });
                                        }
                                    });
                                });
                            } else {
                                tokens.push(acknowledgementNo);
                            }
                        });
                    } else {
                        invalidTokens.push(acknowledgementNo);

                    }
                    ackFileFormInstance.option('disabled', false);
                    ackFileFormInstance.reset();

                });

            });

            Promise.all(promises).then(function (promise) {
                for(var tenant in uploadedAcknowledgement) {
                    var ref = rootRef.child('tenant-acknowledgement-mail').child(tenant);
                    firebaseUtils.addData(ref, uploadedAcknowledgement[tenant]);
                }
            });
            for (var i = 0; i < tokens.length; i++) {
                $mdToast.show({
                    template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Acknowledgement already attached for token ' + tokens[i] + '</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                    hideDelay: 7000,
                    controller: 'ToastController',
                    position: 'top right',
                    parent: '#content',
                    locals: {
                        cssStyle: {
                            'top': positionTop + 'px'
                        }
                    }
                }).then(function () {
                    positionTop += increment;
                });
                positionTop += increment;
            }

            for (var i = 0; i < invalidTokens.length; i++) {
                $mdToast.show({
                    template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Invalid Acknowledgement File  ' + invalidTokens[i] + '</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                    hideDelay: 7000,
                    controller: 'ToastController',
                    position: 'top left',
                    parent: '#content',
                    locals: {
                        cssStyle: {
                            'top': positionLeft + 'px'
                        }
                    }
                }).then(function () {
                    positionLeft += increment;
                });
                positionLeft += increment;
            }
        }


        function calculateRequiredBalance(data) {
            var ref = rootRef.child("/tenants/" + data.tenantId);
            ref.once('value', function (snapshot) {
                var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
                var discount = snapshot.val().discount ? snapshot.val().discount : 0;
                var totalCost = data.fees  - (data.fees * discount * 0.01) + extraCharge;
                var prevBalance = snapshot.val().requiredBalance ? snapshot.val().requiredBalance : 0;
                ref.update({ requiredBalance: prevBalance + totalCost })
            });
        }


        function calculateRevenue(data) {
            var date = new Date(),
                month = date.getMonth(),
                year = date.getFullYear();

            var ref = rootRef.child("/tenant-monthly-revenues/" + year + "/" + month + "/" + data.tenantId),
                totalref = rootRef.child("/tenant-revenues/" + data.tenantId);
            // Attach an asynchronous callback to read the data at our posts reference
            ref.once("value", function (snapshot) {
                var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
                var totalCost = data.fees  + extraCharge;
                ref.update({ totalRevenue: snapshot.val().totalRevenue + totalCost });
                totalref.update({ totalRevenue: snapshot.val().totalRevenue + totalCost });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }

        vm.uploadForm27A = function uploadForm27A(barcode) {
            var index = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode),
                request = vm.gridData[index];

            $mdDialog.show({
                controller: 'TinRequestDialogController',
                templateUrl: 'app/main/apps/requests/views/TinRequestDialog/tin-request-dialog.html',
                parent: angular.element(document.body),
                controllerAs: 'vm',
                clickOutsideToClose: true,
                fullscreen: true, // Only for -xs, -sm breakpoints.,
                locals: { barcode: barcode, request: request },
                bindToController: true
            })
                .then(function (answer) {
                    vm.requestNo = request.requestId;
                    vm.showAdditonalFileProgressBar = true;
                }, function () {
                    $scope.status = 'You cancelled the dialog.';
                });
        };
    }

})();