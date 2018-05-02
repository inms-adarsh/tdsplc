(function ()
{
    'use strict';

    angular
        .module('app.requests')
        .controller('AddRequestDialogController', AddRequestDialogController);

    /** @ngInject */
    function AddRequestDialogController($state, $firebaseObject, isAdmin, authService, $mdToast, $scope, $mdDialog, $document, $firebaseStorage, firebaseUtils, requestService, customers)
    {
        var vm = this,
            formInstance,
            form27AInstance,
            fvuInstance,
            tenantId = authService.getCurrentTenant();

        // Data

        vm.requestForm = {

            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            colCount: 2,
            items: [
                {
                    dataField: 'tenantId',
                    label: {
                        text: 'Select Tenant'
                    },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: customers,
                        displayExpr: "company",
                        valueExpr: "$id",
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Date is required'
                    }],
                    visible: isAdmin,
                    colSpan: 2
                }, 
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
                }, {
                    dataField: 'ref',
                    label: {
                        location: 'top',
                        text: 'Reference'
                    },
                    editorType: 'dxTextBox',
                    isRequired: false
                }
            ]
        };


        vm.uploadFiles = function uploadFiles() {
            var result = formInstance.validate();

            if (!result || result.isValid == true) {
                var formObj = formInstance.option('formData');

                formObj.form27As = form27AInstance.option('value');
                formObj.fvus = fvuInstance.option('value');
                if(!formObj.tenantId) {
                    formObj.tenantId = tenantId;
                }
                requestService.saveRequest(formObj);

                $mdDialog.hide();
                
                form27AInstance.option('disabled', true);
                fvuInstance.option('disabled', true);
                
                form27AInstance.reset();
                fvuInstance.reset();
                $scope.visibleRequestPopup = false
            }
        }
    }
})();