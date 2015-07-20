var Algorithm = Backbone.Model.extend({

    defaults: {
        name: '',
        about: '',
        description: '',
        citations: [],
        parameters: {}
    },

    initialize: function() {

    }

});


var Algorithms = Backbone.Collection.extend({
    model: Algorithm,
});


var AlgorithmSelectView = Backbone.View.extend({

    el: $('#algorithm-select'),

    events: {'change':'changeAlgorithm'},

    initialize: function() {

        var current = this.collection.at(0);
        this.select_map = {};

        _.each(this.collection.models,function(model) {
            this.select_map[model.get('name')] = model;
            var option = new Option(model.get('name'),model.get('name'));
            this.$el.append(option);
        },this);

        cluster_model = new ClusterModel({parameters:current.get('parameters')});
        this.cluster_view = new ClusterView({model:cluster_model});

        citations_model = new CitationsModel({citations:current.get('citations')});
        this.citations_view = new CitationsView({model:citations_model});

        about_model = new AboutModel({about:current.get('about')});
        this.about_view = new AboutView({model:about_model});

        this._render();
    },

    _render: function() {
        this.cluster_view.update();
        this.citations_view.update();
    },

    changeAlgorithm: function() {
        var citations = this.getModel(this.$el.val()).get('citations');
        this.citations_view.model.set({citations:citations});

        var parameters = this.getModel(this.$el.val()).get('parameters');
        this.cluster_view.model.set({parameters:parameters});

        var about = this.getModel(this.$el.val()).get('about');
        this.about_view.model.set({about:about});
    },

    getModel: function(name) {
        return this.select_map[name];
    },

    getName: function() {
        return this.$el.val();
    },

    getValidatedParameters: function() {
        return this.cluster_view.getValidatedParameters();
    }
});


var MapModel = Backbone.Model.extend({
    defaults: {
        center: [37.77, -122.4]
    },

    initialize: function() {

    }

});


var MapView = Backbone.View.extend({

    el:'map',

    initialize: function() {
        this.render();
    },

    render: function() {

        var that = this;

        var tileChoices = {
            "MapQuest": L.tileLayer(
                                    'https://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg',
                                    {maxZoom: 19}
                                    ),
            "MapQuest Sat": L.tileLayer(
                                        'https://otile2.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
                                        {maxZoom: 18}
                                        ),
            "OSM": L.tileLayer(
                               'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                               {maxZoom: 18}
                               ),
        };

        L.Icon.Default.imagePath = '/static/images/leaflet';
    
        this.map = L.map('map_canvas',{measureControl: true, layers:[tileChoices['OSM']]});
        this.map.locate({setView: true});
        this.map.on('locationfound',this.getLocation,this);
        this.map.on('locationerror',this.locationError,this);

        //this.editableItems = new L.FeatureGroup([]);
        this.clusterItems = new L.FeatureGroup([]);

        var drawControl = new L.Control.Draw({
                draw: {
                        polygon:   false,
                        circle:    false,
                        rectangle: false,
                        polyline: false,
                        marker: {repeatMode:true}
                     },
                edit: {
                        //featureGroup: this.editableItems
                        featureGroup: this.clusterItems
                }
        });

        // adapted from http://stackoverflow.com/questions/21125543/leaflet-draw-trash-button-delete-all-polygons-and-save

        L.Control.RemoveAllControl = L.Control.extend(
        {
            options:
            {
                position: 'topleft',
            },
            onAdd: function (map) {
                var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
                L.DomEvent
                    .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                    .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                .addListener(controlDiv, 'click', function () {
                    that.removeAll();
                });

                var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
                controlUI.title = 'Remove All Markers';
                controlUI.href = '#';
                return controlDiv;
            }
        });

        var removeAllControl = new L.Control.RemoveAllControl();

        this.map.addControl(drawControl);
        this.map.addControl(removeAllControl);  
        
        this.map.on('draw:created', function (e) {


            if (e.layerType === 'marker') {
              var new_marker = this.createMarker(e.layer.getLatLng(),'#FF0000');
              this.displayObject(new_marker);
              this.addObjectLayers(new_marker);
            }

        },this);
        
        this.map.on('draw:deleted', function (e) {
            e.layers.eachLayer(function(layer) {
                this.removeObjectLayers(layer);
            },this);
        },this);

        return this;
    },

    getLocation: function(e) {
        this.model.set({center:e.latlng});
        this.map.setView(this.model.get('center'), 11);
    },

    locationError: function(e) {
        this.map.setView(this.model.get('center'), 11);
    },

    zoom: function() {
        var bounds = this.clusterItems.getBounds();
        this.map.fitBounds(bounds);
    },

    createMarker: function(point,color) {
        var marker_options = {radius: 8, fillColor: color, color:'#000', weight: 1,opacity: 1, fillOpacity: 0.8};

        var marker = L.circleMarker(point,marker_options);
        return marker;
    },

    displayObject: function(shape_object) {
        shape_object.addTo(this.map);
    },

    removeObject: function(shape_object) {
        this.map.removeLayer(shape_object);
    },

    removeAll: function() {
        this.clusterItems.eachLayer(function(layer) {
            this.map.removeLayer(layer);
        },this);
        //this.editableItems.clearLayers();
        this.clusterItems.clearLayers();
    },

    addObjectLayers: function(shape_object) {
        this.clusterItems.addLayer(shape_object);
        //this.editableItems.addLayer(shape_object);
    },

    removeObjectLayers: function(shape_object) {
        this.map.removeLayer(shape_object);
        //this.editableItems.removeLayer(shape_object);
        this.clusterItems.removeLayer(shape_object);
    },

    // random colors should be sufficient for clusters here; potential duplicate colors, though
    changeMarkerColor: function (marker_object,color) {
        marker_object.setStyle({fillColor:color});   
    },

    colorMarkers: function (markers) {
        var random_color = '#' + (Math.random()*0xFFFFFF << 0).toString(16);
        for (var i in markers) {
            this.changeMarkerColor(markers[i],random_color);
        }
    },

    getCoords: function() {
        var clusterCoords = {};
        this.clusterItems.eachLayer(function(layer) {
            clusterCoords[this.clusterItems.getLayerId(layer)] = [layer.getLatLng().lat,layer.getLatLng().lng];
        },this);
        return clusterCoords;
    },

    labelMarker: function(marker,label) {

        marker.bindPopup("Cluster: " + String(label));
        marker.on('click', function (e) {
            e.target.openPopup(this.getLatLng());
        });
    },

    displayClusters: function(cluster_data) {

        var that = this;

        var ii = 0;

        $.each(cluster_data,function(label,cluster){
            ii++;
            var markers = [];
            $.each(cluster,function(i,coord){
                var marker = that.clusterItems.getLayer(coord['key']);
                if (label != -1.0) {
                    that.labelMarker(marker,ii);
                }
                else {
                    that.labelMarker(marker,label);
                }
                that.labelMarker(marker,ii);
                markers.push(marker);
            });
            if (label != -1.0) {
                that.colorMarkers(markers);
            }
        });
    }

});

var ClusterParameterModel = Backbone.Model.extend({

     defaults: {
        parameter: '',
        param_type: '',
        value: '',
        types: {'Integer':'number','Float':'number'}
     },

    initialize: function() {

    }

});

var ClusterParameterView = Backbone.View.extend({

    parent_el: $('#cluster-parameters'),

    initialize: function() {
        this._render();
    },

    _render: function() {
        this.el = $(document.createElement('div'));
        var label = $(document.createElement('label'));
        label.attr('class','col-lg-3 control-label');
        label.attr('for',this.model.get('parameter'));
        label.text(this.model.get('label'));

        input_div = $(document.createElement('div'));
        input_div.attr('class','col-lg-9');

        input = $(document.createElement('input'));
        input.attr('id',this.model.get('parameter'));
        input.attr('class','form-control');

        input_div.append(input);
        

        var that = this;
        input.change(function(){
            var type = that.model.get('types')[that.model.get('param_type')];
            if (type === 'number') {
                var value = Number($(this).val());
                if (!isNaN(value)) {
                    that.model.set({value:value});
                }
                else{
                    alert('Wrong type.');
                    input.val('');
                }
            }
            else {

            }
        });
        this.$el.append(label);
        this.$el.append(input_div);
        this.parent_el.append(this.$el);
    }


});


var ClusterModel = Backbone.Model.extend({


    initialize: function() {

    }
});


var ClusterView = Backbone.View.extend({

    el:$('#cluster'),

    initialize: function () {
        this.model.on('change',this.update,this);
    },

    populateParameters: function() {

        this.parameter_models = [];

        _.each(this.model.get('parameters'),function(param){
            
            var param_model = new ClusterParameterModel(param);
            var param_view = new ClusterParameterView({model:param_model})

            this.parameter_models.push(param_model);

        },this);
    },

    update: function() {
        this.$el.find('#cluster-parameters').empty();
        this.populateParameters();
    },

    getValidatedParameters: function() {
        var parameters = {};
        _.each(this.parameter_models,function(model){
            parameters[model.get('parameter')] = model.get('value');
        });
        return parameters;
    }

});

var ClusterButtonView = Backbone.View.extend({

    el: $('#clusterbutton'),

    events: {'click':'cluster'},

    initialize: function(map,select) {
        this.map = map;
        this.select = select;
    },

    cluster: function() {
        var coords = this.map.getCoords();

        if (_.isEmpty(coords)) {
            alert('No coordinates to cluster.');
            return;
        }

        var query_data = this.select.getValidatedParameters();

        query_data['coords'] = coords;

        var url = 'cluster/' + this.select.getName();

        $.ajax({

            context: this,
               
            url:url,
               
            type:'POST',

            dataType: 'json',
               
            data:JSON.stringify(query_data),
               
            success:function(cluster_data){
                this.map.displayClusters(cluster_data);
            }
            
        });
    },

});



var CitationsModel = Backbone.Model.extend({

    defaults: {
        citations: []
    },

    initialize: function() {

    }
});


var CitationsView = Backbone.View.extend({

    el:$('#citations'),

    initialize: function() {
        this.model.on('change', this.update, this);
    },

    update: function() {
        this.$el.empty();
        this._render();
    },

    _render: function() {
        _.each(this.model.get('citations'),function(citation){
            var link = $(document.createElement('a'));
            link.attr('href', citation.url);
            link.text(citation.label);
            this.$el.append($('<li></li>').append(link));
        },this);
    }
});


var AboutModel = Backbone.Model.extend({
    defaults: {
        about: ''
    }
});


var AboutView = Backbone.View.extend({
    el:$('#about'),

    events: {
        'click':'buttonClicked'
    },

    initialize: function() {

    },

    buttonClicked: function() {
        window.open(this.model.get('about').replace('http://','https://'));
    }

});


function getAlgorithms() {

    var algorithms = new Algorithms();

    $.ajax({
        url:'algorithms',
        type:'GET',
        dataType: 'json',
        success: function(algorithm_data){

            $.each(algorithm_data,function(name,algo){

                var algorithm = new Algorithm({name:name,
                                               description:algo.description,
                                               citations:algo.citations,
                                               parameters: algo.parameters,
                                               about:algo.reference
                                               });
                algorithms.add(algorithm);
            });
        },
        async: false
    });

    return algorithms;

}


var algorithms = getAlgorithms();


$(function() {

      var map_model = new MapModel();
      var map = new MapView({model:map_model});

      $('#navbar').change($(document.body).css('padding-top',$('#navbar').height()));

      var select = new AlgorithmSelectView({collection:algorithms});
      var clusterbuttonview = new ClusterButtonView(map,select);
  
});