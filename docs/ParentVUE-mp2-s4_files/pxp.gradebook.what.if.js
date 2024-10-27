define(['knockout', 'app', 'ko-bindings', 'gb-calcs'], function (ko, app, b, calcs) {
    return function (config, security) {
        var self = this;

        self.element;
        self.init = function (element) {
            self.element = element;
            $(element).data('calcs', calcs);
        };

        app.call({
            friendlyName: 'pxp.gradebook.what.if',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: self
        }).done(function (data) {
            PXP.Actions.GB.AssignmentsGridSetWhatIfDetailObject(calcs);
        });

    };
});