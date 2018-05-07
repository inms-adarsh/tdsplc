(function ()
{
    'use strict';

    angular
        .module('app.home',
            [
                // 3rd Party Dependencies
                'dx'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.home', {
                abstract: true,
                url      : '/index',
                views    : {
                    'main@'                                 : {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.home': {
                        templateUrl: 'app/main/home/views/list-view/home.html',
                        controller : 'HomeController as vm'
                    }
                },
                bodyClass: 'home'
            }).state('app.home.register', {
                url      : '/home',
                templateUrl: 'app/main/auth/register/register.html',
                controller : 'RegisterController as vm',
                bodyClass: 'home'
            }).state('app.home.login', {
                url      : '/login',
                templateUrl: 'app/main/auth/login/login.html',
                controller : 'LoginController as vm',
                bodyClass: 'home'
            }).state('app.home.contactus', {
                url      : '/contact-us',
                templateUrl: 'app/main/home/views/contact/contact.html',
                controller : 'ContactController as vm',
                bodyClass: 'home'
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/home');


        // Navigation

    }
})();