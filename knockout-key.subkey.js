// KEY.SUBKEY binding provider for Knockout http://knockoutjs.com/
// (c) Michael Best
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(ko, undefined) {

// Support a short-hand syntax of "key.subkey: value". The "key.subkey" binding
// handler will be created as needed (through ko.getBindingHandler) but can also be
// created initially (as event.click is).
var keySubkeyMatch = /([^\.]+)\.(.+)/, keySubkeyBindingDivider = '.';
function makeKeySubkeyBinding(bindingKey) {
    var match = bindingKey.match(keySubkeyMatch);
    if (match) {
        var baseKey = match[1],
            baseHandler = ko.bindingHandlers[baseKey];
        if (baseHandler) {
            var subKey = match[2],
                makeSubHandler = baseHandler.makeSubkeyHandler || makeDefaultKeySubkeyHandler,
                subHandler = makeSubHandler.call(baseHandler, baseKey, subKey, bindingKey);
            ko.virtualElements.allowedBindings[bindingKey] = ko.virtualElements.allowedBindings[baseKey];
            return (ko.bindingHandlers[bindingKey] = subHandler);
        }
    }
}

// Create a binding handler that translates a binding of "binding: value" to
// "basekey: {subkey: value}". Compatible with these default bindings: event, attr, css, style.
function makeDefaultKeySubkeyHandler(baseKey, subKey) {
    var subHandler = {};
    function setHandlerFunction(funcName) {
        if (ko.bindingHandlers[baseKey][funcName]) {
            subHandler[funcName] = function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                function subValueAccessor() {
                    var result = {};
                    result[subKey] = valueAccessor();
                    return result;
                }
                return ko.bindingHandlers[baseKey][funcName](element, subValueAccessor, allBindingsAccessor, viewModel, bindingContext);
            };
        }
    }
    ko.utils.arrayForEach(['init', 'update'], setHandlerFunction);
    return subHandler;
}


function keySubkeyBindingProvider() { }
keySubkeyBindingProvider.prototype = ko.bindingProvider.instance;
keySubkeyBindingProvider.prototype.constructor = keySubkeyBindingProvider;

keySubkeyBindingProvider.prototype.getBindings = function(node, bindingContext) {
    var bindingsString = this.getBindingsString(node, bindingContext),
        parsedBindings = bindingsString ? this.parseBindingsString(bindingsString, bindingContext) : null;

    // Find any bindings of the form x.y, and for each one, ensure we have a parameterized binding handler to match
    if (parsedBindings) {
        for (var key in parsedBindings) {
            if (parsedBindings.hasOwnProperty(key) && !ko.bindingHandlers[key]) {
                makeKeySubkeyBinding(key);
            }
        }
    }
    return parsedBindings;
};

// ----- Now use the custom provider -----
ko.bindingProvider.instance = new keySubkeyBindingProvider();

})(ko);
