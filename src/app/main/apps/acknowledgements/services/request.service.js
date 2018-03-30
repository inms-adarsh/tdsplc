(function () {
    'use strict';

    angular
        .module('app.acknowledgements')
        .factory('acknowledgementService', acknowledgementService);

    /** @ngInject */
    function acknowledgementService($rootScope, $firebaseArray,$mdDialog, $firebaseObject, $compile, $q, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance,
            fvuInstance,
            scope = $rootScope.$new();
        // Private variables

        var service = {
            gridOptions: gridOptions,
            updateAcknowledgement: updateAcknowledgement,
            fetchAcknowledgementList: fetchAcknowledgementList,
            acknowledgementForm: acknowledgementForm
        };

        return service;
        /**
         * Acknowledgement Form
         */
        function acknowledgementForm() {
            var acknowledgementForm = {};
            return acknowledgementForm;
        }
        /**
         * Grid Options for acknowledgement list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource, customers, beers) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchAcknowledgementList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (acknowledgementObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                acknowledgementObj.offers = data.offers;
                            }
                            saveAcknowledgement(acknowledgementObj);
                        },
                        update: function (key, acknowledgementObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                acknowledgementObj.offers = data.offers;
                            }
                            updateAcknowledgement(key, acknowledgementObj);
                        },
                        remove: function (key) {
                            deleteAcknowledgement(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'amountOnLiquor',
                            summaryType: 'sum'
                        }, {
                            column: 'amountOnBeer',
                            summaryType: 'sum'
                        }, {
                            column: 'amountOnFood',
                            summaryType: 'sum'
                        }, {
                            column: 'total',
                            summaryType: 'sum',
                            customizeText: function (data) {
                                return 'Total ' + data.value;
                            }
                        }]
                    },
                    editing: {
                        allowAdding: true,
                        allowUpdating: false,
                        allowDeleting: true,
                        mode: 'form',
                        form: acknowledgementForm(customers, beers)
                    },
                    columns: [{
                        dataField: 'date',
                        caption: 'Date',
                        dataType: 'date',
                        validationRules: [{
                            type: 'required',
                            message: 'Date is required'
                        }]
                    }, 
                    // {
                    //     dataField: 'acknowledgementId',
                    //     caption: "Acknowledgement No"
                    // }, 
                    {
                        dataField: 'barcode',
                        caption: 'Bar Code',
                        dataType: 'string',
                        validationRules: [{
                            type: 'required',
                            message: 'Barcode is required'
                        }]
                    }, {
                        dataField: 'token',
                        caption: 'Token Number'

                    }, {
                        dataField: 'rdate',
                        caption: 'R Date'
                    }, {
                        caption: 'Deductor/Collector Name',
                        dataField: 'deductor'
                    }, {
                        dataField: 'fees',
                        caption: 'Fees'
                    }, {
                        dataField: 'extra',
                        caption: 'Extra'
                    }, {
                        dataField: 'discount',
                        caption: 'Discount'
                    }, {
                        dataField: 'attachment27a',
                        caption: 'Attachment 27A',
                        cellTemplate: function(container, options) {
                            if(options.data.form27AUrl) {
                                $('<a href="'+ options.data.form27AUrl+'" download>Download 27A</a>').appendTo(container);
                            } else {
                                $compile($('<a class="md-button md-raised md-accent" ng-click="uploadForm27A()">Upload Form 27A</a>'))(scope).appendTo(container);
                            }
                        }
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'Attachment FVU',
                        cellTemplate: function(container, options) {
                            if(options.data.fvuFileUrl) {
                                $('<a href="'+ options.data.fvuFileUrl+'" download>Download FVU</a>').appendTo(container);
                            } else {
                                $('<a class="">Upload FVU</span>').appendTo(container);
                            }
                        }
                    }, {
                        dataField: 'ACK',
                        caption: 'Acknowledge'
                    }, {
                        dataField: 'remarks',
                        caption: 'Remarks'
                    }, {
                        dataField: 'status',
                        caption: 'Status'
                    }, {
                        caption: 'Action'
                    }],
                    export: {
                        enabled: true,
                        fileName: 'Acknowledgements',
                        allowExportSelectedData: true
                    }

                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        }

        scope.fvuFileUploader = {
            'multiple': true
        };


       
        /**
         * Fetch acknowledgement list
         * @returns {Object} Acknowledgement data
         */
        function fetchAcknowledgementList() {
            var ref = rootRef.child('admin-tin-acknowledgements').orderByChild('tenantId').equalTo(tenantId);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch acknowledgement list
         * @returns {Object} Acknowledgement data
         */
        function updateAcknowledgement(key, acknowledgementData) {
            var ref = rootRef.child('tenant-tin-acknowledgements').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, acknowledgementData).then(function (key) {
                var mergeObj = {};
                mergeObj['tenant-customer-acknowledgements/' + tenantId + '/' + key.customerSelected + '/acknowledgements/' + key['$id']] = acknowledgementData;
                firebaseUtils.updateData(rootRef, mergeObj);
            });;
        }

        /**
         * Delete Acknowledgement
         * @returns {Object} acknowledgement data
         */
        function deleteAcknowledgement(key) {
            var mergeObj = {};
            mergeObj['tenant-tin-acknowledgements/' + tenantId + '/' + key['$id'] + '/deactivated'] = false;
            mergeObj['tenant-customer-acknowledgements/' + tenantId + '/' + key.customerSelected + '/acknowledgements/' + key['$id'] + '/deactivated'] = false;
            //mergeObj['tenant-bulkbuy-acknowledgements-deactivated/'+ tenantId + '/' + key['$id']] = key;
            mergeObj['tenant-customer-acknowledgements/' + tenantId + '/' + key.customerSelected + '/offers/' + key['$id'] + '/deactivated'] = false;
            firebaseUtils.updateData(rootRef, mergeObj).then(function (acknowledgements) {
                var mergeObj = {};
                if (key.offers) {
                    var ref = rootRef.child('tenant-acknowledgement-offers').child(tenantId).orderByChild('deactivated').equalTo(null);
                    firebaseUtils.fetchList(ref).then(function (offers) {
                        var mergeObj = {};
                        for (var i = 0; i < key.offers.length; i++) {
                            if (config.getIndexByArray(offers, '$id', key.offers[i]) > -1) {
                                mergeObj['tenant-acknowledgement-offers/' + tenantId + '/' + key.offers[i] + '/customers/' + key.customerSelected] = false;
                            }
                        }
                        firebaseUtils.updateData(rootRef, mergeObj).then(function () {
                            var ref = rootRef.child('tenant-redeems').child(tenantId).orderByChild('key').equalTo(key['$id']);
                            firebaseUtils.fetchList(ref).then(function (data) {
                                var mergeObj = {};
                                for (var i = 0; i < data.length; i++) {
                                    mergeObj['tenant-redeems/' + tenantId + '/' + data[i]['$id'] + '/deactivated'] = false;
                                }
                                firebaseUtils.updateData(rootRef, mergeObj);
                            });
                        });
                    });
                }
            });
        }

    }
}());