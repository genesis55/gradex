define(['knockout', 'app', 'ko-bindings', 'componentConfigs', 'ko-projections'], function (ko, app, b, cmpCfg, p) {
    return function (config, security, events, addDisposable, componentArgs) {
        var self = this;
        self.isLoading = ko.observable(true);
        self.element;
        self.init = function (element) {
            self.element = element;
        };
        self.dispose = function () {

        };

        self.scrollConfig = {
            direction: 'horizontal',
            showScrollbar: 'always',
            width: '100%',
            height: 140
        };

        self.cards = ko.observableArray();

        self.filterItemsOn = self.cards.filter(function (s) {
            return s.isFilterOn();
        });

        self.cardClick = function ($data) {
            $data.isFilterOn(!$data.isFilterOn());
            events($data.clickEventName()).publish({
                isFilterOn: $data.isFilterOn(),
                item: $data,
                filterItemsOn: self.filterItemsOn()
            });
        };

        app.call({
            friendlyName: 'pxp.course.cards',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: self
        }).done(function (data) {
            self.isLoading(false);
        });

    };
});