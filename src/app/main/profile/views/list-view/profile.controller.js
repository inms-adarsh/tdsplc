(function () {
    'use strict';

    angular
        .module('app.profile')
        .controller('ProfileController', ProfileController);

    /** @ngInject */
    function ProfileController($state, auth, authService, $scope, $mdDialog, $firebaseStorage, $mdToast, $document, $firebaseObject, $q, profileService) {
        var vm = this,
            formInstance,
            logoInstance,
            tenantId = authService.getCurrentTenant();

        // Data

        // Methods
        init();
        //////////

        function init() {
            $firebaseObject(rootRef.child('users').child(auth.$getAuth().uid)).$loaded(function (data) {
                vm.formData = data;
            });

        }

        $scope.$watch('formData', function (val) {
            //formInstance.option('formData', val);
        })

        vm.profileForm = {
            onInitialized: function (e) {
                formInstance = e.component;
            },
            bindingOptions: {
                'formData.name': 'vm.formData.name',
                'formData.phone': 'vm.formData.phone',
                'formData.address': 'vm.formData.address',
                'formData.city': 'vm.formData.city',
                'formData.zipcode': 'vm.formData.zipcode',
                'formData.state': 'vm.formData.state'
            },
            validationGroup: "profileData",
            colCount: 2,
            items: [{
                dataField: 'name',
                label: {
                    text: 'Name'
                },
                validationRules: [{
                    type: 'required',
                    message: 'Name is required'
                }]
            }, {
                dataField: 'phone',
                label: {
                    text: 'Phone'
                },
                editorType: 'dxNumberBox',
                validationRules: [{
                    type: 'required',
                    message: 'Phone number is required'
                }]
            }, {
                dataField: 'address',
                label: {
                    text: 'Address'
                }
            }, {
                dataField: 'city',
                label: {
                    text: 'City'
                }
            }, {
                dataField: 'state',
                label: {
                    text: 'State'
                }
            }, {
                dataField: 'zipcode',
                label: {
                    text: 'ZIP/Pincode'
                },
                editorOptions: {
                    mask: '000000'
                }
            }, {
                template: function (data, itemElement) {
                    itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                        accept: "image/gif,image/png",
                        selectButtonText: "Upload photo",
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
            validationGroup: "profileData",
            onClick: function (e) {
                //vm.btnDisabled = true;
                //saveRequest();
                var result = e.validationGroup.validate();

                if (result.isValid == true) {


                    var formData = formInstance.option('formData');
                    rootRef.child('users').child(auth.$getAuth().uid).update(formData).then(function () {
                        rootRef.child('tenant-users').child(tenantId).child(auth.$getAuth().uid).update(formData).then(function () {
                            DevExpress.ui.dialog.alert('New profile saved successfully', 'Success');
                        });
                    });

                    var logo = logoInstance.option('value');

                    if (logo.length > 0) {
                        var logoRef = firebase.storage().ref('profile/' + auth.$getAuth().uid).child('logo');
                        $firebaseStorage(logoRef).$put(logo[0], {}).$complete(function (snapshot) {
                            var logoUrl = snapshot.downloadURL;
                            $scope.logoRef = logoUrl;
                            rootRef.child('users').child(auth.$getAuth().uid).update({ logo: logoUrl }).then(function (data) {
                                DevExpress.ui.dialog.alert('New logo uploaded successfully', 'Success');
                            });
                            logoInstance.reset();
                        });
                    }
                }
            }
        };

    }
})();