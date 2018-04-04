(function () {
    'use strict';

    angular
        .module('app.requests')
        .controller('RequestsController', RequestsController)
        .controller('ToastController', ToastController);

    /** @ngInject */
    function RequestsController($state, $firebaseArray, $firebaseObject, $rootScope, $scope, $compile, $mdToast, $mdDialog, $q, $document, $firebaseStorage, firebaseUtils, authService, auth, msUtils, dxUtils, requestService) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            form27AInstance,
            fvuInstance,
            formInstance,
            gridInstance;

        // Data
        vm.btnDisabled = true;

        var requestStatus = [{
            id: 'pending',
            name: 'Pending'
        }, {
            id: 'invalid',
            name: 'Invalid'
        }, {
            id: 'acknowledged',
            name: 'Acknowledged'
        }, {
            id: 'low_credit',
            name: 'Low Credit Balance'
        }];
        // Methods
        init();
        //////////


        function init() {
            //vm.requestGridOptions = requestService.gridOptions('vm.requests');
            // requestService.fetchRequestList().then(function (data) {
            //     vm.gridData = data;
            // });
            var ref = rootRef.child('tenant-tin-requests').child(tenantId);
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

        $scope.$watch('tenant', function(newVal) {
            vm.creditBalance = 'Credit Balance: ' + newVal.creditBalance;
            $scope.buttonType = newVal.creditBalance < 0 ? 'danger' : 'success';
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
            }
        };

        vm.requestForm = {

            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            items: [{
                itemType: "group",
                caption: "Add TIN Request",
                colCount: 2,

                items: [
                    {
                        template: function (data, itemElement) {
                            itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                accept: 'application/pdf',
                                selectButtonText: "Select Form 27As",
                                multiple: 'true',
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
                            itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                accept: '*.fvu',
                                selectButtonText: "Select FVUs",
                                multiple: true,
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
                    });
            },
            editing: {
                allowUpdating: false,
                allowDeleting: true
            },
            columns: [{
                dataField: 'date',
                caption: 'Date',
                dataType: 'date',
                validationRules: [{
                    type: 'required',
                    message: 'Date is required'
                }]
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
                dataField: 'token',
                caption: 'Token Number'

            },
            {
                dataField: 'attachment27a',
                caption: 'Attachment 27A',
                cellTemplate: function (container, options) {
                    if (options.data.form27AUrl) {
                        $('<a href="' + options.data.form27AUrl + '" download>' + options.data.form27AFileName +'</a>').appendTo(container);
                    } else {
                        $compile($('<a class="md-button md-raised md-accent" ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Upload Form 27A</a>'))($scope).appendTo(container);
                        //$compile($('<div dx-file-uploader="vm.form27AUploader(' + options.data.barcode + ')"></a>'))($scope).appendTo(container);
                    }
                }
            }, {
                dataField: 'attachmentfvu',
                caption: 'Attachment FVU',
                cellTemplate: function (container, options) {
                    if (options.data.fvuFileUrl) {
                        $('<a href="' + options.data.fvuFileUrl + '" download> ' + options.data.fvuFileName +' </a>').appendTo(container);
                    } else {
                        $compile($('<a class="md-button md-raised md-accent" ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Upload FVU</a>'))($scope).appendTo(container);
                    }
                }
            },
            {
                dataField: 'acknowledgementUrl',
                caption: 'Acknowledge',
                cellTemplate: function (container, options) {
                    if (options.data.acknowledgementUrl) {
                        $('<a href="' + options.data.acknowledgementUrl + '" download>' + options.data.acknowledgementFileName + '</a>').appendTo(container);
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
                }
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

        /**
         * Save form data
         * @returns {Object} Request Form data
         */
        function saveRequest(requestObj) {
            vm.progressStatus = 'Creating Tin Request';
            vm.showProgressBar = true;
            var ref = rootRef.child('tin-requests');
            if (!requestObj) {
                requestObj = {};
            }
            if (!requestObj.date) {
                requestObj.date = new Date();
            }
            requestObj.date = requestObj.date.toString();
            requestObj.user = auth.$getAuth().uid;
            requestObj.tenantId = tenantId;
            firebaseUtils.addData(ref, requestObj).then(function (key) {

                vm.requestNo = key;
                submitForm(requestObj, key);
            });
        }


        //////////
        function submitForm(requestObj, key) {
            $rootScope.loadingProgress = true;
            var form27As = form27AInstance.option('value');
            var tinrequests = {},
                existingBarcodes = [],
                invalidFiles = [];
            vm.showAlertMessage = false;
            form27AInstance.option('disabled', true);
            fvuInstance.option('disabled', true);
            vm.progressStatus = 'Uploading Form27As';
            vm.progressBarValue = 20;
            var promises = form27As.map(function (form27A) {
                return new Promise(function (resolve, reject) {
                    var fileReader = new FileReader()
                    fileReader.onload = function () {

                        //Step 4:turn array buffer into typed array
                        var typedarray = new Uint8Array(this.result);

                        //Step 5:PDFJS should be able to read this
                        pdfjsLib.getDocument(typedarray).then(function (pdf) {
                            // do stuff
                            pdf.getPage(1).then(function (page) {
                                page.getTextContent().then(function (text) {
                                    if(!text || !text.items || !text.items[3]) {
                                        invalidFiles.push(form27A.name);
                                        return resolve({});
                                    }
                                    var barcode = text.items[3].str.trim();

                                    if(isNaN(Number(barcode))) {
                                        invalidFiles.push(form27A.name);
                                        return resolve({});
                                    } else if(barcode.length != 20){
                                        invalidFiles.push(form27A.name);
                                        return resolve({});
                                    }

                                    var storageRef = firebase.storage().ref("tenant-tin-requests/" + key + "/form27A/" + form27A.name),

                                        metaData = {
                                            customMetadata: {
                                                'fileType': form27A.type,
                                                'fileName': form27A.name,
                                                'fileSize': form27A.size,
                                                'requestNo': key,
                                                'tenantId': tenantId
                                            }
                                        };

                                    var barcodeAlreadyExist = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode);

                                    if (barcodeAlreadyExist > -1) {
                                        existingBarcodes.push(barcode);
                                        return resolve({});
                                    } else {
                                        $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {
                                            //Step 2: Read the file using file reader
                                            //pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';
                                            var requestObj = { 'form27AFileName': form27A.name, 'barcode': barcode, 'form27AUrl': snapshot.downloadURL, 'requestId': key, 'tenantId': tenantId, 'status': 'pending' };

                                            if (tinrequests.hasOwnProperty(barcode)) {
                                                tinrequests[barcode].form27AUrl = snapshot.downloadURL;
                                                tinrequests[barcode].form27AFileName = form27A.name;
                                            } else {
                                                tinrequests[barcode] = requestObj;
                                            }

                                            return resolve(tinrequests);
                                        });
                                    }
                                });
                            });
                        });
                    };
                    //Step 3:Read the file as ArrayBuffer
                    fileReader.readAsArrayBuffer(form27A);


                });
            });

            Promise.all(promises).then(function () {
                submitFVUs(tinrequests, existingBarcodes, invalidFiles, key);
            });
            //console.log(fvusInstance.option('value'));
        }

        /**
         * Upload FVUs
         * @param {*} key 
         */
        function submitFVUs(tinrequests, existingBarcodes, invalidFiles, key) {
            var fvus = fvuInstance.option('value');
            vm.progressStatus = 'Uploading FVUs';
            vm.progressBarValue = 40;

            var promises = fvus.map(function (fvu) {
                if (fvu.name.split('.').pop() !== 'fvu') {
                    invalidFiles.push(fvu.name);
                    return;
                }
                return new Promise(function (resolve, reject) {

                    var reader = new FileReader();

                    reader.addEventListener('load', function (e) {
                        var barcode = e.target.result.split('\n')[6].split('^');
                        //fs.writeFile('./fvucontent.json', barcode[barcode.length - 1]);
                        barcode = barcode[barcode.length - 1].trim();

                        
                        if(isNaN(Number(barcode))) {
                            invalidFiles.push(fvu.name);
                            return resolve({});
                        } else if(barcode.length != 20){
                            invalidFiles.push(fvu.name);
                            return resolve({});
                        }
                        // if(typeof barcode === 'number') {
                        //     barcode = barcode[barcode.length - 1].trim();
                        // } else {
                        //     barcode = e.target.result.split('\n')[7].split('^');
                        //     barcode = barcode[barcode.length - 1].trim();
                        // }

                        var fvuRef = firebase.storage().ref("tenant-tin-requests/" + key + "/fvus/" + fvu.name),
                            metaData = {
                                customMetadata: {
                                    'fileType': fvu.type,
                                    'fileName': fvu.name,
                                    'fileSize': fvu.size,
                                    'requestNo': key,
                                    'tenantId': tenantId
                                }
                            };

                        var barcodeAlreadyExist = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode);
                        

                        if (barcodeAlreadyExist > -1) {
                            existingBarcodes.push(barcode);
                            return resolve({});
                        } else {
                            $firebaseStorage(fvuRef).$put(fvu, metaData).$complete(function (snapshot) {
                                //Step 3:Read the file as ArrayBuffer

                                var requestObj = { 'fvuFileName': fvu.name, 'barcode' : barcode, 'fvuFileUrl': snapshot.downloadURL, 'requestId': key, 'tenantId': tenantId, 'status': 'pending' };

                                if (tinrequests.hasOwnProperty(barcode)) {
                                    tinrequests[barcode].fvuFileUrl = snapshot.downloadURL;
                                    tinrequests[barcode].fvuFileName = fvu.name;
                                } else {
                                    tinrequests[barcode] = requestObj;
                                }

                                return resolve(tinrequests);
                            });
                        }
                    });

                    reader.readAsBinaryString(fvu);


                });
            });


                Promise.all(promises).then(function () {

                    var invalidReq = false,
                        positionTop = 0,
                        increment = 65,
                        pendingCount = 0,
                        failureCount = 0;
                    for (var request in tinrequests) {
                        var requestObj = tinrequests[request];

                        if (!requestObj.fvuFileUrl || !requestObj.form27AUrl) {
                            invalidReq = true;
                            requestObj.valid = false;
                            requestObj.status = 'invalid';
                        } else {
                            requestObj.valid = true;
                        }

                        if (!requestObj.date) {
                            requestObj.date = new Date();
                            requestObj.date = requestObj.date.toString();
                        }


                        var barcodeAlreadyExist = msUtils.getIndexByArray(vm.gridData, 'barcode', request);
                        var mergeObj = {};
                        mergeObj['tenant-tin-requests/'+tenantId+'/'+ request] = requestObj;
                        if(requestObj.valid) {
                            requestObj.latest = true;
                            mergeObj['admin-tin-requests/'+ request] = requestObj;
                            mergeObj['tin-requests/'+key+'/'+request] = requestObj;  
                            pendingCount++;
                        } else {
                            failureCount++;
                        }                   
                        rootRef.update(mergeObj, function(data) {
                            
                        });
                    }

                    firebaseUtils.setBadges('new_requests', 'admin', pendingCount);
                    
                    for (var i = 0; i < existingBarcodes.length; i++) {
                        $mdToast.show({
                            template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Request for barcode ' + existingBarcodes[i] + ' already exist</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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

                    var positionLeft = 0;
                    for (var i = 0; i < invalidFiles.length; i++) {
                        $mdToast.show({
                            template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Invalid File ' + invalidFiles[i] + '</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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

                    form27AInstance.option('disabled', false);
                    fvuInstance.option('disabled', false);
                    $rootScope.loadingProgress = false;
                    form27AInstance.reset();
                    fvuInstance.reset();
                });

        }
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