﻿ST.LoadTemplate('Templates/PXP/PXPTemplates.html', true);
ST.LoadTemplate("Templates/GB/IAPlugins.html", true);

$(document).ready(function () {

    DevExpress.CustomStore = DevExpress.data.CustomStore;

    // Enumerations
    $.extend(Namespace('PXP'), {
        ChartColors: {
            Red: '#e9433f',//'#aa0000',
            Green: '#5cb85c',
            Yellow: '#f0ad4e'
        }
    });

    // Framework Methods
    $.extend(Namespace('PXP'), {
        RefreshUpdatePanel: function (panelID, param) {
            var deferred = new jQuery.Deferred();

            function onComplete() {
                Sys.WebForms.PageRequestManager.getInstance().remove_endRequest(onComplete);
                deferred.resolve($('#' + panelID));
            }

            Sys.WebForms.PageRequestManager.getInstance().add_endRequest(onComplete);
            __doPostBack(panelID, JSON.stringify(param));

            return deferred.promise();
        }
    });

    // Common click events
    $.extend(Namespace('PXP.Actions'), {
        CloseSummaryDetails: function (ev) {
            var $this = $(this);
            var $summaryCont = $this.closest('.pxp-summary-container');
            var $heading = $summaryCont.prev('h1');
            var $summary = $summaryCont.children('.pxp-summary');
            var $summaryDetails = $summaryCont.children('.pxp-summary-details');

            $heading.slideDown();
            $summary.slideDown();
            $summaryDetails.slideUp();

            ev.preventDefault();
        },

        ShowSummaryDetails: function (ev) {
            var $this = $(this);
            var $summary = $this.closest('.pxp-summary');
            var $summaryCont = $summary.closest('.pxp-summary-container');
            var $heading = $summaryCont.prev('h1');

            var $summaryDetails = $summaryCont.children('.pxp-summary-details');
            if ($summaryDetails.length == 0) {
                $summaryDetails = $('<div class="pxp-summary-details"></div>').appendTo($summaryCont);
            }

            var method = $summary.attr('data-detail-method');
            if (method) {
                var $headingText = $summaryCont.prev('h1').clone();
                $headingText.children('label').remove();

                $summaryDetails.empty().append(ich['PXP.SummaryDetailsHeading']({
                    heading: $headingText.html(),
                    title: $this.attr('data-heading') || $this.children('.title').text()
                }));

                $summary.slideUp();
                $heading.slideUp();
                $summaryDetails.slideDown();

                $summaryCont.addClass('loading');
                PXPCallWebMethod(method, {
                    agu: PXP.AGU,
                    itemGU: this.getAttribute('data-guid') || ''
                })
                    .done(function (response) {
                        if (response.Schools) {
                            var data = $.extend({}, response, {
                                Legend: function () {
                                    return function (text, render) {
                                        var legend_tpl = $summary.attr('data-legend-tpl');
                                        if (legend_tpl) {
                                            return render(ich[legend_tpl](this, true));
                                        }

                                        return '';
                                    }
                                },

                                Headings: function () {
                                    var headings = [];

                                    for (var k in response.Columns) {
                                        var colspan = k.split('|').length;
                                        headings.push({
                                            colspan: colspan - 1 ? colspan : 0,
                                            columnTitle: response.Columns[k]
                                        });
                                    }

                                    return headings;
                                },

                                Cells: function () {
                                    var res = [];
                                    for (var k in this) {
                                        res.push(this[k]);
                                    }
                                    return res;
                                }
                            });

                            $summaryDetails.append(ich['PXP.SchoolTermDetailGrids'](data));
                        }
                        else if (response.Columns) {
                            // generate the table data from the response
                            var data = {
                                headings: [],
                                rows: [],
                                extraFields: [],

                                Legend: function () {
                                    return function (text, render) {
                                        var legend_tpl = $summary.attr('data-legend-tpl');
                                        if (legend_tpl) {
                                            return render(ich[legend_tpl](this, true));
                                        }

                                        return '';
                                    }
                                }
                            };


                            for (var i in response.Columns) {
                                var colspan = i.split('|').length;
                                data.headings.push({
                                    colspan: colspan - 1 > 0 ? colspan : 0,
                                    columnTitle: response.Columns[i]
                                });
                            }

                            var len = response.Rows.length;
                            for (var i = 0; i < len; i++) {
                                var row = { cells: [] };
                                data.rows.push(row);

                                for (var j in response.Rows[i]) {
                                    row.cells.push(response.Rows[i][j]);
                                }
                            }

                            $summaryDetails.append(ich['PXP.SummaryDetails'](data));
                        }

                        // generate the ring graph
                        var opts = $summary.data('options') || {};
                        $summaryDetails.find('.pxp-ring-chart').pxpRingChart({
                            values: response.RingValues,
                            colors: opts.valueColors
                        });
                    })
                    .fail(function () {
                        $heading.slideDown();
                        $summary.slideDown();
                        $summaryDetails.slideUp();
                    })
                    .always(function () {
                        $summaryCont.removeClass('loading');
                    });
            }

            ev.preventDefault();
        },

        ShowAnnouncements: function (ev) {
            $().stModal({
                template: 'PXP.Announcements'
            });
        },

        LoadStudent: function (ev) {
            var queryParams = window.location.search.substr(1).split('&');
            var newQueryParams = ['AGU=' + this.getAttribute('data-agu')];

            for (var i in queryParams) {
                var qp = queryParams[i].split('=')[0];
                if (qp && qp.toLowerCase() != 'agu') {
                    newQueryParams.push(queryParams[i]);
                }
            }

            window.location.search = newQueryParams.join('&');
        },

        ToggleDetails: function (ev) {
            var $header = $(this).closest('h1,h2');

            var $container = $header.next('div').toggleClass('show-details', this.checked);
            var $details = $container.find('.details');

            $details.css('max-height', '');

            var inst = this;
            clearTimeout(inst.maxHeightTimer);
            inst.maxHeightTimer = setTimeout(function () {
                var maxHeight = inst.checked
                    ? Math.max(500, $container.height())
                    : 0;

                $details.css('max-height', maxHeight + 'px');
            }, 700);

            var sessionObj = PXP.PageSessionObject();

            var $switch = $(this).closest('.pxp-switch');
            var idx = $('.pxp-switch').index($switch[0]);
            sessionObj['showDetails'] = sessionObj['showDetails'] || {};
            sessionObj['showDetails'][idx] = this.checked;

            $container.trigger('pxp.details.toggled');
        }
    });

    // Apply the session states to this page
    var sessionObj = PXP.PageSessionObject();

    if (sessionObj['showDetails']) {
        var $switches = $('.pxp-switch input');
        for (var i in sessionObj['showDetails']) {
            if (sessionObj['showDetails'][i]) {
                $switches.eq(i).prop('checked', true).trigger('change');
                //$headers.eq(i).next('div').addClass('show-details');
            }
        }
    }

    $(document).delegate('h1 > .pxp-switch input', 'change', PXP.Actions.ToggleDetails);
    $(document).delegate('h2 > .pxp-switch input', 'change', PXP.Actions.ToggleDetails);

    $(document).delegate('h1,h2', 'dblclick', function (ev) {
        $(this).find('.pxp-switch input').click();
    });

    $(document.body).initEvents();

    if (PXP.VerifyFlexCount) {
        var $count = $('#requireFlexPeriodCount');
        if (parseInt($count.text().trim())) {
            $().stModal({
                template: 'PXP.FlexCountModal',
                Translate: function () {
                    return function (text, render) {
                        return PXP.Translations[text];
                    }
                }
            });
        }
    }
});


(function ($) {
    $.fn.initEvents = (function (oldMethod) {
        return function () {
            this.find('.pxp-switch input').closest('h1,h2').css({ cursor: 'pointer' });
            this.find('.pxp-speedometer').speedometer();
            this.find('.pxp-switch').pxpSwitch();
            this.find('.gb-recent-history').gbRecentHistory(0);

            return oldMethod.apply(this, arguments);
        }
    })($.fn.initEvents);

    $.fn.pxpSwitch = function () {
        return this.each(function () {
            var opts = {
                onText: 'on',
                onColor: 'green',
                offText: 'off',
                offColor: 'red'
            };

            $(this).append(ich['PXP.Switch'](opts));

            var $onSwitch = $(this).find('.on');
            var $offSwitch = $(this).find('.off');
            var $switches = $onSwitch.add($offSwitch);

            var maxWidth = 0;
            $switches
                .each(function () { maxWidth = Math.max(maxWidth, $(this).width()); })
                .width(maxWidth);

            var inst = this;
            $(this).children('input').on('change', function (ev) {
                $(inst).attr('data-off', this.checked ? 'false' : 'true');

                $onSwitch.css('margin-left', this.checked ? '' : '-' + $onSwitch.css('width'));
                $offSwitch.css('margin-right', this.checked ? '-' + $offSwitch.css('width') : '');
            }).trigger('change');
        });
    };

    $.fn.pxpRingChart = function (opts) {
        var opts = $.extend({
            colors: ['#5cb85c', '#f0ad4e', '#d9534f'],
            values: {
                Completed: 0,
                Pending: 0,
                Remaining: 0
            }
        }, opts);

        return this.each(function () {
            var $canvas = $(this).find('canvas');
            if ($canvas.length == 0) {
                if (this.nodeName == 'CANVAS') {
                    $canvas = $(this);
                }
                else {
                    $canvas = $('<canvas />').prependTo(this);
                }
            }

            var ctx = $canvas[0].getContext("2d");
            if (ctx) {
                var data = {
                    datasets: [{
                        data: []
                    }]
                };

                var idx = 0;
                for (var i in opts.values) {
                    data.datasets[0].data.push({
                        value: opts.values[i],
                        label: i,
                        fillColor: opts.colors[idx % opts.colors.length],
                        strokeColor: '#888888',
                        strokeWidth: 1
                    });

                    idx++;
                }

                var options = {
                    startAngle: 270,
                    showLabels: false,
                    showTooltips: true,
                    annotateDisplay: false,
                    scaleFontFamily: "'Arial'",
                    segmentShowStroke: true,
                    segmentStrokeColor: "#fff",
                    segmentStrokeWidth: 2,
                    animation: false,
                    animationSteps: 100,
                    animationEasing: "easeOutBounce",
                    animateRotate: true,
                    animateScale: false,
                    percentageInnerCutout: 75
                };

                this.chartData = new Chart(ctx).STRing(data, options);
            }
        });
    };

    $.fn.pxpSummary = function (opts) {
        opts = $.extend({
            detailAction: 'ShowSummaryDetails',
            tbodyFilter: function () { return true; }
        }, opts);

        function getPopoverData(thead, tr) {
            var data = {
                title: tr.cells[0].textContent,
                items: []
            };

            for (var i = 1; i < tr.cells.length; i++) {
                data.items.push({
                    name: thead.cells[i].textContent,
                    value: tr.cells[i].textContent
                });
            }

            return data;
        }

        function calculateWidth(tr, idx) {
            var width = 0;

            var total = 0;
            for (var i = 0; i < opts.valueCols.length; i++) {
                var cell = tr.cells[opts.valueCols[i]];
                total += parseInt(cell.textContent.trim()) || 0;
            }

            return total ? parseInt(tr.cells[idx].textContent.trim()) / total * 100 : 0;
        }

        return this.each(function () {
            if (opts.detailMethod) {
                this.setAttribute('data-detail-method', opts.detailMethod);
            }

            var $table = $(this).children('.details').find('table');
            if ($table.length == 0) {
                $table = $(this).find('> .detail-grid > .school-detail > table');
            }

            $(this).data('options', opts);

            if ($table[0]) {
                var thead = $table.children('thead').not('[data-term-name]').children()[0];
                var data = {
                    items: [],
                    detailAction: opts.detailAction
                };

                $table.children('tbody')
                    .filter(opts.tbodyFilter)
                    .children()
                    .not('.empty-row')
                    .not('.att-course-details')
                    .each(function (idx) {
                        var item = {
                            heading: this.getAttribute('data-heading'),
                            title: this.cells[0].textContent.trim() || this.cells[1].textContent.trim(),
                            guid: this.getAttribute('data-guid'),
                            popoverContent: ich[opts.popoverID](getPopoverData(thead, this), true),
                            segments: []
                        };

                        var colors = opts.valueColors || [
                            PXP.ChartColors.Green,
                            PXP.ChartColors.Yellow,
                            PXP.ChartColors.Red
                        ];
                        for (var i = 0; i < opts.valueCols.length; i++) {
                            item.segments.push({
                                color: colors[i],
                                width: calculateWidth(this, opts.valueCols[i])
                            });
                        }

                        data.items.push(item);
                    });

                var $chart = $(ich['PXP.SummaryChart'](data));

                if ($(this).children('.chart').length) {
                    $(this).children('.chart')
                        .empty()
                        .replaceWith($chart.addClass('chart'));
                }
                else {
                    $chart.prependTo(this);
                }

                // When hovering over a segment, highlight the segment and the popover value
                $chart.find('.bar > .segment').hover(
                    function (ev) {
                        this.origColor = this.origColor || $(this).css('background-color');

                        var color = new tinycolor(this.origColor);
                        if (color.isDark()) {
                            color.lighten(10);
                        }
                        else {
                            color.darken(10);
                        }

                        $(this).css('background-color', color.toHexString());

                        var idx = opts.valueCols[$(this).prevAll().length] - 1;
                        var inst = this;
                        setTimeout(function () {
                            $(document.body).children('.popover')
                                .find('table th')
                                .css('color', '')
                                .eq(idx)
                                .css('color', inst.origColor);
                        }, 100);
                    },
                    function (ev) {
                        $(this).css('background-color', this.origColor);

                        $(document.body).children('.popover')
                            .find('table th')
                            .css('color', '');
                    }
                );

                // Automatically load details if there is only one result
                var $items = $chart.find('li');
                if ($items.length == 1 && !PXP.SingleResultShown) {
                    $items.children('a').click();
                }
                PXP.SingleResultShown = true;
            }
        });
    };

    $.fn.speedometer = function (options) {
        function getData(values) {
            var data = [];

            var colors = ['red', 'green', 'yellow'];
            for (var i in values) {
                data.push({
                    value: values[i],
                    label: '',
                    fillColor: colors[i % colors.length],
                    strokeColor: '#888888',
                    strokeWidth: 1
                });
            }

            return {
                datasets: [{
                    data: data
                }]
            };
        }

        return this.each(function () {
            var opts = $.extend({
                title: this.getAttribute('data-title') || '',
                range: (this.getAttribute('data-range') || '0,100').split(','),
                value: this.getAttribute('data-value') || 0,
                colors: (this.getAttribute('data-colors') || 'red,lightgray').split(',')
            }, options);

            var $canvas = $(this).find('canvas');
            if ($canvas.length == 0) {
                $canvas = $('<canvas />').appendTo(this);
            }

            var ctx = $canvas[0].getContext("2d");
            if (ctx) {
                var options = {
                    title: opts.title,
                    range: [parseInt(opts.range[0]), parseInt(opts.range[1])],
                    value: parseInt(opts.value),
                    color: opts.colors[0] || PXP.ChartColors.Red
                };

                this.chartData = new Chart(ctx).STSpeedometer(options);
            }
        });
    };

    $.fn.gbRecentHistory = function () {
        // Initialize the recent history table
        return this.find('.data-table').each(function () {
            var data = $(this).map(function () {
                return {
                    items: $(this).find('> tbody > tr[data-guid]').map(function () {
                        var showPoints = this.cells.length > 4;
                        var pctText = showPoints ? this.cells[5].textContent : this.cells[2].textContent;

                        var pct = parseFloat(pctText) || 0;
                        var fillColor = PXP.ChartColors.Red;
                        if (pct > 85) {
                            fillColor = PXP.ChartColors.Green;
                        }
                        else if (pct > 60) {
                            fillColor = PXP.ChartColors.Yellow;
                        }

                        return {
                            courseID: this.getAttribute('data-guid'),
                            title: this.cells[0].textContent,
                            courseTitle: this.cells[1].textContent,
                            points: showPoints ? this.cells[2].textContent : '',
                            maxPoints: showPoints ? this.cells[3].textContent : '',
                            dueDate: showPoints ? this.cells[4].textContent : '',
                            percentage: pctText,
                            fillColor: fillColor
                        };
                    }).get()
                };
            })[0];

            $(ich['GB.RecentHistoryTable'](data)).insertBefore(this);
        });
    };
})(jQuery);

if (window.ich) {
    // Load imported ich templates
    $('link').each(function () {
        if (this.import && this.import.documentElement) {
            $(this.import.documentElement)
                .find("script")
                .each(function () {
                    ich.addTemplate(this.id, this.innerHTML)
                });
        }
    });
}

if (window.DevExpress) {
    function revertCellValue(dxDataGrid, rowIdx, cellIdx) {
        var $cell = dxDataGrid.getCellElement(rowIdx, cellIdx);
        var $row = $cell.closest('.dx-data-row');
        var rowOptions = $row.data('options');

        if (rowOptions) {
            var cell = rowOptions.cells[cellIdx];
            cell.setValue(rowIdx, cell.originalValue);
        }
    }

    // DevExpress does not officially support this functionality
    function clearCellChangeState(dxDataGrid, rowIdx, cellIdx) {
        var undef;

        var $cell = dxDataGrid.getCellElement(rowIdx, cellIdx);
        var $row = $cell.closest('.dx-data-row');
        var rowOptions = $row.data('options');

        if (rowOptions) {
            // remove this cell from the list of modified values
            if (rowOptions.modified && rowOptions.modifiedValues) {
                rowOptions.modifiedValues[cellIdx] = undef;
                rowOptions.modified = false;
                for (var i = 0; i < rowOptions.modifiedValues.length; i++) {
                    if (rowOptions.modifiedValues[i] !== undef) {
                        rowOptions.modified = true;
                    }
                }
            }

            // Update the css classes
            $row.toggleClass('dx-row-modified', rowOptions.modified);
            $cell.find('.dx-highlight-outline').removeClass('dx-highlight-outline');
        }
    }

    // Initialize the remote data retrieval for DevExpress grids
    DevExpress.PXPRemoteDataStore = function (dataSourceType, gridParameters, options) {
        this.dataSourceType = dataSourceType;
        this.gridParameters = gridParameters;
        this.options = $.extend({
            onLoad: function (loadOptions, result) { }
        }, options || {});

        function filterCondition(filter) {
            this.selector = filter[0];
            this.filterType = filter[1];
            this.value = filter[2];
            this.columnIndex = filter.columnIndex;
        }

        function filterList(filter) {
            var res;
            var undef;

            if (filter) {
                res = [];

                if (filter.columnIndex !== undef) {
                    res.push(new filterCondition(filter));
                }
                else if ($.isArray(filter)) {
                    if (filter.columnIndex !== undef) {
                        res.push(new filterCondition(filter));
                    }
                    else {
                        for (var i in filter) {
                            var f = filter[i];
                            if ($.isArray(f)) {
                                res.push(new filterCondition(filter[i]));
                            }
                        }
                    }
                }
            }

            return res;
        }

        function transformLoadOptions(loadOptions) {
            loadOptions.filter = filterList(loadOptions.filter);

            if (loadOptions.sort && loadOptions.sort) {
                for (var i in loadOptions.sort) {
                    var opt = loadOptions.sort[i];
                    if (opt && $.isFunction(opt.selector)) {
                        opt.selector = opt.selector(null);
                    }
                }
            }
        }

        var inst = this;
        $.extend(this, {
            key: function (row) {
                return row.ID || row[Object.keys(row)[0]];
            },

            load: function (loadOptions) {
                var d = new jQuery.Deferred();

                transformLoadOptions(loadOptions);

                loadOptions.userData = inst.userData;

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'Load',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        loadOptions: loadOptions
                    }
                }).done(function (result) {
                    inst.options.onLoad(loadOptions, result);
                    d.resolve(result.data, { totalCount: result.totalCount });
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            },

            totalCount: function (loadOptions) {
                var d = new jQuery.Deferred();

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'TotalCount',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        loadOptions: loadOptions
                    }
                }).done(function (result) {
                    d.resolve(result.totalCount);
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            },

            byKey: function (key, extraOptions) {
                var d = new jQuery.Deferred();

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'ByKey',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        key: key,
                        extraOptions: extraOptions
                    }
                }).done(function (result) {
                    d.resolve(result.data, { totalCount: result.totalCount });
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            },

            insert: function (values) {
                var d = new jQuery.Deferred();

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'Insert',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        values: values
                    }
                }).done(function (result) {
                    d.resolve();
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            },

            update: function (key, values) {
                var d = new jQuery.Deferred();

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'Update',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        key: key,
                        value: values
                    }
                }).done(function (result) {
                    d.resolve();
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            },

            remove: function (key) {
                var d = new jQuery.Deferred();

                PXPCallWebMethod('DXDataGridRequest', {
                    request: {
                        agu: PXP.AGU,
                        dataRequestType: 'Remove',
                        gridParameters: inst.gridParameters,
                        dataSourceTypeName: inst.dataSourceType,
                        key: key
                    }
                }).done(function (result) {
                    d.resolve();
                })
                    .fail(function () {
                        d.reject();
                    });

                return d.promise();
            }
        });
    };

    $.extend(Namespace('PXP.DevExpress'), {
        CustomSummary: function (options) {
            switch (options.summaryProcess) {
                case 'start':
                    options.totalValue = 0;

                    var columns = options.component.getVisibleColumns();
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].dataField == options.name) {
                            options.precision = columns[i].format && columns[i].format.precision;
                            break;
                        }
                    }

                    break;

                case 'calculate':
                    var isNegative = false;
                    var val = '';

                    try {
                        if (options.value) {
                            val = (JSON.parse(options.value).value || options.value).toString().trim();
                        }
                    }
                    catch (ex) {
                        val = (options.value || '').toString().trim();
                    }

                    if (val[0] == '$' || val[1] == '$') {
                        val = val.replace('$', '');
                        options.isCurrency = true;
                    }

                    if (val[0] == '(') {
                        val = val.replace('(', '');
                        isNegative = true;
                    }

                    val = val.replace(",", "");
                    val = parseFloat(val);                    

                    if (val) {
                        options.totalValue += isNegative ? -val : val;
                    }

                    break;

                case 'finalize':
                    if (options.isCurrency) {
                        options.totalValue = (options.totalValue || 0).toFixed(2);
                        if (options.totalValue < 0) {
                            options.totalValue = '(' + PXP.FormatCurrency((-options.totalValue || 0).toFixed(2)) + ')';                             
                        }
                        else {
                            options.totalValue = PXP.FormatCurrency(options.totalValue);
                        }
                    }
                    else {
                        options.totalValue = (options.totalValue || 0).toFixed(options.precision);

                        if (options.totalValue < 0) {
                            options.totalValue = '(' + (-options.totalValue) + ')';
                        }
                    }
                    break;
            }
        },

        ExtendGridConfiguration: function (origConfig) {
            return $.extend({}, origConfig, {
                onInitNewRow: function (options) {
                    var undef;

                    if (options.data) {
                        // Set the default value for each column
                        var columns = options.component.option('columns');
                        if (columns && $.isArray(columns)) {
                            for (var i = 0; i < columns.length; i++) {
                                var dataField = columns[i].dataField;
                                if (columns[i].defaultValue !== undef) {
                                    options.data[dataField] = columns[i].defaultValue;
                                }
                            }
                        }
                    }
                },

                onInitialized: function (options) {
                    if (origConfig.onInitialized) {
                        return origConfig.onInitialized.apply(this, arguments);
                    }
                },

                onRowPrepared: function (options) {
                    // If this is a new row, make all of the cells appear unchanged (even if they are)
                    if (options.inserted) {
                        setTimeout(function () {
                            options.rowElement.find('.dx-highlight-outline').removeClass('dx-highlight-outline');
                        }, 0);
                    }

                    // If all child cells have been suppressed, we need to ensure the spacer is also suppressed
                    var $spacer = options.rowElement.find('.dx-datagrid-group-space');
                    if ($spacer.siblings().not('.hidden').length == 0) {
                        $spacer.addClass('hidden');
                    }

                    // Set the row's URL if specified
                    if (options.data && options.data['ROW_EXTERNAL_LINK']) {
                        options.rowElement.attr('data-action', options.data['ROW_EXTERNAL_LINK']);
                        if (options.data['ROW_EXTERNAL_LINK_HREF']) {
                            options.rowElement.attr('href', options.data['ROW_EXTERNAL_LINK_HREF']);
                        }
                        if (options.data['ROW_EXTERNAL_LINK_FOCUS']) {
                            options.rowElement.attr('data-focus', options.data['ROW_EXTERNAL_LINK_FOCUS']);
                        }
                    }

                    if (options.component.option('hideIfEmpty')) {
                        var el = options.component.element()[0];
                        if (el) {
                            var $panel = el.$panel = el.$panel || $(el).closest('.panel');
                            if ($panel.hasClass('hidden')) {
                                $panel.removeClass('hidden');
                            }
                        }
                    }

                    if (origConfig.onRowPrepared) {
                        return origConfig.onRowPrepared.apply(this, arguments);
                    }
                },

                onEditorPrepared: function (options) {
                    if (options.parentType == 'searchPanel') {
                        options.editorElement?.fastFind('input').attr('autocomplete', ST.UUIDv4());
                    }
                    else if (options.dataField == 'Delete') {
                        options.setValue = (function (oldSetValue) {
                            return function (val, ev) {
                                setTimeout(function () {
                                    if (val) {
                                        options.component.deleteRow(options.row.rowIndex);
                                    }
                                    else {
                                        options.component.undeleteRow(options.row.rowIndex);
                                    }

                                    clearCellChangeState(options.component, options.row.rowIndex, options.index);
                                }, 0);

                                return oldSetValue.apply(this, arguments);
                            }
                        })(options.setValue);
                    }
                },

                onContentReady: function (e) {
                    // Prevent focus from leaving invalid cells
                    var $invalidCell = e.element.find("td.dx-datagrid-invalid").first();
                    if ($invalidCell.length && !$invalidCell.hasClass("dx-editor-cell")) {
                        e.component.editCell($invalidCell.parent().index(), $invalidCell.index());
                    }
                    else {
                        $invalidCell.find("[tabIndex]").focus();
                    }

                    if (e.component.option('hideIfEmpty')) {
                        e.element.closest('.panel')
                            .toggleClass('hidden', e.component.getVisibleRows().length == 0);
                    }

                    if (origConfig.onContentReady) {
                        return origConfig.onContentReady.apply(this, arguments);
                    }
                },

                onCellPrepared: function (options) {
                    if (options.rowType == 'header') {
                        if (options.column.suppressed) {
                            options.cellElement.addClass('hidden');
                        }
                    }
                    else {
                        options.originalValue = options.value;

                        const style = options.data && options.data.STYLE;
                        if (style) {
                            options.cellElement.addClass(style);
                        }

                        try {
                            const indicator = JSON.parse(options.values[options.columnIndex])?.indicator;
                            if (indicator?.message) {
                                switch (indicator.type) {
                                    case 0: // Information
                                        options.cellElement.addClass('blue-dorito');
                                        break;
                                    case 1: // Warning
                                        options.cellElement.addClass('orange-dorito');
                                        break;
                                    case 2: // Error
                                        options.cellElement.addClass('red-dorito');
                                        break;
                                }

                                const tooltipInstance = $('<div></div>')
                                    .appendTo(options.cellElement)
                                    .dxTooltip({
                                        position: "top"
                                    })
                                    .dxTooltip("instance");

                                options.cellElement.mouseover(function (arg) {
                                    tooltipInstance.option("contentTemplate", function (contentElement) {
                                        contentElement.html(`<div><b>${indicator.message}</b></div>`);
                                    });

                                    tooltipInstance.show(arg.target);
                                });

                                options.cellElement.mouseout(function (arg) {
                                    tooltipInstance.hide();
                                });
                            }
                        }
                        catch { }
                    }
                }
            });
        }
    });

    $.extend(Namespace('PXP.DataGridTemplates'), {
        Image: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.ImageColumn'](data));
            $el.appendTo(container);
        },

        Icon: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.IconColumn'](data));
            $el.appendTo(container);
        },

        // If value is a JSON string, extract the display/sort values from the object
        CalculateValue: function (data) {
            // return the column name if there is no data here
            if (data === null) {
                return this.dataField;
            }

            var displayValue = data[this.dataField];

            try {
                var obj = JSON.parse(displayValue);
                if (obj && typeof obj == 'object') {
                    displayValue = obj.value;
                }
            }
            catch (ex) { }

            return displayValue;
        },

        AssignmentColumnWithGoogleLink: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.AssignmentColumnWithGoogleLink'](data));		   
            $el.appendTo(container);
        },



        AdditionalStaffTeacherColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            data.streamsVisible = PXP.StreamsEnabled;
            data.synergyMailVisible = PXP.SynergyMailEnabled;            
            var $el = ich['PXP.DataGrid.AdditionalStaffTeacherColumn'](data);

            if (data.teacherName == "") {
                $el.find('span').remove();
                $el.find('img').remove();
            }
            
            $el.appendTo(container);         
        },



        AdditionalStaffTeacherColumnEdit: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            data.streamsVisible = PXP.StreamsEnabled;
            data.synergyMailVisible = PXP.SynergyMailEnabled;
            var $el = ich['PXP.DataGrid.AdditionalStaffTeacherColumn'](data);
       
            $el.appendTo(container);
        },



        TeacherColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            data.streamsVisible = PXP.StreamsEnabled;
            data.synergyMailVisible = PXP.SynergyMailEnabled;
            data.includeAdditionalStaffWhenEmailingTeachers = PXP.IncludeAdditionalStaffWhenEmailingTeachers;
            var additionalAddresses = [];

            if (data.includeAdditionalStaffWhenEmailingTeachers && data.teacherNameAndTeacherEmail) {
                for (var index = 0; index < data.teacherNameAndTeacherEmail.length; index++) {
                    var additionalTeacher = data.teacherNameAndTeacherEmail[index];
                    additionalAddresses.push('\\"' + additionalTeacher.AdditionalStafeName + '\\" <' + additionalTeacher.AdditionalStaffEmail + '>');
                }

                data.mailToAddresses = additionalAddresses.join('; ');
            }
            else {
                data.mailToAddresses = '\\"' + data.teacherNameFNLN + '\\" <' + data.email + '>';
            }

            var $el = $(ich['PXP.DataGrid.TeacherColumn'](data));
            $el.appendTo(container);
        },
    
        TeacherColumnEdit: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            data.streamsVisible = PXP.StreamsEnabled;
            data.synergyMailVisible = PXP.SynergyMailEnabled;
            var $el = $(ich['PXP.DataGrid.TeacherColumn'](data));
            $el.appendTo(container);
        },

        ButtonColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.ButtonColumn'](data));

            container.css('padding', '2px');
            container.removeAttr('aria-label');
            container.addClass('dx-btn-cell');

            $el.appendTo(container);
        },

        DynamicColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);

            if (data && data.dataType) {
                return PXP.DataGridTemplates[data.dataType](container, options);
            }
        },

        SelectColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);

            if (data) {
                var dispValue = data.values[data.value];
                data.label = options.column.caption + ' Value ' + dispValue;

                // convert the values to a list that our template can use
                if (data.values) {
                    data.hasValues = true;
                    data.templateValues = [];
                    for (var i in data.values) {
                        data.templateValues.push({
                            code: i,
                            desc: data.values[i]
                        });
                    }
                }

                container.attr('aria-label', data.label);
                var $el = $(ich['PXP.DataGrid.SelectColumn'](data));
                $el.find('select').val(data.value);

                $el.appendTo(container);
            }
        },

        NumberColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);

            if (data) {
                data.label = options.column.caption + ' Value ' + data.value;

                container.attr('aria-label', data.label);
                var $el = $(ich['PXP.DataGrid.NumberColumn'](data));
                $el.appendTo(container);
            }
        },

        NumberColumnEdit: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.NumberColumnEdit'](data));
            $el.appendTo(container);
        },

        CurrencyColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var meta = options.data && options.data.META && JSON.parse(options.data.META) || {};

            if (data) {
                data.label = options.column.caption + ' Value ' + data.value;

                container.attr('aria-label', data.label);

                if (data && meta.isEditable) {
                    data.editable = true;
                    data = $.extend(data, meta);
                    var $el = $(ich['PXP.DataGrid.CurrencyColumn'](data));
                }
                else {
                    var $el = $(ich['PXP.DataGrid.CurrencyColumn'](data));
                }

                $el.appendTo(container);
            }
        },

        LinkColumn: function (container, options) {
            var data = options.value && JSON.parse(options.value);
            var $el = $(ich['PXP.DataGrid.LinkColumn'](data));
            $el.appendTo(container);
        },

        PhoneNumber: function (container, options) {
        },

        PhoneNumberEdit: function (container, options) {
        },
    
        HealthImmunization: function (container, options) {
            var $el;
            if (options.text === 'NotUsed') {
                $el = $('<div></div>');
                container.addClass('NotUsed');
            } else {
                $el = $('<div>' + options.text + '</div>');
            }
            $el.appendTo(container);
        }
    });
}

// Allow forms/buttons to execute deferred actions before submitting a postback
$(document).ready(function () {
    function deferredPostback(originalDoPostback) {
        return function (ev) {
            var target = document.getElementsByName(ev.eventTarget)[0];

            $(target).closest('form').each(function () {
                this.submitTriggerElement = target;
            });

            return originalDoPostback.apply(this, arguments);
        }
    }

    if (window.WebForm_DoPostBackWithOptions) {
        window.WebForm_DoPostBackWithOptions = deferredPostback(WebForm_DoPostBackWithOptions);
    }

    if (window.__doPostBack) {
        window.__doPostBack = deferredPostback(__doPostBack);
    }

    if (window.WebForm_OnSubmit) {
        window.WebForm_OnSubmit = (function (originalOnSubmit) {
            return function (ev) {
                ev = ev || window.event;

                if (ev !== undefined) {
                    var target = ev.target || ev.currentTarget;

                    var trigger = target.submitTriggerElement;
                    if (trigger && trigger.beforeSubmit && !trigger.readyToSubmit) {
                        trigger.beforeSubmit().done(function () {
                            trigger.readyToSubmit = true;
                            setTimeout(function () {
                                $(trigger).click();
                                trigger.readyToSubmit = false;
                            }, 0);
                        });

                        return false;
                    }
                    else {
                        return originalOnSubmit.apply(this, arguments);
                    }
                }
                else {
                    return originalOnSubmit.apply(this, arguments);
                }
            }
        })(window.WebForm_OnSubmit);
    }
});

(function ($) {
    // Allow a button to execute a deferred action before submitting a form
    $.fn.beforeSubmit = function (fn) {
        return this.each(function () {
            this.beforeSubmit = function () {
                var res = fn.apply(this, arguments);

                // Allow a method to return a boolean value
                if (res === true || res === false) {
                    res = res ? $.resolve() : $.reject();
                }

                return res;
            }
        });
    };
})(jQuery);


// Initialize the OLRNotice dialog.  If dialogs will be used frequently, this may need to be refactored
$(document).ready(function () {
    // IE11 can't figure out how to flex vertically without a static height
    var $dlg = $('#OLRNotice').find('.dialog');
    $dlg.height($dlg.height());

    PXP.StartSessionTimer();

    $('#OLRNotice')
        .on('click', function () {
            if ($('#btnRemindMeLater')[0]) {
                $(this).remove();
            }
        })
        .on('click', 'button,input[type="button"]', function (ev) {
            $('#OLRNotice').remove();
        })
        .on('click', '.dialog', function (ev) {
            ev.stopImmediatePropagation();
        });
});

(function ($) {
    var keepAliveInterval = null;
    var inactivityInterval = null;
    var logoutInterval = null;

    function initKeepAliveInterval() {
        if (ST.SessionLength > 0) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = setInterval(sendKeepAlive, ST.SessionLength * 60 * 1000);
        }
    }
    function sendKeepAlive() {
        $('#keepAliveFrame').attr('src', 'Home_PXP2.aspx?KEEP_ALIVE=Y&DT=' + new Date().toJSON());
    }
    initKeepAliveInterval();

    function getSessionStartTime() {
        var dt = parseInt(window.localStorage['PXPSessionStartTime']) || new Date().getTime();
        return new Date(dt);
    }
    function refreshInactivityInterval() {

        if (window.top.location.pathname.indexOf('Frameset') === -1) {
            if (!logoutInterval) {
                clearInterval(inactivityInterval);
                window.localStorage['PXPSessionStartTime'] = new Date().getTime().toString();

                inactivityInterval = setInterval(checkInactivityTimer, 5000);
            }
        }
    }
    function checkInactivityTimer() {
        var now = new Date();
        var diff = now - getSessionStartTime();
        var mins = diff / 1000 / 60;
        var sessionLengthMins = Math.max(2, (PXP.SessionTimeout || 1) / 60);
        var warningMins = 1;

        if (mins > sessionLengthMins - warningMins || !!localStorage['PXPLogoutStartTime']) {
            initLogoutTimer();
        }
    }

    function getLogoutStartTime() {
        var dt = parseInt(window.localStorage['PXPLogoutStartTime']) || new Date().getTime();
        return new Date(dt);
    }
    function initLogoutTimer() {
        if (!logoutInterval) {
            if (!localStorage['PXPLogoutStartTime']) {
                localStorage['PXPLogoutStartTime'] = new Date().getTime().toString();
            }

            $().stModal({ template: 'PXP.SessionExpiring' })
                .done(resetLogoutTimer);

            logoutInterval = setInterval(checkLogoutTimer, 1000);
        }
    }
    function checkLogoutTimer() {
        if (!localStorage['PXPLogoutStartTime']) {
            resetLogoutTimer();
            refreshInactivityInterval();
            return;
        }

        var now = new Date();
        var secondsLeft = parseInt(60 - ((now - getLogoutStartTime()) / 1000));

        if (secondsLeft > 0) {
            $('#sessionExpirationSeconds').text(secondsLeft);
        } else {
            clearInterval(logoutInterval);
            if (ST.UserType === UserType.Parent) {
                window.location.href = 'PXP2_Login_Parent.aspx';
            } else {
                window.location.href = 'PXP2_Login_Student.aspx';
            }
        }
    }
    function resetLogoutTimer() {
        $('.st-modal.in').modal('hide');

        clearInterval(logoutInterval);
        window.localStorage['PXPLogoutStartTime'] = '';
        logoutInterval = null;
    }

    $(document).on('mousemove mousedown keydown', refreshInactivityInterval);

    $.extend(Namespace('PXP'), {
        GetArguments: function (href) {
            var res = {};

            var query = (href || '').split('?');
            if (query.length) {
                query = query[query.length - 1];
                var params = query.split('&');
                for (var p in params) {
                    var param_pair = params[p].split('=');
                    res[param_pair[0]] = param_pair[1] || '';
                }
            }

            return res;
        },

        ShowMessage: function (id) {

            $.ajax({
                type: "POST",
                url: "PXP_Messages.aspx/GetMessageContent",
                data: JSON.stringify({
                    id: id
                }),
                dataType: 'json',
                contentType: "application/json",
                success: function (result) {
                    var $messageText = $('<div>' + result.d.messageText + '</div>');
                    $messageText.find('a').attr('target', '_blank');
                    $().stModal({
                        template: 'PXP.GBMessage',
                        subject: result.d.subject,
                        messageText: '<p>From: ' + result.d.from + '</p><p>' + $messageText.html() + '</p>'
                    });
                },
                error: function () {
                    $().stModal({
                        template: 'PXP.GBMessage',
                        subject: 'Error',
                        messageText: 'Unable to load message.'
                    });
                }
            });
        },

        StackCreateHeading: function ($stack, insertionPoint) {
            var headings = [];
            var $items = $stack.children('.content-stack-item');
            if (!insertionPoint) {
                insertionPoint = $items.length;
            }

            var first = true;
            $items.take(insertionPoint)
                .each(function () {
                    if (!first) {
                        var $h = $(this).find('.breadcrumb-header');
                        var txt = $h.data('stack-text') || $h.children('span').first().text() || $h.text();
                        $h.data('stack-text', txt);

                        headings.push('<a class="breadcrumb-header" href="#" data-action="StackPop" data-toggle="tooltip" title="Return to $1">$1</a>'.replace(/\$1/g, txt));
                    }
                    first = false;
                });

            return $(ich['PXP.StackItem.Heading']({
                heading_text: headings.join(' / ') +
                    (headings.length ? ' / ' : '')
            })).html();
        },

        StackPop: function ($stack, numItems) {
            var $items = $stack.children('.content-stack-item');
            numItems = Math.min(numItems, $items.length);

            $items.skip($items.length - numItems).slideUp({
                complete: function () {
                    $(document.body).children('.tooltip').remove();
                    $(this).remove();
                }
            });

            $items.skip($items.length - numItems - 1).take(1).slideDown();

        },

        StackPush: function ($stack, control, parameters, insertionPoint) {
            var deferred = new jQuery.Deferred();

            var $items = $stack.children('.content-stack-item');
            if (!insertionPoint || (insertionPoint && $.isNumeric(insertionPoint) === false)) {
                insertionPoint = $items.length;
            }
            if (insertionPoint < $items.length) {
                // remove stack items
                $items.skip(insertionPoint).slideUp({
                    complete: function () {
                        $(document.body).children('.tooltip').remove();
                        $(this).remove();
                    }
                });
            }

            // Hide any existing stack items
            $items.slideUp();

            var heading_html = PXP.StackCreateHeading($stack, insertionPoint);

            // Add the new dom element (loading) to the stack and show it
            var $item = $(ich['PXP.StackItem']()).appendTo($stack);
            $item.slideDown();

            if (parameters) {
                parameters.AGU = PXP.AGU;
            }

            // send the request
            PXPCallWebMethod('LoadControl', {
                request: {
                    control: control,
                    parameters: parameters
                }
            })
                .done(function (response) {
                    $item.empty()
                        .append('<div>' + response.html + '</div>');
                    var $h = $item.find('.breadcrumb-header');
                    var $header = $h.parent('h1,h2').first();
                    $header.toggle(false);
                    $h.data('stack-text', $h.children('span').not('.sr-only').first().text() || $h.text());
                    var $breadCrumb = $('.content-stack').first().find('.breadcrumb-text').first();
                    $breadCrumb.html(heading_html + $h.data('stack-text'));

                    deferred.resolve($item);
                })
                .fail(function (response) {
                    $item.empty();
                    deferred.reject(response);
                });

            return deferred.promise();
        },

        StackInsert: function ($stack, numItems, control, parameters) {
            var deferred = new jQuery.Deferred();

            // remove stack items
            var $items = $stack.children('.content-stack-item');
            numItems = Math.min(numItems, $items.length);

            $items.skip($items.length - numItems).slideUp({
                complete: function () {
                    $(document.body).children('.tooltip').remove();
                    $(this).remove();
                }
            });

            // Hide any existing stack items
            $stack.children('.content-stack-item').slideUp();

            var heading_html = PXP.StackCreateHeading($stack, numItems);

            // Add the new dom element (loading) to the stack and show it
            var $item = $(ich['PXP.StackItem']()).appendTo($stack);
            $item.slideDown();

            if (parameters) {
                parameters.AGU = PXP.AGU;
            }

            // send the request
            PXPCallWebMethod('LoadControl', {
                request: {
                    control: control,
                    parameters: parameters
                }
            })
                .done(function (response) {
                    $item.empty()
                        .append('<div>' + response.html + '</div>');

                    var $h = $item.find('h1,h2').first();
                    $h.data('stack-text', $h.children('span').not('.sr-only').first().text() || $h.text());
                    $h.prepend(heading_html);

                    deferred.resolve($item);
                })
                .fail(function (response) {
                    $item.empty();
                    deferred.reject(response);
                });

            return deferred.promise();
        },

        StartSessionTimer: function () {
            resetLogoutTimer();
            refreshInactivityInterval();
        },

        FormatCurrency: function (val) {
            // return the formatted currency

            try {
                val = '$' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            }
            catch (ex) { }

            return val;
        },


    });

    $.extend(Namespace('PXP.Actions'), {
        Modal: {
            Close: function (ev) {
                $(this).closest('.st-modal').modal('hide');
            }
        },
        RequestKeepAlive: function (ev) {
            resetLogoutTimer();
            refreshInactivityInterval();
        },

        StackPop: function (ev) {
            var $stack = $(this).closest('.content-stack');
            var numItems = $(this).nextAll('[data-action="StackPop"]').length + 1;

            PXP.StackPop($stack, numItems);
        },

        StackPush: function (ev) {
            // Initialize some variables
            var $stack = $(this).closest('.content-stack');

            PXP.StackPush($stack,
                this.getAttribute('data-control'),
                this.getAttribute('data-params')
                    ? JSON.parse(this.getAttribute('data-params'))
                    : PXP.GetArguments(this.getAttribute('href'))
            );

            ev.preventDefault();
        },

        LoadFlexScheduling: function (ev) {
            var $count = $('#requireFlexPeriodCount');
            window.location.href = $count.closest('a').attr('href');
        }
    });

    if (window.ST && ST.RegisterXMLParser) {
        ST.RegisterXMLParser('.*?/REV_RESPONSE/Error', function (node) {
            var msg = node.getAttribute('MESSAGE');
            var $stack = $(node).children('StackTrace');

            if (msg) {
                if ($stack.length) {
                    console.log(msg);
                }
                else {
                    $.pnotify_error(msg);
                }
            }
        });
    }
})(jQuery);