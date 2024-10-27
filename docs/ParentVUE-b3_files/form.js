define(['knockout', 'app'], function (ko, app) {
    return function (config, security, events, addDisposable) {
        var self = this;
        //make the component methods available to the caller
        var otherInitialized = config.onInitialized;
        var otherCustomizeItem = config.customizeItem;
        var otherContentReady = config.onContentReady;
        var defaultConfig = {
            readOnly: false
        };

        $.extend(defaultConfig, config);

        var onInitialized = function (e) {
            config.component = e.component;
            if (otherInitialized) {
                otherInitialized(e);
            }
        };

        var customizeItem = function (item) {
            if (item.itemType === "simple") {
                let formData = config.component.option('formData');
                let prop = formData[item.dataField];
                let isPropObservable = ko.isObservable(prop);
                if (prop && prop.dxValidator) {
                    item.validationRules = prop.dxValidator.validationRules;
                    console.warn(item.dataField + ': auto wireup form field with validator.');
                }
                if (isPropObservable && config.changeTracker && prop.trackChange == null) {
                    console.warn(item.dataField + ': auto wireup form field with changeTracker.');
                    prop.extend({
                        trackChange: config.changeTracker.trackChange.bind({ fieldName: item.dataField })
                    });
                }
                let metaData = ko.toJS(formData.metaData);
                if (metaData) {
                    if (item.dataField === 'metaData') {
                        item.visible = false;
                    }
                    let thisMetaField = metaData.properties[item.metaDataField];
                    if (thisMetaField === undefined) {
                        thisMetaField = metaData.properties[item.dataField];
                    }
                    if (thisMetaField) {
                        console.warn(item.dataField + ': auto wireup form field with metaData.');

                        let toolTip = thisMetaField.toolTip;
                        if (toolTip) { item.helpText = toolTip; }

                        let labelName = thisMetaField.labelName;
                        if (labelName) {
                            if (item.label) {
                                item.label.text = labelName;
                            } else {
                                item.label = { text: labelName };
                            }
                        }

                        //visible is a popular property to set on the client side config and we want to be able to react to that as well as the metaData. 
                        //if we are given an observable (item.visible) then the client side wants some control over the items visiblity. 
                        //in that case both the thisMetaField.isVisible and the item.visible need to be true to enable the item.
                        if (item._formVisibilityProcessed === undefined) {//ensure we only get one subscription
                            item._formVisibilityProcessed = true;
                            if (item.visible === undefined) {
                                item.visible = thisMetaField.isVisible;
                            }
                            if (ko.isObservable(item.visible)) {
                                item._formVisibilitySubscription = addDisposable(item.visible.subscribe(function (val) {
                                    item.visible(val && thisMetaField.isVisible);
                                    //config.component.itemOption(item.dataField, "visible", val && thisMetaField.isVisible);
                                }));//watch for changes on the original observable from the client component config. 
                            }
                            let visibility = ko.unwrap(item.visible) && thisMetaField.isVisible; //set initial state before we overwrite the reference
                            item.visible = ko.observable(visibility);//overwrite the original with our reference (our subscription above will watch for client changes)
                        }

                        if (item.validationRules === undefined) {
                            item.validationRules = [];
                        }

                        let isRequired = thisMetaField.isRequired;
                        if (isRequired === true) {
                            item.isRequired = isRequired;
                            item.validationRules.push({
                                type: 'required',
                                message: `${labelName} is required`
                            });
                        }

                        let maxLength = thisMetaField.maxLength;
                        if (item.editorType !== 'dxDateBox' && maxLength > 0) {
                            item.validationRules.push({
                                type: 'stringLength',
                                max: maxLength,
                                message: labelName + " can not be more than " + maxLength + " characters."
                            });
                        }

                        let isNumeric = thisMetaField.isNumeric;
                        if (isNumeric) {
                            item.validationRules.push({
                                type: 'numeric',
                                message: labelName + " must be a numeric value."
                            });
                        }

                        if (isPropObservable && prop.dxValidator == null) {
                            //auto wireup vm validators
                            prop.extend({
                                dxValidator: {
                                    validationRules: item.validationRules
                                }
                            });
                        }

                        let allowEditing = thisMetaField.allowEditing;
                        if (allowEditing) {
                            if (item.editorOptions) {
                                item.editorOptions.disabled = false;
                            } else {
                                item.editorOptions = { disabled: false };
                            }
                        } else {
                            if (item.editorOptions) {
                                item.editorOptions.disabled = true;
                            } else {
                                item.editorOptions = { disabled: true };
                            }
                        }
                        //let labelName_plural = thisMetaField.labelName_plural;

                    }
                }
            }
            if (otherCustomizeItem) {
                otherCustomizeItem(item);
            }
        };

        var onContentReady = function (e) {
            if (otherContentReady) {
                otherContentReady(e);
            }
        };

        var metaConfig = {
            onInitialized: onInitialized,
            customizeItem: customizeItem,
            onContentReady: onContentReady
        };

        $.extend(defaultConfig, metaConfig);

        self.editorOptions = defaultConfig;

    };
});