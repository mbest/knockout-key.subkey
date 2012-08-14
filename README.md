### **Key.Subkey Binding** plugin for [Knockout](http://knockoutjs.com/)

This plugin enables you to use a new syntax for Knockout’s built-in bindings `attr`, `css`, `sytle`, and `event`. This new syntax combines the name of the binding and the item you want to bind without having to use a sub-object.

#### Syntax examples

```javascript
attr.href: url, attr.title: details
attr.data-something: someValue

css.profitWarning: currentProfit() < 0, css.majorHighlight: isSevere
css.my-class: someValue

style.color: currentProfit() < 0 ? 'red' : 'black'

event.mouseover: enableDetails, event.mouseout: disableDetails
```

#### Advantages over the built-in syntax

This syntax is more concise because it eliminates the need for extra curly braces and quotes. For example, compare the following:

```javascript
attr: { 'data-something': someValue }

attr.data-something: someValue
```

This syntax more clearly expresses that multiple bindings of the same type are separate. For example, compare:

```javascript
attr: { href: url, title: details }

attr.href: url, attr.title: details
```

When combined with [Knockout-Freedom](https://github.com/mbest/knockout-freedom), this syntax ensures that each of multiple attributes (etc.) is only updated when its own dependencies change. This is especially important when an update has side effects or involves some significant amount of work. For example, in the first case below, an update to `myId` will update both bindings and cause the `iframe` to reload (in some browsers); but in the second case, only an update to `baseUrl` will cause it to reload:

```html
<iframe data-bind="attr: { src: baseUrl, id: myId }"></iframe>

<iframe data-bind="attr.src: baseUrl, attr.id: myId"></iframe>
```

#### How this plugin works

To use this plugin, simply include `knockout-key.subkey.js` in your page after you’ve included Knockout. You can then start using the new syntax in your data bindings. If you have existing code that uses the original syntax, you do *not* have to change it, since this plugin doesn’t disable the old syntax.

Each time you use a new *key.subkey* binding in your view, this plugin dynamically creates a binding handler for it. It does this by wrapping two Knockout functions, `ko.bindingProvider.instance.getBindings` (used for most bindings) and `ko.applyBindingsToNode` (used for bindings within string-based templates such as jQuery-tmpl).

#### Using this syntax for custom bindings

If your binding follows the same pattern as the supported built-in bindings, it will work automatically with the new syntax. Here’s an example custom binding handler:

```javascript
ko.bindingHandlers.dataAttr = {
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        for (var subKey in value) {
            var dataValue = ko.utils.unwrapObservable(value[subKey]);
            if (!dataValue && dataValue !== 0)
                element.removeAttribute("data-" + subKey);
            else
                element.setAttribute("data-" + subKey, dataValue.toString());
        }
    }
};
```

The binding could then be used like this:

```html
<div data-bind="dataAttr.one: 'one', dataAttr.two: 'two'"></div>
```

Alternatively, if your custom binding is only meant to work with the new syntax, you can use the new `makeSubkeyHandler` function to define how to handle the binding:

```javascript
ko.bindingHandlers.dataAttr = {
    makeSubkeyHandler: function(baseKey, subKey, combinedKey) {
        return {
            update: function(element, valueAccessor) {
                var dataValue = ko.utils.unwrapObservable(valueAccessor());
                if (!dataValue && dataValue !== 0)
                    element.removeAttribute("data-" + subKey);
                else
                    element.setAttribute("data-" + subKey, dataValue.toString());
            }
        };
    }
};
```

#### Interfaces

This plugin exports `ko.keySubkeyBinding.makeHandler`, which can be used to manually generate a *key.subkey* binding handler. It both saves the handler in `ko.bindingHandlers` as *key.subkey* and returns the handler object. If the specified binding handler was already created before, `makeHandler` will create a new one, overwriting the old one. You can use this, for example, to create an alias for a binding:

```javascript
ko.bindingHandlers.id = ko.keySubkeyBinding.makeHandler('attr.id');
```

This plugin also exports `ko.getBindingHandler` with similar functionality to `makeHandler`. But `getBindingHandler` will simply return, rather than re-create, an existing binding handler.

As described in the section about custom bindings, when trying to dynamically create an `x.y` (for example) binding handler, this plugin will call `ko.bindingHandlers.x.makeSubkeyHandler('x', 'y', 'x.y')` if the function exists, which should return a binding handler object for that sub-key (with `init` and/or `update` functions).

#### License and Contact

**License:** MIT (http://www.opensource.org/licenses/mit-license.php)

Michael Best<br>
https://github.com/mbest<br>
mbest@dasya.com
