(function () {
    'use strict';

    angular
        .module('app.requests')
        .factory('requestService', requestService);

    /** @ngInject */
    function requestService($rootScope, $firebaseArray,$mdDialog, $firebaseObject, $compile, $q, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance,
            fvuInstance,
            scope = $rootScope.$new();
        // Private variables

        var service = {
            gridOptions: gridOptions,
            updateRequest: updateRequest,
            fetchRequestList: fetchRequestList,
            requestForm: requestForm
        };

        return service;
        /**
         * Request Form
         */
        function requestForm() {
            var requestForm = {};
            return requestForm;
        }
        /**
         * Grid Options for request list
         * @param {Object} dataSource 
         */
        function gridOptions(dataSource, customers, beers) {
            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            fetchRequestList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (requestObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                requestObj.offers = data.offers;
                            }
                            saveRequest(requestObj);
                        },
                        update: function (key, requestObj) {
                            var data = formInstance.option('formData');
                            if (data.offers) {
                                requestObj.offers = data.offers;
                            }
                            updateRequest(key, requestObj);
                        },
                        remove: function (key) {
                            deleteRequest(key);
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
                        form: requestForm(customers, beers)
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
                    //     dataField: 'requestId',
                    //     caption: "Request No"
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
                        caption: '27A',
                        cellTemplate: function(container, options) {
                            if(options.data.form27AUrl) {
                                $('<a href="'+ options.data.form27AUrl+'" download>Download 27A</a>').appendTo(container);
                            } else {
                                $compile($('<a class="md-button md-raised md-accent" ng-click="uploadForm27A()">Upload Form 27A</a>'))(scope).appendTo(container);
                            }
                        }
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'FVU',
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
                        fileName: 'Requests',
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
         * Fetch request list
         * @returns {Object} Request data
         */
        function fetchRequestList() {
            var ref = rootRef.child('admin-tin-requests').orderByChild('tenantId').equalTo(tenantId);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch request list
         * @returns {Object} Request data
         */
        function updateRequest(key, requestData) {
            var ref = rootRef.child('tenant-tin-requests').child(tenantId).child(key['$id']);
            firebaseUtils.updateData(ref, requestData).then(function (key) {
                var mergeObj = {};
                mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/requests/' + key['$id']] = requestData;
                firebaseUtils.updateData(rootRef, mergeObj);
            });;
        }

        /**
         * Delete Request
         * @returns {Object} request data
         */
        function deleteRequest(key) {
            var mergeObj = {};
            mergeObj['tenant-tin-requests/' + tenantId + '/' + key['$id'] + '/deactivated'] = false;
            mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/requests/' + key['$id'] + '/deactivated'] = false;
            //mergeObj['tenant-bulkbuy-requests-deactivated/'+ tenantId + '/' + key['$id']] = key;
            mergeObj['tenant-customer-requests/' + tenantId + '/' + key.customerSelected + '/offers/' + key['$id'] + '/deactivated'] = false;
            firebaseUtils.updateData(rootRef, mergeObj).then(function (requests) {
                var mergeObj = {};
                if (key.offers) {
                    var ref = rootRef.child('tenant-request-offers').child(tenantId).orderByChild('deactivated').equalTo(null);
                    firebaseUtils.fetchList(ref).then(function (offers) {
                        var mergeObj = {};
                        for (var i = 0; i < key.offers.length; i++) {
                            if (config.getIndexByArray(offers, '$id', key.offers[i]) > -1) {
                                mergeObj['tenant-request-offers/' + tenantId + '/' + key.offers[i] + '/customers/' + key.customerSelected] = false;
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