(function () {
    'use strict';

    angular
        .module('app.admin.requests')
        .controller('AdminRequestsController', AdminRequestsController);

    /** @ngInject */
    function AdminRequestsController($state, auth, $mdToast, firebaseUtils, $compile, users, $firebaseStorage, $firebaseObject, authService, dxUtils, msUtils, $firebaseArray, $scope, $mdDialog, $document, adminRequestService) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            requestForm,
            formInstance,
            form27AInstance,
            ackFormInstance,
            ackFileFormInstance,
            gridInstance
            ;

        // Data

        var role = JSON.parse(localStorage.getItem('role'));

        var requestStatus = [{
            id: 'pending',
            name: 'Pending'
        }, {
            id: 'invalid',
            name: 'Invalid'
        }, {
            id: 'acknowledged',
            name: 'Acknowledged'
        }];
        // Methods
        init();
        //////////

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
                                ref.on("value", function (request) {
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
                columns: [{
                    dataField: 'date',
                    caption: 'Date',
                    dataType: 'date',
                    validationRules: [{
                        type: 'required',
                        message: 'Date is required'
                    }],
                    allowEditing: false
                }, {
                    dataField: 'requestId',
                    caption: "Request No",
                    groupIndex: 0,
                    allowEditing: false
                }, {
                    dataField: 'tenantId',
                    caption: 'client',
                    dataType: 'string',
                    calculateCellValue: function (options) {
                        var index = msUtils.getIndexByArray(vm.clients, '$id', options.tenantId);
                        return vm.clients[index].company;
                    },
                    allowEditing: false
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
                }, {
                    caption: 'Deductor/Collector Name',
                    dataField: 'deductor',
                    allowEditing: false
                }, {
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
                    allowEditing: false
                }, {
                    dataField: 'attachment27a',
                    caption: 'Attachment 27A',
                    cellTemplate: function (container, options) {
                        if (options.data.form27AUrl) {
                            $('<a href="' + options.data.form27AUrl + '" download>'+ options.data.form27AFileName +'</a>').appendTo(container);
                        }
                    },
                    allowEditing: false
                }, {
                    dataField: 'attachmentfvu',
                    caption: 'Attachment FVU',
                    cellTemplate: function (container, options) {
                        if (options.data.fvuFileUrl) {
                            $('<a href="' + options.data.fvuFileUrl + '" download>' + options.data.fvuFileName +'</a>').appendTo(container);
                        }
                    },
                    allowEditing: false
                }, {
                    dataField: 'acknowledgementUrl',
                    caption: 'Acknowledge',
                    cellTemplate: function (container, options) {
                        if (options.data.acknowledgementUrl) {
                            $('<a href="' + options.data.acknowledgementUrl + '" download>' + options.data.acknowledgementFileName + '</a>').appendTo(container);
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
                    }
                }],
                onToolbarPreparing: function (e) {
                    var dataGrid = e.component;

                    e.toolbarOptions.items.unshift(
                        // {
                        //     location: "before",
                        //     widget: "dxSelectBox",
                        //     options: {
                        //         width: 200,
                        //         items: [{
                        //             value: "all",
                        //             text: "All"
                        //         }, {
                        //             value: "latest",
                        //             text: "Latest"
                        //         }],
                        //         displayExpr: "text",
                        //         valueExpr: "value",
                        //         placeholder: 'Download FVUs',
                        //         onValueChanged: function(e) {

                        //         }
                        //     }
                        // }, 
                        {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                hint: "Download",
                                icon: "download",
                                text: 'Download Latest FVUs',
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
                                hint: "Collapse All",
                                icon: "chevrondown",
                                text: "Collapse All",
                                onClick: function (e) {
                                    var expanding = e.component.option("icon") === "chevronnext";
                                    dataGrid.option("grouping.autoExpandAll", expanding);
                                    e.component.option({
                                        icon: expanding ? "chevrondown" : "chevronnext",
                                        hint: expanding ? "Collapse All" : "Expand All",
                                        text: expanding ? "Collapse All" : "Expand All"
                                    });
                                }
                            }
                        });
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

                }

            };

            vm.tdsRequestForm = {
                onInitialized: function (e) {
                    formInstance = e.component;
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
                                        form27AInstance = e.component;
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
                    form27AInstance.option('disabled', true);
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

            var value = form27AInstance.option('value');
            var reader = new FileReader();

            if(value.length === 0) {
                form27AInstance.option('disabled', false);
                form27AInstance.reset();
                return;   
            }

            reader.onload = function (e) {
                /* read workbook */
                var bstr = e.target.result;
                var wb = XLSX.read(bstr, { type: 'binary' });

                /* grab first sheet */
                var wsname = wb.SheetNames[0];
                var ws = wb.Sheets[wsname];

                /* grab first row and generate column headers */
                var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
                var cols = [];
                for (var i = 0; i < aoa[0].length; ++i) cols[i] = { field: aoa[0][i] };

                /* generate rest of the data */
                var data = [];

                for (var r = 1; r < aoa.length; ++r) {
                    data[r - 1] = {};
                    for (i = 0; i < aoa[r].length; ++i) {
                        if (aoa[r][i] == null) continue;
                        data[r - 1][aoa[0][i]] = aoa[r][i]
                    }
                }

                var existingBarcodes = [];

                for (var i = 0; i < data.length; i++) {
                    var obj = {
                        barcode: data[i]['Barcode Value'],
                        token: data[i]['Token Number'],
                        rdate: data[i]['Receipt Date'],
                        deductor: data[i]['Deductor/Collector Name'],
                        finYear: data[i]['Financial Year'],
                        fees: parseInt(data[i]['Fees Charged']),
                        formNo: data[i]['Form No.'],
                        origTokenNo: data[i]['Original Token No.'],
                        tan: data[i]['TAN'],
                        userId: data[i]['User Id'],
                        corrections: data[i]['Regular/ Correction'],
                        qtr: data[i]['Quarter'],
                        acknowledged: true

                    };


                    var ref = rootRef.child('admin-tin-requests').child('' + obj['barcode']);
                    var index = msUtils.getIndexByArray(vm.gridData, 'barcode', obj['barcode']);
                    if (index > -1 && !vm.gridData[index].acknowledged) {
                        ref.on('value', function (data) {
                            var data = data.val();
                            var ref = rootRef.child('tenants').child(data.tenantId);

                            rootRef.child('admin-tin-requests/' + obj['barcode']).update(obj);
                            if (data.assignedTo) {
                                rootRef.child('employee-tin-requests/' + data.assignedTo + '/' + obj['barcode']).update(obj);
                            }
                            rootRef.child('tin-requests/' + data.requestId + '/' + obj['barcode']).update(obj);

                            Object.assign(obj, data);

                            obj.requestId = data.requestId;
                            obj.tenantId = data.tenantId;

                            obj.date = new Date();
                            obj.date = obj.date.toString();

                            rootRef.child('tin-requests-token/' + obj.token).update(obj);
                        });
                    } else {
                        existingBarcodes.push(obj['barcode']);
                    }

                }
                var positionTop = 0,
                    increment = 65;
                for (var i = 0; i < existingBarcodes.length; i++) {
                    $mdToast.show({
                        template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>request for barcode ' + existingBarcodes[i] + ' not available or acknowledgement already generated.</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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

                form27AInstance.option('disabled', false);
                form27AInstance.reset();
            };

            reader.readAsBinaryString(value[0]);
        }

        function saveAckRequest() {
            var acknowledgements = ackFileFormInstance.option('value');
            var tokens = [],
                invalidTokens = [],
                positionTop = 0,
                positionLeft= 0,
                increment = 65;

            if(acknowledgements.length === 0) {
                ackFileFormInstance.option('disabled', false);
                ackFileFormInstance.reset();
                return;   
            }
            acknowledgements.map(function (acknowledgement) {
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
                    ref.on('value', function (data) {
                        var data = data.val();
                        if (!data.ackAttached) {
                            $firebaseStorage(acknowledgementRef).$put(acknowledgement, metaData).$complete(function (snapshot) {
                                var obj = { acknowledgementFileName: acknowledgement.name, acknowledgementUrl: snapshot.downloadURL, ackAttached: true, status: 'acknowledged' };
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
                                    if (tenant.creditBalance >= data.fees || tenant.paymentType == 'postpaid') {
                                        rootRef.child('tenant-tin-requests-token/' + data.tenantId + '/' + acknowledgementNo).update(Object.assign(data, obj));
                                        rootRef.child('tenant-tin-requests/' + data.tenantId + '/' + data['barcode']).update(Object.assign(data, obj));
                                        rootRef.child('tenants/' + data.tenantId).update({ creditBalance: (tenant.creditBalance ? tenant.creditBalance : 0) - parseInt(data.fees) });
                                    } else {
                                        rootRef.child('tenant-pending-tin-requests-token/' + data.tenantId + '/' + acknowledgementNo).update(Object.assign(data, obj));
                                        rootRef.child('tenant-tin-requests/' + data.tenantId + '/' + data['barcode']).update({status: 'low_credit', remarks: 'Credit Balance Low! Please Recharge '});
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
    }
})();