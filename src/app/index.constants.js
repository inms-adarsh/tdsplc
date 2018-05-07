(function ()
{
    'use strict';

    angular
        .module('tdsplc')
    .constant('loginRedirectPath', 'app.home.login')
    .constant('SIMPLE_LOGIN_PROVIDERS', ['password','facebook','google'])
    .factory('auth', ["$firebaseAuth", function ($firebaseAuth) {
      return $firebaseAuth();
    }]);
})();
