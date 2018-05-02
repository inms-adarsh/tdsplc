(function () {
    'use strict';

    angular
        .module('app.requests')
        .factory('requestService', requestService);

    /** @ngInject */
    function requestService($rootScope, $firebaseArray, $mdDialog, $mdToast, $firebaseObject, $compile, $q, adminService, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance,
            fvuInstance,
            scope = $rootScope.$new(),
            settings = {};
        // Private variables

        adminService.getCurrentSettings().then(function (data) {
            settings = data;
        });

        var service = {
            gridOptions: gridOptions,
            updateRequest: updateRequest,
            fetchRequestList: fetchRequestList,
            requestForm: requestForm,
            saveRequest: saveRequest
        };

        return service;
        /**
         * Request Form
         */
        function requestForm() {
            var requestForm = {};
            return requestForm;
        }
        /**
         * Grid Options for request list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource, customers, beers) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchRequestList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (requestObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                requestObj.offers = data.offers;
                            }
                            saveRequest(requestObj);
                        },
                        update: function (key, requestObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                requestObj.offers = data.offers;
                            }
                            updateRequest(key, requestObj);
                        },
                        remove: function (key) {
                            deleteRequest(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'amountOnLiquor',
                            summaryType: 'sum'
                        }, {
                            column: 'amountOnBeer',
                            summaryType: 'sum'
                        }, {
                            column: 'amountOnFood',
                            summaryType: 'sum'
                        }, {
                            column: 'total',
                            summaryType: 'sum',
                            customizeText: function (data) {
                                return 'Total ' + data.value;
                            }
                        }]
                    },
                    editing: {
                        allowAdding: true,
                        allowUpdating: false,
                        allowDeleting: true,
                        mode: 'form',
                        form: requestForm(customers, beers)
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
                    //     dataField: 'requestId',
                    //     caption: "Request No"
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
                        caption: '27A',
                        cellTemplate: function (container, options) {
                            if (options.data.form27AUrl) {
                                $('<a href="' + options.data.form27AUrl + '" download>Download 27A</a>').appendTo(container);
                            } else {
                                $compile($('<a class="md-button md-raised md-accent" ng-click="uploadForm27A()">Upload Form 27A</a>'))(scope).appendTo(container);
                            }
                        }
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'FVU',
                        cellTemplate: function (container, options) {
                            if (options.data.fvuFileUrl) {
                                $('<a href="' + options.data.fvuFileUrl + '" download>Download FVU</a>').appendTo(container);
                            } else {
                                $('<a class="">Upload FVU</span>').appendTo(container);
                            }
                        }
                    }, {
                        dataField: 'ACK',
                        caption: 'Acknowledge'
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
                        fileName: 'Requests',
                        allowExportSelectedData: true
                    }

                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        }

        scope.fvuFileUploader = {
            'multiple': true
        };

        /**
         * Add New tin request
         */

        function saveRequest(formObj) {
            var ref = rootRef.child('tin-requests'),
                requestObj = {};
            if (!requestObj) {
                requestObj = {};
            }
            if (!requestObj.date) {
                requestObj.date = new Date();
            }
            requestObj.date = requestObj.date.toString();
            requestObj.user = auth.$getAuth().uid;
            requestObj.tenantId = formObj.tenantId;
            firebaseUtils.addData(ref, requestObj).then(function (key) {
                submitForm(requestObj, key, formObj);
            });
        }

        /**
         * Upload Files
         * @param {*} requestObj 
         * @param {*} key 
         * @param {*} formObj 
         */
        function submitForm(requestObj, key, formObj) {
            $rootScope.loadingProgress = true;
            var form27As = formObj.form27As;
            var tinrequests = {},
                existingBarcodes = [],
                invalidFiles = [];
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
                                    if (!text || !text.items || !text.items[3]) {
                                        invalidFiles.push(form27A.name);
                                        return resolve({});
                                    }
                                    var barcode = text.items[3].str.trim();

                                    if (isNaN(Number(barcode))) {
                                        invalidFiles.push(form27A.name);
                                        return resolve({});
                                    } else if (barcode.length != 20) {
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
                                                'tenantId': formObj.tenantId
                                            }
                                        };

                                    var barcodeAlreadyExist = rootRef.child('tenant-tin-requests').child(barcode);

                                    barcodeAlreadyExist.once('value', function (snapshot) {
                                        if (snapshot.val()) {
                                            existingBarcodes.push(barcode);
                                            return resolve({});
                                        } else {
                                            $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {
                                                //Step 2: Read the file using file reader
                                                //pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';
                                                var requestObj = { 'form27AFileName': form27A.name, 'barcode': barcode, 'form27AUrl': snapshot.downloadURL, 'requestId': key, 'tenantId': formObj.tenantId, 'status': 'pending' };

                                                if (tinrequests.hasOwnProperty(barcode)) {
                                                    tinrequests[barcode].form27AUrl = snapshot.downloadURL;
                                                    tinrequests[barcode].form27AFileName = form27A.name;
                                                } else {
                                                    tinrequests[barcode] = requestObj;
                                                }

                                                return resolve(tinrequests);
                                            });
                                        }
                                    })
                                });
                            });
                        });
                    };
                    //Step 3:Read the file as ArrayBuffer
                    fileReader.readAsArrayBuffer(form27A);


                });
            });

            Promise.all(promises).then(function () {
                submitFVUs(tinrequests, existingBarcodes, invalidFiles, key, formObj);
            });
            //console.log(fvusInstance.option('value'));
        }


        function submitFVUs(tinrequests, existingBarcodes, invalidFiles, key, formObj) {
            var fvus = formObj.fvus;

            var promises = fvus.map(function (fvu) {
                if (fvu.name.split('.').pop() !== 'fvu') {
                    invalidFiles.push(fvu.name);
                    return;
                }
                return new Promise(function (resolve, reject) {

                    var reader = new FileReader();

                    reader.addEventListener('load', function (e) {
                        if (!e.target.result || !e.target.result.split('\n') || !e.target.result.split('\n')[7]) {
                            invalidFiles.push(fvu.name);
                            return resolve({});
                        }
                        var barcode = e.target.result.split('\n')[7].split('^');

                        if (isNaN(Number(barcode))) {
                            barcode = e.target.result.split('\n')[6].split('^');
                        }
                        //fs.writeFile('./fvucontent.json', barcode[barcode.length - 1]);
                        barcode = barcode[barcode.length - 1].trim();


                        if (isNaN(Number(barcode))) {
                            invalidFiles.push(fvu.name);
                            return resolve({});
                        } else if (barcode.length != 20) {
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
                                    'tenantId': formObj.tenantId
                                }
                            };

                        var barcodeAlreadyExist = rootRef.child('tenant-tin-requests').child(barcode);

                        barcodeAlreadyExist.once('value', function (snapshot) {
                            if (snapshot.val()) {
                                existingBarcodes.push(barcode);
                                return resolve({});
                            } else {
                                $firebaseStorage(fvuRef).$put(fvu, metaData).$complete(function (snapshot) {
                                    //Step 3:Read the file as ArrayBuffer

                                    var requestObj = { 'fvuFileName': fvu.name, 'barcode': barcode, 'fvuFileUrl': snapshot.downloadURL, 'requestId': key, 'tenantId': formObj.tenantId, 'status': 'pending' };

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

                    var mergeObj = {};

                    requestObj.refNo = settings.requestIdPrefix + (new Date()).getTime();
                    requestObj.ref = formObj.ref || '';
                    mergeObj['tenant-tin-requests/' + formObj.tenantId + '/' + request] = requestObj;
                    if (requestObj.valid) {
                        requestObj.latest = true;
                        mergeObj['admin-tin-requests/' + request] = requestObj;
                        mergeObj['tin-requests/' + key + '/' + request] = requestObj;
                        pendingCount++;
                    } else {
                        failureCount++;
                    }
                    rootRef.update(mergeObj, function (data) {
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
                $rootScope.loadingProgress = false;
            });

        }
        /**
         * Fetch request list
         * @returns {Object} Request data
         */
        function fetchRequestList() {
            var ref = rootRef.child('admin-tin-requests').orderByChild('tenantId').equalTo(tenantId);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch request list
         * @returns {Object} Request data
         */
        function updateRequest(key, requestData) {
            var ref = rootRef.child('tenant-tin-requests').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, requestData).then(function (key) {
                var mergeObj = {};
                mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/requests/' + key['$id']] = requestData;
                firebaseUtils.updateData(rootRef, mergeObj);
            });;
        }

        /**
         * Delete Request
         * @returns {Object} request data
         */
        function deleteRequest(key) {
            var mergeObj = {};
            mergeObj['tenant-tin-requests/' + tenantId + '/' + key['$id'] + '/deactivated'] = false;
            mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/requests/' + key['$id'] + '/deactivated'] = false;
            //mergeObj['tenant-bulkbuy-requests-deactivated/'+ tenantId + '/' + key['$id']] = key;
            mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/offers/' + key['$id'] + '/deactivated'] = false;
            firebaseUtils.updateData(rootRef, mergeObj).then(function (requests) {
                var mergeObj = {};
                if (key.offers) {
                    var ref = rootRef.child('tenant-request-offers').child(tenantId).orderByChild('deactivated').equalTo(null);
                    firebaseUtils.fetchList(ref).then(function (offers) {
                        var mergeObj = {};
                        for (var i = 0; i < key.offers.length; i++) {
                            if (config.getIndexByArray(offers, '$id', key.offers[i]) > -1) {
                                mergeObj['tenant-request-offers/' + tenantId + '/' + key.offers[i] + '/customers/' + key.customerSelected] = false;
                            }
                        }
                        firebaseUtils.updateData(rootRef, mergeObj).then(function () {
                            var ref = rootRef.child('tenant-redeems').child(tenantId).orderByChild('key').equalTo(key['$id']);
                            firebaseUtils.fetchList(ref).then(function (data) {
                                var mergeObj = {};
                                for (var i = 0; i < data.length; i++) {
                                    mergeObj['tenant-redeems/' + tenantId + '/' + data[i]['$id'] + '/deactivated'] = false;
                                }
                                firebaseUtils.updateData(rootRef, mergeObj);
                            });
                        });
                    });
                }
            });
        }

    }
}());