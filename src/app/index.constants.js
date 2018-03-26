(function ()
{
    'use strict';

    angular
        .module('tdsplc')
    .constant('loginRedirectPath', 'app.auth_login')
    .constant('SIMPLE_LOGIN_PROVIDERS', ['password','facebook','google'])
    .factory('auth', ["$firebaseAuth", function ($firebaseAuth) {
      return $firebaseAuth();
    }]);
})();
