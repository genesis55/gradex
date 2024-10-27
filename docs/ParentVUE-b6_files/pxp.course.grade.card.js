define(['knockout', 'app', 'ko-bindings'], function (ko, app) {
    return function (config, security) {
        var self = this;

        self.isLoading = ko.observable(true);

        app.call({
            friendlyName: 'pxp.course.grade.card',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: self
        }).done(function (data) {
            self.isLoading(false);
        });

    }
});