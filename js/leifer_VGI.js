var map;

    require([
    	"esri/config",
    	"esri/map",
        "esri/dijit/LocateButton",
    	"esri/SnappingManager",
    	"esri/dijit/editing/Editor",
        "esri/dijit/Scalebar",
        "esri/dijit/HomeButton",
        "esri/dijit/Search",
    	"esri/layers/FeatureLayer",
    	"esri/tasks/GeometryService",
    	"esri/toolbars/draw",
        "esri/dijit/PopupMobile", 
        "esri/dijit/PopupTemplate",
        "dojo/on",
    	"dojo/keys",
    	"dojo/parser",
    	"dojo/_base/array",
    	"dojo/i18n!esri/nls/jsapi",
    	"dijit/layout/BorderContainer",
    	"dijit/layout/ContentPane",
        "dojo/dom",
    	"dojo/domReady!"
    	], function (
    		esriConfig,
            map,
            LocateButton,
            SnappingManager,
            Editor,
            Scalebar,
            HomeButton,
            Search,
            FeatureLayer,
    		GeometryService,
            draw,
            PopupMobile,
            PopupTemplate,
            on,
            keys,
            parser,
            arrayUtils,
            i18n,
            dom
    		) {

    		parser.parse();

    		//snapping is enabled for this sample-we changed the tool to reflect this
    		i18n.toolbars.draw.start += "<br/>Press <b>CTRL</b> to enable snapping";
    		i18n.toolbars.draw.addPoint += "<br/>Press <b>CTRL</b> to enable snapping";

    		//This sample requries a proxy page to handle communctions with the arcgis server services.
    		esriConfig.defaults.io.proxyUrl = "/proxy/";

    		//This service is for dev and testing only. ESRI says to make your own!
    		esriConfig.defaults.GeometryService = new GeometryService("https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

            var popup = new esri.dijit.PopupMobile({}, dojo.create("div"));

    		map = new map("map", {
    			basemap: "topo",
    			center: [-91.501748, 44.798294],
    			zoom: 16,
                infoWindow: popup
    		})

            var geoLocate = new LocateButton({
                map: map
            }, "LocateButton");
            geoLocate.startup();

            //scalebar
            var scalebar = new Scalebar({
                map: map,
                scalebarUnit: "english",
                attachTo: "bottom-left"
            });

            var home = new HomeButton({
                map: map
            }, "HomeButton");
            home.startup();

            var s = new Search({
                enableButtonMode: true, //this enables the search widget to display as a single button
                enableLabel: false,
                enableInfoWindow: true,
                showInfoWindowOnSelect: false,
                map: map
            }, "search");
            s.startup();

    		map.on("layers-add-result", initEditing);

            //start mobile popup build and add feature layers
            //Popup content
            var template = new esri.dijit.PopupTemplate({
                title: "Oddities",
                description: "{ODDITY}",
                showAttachments: true
            });
    		var operationsPointLayer = new FeatureLayer("https://gis14.uwec.edu/arcgis/rest/services/leiferdj/leifer_vgi_pt42/FeatureServer/0", {
    		  mode: FeatureLayer.MODE_ONDEMAND,
    		  outFields: ["*"],
              infoTemplate: template
    		});

            //Popup content 2
            var template = new esri.dijit.PopupTemplate({
                title: "Stairs:",
                description: "{Stairs}",
                showAttachments: true
            });
            var operationsLineLayer = new FeatureLayer("https://gis14.uwec.edu/arcgis/rest/services/leiferdj/leifer_vgi_pt42/FeatureServer/1", {
    		  mode: FeatureLayer.MODE_ONDEMAND,
    		  outFields: ["*"],
              infoTemplate: template              
    		});

            //Popup content 3
            var template = new esri.dijit.PopupTemplate({
                title: "Field Status:",
                description: "{Field_Status}",
                showAttachments: true
            });

            var operationsPolygonLayer = new FeatureLayer("https://gis14.uwec.edu/arcgis/rest/services/leiferdj/leifer_vgi_pt42/FeatureServer/2", {
    		  mode: FeatureLayer.MODE_ONDEMAND,
    		  outFields: ["*"],
              infoTemplate: template
    		});

            map.addLayers([
            	operationsPointLayer, operationsLineLayer, operationsPolygonLayer
            ]);

            function initEditing (event) {
            	var featureLayerInfos = arrayUtils.map(event.layers, function (layer) {
            		return {
            			"featureLayer": layer.layer
            		};
            	});

            	var settings = {
            		map: map,
            		layerInfos: featureLayerInfos
            	};
            	var params = {
            		settings: settings
            	};
            	var editorWidget = Editor(params, 'editorDiv');
            	editorWidget.startup();

            	/*snapping default to CMD key in mac and ctrl in pc
            	specify "snapKey" option if you want a different key combo for snappage*/
            	man.enableSnapping();


            }
    });


            function toggleContentPane(){
               var contentPane = document.getElementById("contentPane");
                   contentPane.style.height = window.innerHeight - 60+"px";
                if(contentPane.style.right == "75px"){
                   contentPane.style.right = "-250px";
            } else {
                   contentPane.style.right = "75px";
            }
}
