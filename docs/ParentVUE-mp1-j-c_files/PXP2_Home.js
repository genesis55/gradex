﻿(function ($) {
    $(function () {
        ST.LoadTemplate('templates/PXP/PXP2_Home.html')
            .done(function () {
                initNavigation(PXP.NavigationData);
            });
    });

    function initNavigation(data) {
        $('.mobile-header').each(function () {
            var vm = new vmHeader(data);

            var $el = ich['PXP.MobileHeader']({
                Translate: function () {
                    return function (text, render) {
                        return PXP.Translations.Navigation[text];
                    }
                }
            });

            var $navBar = $('.pxp-navbar')
                .clone(true)
                .removeClass('pxp-navbar');
            $el.fastFind('.main-nav').append($navBar);

            $(this).replaceWith($el);
            ko.applyBindings(vm, $el[0]);
        });

        $('#mainnav').fastFind('.pxp-left-nav').each(function () {
            var vm = new vmNav(data);

            var $el = ich['PXP.LeftNav']({
                Translate: function () {
                    return function (text, render) {
                        return PXP.Translations.Navigation[text];
                    }
                }
            });

            $(this).replaceWith($el);
            ko.applyBindings(vm, $el[0]);
        });
    }

    function vmNav(data) {
        $.extend(this, data);
    }

    function vmHeader(data) {
        $.extend(this, data);

        this.students = (data.students || []).map(function (s) {
            return new vmStudent(s);
        });

        this.currentStudent = ko.pureComputed(function () {
            var stu = this.students.filter(function (s) { return s.current; })[0];
            return stu && stu.name;
        }, this);

        this.activeModule = ko.pureComputed(function () {
            return this.items.filter(function (it) {
                return !!it.activeClass;
            })[0];
        }, this);
    }

    function vmStudent(data) {
        $.extend(this, data);
    }

    vmStudent.prototype = {
        loadStudent: function () {
            var queryParams = window.location.search.substr(1).split('&');
            var newQueryParams = ['AGU=' + this.agu];

            for (var i in queryParams) {
                var qp = queryParams[i].split('=')[0];
                if (qp && qp.toLowerCase() != 'agu') {
                    newQueryParams.push(queryParams[i]);
                }
            }

            window.location.search = newQueryParams.join('&');
        }
    }

    if (ST.Theme?.ApplyColorTheme) {
        ST.Theme.ApplyColorTheme('2');
    }
})(jQuery);

$.extend(Namespace('PXP'), {
    QueryParams: location.search
        .substr(1)
        .split('&')
        .map(function (p) {
            let idx = p.indexOf('=');
            return idx !== -1
                ? [p.substr(0, idx), p.substr(idx + 1)]
                : [p, '']
        })
        .reduce(function (res, it) {
            res[it[0]] = it[1];
            return res;
        }, {})
});

(function (originalHtmlUpdate) {
    ko.virtualElements.allowedBindings['html'] = true;
    ko.bindingHandlers['html'].update = function (element, valueAccessor) {
        if (element.nodeType === 8) {
            var html = ko.utils.unwrapObservable(valueAccessor());

            ko.virtualElements.emptyNode(element);
            if ((html !== null) && (html !== undefined)) {
                if (typeof html !== 'string') {
                    html = html.toString();
                }

                var parsedNodes = ko.utils.parseHtmlFragment(html);
                if (parsedNodes) {
                    var endCommentNode = element.nextSibling;
                    for (var i = 0, j = parsedNodes.length; i < j; i++)
                        endCommentNode.parentNode.insertBefore(parsedNodes[i], endCommentNode);
                }
            }
        } else { // plain node
            return originalHtmlUpdate.apply(this, arguments);
        }
    };
})(ko.bindingHandlers['html'].update);

// Update bootstrap to allow tables inside popovers
if ($.fn?.popover?.Constructor?.DEFAULTS?.whiteList) {
    ['table', 'tbody', 'tr'].forEach(function (tag) {
        $.fn.popover.Constructor.DEFAULTS.whiteList[tag] = [];
    });

    ['th', 'td'].forEach(function (tag) {
        $.fn.popover.Constructor.DEFAULTS.whiteList[tag] = [ 'scope' ];
    });
}

