(function () {
    'use strict';

    angular
        .module('app.requests')
        .controller('RequestsController', RequestsController)
        .controller('ToastController', ToastController);

    /** @ngInject */
    function RequestsController($state, $firebaseArray, $firebaseObject, $rootScope, $scope, $compile, $mdToast, $mdDialog, $q, $document, $firebaseStorage, firebaseUtils, authService, auth, msUtils, dxUtils, requestService, settings) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            form27AInstance,
            fvuInstance,
            formInstance,
            gridInstance;

        // Data
        vm.btnDisabled = true;
        vm.multiRequest = true;

        var requestStatus = [{
            id: 1,
            name: 'Pending'
        }, {
            id: 0,
            name: 'Invalid'
        }, {
            id: 2,
            name: 'Uploaded'
        }, {
            id: 3,
            name: 'Low Credit Balance'
        }];


        vm.filters = {
            'all': 'All',
            'pending': 'Pending',
            'invalid': 'Invalid',
            'ack': 'Acknowledgement Uploaded',
            'paymentpending': 'Pending Payment'
        };

        vm.changeFilter = changeFilter;
        // Methods
        init();
        //////////


        function changeFilter(filter) {
            vm.currentFilter = filter;

            switch (filter) {
                case 'pending': {
                    gridInstance.filter(['status', '=', 1]);
                    break;
                }

                case 'invalid': {
                    gridInstance.filter(['status', '=', 0]);
                    break;
                }

                case 'all': {
                    if (gridInstance) {
                        gridInstance.clearFilter();
                    }
                    break;
                }

                case 'ack': {
                    gridInstance.filter(['ackAttached', '=', true]);
                    break;
                }

                case 'paymentpending': {
                    gridInstance.filter(['remarks', '=', 'Credit Balance Low! Please Recharge ']);
                    break;
                }

            }
        }


        function init() {
            //vm.requestGridOptions = requestService.gridOptions('vm.requests');
            // requestService.fetchRequestList().then(function (data) {
            //     vm.gridData = data;
            // });
            vm.changeFilter('all');
            var ref = rootRef.child('tenant-tin-requests').child(tenantId).orderByChild('status');
            vm.gridData = $firebaseArray(ref);

            // firebaseUtils.getItemByRef(progressRef).$bindTo($scope, 'additionalFileProgress');
            if (fvuInstance && form27AInstance) {
                if (fvuInstance.option('value') > 0 && form27AInstance.option('value') > 0) {
                    vm.btnDisabled = false;
                } else {
                    vm.btnDisabled = true;

                }
            }

            var tenantRef = rootRef.child('tenants').child(tenantId);
            $firebaseObject(tenantRef).$bindTo($scope, 'tenant');


        }

        $scope.$watch('tenant', function (newVal) {
            vm.creditBalance = 'Credit Balance: ' + newVal.creditBalance;
            $scope.buttonType = newVal.creditBalance < 0 ? 'danger' : 'success';

            if (newVal.requiredBalance > 0) {
                vm.debitBalance = newVal.requiredBalance || 0;
                vm.requiredBalance = newVal.requiredBalance - newVal.creditBalance;
                DevExpress.ui.dialog.alert('Low credit balance ! please recharge with minimum ' + vm.requiredBalance + ' to view all acknowledgements ', 'Balance Low !');
            } else {
                vm.debitBalance = 0;
                vm.requiredBalance = 0;
            }
        });

        vm.buttonOptions = {
            text: "Upload",
            type: "success",
            useSubmitBehavior: false,
            bindingOptions: {
                'disabled': 'vm.btnDisabled'
            },
            validationGroup: "customerData",
            onClick: function () {
                vm.btnDisabled = true;
                saveRequest();
                $scope.visiblePopup = false;
            }
        };

        vm.addTinRequests = {
            text: 'Add New Request',
            icon: "plus",
            type: 'default',
            onClick: function (e) {
                $mdDialog.show({
                    controller: 'AddRequestDialogController',
                    templateUrl: 'app/main/apps/requests/views/addNewRequestDialog/add-new-request-dialog.html',
                    parent: angular.element(document.body),
                    controllerAs: 'vm',
                    clickOutsideToClose: false,
                    fullscreen: true, // Only for -xs, -sm breakpoints.,
                    bindToController: true,
                    locals: { isAdmin: false, customers: {} }
                })
                    .then(function (answer) {

                    }, function () {
                        $scope.status = 'You cancelled the dialog.';
                    });
                //$scope.visiblePopup = true;
            }
        }

        vm.uploadPopupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '70%',
            height: 'auto',
            title: "Add Tin Requests",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            }
        };

        vm.radioFileUpload = {
            dataSource: [
                {
                    "text": "Multi-File Upload (Auto Scanner)",
                    "value": "multi"
                },
                {
                    "text": "Single File Upload (Manual Entry)",
                    "value": "single"
                }
            ],
            displayExpr: 'text',
            valueExpr: 'value',
            layout: 'horizontal',
            value: 'multi',
            onValueChanged: function (e) {
                if (e.value == 'multi') {
                    vm.multiRequest = true;
                } else {
                    vm.multiRequest = false;
                }
            }
        };


        vm.manualRequestForm = {

            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            items: [{
                itemType: "group",
                caption: "Add TIN Request",
                colCount: 3,

                items: [
                    {
                        dataField: 'barcode',
                        label: {
                            text: 'Barcode'
                        },
                        validationRules: [{
                            type: 'required',
                            message: 'Barcode is required'
                        }]
                    },
                    {
                        template: function (data, itemElement) {
                            itemElement.append($("<div>").dxFileUploader({
                                accept: 'application/pdf',
                                selectButtonText: "Select Form 27A",
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

                                    if (values.length > 0 && fvuInstance.option('value').length > 0) {
                                        vm.btnDisabled = false;
                                    } else {
                                        vm.btnDisabled = true;
                                    }
                                }
                            }));

                            itemElement.append('<div id="button" dx-button="buttonOptions"></div>');
                        }
                    }, {
                        template: function (data, itemElement) {
                            itemElement.append($("<div>").dxFileUploader({
                                accept: '*.fvu',
                                selectButtonText: "Select FVU",
                                multiple: false,
                                uploadMode: "useButtons",
                                onContentReady: function (e) {
                                    fvuInstance = e.component;
                                },
                                onValueChanged: function (e) {
                                    var values = e.component.option("values");
                                    $.each(values, function (index, value) {
                                        e.element.find(".dx-fileuploader-upload-button").hide();
                                    });
                                    e.element.find(".dx-fileuploader-upload-button").hide();
                                    if (values.length > 0 && form27AInstance.option('value').length > 0) {
                                        vm.btnDisabled = false;
                                    } else {
                                        vm.btnDisabled = true;
                                    }
                                }
                            }));
                        }
                    }, {
                        dataField: 'ref',
                        label: {
                            text: 'Reference'
                        },
                        editorType: 'dxTextBox'
                    }
                ]
            }]
        };

        vm.gridOptions = dxUtils.createGrid();

        vm.requestGridOptions = {
            bindingOptions: {
                dataSource: 'vm.gridData'
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
                    }, {
                        location: "before",
                        widget: "dxButton",
                        options: {
                            text: 'Select Uploaded Requests',
                            icon: "check",
                            onClick: function (e) {
                                var data = vm.gridData,
                                    count = 0,
                                    mergeObj = {},
                                    latestRecords,
                                    zipFilename;

                                latestRecords = vm.gridData.filter(function (request) {
                                    return request.status == 2;
                                });
                                gridInstance.selectRows(latestRecords);
                            }
                        }
                    }, {
                        location: "before",
                        widget: "dxButton",
                        options: {
                            type: 'success',
                            text: 'Download Selected Acknowledgements',
                            onClick: function (e) {
                                var latestRecords = gridInstance.getSelectedRowKeys().filter(function (record) {
                                    return record.status == 2;
                                }),
                                    zip = new JSZip(),
                                    count = 0,
                                    mergeObj = {},
                                    zipFilename;

                                zipFilename = msUtils.formatDate(new Date()) + "_ACKs.zip";

                                latestRecords.forEach(function (record) {
                                    var ackUrlUrl = record.acknowledgementUrl,
                                        fileName = record.acknowledgementFileName;

                                    //var acknowledgementRef = firebase.storage().ref("tenant-tin-requests/" + latestRecords[i].rquestId + "/fvus/" + fvu.name)
                                    JSZipUtils.getBinaryContent(ackUrlUrl, function (err, data) {
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
                    });
            },
            editing: {
                allowUpdating: false,
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
                    }]
                }, {
                    dataField: 'refNo',
                    caption: 'Order Id #'
                },
                {
                    caption: 'Deductor/Collector Name',
                    dataField: 'deductor'
                },
                {
                    dataField: 'barcode',
                    caption: 'Bar Code',
                    dataType: 'string',
                    validationRules: [{
                        type: 'required',
                        message: 'Barcode is required'
                    }]
                },
                {
                    dataField: 'attachment27a',
                    caption: '27A',
                    cellTemplate: function (container, options) {
                        if (options.data.form27AUrl) {
                            $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.form27AUrl + '" download target="_blank"><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                        } else {
                            $compile($('<a ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Wrong Form27A! Click to Upload again</a>'))($scope).appendTo(container);
                            //$compile($('<div dx-file-uploader="vm.form27AUploader(' + options.data.barcode + ')"></a>'))($scope).appendTo(container);
                        }
                    }
                }, {
                    dataField: 'attachmentfvu',
                    caption: 'FVU',
                    cellTemplate: function (container, options) {
                        if (options.data.fvuFileUrl) {
                            $compile($('<a class="md-button md-raised md-normal" href="' + options.data.fvuFileUrl + '" download target="_blank"><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                        } else {
                            $compile($('<a ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Wrong FVU! Click to Upload again</a>'))($scope).appendTo(container);
                        }
                    }
                },
                {
                    dataField: 'acknowledgementUrl',
                    caption: 'Acknowledge',
                    cellTemplate: function (container, options) {
                        if (options.data.acknowledgementUrl) {
                            $compile($('<a class="md-button md-raised md-normal"  href="' + options.data.acknowledgementUrl + '" download target="_blank"><md-icon md-font-icon="icon-download s24"></md-icon></a>'))($scope).appendTo(container);
                        }
                    }
                },
                {
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
                },
                {
                    dataField: 'token',
                    caption: 'Token Number'

                },
                {
                    dataField: 'rno',
                    caption: 'R No',
                    allowEditing: false
                }, {
                    dataField: 'rdate',
                    caption: 'R Date',
                    allowEditing: false
                },  {
                    dataField: 'module',
                    caption: 'Module',
                    allowEditing: false
                },  {
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
                    caption: 'Fees'
                }, {
                    dataField: 'extra',
                    caption: 'Extra'
                }, {
                    dataField: 'discount',
                    caption: 'Discount',
                    alignment: 'right',
                    allowEditing: false,
                    visible: false,
                    calculateCellValue: function (data) {
                        return data.discount ? data.discount + '%' : '';
                    }
                },
                {
                    dataField: 'totalCost',
                    caption: 'Total Cost',
                    dataType: 'number',
                    calculateCellValue: function (data) {
                        if (data.fees) {
                            var discount = data.discount ? data.discount : 0;
                            return data.fees - (data.fees * discount * 0.01) + data.extra;
                        } else {
                            return '';
                        }
                    }
                },
                {
                    dataField: 'remarks',
                    caption: 'Remarks'
                }, {
                    dataField: 'status',
                    caption: 'Status',
                    lookup: {
                        dataSource: requestStatus,
                        displayExpr: "name",
                        valueExpr: "id"
                    },
                    sortOrder: "asc"
                },
                {
                    dataField: 'ref',
                    caption: 'Reference'
                }],
            export: {
                enabled: true,
                fileName: 'Requests',
                allowExportSelectedData: true
            },
            onRowPrepared: function (info) {
                if (info.rowType == 'data' && info.data.valid == false) {
                    info.rowElement.addClass("md-red-50-bg");
                }
                if (info.rowType == 'data' && info.data.ackAttached == true) {
                    info.rowElement.addClass("md-green-50-bg");
                }

                if (info.rowType == 'data' && info.data.discount) {
                    if(gridInstance) {
                        gridInstance.columnOption('discount', 'visible', true);
                    }
                }

            },
            summary: {
                totalItems: [{
                    column: 'barcode',
                    summaryType: 'count'
                }, {
                    column: "totalCost",
                    summaryType: "sum"
                }]

            },

            onCellPrepared: function (e) {
                if (e.rowType == 'data' && e.row.data.valid === true) {
                    e.cellElement.find(".dx-link-delete").remove();
                    e.cellElement.find(".dx-link-edit").remove();
                }

            },
            onRowRemoving: function (e) {
                var component = e.component;

                var ref = rootRef.child('tenant-tin-requests').child(tenantId).child(e.key.$id);
                firebaseUtils.deleteData(ref);
            },
            onContentReady: function (e) {
                gridInstance = e.component;
            }

        };

        angular.extend(vm.gridOptions, vm.requestGridOptions);

        vm.form27AUploader = function (barcode) {
            var index = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode),
                request = vm.gridData[index];
            return {
                accept: 'application/pdf',
                selectButtonText: "Upload",
                multiple: 'false',
                labelText: '',
                uploadMode: 'useForm',
                showFileList: false,
                onContentReady: function (e) {
                    form27AInstance = e.component;
                },
                onValueChanged: function (e) {
                    var form27As = e.component.option("values");;


                    var promises = form27As.map(function (form27A) {
                        return new Promise(function (resolve, reject) {
                            var storageRef = firebase.storage().ref("tenant-tin-remaining-uploads/" + request.requestId + "/form27A/" + form27A.name),

                                metaData = {
                                    customMetadata: {
                                        'fileType': form27A.type,
                                        'fileName': form27A.name,
                                        'fileSize': form27A.size,
                                        'requestNo': request.requestId,
                                        'barcode': request.barcode,
                                        'key': request.$id
                                    }
                                };

                            $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {

                                var ref = rootRef.child('tenant-tin-remaining-uploads').child(request.$id);
                                return resolve(firebaseUtils.updateData(ref, { downloadURL: snapshot.downloadURL, requestId: request.requestId, barcode: request.barcode }));
                            });
                        });
                    });
                }
            }
        };

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

        vm.progressBarOptions = {
            min: 0,
            width: "100%",
            bindingOptions: {
                value: "vm.progressBarValue",
                visible: "vm.showProgressBar"
            },
            statusFormat: function (value) {
                return "Uploading File:" + parseInt(value * 100) + "%";
            },
            onComplete: function (e) {
                vm.btnDisabled = false;
                e.element.addClass("complete");
                form27AInstance.option('disabled', false);
                fvuInstance.option('disabled', false);
                form27AInstance.reset();
                fvuInstance.reset();
                if (vm.requestNo) {
                    var ref = rootRef.child('tenant-tin-requests').child(vm.requestNo);
                    firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                        vm.showProgressBar = false;
                        vm.showAlertMessage = true;
                        if (data.invalidReq === true) {
                            vm.invalidRequest = true;
                        } else {
                            vm.invalidRequest = false;
                        }
                    });
                }
            }
        };

        vm.additonalFileProgressBarOptions = {
            min: 0,
            width: "100%",
            bindingOptions: {
                value: "vm.additonalFileProgressBarValue",
                visible: "vm.showAdditonalFileProgressBar"
            },
            statusFormat: function (value) {
                return "Uploading File:" + parseInt(value * 100) + "%";
            },
            onComplete: function (e) {
                vm.btnDisabled = false;
                e.element.addClass("complete");
                form27AInstance.option('disabled', false);
                fvuInstance.option('disabled', false);
                form27AInstance.reset();
                fvuInstance.reset();
                if (vm.requestNo) {
                    var ref = rootRef.child('file-upload-progress').child(vm.requestNo);
                    firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                        vm.showProgressBar = false;
                        vm.showAlertMessage = true;
                        if (data.invalidReq === true) {
                            vm.invalidRequest = true;
                        } else {
                            vm.invalidRequest = false;
                        }
                    });
                }
            }
        };
    }


    function ToastController($scope, $mdToast, cssStyle) {
        $scope.cssStyle = cssStyle;
        var isDlgOpen = true;
        $scope.closeToast = function () {
            if (!isDlgOpen) return;

            $mdToast
                .hide()
                .then(function () {
                    isDlgOpen = false;
                });
        };
    }

})();