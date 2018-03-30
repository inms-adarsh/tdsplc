(function ()
{
    'use strict';

    angular
        .module('app.acknowledgements')
        .controller('TinAcknowledgementDialogController', TinAcknowledgementDialogController);

    /** @ngInject */
    function TinAcknowledgementDialogController($state, $mdToast, $scope, $mdDialog, $document, $firebaseStorage, firebaseUtils, acknowledgementService, acknowledgement)
    {
        var vm = this,
            formInstance,
            form27AInstance,
            fvuInstance;

        // Data

        vm.barcode = acknowledgement.barcode;
        
        vm.acknowledgementForm = {
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
                                visible: !acknowledgement.form27AUrl,
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
                                visible: !acknowledgement.fvuFileUrl,
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
            var form27As = !acknowledgement.form27AUrl? form27AInstance.option('value'): fvuInstance.option('value');

            //var progressRef = rootRef.child('file-upload-progress').child(acknowledgement.tenantId);
           
            firebaseUtils.updateData(progressRef, {acknowledgementId: acknowledgement.acknowledgementId, progress: 40});

            var promises = form27As.map(function (form27A) {
                return new Promise(function (resolve, reject) {
                    var filePath = !acknowledgement.form27AUrl? 'form27A': 'fvu';
                    var storageRef = firebase.storage().ref("tenant-tin-remaining-uploads/" + acknowledgement.acknowledgementId + "/" + filePath + "/" + form27A.name),

                        metaData = {
                            customMetadata: {
                                'fileContentType': form27A.type,
                                'fileName': form27A.name,
                                'fileSize': form27A.size,
                                'acknowledgementNo': acknowledgement.acknowledgementId,
                                'barcode': acknowledgement.barcode,
                                'key': acknowledgement.$id,
                                'fileType': filePath,
                                'tenantId': acknowledgement.tenantId
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
                                      var barcode = text.items[3].str.trim(); 
                                      if(acknowledgement.barcode == barcode) {
                                        $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {

                                            var ref = rootRef.child('admin-tin-acknowledgements').child(acknowledgement.$id),
                                                acknowledgementObj = metaData.customMetadata;
                                        
                                            return resolve(firebaseUtils.updateData(ref, {'form27AUrl': snapshot.downloadURL, 'valid': true}));
                                        }); 
                                     } else {
                                        $mdToast.show({
                                            template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Invalid File!</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                                            hideDelay: 7000,
                                            controller: 'ToastController',
                                            position : 'top right',
                                            parent   : '#acknowledgement-dialog',
                                            locals: {
                                                cssStyle: {

                                                }
                                            }
                                        });
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
                            var barcode = e.target.result.split('\n')[6].split('^');
                            //fs.writeFile('./fvucontent.json', barcode[barcode.length - 1]);
                            barcode = barcode[barcode.length - 1].trim();
                            // if(typeof barcode === 'number') {
                            //     barcode = barcode[barcode.length - 1].trim();
                            // } else {
                            //     barcode = e.target.result.split('\n')[7].split('^');
                            //     barcode = barcode[barcode.length - 1].trim();
                            // }
                            if(acknowledgement.barcode == barcode) {
                                $firebaseStorage(storageRef).$put(form27A, metaData).$complete(function (snapshot) {

                                    var ref = rootRef.child('admin-tin-acknowledgements').child(acknowledgement.$id),
                                        acknowledgementObj = metaData.customMetadata;
                                
                                    return resolve(firebaseUtils.updateData(ref, {'fvuFileUrl': snapshot.downloadURL, 'valid': true}));
                                }); 
                             } else {
                                $mdToast.show({
                                    template : '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Invalid File!</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
                                    hideDelay: 7000,
                                    controller: 'ToastController',
                                    position : 'top right',
                                    parent   : '#acknowledgement-dialog',
                                    locals: {
                                        cssStyle: {
                                            
                                        }
                                    }
                                });
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