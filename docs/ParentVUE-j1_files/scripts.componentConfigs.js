﻿//this file contains common configuration objects for controls
define(['jquery', 'app'], function ($, app) {
    const grid = {
        default: function (extendedConfig) {
            const config = {
                headerFilter: { visible: false },
                filterPanel: { visible: false },
                filterRow: { visible: false },
                searchPanel: { visible: false },
                grouping: { contextMenuEnabled: false },
                groupPanel: { visible: false },
                columnChooser: { enabled: false },
                "export": { enabled: false }
            };
            return $.extend(true, config, extendedConfig);
        },

        defaultWithHeaderFilters: function (extendedConfig) {
            const config = {
                filterPanel: { visible: true },
                filterRow: { visible: true },
                searchPanel: { visible: true },
            };
            return $.extend(true, config, extendedConfig);
        }
        //if you need a common grid configuration add it here.

    };

    const fields = {
        gradeBook: {
            courseItemType: function (extendedConfig) {
                const config = {
                    dataField: 'courseItemType',
                    editorType: 'dxButtonGroup',
                    editorOptions: {
                        keyExpr: "key",
                        items: [
                            { key: 'Assignment', text: 'Assignment', type: 'default', icon: 'fa-regular fa-trophy' },
                            { key: 'Content', text: 'Content', type: 'default', icon: 'fa-regular fa-pen-to-square' }
                        ],
                        stylingMode: "outlined",

                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            unit: function (extendedConfig) {
                const config = {
                    dataField: 'unit',
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.units', {
                            dataSourceConfig: { key: 'text' }
                        }),
                        placeholder: "select or add",
                        valueExpr: 'text',
                        displayExpr: 'text',
                        acceptCustomValue: true,
                        onCustomItemCreating: function (e) {
                            e.customItem = { text: e.text };
                            var dataSource = e.component.getDataSource();
                            dataSource.store().insert(e.customItem);
                            dataSource.reload();
                            return e.customItem;
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            title: function (extendedConfig) {
                const config = {
                    dataField: 'title',
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            subject: function (extendedConfig) {
                const config = {
                    dataField: 'subjectID',
                    editorType: 'dxLookup',
                    label: { text: 'Subject' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.subjects', {
                            dataSourceConfig: { key: 'SubjectID' }
                        }),
                        valueExpr: 'SubjectID',
                        displayExpr: 'Subject'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            measureType: function (extendedConfig) {
                const config = {
                    dataField: 'measureTypeID',
                    editorType: 'dxLookup',
                    label: { text: 'Category' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.measuretypes', {
                            dataSourceConfig: { key: 'MeasureTypeID' }
                        }),
                        valueExpr: 'MeasureTypeID',
                        displayExpr: 'MeasureType'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            category: function (extendedConfig) {
                const config = {
                    dataField: 'categoryTypeID',
                    editorType: 'dxSelectBox',
                    label: { text: 'Grading Type' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.gradebookcategory', {
                            dataSourceConfig: { key: 'CategoryID' }
                        }),
                        valueExpr: 'CategoryID',
                        displayExpr: 'Category',
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            rubricGrading: function (extendedConfig) {
                var dataSourceName = 'gradebook.course.content.rubricTypesWithSecurity';
                if (extendedConfig.showAll) {
                    dataSourceName = 'gradebook.course.content.rubricTypes';
                }
                const config = {
                    dataField: 'rubricId',
                    editorType: 'dxSelectBox',
                    label: { text: 'Rubric Grading Type' },
                    editorOptions: {
                        dataSource: app.DXDataSource(dataSourceName, {
                            dataSourceConfig: { key: 'id' }
                        }),
                        valueExpr: 'id',
                        displayExpr: 'name',
                        showClearButton: true,
                        onValueChanged: (e) => {
                            if (e.value === null)
                                e.component.option("value", -1);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            scoreType: function (extendedConfig) {
                const config = {
                    dataField: 'scoreTypeID',
                    editorType: 'dxLookup',
                    label: { text: 'Score Type' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.scoretypes', {
                            dataSourceConfig: { key: 'ScoreTypeID' }
                        }),
                        valueExpr: 'ScoreTypeID',
                        displayExpr: function getDisplayExpr(item) {
                            if (!item) {
                                return "";
                            }
                            return item.ScoreType;
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            maxScore: function (extendedConfig) {
                const config = {
                    dataField: 'maxScore',
                    editorType: 'dxTextBox',
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            points: function (extendedConfig) {
                const config = {
                    dataField: 'points',
                    editorType: 'dxTextBox',
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            dueDate: function (extendedConfig) {
                const config = {
                    dataField: 'dueDate',
                    editorType: 'dxDateBox',
                    editorOptions: {
                        type: 'date'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            assignmentDate: function (extendedConfig) {
                const config = {
                    dataField: 'assignmentDate',
                    editorType: 'dxDateBox',
                    editorOptions: {
                        type: 'date'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            gradingPeriods: function (extendedConfig) {
                const config = {
                    dataField: 'gradingPeriodIds',
                    editorType: 'dxList',
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.gradingperiods', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        keyExpr: 'key',
                        editEnabled: true,
                        showSelectionControls: true,
                        selectionMode: "multiple"
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            showAssignmentInPortal: function (extendedConfig) {
                const config = {
                    dataField: 'showAssignmentInPortal',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            showAssignmentAsOfDateTime: function (extendedConfig) {
                const config = {
                    dataField: 'showAssignmentAsOfDateTime',
                    editorType: 'dxDateBox',
                    editorOptions: {
                        openOnFieldClick: true,
                        showClearButton: true,
                        type: "datetime",
                        dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss"
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            showOnlyWhenScored: function (extendedConfig) {
                const config = {
                    dataField: 'showOnlyWhenScored',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            showRubricInPortal: function (extendedConfig) {
                const config = {
                    dataField: 'showRubricInPortal',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            enableDiscussion: function (extendedConfig) {
                const config = {
                    dataField: 'enableDiscussion',
                    label: { text: 'Enable Discussion' },
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            enableSubmission: function (extendedConfig) {
                const config = {
                    dataField: 'enableSubmission',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            dropBoxOpenDate: function (extendedConfig) {
                const config = {
                    dataField: 'dropBoxOpenDate',
                    editorType: 'dxDateBox',
                    editorOptions: {
                        type: 'date'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            dropBoxCloseDate: function (extendedConfig) {
                const config = {
                    dataField: 'dropBoxCloseDate',
                    editorType: 'dxDateBox',
                    editorOptions: {
                        type: 'date'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            dropBoxDisableLateTurnIn: function (extendedConfig) {
                const config = {
                    dataField: 'dropBoxDisableLateTurnIn',
                    editorType: 'dxSwitch',
                    label: { text: 'Do Not Allow Late Submissions' }
                };
                return $.extend(true, config, extendedConfig);
            },
            analysisBand: function (extendedConfig) {
                const config = {
                    dataField: 'analysisBandId',
                    editorType: 'dxSelectBox',
                    label: { text: 'Analysis Band' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.assignment.analysisbands', {
                            dataSourceConfig: { key: 'id' }
                        }),
                        valueExpr: 'id',
                        displayExpr: 'bandName',
                        placeholder: "Use Class Configured Band",
                        showClearButton: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            expectedDuration: function (extendedConfig) {
                const config = {
                    dataField: 'expectedDuration',
                    editorType: 'dxNumberBox',
                    label: { text: 'Expected Duration (min)' },
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            instructionDays: function (extendedConfig) {
                const config = {
                    dataField: 'instructionDays',
                    editorType: 'dxNumberBox',
                    min: 0,
                    label: { text: 'Instruction Day(s)' },
                    helpText: 'used in planning and mapping',
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            otherClasses: function (extendedConfig) {
                const config = {
                    dataField: 'otherClassIds',
                    editorType: 'dxList',
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.classes', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        keyExpr: 'key',
                        height: 150,
                        editEnabled: true,
                        showSelectionControls: true,
                        selectionMode: "multiple"
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            score: function (extendedConfig) {
                const config = {
                    dataField: 'score',
                    editorType: 'dxTextBox',
                };
                return $.extend(true, config, extendedConfig);
            },
            excluded: function (extendedConfig) {
                const config = {
                    dataField: 'excluded',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            hideInPortal: function (extendedConfig) {
                const config = {
                    dataField: 'hideInPortal',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            comments: function (extendedConfig) {
                const config = {
                    dataField: 'comment',
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.comments', { dataSourceConfig: { key: 'CommentID' } }),
                        valueExpr: 'CommentID',
                        displayExpr: 'Comment'
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            publicNote: function (extendedConfig) {
                const config = {
                    dataField: 'publicNote',
                    editorType: 'dxTextArea',
                    editorOptions: { maxLength: 255, placeholder: 'Public Note' }
                };
                return $.extend(true, config, extendedConfig);
            },
            privateNote: function (extendedConfig) {
                const config = {
                    dataField: 'privateNote',
                    editorType: 'dxTextArea',
                    editorOptions: { maxLength: 255, placeholder: 'Private Note' }
                };
                return $.extend(true, config, extendedConfig);
            },
            thirdPartyReadOnly: function (extendedConfig) {
                const config = {
                    dataField: 'thirdPartyReadOnly',
                    editorType: 'dxSwitch'
                };
                return $.extend(true, config, extendedConfig);
            },
            dayOfTerm: function (extendedConfig) {
                const config = {
                    dataField: 'dayOfTerm',
                    editorType: 'dxNumberBox',
                    min: 0,
                    label: { text: 'Day Of Term' },
                    editorOptions: {
                        showClearButton: true,
                        onFocusIn: function (e) {
                            setTimeout(function () {
                                e.element.find(".dx-texteditor-input")[0].select();
                            }, 0);
                        },
                        onValueChanged: function (e) {
                            if (e.value === null) {
                                e.component.option("value", 0);
                            }
                        }
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            countDayOfTermFromEndOfTerm: function (extendedConfig) {
                const config = {
                    dataField: 'countDayOfTermFromEndOfTerm',
                    editorType: 'dxSwitch',
                    editorOptions: {
                        switchedOffText: "BEGINNING",
                        switchedOnText: "END",
                        width: '65px'
                    },
                    label: { text: 'Count Day Of Term From:' },
                };
                return $.extend(true, config, extendedConfig);
            },
            assignmentSecurityType: function (extendedConfig) {
                const config = {
                    dataField: 'dgbSecurityTypeID',
                    editorType: 'dxSelectBox',
                    label: { text: 'Assignment Security' },
                    editorOptions: {
                        dataSource: app.DXDataSource('gradebook.course.content.assignmentsecuritytypes', {
                            dataSourceConfig: { key: 'securityTypeID' }
                        }),
                        valueExpr: 'securityTypeID',
                        displayExpr: 'securityType',
                    }
                };
                return $.extend(true, config, extendedConfig);
            },

        },
        multiSelect: {
            schools: function (extendedConfig, dataSourceParams) {
                const dsParams = {
                    useOrgGuValues: false
                }
                $.extend(true, dsParams, dataSourceParams);
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'School' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.schools', {
                            dataSourceConfig: { key: 'key' },
                            clientState: dsParams
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            subjects: function (extendedConfig) {
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'Subject' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.subjects', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            schoolYears: function (extendedConfig) {
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'School Year' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.schoolyears', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            courses: function (extendedConfig) {
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'Course' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.courses', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            grades: function (extendedConfig, dataSourceParams) {
                const dsParams = {
                    useGradeCodeKeys: false
                };
                $.extend(true, dsParams, dataSourceParams);
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'Grade Level' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.grades', {
                            dataSourceConfig: { key: 'key' },
                            clientState: dsParams
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            userGroups: function (extendedConfig) {
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'User Groups' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.userGroups', {
                            dataSourceConfig: { key: 'key' }
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            students: function (extendedConfig, dataSourceParams) {
                const dsParams = {
                    useStudentGus: false
                };
                $.extend(true, dsParams, dataSourceParams);
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'Student' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.students', {
                            dataSourceConfig: { key: 'key' },
                            clientState: dsParams
                        }),
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true
                    }
                };
                return $.extend(true, config, extendedConfig);
            },
            classStudents: function (extendedConfig, dataSourceParams) {
                const dsParams = {
                    useStudentGus: false
                };
                $.extend(true, dsParams, dataSourceParams);
                const config = {
                    dataField: '',
                    editorType: 'dxTagBox',
                    label: { text: 'Student' },
                    editorOptions: {
                        dataSource: app.DXDataSource('genericdata.students.class', {
                            dataSourceConfig: { group: [{ selector: "className" }], key: 'className' },
                            bindObservables: true,
                            clientState: dsParams
                        }),
                        grouped: true,
                        valueExpr: 'key',
                        displayExpr: 'text',
                        maxDisplayedTags: 6,
                        searchEnabled: true,
                        searchExpr: 'text',
                        showClearButton: true,
                        showDropDownButton: true,
                        applyValueMode: 'useButtons',
                        showSelectionControls: true,
                        selectAllMode: 'allPages',
                    }
                };
                return $.extend(true, config, extendedConfig);
            },

        }
    };

    const StreamsContext = function (groupGu, targetPersonGu, streamGu, isPrivateMessage) {
        const config = {
            isPrivateMessage: isPrivateMessage ? true : false,
            groupGu: groupGu,
            targetPersonGu: targetPersonGu,
            streamGu: streamGu
        };
        return config;
    };

    const actions = {
        gradeBook: {
            deleteAssignment: function (gradeBookId) {
                return app.call('gradebook.course.content.item', 'DeleteItem', { gradeBookId: gradeBookId })
                    .done(function (result) {
                        app.topic('gradebook.course.content.item.deleted').publish(result);
                    });
            },
            openStudentCourseItemPreview: function (gradeBookId) {
                var popup = new app.popup('Student Preview', 'pxp-course-item', {
                    config: {
                        gradeBookId: gradeBookId
                    }
                }, {
                    width: '90%',
                    height: '90%'
                });
                popup.open();
            },
            openStudentProfile: function (studentId, closeCallback) {
                var popup = new app.popup('Student Profile', 'gradebook.student', {
                    config: {
                        studentId: studentId
                    }
                }, {
                    onHidden: function () {
                        if (typeof closeCallback === 'function') {
                            closeCallback();
                        }
                    },
                    width: '90%',
                    height: '90%'
                });
                popup.open();
            },
            openGradeBookItem: function (gradeBookId, closeCallback) {
                var popup = new app.popup('Course Item', 'gradebook.course.content.item', {
                    config: {
                        gradeBookId: gradeBookId
                    }
                }, {
                    onHidden: function (e) {
                        if (typeof closeCallback === 'function') {
                            closeCallback();
                        }
                    },
                    width: '100%',
                    height: '100%'
                });
                popup.open();
            },
            openStudentSubmissionGrader: function (studentId, gradeBookId) {
                app.call('gradebook.grid2', 'openSubmissionsGrid', { gradeBookId: gradeBookId })
                    .done(function (asgnName) {
                        var popup = new app.popup(asgnName, 'gradebook.course.item.submission.grader', {
                            config: { studentId: studentId }
                        }, {
                            onHidden: function (e) {
                            },
                            width: '95%',
                            height: '95%'
                        });
                        popup.open();
                    });
            },
            openStreamsPrivateMessages_ForClass: function (studentId, closeCallback) {
                var popup = new app.popup('Streams Messages', 'streams.messages', {
                    config: {
                        studentId: studentId
                    }
                }, {
                    onHidden: function () {
                        if (typeof closeCallback === 'function') {
                            closeCallback();
                        }
                    },
                    width: '90%',
                    height: '90%'
                });
                popup.open();
            }
        }
    };

    const schedulerResources = {
        ptc: [
            {
                text: "Available",
                id: 1,
                color: "rgb(37 167 236)"
            }, {
                text: "Booked Other Student",
                id: 2,
                color: "rgb(118 133 141)"
            }, {
                text: "Current Student",
                id: 3,
                color: "rgb(170 140 189)"
            }, {
                text: "Locked",
                id: 4,
                color: "rgb(222 78 49)"
            }, {
                text: "Current Student - Agenda Done",
                id: 5,
                color: "rgb(230 225 233)"
            }, {
                text: "Current Student - Agenda NOT Done",
                id: 6,
                color: "rgb(230 210 243)"
            }, {
                text: "Current Student - Agenda View NOT Done",
                id: 7,
                color: "rgb(142 131 149)"
            }
        ]
    };

    const formOld = function (data, self) {
        data.formData = eval(data.formData);
        return data;
    };

    const formConfig = function (vm, formConfig, changeTracker) {
        formConfig.formData = ko.mapping.fromJS(formConfig.formData);
        formConfig.items.forEach((i) => {
            if (i.funcList) {
                i.funcList.forEach((f) => {
                    if (i.editorOptions[f]) {
                        if (vm[i.editorOptions[f]]) {
                            i.editorOptions[f] = vm[i.editorOptions[f]];
                        }
                        else {
                            alert('Method ' + i.editorOptions[f] + ' not found on vm.');
                        }
                    }
                })
            }
        });
        formConfig.changeTracker = changeTracker;
        return formConfig;
    };

    return {
        grid: grid,
        fields: fields,
        streamsContext: StreamsContext,
        actions: actions,
        schedulerResources: schedulerResources,
        formOld: formOld,
        form: formConfig
    };
});
