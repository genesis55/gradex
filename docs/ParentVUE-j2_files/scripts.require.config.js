﻿require.config({
    baseUrl: window.applicationRoot + 'txpapp',
    urlArgs: window.resourceCacheString,
    waitSeconds: 60,
    shim: {
        'bootstrap': { 'deps': ['jquery', 'popper', 'tether'] },
        "velocity": { 'deps': ["jquery"] },
        "sidenav": { 'deps': ["hammer"] },
        'knockout': {
            exports: 'ko'
        },
        'ko.track-change': {
            deps: ['knockout']
        },
        "image-croper": { 'deps': ["css!content.cropper.min.css"] },
    },
    babel: {
        fileExtension: '.jsx'
    },
    paths: {
        'jquery': 'scripts.jquery-global',
        'popper': 'scripts.popper.min',
        'bootstrap': 'scripts.bootstrap-global',
        'knockout': 'scripts.knockout-global',
        'knockout-mapping': 'scripts.knockout-mapping-global',
        'text': 'scripts.text',
        'css': 'scripts.css',
        'app': 'scripts.app',
        'taptarget': 'scripts.taptarget',
        'waves': 'scripts.waves',
        'devexpress': 'scripts.devexpress-global',
        'fixedactionbutton': 'scripts.fixedactionbutton',
        'velocity': 'scripts.velocity',
        'tether': 'scripts.tether.min',
        'sidenav': 'scripts.sidenav',
        'hammer': 'scripts.hammer',
        'ko.droppable': 'scripts.ko.droppable',
        'ko.bsChecked': 'scripts.ko.bsChecked',
        'ko.track-change': 'scripts.ko.trackChange',
        'ko-bindings': 'scripts.ko.bindinghandlers',
        'ckeditor-classic': '../js/ckeditor5/ckeditor',
        'toast': 'scripts.toast',
        'ckBinder': 'scripts.ckBinder',
        'textarea-expander': '../resources/GBResources/textareaExpander',
        'streams-global': '../resources/RTStream/js.Global_Functions',
        'jquery-ui': 'scripts.jquery-ui-global',
        'gb-calcs': 'scripts.gb-calcs',
        'iris': 'scripts.iris',
        'ko-projections': 'scripts.ko.projections',
        'moment': 'scripts.moment',
        'componentConfigs': 'scripts.componentConfigs',
        'videojs': 'scripts.videojs.video.min',
        'RecordRTC': 'scripts.videojs.RecordRTC.min',
        'RecordRTC-adapter': 'scripts.videojs.adapter',
        'VideojsRecord': 'scripts.videojs.videojs.record.min',
        'global/window': 'scripts.window',
        'global/document': 'scripts.document',
        'ko-perf-report': 'scripts.ko.perf.report',
        'underscore': 'scripts.underscore-1.12',
        'clipboard': 'scripts.clipboard.min',
        'cropit': 'scripts.jquery.cropit',
        'ko-filter': 'scripts.ko.filter',
        'ko-index': 'scripts.ko.index',
        'ko-indexBy': 'scripts.ko.indexBy',
        'ko-map': 'scripts.ko.map',
        'ko-sortBy': 'scripts.ko.sortBy',
        'image-croper': 'scripts.cropper.min',
        //'image-croper-css': '',
        'react': 'scripts.react',
        'react-dom': 'scripts.react-dom',
        'babel': 'scripts.babel-5.8.34.min',
        'jsx': 'scripts.jsx'
    }
});

//initialize any global css, etc.
require(['app', 'knockout', 'css!content.app.css'], function (app, ko) {

    let ComponentLoader = function (app) {
        var self = this;

        self.dashesToDots = function (name) {
            return name = name.replace(/-/g, '.');
        };

        self.dotsToDashes = function (name) {
            name = name.replace(/\./g, '-');
            return name;
        };

        self.registerCustomComponent = function (name) {
            name = self.dashesToDots(name);

            if (ko.components.isRegistered(name)) return name;

            let namespace = '';
            let cmp = '';

            if (name.includes(':')) {
                const parts = name.split(':');
                namespace = parts[0];
                cmp = parts[1];
            } else {
                cmp = name;
            }

            ko.components.register(name, {
                template: { require: 'text!' + cmp + '.html' },
                viewModel: { require: cmp }
            });
            require(['css!' + cmp + '.css'], function () { });

            // this is needed until all the "." notations are converted to "-" notation
            // ...specifically needed for components created using the component binding (with "-" notation) instead of markup
            var dashes = self.dotsToDashes(name);
            if (!ko.components.isRegistered(dashes)) {
                ko.components.register(dashes, {
                    template: { require: 'text!' + cmp + '.html' },
                    viewModel: { require: cmp }
                });
            }

            return name;
        };

        self.createElement = function (type, props) {
            var $e = document.createElement(type);
            for (let index = 0; index < props.length; index++) {
                let prop = props[index];
                $e.setAttribute(prop.name, prop.value);
            }
            //for (var prop in props) {
            //    $e.setAttribute(props.item(prop).name, props.item(prop).value);
            //}
            return $e;
        };

        self.registerUserControl = function (name, node) {
            if (ko.components.isRegistered(name)) return name;
            //register user controls
            if (name.indexOf('uc:') > -1) {
                //apply any bindings to allow for custom attributes
                let containerForAttributes = self.createElement('div', node.attributes);
                ko.applyBindings(ko.dataFor(node), containerForAttributes);
                ko.components.register(name, {
                    template: {
                        loadUserControl: name.replace('uc:', '') + '.ascx',
                        params: $.map(containerForAttributes.attributes, function (attr) {
                            return { [attr.name]: attr.value };
                        })
                    }
                });
                return name;
            }
            return false;
        };

        self.setupComponents = function () {
            ko.components.getComponentNameForNode = function (node) {
                return ko.components.stGetComponentNameForNode?.call(this, node)
                    || ko.components.txpGetComponentNameForNode?.call(this, node);
            };

            ko.components.txpGetComponentNameForNode = function (node) {
                var name = node.tagName && node.tagName.toLowerCase();
                if (name.startsWith('sm-')) {
                    return name;
                } else if (name.startsWith('txpapp:')) {
                    return self.registerCustomComponent(name);
                } else if (node.hasAttribute('params')) {
                    return self.registerCustomComponent('txpapp:' + name);
                } else if (name.startsWith('uc:')) {
                    return self.registerUserControl(name, node);
                }
                return false;
            };

            ko.components.loaders.unshift({
                txpLoader: true,
                getConfig: function (name, callback) {

                    let namespace = '';
                    let cmp = '';

                    if (name.includes(':')) {
                        const parts = name.split(':');
                        namespace = parts[0];
                        cmp = parts[1];
                    } else {
                        cmp = name;
                    }
                    if (namespace == '' | namespace == 'txpapp' | namespace == 'uc') {
                        self.registerCustomComponent(name);
                    }
                    callback(null);
                },
                loadTemplate: function (name, templateConfig, callback) {
                    const prefix = name.split('.')[0];
                    if (name.startsWith('sm-') || ['KO', 'ST'].includes(prefix)) {
                        callback(null);
                        return;
                    }
                    var wrappedHtml = '<!-- ko if: configReady --><!-- ko using: init() -->' + templateConfig + '<!-- /ko --><!-- /ko -->';
                    callback($(wrappedHtml).get());
                },
                loadViewModel: function (name, componentVM, callback) {
                    const prefix = name.split('.')[0];
                    if (name.startsWith('sm-') || ['KO', 'ST'].includes(prefix)) {
                        callback(null);
                        return;
                    }

                    callback(function (params, componentInfo) {
                        var start = new Date().getTime();
                        if (params['config'] === undefined) {
                            console.error(name + ':config property not supplied, component will not render');
                        }
                        if (!ko.isObservable(params.config) && params['config'] === null) {
                            console.error(name + ':params.config NOT passed as observable and is null, component will not render without a config object.');
                        }
                        //this rootVM is needed so we dont create the component view model until the config is ready. that way we are never passing an uninitialized config to the component vm. once config is ready the if binding will bind the cmpVM and it will self initialize once.
                        var rootVM = new function () {
                            var self = this;

                            self.console = {
                                log: function (message, args) {
                                    var style = 'color: purple;';
                                    console.log('%c' + message, style, args);
                                },
                                logEvent: function (message, args) {
                                    var style = 'color: yellow;';
                                    console.log('%c' + message, style, args);
                                },
                                logBold: function (message, args) {
                                    var style = 'color: purple; font-weight: bold;';
                                    console.log('%c' + message, style, args);
                                }
                            };

                            self.configReady = ko.observable(false);

                            self.configWatcher = ko.computed(function () {
                                if (self.configReady() === true) {
                                    console.warn(name + ':configChanged: Already Rendered.');
                                    return true;
                                }
                                var config = ko.unwrap(params.config);
                                var result = config !== undefined && config !== null;
                                if (!result) {
                                    self.console.log('waiting for config', name);
                                }
                                self.configReady(result);
                                return result;
                            });

                            //expose the global app.topics here to allow of auto clean up on component dispose.
                            self.events = function (id) {
                                var ev = this;
                                //we are going to wrap any subscriptions so that we can automatically unsubscribe in the dispose.
                                ev.publish = function (data) {
                                    self.console.logEvent('publish event:' + id + '-->', data);
                                    app.topic(id).publish(data);
                                };

                                ev.subscribe = function (func) {
                                    //self.console.logEvent('subscribe event:' + id + '-->', func);
                                    app.topic(id).subscribe(func);
                                    addDisposable({
                                        dispose: function () {
                                            //self.console.logEvent('dispose event:' + id + '-->', func);
                                            app.topic(id).unsubscribe(func);
                                        }
                                    });
                                };

                                ev.has = function () {
                                    return app.topic(id).callbacks.has();
                                };

                                ev.unsubscribe = function (func) {
                                    //self.console.logEvent('unsubscribe event:' + id + '-->', func);
                                    app.topic(id).unsubscribe(func);
                                };

                                return ev;
                            };
                            //we can also provide auto disposal of objects as well.
                            var disposables = [];
                            var addDisposable = function (disposable) {
                                if (disposable.dispose && typeof disposable.dispose === "function") {
                                    //item is properly configured
                                    disposables.push(disposable);
                                } else {
                                    //reformat the item
                                    disposables.push({ dispose: disposable });
                                }
                                return disposable;
                            };

                            self.disposeUserDisposables = function () {
                                ko.utils.arrayForEach(disposables, disposeOne);
                                disposables = [];
                            };

                            // little helper that handles being given a value or prop + value
                            var disposeOne = function (disposable) {
                                if (disposable && typeof disposable.dispose === "function") {
                                    disposable.dispose();
                                }
                            };
                            let disposableObject = function () {
                                var dis = this;
                                dis.prototype._dispose = new $.Deferred();
                            };

                            //create backing field so we can have access to a singular VM instance from inside the component without the function call. 
                            self.vm;
                            self.init = function () {
                                if (self.vm === undefined) {
                                    try {
                                        self.configWatcher.dispose();//dont need this anymore
                                        var config = ko.unwrap(params.config);
                                        //this is a bit tricky, if you want any templates to be available to the component that were written as html between the <component></component> tags
                                        //we need to specify a location via some magic locator. knockout has a special property for this but we cant use it because it requires binding and its too late
                                        //because whatever control we want to use the markup for has already consumed it and its not transformed yet.
                                        var $cmpTempl = $(componentInfo.element);
                                        var $componentTemplateNodes = $cmpTempl.find('componentTemplateNodes');
                                        if (componentInfo.templateNodes.length !== 0) {
                                            $componentTemplateNodes.replaceWith(componentInfo.templateNodes);
                                        }
                                        //setup a dispose deferred for internal handling of the dispose of the view model.
                                        //we will call any method called dispose as a 'front end' cleanup framework.
                                        componentVM.prototype._dispose = new $.Deferred();
                                        //passing all these as seperate params for now. probably will change to an object later. last param (params) enables special features when host components need to expose functionality to their children. tabs is one case where the child might want to change name of the tab, etc.. 
                                        if (window.security.metaData === undefined) {
                                            window.security.metaData = (table) => {
                                                if (!window.security._metaData[table]) {
                                                    throw `metaData for ${table} does not exist.`;
                                                }
                                                return {
                                                    property: (column) => {
                                                        let col = column.toLowerCase();
                                                        if (!window.security._metaData[table][col]) {
                                                            throw `metaData for ${table}.${column} does not exist.`;
                                                        }
                                                        return window.security._metaData[table][col];
                                                    }
                                                };
                                            }
                                        }
                                        self.vm = new componentVM(config, window.security, self.events, addDisposable, params);
                                        var end = new Date().getTime() - start;
                                        var log = {};
                                        log[name] = end / 1000 + 's';
                                        log.params = params;
                                        log.vm = self.vm;
                                        self.console.logBold('vm created', log);
                                    } catch (e) {
                                        console.error(name + ' Component Creation Failed', e);
                                        throw e;//no point in continuing
                                    }
                                }
                                return self.vm;
                            };
                            self.dispose = function () {
                                self.console.log('dispose', name);
                                self.configWatcher.dispose();
                                self.disposeUserDisposables();
                                if (self.vm) {
                                    self.vm._disposed = true;
                                    self.vm._dispose.resolve();
                                    if (self.vm.dispose) {
                                        self.vm.dispose();
                                    }
                                }

                            };
                        };
                        return rootVM;
                    });
                }
            });

            const userControlLoader = {
                loadTemplate: function (name, templateConfig, callback) {
                    if (templateConfig.loadUserControl) {
                        app.LoadUserControl(templateConfig.loadUserControl, templateConfig.params).done(function (data) {
                            ko.components.defaultLoader.loadTemplate(name, data, callback);
                        });
                    } else {
                        // Unrecognized config format. Let another loader handle it.
                        callback(null);
                    }
                }
            };
            ko.components.loaders.unshift(userControlLoader);
        };

        //startup the component system for this page load.
        self.setupComponents();

    };

    window.COMPONENT_LOADER = new ComponentLoader(app);

    window.document.rootViewModel = {
        isAdmin: ko.observable(window.isAdmin),
        config: ko.observable({}),
        componentInjector: ko.observableArray()
    };

    // Right now the gb_componentLoader.ascx takes care of this in the future we will want to do it here (when we have no more aspx pages)
    //ko.applyBindings(document.rootViewModel, $(".component-loader-container[data-bound!='true']").get(0));

});
