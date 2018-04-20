(function () {
    'use strict';

    angular
        .module('app.settings')
        .factory('settingsService', settingsService);

    /** @ngInject */
    function settingsService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config) {
        var tenantId = authService.getCurrentTenant(),
            taxGridInstance,
            dxTaxForm;
        // Private variables

        var service = {
            gridOptions: gridOptions,
            saveSettings: saveSettings,
            updateSettings: updateSettings,
            fetchSettingsList: fetchSettingsList,
            taxGrid: taxGrid
        };

        return service;

        //////////

        /**
         * Grid Options for settings list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchSettingsList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (taxObj) {
                            taxObj.selectedTaxes = taxGridInstance.getSelectedRowKeys();
                            saveSettings(taxObj);
                        },
                        update: function (key, taxObj) {
                            updateSettings(key, taxObj);
                        },
                        remove: function (key) {
                            deleteSettings(key);
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
                        fileName: 'Settings',
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
                                template: 'settingsTemplate'
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
         * @returns {Object} Settings Form data
         */
        function saveSettings(taxObj) {
            var ref = rootRef.child('tenant-settings').child(tenantId);
            taxObj.user = auth.$getAuth().uid;
            return firebaseUtils.addData(ref, taxObj);
        }

        /**
         * Fetch settings list
         * @returns {Object} Settings data
         */
        function fetchSettingsList() {
            var ref = rootRef.child('tenant-settings').child(tenantId).orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch settings list
         * @returns {Object} Settings data
         */
        function updateSettings(key, taxData) {
            var ref = rootRef.child('tenant-settings').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, SettingsData);
        }

        /**
         * Delete Settings
         * @returns {Object} settings data
         */
        function deleteSettings(key) {
            var ref = rootRef.child('tenant-settings').child(tenantId).child(key['$id']);
            return firebaseUtils.updateData(ref, { deactivated: false });
        }

    }
}());