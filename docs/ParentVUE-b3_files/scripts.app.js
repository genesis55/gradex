﻿(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.app = factory();
    }

}(this, function () {
    return new function () {
        var self = this;

        self.console = {
            logFunction: function (message, args) {
                var style = 'color: yellow; font-style: italic; background-color: blue; padding: 2px;';
                console.log('%c' + message, style, args);
            },
            logAjax: function (message, args) {
                var style = 'color: green;';
                console.log('%c' + message, style, args);
            },
            logAjaxBold: function (message, args) {
                var style = 'color: green; font-weight: bold;';
                console.log('%c' + message, style, args);
            }
        };

        let timeMeasures = {};
        self.measureFuncTime = function (thisArg, func, args) {
            if (func) {
                let testName = func.name;
                let start = new Date().getTime();
                let result = func.call(thisArg, args);
                let end = new Date().getTime() - start;
                self.DisplayOutput(testName + ' = ' + end + ' ms');
                return result;
            } else {
                throw 'no function passed to measureFuncTime';
            }
        };

        self.measureTestTime = function (testName) {
            let testObj = timeMeasures[testName];
            if (testObj) {
                let end = new Date().getTime() - testObj.start;
                self.DisplayOutput(testName + ' = ' + end + ' ms');
            } else {
                let start = new Date().getTime();
                timeMeasures[testName] = { start: start };
            }
        };


        //set for client side debug output
        var DebugOutput = true;
        self.DisplayOutput = function (text) {
            if (DebugOutput) {
                var DisplayOutput = $("#DisplayOutput");
                if (DisplayOutput.length > 0) {
                    DisplayOutput.prepend($('<div></div>').text(text));
                } else {
                    $("body").append($('<div id="DisplayOutput" style="z-index:10000; position: fixed; height: 200px; overflow: auto; top: 0; right: 0; border: solid 1px red; background-color: white; padding: 10px; margin: 5px; font-size: .8em; white-space: nowrap;"></div>').prepend($('<div></div>').text(text)));
                }
            }
        };

        /***************************************/
        // PUB/SUB (only use from events param in component constructor unless you have no other choice. 
        //must unsubscribe your event on component dispose if you dont)
        /***************************************/
        var topics = {};

        self.topic = function (id) {
            var topic = id && topics[id];

            if (!topic) {
                let callbacks = $.Callbacks();

                topic = {
                    publish: callbacks.fire,
                    subscribe: function (f) {
                        return callbacks.add(f);
                    },
                    unsubscribe: function (f) {
                        return callbacks.remove(f);
                    },
                    callbacks: callbacks
                };

                if (id) {
                    topics[id] = topic;
                    //console.log('new event topic created', id);
                }
            }
            return topic;
        };

        var SetupAlert = function () {
            // Grade Book alert system implementation
            if (window.DevExpress && window.DevExpress.ui && window.DevExpress.ui.notify) {
                self.oldAlert = window.alert;
                window.alert =
                    function () {
                        // The traditional implementation of window.alert has one arguement, the message.  Ours can have many.
                        if (arguments.length === 0) {
                            return;
                        }

                        var message = arguments[0];
                        var displayLength = 60 * 1000;
                        var className = 'info';

                        if (arguments.length === 3) {
                            message = arguments[0];
                            displayLength = arguments[1];
                            className = arguments[2];
                        }

                        self.Alert(message, displayLength, className);
                    };
            }
        }();

        //creates a toast notification. messageType: The message's type: "info", "warning", "error" or "success". 
        self.Alert = function (message, displayDuration, messageType, messageConfig) {
            if (displayDuration === undefined) { displayDuration = 30000; }
            if (messageType === undefined) { messageType = "warning"; }
            if (messageConfig === undefined) { messageConfig = {}; }

            if (window.DevExpress && window.DevExpress.ui && window.DevExpress.ui.notify) {
                let config = $.extend({
                    message: message,
                    //width: '50%',
                    shading: true,
                    position: { my: 'center', at: 'center', of: window },
                    closeOnClick: true,
                    closeOnOutsideClick: true
                }, messageConfig);
                window.DevExpress.ui.notify(config, messageType, displayDuration);
            } else {
                window.alert(message);
            }
        };

        self.alertInfo = function (message, displayDuration, messageConfig) {
            self.Alert(message, displayDuration, 'info', messageConfig);
        };
        self.alertWarning = function (message, displayDuration, messageConfig) {
            self.Alert(message, displayDuration, 'warning', messageConfig);
        };
        self.alertError = function (message, displayDuration, messageConfig) {
            self.Alert(message, displayDuration, 'error', messageConfig);
        };
        self.alertSuccess = function (message, displayDuration, messageConfig) {
            self.Alert(message, displayDuration, 'success', messageConfig);
        };

        self.saveUndoCancel = function (config) {
            var popup = new self.popup('Save or Undo Changes', 'save.undo.cancel',
                { config: config },
                {
                    onHidden: function (e) {
                        if (config.onHidden) {
                            config.onHidden();
                        }
                    },
                    width: '400px',
                    height: '200px'
                });
            popup.open();
        };

        self.apiAjax = function (path, data, method, success, failure, complete) {
            //this method is only for the use of our built in api controller
            if (window.applicationRoot == undefined) { window.applicationRoot = '/'; }
            path = `${window.applicationRoot}api/GB/${path}`;
            return self.ajax(path, data, method, success, failure, complete);
        };
        self.ajax = function (path, data, method, success, failure, complete) {
            var jsonData;

            if (data) {
                jsonData = JSON.stringify(data);
            }

            $.ajax({
                type: method,
                url: path,
                beforeSend: function (request) {
                    request.setRequestHeader("CURRENT_WEB_PORTAL", window.CURRENT_WEB_PORTAL);
                },
                data: jsonData,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                complete: function (data) {
                    if (complete) {
                        complete(data);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                    switch (XMLHttpRequest.status) {
                        case 500:
                            console.error(XMLHttpRequest);
                            self.alertError(XMLHttpRequest.responseText);
                            break;

                        case 404:
                            console.error(XMLHttpRequest);
                            self.alertError('The API route (' + path + ') could not be found.');
                            break;

                        case 417:
                            console.error(XMLHttpRequest);
                            if (XMLHttpRequest.responseJSON.Msg) {
                                self.alertError(XMLHttpRequest.responseJSON.Msg);
                            } else {
                                self.alertError(errorThrown);
                            }
                            break;

                        case 409:
                            console.warn(XMLHttpRequest.responseText);
                            window.parent.GetRootParent().Lock();
                            break;

                        default:
                            console.error(XMLHttpRequest);
                            self.alertError(errorThrown);
                            break;
                    }
                    if (failure) {
                        failure(XMLHttpRequest);
                    }

                },
                success: function (data, textStatus) {

                    if (!data) {
                        data = {};
                    }

                    if (data && data.d) {
                        data = data.d;
                    }

                    if (success) {
                        success(data);
                    }
                }
            });
        };

        //returns promise
        _privateCall = function (friendlyName, method, parameters, async) {
            var start = new Date().getTime();
            var d = new $.Deferred();
            var path = 'ClientSideData/Transfer' + (async ? '/async' : '') + '?action=' + friendlyName + '-' + method;
            var postData = {
                FriendlyName: friendlyName,
                Method: method,
                Parameters: JSON.stringify(parameters, function (key, value) {
                    if (key === 'dataSource' && value && value.store) {
                        // don't encode any data sources, as they'll all cause a circular reference
                        //object has dataSource property that has an object with a store property. likely as dxdatasource so dont encode it.
                        return;
                    }
                    return value;
                })
            };
            var success = function (data) {
                var end = new Date().getTime() - start;
                self.console.logAjaxBold('Server response for ' + friendlyName + '/' + method + ' (' + end / 1000 + 's' + ') -->', data);
                d.resolve(data);
            };
            var failure = function (data) {
                d.reject(data);
            };
            var complete = function (data) {
                var end = new Date().getTime() - start;
                self.console.logAjax('Total time for ' + friendlyName + '/' + method, '(' + end / 1000 + 's' + ')');//includes any done handler processing
            };
            self.console.logAjax('Server request for ' + friendlyName + '/' + method + ' with -->', parameters);
            self.apiAjax(path, postData, 'post', success, failure, complete);
            return d;
        };

        //used for long running calls to provide status report from server
        let callStatusUi = null;
        self.toggleCallStatusUi = function (isComplete, usePopoverElement) {
            console.log('toggleCallStatusUi', isComplete);
            if (callStatusUi === null) {
                if (usePopoverElement) {
                    callStatusUi = new self.popOver('Please Wait...', 'app.call.status', { config: {} }, { width: 350, height: 150, target: usePopoverElement, closeOnOutsideClick: false });
                } else {
                    callStatusUi = new self.popup('Please Wait...', 'app.call.status', { config: {} }, { width: '50%', height: 150, showTitle: false, toolbarItems: null });
                }
            }
            if (isComplete) {
                callStatusUi.close();
                callStatusUi = null;
            } else {
                callStatusUi.open();
            }
        };
        let callStack = [], callStatusInitialDelay = 500;
        self.call = function (params) {
            if (arguments.length > 1) {
                //keep existing functionality.
                return _privateCall.apply(self, arguments);
            }

            var config = {
                friendlyName: '',
                method: null,
                parameters: null,
                koMapping: {},
                koMapTo: null,
                async: false,
                showStatus: false,
                statusElement: null,
                changeTracker: null//merge please
            };
            $.extend(config, params);

            let myCall = null;
            if (config.showStatus === true) {
                //start showing the popup after short delay incase the call is really fast some times and slow others. dont bother the user unless the call is taking a longer time.
                let callStatusTimer = setTimeout(function () { self.toggleCallStatusUi(false, config.statusElement); }, callStatusInitialDelay);
                //capture the call and when it resolves then check to see if there are any others pending before closing the wait ui
                let stackObj = { friendlyName: config.friendlyName, method: config.method, call: null, resolved: false };
                myCall = _privateCall(config.friendlyName, config.method, config.parameters, true).always(function () {
                    //cancel the timer incase it hasnt shown the popup yet
                    clearTimeout(callStatusTimer);
                    stackObj.resolved = true;
                    let isComplete = callStack.every(so => so.resolved);
                    self.toggleCallStatusUi(isComplete, config.statusElement);
                });
                stackObj.call = myCall;
                callStack.push(stackObj);
            } else {
                myCall = _privateCall(config.friendlyName, config.method, config.parameters, config.async);
            }

            return myCall.done(function (data) {
                if (config.koMapTo) {
                    //dont register anything from the server mapping as a client change
                    if (config.changeTracker) { config.changeTracker.changeTrackingEnabled(false); };//merge please
                    ko.mapping.fromJS(data, config.koMapping, config.koMapTo);
                    //turn it back on
                    if (config.changeTracker) { config.changeTracker.changeTrackingEnabled(true); }//merge please

                }
            });
        };

        var DXDataSourceRequests = {};
        var DXDataSourceTimers = {};

        self.DXDataSource = function (friendlyName, configOptions, isPivot) {
            configOptions = configOptions || {
                oneRequestPerSource: false,
                bindObservables: false,
                async: false
            };
            var clientState = configOptions.clientState || {};
            var dataSourceConfig = configOptions.dataSourceConfig || {};
            var dataSourceObj;

            var dsConfig = {
                key: 'id',
                // need to handle the other parameters
                load: function (loadOptions) {
                    var filter = loadOptions.filter;

                    if (Array.isArray(filter)) {
                        filter = $.extend(true, [], filter);
                        loadOptions.filter = filter;
                    }

                    // Prevent queuing multiple requests for the same datasource
                    if (!configOptions.oneRequestPerSource || !DXDataSourceRequests[friendlyName]) {
                        var d = new jQuery.Deferred();
                        DXDataSourceRequests[friendlyName] = d.promise();

                        var doLoad = function () {
                            var c = self.call({
                                friendlyName: friendlyName,
                                method: 'LoadWithOptions',
                                parameters: { loadOptions: loadOptions, clientState: ko.toJS(clientState) },
                                async: configOptions.async
                            }).done(function (result) {
                                if (result.metaData) {
                                    dataSourceObj.metaData = result.metaData;
                                }

                                d.resolve(result.responseData.data, {
                                    totalCount: result.responseData.totalCount,
                                    summary: result.responseData.summary,
                                    groupCount: result.responseData.groupCount,
                                    metaData: result.metaData
                                });
                            }).fail(function (message) {
                                d.reject(message);
                            })
                                .always(function () {
                                    delete DXDataSourceRequests[friendlyName];
                                });
                        };

                        // make sure the last request is the accepted request
                        clearTimeout(DXDataSourceTimers[friendlyName]);
                        if (configOptions.oneRequestPerSource) {
                            DXDataSourceTimers[friendlyName] = setTimeout(doLoad, 0);
                        }
                        else {
                            doLoad();
                        }
                    }

                    return DXDataSourceRequests[friendlyName];
                },

                totalCount: function () {
                    return self.call(friendlyName, 'TotalCount', null);
                },

                byKey: function (key, extraOptions) {
                    extraOptions = extraOptions || {};
                    extraOptions.primaryKey = [dsConfig.key];
                    return self.call(friendlyName, 'ByKey', { key: key, extraOptions: extraOptions, clientState: ko.toJS(clientState) });
                },

                insert: function (values) {
                    return self.call(friendlyName, 'Insert', { values: values, clientState: ko.toJS(clientState) });
                },

                update: function (key, values) {
                    return self.call(friendlyName, 'Update', { key: key, values: values, clientState: ko.toJS(clientState) });
                },

                remove: function (key) {
                    return self.call(friendlyName, 'Remove', { key: key, clientState: ko.toJS(clientState) });
                }
            };
            var customStore = null;

            $.extend(dsConfig, dataSourceConfig);

            var dataSourceReload = function () { };

            if (isPivot === true) {
                dataSourceObj = new DevExpress.data.PivotGridDataSource(dsConfig);
            } else {
                // This is needed to work with the server-side DataSourceLoadOptions/DataSourceLoader.
                // It signals the widget to pass the filtering data in this format: [["name", "contains", "value"]] ... which is what the server-side is expecting to deserialize.
                // Without this switch, the format passed is: { searchExpr: "name", searchOperation: "contains", searchValue: "value" } ... server-side DataSourceLoadOptions can't deserialize this.
                dsConfig.useDefaultSearch = true;
                customStore = new DevExpress.data.CustomStore(dsConfig);
                dsConfig.store = customStore;
                dataSourceObj = new DevExpress.data.DataSource(dsConfig);
            }

            if (configOptions.bindObservables) {
                var subscribeAll = function (data, fn) {
                    Object.values(data).forEach((value, index) => {
                        if (ko.isSubscribable(value)) {
                            subscribeAll(value(), fn);
                            value.subscribe(fn);
                        } else if (typeof value == 'function') {
                            subscribeAll(value, fn);
                        }
                    });
                };
                var reloadTimer;
                subscribeAll(clientState, function () {
                    clearTimeout(reloadTimer);
                    reloadTimer = setTimeout(function () {
                        dataSourceObj.reload();
                    }, 0);
                });
            }

            return dataSourceObj;
        };

        self.throttle = function (func, wait, options) {
            var context, args, result;
            var timeout = null;
            var previous = 0;
            options || (options = {});
            var later = function () {
                previous = options.leading === false ? 0 : new Date().getTime();
                timeout = null;
                result = func.apply(context, args);
                context = args = null;
            };
            return function () {
                var now = new Date().getTime();
                if (!previous && options.leading === false) previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                    context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        };

        self.createCookie = function (name, value, days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        };

        self.readCookie = function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        };

        self.eraseCookie = function (name) {
            createCookie(name, "", -1);
        };

        self.processControlCommands = function ($control, cmdsData, isAsync, validationOnly, event) {
            //support multiple commands separated by commas
            var cmds = [];
            var cmdResults = [];
            if (cmdsData.indexOf(',') > 0) {
                cmds = cmdsData.split(',');
            } else {
                cmds.push(cmdsData);
            }
            //handle each command
            for (var i = 0; i < cmds.length; i++) {
                var cmd = cmds[i].trim();
                var cmdArgs = $control.data(cmd);
                var cmdTarget = $control.data('target');
                if (cmdTarget) {
                    $control = $(cmdTarget);
                }
                //the return value for this command will be stored in the cmdResults array
                var returnValue = true;
                var ctrlVal;
                switch (cmd) {
                    case 'dynamicmodal':
                        //the cmdArgs represents the control to load in the dynamic modal handler.
                        self.CreateDynamicModal($control);
                        break;

                    case 'slidetoggle':
                        $control.parent().find(cmdArgs).slideToggle();
                        break;

                    case 'toggle':
                        $control.parent().find(cmdArgs).toggle();
                        break;

                    case 'checkslide':
                        if ($control.is(":checked")) {
                            //show the controls mentioned in the args
                            $(cmdArgs).slideDown();
                        } else {
                            $(cmdArgs).slideUp();
                        };
                        break;

                    case 'childshow':
                        //get the control mentioned in the cmdArgs
                        $control.find(cmdArgs).show();
                        break;

                    case 'childhide':
                        //get the control mentioned in the cmdArgs
                        $control.find(cmdArgs).hide();
                        break;

                    case 'radioclass':
                        $("[data-radioclass='" + cmdArgs + "']").removeClass(cmdArgs);
                        $control.toggleClass(cmdArgs);
                        break;

                    case 'toggleclass':
                        $control.toggleClass(cmdArgs);
                        break;

                    case 'function':
                        if (cmdArgs) {
                            var fnArgs = $control.data('function-args');
                            var fn = window.getFunctionFromString(cmdArgs);
                            if (typeof fn === 'function') {
                                fn.call($control, fnArgs);
                            };
                        }
                        break;

                    case 'disable':
                        // disable the control
                        $control.attr('disabled', 'disabled');
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.removeAttr('disabled');
                            });
                        };
                        break;

                    case 'enable':
                        // remove the disable
                        $control.removeAttr('disabled');
                        break;

                    case 'blockui':
                        // Allow for BlockUI Opt-Out, and also skip if the control is not in the DOM.
                        if ($control.closest('.OptOutBlockUI').length > 0 || $control.closest('body').length === 0) {
                            return;
                        }

                        $control.block({
                            message: null,
                            overlayCSS: { backgroundColor: 'rgb(250,250,250)', opacity: 0.3 }
                        });
                        if (cmdArgs) {
                            $control.attr('title', cmdArgs);
                        };
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.unblock();
                            });
                        };
                        break;

                    case 'unblockui':
                        $control.unblock();
                        break;

                    case 'fadein':
                        $control.fadeIn();
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.fadeOut();
                            });
                        };
                        break;

                    case 'fadeout':
                        $control.fadeOut();
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.fadeIn();
                            });
                        };
                        break;

                    case 'hide':
                        $control.hide();
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.show();
                            });
                        };
                        break;

                    case 'show':
                        $control.show();
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.hide();
                            });
                        };
                        break;

                    case 'addhtml':
                        //command args are the content
                        $control.html(cmdArgs);
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.empty();
                            });
                        };
                        break;

                    case 'settext':
                        var curtext = $control.text();
                        $control.data("original-text", curtext);
                        $control.text(cmdArgs);
                        if (isAsync) {
                            $(document).one("EndRequest", function () {
                                $control.text($control.data("original-text"));
                            });
                        };
                        break;

                    case 'range':

                        self.clearValidationPopover();
                        //what are the ranges?
                        var min = $control.data("min");
                        var max = $control.data("max");
                        //get the value of the control
                        ctrlVal = parseInt($control.val());
                        if (ctrlVal >= min && ctrlVal <= max) {
                            //input is valid, remove any previously invalid state
                            if (validationOnly) {
                                returnValue = SetControlErrorState($control, true);
                            }

                            if ($control.data('after-validate') === 'postback') {
                                gbapp.setDirty(false);
                                var name = $control.attr("name");
                                __doPostBack(name, '');
                            }

                            returnValue = SetControlErrorState($control, true);

                        } else {
                            //input is not valid, add invalid state  
                            returnValue = SetControlErrorState($control, false, 'value is not in required range, from ' + min + ' to ' + max);
                        }
                        break;

                    case 'required':

                        self.clearValidationPopover();
                        //be sure a value has been entered
                        ctrlVal = $control.val();
                        if (ctrlVal === '') {
                            //ignore keypress when the control is empty
                            if (event && (event.type === 'keypress')) {
                                returnValue = true;
                                break;
                            }
                            //value is not valid
                            returnValue = SetControlErrorState($control, false, 'a value is required');
                        } else {
                            returnValue = SetControlErrorState($control, true);
                        }
                        break;

                    case 'datatype':

                        self.clearValidationPopover();
                        //ignore keypress when the control is empty
                        if (event && (event.type === 'keypress')) {
                            returnValue = true;
                            break;
                        }

                        var isNumeric = function (n) {
                            return !isNaN(parseFloat(n)) && isFinite(n);
                        }

                        ctrlVal = $control.val();
                        if (ctrlVal !== '') {
                            switch (cmdArgs) {
                                case 'number':
                                    try {
                                        if (isNumeric(ctrlVal)) {
                                            //value is valid
                                            returnValue = SetControlErrorState($control, true);
                                        } else {
                                            returnValue = SetControlErrorState($control, false, 'value is not numeric');
                                            $control.focus();
                                        }
                                    } catch (e) {
                                        returnValue = SetControlErrorState($control, false, 'value is not numeric');
                                    }
                                    break;

                                default:
                                    //value is not valid
                                    returnValue = SetControlErrorState($control, false, 'data type validator ' + cmdArgs + ' is not coded in attributecommands.js');
                            }
                        } else {
                            returnValue = SetControlErrorState($control, true);
                        }
                        break;

                    case 'maxlength':
                        self.clearValidationPopover();
                        ctrlVal = $control.val();
                        var maxLength = parseInt(cmdArgs);
                        gbapp.SetRemainingChars($control, maxLength);
                        break;

                    case 'form':
                        //get all the validators and stop the click if one fails
                        var $btn = $('[data-validate="form"]');
                        returnValue = self.validateForm($btn);
                        break;
                    // possibly not being used:
                    case 'validate-form':
                        returnValue = validateForm($control);
                        break;

                    case 'validategroup':
                        //we want to get all the form controls that have data-validate-group equal to this cmd attr
                        var isFormValid = self.validateControlGroup(cmdArgs);
                        if (isFormValid) {
                            $(document).trigger('validategroup', [cmdArgs, isFormValid]);
                        }
                        returnValue = isFormValid;
                        break;

                    default:

                } //end switch

                cmdResults.push(returnValue);

                if (!returnValue) {
                    break;
                }
            } //end for

            //if all the results are true return true.
            return cmdResults.every(function (i) { return i });

        };

        self.activeComponents = {};
        self.insertComponent = function (key, componentString, params) {
            console.log('insertComponent', [key, componentString, params]);
            self.activeComponents[key] = { name: componentString, params: params };
            document.rootViewModel.componentInjector.push(self.activeComponents[key]);
        };
        self.removeComponent = function (key) {
            console.log('removeComponent', self.activeComponents[key]);
            document.rootViewModel.componentInjector.remove(self.activeComponents[key]);
            self.activeComponents[key] = null;
        };

        self.popup = function (title, component, componentParams, popUpConfig, popUpScrollViewConfig) {
            var p = this;
            var d = new Date();
            p.key = `${d.getTime()}<${component}>`;

            p.title = ko.observable(title);
            p.component = component;
            p.componentParams = componentParams;
            //add a couple helper properties for the target component to be able to close itself.
            p.componentParams.isPopup = true;
            p.componentParams.closePopup = function () {
                p.close();
            };
            p.componentParams.getPopupComponent = function () {
                return p.popupInstance;
            };

            p.popUpConfig = popUpConfig;

            p.scrollViewConfig = popUpScrollViewConfig;

            p.onHidden = function (e) {
                self.removeComponent(p.key);
            };

            p.open = function () {
                self.insertComponent(p.key, 'popup', { config: p });
            };

            p.close = function () {
                if (p.popupInstance) {
                    console.log('closing popup', component);
                    p.popupInstance.hide();
                    p.popupInstance = null;
                }
            };
        };

        self.popOver = function (title, component, componentParams, popOverConfig) {
            var p = this;
            var d = new Date();
            p.key = `${d.getTime()}<${component}>`;
            p.visible = ko.observable(false);

            p.title = ko.observable(title);
            p.component = component;
            p.componentParams = componentParams;

            //add a couple helper properties for the target component to be able to close itself.
            p.componentParams.isPopup = true;
            p.componentParams.closePopup = function () {
                p.close();
            };

            p.popOverConfig = popOverConfig;

            var paramsOnHidden = popOverConfig.onHidden;
            p.onHidden = function (e) {
                if (paramsOnHidden) {
                    paramsOnHidden(e);
                }
                self.removeComponent(p.key);
            };

            p.open = function () {
                self.insertComponent(p.key, 'popover', { config: p });
                p.visible(true);
            };

            p.close = function () {
                p.visible(false);
            };
        };

        self.dialog = function (title, $content, popUpConfig) {
            var popup = new self.popup(title, 'render.direct',
                {
                    config: {
                        html: $content
                    }
                },
                popUpConfig
            );
            return popup;
        };

        self.LoadRemoteScript = function (resourceClientID, url) {
            window.LoadRemoteScript(resourceClientID, url);
        };

        self.LoadRemoteStyleSheet = function (resourceClientID, url) {
            window.LoadRemoteStyleSheet(resourceClientID, url);
        };

        self.LoadUserControl = function (modalType, modalArgs) {
            var d = new $.Deferred();
            var path = 'LoadUserControl/LoadDynamic';
            var translateArgs = modalArgs;
            if (typeof modalArgs === 'object') {
                translateArgs = JSON.stringify(modalArgs);
            }
            var postData = JSON.stringify({ resourceHandler: modalType, resourceParameters: translateArgs });
            var method = 'post';
            var success = function (data) {
                d.resolve(data.Content.html);
            };
            var failure = function (data) {
                d.reject(data);
            };
            var complete = function (data) { };
            self.apiAjax(path, postData, method, success, failure, complete);
            return d;
        };

        self.whenAvailable = function (thing, callback) {
            var interval = 10; // ms
            var maxInstances = 100 //1 sec
            var instanceCount = 0;
            var logic = function () {
                var func;
                if (typeof thing === 'string' && thing.indexOf(".") > 0) {
                    func = getFunctionFromString(thing);

                } else if (typeof thing === 'string') {
                    func = window[thing];

                } else {
                    self.alertError('app.whenAvailable requires a string "thing" parameter to evaluate.');
                    return;
                }
                if (func) {
                    callback(func);
                } else {
                    instanceCount++;
                    if (instanceCount < maxInstances) {
                        window.setTimeout(arguments.callee, interval);
                    } else {
                        self.alertError('waited ' + interval * maxInstances + 'ms for ' + thing + ' without success');
                    }
                }
            };
            window.setTimeout(logic, interval);
        };

        self.parseQuery = function (url) {
            return self.parseURL(url).params;
        };

        self.parseURL = function (url) {
            if (url === undefined) {
                url = window.location.toString();
            }
            var a = document.createElement('a');
            a.href = url;
            function getParams() {
                var ret = {},
                    seg = a.search.split('?').join('&').split('&'),
                    len = seg.length, i = 0, s;
                for (i = 0; i < len; i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
                }
                return ret;
            }
            return {
                source: url,
                protocol: a.protocol.replace(':', ''),
                host: a.hostname,
                port: a.port,
                query: a.search,
                params: getParams()
            }
        };

        self.HtmlEncode = function (html) { return $('<div/>').text(html).html(); };
        self.HtmlDecode = function (text) { return $('<div/>').html(text).text(); };
        self.urlEncode = function (uri) {
            return encodeURI(uri);
        };
        self.urlDecode = function (uri) {
            return decodeURI(uri);
        };
        self.decodeQueryParam = function (p) {
            return decodeURIComponent(p.replace(/\+/g, ' '));
        };

        self.getLMSContent = function (XrefID, containerSelector) {
            var path = 'LMS/GetDisplayPanel?mode=1';
            var postData = XrefID;
            var method = 'post';
            var success = function (data) { $(containerSelector).html(data.PanelControlContent); };
            var failure = function (data) { };
            var complete = function (data) { };
            self.apiAjax(path, postData, method, success, failure, complete);
        };

        self.flashBg = function (element) {
            $(element).addClass('flash-bg');
            setTimeout(function () {
                $(element).removeClass('flash-bg');
            }, 1000);
        };

        self.animateInt = function (countFrom, countTo, callback, duration) {
            var dur = 1500;
            if (duration) {
                dur = parseInt(duration);
            }
            $({ countNum: countFrom }).animate(
                {
                    countNum: countTo
                },
                {
                    duration: dur,
                    easing: 'easeOutExpo',
                    step: function () {
                        callback(Math.floor(this.countNum));
                    },
                    complete: function () {
                        callback(Math.floor(this.countNum));
                    }
                });

        };

        self.isElementInViewport = function (element, percentX, percentY, optionalParent) {
            var tolerance = 0.01;   //needed because the rects returned by getBoundingClientRect provide the position up to 10 decimals
            if (percentX === undefined) {
                percentX = 100;
            };
            if (percentY === undefined) {
                percentY = 100;
            };
            var elementRect = element.getBoundingClientRect();
            var parentRects = [];
            if (optionalParent) {
                parentRects.push(optionalParent.getBoundingClientRect());
            } else {
                while (element.parentElement !== null) {
                    parentRects.push(element.parentElement.getBoundingClientRect());
                    element = element.parentElement;
                };
            }
            var visibleInAllParents = parentRects.every(function (parentRect) {
                var visiblePixelX = Math.min(elementRect.right, parentRect.right) - Math.max(elementRect.left, parentRect.left);
                var visiblePixelY = Math.min(elementRect.bottom, parentRect.bottom) - Math.max(elementRect.top, parentRect.top);
                var visiblePercentageX = visiblePixelX / elementRect.width * 100;
                var visiblePercentageY = visiblePixelY / elementRect.height * 100;
                return visiblePercentageX + tolerance > percentX && visiblePercentageY + tolerance > percentY;
            });
            return visibleInAllParents;
        };

        self.nvl = function (theObject, defaultValue) {
            let theValue = ko.unwrap(theObject);
            if (theValue === null || theValue === undefined) {
                return defaultValue;
            } else {
                return theObject;
            }
        };

    };
}));
