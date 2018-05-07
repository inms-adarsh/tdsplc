(function ()
{
    'use strict';

    angular
        .module('app.home')
        .controller('ContactController', ContactController);

    /** @ngInject */
    function ContactController($state, $scope, $mdDialog, $firebaseStorage, $mdToast, $document, $firebaseObject, $q, homeService)
    {
        var vm = this,
            formInstance,
            logoInstance;

        // Data
        
        // Methods
        init();
        //////////

        function init() {
           $firebaseObject(rootRef.child('home')).$loaded(function(data) {
                vm.formData = data;  
           });

        }   

        $scope.$watch('formData', function(val) {
            //formInstance.option('formData', val);
        })

        vm.homeForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            bindingOptions: {
                'formData.requestIdPrefix': 'vm.formData.requestIdPrefix',
                'formData.extraCharge': 'vm.formData.extraCharge'
            },
            validationGroup: "homeData",
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
                dataField: 'smtpHost',
                label: {
                    text: 'SMTP Host'
                }
            }, {
                dataField: 'smtpPort',
                label: {
                    text: 'SMTP Port'
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
                dataField: 'fromEmail',
                label: {
                    text: 'From Email'
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
            validationGroup: "homeData",
            onClick: function (e) {
                //vm.btnDisabled = true;
                //saveRequest();
                var formData = formInstance.option('formData');
                rootRef.child('home').update(formData).then(function() {
                    DevExpress.ui.dialog.alert('New home saved successfully', 'Success');  
                });

                var logo = logoInstance.option('value');

                if(logo.length > 0) {
                    var logoRef = firebase.storage().ref('home').child('logo');
                    $firebaseStorage(logoRef).$put(logo[0], {}).$complete(function (snapshot) {
                        var logoUrl = snapshot.downloadURL;
                        $scope.logoRef = logoUrl;
                        rootRef.child('home').update({logo: logoUrl}).then(function(data) {
                            DevExpress.ui.dialog.alert('New logo uploaded successfully', 'Success');  
                        });
                        logoInstance.reset();
                    });
                }
            }
        };

    }
})();