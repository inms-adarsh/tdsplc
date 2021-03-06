(function ()
{
    'use strict';

    angular
        .module('app.requests')
        .controller('TinRequestDialogController', TinRequestDialogController);

    /** @ngInject */
    function TinRequestDialogController($state, $firebaseObject, authService, $mdToast, $scope, $mdDialog, $document, $firebaseStorage, firebaseUtils, requestService, barcode, request)
    {
        var vm = this,
            formInstance,
            form27AInstance,
            fvuInstance,
            tenantId = authService.getCurrentTenant();

        // Data

        vm.barcode = request.barcode;
        
        vm.requestForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            width: 300,
            validationGroup: "customerData",
            items: [
                    {
                        template: function (data, itemElement) {
                            itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                accept: 'application/pdf',
                                selectButtonText: "Select Form 27A",
                                multiple: false,
                                uploadMode: "useButtons",
                                onContentReady: function (e) {
                                    form27AInstance = e.component;
                                },
                                visible: !request.form27AUrl,
                                onValueChanged: function (e) {
                                    var values = e.component.option("values");
                                    $.each(values, function (index, value) {
                                        e.element.find(".dx-fileuploader-upload-button").hide();
                                    });
                                    e.element.find(".dx-fileuploader-upload-button").hide();
                                }
                            }));

                            itemElement.append('<div id="button" dx-button="buttonOptions"></div>');
                        }
                    }, {
                        template: function (data, itemElement) {
                            itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                accept: '*.fvu',
                                selectButtonText: "Select FVU",
                                multiple: false,
                                uploadMode: "useButtons",
                                visible: !request.fvuFileUrl,
                                onContentReady: function (e) {
                                    fvuInstance = e.component;
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
        };
      
        vm.uploadFiles = function uploadFiles() {
            var form27As = !request.form27AUrl? form27AInstance.option('value'): fvuInstance.option('value');

            //var progressRef = rootRef.child('file-upload-progress').child(request.tenantId);
           
            //firebaseUtils.updateData(progressRef, {requestId: request.requestId, progress: 40});

            var promises = form27As.map(function (form27A) {
                return new Promise(function (resolve, reject) {
                    var filePath = !request.form27AUrl? 'form27A': 'fvu';
                    var storageRef = firebase.storage().ref("tenant-tin-remaining-uploads/" + request.requestId + "/" + filePath + "/" + form27A.name),

                        metaData = {
                            customMetadata: {
                                'fileContentType': form27A.type,
                                'fileName': form27A.name,
                                'fileSize': form27A.size,
                                'requestNo': request.requestId,
                                'barcode': request.barcode,
                                'key': request.$id,
                                'fileType': filePath,
                                'tenantId': request.tenantId
                            }
                        };
                    if(filePath == 'form27A') {
                      //Step 2: Read the file using file reader
                      var fileReader = new FileReader();  

                      fileReader.onload = function() {

                          //Step 4:turn array buffer into typed array
                          var typedarray = new Uint8Array(this.result);

                          //Step 5:PDFJS should be able to read this
                          pdfjsLib.getDocument(typedarray).then(function(pdf) {
                              // do stuff
                              pdf.getPage(1).then(function(page) {
                                  page.getTextContent().then(function(text) {
                                    if (!text || !text.items || !text.items[3]) {
                                        DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                                        return resolve({});
                                    }
                                    var barcode = text.items[3].str.trim();

                                    if (isNaN(Number(barcode))) {
                                        DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                                        return resolve({});
                                    } else if (barcode.length != 20) {
                                        DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                                        return resolve({});
                                    }

                                      if(request.barcode == barcode) {
                                        $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {
                                            var ref = rootRef.child('tenant-tin-requests').child(tenantId).child(''+barcode);
                                            ref.once("value", function(request) {
                                                var request = angular.copy(request.val()); 
                                                Object.assign(request, {'form27AFileName': form27A.name, 'form27AUrl': snapshot.downloadURL, 'latest': true, 'valid': true, status: 1});
                                                var mergeObj = {};
                                                mergeObj['admin-tin-requests/'+barcode] = request;
                                                mergeObj['tenant-tin-requests/'+request.tenantId+'/'+barcode] = request;
                                                mergeObj['tin-requests/'+request.requestId+'/'+barcode] = request;
                                                return resolve(rootRef.update(mergeObj));
                                            });
                                            
                                        }); 
                                     } else {
                                        DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                                     }    
                                  });
                              });
                          });


                      };
                      //Step 3:Read the file as ArrayBuffer
                      fileReader.readAsArrayBuffer(form27A);
                    } else {
                        var reader = new FileReader();
    
                        reader.addEventListener('load', function (e) {
                            if (!e.target.result || !e.target.result.split('\n') || !e.target.result.split('\n')[7]) {
                                DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                                return resolve({});
                            }
                            var barcode = e.target.result.split('\n')[7].split('^');
    
                            if (isNaN(Number(barcode[barcode.length - 1].trim()))) {
                                barcode = e.target.result.split('\n')[6].split('^');
                            }

                            if (isNaN(Number(barcode[barcode.length - 1].trim()))) {
                                barcode = e.target.result.split('\n')[8].split('^');
                            }

                            var barcode = e.target.result.split('\n')[6].split('^');
                            //fs.writeFile('./fvucontent.json', barcode[barcode.length - 1]);
                            barcode = barcode[barcode.length - 1].trim();

                            
                            var formNo = (e.target.result.split('\n')[1].split('^'))[4],
                            deductor = (e.target.result.split('\n')[1].split('^'))[18],
                            qtr = (e.target.result.split('\n')[1].split('^'))[17],
                            finYear = (e.target.result.split('\n')[1].split('^'))[16];
                           
                            if(request.barcode == barcode) {
                                $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {

                                    // var ref = rootRef.child('admin-tin-requests').child(request.$id),
                                    //     requestObj = metaData.customMetadata;
                                    var ref = rootRef.child('tenant-tin-requests').child(tenantId).child(''+barcode);
                                    ref.once("value", function(request) {
                                        var request = angular.copy(request.val()); 
                                        Object.assign(request, {'fvuFileName': form27A.name, 'fvuFileUrl': snapshot.downloadURL, 'latest': true, 'valid': true, status: 1,
                                        'formNo': formNo, 'deductor': deductor, 'qtr': qtr, 'finYear': finYear});
                                        //delete request.$id;

                                        var mergeObj = {};
                                        mergeObj['admin-tin-requests/'+barcode] = request;
                                        mergeObj['tenant-tin-requests/'+request.tenantId+'/'+barcode] = request;
                                        mergeObj['tin-requests/'+request.requestId+'/'+barcode] = request;
                                        return resolve(rootRef.update(mergeObj));
                                
                                    }, function (errorObject) {
                                        console.log("The read failed: " + errorObject.code);
                                    });
                                }); 
                             } else {
                                DevExpress.ui.dialog.alert('Invalid File', 'Error'); 
                             }    
                        });
                        
                        reader.readAsBinaryString(form27A);
                    }
                });
            });

            Promise.all(promises).then(function(data) {
                $mdDialog.hide();
            });
        };
    }
})();