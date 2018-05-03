(function () {
    'use strict';

    angular
        .module('app.paymentledger')
        .factory('paymentledgerService', paymentledgerService);

    /** @ngInject */
    function paymentledgerService($rootScope, $firebaseArray, $mdDialog, $mdToast, $firebaseObject, $compile, $q, adminService, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
        var tenantId = authService.getCurrentTenant(),
            formInstance,
            form27AInstance,
            fvuInstance,
            scope = $rootScope.$new(),
            settings = {};
        // Private variables

        adminService.getCurrentSettings().then(function (data) {
            settings = data;
        });

        var service = {
            addpaymentledger: addpaymentledger,
            calculateRevenue: calculateRevenue,
            approveSingleRecord: approveSingleRecord
        };

        return service;
        /**
         * Request Form
         */
        /**
         * Grid Options for request list
         * @param {Object} dataSource 
         */
     

        /**
         * Add New tin request
         */

        function addpaymentledger(formData) {
            if (!formData.date) {
                formData.date = new Date();
            }
            formData.date = formData.date.toString();
            var ref = rootRef.child('tenant-paymentledgers');

            formData.user = auth.$getAuth().uid;
            return firebaseUtils.addData(ref, formData);
        }

    
        /**
         * Calculate revenue
         * @param {*} data 
         */
        function calculateRevenue(data) {
            var date = new Date(),
                month = date.getMonth(),
                year = date.getFullYear();

            var ref = rootRef.child("/tenant-monthly-revenues/" + year + "/" + month + "/" + data.tenantId),
                totalref = rootRef.child("/tenant-revenues/" + data.tenantId),
                totalMonthlyref = rootRef.child("/monthly-revenues/" + year + "/" + month + "/"),
                totalYearlyref = rootRef.child("/yearly-revenues/" + year + "/");
            // Attach an asynchronous callback to read the data at our posts reference
            ref.once("value", function (snapshot) {
                var totalRevenue = 0;
                if (snapshot.val() && snapshot.val().totalRevenue) {
                    totalRevenue = snapshot.val().totalRevenue;
                } else {
                    totalRevenue = 0;
                }
                ref.update({ 'totalRevenue': totalRevenue + data.amount });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });

            totalref.once("value", function (snapshot) {
                var totalRevenue = 0;
                if (snapshot.val() && snapshot.val().totalRevenue) {
                    totalRevenue = snapshot.val().totalRevenue;
                } else {
                    totalRevenue = 0;
                }
                totalref.update({ 'totalRevenue': totalRevenue + data.amount });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
            
            totalMonthlyref.once("value", function (snapshot) {
                var totalRevenue = 0;
                if (snapshot.val() && snapshot.val().totalRevenue) {
                    totalRevenue = snapshot.val().totalRevenue;
                } else {
                    totalRevenue = 0;
                }
                totalMonthlyref.update({ 'totalRevenue': totalRevenue + data.amount });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });

            totalYearlyref.once("value", function (snapshot) {
                var totalRevenue = 0;
                if (snapshot.val() && snapshot.val().totalRevenue) {
                    totalRevenue = snapshot.val().totalRevenue;
                } else {
                    totalRevenue = 0;
                }
                totalYearlyref.update({ 'totalRevenue': totalRevenue + data.amount });
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }


         /**
         * Approve Single Record
         * @param {*} record 
         */
        function approveSingleRecord(record) {
            calculateRevenue(record);
                              
            var paymentledgerId = record.$id;
            delete record.$id;
            delete record.$conf;
            delete record.$priority;

            var ref = rootRef.child('tenant-paymentledgers').child(paymentledgerId);
            firebaseUtils.updateData(ref, record);

            var tenantLedger = rootRef.child('tenant-paymentledger-ledger').child(record.tenantId);
            record.mode = 'credit';
            record.credit = record.amount;
            firebaseUtils.addData(tenantLedger, record);

            var ref = rootRef.child('tenants').child(record.tenantId);
            firebaseUtils.getItemByRef(ref).$loaded().then(function (data) {
                var creditBalance = data.creditBalance ? data.creditBalance : 0,
                    requiredBalance = data.requiredBalance ? data.requiredBalance : 0,
                    discount = data.discount ? data.discount : 0;
                firebaseUtils.updateData(ref, { 'creditBalance': creditBalance + record.amount }).then(function (data) {
                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + record.tenantId);
                    var creditBalance = data.creditBalance;
                    firebaseUtils.fetchList(ref).then(function (requests) {
                        requests.forEach(function (request) {
                            var id = request.$id;
                            delete request.$id;
                            delete request.$conf;
                            delete request.$priority;
                            var extraCharge = settings.extraCharge ? settings.extraCharge : 0;
                            var totalCost = request.fees  - (request.fees * discount * 0.01) + extraCharge;
                            if (totalCost <= creditBalance || data.paymentledgerType == 'postpaid') {
                                var obj = { ackAttached: true, remarks: '', status: 2 };
                                rootRef.child('tenant-tin-requests-token/' + record.tenantId + '/' + id).update(Object.assign(request, obj));
                                rootRef.child('tenant-tin-requests/' + record.tenantId + '/' + request['barcode']).update(Object.assign(request, obj));
                                console.log(totalCost);
                                creditBalance = creditBalance - totalCost;
                                requiredBalance = requiredBalance - totalCost;
                                rootRef.child('tenants').child(record.tenantId).update({ 'creditBalance': creditBalance, 'requiredBalance': requiredBalance }).then(function () {
                                    var tenantLedger = rootRef.child('tenant-paymentledger-ledger').child(request.tenantId);
                                    request.mode = 'debit';
                                    request.debit = totalCost;
                                    request.acknowledgementNo = id;
                                    firebaseUtils.addData(tenantLedger, request);

                                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + request.tenantId + '/' + request.token);
                                    ref.update(null);
                                });

                            }
                        });
                    })
                });
            });

        }


    }
}());