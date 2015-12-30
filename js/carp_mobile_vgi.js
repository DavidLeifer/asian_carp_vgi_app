  jQuery.fn.exists = function (){
    return jQuery(this).length > 0;
  };

  // --------------------------------------------------------------------
  // Main function that will be called at the bottom of the page to
  // initialize and start the application lifecycle
  // --------------------------------------------------------------------
  function applicationInitialize(){
    var maps = {
      map: null,
      collectMode: false,
      carp8Layer: null,
      locator: null,
      locatorURL: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      carp8LayerURL: "https://gis14.uwec.edu/arcgis/rest/services/leiferdj/carp8/FeatureServer/0",
      center: [-90.145746, 37.978284]
    };

    $.mobile.pagecontainer({ defaults: true });

    $.mobile.pagecontainer({
      create: function (event, ui){
        // ----------------------------------------------------
        // Invoke function to initialize the code for the
        // ArcGIS API for JavaScript
        // ----------------------------------------------------
        $(".ui-loader").show();
        initializeEsriJS();
      }
    });

    function initializeEsriJS(){
      require([
          "dojo/_base/array",
          "dojo/_base/lang",
          "dojo/dom-construct",
          "dojo/on",
          "dojo/parser",
          "dojo/query!css3",
          "esri/Color",
          "esri/config",
          "esri/dijit/AttributeInspector",
          "esri/dijit/Scalebar",
          "esri/dijit/Geocoder",
          "esri/dijit/HomeButton",
          "esri/dijit/LocateButton",
          "esri/dijit/PopupMobile",
          "esri/geometry/webMercatorUtils",
          "esri/graphic",
          "esri/InfoTemplate",
          "esri/layers/FeatureLayer",
          "esri/map",
          "esri/symbols/SimpleLineSymbol",
          "esri/symbols/SimpleMarkerSymbol",
          "esri/tasks/locator",
          "esri/tasks/query", "dojo/domReady!"
        ], function (array, lang, domConstruct, on, parser, query, Color, esriConfig, AttributeInspector, Scalebar, Geocoder,
          HomeButton, LocateButton, PopupMobile, webMercatorUtils, Graphic, InfoTemplate, FeatureLayer, Map,
          SimpleLineSymbol, SimpleMarkerSymbol, Locator, Query){

          parser.parse();
          // ----------------------------------------------------
          // Create the symbology for the selected feature,
          // when a Popup opens
          // ----------------------------------------------------
          var slsHighlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([38, 38, 38, 0.7]), 2);
          var sms = new SimpleMarkerSymbol();
          sms.setPath("M21.5,21.5h-18v-18h18V21.5z M12.5,3V0 M12.5,25v-3 M25,12.5h-3M3,12.5H0");
          sms.setSize(45);
          sms.setOutline(slsHighlightSymbol);
          var infoWindowPopup = new PopupMobile({markerSymbol: sms}, domConstruct.create("div"));

          // ----------------------------------------------------
          // Dictionary objects to provide domain value lookup for fields in popups
          // ----------------------------------------------------
          var severityFieldDomainCodedValuesDict = {};
          var requestTypeFieldDomainCodedValuesDict = {};

          // ----------------------------------------------------
          // InfoTemplate for the FeatureLayer
          // ----------------------------------------------------
          var featureLayerInfoTemplate = new InfoTemplate();
          featureLayerInfoTemplate.setTitle("<center><b>${Name}</b></center>");
          var infoTemplateContent = 
            "<b>Common Name: </b>${Name}"+
            "<br/><b>Genus: </b>${severity:severityDomainLookup}"+
            "<br/><b>Species: </b>${requesttype:requestTypeDomainLookup}"+
            "<br/><b>Date: </b>${Date:DateFormat}"+
            "<br><b>Verified on: </b>${Verified:DateFormat}"+
            "<br><b>Water Temperature: </b> ${Water_temp}&deg;C"+
            "<br><b>Weight: </b> ${Weight} grams"+
            "<br><b>Length: </b> ${Length} millimeters"+
            "<br><b>Comments: </b> ${Comments}"

          featureLayerInfoTemplate.setContent(infoTemplateContent);

          // ----------------------------------------------------
          // Formatting functions for infoTemplate
          // ----------------------------------------------------
          severityDomainLookup = function (value, key, data){
            return severityFieldDomainCodedValuesDict[value];
          };
          requestTypeDomainLookup = function (value, key, data){
            return requestTypeFieldDomainCodedValuesDict[value];
          };
          // ----------------------------------------------------
          // Initialize the main User Interface components
          // ----------------------------------------------------
          maps.map = new Map("ui-map", {
            sliderOrientation: "horizontal",
            sliderPosition: "bottom-right",
            basemap: "topo",
            center: maps.center,
            zoom: 7,
            sliderStyle: "small",
            infoWindow: infoWindowPopup
          });

          maps.locator = new Locator(maps.locatorURL);

          var scalebar = new Scalebar({
                map: maps.map,
                scalebarUnit: "english",
                attachTo: "bottom-left"
            });

          var geocoder = new Geocoder({
            arcgisGeocoder: {
              placeholder: "Search "
            },
            map: maps.map
          }, "ui-dijit-geocoder");

          var geoLocate = new LocateButton({
            map: maps.map
          }, "ui-dijit-locatebutton");

          var homeButton = new HomeButton({
            map: maps.map
          }, "ui-home-button-hidden");

          // ----------------------------------------------------
          // Initialize the FeatureLayer, LayerInfo, and
          // AttributeInspector
          // ----------------------------------------------------
          maps.carp8Layer = new FeatureLayer(maps.carp8LayerURL,
            {mode: FeatureLayer.MODE_ONEDEMAND,
              infoTemplate: featureLayerInfoTemplate,
              outFields: ["*"]
            });

          var layerInfoArray = [
            {
              "featureLayer": maps.carp8Layer,
              "showAttachments": true,
              "showDeleteButton": false,
              "isEditable": true,
              "fieldInfos": [
                {
                  "fieldName": "Name",
                  "label": "Name",
                  "isEditable": true
                },
                {
                  "fieldName": "severity",
                  "label": "Genus",
                  "isEditable": true
                },
                {
                  "fieldName": "requesttype",
                  "label": "Species",
                  "isEditable": true
                },                
                {
                  "fieldName": "Date",
                  "label": "Date",
                  "isEditable": true
                },
                {
                  "fieldName": "Verified",
                  "label": "Verified",
                  "isEditable": true
                },
                {
                  "fieldName": "Water_temp",
                  "label": "Water temp (&deg;C)",
                  "isEditable": true
                },
                {
                  "fieldName": "Weight",
                  "label": "Weight (g)",
                  "isEditable": true,
                  "visible": true
                },
                {
                  "fieldName": "Length",
                  "label": "Length (mm)",
                  "isEditable": true,
                  "visible": true
                },
                {
                  "fieldName": "Comments",
                  "label": "Comments",
                  "isEditable": true,
                  "stringFieldOption": AttributeInspector.STRING_FIELD_OPTION_TEXTAREA
                }
              ]
            }
          ];

          var attributeInspector = new AttributeInspector({
            layerInfos: layerInfoArray
          }, "ui-attributes-container");

          // ----------------------------------------------------
          // Returns the Feature Template given the Coded Value
          // ----------------------------------------------------
          function getFeatureTemplateFromCodedValueByName(item){
            var returnType = null;
            $.each(maps.carp8Layer.types, function (index, type){
              if (type.name === item) {
                returnType = type.templates[0];
              }
            });
            return returnType;
          }

          // ----------------------------------------------------
          // Initializes event handler for map and prepares the
          // FeatureTemplate
          // ----------------------------------------------------
          function addCarp8Feature(item){
            $("#ui-collection-prompt").popup("open");
            var citizenRequestFeatureTemplate = getFeatureTemplateFromCodedValueByName(item);

            var mapClickEventHandler = on(maps.map, "click", function (event){
              //only capture one click
              mapClickEventHandler.remove();
              // set back to false, since the map has been clicked on.
              maps.collectMode = false;

              var currentDate = new Date();
              //  citizenRequestFeatureTemplate.prototype.attributes);
              var newAttributes = lang.mixin({}, citizenRequestFeatureTemplate.prototype.attributes);
              newAttributes.requestdate = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(),
                currentDate.getUTCDate(), currentDate.getUTCHours(), currentDate.getUTCMinutes(),
                currentDate.getUTCSeconds(), 0);
              var newGraphic = new Graphic(event.mapPoint, null, newAttributes);
              // ----------------------------------------------------
              // Creates the new feature in the citizen request
              // FeatureLayer
              // ----------------------------------------------------
              maps.carp8Layer.applyEdits([newGraphic], null, null, function (adds){
                var query = new Query();
                var res = adds[0];
                query.objectIds = [res.objectId];
                // ----------------------------------------------------
                // Query the carp8 FeatureLayer for the
                // Graphic that was just added, well use its geometry
                // to lookup the address at that location
                // ----------------------------------------------------
                maps.carp8Layer.queryFeatures(query, function (result){
                  if (result.features.length > 0) {
                    var currentFeature = result.features[0];
                    var currentFeatureLocation = webMercatorUtils.webMercatorToGeographic(currentFeature.geometry);
                    // ----------------------------------------------------
                    // Convert the feature's location to a real world
                    // address using ArcGIS.com locator service
                    // ----------------------------------------------------
                    maps.locator.locationToAddress(currentFeatureLocation, 100, function (candidate){
                      var address = [];
                      var displayAddress;
                      if (candidate.address) {
                        if (candidate.address.Address) {
                          address.push(candidate.address.Address);
                        }
                        if (candidate.address.City) {
                          address.push(candidate.address.City + ",");
                        }
                        if (candidate.address.Region) {
                          address.push(candidate.address.Region);
                        }
                        if (candidate.address.Postal) {
                          address.push(candidate.address.Postal);
                        }
                        displayAddress = address.join(" ");
                      }
                      else {
                        displayAddress = "No address for this location";
                      }
                      // ----------------------------------------------------
                      // Tell jQuery Mobile to navigate to the page containing
                      // the AttributeInspector
                      // ----------------------------------------------------
                      $.mobile.changePage("#ui-attributes-page", null, true, true);
                      //display the geocoded address on the attribute dialog.
                      $("#currentAddress")[0].textContent = displayAddress;
                    }, function (error){
                      console.warn("Unable to find address, maybe there are no streets at this location",
                        error.details[0]);
                      // ----------------------------------------------------
                      // Tell jQuery Mobile to navigate to the page containing
                      // the AttributeInspector
                      // ----------------------------------------------------
                      $.mobile.changePage("#ui-attributes-page", null, true, true);
                      //display the geocode error on the attribute dialog.
                      $("#currentAddress")[0].textContent = error.details[0];
                    });
                  }
                  else {
                    console.warn("Unable to locate the feature that was just collected.");
                  }
                });
              }, function (error){
                // do some great error catching
                console.error(JSON.stringify(error));
              });
            });

          }

          function layersAddResultEventHandler(event){
            var layersArray = event.layers;

            $.each(layersArray, function (index, value){
              var currentLayer = value.layer;
              if (currentLayer.hasOwnProperty("renderer")) {
                var renderer = currentLayer.renderer;
                if (renderer.hasOwnProperty("infos")) {
                  var infos = renderer.infos;
                  // ----------------------------------------------------
                  // unordered list in parent div ui-features-panel
                  // ----------------------------------------------------
                  $("#ui-feature-list").append("<li data-role=\"list-divider\" class=\"ui-li-divider ui-bar-inherit ui-first-child\">Tag a sighting</li>");
                  $.each(infos, function (j, info){
                    severityFieldDomainCodedValuesDict[info.value] = info.label;
                    // ----------------------------------------------------
                    // Initialize an event handler for the list item click
                    // ----------------------------------------------------
                    var listItem = $("<li/>").on("click", function (event){
                      maps.map.setMapCursor("pointer");
                      // ----------------------------------------------------
                      // wire the click event to call addCarp8Feature
                      // ----------------------------------------------------
                      addCarp8Feature(info.label);
                      maps.collectMode = true;
                    });
                    listItem.attr("data-theme", "a");
                    var listContent = [];
                    listContent.push("<a href=\"#ui-map-page\" class=\"ui-btn ui-btn-icon-right ui-icon-plus\">" + info.label + "</a>");
                    listItem.append(listContent.join(""));
                    // ----------------------------------------------------
                    // unordered list in parent div ui-features-panel
                    // ----------------------------------------------------
                    $("#ui-feature-list").append(listItem);
                  });
                }
              }
            });
          }

          function initializeEventHandlers(){
            on(maps.map, "load", function (event){
              maps.map.infoWindow.resize(185, 100);
              on(maps.map, "layers-add-result", layersAddResultEventHandler);
            });

            on(maps.carp8Layer, "error", function (event){
              console.error("carp8Layer failed to load.", JSON.stringify(event.error));
              $(".ui-loader").hide();
            });

            on(maps.carp8Layer, "load", function (event){
                var featureLayerTemplates = maps.carp8Layer.templates;
                if (maps.carp8Layer.hasOwnProperty("fields")) {
                  var fieldsArray = maps.carp8Layer.fields;
                  array.forEach(fieldsArray, function (field, i){
                    if (field.name === "severity") {
                      if (field.hasOwnProperty("domain")) {
                        if (field.domain.hasOwnProperty("codedValues")) {
                          var codedValuesArray0 = field.domain.codedValues;
                          array.forEach(codedValuesArray0, function (codedValue){
                            severityFieldDomainCodedValuesDict[codedValue.code] = codedValue.name;

                          });
                        }
                      }
                    }
                    if (field.name === "requesttype") {
                      if (field.hasOwnProperty("domain")) {
                        if (field.domain.hasOwnProperty("codedValues")) {
                          var codedValuesArray1 = field.domain.codedValues;
                          array.forEach(codedValuesArray1, function (codedValue){
                            requestTypeFieldDomainCodedValuesDict[codedValue.code] = codedValue.name;

                          });
                        }
                      }
                    }
                  });
                }
                else {
                  console.error("Unable to find property fields in: ", JSON.stringify(maps.carp8Layer));
                }
                $(".ui-loader").hide();
              }
            );

            on(maps.carp8Layer, "click", function (event){
              maps.map.infoWindow.setFeatures([event.graphic]);
            });

            on(attributeInspector, "attribute-change", function (event){
              var feature = event.feature;
              if (event.fieldName && event.fieldValue) {
                feature.attributes[event.fieldName] = event.fieldValue;
                feature.getLayer().applyEdits(null, [feature], null);
              }
              else {
                feature.getLayer().applyEdits(null, [feature], null);
              }
            });

            on(geoLocate, "locate", function (event){
              var coords = event.position.coords;
            });

            on(infoWindowPopup, "show", function (event){
              if ($("*.esriMobileNavigationItem.left > img[src]").exists()) {
                $("*.esriMobileNavigationItem.left > img").removeAttr("src");
              }
              if ($("*.esriMobileNavigationItem.right > img[src]").exists) {
                $("*.esriMobileNavigationItem.right > img").removeAttr("src");
              }
            });

            geocoder.startup();
            geoLocate.startup();
            homeButton.startup();

            $("#ui-home-button").click(function (){
              homeButton.home();
              $("#ui-settings-panel").panel("close");
            });

            $(".basemapOption").click(swapBasemap);

            $("#ui-features-panel").on("popupafteropen", function (event, ui){
              $("#ui-features-panel").on("popupafterclose", function (event, ui){
                if (maps.collectMode) {
                  $("#ui-collection-prompt").show();
                }
                else {
                  $("#ui-collection-prompt").hide();
                }
                setTimeout(function (){
                  $("#ui-collection-prompt").popup("open");
                }, 15);
              });
            });

            $("#ui-collection-prompt").on("popupafteropen", function (event, ui){
              setTimeout(function (){
                $("#ui-collection-prompt").popup("close");
              }, 1200);
            });
          }

          // ----------------------------------------------------
          // Initialize Event Handlers and add the citizen request
          // layer to the map
          // ----------------------------------------------------
          initializeEventHandlers();
          maps.map.addLayers([maps.carp8Layer]);

        }
      ); // end require / function
    }

    function swapBasemap(event){
      var _basemapName = event.target.dataset.basemapname;
      maps.map.setBasemap(_basemapName);
      $("#ui-settings-panel").panel("close");
    }
  }
  // --------------------------------------------------------------------
  // Begin the sequence by calling the initialization function
  // --------------------------------------------------------------------
  $(function (){
    applicationInitialize();
  });
