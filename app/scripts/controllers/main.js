'use strict';
/*global $:false */
/*global joint:false */
/*global g:false */
/*global V:false */

/**
 * @ngdoc function
 * @name fomodApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('MainCtrl', function($scope, $rootScope, $routeParams, $timeout, dragThresholder, dataStore, graph, data, commander,
    CreateObjectCommand, CreateRelationCommand, DeleteRelationCommand, ChangeDataAttributeCommand, attrMap, fbref, AutoLayoutCommand) {
    if (!fbref.getAuth()) {
      $timeout(function() {
        window.location.href = "#/login"
      });
    }
    var modelId = $routeParams.modelId;

    $scope.editing = false;
    $scope.startEdit = function() {
      $scope.editing = true;
      var target = $(".toolbaredit")[0];
      target.setSelectionRange(0, target.value.length);
      $timeout(function() {
        target.focus();
        $rootScope.$apply();
      });

    }
    $scope.nameGetterSetter = function(name) {
      return angular.isDefined(name) ? commander.do(new ChangeDataAttributeCommand({
        name: name
      })) : data.get('name');
    };
    $scope.stopEdit = function() {
      $scope.editing = false;
    }
    $(".toolbaredit").keyup(function(e) {
      if (e.keyCode == 13) {
        $timeout(function() {
          e.target.blur();
          $rootScope.$apply();
        });
      }
    });

    $scope.autoLayout = function() {
      commander.do(new AutoLayoutCommand(graph))
    };

    $scope.commander = commander;
    $scope.auth = fbref.getAuth();

    function dataChangeHandler() {
      $scope.name = data.get('name');
      document.title = data.get('name') + ' - fomod';
    }
    data.on('change', dataChangeHandler);
    if (data.get('name')) {
      dataChangeHandler();
    }

    $scope.logout = function() {
      fbref.unauth();
      $timeout(function() {
        $rootScope.$apply();
        window.location.href = "#/login"
      });
    };

    $scope.status = 'reading';
    dataStore.on(function(type) {
      if (type === 'read-begin') {
        $scope.status = 'reading';
      } else if (type === 'read-end') {
        $scope.status = '';
        setPaperSize();
      } else if (type === 'write-begin') {
        $scope.status = 'writing';
      } else if (type === 'write-end') {
        $scope.status = '';
      }
      setTimeout(function() {
        $scope.$apply();
      });
    });

    commander.on('execute', function() {
      setTimeout(function() {
        $scope.$apply();
      });
      setPaperSize();
    });

    var WrappedPaper = joint.dia.Paper.extend({
      // paper that wraps all elements and links in a dragThresholder
      createViewForModel: function(cell) {
        var view;
        var type = cell.get('type');
        var module = type.split('.')[0];
        var entity = type.split('.')[1];
        // If there is a special view defined for this model, use that one instead of the default `elementView`/`linkView`.
        if (joint.shapes[module] && joint.shapes[module][entity + 'View']) {
          view = new(dragThresholder(joint.shapes[module][entity + 'View']))({
            model: cell,
            interactive: this.options.interactive
          });
        } else if (cell instanceof joint.dia.Element) {
          view = new(dragThresholder(this.options.elementView))({
            model: cell,
            interactive: this.options.interactive
          });
        } else {
          view = new(dragThresholder(this.options.linkView))({
            model: cell,
            interactive: this.options.interactive
          });
        }
        return view;
      }
    });

    var paper = new WrappedPaper({
      el: $('#paper'),
      width: 600,
      height: 200,
      model: graph,
      gridSize: 1
    });
    paper.resetCells(graph.get('cells'));

    function setPaperSize() {
      var bBox = paper.getContentBBox();
      var tbh = $('#graphtoolbar').outerHeight();
      console.log('tbh', tbh);
      paper.setDimensions(Math.max(bBox.width + 20, $(window).width()), Math.max(bBox.height + 10, $(window).height() - tbh));
    }
    setPaperSize();
    $(window).bind('resize', setPaperSize);

    paper.on('cell:doubleclick', function(cell) {
      if (cell.model.id) {
        if (cell.model instanceof joint.shapes.fomod.ElementTemplate) {
          window.location.href = '/#/templates/' + modelId + '/' + cell.model.id;
        } else if (cell.model instanceof joint.shapes.fomod.Element) {
          window.location.href = '/#/objects/' + modelId + '/' + cell.model.id;
        }
      }
    });
    paper.on('blank:pointerdown cell:pointerdown', function() {
      $timeout(function() {
        $scope.stopEdit();
        $rootScope.$apply();
      });
    });

    $(document).keydown(function(e) {
      e = e || window.event; // IE support
      if (e.which === 90 && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          commander.redo();
        } else {
          commander.undo();
        }
      }
    });

    dataStore.setCurrentModel(modelId);
  });