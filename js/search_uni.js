require([
        "esri/map", 
		"esri/dijit/Search", 
		"esri/layers/FeatureLayer", 
		"esri/InfoTemplate", 
		"dojo/domReady!"
      ], function (Map, Search, FeatureLayer, InfoTemplate) {
         var map = new Map("map", {
            basemap: "gray",
            center: [-97, 38], // lon, lat
            zoom: 5
         });

         var s = new Search({
            enableButtonMode: true, //this enables the search widget to display as a single button
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: false,
            map: map
         }, "search");

         var sources = s.get("sources");

        /*Push the sources used to search, by default the ArcGIS Online World geocoder is included. 
		  In addition there is a feature layer of universities. 
		  The universities search is set up to find the "CONAME". 
		  A feature layer of us universities is set up to find based on the name.*/ 

         sources.push({
            featureLayer: new FeatureLayer("https://gis14.uwec.edu/arcgis/rest/services/leiferdj/Universities/MapServer/0"),
            searchFields: ["CONAME"],
            displayField: "CONAME",
            exactMatch: false,
            outFields: ["CONAME", "STREET", "CITY", "STATE"],
            name: "University",
            placeholder: "University of Wisconsin- Eau Claire",
            maxResults: 6,
            maxSuggestions: 6,  		 
	  
	         //Create an InfoTemplate and include fields
            infoTemplate: new InfoTemplate("United States Universities", "Name: ${CONAME}</br>Street: ${STREET}</br>City: ${CITY}</br>State: ${STATE}"),
            enableSuggestions: true,
            minCharacters: 0
         });

		//set the sources above to the search widget
         s.set("sources", sources);

         s.startup();

      });