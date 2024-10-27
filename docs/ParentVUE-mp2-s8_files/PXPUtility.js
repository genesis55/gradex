﻿function Namespace(nsName) {
    var ns = window;

    try {
        var nsArr = nsName.split('.');

        while (nsArr.length > 0) {
            var name = nsArr.shift();

            ns[name] = ns[name] || {};
            ns = ns[name];
        }
    }
    catch (ex) { HandleError(ex); }

    return ns;
}

$.extend(Namespace('PXP'), {
    PageSessionObject: function () {
        const sessionObj = PXP.SessionObject();

        sessionObj[location.pathname] = sessionObj[location.pathname] || {};
        return sessionObj[location.pathname];
    },

    SessionObject: function () {
        var sessionObj;

        try { sessionObj = JSON.parse(sessionStorage['PXP_SESSION']) || {}; }
        catch (ex) { sessionObj = {}; }

        // Auto-save any changes to this object after this execution path
        // is completed
        setTimeout(function () {
            sessionStorage['PXP_SESSION'] = JSON.stringify(sessionObj);
        }, 0);

        return sessionObj;
    }
});

$.extend(Namespace('PXP.Actions'), {
    ToggleAccessibleMode: function (ev) {
        $(document.body).toggleClass('AccessibilityMode');

        PXP.AccessibilityMode = $(document.body).hasClass('AccessibilityMode');
        PXPCallWebMethod('SetPreferences', {
            preferences: { AccessibilityMode: PXP.AccessibilityMode }
        });
    },

    PrintReport: function (ev) {
        var reportGU = this.getAttribute('data-report-gu');
        if (reportGU) {
            PXPCallWebMethod('GetReportURL',
                {
                    reportArgs: {
                        AGU: PXP.AGU,
                        ReportGU: reportGU
                    }
                })
                .done(function (res) {
                    if (res.DownloadURL) {
                        var wnd;
                        try {
                            wnd = window.open(res.DownloadURL, '', '');
                        }
                        catch (ex) { }

                        if (!wnd) {
                            window.location.href = res.DownloadURL;
                        }
                    }
                    else {
                        $.pnotify_notice(PXP.Translations.ReportTryAgain);
                    }
                });
        }
    },

    OpenSPEDURL: function (sisNumber, type) {
        if (sisNumber) {
            PXPCallWebMethod('PXP2_Student.aspx/GetSPEDIntegrationDocumentURL', {
                request: {
                    AGU: PXP.AGU,
                    type: type,
                },
            })
                .done(function (res) {
                    if (res.url) {
                        ST.OpenWindowURL(res.url);
                    }
                })
        }
    }
});

$(document).ready(function () {
    $(document.body).toggleClass('AccessibilityMode', PXP.AccessibilityMode);

    if (window.moment && PXP.MomentLocaleConfig) {
        moment.defineLocale('st-locale', PXP.MomentLocaleConfig);
        moment.locale('st-locale');
    }
});

$(document).on('click tap change', '[data-action]', function (ev) {
    // inputs fire on change, everything else on click/tap
    var isInput = (this.tagName === 'INPUT' || this.tagName === 'SELECT' || this.tagName === 'TEXTAREA');
    //var fireEvent = (isInput && ev.type === 'change') || !isInput;
    var fireEvent = (isInput && (ev.type === 'change' || $(this).hasThisClass('btn'))) || !isInput;

    if (this.tagName === 'A' && !ev.ctrlKey) {
        ev.preventDefault();
    }

    if (fireEvent) {
        // If we are tapped once, that is the event we stick with for click events.
        this.tapped = this.tapped || ev.type === 'tap';

        if (ev.type === 'tap' || !this.tapped || isInput) {
            var action = this.getAttribute('data-action') || 'Unknown';
            var method = Namespace('PXP.Actions.' + action);
            if ($.isFunction(method)) {
                if (!this.getAttribute('href') || !ev.ctrlKey) {
                    return method.apply(this, arguments);
                }
                else {
                    window.open(this.getAttribute('href'));
                }
            }
            else {
                console.log('Unrecognized action: ' + action);
            }
        }
    }
});

// Auto-activate bootstrap popovers
$(document).delegate('[data-toggle~="popover"]', 'mouseenter', function () {
    if (!this.popoverInitialized) {
        this.popoverInitialized = true;

        var poData = {
            container: this.getAttribute('data-container') || 'body',
            trigger: this.getAttribute('data-trigger') || 'hover',
            html: true,
            placement: this.getAttribute("data-placement") || 'top'
        };

        $(this)
            .off('.popoverInit')
            .on('mouseenter.popoverInit', function (ev) {
                $(document.body).children('.popover').remove();
            })
            .popover(poData)
            .trigger('mouseenter');
    }
});

// Auto-activate bootstrap tooltips
$(document).delegate('[data-toggle~="tooltip"]', 'mouseenter', function () {
    if (!this.tooltipInitialized) {
        this.tooltipInitialized = true;

        var ttData = {
            container: this.getAttribute('data-container') || 'body',
            trigger: this.getAttribute('data-trigger') || 'hover',
            placement: this.getAttribute("data-placement") || 'top'
        };

        $(this)
            .off('.tooltipInit')
            .on('mouseenter.tooltipInit', function (ev) {
                $(document.body).children('.tooltip').remove();
            })
            .tooltip(ttData)
            .trigger('mouseenter');
    }
});

(function ($) {
    $.buildObject = function (obj, arr) {
        if ($.isArray(arr)) {
            while (arr.length > 0) {
                var o = arr.shift();
                if (arr.length > 0 && $.isArray(arr[0])) {
                    obj.append($.buildObject(o, arr.shift()));
                }
                else {
                    obj.append(o);
                }
            }
        }

        return obj;
    };

    $.resolve = function () {
        var deferred = new jQuery.Deferred();
        deferred.resolve(arguments);

        return deferred.promise();
    };

    $.reject = function () {
        var deferred = new jQuery.Deferred();
        deferred.reject(arguments);

        return deferred.promise();
    };

    $.fn.initEvents = function () {
        return $.resolve();
    };

    function carousel(el, opts) {
        this.$el = $(el).addClass('carousel');

        this.$el.width(this.$el.width());
        this.$el.height(this.$el.height());
        this.$el.children().first()
            .addClass('active')
            .nextAll()
            .addClass('right');
    }

    carousel.prototype = {
        next: function () {
            var $active = $(
                this.$el.children('.active')[0] || this.$el.children().first()[0]
            );
            var $next = $active.next();

            if ($next.length) {
                $active.removeClass('active').addClass('left');
                $next.removeClass('left right').addClass('active');
            }
        },

        prev: function () {
            var $active = $(
                this.$el.children('.active')[0] || this.$el.children().first()[0]
            );
            var $next = $active.prev();

            if ($next.length) {
                $active.removeClass('active').addClass('right');
                $next.removeClass('left right').addClass('active');
            }
        }
    };

    $.fn.carousel = function (opts) {
        return this.each(function () {
            this.carousel = this.carousel || new carousel(this, opts);
        });
    };

    $.fn.skip = function (qty) {
        return this.slice(qty);
    };

    $.fn.take = function (qty) {
        return this.slice(0, qty);
    };
}(jQuery));

function resizeCanvas(el) {
    $(el).css('width', '');

    clearTimeout(el.resizeCanvasTimer);
    el.resizeCanvasTimer = setTimeout(function () {
        var w = $(el).innerWidth();
        var h = $(el).height();

        if (el.chartData) {
            el.chartData.resize(w, h);
            el.chartData.refresh();
        }
    }, 100);
}

function ShowConfirmationDialog(options) {
    var settings = $.extend({
        header: PXP.Translations.Confirm || 'Confirm',
        message: "Do you wish to continue?",
        buttons: { okay: PXP.Translations.Yes || 'Yes', cancel: PXP.Translations.No || 'No' },
        okay: function () { },
        cancel: function () { }
    }, options);

    var events = {
        onClose: function () {
            $('#dialog-overlay,#dialog-box').remove();
        },

        onCancel: function () {
            settings.cancel();
            events.onClose();
        },

        onOkay: function () {
            settings.okay();
            events.onClose();
        }
    };

    var $dialog = $.buildObject(
        $('<div id="dialog-box"/>'), [
            $('<h3></h3>').html(settings.header),
            $('<p class="dlgMessage">').html(settings.message),
            $('<div class="controls">'), [
                $('<button></button>').html(settings.buttons.okay).on('click', events.onOkay),
                $('<button></button>').html(settings.buttons.cancel).on('click', events.onCancel)
            ]
        ]
    )

    var $overlay = $('<div id="dialog-overlay"/>')
        .css({
            position: 'absolute',
            top: 0,
            left: 0,
            height: $(document).height(),
            width: $(document).width()
        });

    $overlay.appendTo($('body'));
    $dialog.appendTo($('body'));
    $dialog.css({
        position: 'absolute',
        top: ($(window).height() - $dialog.height()) / 2 + $(document).scrollTop(),
        left: ($(window).width() - $dialog.width()) / 2 + $(document).scrollLeft()
    });

    var maxWidth = 0;
    $('.controls button', $dialog).each(function () {
        if (maxWidth < $(this).width()) {
            maxWidth = $(this).width();
        }
    });
    $('.controls button', $dialog).width(maxWidth);

    return $dialog;
}

function PXPCallWebMethod(method, data, options) {
    var deferred = new jQuery.Deferred();

    var url = method.indexOf('/') == -1
        ? 'service/PXP2Communication.asmx/' + method
        : method;

    CallWebMethod($.extend({
        url: url,
        data: JSON.stringify(data),
        xhrFields: {withCredentials: true }
    }, options))
        .done(function (response) {
            var $main = $($('#MainDiv')[0]||$('#USER_ERROR')[0]);
            $main.children('.alert-danger.exception').remove();

            if (response && response.d && response.d.Error) {
                if (response.d.Error.Message == 'INVALID_CONTEXT') {
                    window.location.replace(window.location.pathname + '?Logout=1');
                }
                else {
                    $main.prepend('<div class="alert alert-danger exception"><span class="fa fa-exclamation-triangle"></span> <span>' + response.d.Error.Message + '</span></div>');

                    $(document).scrollTop(0);
                }

                deferred.reject(response);
                return;
            }
            else if (!response || !response.d) {
                deferred.reject(response);
                return;
            }
            else {
                var data = response.d.Data;
                if (data) {
                    // Check for a handler for this response
                    if (PXP.Actions && response.d.DataType && PXP.Actions[response.d.DataType]) {
                        PXP.Actions[response.d.DataType](data);
                    }
                }
                deferred.resolve(data);
            }
        })
        .fail(function (response) {
            deferred.reject(response);
        });

    return deferred.promise();
}

function CallWebMethod(options) {
    var opts = $.extend({
        type: 'POST',
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        headers: {
            'AGU': PXP.AGU,
        },
        error: function () {
            //$cell.html('<span class="NoData">No content</span>');
        },
        complete: function () {
            //$loading.remove();
        }
    }, options);

    return $.ajax(opts);
}

function SendEmail(toEmailAddresses, subject, bccEmailAddresses) {
    var previousSetting = window.ignoreUnloadMessage;

    window.ignoreUnloadMessage = true;
    window.open('PXP_SendEmail.html?to=' + toEmailAddresses + '&bcc=' + (bccEmailAddresses || '') + '&subject=' + (subject || ''), '_blank');

    setTimeout(function () {
        window.ignoreUnloadMessage = previousSetting;
    }, 100);
}

function GetFunctionName(oFunction) {
    if (!oFunction) {
        return '';
    }

    var sName = oFunction.toString();
    var oArray1 = sName.split('(', 1);
    var oArray2 = oArray1[0].split(' ', 2);
    return oArray2[1];
}


function GetCallStack(oFunction) {
    if (!oFunction) {
        return '';
    }

    var oCaller = oFunction.caller;
    var sCallStack = '';
    var count = 0;

    while (oCaller && count < 30) {
        var funcName = GetFunctionName(oCaller);
        sCallStack += '\n' + funcName;

        if (g_IE)
            oCaller = oCaller.caller;
        else {
            // For NN/Moz if we are at the top of the chain we (for some reason) receive an uncaught
            //	throw if trying to access the .caller attribute for the method - no other way to
            //	determine the top
            if (funcName == 'onload')
                oCaller = null;
            else
                oCaller = oCaller.caller;

        }
        count++;
    }

    return sCallStack;
}

/**********************************
HandleException()
	Parameter: oException - oException that occurred.

	Pops an alert to warn the user that an error occurred.
**********************************/
function HandleException(oException) {
    var message = '';
    if (oException.name) {
        // The exception was raised by MS Internet Explorer.
        message = 'Message from Web Browser:\n';
    }
    else {
        message = 'Exception occurred.\n\n';
    }

    if (!oException.context) {
        var sCallStack = GetCallStack(HandleException);
    }
    else {
        sCallStack = oException.context;
    }

    message += oException.message;

    if (sCallStack && sCallStack != '') {
        message += '\nSource:' + sCallStack;
    }

    if (oException.number) {
        message += '\nError number: ' + oException.number;
    }

    if (oException.name) {
        message += '\nError name: ' + oException.name;
    }

    if (oException.domObj) {
        var sObjInfo = null;

        if (oException.domObj.toString) {
            sObjInfo = oException.domObj.toString();
            if (sObjInfo.toUpperCase() == '[OBJECT]') {
                sObjInfo = null;
            }
            else {
                sObjInfo = '\n' + sObjInfo;
            }
        }

        if (!sObjInfo) {
            if (oException.domObj.tagName) {
                sObjInfo = oException.domObj.tagName;
                var objID = GetDomObjIDOrName(oException.domObj);
                if (objID && objID != '') {
                    sObjInfo += ' id/name: ' + objID;
                }
            }
            else if (oException.domObj.nodeName) {
                sObjInfo = oException.domObj.nodeName;
            }
        }
    }

    if (sObjInfo && sObjInfo != '') {
        message += '\nObject: ' + sObjInfo;
    }

    window.alert(message);
    if (oException.domObj)
        oException.domObj = null;
} // HandleException


// Session storage polyfill
var isStorageAvailable = function (storage) {
    if (typeof storage == 'undefined') return false;
    try { // hack for safari incognito
        storage.setItem("storage", "");
        storage.getItem("storage");
        storage.removeItem("storage");
        return true;
    }
    catch (err) {
        return false;
    }
};

if (!isStorageAvailable(window.localStorage) || isStorageAvailable(window.sessionStorage)) (function () {

    var Storage = function (type) {
        function createCookie(name, value, days) {
            var date, expires;

            if (days) {
                date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            } else {
                expires = "";
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        }

        function readCookie(name) {
            var nameEQ = name + "=",
                ca = document.cookie.split(';'),
                i, c;

            for (i = 0; i < ca.length; i++) {
                c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1, c.length);
                }

                if (c.indexOf(nameEQ) == 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        }

        function setData(data) {
            data = JSON.stringify(data);
            if (type == 'session') {
                window.name = data;
            } else {
                createCookie('localStorage', data, 365);
            }
        }

        function clearData() {
            if (type == 'session') {
                window.name = '';
            } else {
                createCookie('localStorage', '', 365);
            }
        }

        function getData() {
            var data = type == 'session' ? window.name : readCookie('localStorage');
            return data ? JSON.parse(data) : {};
        }


        // initialise if there's already data
        var data = getData();

        return {
            length: 0,
            clear: function () {
                data = {};
                this.length = 0;
                clearData();
            },
            getItem: function (key) {
                return data[key] === undefined ? null : data[key];
            },
            key: function (i) {
                // not perfect, but works
                var ctr = 0;
                for (var k in data) {
                    if (ctr == i) return k;
                    else ctr++;
                }
                return null;
            },
            removeItem: function (key) {
                if (data[key] === undefined) this.length--;
                delete data[key];
                setData(data);
            },
            setItem: function (key, value) {
                if (data[key] === undefined) this.length++;
                data[key] = value + ''; // forces the value to a string
                setData(data);
            }
        };
    };

    if (!isStorageAvailable(window.localStorage)) window.localStorage = new Storage('local');
    if (!isStorageAvailable(window.sessionStorage)) window.sessionStorage = new Storage('session');

})();
