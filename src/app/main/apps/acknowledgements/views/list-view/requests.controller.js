(function () {
    'use strict';

    angular
        .module('app.acknowledgements')
        .controller('AcknowledgementsController', AcknowledgementsController)
        .controller('ToastController', ToastController);

    /** @ngInject */
    function AcknowledgementsController($state, $firebaseArray, $firebaseObject, $scope, $compile, $mdToast, $mdDialog, $q, $document, $firebaseStorage, firebaseUtils, authService, auth, msUtils, dxUtils, acknowledgementService) {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            form27AInstance,
            fvuInstance,
            formInstance,
            gridInstance;

        // Data
        vm.btnDisabled = true;
        // Methods
        init();
        //////////


        function init() {
            //vm.acknowledgementGridOptions = acknowledgementService.gridOptions('vm.acknowledgements');
            // acknowledgementService.fetchAcknowledgementList().then(function (data) {
            //     vm.gridData = data;
            // });
            var ref = rootRef.child('tenant-tin-requests-token').child(tenantId);
            vm.gridData = $firebaseArray(ref);

        }

        vm.gridOptions = dxUtils.createGrid();

        vm.acknowledgementGridOptions = {
            bindingOptions: {
                dataSource: 'vm.gridData'
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
            // {
            //     dataField: 'acknowledgementId',
            //     caption: "Acknowledgement No"
            // }, 
            {
                dataField: 'barcode',
                caption: 'Bar Code',
                dataType: 'string',
                validationRules: [{
                    type: 'required',
                    message: 'Barcode is required'
                }]
            }, {
                dataField: 'token',
                caption: 'Token Number'

            }, {
                dataField: 'rdate',
                caption: 'R Date'
            }, {
                caption: 'Deductor/Collector Name',
                dataField: 'deductor'
            }, {
                dataField: 'fees',
                caption: 'Fees'
            }, {
                dataField: 'extra',
                caption: 'Extra'
            }, {
                dataField: 'discount',
                caption: 'Discount'
            }, {
                dataField: 'attachment27a',
                caption: 'Attachment 27A',
                cellTemplate: function (container, options) {
                    if (options.data.form27AUrl) {
                        $('<a href="' + options.data.form27AUrl + '" download>Download 27A</a>').appendTo(container);
                    } else {
                        $compile($('<a class="md-button md-raised md-accent" ng-click="vm.uploadForm27A('+options.data.barcode+')">Upload Form 27A</a>'))($scope).appendTo(container);
                        //$compile($('<div dx-file-uploader="vm.form27AUploader(' + options.data.barcode + ')"></a>'))($scope).appendTo(container);
                    }
                }
            }, {
                dataField: 'attachmentfvu',
                caption: 'Attachment FVU',
                cellTemplate: function (container, options) {
                    if (options.data.fvuFileUrl) {
                        $('<a href="' + options.data.fvuFileUrl + '" download>Download FVU</a>').appendTo(container);
                    } else {
                        $compile($('<a class="md-button md-raised md-accent" ng-click="vm.uploadForm27A(' + options.data.barcode + ')">Upload FVU</a>'))($scope).appendTo(container);
                    }
                }
            }, {
                dataField: 'acknowledgementUrl',
                caption: 'Acknowledge',
                cellTemplate: function (container, options) {
                    if (options.data.acknowledgementUrl) {
                        $('<a href="' + options.data.acknowledgementUrl + '" download>Download Acknowledgement</a>').appendTo(container);
                    }
                }
            }, {
                dataField: 'remarks',
                caption: 'Remarks'
            }, {
                dataField: 'status',
                caption: 'Status'
            }, {
                caption: 'Action'
            }],
            export: {
                enabled: true,
                fileName: 'Acknowledgements',
                allowExportSelectedData: true
            },
            onRowPrepared: function (info) {
                if (info.rowType == 'data' && info.data.valid == false)
                    info.rowElement.addClass("md-red-50-bg");
            },
            onContentReady: function(e) {
                gridInstance = e.component;
            }

        };

        angular.extend(vm.gridOptions, vm.acknowledgementGridOptions);

        vm.form27AUploader = function (barcode) {
            var index = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode),
                acknowledgement = vm.gridData[index];
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
                            var storageRef = firebase.storage().ref("tenant-tin-remaining-uploads/" + acknowledgement.acknowledgementId + "/form27A/" + form27A.name),

                                metaData = {
                                    customMetadata: {
                                        'fileType': form27A.type,
                                        'fileName': form27A.name,
                                        'fileSize': form27A.size,
                                        'acknowledgementNo': acknowledgement.acknowledgementId,
                                        'barcode': acknowledgement.barcode,
                                        'key': acknowledgement.$id
                                    }
                                };

                            $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {

                                var ref = rootRef.child('tenant-tin-remaining-uploads').child(acknowledgement.$id);
                                return resolve(firebaseUtils.updateData(ref, { downloadURL: snapshot.downloadURL, acknowledgementId: acknowledgement.acknowledgementId, barcode: acknowledgement.barcode }));
                            });
                        });
                    });
                }
            }
        };

        vm.uploadForm27A = function uploadForm27A(barcode) {
            var index = msUtils.getIndexByArray(vm.gridData, 'barcode', barcode),
                acknowledgement = vm.gridData[index];

            $mdDialog.show({
                controller: 'TinAcknowledgementDialogController',
                templateUrl: 'app/main/apps/acknowledgements/views/TinAcknowledgementDialog/tin-acknowledgement-dialog.html',
                parent: angular.element(document.body),
                controllerAs: 'vm',
                clickOutsideToClose: true,
                fullscreen: true, // Only for -xs, -sm breakpoints.,
                locals: { acknowledgement: acknowledgement },
                bindToController: true
            })
                .then(function (answer) {
                    vm.acknowledgementNo = acknowledgement.acknowledgementId;
                    vm.showAdditonalFileProgressBar = true;
                    gridInstance.refresh();
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
                if (vm.acknowledgementNo) {
                    var ref = rootRef.child('tenant-tin-acknowledgements').child(vm.acknowledgementNo);
                    firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                        vm.showProgressBar = false;
                        vm.showAlertMessage = true;
                        if (data.invalidReq === true) {
                            vm.invalidAcknowledgement = true;
                        } else {
                            vm.invalidAcknowledgement = false;
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
                return  "Uploading File:" + parseInt(value * 100) + "%";
            },
            onComplete: function (e) {
                vm.btnDisabled = false;
                e.element.addClass("complete");
                form27AInstance.option('disabled', false);
                fvuInstance.option('disabled', false);
                form27AInstance.reset();
                fvuInstance.reset();
                if (vm.acknowledgementNo) {
                    var ref = rootRef.child('file-upload-progress').child(vm.acknowledgementNo);
                    firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                        vm.showProgressBar = false;
                        vm.showAlertMessage = true;
                        if (data.invalidReq === true) {
                            vm.invalidAcknowledgement = true;
                        } else {
                            vm.invalidAcknowledgement = false;
                        }
                    });
                }
            }
        };

        /**
         * Save form data
         * @returns {Object} Acknowledgement Form data
         */
        function saveAcknowledgement(acknowledgementObj) {
            vm.progressStatus = 'Creating Tin Acknowledgement';
            vm.showProgressBar = true;
            var ref = rootRef.child('tenant-tin-acknowledgements');
            if (!acknowledgementObj) {
                acknowledgementObj = {};
            }
            if (!acknowledgementObj.date) {
                acknowledgementObj.date = new Date();
            }
            acknowledgementObj.date = acknowledgementObj.date.toString();
            acknowledgementObj.user = auth.$getAuth().uid;
            acknowledgementObj.tenantId = tenantId;
            firebaseUtils.addData(ref, acknowledgementObj).then(function (key) {

                vm.acknowledgementNo = key;
                submitForm(key);
            });
        }


        //////////
        function submitForm(key) {
            var form27As = form27AInstance.option('value');
            var tinacknowledgements = {};
            vm.showAlertMessage = false;
            form27AInstance.option('disabled', true);
            fvuInstance.option('disabled', true);
            vm.progressStatus = 'Uploading Form27As';
            vm.progressBarValue = 20;
            var promises = form27As.map(function (form27A) {
                return new Promise(function (resolve, reject) {
                    var storageRef = firebase.storage().ref("tenant-tin-acknowledgements/" + key + "/form27A/" + form27A.name),

                        metaData = {
                            customMetadata: {
                                'fileType': form27A.type,
                                'fileName': form27A.name,
                                'fileSize': form27A.size,
                                'acknowledgementNo': key,
                                'tenantId': tenantId
                            }
                        };

                    $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {
                        //Step 2: Read the file using file reader
                        //pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';
                        var fileReader = new FileReader()
                        fileReader.onload = function() {

                            //Step 4:turn array buffer into typed array
                            var typedarray = new Uint8Array(this.result);

                            //Step 5:PDFJS should be able to read this
                            pdfjsLib.getDocument(typedarray).then(function(pdf) {
                                // do stuff
                                pdf.getPage(1).then(function(page) {
                                    page.getTextContent().then(function(text) {
                                        var barcode = text.items[3].str.trim();   
                                        var acknowledgementObj = { 'barcode': barcode, 'form27AUrl': snapshot.downloadURL, 'acknowledgementId': key, 'tenantId': tenantId, 'status': 0 };

                                        if (tinacknowledgements.hasOwnProperty(barcode)) {
                                            tinacknowledgements[barcode].form27AUrl = snapshot.downloadURL;
                                        } else {
                                            tinacknowledgements[barcode] = acknowledgementObj;
                                        }
                                        return resolve(tinacknowledgements)   
                                    });
                                });
                            });


                        };
                        //Step 3:Read the file as ArrayBuffer
                        fileReader.readAsArrayBuffer(form27A);

                    });
                });
            });

            Promise.all(promises).then(function () {
                submitFVUs(key, tinacknowledgements);
            });
            //console.log(fvusInstance.option('value'));
        }

        /**
         * Upload FVUs
         * @param {*} key 
         */
        function submitFVUs(key, tinacknowledgements) {
            var fvus = fvuInstance.option('value');
            vm.progressStatus = 'Uploading FVUs';
            vm.progressBarValue = 40;

            var promises = fvus.map(function (fvu) {
                return new Promise(function (resolve, reject) {
                    var fvuRef = firebase.storage().ref("tenant-tin-acknowledgements/" + key + "/fvus/" + fvu.name),
                        metaData = {
                            customMetadata: {
                                'fileType': fvu.type,
                                'fileName': fvu.name,
                                'fileSize': fvu.size,
                                'acknowledgementNo': key,
                                'tenantId': tenantId
                            }
                        };

                    $firebaseStorage(fvuRef).$put(fvu, metaData).$complete(function (snapshot) {
                        //Step 3:Read the file as ArrayBuffer
                        
                            var reader = new FileReader();
    
                            reader.addEventListener('load', function (e) {
                                var barcode = e.target.result.split('\n')[6].split('^');
                                //fs.writeFile('./fvucontent.json', barcode[barcode.length - 1]);
                                barcode = barcode[barcode.length - 1].trim();
                                // if(typeof barcode === 'number') {
                                //     barcode = barcode[barcode.length - 1].trim();
                                // } else {
                                //     barcode = e.target.result.split('\n')[7].split('^');
                                //     barcode = barcode[barcode.length - 1].trim();
                                // }
                                
                                var acknowledgementObj = { 'barcode': barcode, 'fvuFileUrl': snapshot.downloadURL, 'acknowledgementId': key, 'tenantId': tenantId, 'status': 0 };

                                if (tinacknowledgements.hasOwnProperty(barcode)) {
                                    tinacknowledgements[barcode].fvuFileUrl = snapshot.downloadURL;
                                } else {
                                    tinacknowledgements[barcode] = acknowledgementObj;
                                }
                                return resolve(tinacknowledgements);
                            });
                            
                            reader.readAsBinaryString(fvu);
                                            
                    });
                });
            });

            Promise.all(promises).then(function () {

                if (promises.length === fvus.length) {
                    Promise.all(promises).then(function () {
                        // var ref = rootRef.child('tenant-upload-acknowledgements');
                        // var acknowledgementObj = {};
                        // if (!acknowledgementObj.date) {
                        //     acknowledgementObj.date = new Date();
                        // }
                        // acknowledgementObj.date = acknowledgementObj.date.toString();
                        // acknowledgementObj.user = auth.$getAuth().uid;
                        // acknowledgementObj.tenantId = tenantId;
                        // acknowledgementObj.acknowledgementId = key;
                        // acknowledgementObj.progressStatus = 1;
                        // //vm.btnDisabled = false;

                        // vm.progressStatus = 'Documents Scanning';
                        // vm.progressBarValue = 50;
                        // firebaseUtils.addData(ref, acknowledgementObj).then(function (key) {
                        // });

                        var invalidReq = false,
                            existingBarcodes = [],
                             positionTop = 0,
                            increment = 65;
                        for (var acknowledgement in tinacknowledgements) {
                            var acknowledgementObj = tinacknowledgements[acknowledgement];

                            if (!acknowledgementObj.fvuFileUrl || !acknowledgementObj.form27AUrl) {
                                invalidReq = true;
                                acknowledgementObj.valid = false;
                            } else {
                                acknowledgementObj.valid = true;
                            }

                            if (!acknowledgementObj.date) {
                                acknowledgementObj.date = new Date();
                                acknowledgementObj.date = acknowledgementObj.date.toString();
                            }
                            var barcodeAlreadyExist = msUtils.getIndexByArray(vm.gridData, 'barcode', acknowledgement);

                            if(barcodeAlreadyExist > -1) {
                                existingBarcodes.push(acknowledgement);
                               
                            } else {
                                rootRef.child('tenant-tin-acknowledgements').child(acknowledgementObj.acknowledgementId).push(acknowledgementObj);
                                rootRef.child('admin-tin-acknowledgements').child(''+ acknowledgement).update(acknowledgementObj);
                            }

                        }

                        if (invalidReq) {
                            rootRef.child('tenant-tin-acknowledgements').child(key).update({ 'invalidReq': true });
                        }

                        for(var i=0; i<existingBarcodes.length; i++) {
                            $mdToast.show({
                                template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Acknowledgement for barcode ' + existingBarcodes[i] + ' already exist</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                                hideDelay: 7000,
                                controller: 'ToastController',
                                position : 'top right',
                                parent   : '#content',
                                locals: {
                                    cssStyle: {
                                        'top': positionTop + 'px'
                                      }
                                }
                            }).then(function() {
                                positionTop += increment;
                            });
                            positionTop += increment;
                        }
                        form27AInstance.option('disabled', false);
                        fvuInstance.option('disabled', false);
                        form27AInstance.reset();
                        fvuInstance.reset();
                    });
                }
            });

        }
    }

    function ToastController($scope, $mdToast, cssStyle) {
            $scope.cssStyle = cssStyle;
            var isDlgOpen = true;
            $scope.closeToast = function() {
                if (!isDlgOpen) return;
        
                $mdToast
                  .hide()
                  .then(function() {
                    isDlgOpen = false;
                  });
              };
    }
})();