/**
 * infoPanelCtrl class handles rendering of left hand side information panels
 * @module controllers
 * @class infoPanelCtrl
 *
 */
allControllers.controller('infoPanelCtrl', ['$scope','$rootScope', '$element', 'StyleService', 'PreviewMapService','RenderHandlerService', 'UtilitiesService',
                                            function ($scope,$rootScope, $element, StyleService, PreviewMapService,RenderHandlerService, UtilitiesService) {

    var cswRecords = $scope.$parent.infoPanelCsw.cswRecords;
    var featureArr = [];
    var i,j;
    var sld_body = "";
    $scope.wmsUrls = {};
    $scope.wmsLegends = {};
    
    /**
     * Used to draw a layer/feature etc. on map using a csw record 
     * @method addCSWRecord
     * @param layer to be displayed
     * @param cswRecord of layer to be displayed
     */
    $scope.addCSWRecord = function(layer,cswRecord){
        RenderHandlerService.renderCSWRecord(layer,cswRecord);
    };
    
    /**
     * Used to check if layer can be drawn on map (is supported)
     * @method isSupportedLayer
     * @param layer
     * @return returns true if the layer can be displayed on map
     */
    $scope.isSupportedLayer = function(layer) {
        return RenderHandlerService.isSupportedLayer(layer);
    };
    
    /**
     * 
     * @method hasDisruptedProvider
     * @param layer layer
     * @param cswRecord CSW records
     */
    $scope.hasDisruptedProvider = function(layer, cswRecord) {
        if (layer.hasOwnProperty("nagiosFailingHosts")) {
            for (var i=0; i<layer.nagiosFailingHosts.length; i++) {
                // loop over services
                for (var k=0; k<cswRecord.onlineResources.length; k++) {
                    if (cswRecord.onlineResources[k].url.indexOf(layer.nagiosFailingHosts[i])>=0) {
                        return true;
                    }

                }
            }
        }
        return false;
    };
    
    // Get the legend style, if there is one
    if ($scope.$parent.infoPanelCsw.proxyStyleUrl != undefined && $scope.$parent.infoPanelCsw.proxyStyleUrl.length>0) {
        StyleService.getLegendStyle($scope.$parent.infoPanelCsw.proxyStyleUrl).then(
        
        function(response) {
            // AngularJS will come here if status code is 200..299, but only status code 200 will return a complete response
            if (response.status==200 && response.data.length < 2000) {
                sld_body = escape(response.data);
                // Gather up lists of legend URLs
                for (i=0; i<cswRecords.length; i++) {
                    var onlineResources=cswRecords[i].onlineResources;
                    for (j=0; j<onlineResources.length; j++) {
                        if (onlineResources[j].type=='WMS') {
                            var params = 'REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                                + '&LAYER='+onlineResources[j].name+'&LAYERS='+onlineResources[j].name;  
                            // If there is a style, then use it
                            if (sld_body.length>0) {
                                params += '&SLD_BODY='+sld_body+'&LEGEND_OPTIONS=forceLabels:on;minSymbolSize:16';
                            }
                            $scope.wmsLegends[cswRecords[i].adminArea]=UtilitiesService.addUrlParameters(onlineResources[j].url, params);
                        }
                    }
                }     
            }
        });
        
    } else {
        for (i=0; i<cswRecords.length; i++) {
            var onlineResources=cswRecords[i].onlineResources;
            for (j=0; j<onlineResources.length; j++) {
                if (onlineResources[j].type=='WMS') {
                    var params = 'REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                        + '&LAYER='+onlineResources[j].name+'&LAYERS='+onlineResources[j].name+'&WIDTH=188';   
                    $scope.wmsLegends[cswRecords[i].adminArea]=UtilitiesService.addUrlParameters(onlineResources[j].url, params);
                }
            }
        }
    }
    
    // Gather up BBOX coordinates to calculate the centre and envelope
    for (i=0; i<cswRecords.length; i++) {
        var bbox = cswRecords[i].geographicElements[0];
        if (bbox != undefined && (bbox.westBoundLongitude!=0 || bbox.northBoundLatitude!=0 || bbox.eastBoundLongitude!=0 || bbox.southBoundLatitude!=0) 
            && (bbox.eastBoundLongitude!=180 || bbox.westBoundLongitude!=180 || bbox.northBoundLatitude!=90 || bbox.southBoundLatitude!=-90)) {
            featureArr.push(turf.point([bbox.westBoundLongitude, bbox.northBoundLatitude]));
            featureArr.push(turf.point([bbox.westBoundLongitude, bbox.southBoundLatitude]));
            featureArr.push(turf.point([bbox.eastBoundLongitude, bbox.southBoundLatitude]));
            featureArr.push(turf.point([bbox.eastBoundLongitude, bbox.northBoundLatitude]));
        }

        // Gather up lists of information URLs 
        var onlineResources=cswRecords[i].onlineResources;
        for (j=0; j<onlineResources.length; j++) {
            if (onlineResources[j].type=='WMS') {
                var params = "SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&LAYERS="
                        + escape(onlineResources[j].name) + "&SRS=EPSG:4326&BBOX="+bbox.westBoundLongitude+","+bbox.southBoundLatitude+","+bbox.eastBoundLongitude+","+bbox.northBoundLatitude
                        + "&WIDTH=400&HEIGHT=400";
                $scope.wmsUrls[cswRecords[i].adminArea]=UtilitiesService.addUrlParameters(onlineResources[j].url, params);
            }
        }
    }
    


    // Use 'turf' to calculate the centre point of the BBOXES, use this to re-centre the map
    // Only calculate centre if the coords are not dispersed over the globe
    var reCentrePt = {};
    if (featureArr.length>0) {
        // Calculate the envelope, if not too big then re-centred map can be calculated
        var fc = turf.featureCollection(featureArr);
        var envelopePoly = turf.envelope(fc);
       
        if (envelopePoly.geometry.coordinates[0][1][0] - envelopePoly.geometry.coordinates[0][0][0] < 30 && envelopePoly.geometry.coordinates[0][2][1] - envelopePoly.geometry.coordinates[0][0][1] < 30) {
            var featureColl = turf.featureCollection(featureArr);
            // Calculate centre and re-centre the map
            var centerPt = turf.center(featureColl);
            if (centerPt.geometry.coordinates != undefined && centerPt.geometry.coordinates.length==2 
                && !isNaN(centerPt.geometry.coordinates[0]) && !isNaN(centerPt.geometry.coordinates[1])) {            
                reCentrePt = { latitude: centerPt.geometry.coordinates[1], longitude: centerPt.geometry.coordinates[0] };
            }
        }
    }
    
    // Set initial configuration of the map
    PreviewMapService.mapInit($scope.$parent.infoPanelCsw.name, $scope, reCentrePt);
    
}]);





    
    
    
    
    
