(function () {
    'use strict';

    angular
        .module('app.admin.employees')
        .controller('UsersController', UsersController);

    /** @ngInject */
    function UsersController($mdDialog, $document, userService, msUtils, customers, dxUtils, auth, $firebaseArray, firebaseUtils, authService, settings, tenantInfo, $scope, $state) {
        var tenantId = authService.getCurrentTenant(),
            dxFormInstance,
            gridInstance,
            vm = this;

        var clientStatus = [{
            id: 'active',
            name: 'Enabled'
        }, {
            id: 'deactive',
            name: 'Disabled'
        }];

        var roles = [{
            id: 'superuser',
            name: 'Admin'
        }, {
            id: 'employee',
            name: 'Employee'
        }];

        // Data


        init();
        //////////

        function init() {
            vm.gridOptions = dxUtils.createGrid();
            var ref = rootRef.child('tenant-users').child(tenantId);

            vm.gridData = $firebaseArray(ref);
        }

        vm.buttonOptions = {
            text: "Submit",
            type: "success",
            useSubmitBehavior: false,
            bindingOptions: {
                'disabled': 'vm.btnDisabled'
            },
            validationGroup: "customerData",
            onClick: function (e) {
                //vm.btnDisabled = true;
                //saveRequest();
                var result = e.validationGroup.validate();

                if (result.isValid == true) {
                    $scope.visiblePopup = false;
                    var formData = dxFormInstance.option('formData');
                    userService.saveUser(formData);
                }
            }
        };


        vm.uploadPopupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '50%',
            height: 'auto',
            title: "Add Payment Request",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            }
        };

        vm.formOptionsItems = {

            bindingOptions: {
                formData: 'vm.users'
            },
            validationGroup: "customerData",
            colCount: 2,
            items: [
                {
                    dataField: 'email',
                    label: {
                        text: 'Email'
                    },
                    validationRules: [{
                        type: 'email',
                        message: 'Please enter valid e-mail address'
                    }, {
                        type: 'required',
                        message: 'Name is required'
                    }]
                }, {
                    dataField: 'usrPassword',
                    label: {
                        text: 'Password'
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Password is required'
                    }],
                    editorOptions: {
                        mode: 'password'
                    },
                    name: 'usrPassword'
                }, {
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
                    }],
                    formItem: {
                        visible: true
                    }
                }, {
                    dataField: 'role',
                    label: {
                        text: 'Role'
                    },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: roles,
                        displayExpr: 'name',
                        valueExpr: 'id'
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Select a Role'
                    }]
                }, {
                    dataField: 'position',
                    label: {
                        text: 'Position'
                    },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: clientStatus,
                        displayExpr: 'name',
                        valueExpr: 'id',
                        placeholder: 'Select'
                    },
                    validationRules: [{
                        type: 'required',
                        message: 'Select a Position'
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
                }],
            onContentReady: function (e) {
                dxFormInstance = e.component;
            }
        };

        vm.userGridOptions =
            {
                onToolbarPreparing: function (e) {
                    var dataGrid = e.component;

                    e.toolbarOptions.items.unshift(
                        {
                            location: "before",
                            widget: "dxButton",
                            options: {
                                text: 'Add New Employee',
                                icon: "plus",
                                type: 'default',
                                onClick: function (e) {
                                    $scope.visiblePopup = true;
                                }

                            }
                        }
                    );

                },
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                columns: [{
                    caption: '#',
                    cellTemplate: function (cellElement, cellInfo) {
                        cellElement.text(cellInfo.row.dataIndex + 1)
                    },
                    allowEditing: false
                }, {
                    dataField: 'name',
                    caption: 'Name',
                    validationRules: [{
                        type: 'required',
                        message: 'Name is required'
                    }],
                }, {
                    dataField: 'role',
                    caption: 'Role',
                    lookup: {
                        dataSource: roles,
                        displayExpr: "name",
                        valueExpr: "id"
                    }
                }, {
                    dataField: 'pendingRequests',
                    caption: 'Total Pending Requests'
                },
                {
                    dataField: 'phone',
                    caption: 'Phone',
                    dataType: 'number',
                    validationRules: [{
                        type: 'required',
                        message: 'Phone number is required'
                    }]
                }, {
                    dataField: 'email',
                    caption: 'Email/User Id',
                    validationRules: [{
                        type: 'email',
                        message: 'Please enter valid e-mail address'
                    }],
                    allowEditing: false
                }, {
                    dataField: 'address',
                    caption: 'Address'
                }, {
                    dataField: 'city',
                    caption: 'City'
                }, {
                    dataField: 'position',
                    caption: 'Position',
                    lookup: {
                        dataSource: clientStatus,
                        displayExpr: "name",
                        valueExpr: "id"
                    }
                }],
                export: {
                    enabled: true,
                    fileName: 'Users',
                    allowExportSelectedData: true
                },
                editing: {
                    allowAdding: false,
                    allowUpdating: true,
                    allowDeleting: false,
                    mode: 'row'
                },
                onRowRemoving: function (e) {
                    var d = $.Deferred();
                    var ref = rootRef.child('tenant-user-records').child(tenantId).child(e.data.$id).child('records').orderByChild('deactivated').equalTo(null);
                    firebaseUtils.fetchList(ref).then(function (data) {
                        if (data.length > 0) {
                            d.reject("Can not delete the record");
                        } else {
                            d.resolve();
                        }
                    });
                    e.cancel = d.promise();
                },
                onRowUpdated: function (e) {
                    userService.updateUser(e.key.$id, e.data);
                },
                onContentReady: function (e) {
                    gridInstance = e.component;
                },
                summary: {
                    totalItems: [{
                        column: '#',
                        summaryType: 'count'
                    }]
                }

            }

        angular.extend(vm.gridOptions, vm.userGridOptions);
    }
})();