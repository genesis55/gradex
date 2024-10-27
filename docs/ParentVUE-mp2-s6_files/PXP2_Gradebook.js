﻿// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}


$.extend(Namespace('PXP'), {
    GBFocus: new function () {
        var self = this;
        var focusArgs = new function () {
            var self = this;
            self.schoolID = ko.observable(-1);
            self.classID = ko.observable(-1);
            self.markPeriodGU = ko.observable('');
            self.gradePeriodGU = ko.observable('');
            self.subjectID = ko.observable(-1);
            self.teacherID = ko.observable(-1);
            self.assignmentID = ko.observable(-1);
            self.standardIdentifier = ko.observable('');
            self.viewName = ko.observable('');
            self.studentGU = ko.observable('');
            self.AGU = ko.observable(PXP.AGU);
            self.OrgYearGU = ko.observable('');
        };
        self.schoolID = ko.computed(function () { return focusArgs.schoolID(); });
        self.classID = ko.computed(function () { return focusArgs.classID(); });
        self.markPeriodGU = ko.computed(function () { return focusArgs.markPeriodGU(); });
        self.gradePeriodGU = ko.computed(function () { return focusArgs.gradePeriodGU(); });
        self.subjectID = ko.computed(function () { return focusArgs.subjectID(); });
        self.teacherID = ko.computed(function () { return focusArgs.teacherID(); });
        self.assignmentID = ko.computed(function () { return focusArgs.assignmentID(); });
        self.standardIdentifier = ko.computed(function () { return focusArgs.standardIdentifier(); });
        self.viewName = ko.computed(function () { return focusArgs.viewName(); });
        self.studentGU = ko.computed(function () { return focusArgs.studentGU(); });
        self.AGU = ko.computed(function () { return focusArgs.AGU(); });
        self.OrgYearGU = ko.computed(function () { return focusArgs.OrgYearGU(); });
        self.Schools = ko.observableArray([]);
        self.GradingPeriods = ko.observableArray([]);
        self.Classes = ko.observableArray([]);
        self.Subjects = ko.observableArray([]);
        self.StandardSubjects = ko.observableArray([]);
        self.MarkPeriods = ko.observableArray([]);
        self.CurrentControl = ko.observable('');
        self.TeacherPhotoVisible = ko.observable(false);
        self.TeacherPhotoUrl = ko.observable('');
        self.TeacherName = ko.observable('');
        self.SchoolName = ko.observable('');
        self.IsVisible = ko.observable(false);
        self.IsControlLoaded = ko.observable(false);

        self.IsSubjectView = ko.computed(function () {
            var gradePeriodGU = focusArgs.gradePeriodGU();
            if (gradePeriodGU) {
                var gp = self.GradingPeriods().find(function (x) { return x.GU() === gradePeriodGU; });
                if (gp) {
                    return gp.IsSubjectView();
                }
            }
            return false;
        });

        self.GetClassDetailControl = function () {
            switch (focusArgs.viewName()) {
                case 'subject':
                    return 'Gradebook_SchoolClasses';
                    break;
                case 'assignment':
                    return 'Gradebook_ClassDetails';
                    break;
                case 'standard':
                    return 'Gradebook_ClassDetails';
                    break;
                case 'courseContent':
                    return 'Gradebook_RichContentClassDetails';
                    break;
                case 'post':
                    return 'Gradebook_Posts';
                    break;
                default:
                    return null;
            }
        };

        self.SetViewName = function (viewName) {
            focusArgs.viewName(viewName);
            if (self.buttonGroupControl) {
                self.buttonGroupControl.repaint();
            }
        };

        self.waitToUpdateGPAfterSchoolIdSet = false;
        self.GetArguments = function (args) {
            if (args) {
                if (args.gradePeriodGU) {
                    self.waitToUpdateGPAfterSchoolIdSet = true;
                }
                focusArgs.schoolID(args.schoolID);
                self.waitToUpdateGPAfterSchoolIdSet = false;
                focusArgs.OrgYearGU(args.OrgYearGU);
                focusArgs.gradePeriodGU(args.gradePeriodGU || '');
                focusArgs.classID(args.classID);
                focusArgs.subjectID(args.subjectID);
                focusArgs.teacherID(args.teacherID);
                focusArgs.markPeriodGU(args.markPeriodGU || '');
                focusArgs.assignmentID(args.assignmentID);
                focusArgs.standardIdentifier(args.standardIdentifier);
                self.SetViewName(args.viewName);
                focusArgs.studentGU(args.studentGU);
                focusArgs.AGU(args.AGU);
            }
            return {
                schoolID: focusArgs.schoolID(),
                classID: focusArgs.classID(),
                gradePeriodGU: focusArgs.gradePeriodGU(),
                subjectID: focusArgs.subjectID(),
                teacherID: focusArgs.teacherID(),
                markPeriodGU: focusArgs.markPeriodGU(),
                assignmentID: focusArgs.assignmentID(),
                standardIdentifier: focusArgs.standardIdentifier(),
                viewName: focusArgs.viewName(),
                studentGU: focusArgs.studentGU(),
                AGU: focusArgs.AGU(),
                OrgYearGU: focusArgs.OrgYearGU()
            };
        };

        self.LoadControl = function (loadParams, initialArgs) {
            var args = self.GetArguments(initialArgs);
            self.IsVisible(!loadParams.HideHeader);
            var controlName = ko.unwrap(loadParams.ControlName);
            if (controlName) {
                var $stack = $('#gradebook-content');
                $stack.empty();
                var $item = $(ich['PXP.StackItem']()).appendTo($stack);
                $item.slideDown();

                console.warn('LoadControl', {
                    request: {
                        control: controlName,
                        parameters: args
                    }
                });
                // send the request
                return PXPCallWebMethod('LoadControl',
                    {
                        request: {
                            control: controlName,
                            parameters: args
                        }
                    })
                    .done(function (response) {
                        self.CurrentControl(controlName);
                        $stack.empty()
                            .append(response.html);
                        // set breadcrumb
                        //   Period ^  |  Class/Subject ^  |  Assignement ^
                        //    - class change can be
                        // show all periods for both school - group by school
                        self.IsControlLoaded(true);
                        // update the gradebook header
                        var $head = $('#GradebookHeader');
                        $head.empty().append('<a href="javascript: PXP.GBFocus.GoToGradebook()">Grade Book</a>');
                        if (self.toolbarControl) {
                            self.toolbarControl.repaint();
                        }
                        //remove the course content link when loading a detail view.
                        $('.course-content-header-link').hide();
                    })
                    .fail(function (response) {
                        $item.empty();
                    });
            }
            //else {
            //    $item.empty();
            //}
        };

        self.focusChanged = ko.computed(function () {
            let focus = ko.toJS(focusArgs);
            console.warn('focusChanged', focus);
            var classDetailControl = self.GetClassDetailControl();
            if (classDetailControl) {
                self.LoadControl({ ControlName: classDetailControl }, focus);
            }
        }).extend({ rateLimit: { timeout: 100, method: "notifyWhenChangesStop" } });

        self.Init = function (currentFocus) {
            if (currentFocus) {
                ko.mapping.fromJS(currentFocus.FocusArgs, {}, focusArgs);
                self.GetFocusClassInfo();
            }
        }

        self.Load = function (data) {
            if (data) {
                ko.mapping.fromJS(data, {}, self);
                self.ChangeGradingPeriod(focusArgs.gradePeriodGU());
            }
            let br = $('#BindingRoot');
            if (br.length > 0) {
                ko.applyBindings(self, $('#BindingRoot')[0]);
                if (PXP.HideElementarySubjectSummary === true) {
                    //we are supposed to load the course content view.
                    setTimeout(function () {
                        self.LoadCourseContentGradeBook();
                    }, 100);
                }
            }
        };

        self.IsStandardsAvailable = ko.computed(function () {
            let classID = focusArgs.classID();
            let classes = self.Classes();
            if (classes) {
                var item = classes.find(function (x) { return x.ID() === classID });
                if (item) {
                    return item.IsStandardsAvailable();
                }
            }
            return false;
        });

        self.IsCurriculumModuleEnabled = ko.computed(function () {
            let classID = focusArgs.classID();
            let classes = self.Classes();
            if (classes) {
                var item = classes.find(function (x) { return x.ID() === classID });
                if (item) {
                    return item.IsCurriculumModuleEnabled();
                }
            }
            return false;
        });

        self.IsPostsViewLinkAvailable = ko.computed(function () {
            let classID = focusArgs.classID();
            let classes = self.Classes();
            if (classes) {
                var item = classes.find(function (x) { return x.ID() === classID });
                if (item) {
                    return item.IsPostsViewLinkAvailable();
                }
            }
            return false;
        });

        self.SelectedGradingPeriodName = ko.computed(function () {
            let gradePeriodGU = focusArgs.gradePeriodGU();
            let periods = self.GradingPeriods();
            if (periods) {
                var gp = self.GradingPeriods().find(function (x) { return x.GU() === gradePeriodGU });
                if (gp) {
                    return gp.Name();
                }
            }
            return '&nbsp;';
        });
        self.SelectedClassName = ko.computed(function () {
            let classID = focusArgs.classID();
            let classes = self.Classes();
            if (classes) {
                var item = self.Classes().find(function (x) { return x.ID() === classID });
                if (item) {
                    return item.Name();
                }
            }
            return '&nbsp;';
        });
        self.SelectedSubjectName = ko.computed(function () {
            let subjectID = focusArgs.subjectID();
            let subjects = self.Subjects();
            if (subjects) {
                var item = subjects.find(function (x) { return x.ID() === subjectID });
                if (item) {
                    return item.Name();
                }
            }
            return '&nbsp;';
        });
        self.SelectedMarkPeriodName = ko.computed(function () {
            let markPeriodGU = focusArgs.markPeriodGU();
            let periods = self.MarkPeriods();
            if (periods) {
                var item = self.MarkPeriods().find(function (x) { return x.GU() === markPeriodGU });
                if (item) {
                    return item.Name();
                }
            }
            return '&nbsp;';
        });

        self.IsSubjectsView = ko.computed(function () {
            return focusArgs.viewName() === 'subject';
        });
        self.IsAssignmentView = ko.computed(function () {
            return focusArgs.viewName() === 'assignment';
        });
        self.IsStandardView = ko.computed(function () {
            return focusArgs.viewName() === 'standard';
        });
        self.IsCourseContentView = ko.computed(function () {
            return focusArgs.viewName() === 'courseContent';
        });
        self.IsPostView = ko.computed(function () {
            return focusArgs.viewName() === 'post';
        });

        self.hasSubjects = ko.computed(function () {
            return self.Subjects() && self.Subjects().length > 0
        });

        self.hasStandardSubjects = ko.computed(function () {
            return self.StandardSubjects() && self.StandardSubjects().length > 0;
        });

        self.hasClasses = ko.computed(function () {
            return self.Classes() && self.Classes().length > 0
        });

        self.ClassesVisible = ko.computed(function () {
            if (self.hasSubjects() === true) { return false; }
            return self.Classes().length > 1;
        });

        self.MarkPeriodsVisible = ko.computed(function () {
            if (self.IsCourseContentView() === true && self.hasSubjects() === true) { return false; }
            var markPeriods = self.MarkPeriods();
            return markPeriods && markPeriods.length > 1;
        });
        self.SchoolsVisible = ko.computed(function () {
            var schools = self.Schools();
            return schools && schools.length > 1;
        });
        self.GradingPeriodsVisible = ko.computed(function () {
            if (self.IsCourseContentView() === true && self.hasSubjects() === true) { return false; }
            var gradingPeriods = self.GradingPeriods();
            return gradingPeriods && gradingPeriods.length > 1;
        });

        self.IsSubjectsViewDisabled = PXP.HideElementarySubjectSummary === true;

        self.IsSubjectsViewLinkVisible = ko.pureComputed(function () {
            return self.IsSubjectsViewDisabled === false && self.IsSubjectsView() === false && self.hasSubjects();
        });

        self.IsAssignmentViewLinkVisible = ko.pureComputed(function () {
            return self.IsAssignmentView() === false;
        });

        self.IsStandardsViewLinkVisible = ko.computed(function () {
            return self.IsStandardView() === false && self.IsStandardsAvailable();
        });

        self.IsPostViewLinkVisible = ko.pureComputed(function () {
            return self.IsPostView() === false && self.IsPostsViewLinkAvailable() && self.IsCurriculumModuleEnabled();
        });

        self.IsCourseContentViewLinkVisible = ko.computed(function () {
            //look at the class object to see what control it should render with
            let classID = focusArgs.classID();
            let classes = self.Classes();
            let classDetailControl = '';
            if (classes) {
                var item = self.Classes().find(function (x) { return x.ID() === classID });
                if (item) {
                    classDetailControl = item.ClassDetailControl();
                }
            }
            return self.IsCourseContentView() === false && classDetailControl === 'Gradebook_RichContentClassDetails';  // or we have no subjects and classes (only course content no assignments)
        });

        self.SubjectsVisible = ko.computed(function () {
            let ccView = self.IsCourseContentView();
            let subView = self.IsSubjectsView();
            let stdView = self.IsStandardView();
            let hasSub = self.hasSubjects();
            if (ccView === true || subView === true || stdView === true) { return false; }
            return hasSub;
        });

        self.StandardSubjectsVisible = ko.computed(function () {
            let stdView = self.IsStandardView();
            let hasSub = self.hasStandardSubjects();
            if (stdView === true && hasSub) { return true; }
            return false;
        });

        self.isViewCourseContentEleVisible = ko.pureComputed(function () {
            return self.CanShowCourseContent();
        });

        self.GoToGradebook = function () {
            window.location.href = "PXP2_Gradebook.aspx?AGU=" + PXP.AGU + "&studentGU=" + self.studentGU() + "&gradePeriodGU=" + focusArgs.gradePeriodGU();
        };

        self.ToggleGradingPeriodDropdown = function (ev) {
            $('.GradeperiodDropdown').addClass('open'); // Opens the dropdown\
            ev.cancelBubble = true;
            if (ev.stopPropagation) {
                ev.stopPropagation();
            }
        };

        self.GetFocusClassInfo = function () {
            return PXPCallWebMethod('GradebookFocusClassInfo', {
                request: {
                    gradingPeriodGU: focusArgs.gradePeriodGU(),
                    AGU: focusArgs.AGU(),
                    orgYearGU: focusArgs.OrgYearGU(),
                    schoolID: focusArgs.schoolID(),
                    markPeriodGU: focusArgs.markPeriodGU()
                }
            }).done(function (response) {
                // take care of loading class stuff
                ko.mapping.fromJS(response.Classes, {}, self.Classes);
                ko.mapping.fromJS(response.Subjects, {}, self.Subjects);
                ko.mapping.fromJS(response.StandardSubjects, {}, self.StandardSubjects);
            });
        };

        self.ChangeSchool = function (sch) {
            var schObj = self.Schools().find(function (x) { return x.SchoolID() === sch; });
            if (schObj) {
                self.GradingPeriods(schObj.GradingPeriods());
                var gpObj = self.GradingPeriods().find(function (x) { return x.GU() === focusArgs.gradePeriodGU() });
                if (!gpObj && !self.waitToUpdateGPAfterSchoolIdSet) {
                    let defaultGP = self.GradingPeriods()[0];
                    var defaultObj = self.GradingPeriods().find(function (x) { return x.defaultFocus() });
                    if (defaultObj) { defaultGP = defaultObj; }
                    if (defaultGP) { focusArgs.gradePeriodGU(defaultGP.GU()); }
                }
            }
        };

        self.ChangeGradingPeriod = function (gp) {
            var gpObj = self.GradingPeriods().find(function (x) { return x.GU() === gp; });
            if (gpObj) {
                self.MarkPeriods(gpObj.MarkPeriods());
                //set current mark to first option.
                let firstMark = self.MarkPeriods()[0];
                if (firstMark) {
                    focusArgs.markPeriodGU(firstMark.GU());
                }
                self.GetFocusClassInfo().done(function (response) {
                    //set current class to first option of not in the list
                    var clsObj = self.Classes().find(function (x) { return x.ID() === focusArgs.classID() });
                    if (!clsObj) {
                        let firstClass = self.Classes()[0];
                        if (firstClass) {
                            focusArgs.classID(firstClass.ID());
                        }
                    }
                });
            }
        }

        self.ChangeMarkPeriod = function (mp) {
            console.warn('self.ChangeMarkPeriod', mp);
        }

        self.LoadSubjectsView = function () {
            self.SetViewName('subject');
        };
        self.LoadAssignmentView = function () {
            self.SetViewName('assignment');
        };
        self.LoadStandardView = function () {
            self.SetViewName('standard');
        };
        self.LoadCourseContentGradeBook = function () {
            self.SetViewName('courseContent');
        };
        self.LoadPostView = function () {
            self.SetViewName('post');
        };


        self.viewCourseContentEle = function () {
            self.LoadCourseContentGradeBook();
        };

        self.toolbarConfig =
        {
            onInitialized: function (e) {
                self.toolbarControl = e.component;
            },
            visible: self.IsVisible,
            items: [
                {
                    location: 'before',
                    locateInMenu: 'never',
                    widget: 'dxButton',
                    visible: self.ClassesVisible,
                    options: {
                        text: 'All Classes',
                        elementAttr: { class: 'hide-for-print' },
                        onClick: self.GoToGradebook,
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.SchoolsVisible,
                    options: {
                        width: "auto",
                        items: self.Schools,
                        valueExpr: "SchoolID",
                        displayExpr: "SchoolName",
                        value: focusArgs.schoolID,
                        onValueChanged: function (args) {
                            self.ChangeSchool(args.value);
                        }
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.GradingPeriodsVisible,
                    options: {
                        width: "auto",
                        items: self.GradingPeriods,
                        valueExpr: "GU",
                        displayExpr: "Name",
                        value: focusArgs.gradePeriodGU,
                        onValueChanged: function (args) {
                            self.ChangeGradingPeriod(args.value);
                        }
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.ClassesVisible,
                    options: {
                        width: "auto",
                        items: self.Classes,
                        valueExpr: "ID",
                        displayExpr: "Name",
                        value: focusArgs.classID,
                        onValueChanged: function (args) {
                        }
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.SubjectsVisible,
                    options: {
                        width: "auto",
                        items: self.Subjects,
                        valueExpr: "ID",
                        displayExpr: "Name",
                        value: focusArgs.subjectID,
                        onValueChanged: function (args) {
                        }
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.StandardSubjectsVisible,
                    options: {
                        width: "auto",
                        items: self.StandardSubjects,
                        valueExpr: "ID",
                        displayExpr: "Name",
                        value: focusArgs.subjectID,
                        onValueChanged: function (args) {
                        }
                    }
                }, {
                    location: 'before',
                    widget: 'dxSelectBox',
                    locateInMenu: 'auto',
                    visible: self.MarkPeriodsVisible,
                    options: {
                        width: "auto",
                        items: self.MarkPeriods,
                        valueExpr: "GU",
                        displayExpr: "Name",
                        value: focusArgs.markPeriodGU,
                        onValueChanged: function (args) {
                            self.ChangeMarkPeriod(args.value)
                        }
                    }
                }, {
                    location: 'after',
                    locateInMenu: 'auto',
                    widget: 'dxButtonGroup',
                    options: {
                        onInitialized: function (e) {
                            self.buttonGroupControl = e.component;
                        },
                        stylingMode: 'text',
                        items: [
                            {
                                text: 'Subjects View',
                                visible: self.IsSubjectsViewLinkVisible,
                                clickValue: self.LoadSubjectsView,
                                elementAttr: { class: 'link gb-view-selection' }
                            },
                            {
                                text: 'Subjects View',
                                visible: self.IsSubjectsView,
                                elementAttr: { class: 'gb-view-selection' }
                            },
                            {
                                text: 'Assignment View',
                                visible: self.IsAssignmentViewLinkVisible,
                                clickValue: self.LoadAssignmentView,
                                elementAttr: { class: 'link gb-view-selection' }
                            },
                            {
                                text: 'Assignment View',
                                visible: self.IsAssignmentView,
                                elementAttr: { class: 'gb-view-selection' }
                            },
                            {
                                text: 'Standards View',
                                visible: self.IsStandardsViewLinkVisible,
                                clickValue: self.LoadStandardView,
                                elementAttr: { class: 'link gb-view-selection' }
                            },
                            {
                                text: "Standards View",
                                visible: self.IsStandardView,
                                elementAttr: { class: 'gb-view-selection' }
                            },
                            {
                                text: "Course Content View",
                                visible: self.IsCourseContentViewLinkVisible,
                                clickValue: self.LoadCourseContentGradeBook,
                                elementAttr: { class: 'link gb-view-selection' }
                            },
                            {
                                text: "Course Content View",
                                visible: self.IsCourseContentView,
                                elementAttr: { class: 'gb-view-selection' }
                            },
                            {
                                text: "Posts View",
                                visible: self.IsPostViewLinkVisible,
                                clickValue: self.LoadPostView,
                                elementAttr: { class: 'link gb-view-selection' }
                            },
                            {
                                text: "Posts View",
                                visible: self.IsPostView,
                                elementAttr: { class: 'gb-view-selection' }
                            }
                        ],
                        onItemClick: function (e) {
                            if (e.itemData.clickValue) {
                                e.itemData.clickValue();
                            }
                        }
                    }
                }]
        };


    }
});

$.extend(Namespace('PXP.Actions.GB'), {
    LoadControl: function (ev) {
        var args = $(this).data('focus');
        PXP.GBFocus.InLoadControl += 1;
        let newArgs = PXP.GBFocus.GetArguments(args.FocusArgs);
        PXP.GBFocus.LoadControl(args.LoadParams, newArgs, true);
        PXP.GBFocus.InLoadControl -= 1;
        ev.stopPropagation();
    },

    GetResource: function (ev) {
        window.open($(this).attr('href'));
    },

    initAssignmentsGridForMobile: function (e) {
        if (e && e.component && e.component.option) {
            if (PXP.IsMobile || window.outerWidth <= 1024) {
                try {
                    e.component.option().columnHidingEnabled = true;
                } catch (e) {
                    // don't throw if we are unable to set the option on the data grid
                }
            }
        }
    },

    initStandardsGridForMobile: function (e) {
        if (e && e.component && e.component.option) {
            if (PXP.IsMobile || window.outerWidth <= 1024) {
                try {
                    e.component.option().columnChooser.enabled = true;
                    e.component.option().columnChooser.mode = 'select';
                    // auto hide these two columns
                    e.component.columnOption('Notes', 'visible', false);
                    e.component.columnOption('Performance Indicator', 'visible', false);
                } catch (e) {
                    // don't throw if we are unable to set the option on the data grid
                }
            }
        }
    },

    onGBClassDetailsLoad: function (e) {
        if (PXP.Actions.GB.AssignmentsGridWhatIfCalcObject) {
            PXP.Actions.GB.AssignmentsGridWhatIfCalcObject.reloadClassData().done(function () {
                //get the text translation object
                const tran = PXP.GBWI_Translation;
                if (tran === undefined) throw 'unable to locate translation object';
                let AssignmentsGrid = $('#AssignmentsGrid').dxDataGrid("instance");
                if (AssignmentsGrid) {
                    AssignmentsGrid.option('masterDetail.enabled', true);
                }
                setTimeout(function () {
                    $("#AssignmentsGrid .dx-datagrid-group-closed").attr('title', tran.gridTooltip);
                }, 500);
                $whatIfMaxButtonContainer = $('#what-if-max-score');
                $('<div>')
                    .dxButton({
                        text: tran.calcButton,
                        type: 'default',
                        onClick: function (e) {
                            PXP.Actions.GB.ApplyMaxValueToAllUngradedAssignments();
                        }
                    })
                    .appendTo($whatIfMaxButtonContainer);
                $('<div>')
                    .text(tran.calcText)
                    .appendTo($whatIfMaxButtonContainer);
            });
        }

        PXP.Actions.GB.initAssignmentsGridForMobile(e);
    },

    ApplyMaxValueToAllUngradedAssignments: function () {
        //get the calc object
        const calcs = PXP.Actions.GB.AssignmentsGridWhatIfCalcObject;
        const classGrade = calcs.classGrades()[0];
        calcs.assignments().forEach(function (asgnGrade) {
            if (asgnGrade.score() === null || asgnGrade.score() === "") {
                let maxScore = asgnGrade.maxScore();
                PXP.Actions.GB.AssignmentsGridUpdateGrade(asgnGrade, classGrade, maxScore, calcs);
            }

        });

    },

    AssignmentsGridWhatIfCalcObject: null,

    AssignmentsGridSetWhatIfDetailObject: function (calcs) {
        PXP.Actions.GB.AssignmentsGridWhatIfCalcObject = calcs;
    },

    AssignmentsGridUpdateGrade: function (asgnGrade, classGrade, newValue, calcs) {
        asgnGrade.score(newValue.toString());
        asgnGrade.scoreDataChanged();
        $whatIfContainer = $('.gradebook-what-if-container');
        $whatIfContainer.find('.mark').text(classGrade.calculatedMark());
        $whatIfContainer.find('.percentage').text(calcs.helpers.markValue(classGrade.weightedPercentage()) + '%');
        $bigWhatIfContainer = $('#what-if-grade');
        $bigWhatIfContainer.show();
        $bigWhatIfContainer.find('.mark').text(classGrade.calculatedMark());
        $bigWhatIfContainer.find('.score').text(calcs.helpers.markValue(classGrade.weightedPercentage()) + '%');
    },

    AssignmentsGridTemplateFunction: function (container, options) {

        //get the text translation object
        const tran = PXP.GBWI_Translation;
        //get the calc object
        const calcs = PXP.Actions.GB.AssignmentsGridWhatIfCalcObject;
        if (calcs === null) { throw 'unable to locate calcs object required for what if'; };
        console.log(ko.toJS(calcs));

        const currentRowData = options.data;
        const gradeBookId = currentRowData.gradeBookId;
        const studentId = currentRowData.studentId;

        const classGrade = calcs.classGradeLookup(studentId);
        if (classGrade === null) { throw 'unable to locate class grade object required for what if'; }
        console.log(ko.toJS(classGrade));

        const asgnGrade = calcs.assignmentGradeLookup(studentId, gradeBookId);
        if (asgnGrade === null) { throw 'unable to locate assignment grade object required for what if'; }
        console.log(ko.toJS(asgnGrade));


        let $wrapper = $('<div class="gradebook-what-if-container"><div class="row"></div></div>')
            .appendTo(container);
        let $wrapperRow = $wrapper.find(".row");

        let $asgnWrapper = $('<div class="col-md-4"></div>')
            .html('<div class="what-if-text">' + tran.youScoreText + '</div>')
            .appendTo($wrapperRow);

        let $asgn = $('<div>')
            .addClass('asgn-score what-if-score')
            .appendTo($asgnWrapper);

        let $drop = $('<div>')
            .addClass('asgn-score what-if-dropped')
            .appendTo($asgnWrapper);

        let $markWrapper = $('<div class="col-md-4"></div>')
            .html('<div class="what-if-text">' + tran.classGradeText + '</div>')
            .appendTo($wrapperRow);

        $('<div>')
            .addClass('mark what-if-score')
            .text(classGrade.calculatedMark())
            .appendTo($markWrapper);

        let $percentageWrapper = $('<div class="col-md-4"></div>')
            .html('<div class="what-if-text">' + tran.percentageText + '</div>')
            .appendTo($wrapperRow);

        $('<div>')
            .addClass('percentage what-if-score')
            .text(calcs.helpers.markValue(classGrade.weightedPercentage()) + '%')
            .appendTo($percentageWrapper);


        const gbScoreType = asgnGrade.gradeBookScoreType();
        console.log(gbScoreType);
        if (gbScoreType === null) { throw 'unable to locate score type object required for what if'; }

        const scoreText = ko.computed(function () {
            let s = asgnGrade.score();
            let returnValue = s;
            if (s === null || s === '') {
                returnValue = 'N/A';
            }
            let ds = asgnGrade.dropScoreText();
            $asgn.text(returnValue);
            $drop.text(ds);
            return returnValue;
        });

        let scoreValue = ko.computed(function () {
            let s = asgnGrade.score();
            if (isNaN(s)) {
                return s;
            } else {
                return parseFloat(s);
            }
        });

        let originalScoreValue = ko.computed(function () {
            const os = asgnGrade.originalScore();
            if (os === null || isNaN(os)) {
                return '';
            } else {
                return parseFloat(os);
            }
        });

        let stMin = 0;
        let stMax = 0;
        let step = 1;
        const stid = gbScoreType.id();
        let useSlider = true;
        if (stid === 1) {
            //percentage
            stMax = 100;
            step = .1;
        } else if (stid === 2) {
            //raw score
            stMax = asgnGrade.maxValue();
        } else {
            //some other type, use radio group
            useSlider = false;
        }
        let $controlContainer = $('<div class="text-row row"><div class="col-md-10"><span class="info-text">' + tran.changeGradeText + '</span></div><div class="button-container col-md-2"></div></div><div class="control-container-row row"><div class="control-container col-md-12"></div></div>')
            .appendTo($wrapper);

        if (useSlider === true) {
            let slider = $('<div>')
                .addClass('gradebook-what-if-slider')
                .dxSlider({
                    min: stMin,
                    max: stMax,
                    step: step,
                    value: scoreValue(),
                    label: {
                        visible: true,
                        format: function (value) {
                            return value.toString();
                        },
                        position: "top"
                    },
                    onValueChanged: function (e) {
                        var newValue = e.value;
                        PXP.Actions.GB.AssignmentsGridUpdateGrade(asgnGrade, classGrade, newValue, calcs);
                    }
                })
                .appendTo($controlContainer.find(".control-container"))
                .dxSlider("instance");

            $('<div>')
                .dxButton({
                    text: tran.resetButtonText,
                    type: 'default',
                    onClick: function (e) {
                        PXP.Actions.GB.AssignmentsGridUpdateGrade(asgnGrade, classGrade, originalScoreValue(), calcs);
                    }
                })
                .appendTo($controlContainer.find(".button-container"));

            scoreValue.subscribe(function (val) {
                if (isNaN(val)) {
                    val = '';
                }
                slider.option("value", val);
            });

        } else {
            var radioGroup = $('<div>')
                .addClass('gradebook-what-if-group')
                .dxRadioGroup({
                    items: gbScoreType.details(),
                    layout: "horizontal",
                    itemTemplate: function (itemData, _, itemElement) {
                        itemElement
                            .parent().addClass('score-item')
                            .text(itemData.score());
                    },
                    onValueChanged: function (e) {
                        let score = '';
                        if (e.value) {
                            score = e.value.score();
                        }
                        PXP.Actions.GB.AssignmentsGridUpdateGrade(asgnGrade, classGrade, score, calcs);
                    }
                })
                .appendTo($controlContainer.find(".control-container"))
                .dxRadioGroup("instance");

            let setScore = function (val) {
                let currentScore = null;
                const stDetail = DevExpress.data.query(gbScoreType.details())
                    .filter([['score', '=', val]])
                    .toArray();
                if (stDetail.length > 0) {
                    currentScore = stDetail[0];
                }
                radioGroup.option("value", currentScore);
                console.log('radio setScore->');
                console.log(currentScore);
            };

            //call setScore now to set the current value of the radio buttons
            setScore(scoreValue());
            //also listen for changes and update the
            scoreValue.subscribe(function (val) {
                setScore(val);
            });

            $('<div>')
                .dxButton({
                    text: tran.resetButtonText,
                    type: 'default',
                    onClick: function (e) {
                        setScore(originalScoreValue());
                    }
                })
                .appendTo($controlContainer.find(".button-container"));

        }

    },

    OnRowPreparedStandardsGrid: function (e) {
        if (e && e.rowType && e.rowType === 'data') {
            // display performance bar
            var performanceValue = parseInt(e.data['CalcValue']) || 0;
            var performanceColor = e.data['Color'];
            var performanceText = e.data['PerformanceText'];
            var performanceImageBase = PXP.ImageRoot;
            var pb = e.rowElement.find('.gb-performance-placeholder');
            if (pb.length > 0 && performanceValue >= 0) {
                var indicator = $('<table style="width:275px" width="275" cellpadding="5" cellspacing="0" border="0"><tr><td width="175" style="width:175px;border:none;" valign="middle"><div class="gb-performance-indicator" style="height:20px;width:175px;"></div></td><td width="100" style="width:px;border:none;white-space:nowrap;" valign="middle">' + performanceText + '</td></tr></table>');
                var bar = indicator.find('.gb-performance-indicator');
                bar.progressbar({ height: 20, value: performanceValue });
                bar.find('div').css('background', performanceColor + ' url(' + performanceImageBase + 'jqui-bg_gloss-wave_50_trans_500x100.png) repeat-x scroll 50% 50%').css('border-color', '#ccc');
                bar.css('border-color', '#ccc');
                pb.append(indicator);
            }
            // fix styling for assignments and standards
            if (e.data['RowCss']) {
                e.rowElement.addClass(e.data['RowCss']);
            }
        }
    },

    StandardsCollapseAll: function () {
        PXP.Actions.GB.initStandardsGridForMobile(this);
        PXP.Actions.GB.StandardsAreExpanded = false;
        $("#StandardsGrid").dxDataGrid("filter", [
            ["RowType", "=", "standard"]
        ]);
        PXP.Actions.GB.StandardsFilter = {};
    },

    StandardsExpandAll: function () {
        if (PXP.Actions.GB.StandardsAreExpanded) {
            $("#StandardsGrid").dxDataGrid("filter", [
                ["RowType", "=", "standard"]
            ]);
        } else {
            $("#StandardsGrid").dxDataGrid("clearFilter");
        }
        PXP.Actions.GB.StandardsAreExpanded = !PXP.Actions.GB.StandardsAreExpanded;
        PXP.Actions.GB.StandardsFilter = {};
    },

    StandardsExpandOne: function (parentID) {
        PXP.Actions.GB.initStandardsGridForMobile(this);
        PXP.Actions.GB.StandardsFilter = {};
        PXP.Actions.GB.StandardsFilter[parentID] = true;
        var filter = [];
        filter.push(["RowType", "=", "standard"]);
        for (var f in PXP.Actions.GB.StandardsFilter) {
            if (PXP.Actions.GB.StandardsFilter[f] === true) {
                filter.push("or");
                filter.push(["ParentID", "=", parentID]);
            }
        }

        $("#StandardsGrid").dxDataGrid("filter", filter);
        PXP.Actions.GB.StandardsAreExpanded = false;
    },

    StandardsToggleOne: function () {
        var parentID = $(this).data('parentid');
        PXP.Actions.GB.StandardsFilter = PXP.Actions.GB.StandardsFilter || {};
        PXP.Actions.GB.StandardsFilter[parentID] = !PXP.Actions.GB.StandardsFilter[parentID];
        var filter = [];
        filter.push(["RowType", "=", "standard"]);
        for (var f in PXP.Actions.GB.StandardsFilter) {
            if (PXP.Actions.GB.StandardsFilter[f] === true) {
                filter.push("or");
                filter.push(["ParentID", "=", parentID]);
            }
        }

        $("#StandardsGrid").dxDataGrid("filter", filter);
    },

    ShowAssignmentDetailsHome: function (ev) {
        //Gradebook_AssignmentDetails  - control to load
        var loadControlArgs = $(this).data('focus');
        var args = PXP.GBFocus.GetArguments(loadControlArgs.FocusArgs);

        $('#MainDiv').children().addClass('hide');

        var $item = $(ich['PXP.StackItem']()).appendTo($('#MainDiv'));
        $item.slideDown();

        // send the request
        PXPCallWebMethod('LoadControl',
            {
                request: {
                    control: ko.unwrap(loadControlArgs.LoadParams.ControlName),
                    parameters: args
                }
            })
            .done(function (response) {
                $item.empty()
                    .append($('<h1><a data-action="GB.CloseAssignmentDetailsHome">HOME</a></h1>'))
                    .append('<div>' + response.html + '</div>');
            })
            .fail(function (response) {
                $item.empty();
            });

        ev.stopPropagation();
    },
    CloseAssignmentDetailsHome: function (ev) {
        // show calendar again
        $('#MainDiv').children('.content-stack-item').remove();
        $('#MainDiv').children().removeClass('hide');
    },
    ShowAssignmentDetailsCalendar: function (ev) {
        //Gradebook_AssignmentDetails  - control to load
        var hrefArgs = PXP.GetArguments(this.getAttribute('href'));
        var localArgs = {
            AGU: hrefArgs.AGU,
            OrgYearGU: hrefArgs.OY,
            assignmentID: hrefArgs.DGU,
            gradePeriodGU: hrefArgs.GP
        }
        var args = PXP.GBFocus.GetArguments(localArgs);

        // hide the calendar stack so we can display it when they close the assignment...

        // Add the new dom element (loading) to the stack and show it
        var $stack = $(this).closest('.content-stack');
        var $items = $('#PXPCalendarContent');
        //var $items = $stack.children('.content-stack-item');
        var $breadcrumb = $items.find('h1');
        $items.addClass('hide');
        //$items.remove();
        var $item = $(ich['PXP.StackItem']()).appendTo($stack);
        $item.slideDown();

        // send the request
        PXPCallWebMethod('LoadControl',
            {
                request: {
                    control: 'Gradebook_AssignmentDetails',
                    parameters: args
                }
            })
            .done(function (response) {
                $item.empty()
                    .append($breadcrumb.clone().html('<a data-action="GB.CloseAssignmentDetailsCalendar">' + $breadcrumb.text() + '</a>'))
                    .append('<div>' + response.html + '</div>');
                // update breadcrumb
                var $h = $item.find('.breadcrumb-header');
                var $header = $h.parent('h1,h2').first();
                $header.toggle(false);
            })
            .fail(function (response) {
                $item.empty();
            });

        ev.stopPropagation();
    },
    CloseAssignmentDetailsCalendar: function (ev) {
        // show calendar again
        var $stack = $(this).closest('.content-stack');
        var $items = $stack.children('.content-stack-item').not('#PXPCalendarContent');
        $items.remove();
        $('#PXPCalendarContent').removeClass('hide');
    },


    ToggleChevron: function ($tr) {
        var $icon = $tr.find('.glyphicon').first();
        if ($icon.hasClass('glyphicon-chevron-right')) {
            $icon.removeClass('glyphicon-chevron-right');
            $icon.addClass('glyphicon-chevron-down');
        } else {
            $icon.removeClass('glyphicon-chevron-down');
            $icon.addClass('glyphicon-chevron-right');
        }
    },

    ShowMoreClassInfo: function (ev) {
        var $tr = $(this).closest('.gb-class-row');
        PXP.Actions.GB.ToggleChevron($tr);

        $tr.toggleClass('show-details')
            .siblings()
            .removeClass('show-details')
            .find('.glyphicon:first')
            .removeClass('glyphicon-chevron-down')
            .addClass('glyphicon-chevron-right');

        $tr.next('.gb-class-row').toggleClass('show-details', $tr.hasClass('show-details'));

        ev.stopPropagation();
    },

    GetSelectedClass: function () {
        var $current = $('.gradebook-class-selector').find('.current .class-item-info');
        return parseInt($current.attr('data-class-id')) || -1;
    },
    GetSelectedSchool: function () {
        var $current = $('.gradebook-class-selector').find('.current .class-item-info');
        return parseInt($current.attr('data-school-id')) || -1;
    },

    SetTermChooser: function (periods) {
        // loop through periods and select the right value for each term selector based on school and groupname
        for (var gradingPeriodGU in periods) {
            var period = periods[gradingPeriodGU];
            if (period) {
                var $item = $('.update-panel[data-school-id="' + period.schoolID + '"][data-period-group="' + period.GroupName + '"]');
                $current = $item.find('.term-selector').find('.current.breadcrumb-term');
                if ($current.attr('data-period-id') !== gradingPeriodGU) {
                    $selected = $('.term-selector').find('[data-period-id="' + gradingPeriodGU + '"]');
                    if ($selected.length > 0) {
                        $current.empty();
                        $current.append($selected.html());
                        $current.attr('data-period-id', gradingPeriodGU);
                    }
                }
            }
        }
    },
    GetSelectedTerm: function () {
        var $current = $('.term-selector').find('.current.breadcrumb-term');
        return $current.attr('data-period-id') || -1;
    },

    ShowAssignmentDetails: function (ev) {
        //Gradebook_AssignmentDetails  - control to load
        var $current = $(this);
        args = {
            SCHID: PXP.Actions.GB.GetSelectedSchool(),
            CSID: PXP.Actions.GB.GetSelectedClass(),
            PDID: PXP.Actions.GB.GetSelectedTerm(),
            DGU: $current.attr('data-assignment-id') || -1, // assignmentID
            AGU: PXP.AGU
        };

        // Add the new dom element (loading) to the stack and show it
        var $stack = $(this).closest('.content-stack');
        var $items = $stack.children('.content-stack-item');
        $items.remove();
        var $item = $(ich['PXP.StackItem']()).appendTo($stack);
        $item.slideDown();

        // send the request
        PXPCallWebMethod('LoadControl', {
            request: {
                control: 'Gradebook_AssignmentDetails',
                parameters: args
            }
        })
            .done(function (response) {
                $item.empty()
                    .append('<div>' + response.html + '</div>');
                // update breadcrumb
                var $h = $item.find('.breadcrumb-header');
                var $header = $h.parent('h1,h2').first();
                $header.toggle(false);
                $h.data('stack-text', $h.children('span').not('.sr-only').first().text() || $h.text());
                var $breadCrumb = $('.content-stack').first().find('.breadcrumb-text').first();
                var attrs = {};
                $.each($('.gradebook-class-selector .current .class-item-info')[0].attributes, function (idx, attr) {
                    attrs[attr.nodeName] = attr.nodeValue;
                });
                var $link = $('<a></a>', attrs).addClass('breadcrumb-text').removeClass('class-item-info').html($breadCrumb.html());
                $breadCrumb.html($link);
                $breadCrumb.append(' / ' + $h.data('stack-text'));
            })
            .fail(function (response) {
                $item.empty();
            });

        ev.stopPropagation();
    },

    CloseAssignmentDetails: function (ev) {
        $('#assignment-details-panel').slideUp();
        $('#class-details').slideDown();
    },

    ToggleAssignmentDetails: function (ev) {
        var $tr = $(this).closest('tr');
        var guid = $tr.attr('data-guid');

        if ($tr.next().attr('data-guid') !== guid) {
            var $container = $tr.closest('#assignment-details');
            $container.find('tr[data-guid="' + guid + '"]').not($tr).each(function () {
                ich['PXP.GB.AssignmentDetailRow']({
                    guid: guid
                }).insertAfter($tr);
            });
        }

        clearTimeout($tr[0].showDetailTimeout);
        $tr[0].showDetailTimeout = setTimeout(function () {
            $tr.toggleClass('show-details')
                .siblings()
                .removeClass('show-details');

            $tr.next('tr').toggleClass('show-details', $tr.hasClass('show-details'));
        }, 0);

        ev.stopPropagation();
    },

    SetTerm: function (ev) {
        var $current = $(this);

        var args = {
            schoolID: $current.closest('[data-school-id]').attr('data-school-id') || -1, // schoolID
            OrgYearGU: $current.closest('[data-orgyear-id]').attr('data-orgyear-id') || -1, // orgYear
            gradePeriodGU: $current.attr('data-period-id') || -1, // gradingPeriodID
            GradingPeriodGroup: $current.attr('data-period-group') || '',
            AGU: PXP.AGU
        };

        var getArgs = function () { return args };

        // send the request
        PXPCallWebMethod('LoadControl', {
            request: {
                control: 'Gradebook_SchoolClasses',
                parameters: args
            }
        })
            .done(function (response) {//data-period-group
                var $item = $('.update-panel[data-school-id="' + getArgs().schoolID + '"][data-period-group="' + getArgs().GradingPeriodGroup + '"]');
                var $newitem = $(response.html);
                $item.empty().append($newitem.children());
                $item.initClasses();
            })
            .fail(function (response) {
                $item.empty();
            });
        ev.stopPropagation();
        ev.preventDefault();
    },
});

$(document).ready(function () {
    $('.teacher-photo').toggle(PXP.ShowTeacherPhotos);

    // Initialize all of the detail rows for classes
    $('#gb-classes').initClasses();

    PXP.GBFocus.Init(PXP.GBCurrentFocus);
    PXP.GBFocus.Load(PXP.GBFocusData);

    // sync the termSelector with the focus
    if (PXP.GBInitialGradingPeriods) {
        PXP.Actions.GB.SetTermChooser(PXP.GBInitialGradingPeriods);
    }

    $(document).on('keydown', '.dx-datagrid', function (ev) {
        var code = (ev.keyCode ? ev.keyCode : ev.which);
        if (code === ST.KeyCodes.ENTER && ev.target.tagName.toLocaleLowerCase() === 'input' && $(ev.target).parents('.dx-datagrid-search-panel').length) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
        }
    });

    $(document).on('click', '#category-graph > div span.category-graph-icon', function (ev) {
        let spanTag = $(ev.target).parent()
        if (spanTag.find('i').hasClass('fa-chart-bar')) {
            $('#category-graph > div > span.category-graph-icon i.fa-chart-bar').parent().addClass('selected');
            $('#category-graph > div > span.category-graph-icon i.fa-border-all').parent().removeClass('selected');
            $('.CategoryWeightsGrid').addClass('hidden');
            $('.CategoryWeights').removeClass('hidden');
        } else {
            $('#category-graph > div > span.category-graph-icon i.fa-chart-bar').parent().removeClass('selected');
            $('#category-graph > div > span.category-graph-icon i.fa-border-all').parent().addClass('selected');
            $('.CategoryWeightsGrid').removeClass('hidden');
            $('.CategoryWeights').addClass('hidden');
        }
    });

    // Initialize the messages table
    $('#gb-messages').find('.data-table').each(function () {
        var data = $(this).map(function () {
            return {
                items: $(this).find('> tbody > tr[data-guid]').map(function () {
                    return {
                        courseID: this.getAttribute('data-guid'),
                        icon: $(this.cells[0]).html(),
                        type: this.cells[1].textContent,
                        courseTitle: this.cells[2].textContent,
                        title: $(this.cells[3]).html(),
                        available: this.cells[4].textContent
                    };
                }).get()
            };
        })[0];

        $(ich['GB.MessagesTable'](data)).insertBefore(this);
    });
});

(function ($) {
    $.fn.initClassDetails = function () {
        // Load the category graph
        this.find('#category-graph').each(function () {
            var $canvas = $(this).find('.bar-graph');
            if ($canvas[0]) {
                var header = $(this).find('thead > tr')[0];
                var $tr = $(this).find('tbody > tr');

                var data = {
                    labels: $tr.map(function () {
                        return this.cells[0].textContent.trim();
                    }).get(),

                    datasets: [
                        {
                            fillColor: 'rgb(97,160,219)',
                            label: header.cells[1].textContent.trim(),
                            data: $tr.map(function () {
                                return {
                                    value: parseInt(this.cells[1].textContent) || 0
                                };
                            }).get()
                        },
                        {
                            fillColor: 'rgb(242,134,71)',
                            label: header.cells[2].textContent.trim(),
                            data: $tr.map(function () {
                                return {
                                    value: parseInt(this.cells[2].textContent) || 0
                                };
                            }).get()
                        }
                    ]
                };

                var ctx = $canvas[0].getContext("2d");
                if (ctx) {
                    this.chartData = new Chart(ctx).STGroupedBar(data, {
                        minYValue: 0,
                        maxYValue: 100,
                        stepYValue: 10,
                        scaleOptions: {
                            seriesPadding: 30,
                            xAxis: {
                                font: {
                                    size: 16
                                }
                            }
                        },
                        legendOptions: {
                            padding: 10,
                            border: 1,
                            vAlign: 'bottom',
                            hAlign: 'center',
                            layout: 'horizontal'
                        }
                    });

                    resizeCanvas($canvas[0]);
                }
            }
        });

        // Load the class assignment graph
        this.find('#assignment-graph').each(function () {
            var $canvas = $(this).find('.whisker-graph');
            if ($canvas[0]) {
                var header = $(this).find('thead > tr')[0];

                var data = {
                    datasets: $(this).find('tbody > tr').map(function () {
                        return {
                            label: this.cells[0].textContent.trim() + '\n' + this.cells[1].textContent.trim(),
                            values: [
                                parseInt(this.cells[3].textContent) || 0,
                                parseInt(this.cells[2].textContent) || 0,
                                parseInt(this.cells[4].textContent) || 0
                            ]
                        };
                    }).get()
                };

                var ctx = $canvas[0].getContext("2d");
                if (ctx) {
                    var whiskerData = {
                        yAxisRange: [0, 100],
                        showTooltips: true,
                        scaleOptions: {
                            topPadding: 10
                        }
                    };
                    $canvas[0].chartData = new Chart(ctx).STWhisker(data, whiskerData);

                    resizeCanvas($canvas[0]);
                }
            }
        });
    };
})(jQuery);

(function ($) {
    $.fn.initClasses = function () {
        // Initialize all of the detail rows
        return this.find('.pres-table .gb-class-row[data-guid][data-mark-gu]').each(function () {
            var crsID = this.getAttribute('data-guid');
            var markID = this.getAttribute('data-mark-gu');
            if (crsID && ($(this).next().attr('data-guid') !== crsID || markID)) {
                var markSelector = markID ? '[data-mark-gu="' + markID + '"]' : '';
                var $detailRow = $(this).closest('.update-panel')
                    .find('.gb-class-details .gb-class-row[data-guid="' + crsID + '"]' + markSelector);

                var $categoryItems = $detailRow.children().eq(1).find('tbody > tr');

                var idx = 0;
                var data = $detailRow
                    .map(function () {
                        return {
                            hasCategories: $categoryItems.length > 0,

                            courseID: crsID,
                            summaryInfo: $detailRow.find('.class-summary-info li').map(function () {
                                return {
                                    name: $(this).children('.name').text(),
                                    value: $(this).children('.value').text()
                                };
                            }).get(),

                            rowClass: function () {
                                var rowClass = 'row';
                                if (idx < 1) {
                                    rowClass = 'top-row';
                                }
                                else if (idx < 3) {
                                    rowClass = 'secondary-row';
                                }

                                return rowClass;
                            }
                        };
                    })[0];

                data = data || {};
                data.showClassGrades = PXP.ShowClassGrades;
                var $summary = $(ich['GB.ClassSummaryRow'](data));
                $summary.insertAfter(this);

                // Initialize the category graph
                var $canvas = $summary.find('canvas.student-categories');
                var ctx = $canvas[0] && $canvas[0].getContext('2d');
                var chart = ctx && new Chart(ctx);
                if (chart) {
                    data = {
                        labels: $categoryItems.map(function () {
                            return this.cells[0].textContent.trim();
                        }).get(),

                        datasets: [
                            {
                                label: 'Score',
                                fillColor: '#00aa00',
                                data: $categoryItems.map(function () {
                                    return parseInt(this.cells[3].textContent) || 0;
                                }).get()
                            },
                            {
                                label: '% of Grade',
                                fillColor: '#888888',
                                data: $categoryItems.map(function () {
                                    return parseInt(this.cells[1].textContent) || 0;
                                }).get()
                            }
                        ]
                    };

                    chart.STHorizontalLayeredBar(data, {
                        animation: false,
                        legendLocation: 'bottom',
                        showTooltips: true,
                        yAxisMinimumInterval: 1,
                        asPercentage: true,
                        yAxisFontHeight: 15,
                        fillColors: [],
                        scaleOptions: {
                            yAxis: {
                                font: {
                                    size: 16
                                }
                            }
                        },
                    });
                }

                // Initialize the mark count ring graphs
                var markData = {
                    colors: [
                        'hsl(  0deg 50% 66%)', 'hsl( 30deg 50% 66%)', 'hsl( 60deg 50% 66%)', 'hsl( 90deg 50% 66%)',
                        'hsl(120deg 50% 66%)', 'hsl(150deg 50% 66%)', 'hsl(180deg 50% 66%)', 'hsl(210deg 50% 66%)',
                        'hsl(240deg 50% 66%)', 'hsl(270deg 50% 66%)', 'hsl(300deg 50% 66%)', 'hsl(330deg 50% 66%)',
                        'hsl(  0deg 25% 66%)', 'hsl( 30deg 25% 66%)', 'hsl( 60deg 25% 66%)', 'hsl( 90deg 25% 66%)',
                        'hsl(120deg 25% 66%)', 'hsl(150deg 25% 66%)', 'hsl(180deg 25% 66%)', 'hsl(210deg 25% 66%)',
                        'hsl(240deg 25% 66%)', 'hsl(270deg 25% 66%)', 'hsl(300deg 25% 66%)', 'hsl(330deg 25% 66%)',
                    ],
                    values: {}
                };

                $detailRow.children('ul')
                    .last()
                    .children('li')
                    .each(function () {
                        var mark = $(this).children('.mark').text().trim();
                        var markCount = parseInt($(this).children('.mark-count').text().trim()) || 0;
                        markData.values[mark] = markCount;
                    });

                if (markData.values.HIDE || Object.keys(markData.values || {}).length === 0) {
                    $summary.find('h3.mark-counts').toggle();
                    $summary.find('canvas.mark-counts').toggle();
                } else {
                    $summary.find('canvas.mark-counts').pxpRingChart(markData);
                }

                // Initialize all of the sparklines
                $(this).find('canvas.sparkline').each(function () {
                    var ctx = this.getContext("2d");
                    if (ctx) {
                        // Generate the data array
                        var data = $(this).siblings('ul').children('li')
                            .map(function () {
                                return {
                                    label: $(this).children('.date').text(),
                                    value: parseInt($(this).children('.score').text()) || 0
                                }
                            })
                            .get();

                        // Default configuration
                        var config = {
                            yAxisMinimumInterval: 1,
                            fillColors: [
                                PXP.ChartColors.Red,
                                PXP.ChartColors.Yellow
                            ]
                        };

                        // Create the sparkline graph
                        this.chartData = new Chart(ctx).STSparkLine(data, config);
                        $(this).css('width', '');
                    }
                })
                    .each(function () {
                        resizeCanvas(this);
                    });
            }
        });
    };

    $(window).on('resize', function () {
        $('canvas')
            .each(function () {
                resizeCanvas(this);
            });


        //$('canvas.sparkline')
        //.each(function () {
        //    resizeSparkline(this);
        //});

    });
})(jQuery);