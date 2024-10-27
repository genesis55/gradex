define(['knockout', 'app', 'ko-bindings', 'componentConfigs', 'gb-calcs'], function (ko, app, b, cmpCfg, calcs) {
    return function (config, security, events) {
        var self = this;

        //first lets refresh the calcs data because we likely changed focus to get here.
        calcs.loadData();

        self.isLoading = ko.observable(true);

        self.totalItemText = ko.pureComputed(function () {
            if (self.totalItemCount() === undefined) {
                return 'Loading...';
            }
            return self.totalItemCount() + ' total items';
        });

        self.showMissing = ko.observable(false);
        self.showMissing.subscribe(function (value) {
            self.requestData();
        });

        self.showUpcoming = ko.observable(false);
        self.showUpcoming.subscribe(function (value) {
            self.requestData();
        });

        self.showResults = ko.observable(true);
        self.isSecondary = ko.observable(true);

        self.showDone = ko.observable("Not Done");
        self.showDone.subscribe(function (value) {
            self.requestData();
        });

        self.searchText = ko.observable();
        self.searchText.subscribe(function (value) {
            self.requestData();
        });

        self.displayType = ko.observable('List');

        events('pxp.course.missing.card.click').subscribe(function (e) {
            self.showMissing(e.isFilterOn);
        });
        events('pxp.course.upcoming.card.click').subscribe(function (e) {
            self.showUpcoming(e.isFilterOn);
        });
        events('pxp.course.subject.card.click').subscribe(function (e) {
            let subjects = e.filterItemsOn.filter(function (f) { return f.type() == 'subject' }).map(function (f) { return f.text() });
            self.subjectFilter(subjects);
            self.requestData();
        });

        events('ShowResults').subscribe(function (data) {
            self.showResults(!self.showResults());
        });

        self.teacherFilter = ko.observable();
        self.teacherNames = ko.observableArray([]);

        self.isElementary = ko.pureComputed(function () {
            return self.isSecondary() === false;
        });
        self.showTeachersFilter = ko.pureComputed(function () {
            return self.isElementary() && self.teacherNames().length > 1;
        });

        self.subjectFilter = ko.observableArray();
        self.subjects = ko.observableArray([]);

        self.dateOrderDesc = ko.observable();

        self.syllabus = {
            isVisibleViewSyllabus: ko.observable(true)
        };

        self.configs = {
            form: {
                showColonAfterLabel: false,
                labelLocation: "top",
                colCount: 3,
                formData: {
                    showMissing: self.showMissing,
                    showUpcoming: self.showUpcoming,
                    search: self.searchText,
                    showDone: self.showDone,
                    teacherFilter: self.teacherFilter,
                    subjectFilter: self.subjectFilter
                },
                items: [{
                    dataField: 'search',
                    editorOptions: {
                        placeholder: 'Search Assignment Name',
                        showClearButton: true,
                        valueChangeEvent: 'keyup'
                    }
                }, {
                    dataField: 'teacherFilter',
                    editorType: 'dxSelectBox',
                    visible: self.showTeachersFilter,
                    editorOptions: {
                        showClearButton: true,
                        value: self.teacherFilter,
                        dataSource: self.teacherNames,
                        onValueChanged: function () {
                            self.requestData();
                        }
                    }
                }, {
                    dataField: 'subjectFilter',
                    editorType: 'dxSelectBox',
                    visible: false,
                    editorOptions: {
                        showClearButton: true,
                        value: self.subjectFilter,
                        dataSource: self.subjects,
                        onValueChanged: function () {
                            self.requestData();
                        }
                    }
                }, {
                    dataField: 'showMissing',
                    editorType: "dxSwitch",
                    visible: false
                }, {
                    dataField: 'showUpcoming',
                    editorType: "dxSwitch",
                    visible: false
                }, {
                    dataField: 'showDone',
                    editorType: "dxRadioGroup",
                    editorOptions: {
                        items: ["Done", "Not Done", "All"],
                        layout: 'horizontal',
                        width: 225
                    }
                }]
            },
            syllabusConfig: {
                text: 'Class Information',
                smallText: 'View teacher and class information',
                icon: 'fas fa-book',
                onClick: function (e) {
                    var popup = new app.popup('Class Information', 'pxp.course.syllabus', {
                        config: {
                            area: ''
                        }
                    }, {
                        onHidden: function (e) {
                        },
                        width: '95%',
                        height: '95%'
                    });
                    popup.open();
                }
            }
        };
        self.showAssignmentPct = ko.observable();
        self.groupingFields = ko.observableArray([]);
        self.totalItemCount = ko.observable();
        self.isDataGrouped = ko.observable(false);
        self.isFilterOn = ko.observable(false);
        self.showFiltersBox = ko.pureComputed(function () {
            return self.totalItemCount() > 0 || self.isFilterOn();
        });
        self.showLearningRecs = ko.observable();
        self.learningResourceText = ko.observable();

        self.selectedNode = ko.observable();

        self.breadcrumbs = ko.observableArray();

        self.selectNode = function (node) {
            self.breadcrumbs.push(node);
            self.selectedNode(node);
        };

        window.globalFunctions = {
            setIframeHeight: function (ifrm) {
                ifrm.style.height = ($('.dx-popup-content').last().height() - 10) + "px";
            }
        };

        self.selectItem = function (item) {
            if (item.itemType === 'LMS Page') {
                let popup = new app.popup('Course Item LMS Page', 'render.direct', {
                    config: {
                        html: '<iframe style="width:100%;border:0;" onload="window.globalFunctions.setIframeHeight(this)" src="' + app.HtmlEncode(item.lmsPageUrl) + '"></iframe>'
                    }
                }, {
                    onHidden: function (e) {
                        //when the grade book content is closed then refresh.
                        self.requestData();
                    },
                    width: '100%',
                    height: '100%'
                });
                popup.open();
            } else if (item.itemType === 'Assessment') {
                location.assign(item.testURL);
            } else {
                let popup = new app.popup('Course Item', 'pxp.course.item', {
                    config: {
                        gradeBookId: item.itemID,
                        courseItemType: item.courseItemType,
                        showLearningRecs: item.showLearningRecs
                    }
                }, {
                    onHidden: function (e) {
                        //when the grade book content is closed then refresh.
                        self.requestData();
                    },
                    width: '100%',
                    height: '100%'
                });
                popup.open();
            }
        };

        self.selectLR = function (item) {
            let popup = new app.popup(`Learning Resources for ${item.title}`, 'pxp.course.item.learning.item', {
                config: {
                    gradeBookId: item.itemID,
                    showLearningRecs: item.showLearningRecs
                }
            }, {
                onHidden: function (e) {
                },
                width: '75%',
                height: '75%'
            });
            popup.open();
        };

        self.evalShowChecked = function ($data) {
            if ($data.showChecked === undefined) {
                $data.showChecked = ko.observable($data.isDone);
            }
            return $data;
        };

        self.assignmentScoreTooltip = function ($data) {
            var toolTip = $data.gradeMark + ' ' + $data.commentText;
            if (self.showAssignmentPct()) {
                toolTip = toolTip + '<br>' + '(' + $data.calcValue + ')';
            }
            return toolTip;
        }

        self.toggleDone = function ($data) {
            app.call('pxp.course.item', 'toggleDone', { gradeBookId: $data.itemID });
            $data.showChecked(!$data.showChecked());
        };

        self.evalWhatIfButton = function ($data) {
            if ($data.showWhatIf === undefined) {
                $data.showWhatIf = ko.observable(false);
                $data.whatIfClick = function () {
                    $data.showWhatIf(!$data.showWhatIf());
                };
            }
            if ($data.whatIfAvailable > 0) {
                return true;
            } else {
                return false;
            }
        };

        self.selectBreadcrumb = function (node) {
            var found = false;
            while (!found) {
                var item = self.breadcrumbs.pop();
                if (item === node || item === null) {
                    found = true;
                }
            }
            self.selectNode(node);
        };

        self.isLastBreadCrumb = function (index) {
            return index() === self.breadcrumbs().length - 1;
        };

        self.loadStudentContent = function ($data) {
            if ($data.showStudentContentLoading === undefined) {
                $data.showStudentContentLoading = ko.observable(false);
                $data.studentRichContentSections = ko.observableArray();
                if ($data.showStudentContent() === true) {
                    $data.showStudentContentLoading(true);
                    //get the content then turn off the loader.
                    app.call({ friendlyName: "pxp.course.content", method: 'getStudentContentItems', parameters: { gradeBookId: $data.itemID }, koMapTo: $data.studentRichContentSections })
                        .done(function (data) {
                            $data.showStudentContentLoading(false);
                        });
                }
            }
            return $data;
        };

        self.evalItemCount = function ($data) {
            var items = 0;
            if ($data.items) {
                //at group level
                for (var i = 0; i < $data.items.length; i++) {
                    items += self.evalItemCount($data.items[i]);
                }
            } else {
                items += 1;
            }
            return items;
        };

        var dataSource = app.DXDataSource('pxp.course.content.items', { dataSourceConfig: { paginate: false, requireTotalCount: true } });

        self.requestData = function () {
            var filters = [];
            //some settings turn off grouping
            var doGrouping = true;
            if (self.showUpcoming() === true) {
                var d = new Date();
                d.setDate(d.getDate() - 1);
                filters.push(["due_date", ">", d]);
                doGrouping = false;
            }
            if (self.showMissing() === true) {
                filters.push(["isMissing", "=", true]);
                doGrouping = false;
            }
            if (self.searchText() && self.searchText().length > 0) {
                var searchValue = self.searchText();
                filters.push(["title", "contains", searchValue]);
                doGrouping = false;
            }
            if (self.teacherFilter() && self.teacherFilter().length > 0) {
                filters.push(["teacherName", "=", self.teacherFilter()]);
            }
            if (self.subjectFilter() && self.subjectFilter().length > 0) {
                let subjects = [];
                for (var i = 0; i < self.subjectFilter().length; i++) {
                    let thisSubject = self.subjectFilter()[i];
                    if (i > 0) { subjects.push('or'); }
                    subjects.push(["subject", "=", thisSubject]);
                }
                filters.push(subjects);
            }

            //done behaves a little differently..
            let doneType = self.showDone();
            switch (doneType) {
                case "Done":
                    filters.push(["isDone", "=", true]);
                    break;
                case "Not Done":
                    filters.push(["isDone", "=", false]);
                    break;
                case "All":
                    break;
            }

            if (filters.length === 0) {
                filters = null;
                self.isFilterOn(false);
            } else {
                self.isFilterOn(true);
            }
            dataSource.filter(filters);

            self.isDataGrouped(true);

            var groupFields = self.groupingFields();
            if (doGrouping === false) {
                groupFields = [];
                self.isDataGrouped(false);
            };

            dataSource.sort([
                { selector: "due_date", desc: self.dateOrderDesc() }
            ]);

            if (self.displayType() !== 'Grid') {
                var gf = $.grep(groupFields, function (item, index) { return item.selected(); });
                var go = $.map(gf, function (g) { return { Selector: g.fieldName(), desc: g.desc() }; });
                dataSource.group(go);
            }

            var setGroupLevels = function (results, groups, currentLevel) {
                if (groups.length - 1 < currentLevel) {
                    //these are items, loop through and setup any observables needed.
                    for (var index = 0; index < results.length; index++) {
                        var item = results[index];
                        if (item.showStudentContent !== undefined && ko.isObservable(item.showStudentContent) === false) {
                            item.showStudentContent = ko.observable(item.showStudentContent);
                        }
                    }
                    return;
                }
                if (this.index === undefined) {
                    this.index = 0;
                }
                let fieldName = groups[currentLevel].Selector;
                for (var i = 0; i < results.length; i++) {
                    this.index += 1;
                    let result = results[i];
                    if (result.level === undefined) {
                        result.index = this.index;
                        result.level = currentLevel;
                        result.groupField = fieldName;
                    }
                    let newLevel = currentLevel + 1;
                    setGroupLevels(result.items, groups, newLevel);
                }
            };

            dataSource.load().done(function (result, summary) {
                setGroupLevels(result, go, 0);
                self.breadcrumbs.removeAll();
                self.totalItemCount(summary.totalCount);
                var rootNode = { key: self.totalItemText, items: result };
                self.selectNode(rootNode);
                self.teacherNames(summary.metaData.extraData.teacherNames);
                self.subjects(summary.metaData.extraData.subjects);
                self.isLoading(false);
                $('.outline-box').affix({
                    offset: {
                        top: 400
                    }
                });
            });

        };


        app.call({
            friendlyName: 'pxp.course.content',
            method: 'get',
            parameters: {},
            koMapping: {},
            koMapTo: self
        }).done(function (data) {
            self.dateOrderDesc(data.dateOrderDesc);
            self.requestData();
        });

        self.dispose = function () {
            $(document).off('click.gradebook.content');
        };

        $(document).on('click.gradebook.content', 'a[scrollTo]', function () {
            // Figure out element to scroll to
            var target = $(this).attr('scrollTo');
            target = $('[name=' + target + ']');
            // Does a scroll target exist?
            if (target.length) {
                // Only prevent default if animation is actually gonna happen
                event.preventDefault();
                $('html, body').animate({
                    scrollTop: target.offset().top
                }, 1000, function () {
                    // Callback after animation
                    // Must change focus!
                    var $target = $(target);
                    $target.focus();
                    if ($target.is(":focus")) { // Checking if the target was focused
                        return false;
                    } else {
                        $target.attr('tabindex', '-1'); // Adding tabindex for elements not focusable
                        $target.focus(); // Set focus again
                    };
                });
            }
        });

    };
});