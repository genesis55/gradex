﻿//make sure gbapp is something. (for PVUE) put things that pvue needs in here
window.gbapp = window.gbapp || new function () {
    var self = this;

    self.whenAvailable = function (thing, callback) {
        var interval = 10; // ms
        var maxInstances = 30000 //30 sec
        var instanceCount = 0;
        var logic = function () {
            var func;
            if (typeof thing === 'string' && thing.indexOf(".") > 0) {
                func = self.getFunctionFromString(thing);

            } else if (typeof thing === 'string') {
                func = window[thing];
            } else {
                alert('gbapp.whenAvailable requires a string "thing" parameter to evaluate.');
                return;
            }
            if (func) {
                callback(func);
            } else {
                instanceCount++;
                if (instanceCount < maxInstances) {
                    window.setTimeout(arguments.callee, interval);
                } else {
                    alert('waited ' + interval * maxInstances + 'ms for ' + thing + ' without success');
                }
            }
        };
        window.setTimeout(logic, interval);
    };

    self.getFunctionFromString = function (string) {
        var scope = window;
        var scopeSplit = string.split('.');
        for (i = 0; i < scopeSplit.length - 1; i++) {
            scope = scope[scopeSplit[i]];

            if (scope == undefined) return;
        }

        return scope[scopeSplit[scopeSplit.length - 1]];
    };

    //special function to allow synergy mail to use the ckeditor5 instance loaded with require.
    //this is needed because we cant load both ckeditor 4 and 5 scripts globally at the same time and there are pages that still use ckeditor4
    self.requireCKEditor = (callback) => {
        require(['ckeditor-classic'], (ck) => {
            callback(ck);
        });
    };

};

