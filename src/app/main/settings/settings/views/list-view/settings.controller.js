(function ()
{
    'use strict';

    angular
        .module('app.settings')
        .controller('SettingsController', SettingsController);

    /** @ngInject */
    function SettingsController($state, $scope, $mdDialog, $firebaseStorage, $mdToast, $document, $firebaseObject, $q, settingsService)
    {
        var vm = this,
            formInstance,
            logoInstance;

        // Data
        
        // Methods
        init();
        //////////

        function init() {
           $firebaseObject(rootRef.child('settings')).$loaded(function(data) {
                vm.formData = data;  
           });

        }   

        $scope.$watch('formData', function(val) {
            //formInstance.option('formData', val);
        })

        vm.settingsForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            bindingOptions: {
                'formData.requestIdPrefix': 'vm.formData.requestIdPrefix',
                'formData.extraCharge': 'vm.formData.extraCharge'
            },
            validationGroup: "settingsData",
            colCount: 2,
            items: [{
                dataField: 'requestIdPrefix',
                label: {
                    text: 'Request ID Prefix (e.g. companyName_)'
                }
            }, {
                dataField: 'extraCharge',
                editorType: 'dxNumberBox',
                label : {
                    text: 'Extra charge per TIN request (e.g. 2/-)'
                }
            }, {
                dataField: 'smtpEmail',
                label: {
                    text: 'SMTP Email'
                }
            }, {
                dataField: 'smtpPassword',
                label: {
                    text: 'SMTP Password'
                }
            }, {
                dataField: 'supportEmail',
                label: {
                    text: 'Support Email'
                }
            }, {
                dataField: 'clientEmail',
                label: {
                    text: 'Client Email'
                }
            }, {
                dataField: 'paymentEmail',
                label: {
                    text: 'Payment Email'
                }
            }, {
                dataField: 'orderEmail',
                label: {
                    text: 'Order Email'
                }
            }, {
                dataField: 'retailEmail',
                label: {
                    text: 'Retail Email'
                }
            }, {
                dataField: 'formEmail',
                label: {
                    text: 'Form Email'
                }
            },  {
                template: function (data, itemElement) {
                    itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                        accept: "image/gif,image/png",
                        selectButtonText: "Upload Logo",
                        multiple: 'false',
                        uploadMode: "useButtons",
                        onContentReady: function (e) {
                            logoInstance = e.component;
                        },
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
                template: '<img ng-src="{{vm.formData.logo}}"></img>'
            }]
        };

        vm.buttonOptions = {
            text: "Submit",
            type: "success",
            useSubmitBehavior: false,
            bindingOptions: {
                'disabled': 'vm.btnDisabled'
            },
            validationGroup: "settingsData",
            onClick: function (e) {
                //vm.btnDisabled = true;
                //saveRequest();
                var formData = formInstance.option('formData');
                rootRef.child('settings').update(formData).then(function() {
                    $mdToast.show({
                        template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Submitted Successfully</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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

                var logo = logoInstance.option('values');

                if(logo.length > 0) {
                    var logoRef = firebase.storage().ref('settings').child('logo');
                    $firebaseStorage(logoRef).$put(logo[0], {}).$complete(function (snapshot) {
                        var logoUrl = snapshot.downloadURL;
                        $scope.logoRef = logoUrl;
                        rootRef.child('settings').update({logo: logoUrl}).then(function(data) {
                            $mdToast.show({
                                template: '<md-toast ng-style="cssStyle"><span class="md-toast-text" flex>Logo Uploaded</span><md-button ng-click="closeToast()">Close</md-button></md-toast>',
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
                    });
                }
            }
        };

    }
})();