(function () {
    'use strict';

    angular
        .module('app.payment')
        .factory('paymentService', paymentService);

    /** @ngInject */
    function paymentService($rootScope, $firebaseArray, $mdDialog, $mdToast, $firebaseObject, $compile, $q, adminService, authService, auth, firebaseUtils, dxUtils, config, msUtils, $firebaseStorage) {
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
            addPayment: addPayment,
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

        function addPayment(formData) {
            if (!formData.date) {
                formData.date = new Date();
            }
            formData.date = formData.date.toString();
            var ref = rootRef.child('tenant-payments');

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
        function approveSingleRecord(record, uid) {
           // calculateRevenue(record);

            var paymentId = record.$id;

            if(record.paymentMode === 'cash') {
                record.cashBy = uid;
            }
            delete record.$id;
            delete record.$conf;
            delete record.$priority;

            var ref = rootRef.child('tenant-payments').child(paymentId);
            firebaseUtils.updateData(ref, record);

            var tenantLedger = rootRef.child('tenant-payment-ledger').child(record.tenantId);
            record.mode = 'credit';
            record.credit = record.amount;
            firebaseUtils.addData(tenantLedger, record);

            var adminLedger = rootRef.child('payment-ledger');
            firebaseUtils.addData(adminLedger, record);

            var ref = rootRef.child('tenants').child(record.tenantId);
            firebaseUtils.getItemByRef(ref).$loaded().then(function (tenant) {
                var creditBalance = tenant.creditBalance ? tenant.creditBalance : 0,
                    requiredBalance = tenant.requiredBalance ? tenant.requiredBalance : 0,
                    discount = tenant.discount ? tenant.discount : 0;
                firebaseUtils.updateData(ref, { 'creditBalance': creditBalance + record.amount }).then(function (data) {
                    var ref = rootRef.child('tenant-pending-tin-requests-token/' + record.tenantId);
                    var creditBalance = data.creditBalance;
                    tenant.creditBalance = creditBalance;
                    firebaseUtils.fetchList(ref).then(function (requests) {
                        releaseAcknowledgemnts(requests, tenant, record.tenantId);
                    })
                });
            });

        }

        function releaseAcknowledgemnts(requests, tenant, tenantId) {            
            var creditBalance = tenant.creditBalance ? tenant.creditBalance : 0,
            requiredBalance = tenant.requiredBalance ? tenant.requiredBalance : 0,
            discount = tenant.discount ? tenant.discount : 0;
            var promises = requests.map(function (request) {
                return new Promise(function (resolve, reject) {
                    var id = request.$id;
                    delete request.$id;
                    delete request.$conf;
                    delete request.$priority;
                    var totalCost = request.fees - (request.fees * discount * 0.01) + request.extra || 0;
                    if (totalCost <= creditBalance || tenant.paymentType == 'postpaid') {
                        var obj = { ackAttached: true, remarks: '', status: 2 };
                        rootRef.child('tenant-tin-requests-token/' + tenantId + '/' + id).update(Object.assign(request, obj));
                        rootRef.child('tenant-tin-requests/' + tenantId + '/' + request['barcode']).update(Object.assign(request, obj));
                        creditBalance = creditBalance - totalCost;
                        
                        if(requiredBalance != 0 && requiredBalance >= totalCost) {
                            requiredBalance = requiredBalance - totalCost;
                        } else if(requiredBalance == 0 || requiredBalance < totalCost) {
                            requiredBalance = 0;
                        }

                        rootRef.child('tenants').child(tenantId).update({ 'creditBalance': creditBalance, 'requiredBalance': requiredBalance }).then(function () {
                            var mergeObj = {};
                            var tenantLedger = rootRef.child('tenant-payment-ledger').child(tenantId);
                            request.mode = 'debit';
                            request.debit = totalCost;
                            request.acknowledgementNo = id;
                            firebaseUtils.addData(tenantLedger, request);
                            mergeObj['tenant-pending-tin-requests-token/' + request.tenantId + '/' + request.token] = null;
                            rootRef.update(mergeObj);
                            return resolve({});
                        });
                    } else {
                        return resolve({});
                    }
                });
            });
        }


    }
}());