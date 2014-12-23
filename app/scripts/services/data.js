'use strict';

/*global Backbone:false */


/**
 * @ngdoc service
 * @name fomodApp.data
 * @description
 * # data
 * Service in the fomodApp.
 */
angular.module('fomodApp')
.service('FomodObject', function() {
  return Backbone.AssociatedModel.extend();
})
.service('FomodRelation', function() {
  return Backbone.AssociatedModel.extend();
})
.service('FomodModel', function(FomodObject, FomodRelation) {
  return Backbone.AssociatedModel.extend({
    relations: [
      {
        type: Backbone.Many, //nature of the relation
        key: 'objects', //attribute of Project
        relatedModel:FomodObject //AssociatedModel for attribute key
      },
      {
        type: Backbone.Many, //nature of the relation
        key: 'relations', //attribute of Project
        relatedModel:FomodRelation //AssociatedModel for attribute key
      }
    ],
    defaults: {
      objects: [],
      relations: []
    }
  });
})
.service('data', function (FomodModel, FomodObject, FomodRelation, commander) {
  var data = new FomodModel();
  data.get('objects').add(new FomodObject({id: '123', name: 'Hej'}));
  data.get('objects').add(new FomodObject({id: '234', name: 'Du'}));
  data.get('objects').add(new FomodObject({id: '345', name: 'glade'}));
  data.get('relations').add(new FomodRelation({id: '123234', from: '123', to: '234'}));

  commander.on(function() {
    console.log(JSON.stringify(data.toJSON()));
  });

  return data;
})
.service('CreateObjectCommand', function(data, FomodObject) {
  return function(id, name) {
    var newObject = new FomodObject({id: id, name: name});
    this.do = function() {
      data.get('objects').add(newObject);
    };
    this.undo = function() {
      data.get('objects').remove(newObject);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'CreateObjectCommand(' + id + ', ' + name + ')';
    };
  };
})
.service('CreateRelationCommand', function(data, FomodRelation) {
  return function(id, name, from, to) {
    var relation = new FomodRelation({id: id, name: name, from: from, to: to});
    this.do = function() {
      data.get('relations').add(relation);
    };
    this.undo = function() {
      if (relation) {
        data.get('relations').remove(relation);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'CreateRelationCommand relation=' + JSON.stringify(relation);
    };
  };
})
.service('DeleteRelationCommand', function(data) {
  return function(id) {
    var relation = data.get('relations').get(id);
    this.do = function() {
      if (relation) {
        data.get('relations').remove(relation);
      }
    };
    this.undo = function() {
      if (relation) {
        data.get('relations').add(relation);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'DeleteRelationCommand relation=' + relation;
    };
  };
})
.service('ChangeRelationToCommand', function(data) {
  return function(relationId, toId) {
    var relation = data.get('relations').get(relationId);
    var previousToId = relation.get('to');
    this.do = function() {
      relation.set('to', toId);
    };
    this.undo = function() {
      relation.set('to', previousToId);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeRelationToCommand(' + relationId + ', ' + toId + ')';
    };
  };
})
.service('ChangeNameCommand', function(data) {
  return function(id, newName) {
    var obj, oldName;
    this.do = function() {
      obj = data.get('objects').get(id);
      if (obj) {
        oldName = obj.get('name');
        obj.set('name', newName);
      }
    };
    this.undo = function() {
      if (obj) {
        obj.set('name', oldName);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeNameCommand(' + id + ', ' + newName + ')';
    };
  };
})
.service('ChangeRelationAttributeCommand', function(data) {
  return function(id, attributeName, newValue) {
    var relation, oldValue;
    this.do = function() {
      relation = data.get('relations').get(id);
      if (relation) {
        oldValue = relation.get(attributeName);
        relation.set(attributeName, newValue);
      }
    };
    this.undo = function() {
      if (relation) {
        relation.set(attributeName, oldValue);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeRelationAttributeCommand(' + id + ', ' + attributeName + ', ' + newValue + ')';
    };
  };
})
.service('commander', function() {
  var undoStack = [], undoI = 0, maxRedoI = 0, inCommand = 0, commandListeners = [];
  return new (function() {
    this.do = function(command) {
      if (inCommand == 0) {
        inCommand++;
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        command.do();
        inCommand--;
        fireCommandDone(command, 'do');
      }
    };
    this.undo = function() {
      if (undoI > 0 && inCommand == 0) {
        inCommand++;
        var cmd = undoStack[--undoI];
        cmd.undo();
        inCommand--;
        fireCommandDone(cmd, 'undo');
      }
    };
    this.redo = function() {
      if (undoI < maxRedoI && inCommand == 0) {
        inCommand++;
        var cmd = undoStack[undoI++];
        cmd.redo();
        inCommand--;
        fireCommandDone(cmd, 'redo');
      }
    };
    this.register = function(command) {
      // adds a command to the undo stack without executing it
      // use when the result of a command is already achieved, but it should be undoable
      if (inCommand == 0) {
        inCommand++;
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        inCommand--;
        fireCommandDone(command, 'register');
      }
    };
    var fireCommandDone = function(cmd, what) {
      _.each(commandListeners, function(item) {item(cmd, what)});
    };
    this.on = function(commandListener) {
      commandListeners.push(commandListener);
    };
  })();
});
