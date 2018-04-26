(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('tinService', tinService);

    /** @ngInject */
    function tinService($firebaseArray, $firebaseObject, auth, $q, $timeout, authService) {
        var currentUser;
        var service = {
            saveRequest: saveRequest,
            submitForm27As: submitForm27As,
            submitFVUs: submitFVUs,
            submitSingleForm27A: submitSingleForm27A,
            submitSingleFVU: submitSingleFVU
        };

        return service;

        //////////
        /**
         * Set Current User
         * @param {Object} User information object
         */
        function saveRequest(requestObj, tenantId) {
            var defer = $q.defer();
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
                defer.resolve(key);
                submitForm(requestObj, key);
            });

            return defer.promise;
        }

        /**
         * Get Current Settings
         * @param {String} Current Tenant Id
         */
        function submitForm27As(form27As) {
            var defer = $q.defer();
            $rootScope.loadingProgress = true;
            var tinrequests = {},
                existingBarcodes = [],
                invalidFiles = [];
            vm.showAlertMessage = false;
            form27AInstance.option('disabled', true);
            fvuInstance.option('disabled', true);
            vm.progressStatus = 'Uploading Form27As';
            vm.progressBarValue = 20;
            var promises = form27As.map(function (form27A) {
                return new Promise(submitSingleForm27A(resolve, reject, form27A));
            });
            
            Promise.all(promises).then(function () {
                defer.resolve(promises);
                submitFVUs(tinrequests, existingBarcodes, invalidFiles, key);
            });

            return defer.promise;
        }

        /**
         * Submit Single Form27A
         */

        function submitSingleForm27A(resolve, reject, form27A) {

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
        }

        /**
         * Submit FVUs
         */
        function submitFVUs(fvus) {

            var promises = fvus.map(function (fvu) {
                if (fvu.name.split('.').pop() !== 'fvu') {
                    invalidFiles.push(fvu.name);
                    return;
                }
                return new Promise(submitSingleFVU(resolve, reject, fvu));
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

                    requestObj.refNo = settings.requestIdPrefix + (new Date()).getTime();
                    requestObj.ref = formInstance.getEditor('ref').option('value') || '';
                    mergeObj['tenant-tin-requests/' + tenantId + '/' + request] = requestObj;
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

                form27AInstance.option('disabled', false);
                fvuInstance.option('disabled', false);
                $rootScope.loadingProgress = false;
                form27AInstance.reset();
                fvuInstance.reset();
            });

        }
    }

    /**
     * Submit Single FVU
     */
    function submitSingleFVU(resolve, reject, fvu) {

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

                    var requestObj = { 'fvuFileName': fvu.name, 'barcode': barcode, 'fvuFileUrl': snapshot.downloadURL, 'requestId': key, 'tenantId': tenantId, 'status': 'pending' };

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

    }

})();