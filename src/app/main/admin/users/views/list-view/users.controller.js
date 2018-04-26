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

        vm.userGridOptions =
            {
                bindingOptions: {
                    dataSource: 'vm.gridData'
                },
                columns: [{
                    caption: '#',
                    cellTemplate: function(cellElement, cellInfo) {
                        cellElement.text(cellInfo.row.rowIndex + 1)
                    }
                },{
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
                    }]
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
                    allowAdding: true,
                    allowUpdating: true,
                    allowDeleting: false,
                    mode: 'form',
                    form: userService.formOptions()
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
                onRowInserted: function(e) {
                    userService.saveUser(e.data);
                },
                onRowUpdated: function (e) {
                    userService.updateUser(e.key.$id, e.data);
                },
                onContentReady: function(e) {
                    gridInstance = e.component;
                }
            }

            angular.extend(vm.gridOptions, vm.userGridOptions);
    }
})();