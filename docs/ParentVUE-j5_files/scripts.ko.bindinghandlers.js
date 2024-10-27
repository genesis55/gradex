﻿(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD anonymous module
        define(["knockout", "app"], factory);
    } else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS module
        var ko = require("knockout");
        var app = require('app');
        factory(ko, p);
    } else {
        // No module loader (plain <script> tag) - put directly in global namespace
        factory(window.ko);
    }
})(function (ko, app) {

    //these help with debugging
    ko.bindingHandlers.debug = {
        init: function (element, valueAccessor) {
            if (window.console && console.warn) {
                console.warn("debug binding", element, ko.unwrap(valueAccessor()));
            }
        }
    };
    ko.virtualElements.allowedBindings.debug = true;

    ko.extenders.warnToConsole = function (target, name) {
        if (target) {
            target.subscribe(function (newValue) {
                console.warn(name, newValue);
            });
        }
        return target;
    };
    // end debugging stuff

    ko.bindingHandlers.onInit = {
        init: function (element, valueAccessor) {
            var func = valueAccessor();
            if (typeof func === 'function') {
                func(element);
            } else {
                console.error('onInit binding was not passed a function');
            }
        }
    };

    ko.bindingHandlers.waitLoader = {
        init: function (element, valueAccessor, allBindings) {
            var flag = valueAccessor();
            if (ko.isObservable(flag) === false) {
                console.error('waitLoader requires you to pass a observable boolean value.');
            }
            let positionAt = 'center';
            if (allBindings.has('positionAt')) {
                positionAt = allBindings.get('positionAt');
            }
            var loadConfig = {
                visible: false,
                showIndicator: true,
                showPane: false,
                shading: false,
                shadingColor: "rgba(245,245,245,0.4)",
                position: {
                    my: 'center',
                    at: positionAt,
                    of: element,
                    offset: '0'
                },
                minWidth: 100,
                minHeight: 100,
                message: 'Loading Content...',
            };
            $(element).before($('<div class="wait-loader">').dxLoadPanel(loadConfig));
        },
        update: function (element, valueAccessor) {
            var flag = valueAccessor();
            var waitLoader = $(element).siblings('.wait-loader').dxLoadPanel('instance');
            waitLoader.option('visible', ko.unwrap(flag));
        }
    };
    ko.bindingHandlers.waitLoader.preprocess = function (value, name, addBinding) {
        addBinding('if', value + '()==false');
        return value;
    };

    ko.bindingHandlers.contentPopover = {
        init: function (element, valueAccessor, allBindings) {
            if (allBindings.has('showContentPopover')) {
                let showContentPopover = allBindings.get('showContentPopover');
                element.showContentPopover = ko.isObservable(showContentPopover) ? showContentPopover : ko.observable(showContentPopover);
            }
            element.contentPopoverOptions = {
                width: '50%',
                height: '25%'
            }
            if (allBindings.has('contentPopoverOptions')) {
                let contentPopoverOptions = allBindings.get('contentPopoverOptions');
                element.contentPopoverOptions = ko.isObservable(contentPopoverOptions) ? contentPopoverOptions : ko.unwrap(contentPopoverOptions);
            }
            element.popoverValue = ko.observable();
            element.popOver = new app.popOver(
                '',
                'render.direct',
                {
                    config: {
                        html: '<div data-bind="text: $parents[1].cmpParams.config.bindingData"></div>',
                        bindingData: element.popoverValue
                    }
                },
                {
                    target: element,
                    width: element.contentPopoverOptions.width,
                    height: element.contentPopoverOptions.height,
                    onHidden: function (e) {
                    }
                });
        },
        update: function (element, valueAccessor) {
            if (element.showContentPopover()) {
                var flag = valueAccessor();
                element.popoverValue(flag());
                element.popOver.open();
            } else {
                element.popOver.close();
            }
        }
    };

    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value));
        },
        update: function (element, valueAccessor) {

            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).fadeIn(500) : $(element).fadeOut(500);
        }
    };

    ko.bindingHandlers.slideVisible = {
        init: function (element, valueAccessor) {
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value));
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).slideDown(500) : $(element).slideUp(500);
        }
    };

    ko.bindingHandlers.tooltip = {
        init: function (element, valueAccessor) {
            var value = valueAccessor();
            var $ele = $(element);
            $ele.attr('data-toggle', 'tooltip');
            $ele.attr('data-html', 'true');
            $ele.attr('data-placement', 'auto');
            $ele.attr('data-container', 'body');
            $ele.attr('data-title', ko.utils.unwrapObservable(value)) || '';
            $ele.on('shown.bs.tooltip', (e) => {
                let theTip = $ele.data('bs.tooltip').$tip;
                $ele.attr('tip-id', theTip.attr('id'));
                console.log('tip-id added', theTip.attr('id'));
            });
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $ele = $(element);
                let tipid = $ele.attr('tip-id');
                if (tipid) {
                    $('#' + tipid).remove();
                    console.log('tip-id removed', tipid);
                }
            });
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            var $ele = $(element);
            var title = ko.utils.unwrapObservable(value) || '';
            $ele.attr('data-title', title);
            $ele.attr('data-original-title', title);
            if ($('#' + $ele.attr('tip-id')).length) {
                //if its currently showing then update it
                $ele.tooltip('hide');
                if (title) {
                    setTimeout(() => {
                        $ele.tooltip('show');
                    }, 500);
                }
            }
        }
    };

    ko.bindingHandlers.hasFocusSelect = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.bindingHandlers['hasfocus'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.bindingHandlers['hasfocus'].update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            var selected = ko.utils.unwrapObservable(valueAccessor());
            if (selected) element.select();
        }
    };

    ko.bindingHandlers.beforeUnloadText = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            if (window.onbeforeunload === null) {
                window.onbeforeunload = function () {
                    var value = valueAccessor();
                    var promptText = ko.utils.unwrapObservable(value);
                    if (typeof promptText === undefined || promptText === null) {
                        // Return nothing.  This will cause the prompt not to appear
                    } else {
                        if (promptText !== null && typeof promptText !== "string") {
                            var err = "Error: beforeUnloadText binding must be " +
                                "against a string or string observable.  " +
                                "Binding was done against a " + typeof promptText;
                            console.log(err);
                            console.log(promptText);
                            // By returning the error string, it will display in the
                            // onbeforeunload dialog box to the user.  We could throw an
                            // exception here, but the page would unload and the
                            // exception would be lost.
                            return err;
                        }
                        return promptText;
                    }
                };

            } else {
                var err = "onbeforeupload has already been set";
                throw new Error(err);
            }
        }
    };

    ko.bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            // Make a modified binding context, with a extra properties, and apply it to descendant elements
            var innerBindingContext = bindingContext.extend(valueAccessor);
            ko.applyBindingsToDescendants(innerBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.withProperties = true;

    ko.bindingHandlers.iframeContent = {
        update: function (element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            element.contentWindow.document.close(); // Clear the content
            element.contentWindow.document.write(value);
        }
    };

    ko.bindingHandlers.contentEditable = {
        init: function (element, valueAccessor, allBindings) {
            var value = valueAccessor();

            let onChange = function (event) {
                if (ko.isWriteableObservable(value)) {
                    element.internalChange = true;
                    //check to see if there is validators and they are valid.
                    let writeValue = true;
                    if (value.dxValidator) {
                        //test the validator on a new observable so we down write the value back if its invalid
                        var valueTester = ko.observable(this.textContent).extend({ dxValidator: { validationRules: value.dxValidator.validationRules } });
                        valueTester.dxValidator.validate();
                        $(element).removeClass("pending valid invalid").addClass(valueTester.dxValidator.validationStatus());
                        $(element).attr('title', valueTester.dxValidator.validationError() && valueTester.dxValidator.validationError().message);
                        //raise the change event if the value is valid
                        if (valueTester.dxValidator.validationError()) {
                            writeValue = false;
                        }
                    }
                    if (writeValue) {
                        value(this.textContent);
                        element.internalChange = false;
                        element.dispatchEvent(new Event('contentEditableChange'));
                    }
                } else {
                    console.warn('contentEditable binding is not writable. unable to save value: ' + this.innerHTML);
                }
            };
            function onFocus(event) {
                window.getSelection().selectAllChildren(event.target);
            };

            element.innerHTML = ko.unwrap(value); //set initial value
            element.contentEditable = true; //mark contentEditable true
            element.internalChange = false; //accept changes to binding
            element.addEventListener('blur', onChange); //add blur listener
            //element.addEventListener('input', onChange); //add input listener
            element.addEventListener('focus', onFocus); //add focus listener
            if (allBindings.has('trapEnterKey')) {
                element.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        e.cancelBubble = true;
                        e.returnValue = false;
                        const blur = new Event('blur');
                        e.currentTarget.dispatchEvent(blur);
                    }
                }); //add keydown listener
            }
        },
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (allBindings.has('isContentEditable')) {
                let isContentEditable = allBindings.get('isContentEditable');
                element.contentEditable = typeof isContentEditable === 'function' ? isContentEditable() === true : isContentEditable === true;
            }
            var value = ko.unwrap(valueAccessor());
            if (element.internalChange == false) {
                element.innerHTML = value; //update value
            }
        }
    };

    ko.subscribable.fn.subscribeChanged = function (callback) {
        var oldValue;
        var oldSubscription = this.subscribe(function (_oldValue) {
            oldValue = _oldValue;
        }, this, 'beforeChange');
        var newSubscription = this.subscribe(function (newValue) {
            //this is tricky.
            if (oldValue === undefined || oldValue === null || newValue === undefined || newValue === null) {
                callback(newValue, oldValue);
                oldValue = newValue;
            } else if (ko.mapping.toJSON(newValue) !== ko.mapping.toJSON(oldValue)) { //cant evaluate with any nulls
                callback(newValue, oldValue);
                oldValue = newValue;
            }
        });
        return {
            oldSubscription: oldSubscription,
            newSubscription: newSubscription,
            dispose: function () {
                this.oldSubscription.dispose();
                this.newSubscription.dispose();
            }
        };
    };

    let appTextData = {};
    let _appTextCall = null;
    let appTextCall = (context) => {
        if (_appTextCall) return _appTextCall;
        _appTextCall = app.call({
            friendlyName: 'genericdata.appText',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: null,
            changeTracker: null,
            async: false,
            showStatus: false,
            statusElement: null
        }).done((data) => {
            for (var i = 0; i < data.length; i++) {
                let appTextValues = data[i];
                let text = appTextValues.text;
                let modifiedText = appTextValues.modifiedText;
                appTextData[context][text] = modifiedText;
            }
        });
        return _appTextCall;
    };

    let getAppText = function (context, value, page) {
        //can translate text to custom text based on settings
        appTextData[context] = appTextData[context] || {};
        return new Promise((resolve, reject) => {
            let resolvedValue = appTextData[context][value];
            if (typeof resolvedValue == 'string') {
                resolve(resolvedValue);
            } else {
                appTextCall(context).done((data) => {
                    if (appTextData[context][value] == null) {
                        appTextData[context][value] = value;
                        //no record of the string so insert it.
                        app.call({
                            friendlyName: 'genericdata.appText',
                            method: 'set',
                            parameters: { context, value, page },
                            koMapping: {},
                            koMapTo: null,
                            changeTracker: null,
                            async: false,
                            showStatus: false,
                            statusElement: null
                        });
                    }
                    resolve(appTextData[context][value]);
                });
            }
        });
    };

    ko.bindingHandlers['appText'] = {
        'init': function () {
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindings) {
            let value = ko.utils.unwrapObservable(valueAccessor());
            let context = allBindings.get('appTextContext');
            let page = window.location.href;
            context = context || 'default';
            getAppText(context, value, page).then((appText) => {
                ko.utils.setTextContent(element, appText);
            });
        }
    };
    ko.virtualElements.allowedBindings['appText'] = true;

});
