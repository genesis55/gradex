define(['knockout', 'app', 'ko-bindings'], function (ko, app) {
    return function (config, security) {
        var self = this;

        self.showGoogleLink = ko.observable(false);
        self.googleClassRoomLinkURL = ko.observable();

        self.clickGoogle = function () {
            window.open(self.googleClassRoomLinkURL());
        };

        app.call({
            friendlyName: 'gradebook.google.classroom.link',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: self
        }).done(function (data) {
        });

    };
});