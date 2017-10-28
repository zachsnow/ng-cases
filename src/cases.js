(function(){
  var module = angular.module('cases', []);

  var remove = function(array, element){
    let index = array.indexOf(element);
    if(index !== -1) {
      array.splice(index, 1);
    }
  };

  var multiMatch = function(array, element, equals){
    if(!equals){
      return array.indexOf(element) !== -1;
    }
    for(var i = 0; i < array.length; i++){
      if(angular.equals(array[i], element)){
        return true;
      }
    }
    return false;
  };

  module.directive('ngCases', [
    '$animate',
    '$parse',
    function($animate, $parse){
      return {
        restrict: 'A',
        controller: function ngCasesCtrl(){
          var ctrl = this;

          ctrl.expressions = [];
          ctrl.defaults = [];
          ctrl.transcludedCases = [];

          // The top-level `ng-cases` expression.
          ctrl.scope = null;
          ctrl.expression = function(){};

          ctrl.addCase = function(switchCase, isDefault){
            var cases = isDefault ? ctrl.defaults : ctrl.expressions;
            cases.push(switchCase);
            ctrl.watch();
          };

          ctrl.removeCase = function(switchCase, isDefault){
            var cases = isDefault ? ctrl.defaults : ctrl.expressions;
            remove(cases, switchCase);
            ctrl.watch();
          };

          var transcludeCase = function(switchCase){
            var newScope = switchCase.scope.$new();
            switchCase.transclude(newScope, function(newElement){
              ctrl.transcludedCases.push({
                scope: newScope,
                element: newElement,
                switchCase: switchCase
              });
              $animate.enter(newElement, switchCase.element.parent(), switchCase.element);
            });
          };

          var destroyCase = function(transcludedCase){
            transcludedCase.scope.$destroy();
            $animate.leave(transcludedCase.element);
            remove(ctrl.transcludedCases, transcludedCase);
          };

          var matchCase = function(switchCase, value){
            if(!switchCase.expression){
              return true;
            }

            var expressionValue = switchCase.expression();
            if(switchCase.multi){
              return multiMatch(expressionValue, value, switchCase.equals);
            }
            else if(switchCase.equals){
              match = angular.equals(expressionValue, value);
            }
            else {
              return expressionValue === value;
            }
          };

          var update = function(){
            // Current value.
            var value = ctrl.expression();

            // Find all matching expression cases.
            var toTransclude = [];
            ctrl.expressions.forEach(function(switchCase){
              if(matchCase(switchCase, value) && (!switchCase.conditional || switchCase.conditional())){
                toTransclude.push(switchCase);
              }
            });

            // If no expression cases matched, apply all matching default cases.
            if(!toTransclude.length){
              ctrl.defaults.forEach(function(defaultCase){
                if(!defaultCase.conditional || defaultCase.conditional()){
                  toTransclude.push(defaultCase);
                }
              });
            }

            // Find which existing cases need to be destroyed, and which
            // should remain.
            var toDestroy = [];
            var toRemain = [];
            ctrl.transcludedCases.forEach(function(transcludedCase){
              if(toTransclude.indexOf(transcludedCase.switchCase) === -1){
                toDestroy.push(transcludedCase);
              }
              else {
                toRemain.push(transcludedCase.switchCase);
              }
            });

            // Destroy existing cases that no longer match.
            toDestroy.forEach(destroyCase);

            // Transclude every case that didn't already exist.
            toTransclude.forEach(function(switchCase){
              if(toRemain.indexOf(switchCase) === -1){
                transcludeCase(switchCase);
              }
            });
          };

          // After adding or removing a case, we must update the watcher so that it
          // can watch the ng-cases expression, each ng-case expression, and each
          // ng-case-when condition.
          var deregisterWatcher = null;
          ctrl.watch = function(){
            if(deregisterWatcher){
              deregisterWatcher();
            }

            var expressions = [
              ctrl.expression
            ];

            var addExpressions = function(switchCase){
              if(switchCase.expression){
                expressions.push(switchCase.expression)
              }
              if(switchCase.conditional){
                expressions.push(switchCase.conditional);
              }
            };

            ctrl.expressions.forEach(addExpressions);
            ctrl.defaults.forEach(addExpressions);

            deregisterWatcher = ctrl.scope.$watchGroup(expressions, update);
          };
        },

        link: {
          pre: function(scope, element, attrs, ctrl){
            ctrl.scope = scope;
            var expression = $parse(attrs.ngCases);
            ctrl.expression = function(){
              return expression(scope);
            };
            ctrl.watch();
          }
        }
      };
    }
  ]);

  var caseDirective = function(name, isDefault){
    module.directive(name, [
      '$parse',
      function($parse){
        return {
          restrict: 'A',
          require: '^ngCases',
          transclude: 'element',
          priority: 800,
          compile: function($element, $attrs) {
            return function(scope, element, attrs, ctrl, transcludeFn) {
              var switchCase = {
                transclude: transcludeFn,
                element: element,
                scope: scope,

                expression: null,
                multi: false,
                equals: attrs.hasOwnProperty('ngCaseEquals'),

                conditional: null
              };

              // While `ng-case` has an expression argument,
              // `ng-case-default` does not.  `ng-case` also supports
              // not passing an expression at all.
              var expressionFn;
              if(!isDefault && attrs[name]){
                var parts = attrs[name].split(/\s+or\s+/).map(function(expression){
                  return $parse(expression);
                });

                // Handle a single case specially to avoid allocating.
                if(parts.length === 1){
                  switchCase.expression = function(){
                    return parts[0](scope);
                  };
                }
                else {
                  // Re-use our array so our $watchGroup doesn't continually see a new array
                  // and cause an infinite digest.
                  switchCase.multi = true;
                  var values = [];
                  switchCase.expression = function(){
                    values.length = 0;
                    parts.forEach(function(part, i){
                      values[i] = part(scope);
                    });
                    return values;
                  };
                }
              }

              // Both `ng-case` and `ng-case-default` support `ng-case-when`
              // to guard the match.
              if(attrs.ngCaseWhen){
                var conditionalFn = $parse(attrs.ngCaseWhen);
                switchCase.conditional = function(){
                  return !!conditionalFn(scope);
                };
              }

              // Add our case and update the watcher.
              ctrl.addCase(switchCase, isDefault);

              // When this case is destroyed, remove it from the cases and
              // update the watcher again.
              scope.$on('$destroy', function(){
                ctrl.removeCase(switchCase, isDefault);
              });
            };
          }
        };
      }
    ]);
  };

  caseDirective('ngCase');
  caseDirective('ngCaseDefault', true);
})();
