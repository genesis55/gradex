define(['knockout', 'app', 'ko-bindings'], function (ko, app) {
    return function (config, security, events, addDisposable) {
        var self = this;

        self.init = function (element) {

            if (ko.isObservable(config.html) === true) {
                // subscribe for changes and use addDisposable so our subscription doesnt have memory leaks
                addDisposable(config.html.subscribe(function (value) {
                    if (value === '') {
                        value = "No Content";
                    }
                    $(element).html(value);
                }));
            }

            // set value here incase observable already loaded or not observable.
            let value = ko.unwrap(config.html);
            if (value === '') {
                value = "No Content";
            }
            $(element).html(value);           

        };

    };
});