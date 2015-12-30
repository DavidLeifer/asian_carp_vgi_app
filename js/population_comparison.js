require([
        "esri/map",
        "esri/layers/FeatureLayer",	
        "esri/tasks/query",
        "dijit/layout/ContentPane",
		"dijit/layout/BorderContainer",
        "dojox/widget/AnalogGauge",
        "dojox/widget/gauge/AnalogArcIndicator"		
       ]);

      var app = {};
      app.abbrLookup = { "Wisconsin": "WI" };
      function init() {
        app.map = new esri.Map("map", {
          basemap: "oceans",
          center: [-88.030750, 44.9],
          zoom: 7
        });

        var countiesUrl = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/2";
        var stateList = "'Wisconsin'";
        var wisconsinDef = dojo.string.substitute("STATE_NAME IN (${0})", [stateList]);
        var outFields = ["POP2007", "STATE_NAME", "NAME"];
        var outline = new esri.symbol.SimpleLineSymbol()
              .setColor(dojo.colorFromHex("#fff"));
        app.sym = new esri.symbol.SimpleFillSymbol()
              .setColor(new dojo.Color([52, 67, 83, 0.4]))
              .setOutline(outline);
        var renderer = new esri.renderer.SimpleRenderer(app.sym);

        var hColor = dojo.colorFromHex("#ff3");
        var hOutline = new esri.symbol.SimpleLineSymbol()
              .setColor(hColor).setWidth(4);
        app.highlight = new esri.symbol.SimpleFillSymbol()
              .setColor(new dojo.Color([0, 0, 0, 0]))
              .setOutline(hOutline);
        
        /* use new 10.1 query statistic definition to find 
           the value for the most populous county in Wisconsin*/
        var popQueryTask = new esri.tasks.QueryTask(countiesUrl);
        var popQuery = new esri.tasks.Query();
        var statDef = new esri.tasks.StatisticDefinition();
        statDef.statisticType = "max";
        statDef.onStatisticField = "POP2007";
        statDef.outStatisticFieldName = "maxPop";
        
        popQuery.returnGeometry = false;
        popQuery.where = wisconsinDef;
        popQuery.outFields = outFields;
        popQuery.outStatistics = [ statDef ];
        popQueryTask.execute(popQuery, handlePopQuery);

        //create a feature for counties in WISCO
        app.wiCounties = new esri.layers.FeatureLayer(countiesUrl, {
          "id": "Wisconsin",
          "mode": esri.layers.FeatureLayer.MODE_ONDEMAND,
          "outFields": outFields
        });
        //set a definition expression so only counties in WISCO are shown
        app.wiCounties.setDefinitionExpression(wisconsinDef);
        app.wiCounties.setRenderer(renderer);

        dojo.connect(app.wiCounties, "onMouseOver", showInfo);

        app.map.addLayer(app.wiCounties);

        // create the gauge
        createGauge(dojo.byId("gauge"), 0);
      }

      function showInfo(evt) {
        app.map.graphics.clear();
        app.map.graphics.add(
          new esri.Graphic(
            evt.graphic.geometry, 
            app.highlight
          )
        );
        updateGauge(evt.graphic);
      }

      function createGauge(gdiv, startValue) {
        var indicator = new dojox.widget.gauge.AnalogArcIndicator({
          interactionMode: "gauge",
          noChange: false,
          value: startValue,
          width: 20,
          offset: 65,
          color: "#ff3",
          title: "value",
          hideValue: true,
          duration: 100 // default is 1000
        });

        app.gauge = new dojox.widget.AnalogGauge({
          background: [200, 200, 200, 0.0],
          width: parseInt(gdiv.style.width, 10),
          height: parseInt(gdiv.style.height, 10),
          cx: parseInt(gdiv.style.width, 10) / 2,
          cy: parseInt(gdiv.style.height, 10) * 0.75,
          style: "position: absolute;",
          radius: parseInt(gdiv.style.width, 10) / 2,
          useTooltip: false,
          ranges: [{ low: 0, high: 100, color: "rgba(255,0,0,0)" }],
          majorTicks: { offset: 90, interval: 25, length: 3, color: 'black' },
          indicators: [ indicator ]

        }, dojo.create("div", null, gdiv));
        app.gauge.startup();

        // adds the percent label
        app.percentDiv = dojo.create("div",{
          "innerHTML": "0%",
          "style": {
            "position": "absolute",
            "bottom": app.gauge.height - app.gauge.cy + "px",
            "left": "-1000px",
            "font-family": "verdana",
            "font-size": "24px",
            "color":"#000"
          }
        });
        dojo.place(app.percentDiv, app.gauge.domNode);
        // put the percent label in the middle of the gauge
        var contentBox = dojo.contentBox(app.percentDiv);
        dojo.style(app.percentDiv, "left", app.gauge.cx + "px");
        dojo.style(app.percentDiv, "marginLeft", (-contentBox.w/2) + "px");
        if( app.gauge.cx ) {
          dojo.style(app.percentDiv, "marginBottom", (-contentBox.h/2) + "px");
        }
      }

      function updateGauge(g) {
        dojo.byId("county").innerHTML = "Highlighted: " + g.attributes.NAME + 
          " County, " + app.abbrLookup[g.attributes.STATE_NAME] + "<br />" + 
          "Population (2007): " + dojo.number.format(g.attributes.POP2007);
        var perc = parseInt((g.attributes.POP2007 / app.maxPop) * 100, 10);
        app.percentDiv.innerHTML = perc + "%";
        app.gauge.indicators[0].update(perc);
      }

      function handlePopQuery(result) {
        console.log('pop query...', result);
        app.maxPop = result.features[0].attributes.maxPop;
      }

      dojo.ready(init);