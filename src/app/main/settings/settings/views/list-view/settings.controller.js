(function ()
{
    'use strict';

    angular
        .module('app.settings')
        .controller('SettingsController', SettingsController);

    /** @ngInject */
    function SettingsController($state, $scope, $mdDialog, $mdToast, $document, $firebaseObject, $q, settingsService)
    {
        var vm = this,
            formInstance;

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
            }
        };

    }
})();