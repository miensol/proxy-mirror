(function(){

    var app = angular.module('proxyMirrorApp');

    var ResponseViewModel = function(response, $sce){
        angular.extend(this, response);
        this.displayAsIframe = !!this.bodyAsBase64;
        this.iframeSrc = ['data:', this.headers['Content-Type'],';base64, ', this.bodyAsBase64].join('');
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    app.controller('MainCtrl', function ($scope,$sce, sessionStorage) {
        $scope.sessions = sessionStorage.sessions;
        $scope.selectedSessions = [];

        $scope.afterSessionSelectionChange = function(ngRow){
            if(ngRow.selected){
                $scope.selectSession(ngRow.entity);
            }
        };

        $scope.sessionsGrid = {
            data: 'sessions',
            enableColumnResize: true,
            multiSelect: false,
            selectedItems: $scope.selectedSessions,
            afterSelectionChange: $scope.afterSessionSelectionChange,
            columnDefs:[{
                field: 'id', displayName: '#', width: 40, resizable: false
            },{
                field: 'response.statusCode', displayName: 'Code', width: 50, resizable: false
            },{
                field: 'request.urlObj.path', displayName: 'Url', width: '*'
            },{
                field: 'request.urlObj.host', displayName: 'Host', width: 150
            },{
                field: 'request.method', displayName: 'Method', width: 50, resizable: false
            },{
                field: 'response.contentType', displayName: 'Type', width: 100, resizable: false
            }]
        };

        $scope.selectSession = function(session){
            $scope.request = session.request;
            $scope.response = new ResponseViewModel(session.response, $sce);
        };

        $scope.$watch('sessionsGrid.selectedSessions', function(newItems){
            var items = newItems || [],
                selectedSession = items[0];
            if(selectedSession){
                $scope.selectSession(selectedSession);
            }
        });
    });


}());

