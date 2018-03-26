(function ()
{
    'use strict';

    angular
        .module('app.admin.requests')
        .controller('AdminRequestsController', AdminRequestsController);

    /** @ngInject */
    function AdminRequestsController($state, $firebaseStorage, $firebaseObject, authService, dxUtils, msUtils, $firebaseArray, $scope, $mdDialog, $document, adminRequestService)
    {
        var vm = this,
            tenantId = authService.getCurrentTenant(),
            requestForm,
            formInstance,
            form27AInstance,
            ackFormInstance,
            ackFileFormInstance
            ;

        // Data
        
        // Methods
        init();
        //////////

        function init() {
            vm.gridOptions = dxUtils.createGrid();
             
            var ref = rootRef.child('tenants');
            vm.clients = $firebaseArray(ref);

            var ref = rootRef.child('admin-tin-requests').orderByChild('valid').equalTo(true);
            vm.gridData = $firebaseArray(ref);
            var groupCellTemplate = function (groupCell, info) {
                var index = msUtils.getIndexByArray(vm.clients, '$id', info.data.items? info.data.items[0].tenantId: info.data.collapsedItems[0].tenantId);
                var requestDate = msUtils.formatDate(new Date(info.data.items? info.data.items[0].date: info.data.collapsedItems[0].date));
                $('<div>').html(vm.clients[index].company + '(Date: ' + requestDate + ' )').appendTo(groupCell);
            };

                        
            vm.requestGridOptions = {
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                editing: {
                    allowUpdating: false,
                    allowDeleting: true
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
                    calculateCellValue: function(options) {
                        var index = msUtils.getIndexByArray(vm.clients, '$id', options.tenantId);
                        return vm.clients[index].company;
                    }
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
                    cellTemplate: function (container, options) {
                        if (options.data.form27AUrl) {
                            $('<a href="' + options.data.form27AUrl + '" download>Download 27A</a>').appendTo(container);
                        }
                    }
                }, {
                    dataField: 'attachmentfvu',
                    caption: 'Attachment FVU',
                    cellTemplate: function (container, options) {
                        if (options.data.fvuFileUrl) {
                            $('<a href="' + options.data.fvuFileUrl + '" download>Download FVU</a>').appendTo(container);
                        }
                    }
                }, {
                    dataField: 'acknowledgementUrl',
                    caption: 'Acknowledge',
                    cellTemplate: function (container, options) {
                        if (options.data.acknowledgementUrl) {
                            $('<a href="' + options.data.acknowledgementUrl + '" download>Download Acknowledgement</a>').appendTo(container);
                        }
                    }
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
                },
                onCellPrepared: function(e) {
                    if (e.rowType == 'data' && e.row.data.acknowledged === true) {                
                        e.cellElement.find(".dx-link-delete").remove();
                        e.cellElement.find(".dx-link-edit").remove();
                    }
                }

            };

            vm.tdsRequestForm = {
                onInitialized: function (e) {
                    formInstance = e.component;
                },
                validationGroup: "customerData",
                items: [{
                    itemType: "group",
                    caption: "Add E-TDS",
                    colCount: 2,
                    items: [
                        {
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: 'application/xls',
                                    selectButtonText: "Select E-TDS",
                                    multiple: 'false',
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

                                // itemElement.append('<div id="button" dx-button="buttonOptions"></div>');
                            }
                        }
                    ]
                }]

            };

            vm.ackRequestForm = {
                onInitialized: function (e) {
                    ackFormInstance = e.component;
                },
                items: [{
                    itemType: "group",
                    caption: "Add Acknowledgements",
                    colCount: 2,
                    items: [
                            {
                            template: function (data, itemElement) {
                                itemElement.append($("<div>").attr("id", "dxfu1").dxFileUploader({
                                    accept: 'application/pdf',
                                    selectButtonText: "Select Acknowledgements to upload",
                                    multiple: true,
                                    uploadMode: "useButtons",
                                    onContentReady: function(e) {
                                        ackFileFormInstance = e.component;
                                    },
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
            
            vm.eTdSButtonOptions = {
                text: "Upload e-TDS",
                type: "success",
                useSubmitBehavior: false,
                onClick: function() {
                    form27AInstance.option('disabled', true);
                    saveTDSRequest();
                }
            };

            vm.ackButtonOptions = {
                text: "Upload Acknowledgements",
                type: "success",
                useSubmitBehavior: false,
                onClick: function() {
                    ackFileFormInstance.option('disabled', true);
                    saveAckRequest();
                }
            };

            angular.extend(vm.gridOptions, vm.requestGridOptions);
        }

        function saveTDSRequest() {
            var value = form27AInstance.option('value');
            var reader = new FileReader();

				reader.onload = function (e) {
					/* read workbook */
					var bstr = e.target.result;
					var wb = XLSX.read(bstr, {type:'binary'});

					/* grab first sheet */
					var wsname = wb.SheetNames[0];
					var ws = wb.Sheets[wsname];

					/* grab first row and generate column headers */
					var aoa = XLSX.utils.sheet_to_json(ws, {header:1, raw:false});
					var cols = [];
					for(var i = 0; i < aoa[0].length; ++i) cols[i] = { field: aoa[0][i] };

					/* generate rest of the data */
                    var data = [];

                    for(var r = 1; r < aoa.length; ++r) {
						data[r-1] = {};
						for(i = 0; i < aoa[r].length; ++i) {
							if(aoa[r][i] == null) continue;
							data[r-1][aoa[0][i]] = aoa[r][i]
						}
                    }
                    
                    console.log(data);

                    for(var i = 0; i< data.length ; i++) {
                       var obj = {
                            barcode: data[i]['Barcode Value'],
                            token: data[i]['Token Number'],
                            rdate: data[i]['Receipt Date'],
                            deductor: data[i]['Deductor/Collector Name'],
                            finYear: data[i]['Financial Year'],
                            fees: data[i]['Fees Charged'],
                            formNo: data[i]['Form No.'],
                            origTokenNo: data[i]['Original Token No.'],
                            tan: data[i]['TAN'],
                            userId: data[i]['User Id'],
                            corrections: data[i]['Regular/ Correction'],
                            qtr: data[i]['Quarter'],
                            acknowledged: true
                            
                        };
                        
                        rootRef.child('admin-tin-requests').child('id_'+obj['barcode']).update(obj);
                        form27AInstance.option('disabled', false);
                        form27AInstance.reset();
                    }
					
				};

				reader.readAsBinaryString(value[0]);
        }

        function saveAckRequest() {
            var acknowledgements = ackFileFormInstance.option('value');
            var promises = acknowledgements.map(function (acknowledgement) {
                var acknowledgementNo = acknowledgement.name.split('.')[0];
                var ref = rootRef.child('admin-tin-requests').orderByChild('token').equalTo(acknowledgementNo);
                var acknowledgementRef = firebase.storage().ref("tenant-acknowledgements/" + acknowledgement.name),
                        metaData = {
                            customMetadata: {
                                'fileType': acknowledgement.type,
                                'fileName': acknowledgement.name,
                                'fileSize': acknowledgement.size,
                                'tenantId': tenantId
                            }
                        };

                    $firebaseStorage(acknowledgementRef).$put(acknowledgement, metaData).$complete(function (snapshot) {
                        $firebaseArray(ref).$loaded().then(function(data) {
                            if(data.length == 1) {
                                rootRef.child('admin-tin-requests').child(data[0].$id).update({acknowledgementUrl: snapshot.downloadURL, ackGenerated: true});
                            }
                        });
                        ackFileFormInstance.option('disabled', false);
                        ackFileFormInstance.reset();
                    });
            });
        }
    }
})();