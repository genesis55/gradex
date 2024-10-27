﻿(function ($, ko) {
    if (window.koLoaderInitialized) return;
    window.koLoaderInitialized = true;

    window.componentDefinitions = {};
    window.components = {};

    let loadCount = 0;

    const componentsLoaded = (async function () {
        const allComponentsRes = await fetch(`api/v1/components/all`);
        const allComponents = await allComponentsRes.json();

        window.componentDefinitions = allComponents.data;
    })();

    const attachCss = async (namespace, name, definition) => {
        await new Promise(resolve => {
            const css = document.createElement('link');
            css.id = `${namespace}:${name}`;
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.onload = resolve;
            $(document.head).append(css);
            css.href = `api/v1/components/${namespace}/${name}.css?t=${definition.stylesheetTimestamp}`;
        })
    }

    window.callComponentApi = async function (namespace, componentName, className, methodName, data) {
        if (data && typeof data === 'object') {
            for (var i in data) {
                if (typeof data[i] === 'object') {
                    data[i] = JSON.stringify(data[i]);
                }
            }
        }

        const response = await fetch(`api/v1/components/${namespace}/${componentName}/${className}/${methodName}`, {
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        const json = await response.json();
        if (json.error) {
            throw json.error?.message || json.error;
        }

        return json.data;
    }

    ko.components.getComponentNameForNode = function (node) {
        return ko.components.stGetComponentNameForNode?.call(this, node)
            || ko.components.txpGetComponentNameForNode?.call(this, node);
    };

    ko.components.stGetComponentNameForNode = function (node) {
        var tagNameLower = node.tagName?.toLowerCase() ?? '';

        if (tagNameLower === 'ko') {
            return null;
        }

        if (ko.components.isRegistered(tagNameLower)) {
            return tagNameLower;
        }

        if (tagNameLower.includes(':') || tagNameLower.includes('-') || node instanceof HTMLUnknownElement) {

            let namespace = '';
            let name = '';

            if (tagNameLower.includes(':')) {
                const parts = tagNameLower.split(':');
                namespace = parts[0];
                name = parts[1];
            } else {
                name = tagNameLower;
            }

            if (!window.componentDefinitions[namespace] && namespace) {
                //TODO: load component definitions!!!
                console.warn(`Attempting to load ${namespace} before components have been loaded`)
            }

            if (!namespace) {

                if (node.nodeName === 'COMPONENT-PROVIDER') {
                    return `st:${name}`;
                }

                for (const namespace in window.componentDefinitions) {
                    const component = window.componentDefinitions[namespace][name];
                    if (component) {
                        return `${namespace}:${name}`;
                    }
                }

                let parent = node;
                while (parent) {
                    if (parent.nodeName === 'COMPONENT-PROVIDER' && parent.getAttribute('namespace')) {
                        namespace = parent.getAttribute('namespace');
                        return `${namespace}:${name}`;
                    }
                    parent = parent.parentNode;
                }
            }
            else {
                const component = window.componentDefinitions[namespace][name];
                if (component) {
                    return `${namespace}:${name}`;
                }
            }

        }

        return null;
    }

    function findBindingName(str) {
        return Object.keys(ko.bindingHandlers)
            .filter(k => k.toLowerCase() == str.toLowerCase())[0];
    }

    /** 
     * @param {Node} node
     */
    ko.bindingProvider.instance.preprocessNode = function (node) {
        let paramsArr = [];
        let bindingArr = [];
        let eventArr = [];
        let attrsToRemove = [];

        const kebabToCamel = (str) => findBindingName(str) || str.split('-').reduce((acc, curr) => acc + curr[0].toUpperCase() + curr.substr(1));

        if (node.attributes) {
            for (const attr of node.attributes ?? []) {
                switch (attr.name) {
                    case 'id':
                    case 'class':
                    case 'style':
                        //TODO: Don't do anything, we want to just leave these as is
                        break;
                    default:
                        if (attr.name.startsWith(':')) {
                            let binding = kebabToCamel(attr.name.substr(1));
                            if (attr.value !== null && attr.value !== undefined && attr.value !== '') {
                                binding += `: ${attr.value}`;
                            }
                            bindingArr.push(binding);
                            attrsToRemove.push(attr.name);
                        } else if (attr.name.startsWith('@')) {
                            eventArr.push(`${kebabToCamel(attr.name.substr(1))}: ${attr.value}`);
                            attrsToRemove.push(attr.name);
                        } else if (attr.name.startsWith('#')) {
                            node.setAttribute('name', attr.name.substr(1));
                            attrsToRemove.push(attr.name);
                        } else if (attr.name === 'params') {
                            paramsArr.unshift(attr.value);
                        } else if (attr.name === 'data-bind') {
                            bindingArr.unshift(attr.value);
                        } else if (ko.components.getComponentNameForNode(node)) {
                            if (attr.value.startsWith('@')) {
                                //For custom elements just pass in any attributes as params
                                paramsArr.push(`${kebabToCamel(attr.name)}: ${attr.value.substr(1)}`);
                                attrsToRemove.push(attr.name);
                            }
                            else if ((attr.value.startsWith('\'') && attr.value.endsWith('\''))
                                || (!attr.value || attr.value.toLowerCase() === 'true' || attr.value.toLowerCase() === 'false')
                            ) {
                                //For custom elements just pass in any attributes as params
                                paramsArr.push(`${kebabToCamel(attr.name)}: ${attr.value || 'true'}`);
                                attrsToRemove.push(attr.name);
                            }
                            else if (attr.name.startsWith('data-')) {
                                // Do nothing with 'data-*' attributes
                            }
                            else {
                                paramsArr.push(`${kebabToCamel(attr.name)}: '${attr.value}'`);
                                attrsToRemove.push(attr.name);
                            }
                        }
                        break;
                }

            }

            attrsToRemove.forEach(attr => node.removeAttribute(attr));

            if (eventArr.length) {
                bindingArr.push(`event: { ${eventArr.join(',')} }`);
            }

            if (paramsArr.length) {
                node.setAttribute('params', paramsArr.join(','));
            }

            if (bindingArr.length) {
                node.setAttribute('data-bind', bindingArr.join(','));
            }
        }

        if (node.nodeName === 'KO') {
            const c1 = document.createComment("ko " + node.getAttribute('data-bind')),
                c2 = document.createComment("/ko");
            node.parentNode.insertBefore(c1, node);

            const nodes = [c1, c2];
            Array.from(node.children).forEach(ch => {
                node.parentNode.insertBefore(ch, node);
                nodes.push(ch);
            });

            node.parentNode.replaceChild(c2, node);
            return nodes;
        }
    }

    ko.components.loaders.unshift({
        stLoader: true,
        getConfig: function (name, callback) {
            if (ko.components.isRegistered(name)) {
                callback(null);
            } else {
                callback({});
            }
        },
        loadComponent: function (tagName, componentConfig, callback) {
            loadCount++;
            if (loadCount > 2000) {
                debugger;
            }

            if (ko.components.isRegistered(tagName)) {
                callback(null);
                return;
            }
            // api/v1/{ns}/components
            // Returns a json object with all of the component definitions
            /**
                * {
                *    "{full-path-to-component}": {
                *      "stylesheet": true,
                *      "script": false,
                *      "dependencies": string[]
                *    },
                * }
                * /
                **/

            // api/v1/{ns}/components/{full-path-to-component}/{template|script|stylesheet|api}

            // -----   template   ------
            // Returns the content of the html file
            //
            // -----    script    ------
            // Returns the content of the {.js|.ts} file, performs any transformations to make it compatible with raw js understandable
            // by our minimum supported browser
            //
            // -----  stylesheet  ------
            // Returns the content of the {.css} file, performs any transformations to make it compatible with css understandable
            // by our minimum supported browser
            //
            // -----      api     ------
            // Look at all classes with a namespace that corresponds to {full-path-to-component} and build up a js class on the fly that exposes those methods to developers in js
            // would look like api.getCourses("0") => POST api/v1/pxp/AddCourseModal/GetCourses { "agu": "0" }

            // api/v1/{ns}/{fully-qualified-class-name}/{method-name}
            // POST a json object with keys that match method parameter names and receive a JSON object with the return value of the method


            // Component resolution example:
            // File structure:
            // st/components/text-field
            // st/components/grid/text-field
            // pxp/components/text-field

            // <st:text-field> -> resolves to st namespace text-field
            // <st:grid-text-field> -> resolves to st namespace component grid/text-field
            // <pxp:text-field> -> resolves to pxp namespace, component text-field -> request api/v1/pxp/components and then lookup text-field in that json object

            // when resolving remove all - _ . / from name, look for a match
            const [namespace, name] = tagName.split(':');

            if (!namespace || !name) {
                return callback(null);
            }

            componentsLoaded.then(async () => {
                if (!components[tagName]) {
                    if (namespace == undefined || name == undefined) {
                        callback(null);
                        return;
                    }

                    if (!window.componentDefinitions[namespace]) {
                        console.error(`Missing component namespace for: ${namespace}`);
                        callback(null);
                        return;
                    }

                    if (!window.componentDefinitions[namespace][name]) {
                        console.error(`Missing component: ${namespace}:${name}`);
                        callback(null);
                        return;
                    }

                    const definition = window.componentDefinitions[namespace][name];

                    if (definition.hasStylesheet) {
                        await attachCss(namespace, name, definition);
                    }

                    let vm;
                    if (definition.hasScript) {
                        const module = await import(`../../api/v1/components/${namespace}/${name}.js?t=${definition.scriptTimestamp}`);
                        vm = module.default;
                    } else {
                        vm = KOBaseComponent;
                    }

                    const apiModule = await import(`../../api/v1/components/${namespace}/api/${name}?t=${definition.apiTimestamp}`);
                    vm.prototype.api = (apiModule && new apiModule.default()) || {};

                    const text = await (await fetch(`api/v1/components/${namespace}/${name}.html?t=${definition.templateTimestamp}`)).text();
                    const template = await new Promise((resolve) => ko.components.defaultLoader.loadTemplate(name, text, resolve));

                    // Trigger all the script tags
                    template.filter(n => n.nodeName === 'SCRIPT')
                        .forEach(n => {
                            const script = new Function(n.innerHTML);
                            script();
                        });

                    const component = {
                        template: template,
                        createViewModel: (params, componentInfo) => {
                            const previousVm = componentInfo.element.__previousVm;
                            if (previousVm) {
                                return previousVm;
                            }

                            return new vm(params, componentInfo);
                        },
                    }

                    components[tagName] = component;
                }

                try {
                    callback(components[tagName]);
                }
                catch (ex) {
                    console.error(`Unable to process ${tagName}`, ex);
                }
            });
        },
    });

    $(document).ready(function () {

        const mutationObserver = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                for (const addedNode of mutation.addedNodes) {
                    if (ko.components.getComponentNameForNode(addedNode)?.includes(':') && !ko.dataFor(addedNode)) {
                        console.log(addedNode);
                        ko.applyBindings(null, addedNode);
                    }
                    if (addedNode.nodeName === 'component-provider') {
                    }
                }
            }
        });

        $('component-provider').each(function () {
            ko.applyBindings(null, this);
        });
        //mutationObserver.observe(document.getElementsByTagName('body')[0], { subtree: true, childList: true });
    });
})(jQuery, ko);

class KOBaseComponent {
    constructor(params, componentInfo) {
        this.$params = params;
        this.$componentInfo = componentInfo;

        // Save the query parameters
        {
            const q = window.location.search.substr(1);
            const res = {};

            q.split('&')
                .forEach(pair => {
                    const idx = pair.indexOf('=');
                    if (idx !== -1) {
                        res[pair.substr(0, idx)] = decodeURIComponent(pair.substr(idx + 1)).replace(/\+/g, " ");
                    }
                });

            this.QUERY = res;
        }
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
        });

        this.$componentInfo.element.dispatchEvent(event);
    }

    closestComponent(componentName) {
        let el = this.$componentInfo.element;
        while (el && el.nodeName.toLowerCase() !== componentName.toLowerCase()) {
            el = el.parentNode;
        }

        return el && ko.dataFor(el.firstElementChild);
    }

    parentComponent(componentName) {
        let el = this.$componentInfo.element.parentNode;
        while (el && el.nodeName.toLowerCase() !== componentName.toLowerCase()) {
            el = el.parentNode;
        }

        return el && ko.dataFor(el.firstElementChild);
    }
}

const isNullOrUndefined = (val) => val === null || val === undefined;

const rebindParam = (componentInfo, fn) => {
    if (typeof fn === 'function') {
        // NOTE: If the function has already been bound, this will have no effect
        return fn.bind(ko.dataFor(componentInfo.element));
    }

    return fn;
}

const observableFromParam = (val, defaultVal) => {
    if (isNullOrUndefined(val) && isNullOrUndefined(defaultVal)) {
        return ko.observable(val);
    } else if (isNullOrUndefined(val)) {
        return observableFromParam(defaultVal);
    } else {
        return ko.isObservable(val) ? val : ko.observable(val);
    }
}

const observableArrayFromParam = (val, defaultVal) => {
    if (isNullOrUndefined(val) && isNullOrUndefined(defaultVal)) {
        return ko.observableArray(val);
    } else if (isNullOrUndefined(val)) {
        return observableArrayFromParam(defaultVal);
    } else {
        return ko.isObservableArray(val) ? val : ko.observableArray(val);
    }
}

function debounce(fn, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), timeout)
    }
}

function appendStylesheet(id, href) {
    const existingRef = Array.from(document.head.querySelectorAll('link'))
        .filter(lnk => lnk.href === href)[0];

    if (!existingRef) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.type = 'text/css';
        css.href = href;
        css.id = id;

        document.head.appendChild(css);
    }
}

(function (ko) {
    let hideDropdown = true;
    let dropdownIsVisible = null;

    document.addEventListener('click', ev => {
        if (dropdownIsVisible && hideDropdown) {
            dropdownIsVisible(false);
            dropdownIsVisible = null;
        }

        hideDropdown = true;
    });

    ko.bindingHandlers.dropdown = {
        init: function (element, acc) {
            const isVisible = acc();
            isVisible.subscribe(val => {
                if (val) {
                    dropdownIsVisible = isVisible;
                }
            });

            element.addEventListener('click', ev => hideDropdown = false);

            function onClick() {
                isVisible(!isVisible());
            }

            const args = Array.from(arguments);
            args.splice(1, 1, () => onClick);

            return ko.bindingHandlers.click.init.apply(this, args);
        }
    }

    const origVisibleInit = ko.bindingHandlers.visible.init;
    ko.bindingHandlers.visible.init = function (element) {
        element.addEventListener('click', ev => hideDropdown = false);

        return origVisibleInit?.apply(this, arguments);
    };
})(ko);
