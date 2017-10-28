# ng-cases


## Dependencies

1. AngularJS.

## Installation

* Load `cases.js`.

* Add `cases` as a dependency to your angular module.

```javascript
  angular.module('yourModule', [
    // ... other dependencies ...
    'cases'
  ]);
```

* Use `ng-cases`, along with `ng-case`, `ng-case-when`, and `ng-case-default`, in your templates:
  - Use `ng-cases="expression"` to introduce the construct.
  - Use `ng-case="matchExpression"` to render content when `expression === matchExpression`.
  - Use `ng-case="matchExpression1 or matchExpression2"` to render content when either
    `expression === matchExpression1` or `expression === matchExpression2`.
  - Use `ng-case-default` to render content when no `ng-case` matches.
  - Use `ng-case-when` with both `ng-case` and `ng-case-default` to block rendering when a
    side-condition is not met (that is, when it evaluates to falsy).
  - Use `ng-case-equals` with no argument with `ng-case` to use deep equality (via `angular.equals`)
    instead of reference equality (via `===`) when matching expressions. Note that this does
    not apply to conditions, where only truthy/falsy is considered.

## Example

```html
  <div ng-cases="someExpression">
    <div ng-case="1">
      This will render when someExpression evaluates to 1.
    </div>

    <p>
      Some random junk in the middle that will always render.
    </p>

    <div ng-case="someValue + 2">
      Note that our cases can be complex expressions.
    </div>

    <div ng-case="3" ng-case-when="moreConditions || evenMoreConditions">
      This won't render unless the "when" condition evaluates to something truthy.
    </div>

    <div ng-case="4 or 5">
      You can match multiple cases at once; the parser is simplistic, so if you have a
      string literal in a case that contains " or " you will run into trouble.
    </div>

    <div ng-case ng-case-when="onlyConditionBased">
      This will render for any value of someExpression, so long as the
      condition evaluates to something truthy.
    </div>

    <div ng-case-default>
      Aloha! This will render if none of the above cases match.
    </div>

    <p>
      Some <span ng-case-default ng-case-when="!anotherCondition">default</span> text
      that only renders when the "when" condition evaluates to something truthy.
    </p>
  </div>

  <p>
    More nonsense.
  </p>
```

You can also run an interactive example by running a webserver from the root of this repository
and visiting `example.html`; for instance, run `python -m SimpleHTTPServer 5000` and visit
`http://localhost:5000/example.html`.
