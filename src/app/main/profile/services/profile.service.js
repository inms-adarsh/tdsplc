(function () {
    'use strict';

    angular
        .module('app.profile')
        .factory('profileService', profileService);

    /** @ngInject */
    function profileService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            taxGridInstance,
            dxTaxForm;
        // Private variables

        var service = {
            gridOptions: gridOptions,
            saveProfile: saveProfile,
            updateProfile: updateProfile,
            fetchProfileList: fetchProfileList,
            taxGrid: taxGrid
        };

        return service;

        //////////

        /**
         * Grid Options for profile list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchProfileList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (taxObj) {
                            taxObj.selectedTaxes = taxGridInstance.getSelectedRowKeys();
                            saveProfile(taxObj);
                        },
                        update: function (key, taxObj) {
                            updateProfile(key, taxObj);
                        },
                        remove: function (key) {
                            deleteProfile(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'description',
                            summaryType: 'count'
                        }]
                    },
                    columns: config.taxGroupGridCols(),
                    export: {
                        enabled: true,
                        fileName: 'Profile',
                        allowExportSelectedData: true
                    },
                    onEditingStart: function (e) {

                    },
                    editing: {
                        allowAdding: true,
                        allowUpdating: true,
                        allowDeleting: true,
                        mode: 'form',
                        form: {
                            colCount: 2,
                            items: [{
                                dataField: 'description',
                                label: {
                                    text: 'Description',
                                    location: 'top'
                                },
                                validationRules: [{
                                    type: 'required',
                                    message: 'Description is required'
                                }]
                            },{
                                itemType: 'empty'
                            },{
                                label: {
                                    text: 'Select the Taxes that are included in this group',
                                    location: 'top'
                                },
                                template: 'profileTemplate'
                            }],
                            onInitialized: function (e) {
                                dxTaxForm = e.component;
                            }
                        }
                    },
                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        };

        /**
         * Taxes grid
         */
        function taxGrid(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: dataSource,
                    columns: [{
                        dataField: 'description',
                        caption: 'Description'
                    }, {
                        dataField: 'defaultRate',
                        caption: 'Tax Rate(%)',
                        dataType: 'number'
                    }],
                    searchPanel: {
                        visible: false
                    },
                    columnChooser: {
                        enabled: false
                    },
                    editing: {
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: false
                    },
                    onContentReady: function (e) {
                        taxGridInstance = e.component;
                        taxGridInstance.selectRows(dxTaxForm.option('formData').selectedTaxes);
                    },
                    showBorders: true
                };
            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        }

        /**
         * Save form data
         * @returns {Object} Profile Form data
         */
        function saveProfile(taxObj) {
            var ref = rootRef.child('tenant-profile').child(tenantId);
            taxObj.user = auth.$getAuth().uid;
            return firebaseUtils.addData(ref, taxObj);
        }

        /**
         * Fetch profile list
         * @returns {Object} Profile data
         */
        function fetchProfileList() {
            var ref = rootRef.child('tenant-profile').child(tenantId).orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch profile list
         * @returns {Object} Profile data
         */
        function updateProfile(key, taxData) {
            var ref = rootRef.child('tenant-profile').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, ProfileData);
        }

        /**
         * Delete Profile
         * @returns {Object} profile data
         */
        function deleteProfile(key) {
            var ref = rootRef.child('tenant-profile').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());