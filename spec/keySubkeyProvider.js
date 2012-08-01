function findPropertyName(obj, equals) {
    for (var a in obj)
        if (obj.hasOwnProperty(a) && obj[a] === equals)
            return a;
}
var kobindingHandlersName = findPropertyName(ko, ko.bindingHandlers),
    savedHandlers;
function resetBindingHandlers() {
    if (savedHandlers)
        ko.bindingHandlers = ko[kobindingHandlersName] = savedHandlers;
    savedHandlers = ko.utils.extend({}, ko.bindingHandlers);
}

describe('key.subkey bindings', {
    before_each: function () {
        resetBindingHandlers();
        var existingNode = document.getElementById("testNode");
        if (existingNode != null)
            existingNode.parentNode.removeChild(existingNode);
        testNode = document.createElement("div");
        testNode.id = "testNode";
        document.body.appendChild(testNode);
    },

    'Should be able to set and use binding handlers with x.y syntax': function() {
        var initCalls = 0;
        ko.bindingHandlers['a.b'] = {
            init: function(element, valueAccessor) { if (valueAccessor()) initCalls++; }
        };
        testNode.innerHTML = "<div data-bind='a.b: true'></div>";
        ko.applyBindings(null, testNode);
        value_of(initCalls).should_be(1);
    },

    'Should be able to use x.y binding syntax to call \'x\' handler with \'y\' as object key': function() {
        var observable = ko.observable(), lastSubKey;
        ko.bindingHandlers['a'] = {
            update: function(element, valueAccessor) {
                var value = valueAccessor();
                for (var key in value)
                    if (ko.utils.unwrapObservable(value[key]))
                        lastSubKey = key;
            }
        };
        testNode.innerHTML = "<div data-bind='a.b: true, a.c: myObservable'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(lastSubKey).should_be("b");

        // update observable to true so a.c binding gets updated
        observable(true);
        value_of(lastSubKey).should_be("c");
    },

    'Should be able to define a custom handler for x.y binding syntax': function() {
        var observable = ko.observable(), lastSubKey;
        ko.bindingHandlers['a'] = {
            makeSubkeyHandler: function(baseKey, subKey) {
                return {
                    update: function(element, valueAccessor) {
                        if (ko.utils.unwrapObservable(valueAccessor()))
                            lastSubKey = subKey;
                    }
                };
            }
        };
        testNode.innerHTML = "<div data-bind='a.b: true, a.c: myObservable'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(lastSubKey).should_be("b");

        // update observable to true so a.c binding gets updated
        observable(true);
        value_of(lastSubKey).should_be("c");
    },

    'Should be able to use x.y binding syntax in virtual elements if \'x\' binding supports it': function() {
        var lastSubKey;
        ko.bindingHandlers['a'] = {
            update: function(element, valueAccessor) {
                var value = valueAccessor();
                for (var key in value)
                    if (ko.utils.unwrapObservable(value[key]))
                        lastSubKey = key;
            }
        };
        ko.virtualElements.allowedBindings.a = true;

        testNode.innerHTML = "x <!-- ko a.b: true --><!--/ko-->";
        ko.applyBindings(null, testNode);
        value_of(lastSubKey).should_be("b");
    },

    'Should be able use x.y through ko.applyBindingsToNode': function() {
        var lastSubKey;
        ko.bindingHandlers['a'] = {
            update: function(element, valueAccessor) {
                var value = valueAccessor();
                for (var key in value)
                    if (ko.utils.unwrapObservable(value[key]))
                        lastSubKey = key;
            }
        };

        testNode.innerHTML = "<div></div>";
        ko.applyBindingsToNode(testNode.childNodes[0], {'a.b': true}, null);
        ko.applyBindings(null, testNode);
        value_of(lastSubKey).should_be("b");
    },

    'Should be able to supply event type as event.type': function() {
        var model = { clickCalled: false };
        testNode.innerHTML = "<button data-bind='event.click: function() { clickCalled = true; }'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.clickCalled).should_be(true);
    },

    'Should be able to set CSS class as css.classname': function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div data-bind='css.myRule: someModelProperty'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("myRule");
    },

    'Should be able to set CSS style as style.stylename': function() {
        var myObservable = new ko.observable("red");
        testNode.innerHTML = "<div data-bind='style.backgroundColor: colorValue'>Hallo</div>";
        ko.applyBindings({ colorValue: myObservable }, testNode);

        value_of(testNode.childNodes[0].style.backgroundColor).should_be_one_of(["red", "#ff0000"]); // Opera returns style color values in #rrggbb notation, unlike other browsers
        myObservable("green");
        value_of(testNode.childNodes[0].style.backgroundColor).should_be_one_of(["green", "#008000"]);
        myObservable(undefined);
        value_of(testNode.childNodes[0].style.backgroundColor).should_be("");
    },

    'Should be able to set attribute as attr.name': function() {
        var model = { myprop : ko.observable("initial value") };
        testNode.innerHTML = "<div data-bind='attr.someAttrib: myprop'></div>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("initial value");

        // Change the observable; observe it reflected in the DOM
        model.myprop("new value");
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("new value");
    }
});
