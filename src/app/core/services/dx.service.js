(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('dxUtils', dxUtils);

    /** @ngInject */
    function dxUtils($window, $q) {
        // Private variables

        var service = {
            createGrid: createGrid
        };

        return service;

        //////////

        /**
         * Return default grid Configuration
         */
        function createGrid(datasource) {
            var gridOptions = {
                loadPanel: {
                    enabled: true
                },
                scrolling: {
                    mode: 'virtual',
                    useNative: true
                },
                headerFilter: {
                    visible: true
                },
                filterRow: {
                    visible: true
                },
                searchPanel: {
                    visible: true,
                    width: 240,
                    placeholder: 'Search...'
                },
                columnChooser: {
                    enabled: false
                },
                editing: {
                    allowAdding: false,
                    allowUpdating: false,
                    allowDeleting: false,
                    mode: 'batch'
                },
                selection: {
                    mode: 'multiple',
                    showCheckBoxesMode: 'always'
                },
                onContentReady: function (e) {
                    e.component.option('loadPanel.enabled', false);
                },
                showColumnLines: true,
                showRowLines: true,
                //showBorders: true,
                rowAlternationEnabled: false,
                columnAutoWidth: true,
                height: 520
            };
            return gridOptions;

        }


    }
}());