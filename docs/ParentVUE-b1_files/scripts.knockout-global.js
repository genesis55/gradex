﻿define([], function () {
    window.ko.onError = function (error) {
        console.error('knockout error ->', error);
    };
    return window.ko;
});