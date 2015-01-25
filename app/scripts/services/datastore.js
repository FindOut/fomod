'use strict';

/*global Firebase:false */
/*global _:false */

/**
 * @ngdoc service
 * @name fomodApp.dataStore
 * @description
 * # dataStore
 * Service in the fomodApp.
 */
angular.module('fomodApp')
.service('dataStore', function(data, Mapper, graph, FomodObjectTemplate, FomodObject, FomodRelation, commander, attrMap, fbref) {
  var enableSaving = true;
  var listeners = [];
  var fbModelRef = new Firebase('https://fomod.firebaseio.com');

  new Mapper(data, graph);

  function setModelId(id) {
    fbModelRef = fbref.child('models/' + id);
    readFbModel();
  }

  function readFbModel() {
    fireEvent('read-begin');
    fbModelRef.once('value', function(snapshot) {
      var value = snapshot.val();
      enableSaving = false;
      if (value) {
        data.set(value.data);
        if (value.graph) {
          _.each(value.graph.elements, function(storeElement) {
            var element = graph.getCell(storeElement.id);
            if (element) {
              element.set('position', storeElement.position);
              attrMap[storeElement.id] = storeElement.position;
            }
          });
          _.each(value.graph.links, function(storeLink) {
            var link = graph.getCell(storeLink.id);
            if (link) {
              link.set('vertices', storeLink.vertices);
            }
          });
        }
      } else {
        data.set({objects: [], relations: []});
      }

      if (data.get('templates').length === 0) {
        // there were no templates in the database - create one
        var defaultTemplate = new FomodObjectTemplate({id: joint.util.uuid(), name: 'New object'});
        data.get('templates').add(defaultTemplate);
      }
      enableSaving = true;
      fireEvent('read-end');
      commander.clear();
    });
  }

  commander.on('execute', function() {
    if (enableSaving) {
      fireEvent('write-begin');
      fbModelRef.set({owner: fbModelRef.getAuth().uid, data: data.toJSON(), graph: getStorableGraph(graph)}, function(error) {fireEvent('write-end', error);});
    }
  });

  function getStorableGraph(graph) {
    var userElements = _.filter(graph.getElements(), function(element) {return !(element.isPalette || element.isTemplate);});
    var validLinks = _.filter(graph.getLinks(), function(link) {return link.has('vertices');});
    return {
      elements: _.map(userElements, function(element) {
        return {id: element.id, position: element.get('position')};
      }),
      links: _.map(validLinks, function(link) {
        return {id: link.id, vertices: link.get('vertices')};
      })
    };
  }

  function fireEvent(type) {
    _.each(listeners, function(listener) {
      listener(type);
    });
  }

  return {
    on: function(listener) {
      listeners.push(listener);
    },
    setModelId: setModelId
  };
});
