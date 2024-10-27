﻿
define(['knockout', 'app'], function (ko, app) {

    var calcs = function () {
        var self = this;

        self.outputLog = false;

        self.dataLoaded = ko.observable(false);
        self.startup = $.Deferred();

        self.isPostWindowOpen = ko.observable();
        self.isAssignmentWeightingOn = ko.observable();
        self.applyRigorPoints = ko.observable(false);
        self.rigorPoints = ko.observable(0);
        self.useTeachersOverriddenMarkValueInTermWeighting = ko.observable(false);
        self.markType = ko.observable('');
        self.percentageRoundingOn = ko.observable(true);
        self.percentageRoundingPlaces = ko.observable(2);
        self.markRoundingOn = ko.observable(true);
        self.markRoundingPlaces = ko.observable(2);
        self.gradingPeriodId = ko.observable(-1);
        self.standardsModeAssignmentScorePreference = ko.observable();

        self.students = ko.observableArray();
        self.gradeBookScoreTypes = ko.observableArray();
        self.reportCardScoreTypes = ko.observableArray();
        self.measureTypes = ko.observableArray();
        self.comments = ko.observableArray();
        self.assignments = ko.observableArray();
        self.termWeighting = ko.observableArray();
        self.termWeightingClassGrades = ko.observableArray();
        self.analysisBands = ko.observableArray();

        self.standardsEvidence = ko.observableArray();
        self.standardsAssignments = ko.observableArray();

        self.measureTypeGrades = ko.observableArray();
        self.classGrades = ko.observableArray();

        self.gbScoreTypeLookup = function (scoreTypeId) {
            const st = self.gradeBookScoreTypes();
            var processedArray = DevExpress.data.query(st)
                .filter([['id', '=', scoreTypeId]])
                .toArray();
            return processedArray[0];
        };
        self.rcScoreTypeLookup = function (scoreTypeId) {
            const st = self.reportCardScoreTypes();
            var processedArray = DevExpress.data.query(st)
                .filter([['id', '=', scoreTypeId]])
                .toArray();
            return processedArray[0];
        };
        self.measureTypeTotalWeight = function () {
            const mt = self.measureTypes();
            const sum = mt.map(item => item.weight()).reduce((prev, curr) => prev + curr, 0);
            return sum;
        };
        self.measureTypeLookup = function (measureTypeId) {
            const mt = self.measureTypes();
            var processedArray = DevExpress.data.query(mt)
                .filter([['id', '=', measureTypeId]])
                .toArray();
            return processedArray[0];
        };
        self.classGradeLookup = function (studentId) {
            var theGrade = null;
            const id = parseInt(studentId);
            self.classGrades().forEach(function (grade) {
                if (grade.studentId() === id) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };
        self.termWeightingClassGradeLookup = function (studentId, gradingPeriodId) {
            var theGrade = null;
            self.termWeightingClassGrades().forEach(function (grade) {
                if (grade.studentId() === studentId && grade.gradingPeriodId() === gradingPeriodId) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };
        self.assignmentGradeLookup = function (studentId, gradeBookId) {
            var theGrade = null;
            const stuId = parseInt(studentId);
            const gbId = parseInt(gradeBookId);

            self.assignments().forEach(function (grade) {
                if (grade.studentId() === stuId && grade.gradeBookId() === gbId) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };
        self.assignmentByMeasureTypeLookup = function (studentId, measureTypeId) {
            var theGrades = [];
            const stuId = parseInt(studentId);
            const mtId = parseInt(measureTypeId);
            self.assignments().forEach(function (grade) {
                if (grade.studentId() === stuId && grade.measureTypeId() === mtId) {
                    theGrades.push(grade);
                }
            });
            return theGrades;
        };
        self.assignmentGradesLookup = function (gradeBookId) {
            var theGrades = [];
            const gbId = parseInt(gradeBookId);
            self.assignments().forEach(function (grade) {
                if (grade.gradeBookId() === gbId) {
                    theGrades.push(grade);
                }
            });
            return theGrades;
        };
        self.analysisBandLookup = function (bandId) {
            var theBand = null;
            self.analysisBands().forEach(function (band) {
                if (band.id() === bandId) {
                    theBand = band;
                }
            });
            return theBand;
        };
        self.measureTypeGradeLookup = function (studentId, measureTypeId) {
            var theGrade = null;
            self.measureTypeGrades().forEach(function (grade) {
                if (grade.studentId() === studentId && grade.measureTypeId() === measureTypeId) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };

        //standards
        self.standardLookup = function (studentId, gradeBookId, standardId) {
            var theGrade = null;
            const stuId = parseInt(studentId);
            const gbId = parseInt(gradeBookId);
            const stId = parseInt(standardId);

            self.standardsEvidence().forEach(function (grade) {
                if (grade.studentId() === stuId && grade.gradeBookId() === gbId && grade.standardId() === stId) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };
        self.standardAssignmentLookup = function (studentId, gradeBookId) {
            var theGrade = null;
            const stuId = parseInt(studentId);
            const gbId = parseInt(gradeBookId);

            self.standardsAssignments().forEach(function (grade) {
                if (grade.studentId() === stuId && grade.gradeBookId() === gbId) {
                    theGrade = grade;
                }
            });
            return theGrade;
        };

        self.loadData = function () {
            return app.call({
                friendlyName: 'genericdata.classdata',
                method: 'GetClassData',
                parameters: {},
                koMapping: {
                    'assignments': {
                        create: function (options) {
                            return new studentAssignment(options.data, self);
                        }
                    },
                    'measureTypeGrades': {
                        create: function (options) {
                            return new measureTypeGrade(options.data, self);
                        }
                    },
                    'classGrades': {
                        create: function (options) {
                            return new classGrade(options.data, self);
                        }
                    },
                    'termWeightingClassGrades': {
                        create: function (options) {
                            return new classGrade(options.data, true, self);
                        }
                    },
                    'analysisBands': {
                        create: function (options) {
                            return new analysisBand(options.data, self);
                        }
                    },
                    'standardsEvidence': {
                        create: function (options) {
                            return new studentStandardEvidence(options.data, self);
                        }
                    },
                    'standardsAssignments': {
                        create: function (options) {
                            return new studentStandardEvidence(options.data, self);
                        }
                    }
                },
                koMapTo: self
            }).done(function (data) {
                self.dataLoaded(true);
                self.isDataStale(false);
                if (self.outputLog) {
                    console.log('Grade Book Data Loaded...' + data.GradingPeriodName + ' ' + data.className);
                }
                self.startup.resolve(data);
            });
        };

        self.reloadClassData = function () {
            self.dataLoaded(false);
            return self.loadData();
        };

        self.isDataStale = ko.observable(false);

        self.subscribeToChanges = function () {
            //listen for score changes in the assignments.
            app.topic('studentAssignmentScoreChanged').subscribe(function (data) {
                if (self.dataLoaded() === false) { return; }
                if (self.outputLog) { console.log('studentAssignmentScoreChanged'); };
                const studentId = ko.unwrap(data.studentId);
                const measureTypeId = ko.unwrap(data.measureTypeId);
                self.evalStudentMeasureTypeForDrops(studentId, measureTypeId);
                self.evalStudentMeasureTypeGrades(studentId, measureTypeId);
                self.evalStudentClassGrade(studentId);
                self.evalStudentClassTermWeighting(studentId);
            });
            //listen for assignment changes
            app.topic('gradebook.course.content.item.save').subscribe(function (data) {
                self.isDataStale(true);
            });
            //when assignment view closes
            app.topic('gradebook.course.content.item.dispose').subscribe(function (data) {
                if (self.isDataStale() === true) {
                    self.loadData();
                }
            });
            //listen for scores grid load
            app.topic('gradebook.course.item.scores.grid.loaded').subscribe(function () {
                if (self.isDataStale() === true) {
                    self.loadData();
                }
            });
        };

        self.evalStudentMeasureTypeForDrops = function (studentId, measureTypeId) {

            var mt = self.measureTypeLookup(measureTypeId);
            if (mt.dropScores() > 0) {
                var scoresToDrop = mt.dropScores();
                if (self.outputLog) { console.log(scoresToDrop + ' score to drop for measure type id: ' + measureTypeId); };
                const assgns = self.assignments();
                var theAssigns = DevExpress.data.query(assgns)
                    .filter([
                        ['studentId', '=', studentId],
                        'and',
                        ['measureTypeId', '=', measureTypeId]
                    ])
                    .sortBy('calcValue')
                    .thenBy('pointsPossible', true)
                    .thenBy('dueDate')
                    .thenBy('gradeBookId')
                    .toArray();

                theAssigns.forEach(function (asgn) {
                    //clear drops
                    asgn.dropScoreText('');
                    //if the assignment is graded, not excused, a normal assignment and we have scores to drop
                    if (asgn.calcValue() >= 0 &&
                        asgn.excused() === false &&
                        asgn.assignmentAffectsClassGrade() === true &&
                        asgn.gradeBookCategoryId() === 1 &&
                        scoresToDrop > 0) {
                        //do not use this assignment it should be dropped based on the teachers settings.
                        scoresToDrop -= 1;
                        asgn.dropScoreText('Dropped');
                        if (self.outputLog) { console.log('dropping the following assignment -->', ko.toJS(asgn)); };
                    }
                });

            }

        };

        self.evalStudentMeasureTypeGrades = function (studentId, measureTypeId) {
            const assgns = self.assignments();
            const mt = self.measureTypeLookup(measureTypeId);

            var theAssigns = DevExpress.data.query(assgns)
                .filter([['studentId', '=', studentId], 'and', ['measureTypeId', '=', measureTypeId]])
                .toArray();

            var mtgs = {};
            theAssigns.forEach(function (asgn) {
                var mtg = mtgs[measureTypeGradeKey(asgn)];
                if (mtg === undefined) {
                    mtg = new measureTypeGrade(ko.toJS({
                        studentId: asgn.studentId,
                        measureTypeId: asgn.measureTypeId,
                        reportCardScoreTypeId: asgn.reportCardScoreTypeId,
                        measureTypeWeight: mt.weight
                    }));
                }

                if (asgn.assignmentAffectsClassGrade() === true) {
                    mtg.points(mtg.points() + asgn.points());
                    mtg.pointsPossible(mtg.pointsPossible() + asgn.pointsPossible());
                    mtg.assignmentCount(mtg.assignmentCount() + 1);
                    if (self.outputLog) { console.log('evalStudentMeasureTypeGrades.theAssigns', ko.toJS(asgn)); }
                }

                if (asgn.isGradeBookMissingMark() === true) {
                    mtg.incompleteAssignments(mtg.incompleteAssignments() + 1);
                }

                mtgs[measureTypeGradeKey(asgn)] = mtg;
            });

            for (var key in mtgs) {
                var value = mtgs[key];
                //let the object know the grade was updated.
                var foundGrade = false;
                self.measureTypeGrades().forEach(function (grade) {
                    var stuid = grade.studentId();
                    var measureId = grade.measureTypeId();
                    if (value.studentId() === stuid && value.measureTypeId() === measureId) {
                        ko.mapping.fromJS(value, {
                            'ignore': ["markPercentage", "calculatedMark", "weightedPercentage", "weightedPercentageBase100"]
                        }, grade);
                        foundGrade = true;
                    }
                });
                if (foundGrade === false) {
                    self.measureTypeGrades.push(value);
                }
                if (self.outputLog) { console.log('evalStudentMeasureTypeGrades.mtgs', ko.toJS(value)); };
            }

        };

        self.evalStudentClassGrade = function (studentId) {
            const mtgs = self.measureTypeGrades();

            var stuMtgs = DevExpress.data.query(mtgs)
                .filter([['studentId', '=', studentId]])
                .toArray();

            var cgs = {};
            stuMtgs.forEach(function (mtg) {
                var cg = cgs[classGradeKey(mtg)];
                if (cg === undefined) {
                    cg = new classGrade(ko.toJS({
                        studentId: mtg.studentId,
                        reportCardScoreTypeId: mtg.reportCardScoreTypeId
                    }), self);
                }

                cg.incompleteAssignments(cg.incompleteAssignments() + mtg.incompleteAssignments());

                if (mtg.assignmentCount() > 0) {
                    cg.points(cg.points() + mtg.points());
                    cg.pointsPossible(cg.pointsPossible() + mtg.pointsPossible());

                    cg.totalWeightedPercentage(cg.totalWeightedPercentage() + mtg.weightedPercentage());
                    cg.totalAssignmentWeight(cg.totalAssignmentWeight() + mtg.measureTypeWeight());

                    cg.assignmentCount(cg.assignmentCount() + mtg.assignmentCount());
                    if (self.outputLog) { console.log('evalStudentClassGrade.stuMtgs', ko.toJS(mtg)); };
                }

                cgs[classGradeKey(mtg)] = cg;
            });

            for (var key in cgs) {
                var value = cgs[key];
                var foundGrade = false;
                self.classGrades().forEach(function (grade) {
                    var stuid = grade.studentId();
                    if (value.studentId() === stuid) {
                        ko.mapping.fromJS(value, {
                            'ignore': ["markPercentage", "lockScore", "manualMark", "forceUseWeighting", "calculatedMark", "weightedPercentage", "base100MarkPercentage"]
                        }, grade);
                        foundGrade = true;
                    }
                });
                if (foundGrade === false) {
                    self.classGrades.push(value);
                }
                if (self.outputLog) { console.log('evalStudentClassGrade.cgs', ko.toJS(value)); };
            }
        };

        self.evalStudentClassTermWeighting = function (studentId) {
            //if this period is not calculated then bail out. server side will take care of other periods.
            const allTermWeighting = self.termWeighting();
            const thisTermWeighting = DevExpress.data.query(allTermWeighting).filter([['calculatedPeriodId', '=', self.gradingPeriodId()]]).toArray();
            if (thisTermWeighting.length === 0) { return };
            const calculatedPeriodGrade = self.classGradeLookup(studentId);
            let scoreType = self.rcScoreTypeLookup(calculatedPeriodGrade.reportCardScoreTypeId());
            if (scoreType === undefined) { throw 'Report Card Score Type ' + calculatedPeriodGrade.reportCardScoreTypeId() + ' is not available to evalStudentClassTermWeighting function.'; }
            let scoreDetails = scoreType.details();
            let limitPCTValue = 0;
            let limitPctMethod = "MAX";
            let periodPointsScored = 0.0;
            let periodPointsPossible = 0.0;
            let periodWeightedPercentage = 0.0;
            let periodManualMark = "";
            const ntw = {
                calculatedMark: calculatedPeriodGrade.calculatedMark(),
                manualMark: calculatedPeriodGrade.manualMark(),
                points: calculatedPeriodGrade.points(),
                pointsPossible: calculatedPeriodGrade.pointsPossible(),
                markPercentage: calculatedPeriodGrade.markPercentage()
            };
            //reset the calculated period
            calculatedPeriodGrade.points(0);
            calculatedPeriodGrade.pointsPossible(0);
            calculatedPeriodGrade.totalWeightedPercentage(0);
            calculatedPeriodGrade.totalAssignmentWeight(0);

            thisTermWeighting.forEach(function (term) {
                let childPeriodGrade = self.termWeightingClassGradeLookup(studentId, term.childPeriodId());
                if (childPeriodGrade === null) {
                    //if the period we are looking for is the period we are calculating then point the childPeriodGrade to the calculatedPeriodGrade
                    childPeriodGrade = calculatedPeriodGrade;
                };
                //check to see if the manual score has a max value set. if it does that means the district wishes to cap the value of this period for term weighting purposes.
                limitPCTValue = 0;
                limitPctMethod = "MAX";
                let limitPCTQuery = DevExpress.data.query(scoreDetails).filter(function (item) { return item.score() === childPeriodGrade.manualMark() && item.limitPCTMaxValue() > 0; }).toArray();
                if (limitPCTQuery.length > 0) {
                    let LimitPCTQuery_First = limitPCTQuery[0];
                    limitPCTValue = LimitPCTQuery_First.limitPCTMaxValue();
                    if (LimitPCTQuery_First.limitPCTCalcMethod() !== "MAX") {
                        limitPctMethod = LimitPCTQuery_First.limitPCTCalcMethod();
                    }
                }

                periodPointsScored = 0.0;
                periodPointsPossible = 0.0;
                periodWeightedPercentage = 0.0;
                let rigorPointWeightedPercentage = 0.0;

                let childGradeCalculatedFromTermWeighting = DevExpress.data.query(allTermWeighting).filter([['calculatedPeriodId', '=', term.childPeriodId()]]).toArray().length > 0;

                if (childPeriodGrade.gradingPeriodId() === calculatedPeriodGrade.gradingPeriodId()) {
                    periodPointsScored = ntw.points;
                    periodPointsPossible = ntw.pointsPossible;
                    if (self.applyRigorPoints()) {
                        rigorPointWeightedPercentage = ntw.markPercentage + self.rigorPoints();
                        periodWeightedPercentage = rigorPointWeightedPercentage * (term.weight() / 100);
                    } else {
                        periodWeightedPercentage = ntw.markPercentage * (term.weight() / 100);
                    }
                    periodManualMark = ntw.manualMark;
                } else {
                    periodPointsScored = childPeriodGrade.points();
                    periodPointsPossible = childPeriodGrade.pointsPossible();

                    if (self.applyRigorPoints() && childGradeCalculatedFromTermWeighting === false) {
                        //'we don't want to add rigor to a child period if it was calculated from other periods
                        rigorPointWeightedPercentage = childPeriodGrade.weightedPercentage() + self.rigorPoints();
                        periodWeightedPercentage = rigorPointWeightedPercentage * (term.weight() / 100);
                    } else {
                        periodWeightedPercentage = childPeriodGrade.weightedPercentage() * (term.weight() / 100);
                    }
                    periodManualMark = childPeriodGrade.manualMark();
                }

                //'some clients want a feature to allow the teachers overridden score for the class and period to affect term weighting. normally you wouldnt want to do this becuase it makes the calculations look wrong
                if (self.useTeachersOverriddenMarkValueInTermWeighting() && childPeriodGrade.lockScore() === true) { //'lock score indicates the score was changed by the teacher
                    //'find out the max value of the score type as well as the value of the manual score given by the teacher
                    let childPeriodScoreType = self.rcScoreTypeLookup(childPeriodGrade.reportCardScoreTypeId());
                    if (childPeriodScoreType === undefined) { throw 'Report Card Score Type ' + childPeriodGrade.reportCardScoreTypeId() + ' for a childPeriodGrade is not available to evalStudentClassTermWeighting function.'; }

                    let childPeriodScoreDetails = childPeriodScoreType.details();

                    let childPeriodScoreTypeMaxValue = childPeriodScoreType.max();
                    //'get the value of the manual score
                    let manualScoreValue = 0;
                    let manualScoreValueQuery = DevExpress.data.query(scoreDetails).filter(function (item) { return item.score() === periodManualMark }).toArray();

                    if (manualScoreValueQuery.length > 0) {
                        manualScoreValue = manualScoreValueQuery[0].value();
                    }
                    //'normalize the manual score value
                    if (manualScoreValue > 0) {
                        let normalizedManualScoreValuePct = manualScoreValue / childPeriodScoreTypeMaxValue * 100
                        //'apply this value to the period, we arent changing the point values or the value that is reported in the database, only injecting this so it changes term weighting. this really is not the right way to do this. the teacher should make an extra credit assignment so all the calculations are correct but some districts are lazy
                        periodWeightedPercentage = normalizedManualScoreValuePct * (term.weight() / 100);
                    }
                }

                //'enforce the limits
                if (limitPCTValue > 0 && (childPeriodGrade.weightedPercentage() > limitPCTValue || limitPctMethod === "FORCE")) {
                    periodPointsScored = periodPointsPossible * (limitPCTValue / 100);
                    periodWeightedPercentage = limitPCTValue * (term.weight() / 100);
                }

                if (periodPointsPossible > 0) {
                    calculatedPeriodGrade.points(calculatedPeriodGrade.points() + periodPointsScored);
                    calculatedPeriodGrade.pointsPossible(calculatedPeriodGrade.pointsPossible() + periodPointsPossible);
                    calculatedPeriodGrade.totalWeightedPercentage(calculatedPeriodGrade.totalWeightedPercentage() + periodWeightedPercentage);
                    calculatedPeriodGrade.totalAssignmentWeight(calculatedPeriodGrade.totalAssignmentWeight() + term.weight());
                }

            });

        };

        self.getStudentGroupTotal = function (studentId, groupType, groupValue) {
            const assgns = self.assignments();

            var theAssigns = DevExpress.data.query(assgns)
                .filter([['studentId', '=', studentId], 'and', [groupType, '=', groupValue]])
                .toArray();

            var groups = {};
            theAssigns.forEach(function (asgn) {
                var group = groups[groupValue];
                if (group === undefined) {
                    group = new unitSummary(ko.toJS({
                        studentId: asgn.studentId(),
                        reportCardScoreTypeId: asgn.reportCardScoreTypeId()
                    }));
                }

                if (asgn.assignmentAffectsClassGrade() === true) {
                    group.points(group.points() + asgn.points());
                    group.pointsPossible(group.pointsPossible() + asgn.pointsPossible());
                    group.assignmentCount(group.assignmentCount() + 1);
                    if (self.outputLog) {
                        console.log('group assignment-->', ko.toJS({
                            s: asgn.score(),
                            p: asgn.points(),
                            pp: asgn.pointsPossible(),
                            ac: group.assignmentCount(),
                            asgn: asgn
                        }));
                    };
                }

                if (asgn.isGradeBookMissingMark() === true) {
                    group.incompleteAssignments(group.incompleteAssignments() + 1);
                }

                groups[groupValue] = group;
            });

            return groups[groupValue];

        };

        self.getStudentGroupTotalWeighted = function (studentId, groupType, groupValue) {
            const assgns = self.assignments();

            var theAssigns = DevExpress.data.query(assgns)
                .filter([['studentId', '=', studentId], 'and', [groupType, '=', groupValue]])
                .toArray();

            var mtgs = {};
            theAssigns.forEach(function (asgn) {
                let mtg = mtgs[measureTypeGradeKey(asgn)];
                if (mtg === undefined) {
                    const mt = self.measureTypeLookup(asgn.measureTypeId());
                    let weight = mt.weight;
                    if (self.measureTypeTotalWeight() == 0) {
                        weight = 100;
                    }
                    mtg = new measureTypeGrade(ko.toJS({
                        studentId: asgn.studentId,
                        measureTypeId: asgn.measureTypeId,
                        reportCardScoreTypeId: asgn.reportCardScoreTypeId,
                        measureTypeWeight: weight
                    }));
                }

                if (asgn.assignmentAffectsClassGrade() === true) {
                    mtg.points(mtg.points() + asgn.points());
                    mtg.pointsPossible(mtg.pointsPossible() + asgn.pointsPossible());
                    mtg.assignmentCount(mtg.assignmentCount() + 1);
                    if (self.outputLog) { console.log('evalStudentMeasureTypeGrades.theAssigns', ko.toJS(asgn)); }
                }

                if (asgn.isGradeBookMissingMark() === true) {
                    mtg.incompleteAssignments(mtg.incompleteAssignments() + 1);
                }

                mtgs[measureTypeGradeKey(asgn)] = mtg;
            });

            var groups = {};
            Object.values(mtgs).forEach(function (mtg) {
                var group = groups[groupValue];
                if (group === undefined) {
                    group = new unitSummary({
                        studentId: mtg.studentId(),
                        reportCardScoreTypeId: mtg.reportCardScoreTypeId()
                    });
                }

                if (mtg.assignmentCount() > 0) {
                    group.points(group.points() + mtg.points());
                    group.pointsPossible(group.pointsPossible() + mtg.pointsPossible());
                    group.totalWeightedPercentage(group.totalWeightedPercentage() + mtg.weightedPercentage());
                    group.totalAssignmentWeight(group.totalAssignmentWeight() + mtg.measureTypeWeight());
                    group.assignmentCount(group.assignmentCount() + mtg.assignmentCount());
                    if (self.outputLog) {
                        console.log('group assignment-->', ko.toJS({
                            s: asgn.score(),
                            p: asgn.points(),
                            pp: asgn.pointsPossible(),
                            ac: group.assignmentCount(),
                            asgn: asgn
                        }));
                    };
                }

                group.incompleteAssignments(group.incompleteAssignments() + mtg.incompleteAssignments());

                groups[groupValue] = group;
            });

            return groups[groupValue];

        }


        var startup = function () {
            self.loadData();
            self.subscribeToChanges();
        };

        //call startup
        startup();

        //helpers
        self.helpers = {
            triggerParentChange: function (parentObservableArray) {
                parentObservableArray.valueHasMutated();
            },
            groupBy: function (list, keyGetter) {
                const map = new Map();
                list.forEach((item) => {
                    const key = keyGetter(item);
                    const collection = map.get(key);
                    if (!collection) {
                        map.set(key, [item]);
                    } else {
                        collection.push(item);
                    }
                });
                return map;
            },
            calculateAssignmentAreaPercentage: function (points, pointsPossible, assignmentAreaWeight) {
                if (pointsPossible === 0 && points === 0) {
                    return 0;
                }
                var returnValue = 0;
                if (pointsPossible === 0) {
                    returnValue = 100;
                } else {
                    returnValue = (points / pointsPossible) * assignmentAreaWeight;
                }
                return returnValue;
            },
            calculateAssignmentAreaGrade: function (mtGrade) {
                if ((self.isAssignmentWeightingOn() === true && mtGrade.measureTypeWeight() === 0) || mtGrade.pointsPossible() === 0) {
                    return "N/A";
                } else {
                    return this.getMark(mtGrade.weightedPercentageBase100(), mtGrade.reportCardScoreTypeId());
                }
            },
            truncate: function (value, places) {
                if (places === undefined) {
                    places = self.percentageRoundingPlaces();
                };
                var E = Math.pow(10, places);
                return Math.trunc(value * E) / E;
            },
            roundPlaces: function (value, places) {
                if (places === undefined) {
                    places = self.percentageRoundingPlaces();
                };
                return Number.parseFloat(Number.parseFloat(value).toFixed(places));
            },
            roundValue: function (value) {
                let outputValue = 0;
                if (self.percentageRoundingOn() === true) {
                    //rounding is on
                    outputValue = this.roundPlaces(value, self.percentageRoundingPlaces());
                } else {
                    //rounding is off
                    outputValue = this.truncate(value, self.percentageRoundingPlaces());
                }
                return outputValue;
            },
            markValue: function (inputValue) {
                //preround incase of teacher whole number settings
                inputValue = this.roundValue(inputValue);
                var outputValue = 0;
                //check if mark rounding is on
                if (self.markRoundingOn() === true) {
                    outputValue = this.roundPlaces(inputValue, self.markRoundingPlaces());
                } else {
                    outputValue = this.roundValue(inputValue);
                }
                return outputValue;
            },
            getMark: function (calcValue_asBase100, reportCardScoreTypeId) {

                let reportCardScoreType = self.rcScoreTypeLookup(reportCardScoreTypeId);
                if (reportCardScoreType === undefined) { throw 'Report Card Score Type ' + reportCardScoreTypeId + ' is not available to getMark function.'; }
                let maxVal = Math.min(reportCardScoreType.max(), 100);
                //'determine the value to use when getting the mark
                let markValue = 0;
                //'if we are not base 100 then we need to round our values before we get the mark value
                if (maxVal === 100) {
                    markValue = this.markValue((calcValue_asBase100 / 100) * maxVal);
                }
                else {
                    markValue = this.markValue(this.roundPlaces((calcValue_asBase100 / 100) * maxVal, 2));
                }

                let returnMark = "Setup";
                let std = DevExpress.data.query(reportCardScoreType.details())
                    .filter([
                        ['lowScore', '<=', markValue],
                        'and',
                        ['highScore', '>=', markValue]
                    ]).toArray();
                if (std.length === 0) {
                    //outside score ranges, if above max give max, otherwise setup problem.
                    if (markValue > maxVal) {
                        if (self.markType() === 'Numeric' || self.markType() === 'Both') {
                            returnMark = this.roundPlaces(markValue, 0);
                        } else {
                            returnMark = DevExpress.data.query(reportCardScoreType.details()).sortBy('highScore', true).select('score').toArray()[0].score;
                        }
                    }
                } else {
                    returnMark = std[0].score();
                }

                return returnMark;

            },
            validateUpdateInput: function (NewVal, asgn) {
                var ParsedValues = self.helpers.parseUpdateValue(NewVal, asgn);
                var Score = ParsedValues.Score;
                var Comment = ParsedValues.Comment;
                var Excused = ParsedValues.Excused;
                var isScoreValid = false;
                var isCommentValid = false;
                var isExcusedValid = false;
                var VS = self.helpers.validateScore(ParsedValues, asgn);
                var ValidScore = VS.ValidScore;
                isScoreValid = VS.isValid;
                if (Score === '') { isScoreValid = true; }

                var VCC = self.helpers.validateComment(Comment, ParsedValues.cmt, ParsedValues.cmtText, asgn);
                var ValidCommentCode = VCC.ValidCommentCode;
                var ValidCommentText = VCC.ValidCommentText;
                var isGradeBookMissingMark = VCC.isGradeBookMissingMark;
                var penaltyPct = VCC.penaltyPct;
                var removeWhenScored = VCC.removeWhenScored;
                var assignmentValue = VCC.assignmentValue;
                var assignmentValueIsPercent = VCC.assignmentValueIsPercent;
                var standardsValue = VCC.standardsValue;
                var standardsValueIsPercent = VCC.standardsValueIsPercent;
                isCommentValid = VCC.isValid;
                if (Comment === '') { isCommentValid = true; }

                //check the excused value
                var ValidExcValue = '';
                if (Excused.toUpperCase() === '!EX') { ValidExcValue = false; isExcusedValid = true; }
                else if (Excused.toUpperCase() === 'EX') { ValidExcValue = true; isExcusedValid = true; }
                else if (Excused === '') { isExcusedValid = true; }

                var isValid = false;
                if (isScoreValid && isCommentValid && isExcusedValid) { isValid = true; }

                var ReturnValue = new Object();
                ReturnValue.ValidScore = ValidScore;
                ReturnValue.ValidCommentCode = ValidCommentCode;
                ReturnValue.ValidCommentText = ValidCommentText;
                ReturnValue.ValidExcValue = ValidExcValue;
                ReturnValue.isValid = isValid;
                ReturnValue.isOverMaxValue = VS.isOverMaxValue;
                ReturnValue.isOverDoubleMaxValue = VS.isOverDoubleMaxValue;
                ReturnValue.NumericMaxVal = ParsedValues.NumericMaxVal;
                ReturnValue.ValidChars = ParsedValues.chr;
                ReturnValue.CommentCodes = ParsedValues.cmt;
                ReturnValue.CommentText = ParsedValues.cmtText;
                ReturnValue.isGradeBookMissingMark = isGradeBookMissingMark;
                ReturnValue.penaltyPct = penaltyPct;
                ReturnValue.removeWhenScored = removeWhenScored;
                ReturnValue.commentAssignmentValue = assignmentValue;
                ReturnValue.commentAssignmentValueIsPercent = assignmentValueIsPercent;
                ReturnValue.commentStandardsValue = standardsValue;
                ReturnValue.commentStandardsValueIsPercent = standardsValueIsPercent;

                return ReturnValue;

            },
            parseUpdateValue: function (NewVal, asgn) {
                var Score = '';
                var Comment = '';
                var Excused = '';
                var isGradeBookMissingMark = '';
                //get the defaults
                var NumericMaxVal = ko.unwrap(asgn.maxValue);
                var ValidChars = ko.unwrap(asgn.gradeBookScoreType().details);
                var rexp = '';

                var ValidCmts = ko.unwrap(self.comments);
                var chr = $.map(ValidChars, function (s) { return s.score(); });
                if (chr.length === 0) { chr = [0]; }
                var VCC;

                var scArr = NewVal.split(' ');
                if (scArr.length === 3) {
                    Score = scArr[0];
                    Comment = scArr[1];
                    Excused = scArr[2];
                }
                else if (scArr.length === 2) {
                    // we need to evaluate the two items we have, 
                    // if the last one is ! or ex then we know its the excused value, 
                    // we have to determine if the first one is the commentcode or the score.
                    var LastValue = scArr[1];
                    if (LastValue.toUpperCase() === '!EX' || LastValue.toUpperCase() === 'EX') {
                        Excused = scArr[1];
                        //see if the first value is the commment
                        VCC = self.helpers.validateComment(scArr[0], ValidCmts);
                        if (VCC.isValid) {
                            //the comment is valid
                            Comment = scArr[0];
                            isGradeBookMissingMark = VCC.isGradeBookMissingMark;
                        } else {
                            // the value must be the score
                            Score = scArr[0];
                        }
                    }
                    else {
                        //last value is not excused value so the two values must be the score and comment.
                        Score = scArr[0];
                        Comment = scArr[1];
                    }
                }
                else {
                    //value could be the excused, comment or the score. lets evaluate them in that order.
                    //check for excused
                    if (NewVal.toUpperCase() === '!EX' || NewVal.toUpperCase() === 'EX') {
                        Excused = NewVal;
                    }
                    else {
                        //see if the value is the commment
                        VCC = self.helpers.validateComment(NewVal, ValidCmts);
                        if (VCC.isValid) {
                            //the comment is valid
                            Comment = NewVal;
                            isGradeBookMissingMark = VCC.isGradeBookMissingMark;
                        } else {
                            // the value must be the score
                            Score = NewVal;
                        }
                    }
                }
                var ReturnValue = new Object();
                ReturnValue.Score = Score;
                ReturnValue.Comment = Comment;
                ReturnValue.Excused = Excused;
                ReturnValue.chr = chr;
                ReturnValue.rexp = rexp;
                ReturnValue.cmt = ValidCmts;
                ReturnValue.NumericMaxVal = NumericMaxVal;

                return ReturnValue;
            },
            validateComment: function (Comment, cmts, cmtTxt, asgn) {
                //check the comment
                if (Comment === '' && asgn && asgn.commentCode && asgn.commentCode()) {
                    Comment = asgn.commentCode();
                }
                var isValid = false;
                var ValidCommentCode = '';
                var ValidCommentText = '';
                var isGradeBookMissingMark = false;
                var penaltyPct = null;
                var removeWhenScored = false;
                var assignmentValue = null;
                var assignmentValueIsPercent = null;
                var standardsValue = null;
                var standardsValueIsPercent = null;
                if (Comment !== '!') {
                    cmts.forEach(function (cmt) {
                        if (Comment.toUpperCase() === cmt.commentCode().toUpperCase()) {
                            ValidCommentCode = cmt.commentCode().trim();
                            ValidCommentText = cmt.comment();
                            isGradeBookMissingMark = cmt.isGradeBookMissingMark();
                            penaltyPct = cmt.penaltyPct();
                            removeWhenScored = cmt.removeWhenScored();
                            assignmentValue = cmt.assignmentValue();
                            assignmentValueIsPercent = cmt.assignmentValueIsPercent();
                            standardsValue = cmt.standardsValue();
                            standardsValueIsPercent = cmt.standardsValueIsPercent();
                            isValid = true;
                        }
                    });
                } else {
                    isValid = true;
                    ValidCommentCode = Comment;
                }

                var ReturnValue = new Object();
                ReturnValue.isValid = isValid;
                ReturnValue.ValidCommentCode = ValidCommentCode;
                ReturnValue.ValidCommentText = ValidCommentText;
                ReturnValue.isGradeBookMissingMark = isGradeBookMissingMark;
                ReturnValue.penaltyPct = penaltyPct;
                ReturnValue.removeWhenScored = removeWhenScored;
                ReturnValue.assignmentValue = assignmentValue;
                ReturnValue.assignmentValueIsPercent = assignmentValueIsPercent;
                ReturnValue.standardsValue = standardsValue;
                ReturnValue.standardsValueIsPercent = standardsValueIsPercent;

                return ReturnValue;
            },
            validateScore: function (ParsedValues) {
                var rexp = ParsedValues.rexp;
                var chr = ParsedValues.chr;
                var Score = ParsedValues.Score;
                var NumericMaxVal = ParsedValues.NumericMaxVal;

                //check the score
                var ValidScore = '';
                var isValid = false;
                var isOverMaxValue = false;
                var isOverDoubleMaxValue = false;
                if (Score !== '') {
                    if (chr.length === 1) {
                        //use the regex to validate the score
                        var precisionValid;
                        if (Score.match(/^\d{1,4}(?:\.\d{1,2})?$/)) {
                            precisionValid = true;
                            ValidScore = Score;
                        } else {
                            precisionValid = false;
                        }
                        if (precisionValid) {
                            //if the score is numeric then make sure its not more that double the max value, if its greater that the max value at all then set a flag for interface notification
                            isValid = true;
                            if (!isNaN(ValidScore)) {
                                ValidScore = parseFloat(ValidScore);
                                NumericMaxVal = parseInt(NumericMaxVal);
                                if (NumericMaxVal > 0) {
                                    if (ValidScore > (NumericMaxVal * 2)) {
                                        isOverDoubleMaxValue = true;
                                        isValid = false;
                                    } else if (ValidScore > NumericMaxVal) {
                                        isOverMaxValue = true;
                                    }
                                }
                            }
                        }

                    } else {
                        jQuery.each(chr, function () {
                            var allowedScore = '(' + RegExp.escape(Score) + ')';
                            var myregexp;
                            var mymatch;
                            //use the scores given
                            if (this.length === Score.length) {
                                myregexp = new RegExp(allowedScore, 'i');
                                mymatch = myregexp.exec(this);
                            }
                            if (mymatch && (mymatch.length > 0)) {
                                //if the score is numeric then make sure its not more that double the max value, if its greater that the max value at all then set a flag for interface notification
                                isValid = true;
                                ValidScore = mymatch[0];
                            }
                        });
                    }

                }
                var ReturnValue = new Object();
                ReturnValue.isValid = isValid;
                ReturnValue.ValidScore = ValidScore;
                ReturnValue.isOverMaxValue = isOverMaxValue;
                ReturnValue.isOverDoubleMaxValue = isOverDoubleMaxValue;

                return ReturnValue;
            },
        };

        //data storage classes
        var studentAssignment = function (data, vm) {
            var thisAssignment = this;

            thisAssignment.studentId = ko.observable(-1);
            thisAssignment.measureTypeId = ko.observable(-1);
            thisAssignment.gradeBookId = ko.observable(-1);
            thisAssignment.gradeBookCategoryId = ko.observable(-1);
            thisAssignment.gradeBookScoreTypeId = ko.observable(-1);
            thisAssignment.pointsPossible = ko.observable(-1);
            thisAssignment.maxValue = ko.observable(0);
            thisAssignment.maxScore = ko.observable('');
            thisAssignment.score = ko.observable('');
            thisAssignment.originalScore = ko.observable('');
            thisAssignment.excused = ko.observable(false);
            thisAssignment.dropScoreText = ko.observable();
            thisAssignment.isForGrading = ko.observable(0);
            thisAssignment.isGradeBookMissingMark = ko.observable(0);
            thisAssignment.analysisBandId = ko.observable(0);
            thisAssignment.commentCode = ko.observable();
            thisAssignment.penaltyPct = ko.observable();
            thisAssignment.hideInPortal = ko.observable();
            thisAssignment.publicNote = ko.observable();
            thisAssignment.privateNote = ko.observable();

            //these fields need to be available for the client side grade book to be able to get the group totals.
            //unit = 1,
            //category = 2,
            //week = 3,
            thisAssignment.unit = ko.observable('');
            thisAssignment.category = ko.observable('');
            thisAssignment.week = ko.observable('');

            ko.mapping.fromJS(data, {}, thisAssignment);

            thisAssignment.measureTypeAssignments = ko.pureComputed(function () {
                return self.assignmentByMeasureTypeLookup(thisAssignment.studentId(), thisAssignment.measureTypeId());
            });

            thisAssignment.gradeBookScoreType = ko.pureComputed(function () {
                return self.gbScoreTypeLookup(thisAssignment.gradeBookScoreTypeId());
            });

            thisAssignment.calcValue = ko.pureComputed(function () {
                let s = thisAssignment.score(); if (s === undefined || s === null) { s = ''; }
                const st = thisAssignment.gradeBookScoreTypeId();
                const mv = thisAssignment.maxValue();
                const ppct = thisAssignment.penaltyPct();
                let output = 0;
                if (s.length === 0) { return 0; }
                if (st === 1) {
                    //PERCENTAGE
                    output = parseFloat(s);
                } else if (st === 2) {
                    //RAW SCORE
                    if (mv > 0) {
                        output = (parseFloat(s) / mv) * 100;
                    }
                } else {
                    //score type details
                    if (mv > 0) {
                        const gbst = vm.gbScoreTypeLookup(thisAssignment.gradeBookScoreTypeId());
                        const stDetail = DevExpress.data.query(gbst.details())
                            .filter([['score', '=', s]])
                            .toArray();
                        if (stDetail.length > 0) {
                            let value = stDetail[0].value();
                            output = (parseFloat(value) / gbst.max()) * 100;
                        } else {
                            if (isNaN(parseFloat(s)) === false) {
                                output = (parseFloat(s) / gbst.max()) * 100;
                            }
                        }
                    }
                }
                if (ppct > 0) {
                    output = output * ((100 - ppct) / 100);
                }
                return output;
            });

            thisAssignment.points = ko.pureComputed(function () {
                //points are computed based on calcValue
                let output = 0;
                const pp = thisAssignment.pointsPossible();
                const cv = thisAssignment.calcValue();
                if (cv > 0) {
                    output = pp * (cv / 100);
                }
                return output;
            });

            thisAssignment.assignmentAffectsClassGrade = ko.pureComputed(function () {
                const cat = thisAssignment.gradeBookCategoryId();
                const p = thisAssignment.points();
                const pp = thisAssignment.pointsPossible();
                const ifg = thisAssignment.isForGrading();
                const s = thisAssignment.score();
                const dst = thisAssignment.dropScoreText();
                const e = thisAssignment.excused();
                let output = ((cat === 1 && pp > 0) || (cat === 2 && p > 0)) &&
                    ifg &&
                    s !== '' &&
                    s !== null &&
                    dst !== 'Dropped' &&
                    dst !== 'Not Weighted' &&
                    e === false;
                return output;
            });

            thisAssignment.analysisBandItem = ko.pureComputed(function () {
                const bandId = thisAssignment.analysisBandId();
                const band = self.analysisBandLookup(bandId);
                //const acg = thisAssignment.assignmentAffectsClassGrade();
                const p = thisAssignment.points();
                const pp = thisAssignment.pointsPossible();
                if (band !== null && pp > 0) {
                    const mv = band.maxValue();
                    const value = p / pp * mv;
                    const bandItem = band.getBandDetailItem(value);
                    return ko.toJS(bandItem);
                }
                return null;
            });

            thisAssignment.dropped = ko.pureComputed(function () {
                return thisAssignment.dropScoreText() === 'Dropped';
            });

            thisAssignment.resolvedFinalGrade = ko.pureComputed(function () {
                return self.helpers.getMark(thisAssignment.calcValue(), thisAssignment.reportCardScoreTypeId());
            });

            let setScore_Internal = function (rawInputValue) {
                if (self.outputLog) { console.log('assignment.setScore:' + rawInputValue); };
                var VS = self.helpers.validateUpdateInput(rawInputValue, thisAssignment);
                if (self.outputLog) { console.log('assignment.setScore.validateUpdateInput->', VS); };
                if (VS.isValid === true) {
                    //set the valid values to the object
                    let newScore = VS.ValidScore.toString();
                    if (VS.ValidCommentCode !== '') {
                        thisAssignment.commentCode(VS.ValidCommentCode);
                        thisAssignment.isGradeBookMissingMark(VS.isGradeBookMissingMark);
                    }
                    if (VS.removeWhenScored === true && newScore !== '') {
                        thisAssignment.commentCode('');
                        thisAssignment.isGradeBookMissingMark(false);
                    }
                    thisAssignment.penaltyPct(VS.penaltyPct);
                    if (VS.ValidExcValue !== '') {
                        thisAssignment.excused(VS.ValidExcValue);
                    }
                    if (VS.commentAssignmentValue && VS.commentAssignmentValue !== '' && newScore === '') {
                        if (VS.commentAssignmentValueIsPercent === true) {
                            newScore = self.helpers.roundPlaces(parseFloat(thisAssignment.maxValue() * (parseFloat(VS.commentAssignmentValue) / 100)), 2).toString();
                        } else {
                            newScore = self.helpers.roundPlaces(parseFloat(VS.commentAssignmentValue), 2).toString();
                        }
                    }
                    //now set the score unless they are not allowing scores.
                    if (self.standardsModeAssignmentScorePreference() === 'NoScoreForAssignment') {
                        newScore = '';
                    }
                    thisAssignment.score(newScore);
                    //do the recalculation now
                    thisAssignment.scoreDataChanged();
                }
                return VS;
            };

            //allow updates
            thisAssignment.setScore = function (rawInputValue) {
                return setScore_Internal(rawInputValue);
            };

            //data check
            if (data.gradeBookScoreTypeId <= 0) {
                console.error('assignment without valid score type! gbid: ' + data.gradeBookId);
            }

            thisAssignment.scoreDataChanged = function () {
                app.topic('studentAssignmentScoreChanged').publish(thisAssignment);
            };

        };

        var measureTypeGradeKey = function (asgn, vm) {
            return asgn.studentId() + '_' + asgn.measureTypeId();
        };

        var measureTypeGrade = function (data, vm) {
            var mtg = this;
            mtg.studentId = ko.observable(-1);
            mtg.measureTypeId = ko.observable(-1);
            mtg.measureTypeWeight = ko.observable(0);
            mtg.assignmentCount = ko.observable(0);
            mtg.points = ko.observable(0);
            mtg.pointsPossible = ko.observable(0);
            mtg.reportCardScoreTypeId = ko.observable(-1);
            mtg.incompleteAssignments = ko.observable(0);

            ko.mapping.fromJS(data, {}, mtg);

            mtg.markPercentage = ko.pureComputed(function () {
                const wp = mtg.weightedPercentage();
                return self.helpers.markValue(wp);
            });
            mtg.calculatedMark = ko.pureComputed(function () {
                return self.helpers.calculateAssignmentAreaGrade(mtg);
            });
            mtg.weightedPercentage = ko.pureComputed(function () {
                const points = mtg.points();
                const pointsPossible = mtg.pointsPossible();
                const assignmentAreaWeight = mtg.measureTypeWeight();
                return self.helpers.calculateAssignmentAreaPercentage(points, pointsPossible, assignmentAreaWeight);
            });
            mtg.weightedPercentageBase100 = ko.pureComputed(function () {
                const points = mtg.points();
                const pointsPossible = mtg.pointsPossible();
                return self.helpers.calculateAssignmentAreaPercentage(points, pointsPossible, 100);
            });
        };

        var classGradeKey = function (mtg, vm) {
            return mtg.studentId();
        };

        var classGrade = function (data, isTermWeightingPeriod, vm) {
            var cg = this;
            cg.studentId = ko.observable(-1);
            cg.assignmentCount = ko.observable(0);

            cg.points = ko.observable(0);
            cg.pointsPossible = ko.observable(0);

            cg.totalWeightedPercentage = ko.observable(0);
            cg.totalAssignmentWeight = ko.observable(0);

            cg.incompleteAssignments = ko.observable(0);
            cg.reportCardScoreTypeId = ko.observable(-1);
            cg.forceUseWeighting = ko.observable(false);
            cg.lockScore = ko.observable(false);
            cg.base100MarkPercentage = ko.observable(0);

            ko.mapping.fromJS(data, {}, cg);

            cg.markPercentage = ko.pureComputed(function () {
                return self.helpers.markValue(cg.weightedPercentage());
            });

            cg.weightedPercentage = ko.pureComputed(function () {
                const st = self.rcScoreTypeLookup(cg.reportCardScoreTypeId());
                if (st === undefined) { throw 'Report Card Score Type ' + cg.reportCardScoreTypeId() + ' is not available to weightedPercentage.'; }
                const max = st.max();
                let returnValue = 0;
                if ((self.isAssignmentWeightingOn() === true || cg.forceUseWeighting() === true) && isTermWeightingPeriod !== true) {
                    const wp = cg.totalWeightedPercentage();
                    const mtw = cg.totalAssignmentWeight();
                    if (mtw > 0) {
                        returnValue = (wp / mtw) * max;
                        cg.base100MarkPercentage(self.helpers.markValue((wp / mtw) * 100));
                    }
                } else {
                    const p = cg.points();
                    const pp = cg.pointsPossible();
                    if (pp > 0) {
                        returnValue = (p / pp) * max;
                        cg.base100MarkPercentage(self.helpers.markValue((p / pp) * 100));
                    }
                }
                return returnValue;
            });

            cg.calculatedMark = ko.pureComputed(function () {
                if (cg.pointsPossible() === 0) {
                    return "N/A";
                }
                return self.helpers.getMark(cg.base100MarkPercentage(), cg.reportCardScoreTypeId());
            });

            var _manualMark = '';
            if (data.manualMark) { _manualMark = data.manualMark; }
            cg.manualMark = ko.pureComputed({
                read: function () {
                    if (cg.lockScore() === true) {
                        return _manualMark;
                    }
                    return cg.calculatedMark();
                },
                owner: cg
            });


        };

        var unitSummary = function (data, vm) {
            var us = this;
            us.studentId = ko.observable(-1);
            us.assignmentCount = ko.observable(0);
            us.points = ko.observable(0);
            us.pointsPossible = ko.observable(0);
            us.reportCardScoreTypeId = ko.observable(-1);
            us.incompleteAssignments = ko.observable(0);
            us.totalWeightedPercentage = ko.observable(0);
            us.totalAssignmentWeight = ko.observable(0);

            ko.mapping.fromJS(data, {}, us);

            us.scoreTypeMaxValue = ko.pureComputed(function () {
                let scoreType = self.rcScoreTypeLookup(us.reportCardScoreTypeId());
                if (scoreType === undefined) { throw 'Report Card Score Type ' + us.reportCardScoreTypeId() + ' is not available to unitSummary object.'; }
                return scoreType.max();
            });

            us.markPercentage = ko.pureComputed(function () {
                const calcValue = us.calcValue();
                return self.helpers.markValue(calcValue);
            });

            us.calculatedMark = ko.pureComputed(function () {
                const calcValue = us.calcValue();
                if (calcValue === 0) {
                    return "N/A";
                }
                return self.helpers.getMark(us.calcValue(), us.reportCardScoreTypeId());
            });

            us.calcValue = ko.pureComputed(function () {
                const wp = us.totalWeightedPercentage();
                const mtw = us.totalAssignmentWeight();
                const points = us.points();
                const pointspossible = us.pointsPossible();
                let returnValue = 0;
                if (mtw > 0) {
                    returnValue = (wp / mtw) * 100;
                }
                if (self.measureTypeTotalWeight() == 0 && pointspossible > 0) {
                    returnValue = (points / pointspossible) * 100;
                }
                return self.helpers.roundValue(returnValue);
            });

        };

        var analysisBand = function (data, vm) {
            var ab = this;
            //map all the properties from the server
            ko.mapping.fromJS(data, {}, ab);

            ab.getBandDetailItem = function (value) {
                const normValue = value / 100 * ab.maxValue();
                const items = ab.details();
                var theItem = DevExpress.data.query(items)
                    .filter([['lowScore', '<=', normValue], 'and', ['highScore', '>=', normValue]])
                    .toArray();
                return theItem[0];

            };

        };

        var studentStandardEvidence = function (data, vm) {
            var thisStandard = this;

            ko.mapping.fromJS(data, {}, thisStandard);


            thisStandard.gradeBookScoreType = ko.pureComputed(function () {
                return self.gbScoreTypeLookup(thisStandard.gradeBookScoreTypeId());
            });

            thisStandard.value = ko.pureComputed(function () {
                return (thisStandard.calcValue()) / 100 * thisStandard.maxValue();
            });

            thisStandard.calcValue = ko.pureComputed(function () {
                let s = thisStandard.score(); if (s === undefined || s === null) { s = ''; }
                const st = thisStandard.gradeBookScoreTypeId();
                const mv = thisStandard.maxValue();
                let output = 0;
                if (s.length === 0) { return 0; }
                if (st === 1) {
                    //PERCENTAGE
                    output = parseFloat(s);
                } else if (st === 2) {
                    //RAW SCORE
                    if (mv > 0) {
                        output = (parseFloat(s) / mv) * 100;
                    }
                } else {
                    //score type details
                    if (mv > 0) {
                        const gbst = vm.gbScoreTypeLookup(thisStandard.gradeBookScoreTypeId());
                        const stDetail = DevExpress.data.query(gbst.details())
                            .filter([['score', '=', s]])
                            .toArray();
                        if (stDetail.length > 0) {
                            let value = stDetail[0].value();
                            output = (parseFloat(value) / gbst.max()) * 100;
                        }
                    }
                }
                return output;
            });

            thisStandard.points = ko.pureComputed(function () {
                //points are computed based on calcValue
                let output = 0;
                const pp = thisStandard.maxValue();
                const cv = thisStandard.calcValue();
                if (cv > 0) {
                    output = pp * (cv / 100);
                }
                return output;
            });

            thisStandard.analysisBandItem = ko.pureComputed(function () {
                const bandId = thisStandard.analysisBandId();
                const band = self.analysisBandLookup(bandId);
                const cv = thisStandard.calcValue();
                if (band !== null) {
                    const bandItem = band.getBandDetailItem(cv);
                    return ko.toJS(bandItem);
                }
                return null;
            });

            thisStandard.scoreDataChanged = function () {
                app.topic('studentAssignmentStandardScoreChanged').publish(thisStandard);
            };

            let setScore_Internal = function (rawInputValue) {
                if (self.outputLog) { console.log('studentStandardEvidence.setScore:' + rawInputValue); };
                var VS = self.helpers.validateUpdateInput(rawInputValue, thisStandard);
                if (self.outputLog) { console.log('studentStandardEvidence.setScore.validateUpdateInput->', VS); };
                if (VS.isValid === true) {
                    //set the valid values to the object
                    let newScore = VS.ValidScore.toString();
                    //now set the score
                    thisStandard.score(newScore);
                    //set the excused state
                    thisStandard.excused(VS.ValidExcValue);
                    //do the recalculation now
                    thisStandard.scoreDataChanged();
                }
                return VS;
            };

            //allow updates
            thisStandard.setScore = function (rawInputValue) {
                return setScore_Internal(rawInputValue);
            };

        };

    };

    return new calcs();

});