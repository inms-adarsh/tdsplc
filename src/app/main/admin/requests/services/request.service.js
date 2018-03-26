(function () {
    'use strict';

    angular
        .module('app.admin.requests')
        .factory('adminRequestService', adminRequestService);

    /** @ngInject */
    function adminRequestService($firebaseArray, $firebaseObject, $q, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance;
        // Private variables

        var service = {
            gridOptions: gridOptions,
            saveRequest: saveRequest,
            updateRequest: updateRequest,
            fetchRequestList: fetchRequestList,
            requestForm: requestForm,
            submitForm: submitForm
        };

        return service;

        //////////
        function submitForm(key) {
            var form27A = form27AInstance.option('value');

            
            for(var i=0; i<form27A.length; i++) {
                var storageRef = firebase.storage().ref("admin-tin-requests/" + key+ "/form27A/"+form27A[i].name),
                 
                metaData = {
                    customMetadata : {
                        'fileType': form27A[i].type,
                        'fileName': form27A[i].name,
                        'fileSize': form27A[i].size,
                        'requestNo': key,
                        'tenantId': tenantId
                    }
                };
                
                $firebaseStorage(storageRef).$put(form27A[i], metaData).$complete(function(snapshot) {

                    var ref = rootRef.child('admin-tin-requests').child(key);
                    firebaseUtils.updateData(ref, {downloadURL: snapshot.downloadURL}).then(function (key) {
                        
                    });
                });
            }
            //console.log(form27AInstance.option('value'));
        }
        
        function requestForm() {
            var requestForm = {
                onInitialized: function (e) {
                    formInstance = e.component;
                },
                validationGroup: "customerData",
                items: [{
                    itemType: "group",
                    caption: "Add TIN Request",
                    colCount: 2,

                    items: [
                        {
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: 'application/xls',
                                    selectButtonText: "Select E-TDS",
                                    multiple: 'true',
                                    uploadMode: "useButtons",
                                    onContentReady: function(e) {
                                        form27AInstance = e.component;
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
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: '*application/pdf',
                                    selectButtonText: "Select Acknowledgements to upload",
                                    multiple: true,
                                    uploadMode: "useButtons",
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
                }]
            };
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
                                console.log(data);
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
                    }, {
                        dataField: 'requestId',
                        caption: "Request No",
                        groupIndex: 0
                    }, {
                        dataField: 'tenantId',
                        caption: 'client',
                        dataType: 'string',
                        validationRules: [{
                            type: 'required',
                            message: 'Barcode is required'
                        }]
                    }, {
                        dataField: 'token',
                        caption: 'Token Number'

                    }, {
                        dataField: 'rno',
                        caption: 'R No'
                    }, {
                        dataField: 'rdate',
                        caption: 'R Date'
                    }, {
                        dataField: 'barcode',
                        caption: 'Barcode'
                    },  {
                        dataField: 'module',
                        caption: 'Module'
                    }, {
                        caption: 'Deductor/Collector Name',
                        dataField: 'deductor'
                    }, {
                        caption: 'Finacial Year',
                        dataField: 'finYear'
                    }, {
                        caption: 'QTR',
                        dataField: 'qtr'
                    }, {
                        caption: 'Form No',
                        dataField: 'formNo'
                    }, {
                        caption: 'tan',
                        dataField: 'TAN'
                    }, {
                        caption: 'AO Code',
                        dataField: 'aoCode'
                    }, {
                        caption: 'Regular/Correction',
                        dataField: 'corrections'
                    }, {
                        caption: 'Original Token No',
                        dataField: 'origTokenNo'
                    }, {
                        caption: 'Deductee/Collectee Count',
                        dataField: 'collecteeCount'
                    }, {
                        caption: 'User ID',
                        dataField: 'userId'
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
                            $('<a href="'+ options.data.filePath+'" download>Download 27A</a>').appendTo(container);
                        }
                    }, {
                        dataField: 'attachmentfvu',
                        caption: 'Attachment FVU'
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
                    },
                   customizeColumns: function (columns) {
                        $.each(columns, function (_, element) {
                            element.groupCellTemplate = groupCellTemplate;
                        });
                    }

                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        }

        /**
         * Save form data
         * @returns {Object} Request Form data
         */
        function saveRequest(requestObj) {
            var ref = rootRef.child('admin-tin-requests');
            if(!requestObj) {
                requestObj = {};
            }
            if (!requestObj.date) {
                requestObj.date = new Date();
            }
            requestObj.date = requestObj.date.toString();
            requestObj.user = auth.$getAuth().uid;
            requestObj.tenantId = tenantId;
            firebaseUtils.addData(ref, requestObj).then(function (key) {
                submitForm(key);               
            });
        }

        /**
         * Fetch request list
         * @returns {Object} Request data
         */
        function fetchRequestList() {
            var ref = rootRef.child('admin-tin-requests').orderByChild('deactivated').equalTo(null);
            return firebaseUtils.fetchList(ref);
        }

        /**
         * Fetch request list
         * @returns {Object} Request data
         */
        function updateRequest(key, requestData) {
            var ref = rootRef.child('admin-tin-requests').child(tenantId).child(key['$id']);
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
            mergeObj['admin-tin-requests/' + tenantId + '/' + key['$id'] + '/deactivated'] = false;
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