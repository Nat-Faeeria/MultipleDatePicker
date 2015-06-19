/*
 Creator: Maelig GOHIN For ARCA-Computing - www.arca-computing.fr
 Creation date: July 2014
 Version: 1.2

 Description:  MultipleDatePicker is an Angular directive to show a simple calendar allowing user to select multiple dates.
 Css style can be changed by editing less or css stylesheet.
 See scope declaration below for options you can pass through html directive.
 Feel free to edit and share this piece of code, our idea is to keep it simple ;)
 */
angular.module('multipleDatePicker', [])
    .directive('multipleDatePicker', ['$log', function ($log) {
        "use strict";
        return {
            restrict: 'AE',
            scope: {
                /*
                 * DEPRECATED : use dayClick
                 * Type: function(timestamp, boolean)
                 * Will be called when un/select a date
                 * Param timestamp will be the date at midnight
                 * */
                callback: '&',
                dayClick: '=?',
                dayHover: '=?',
                /*
                 * Type: function(newMonth, oldMonth)
                 * Will be called when month changed
                 * Param newMonth/oldMonth will be the first day of month at midnight
                 * */
                monthChanged: '=?',
                /*
                 * Type: array of milliseconds timestamps
                 * Days already selected
                 * */
                daysSelected: '=?',
                /*
                 * Type: array of integers
                 * Recurrent week days not selectables
                 * /!\ Sunday = 0, Monday = 1 ... Saturday = 6
                 * */
                weekDaysOff: '=?',
                /*
                 * DEPRECATED : use highlightDays
                 * Type: array of milliseconds timestamps
                 * Days not selectables
                 * */
                daysOff: '=?',
                /*
                 * Type: array of objects cf doc
                 * Days highlights
                 * */
                highlightDays: '=?',
                /*
                 * Type: boolean
                 * Set all days off
                 * */
                allDaysOff: '=?',
                /*
                 * Type: boolean
                 * Sunday be the first day of week, default will be Monday
                 * */
                sundayFirstDay: '=?',
                /*
                 * Type: boolean
                 * if true can't go back in months before today's month
                 * */
                disallowBackPastMonths: '=',
                /*
                 * Type: boolean
                 * if true can't go in futur months after today's month
                 * */
                disallowGoFuturMonths: '=',

                ngModel: '=',

                format: '=?'

            },
            template: '<div class="multiple-date-picker">' +
                '<div class="picker-top-row">' +
                '<div class="text-center picker-navigate picker-navigate-left-arrow" ' +
                'ng-class="{\'disabled\':disableBackButton, \'highlighted\' : highlightedPrev}" ng-click="previousMonth()"><i class="fa fa-fw fa-arrow-left"></i></div>' +
                '<div class="text-center picker-month">{{month.format(\'MMMM YYYY\')}}</div>' +
                '<div class="text-center picker-navigate picker-navigate-right-arrow" ' +
                'ng-class="{\'disabled\':disableNextButton, \'highlighted\' : highlightedNext}" ng-click="nextMonth()"><i class="fa fa-fw fa-arrow-right"></i></div>' +
                '</div>' +
                '<div class="picker-days-week-row">' +
                '<div class="text-center" ng-repeat="day in daysOfWeek">{{day}}</div>' +
                '</div>' +
                '<div class="picker-days-row">' +
                '<div class="text-center picker-day picker-empty" ng-repeat="x in emptyFirstDays">&nbsp;</div>' +
                '<div class="text-center picker-day {{day.css}}" title="{{day.title}}" ng-repeat="day in days" ng-click="toggleDay($event, day)" ng-mouseover="hoverDay($event, day)" ng-mouseleave="dayHover($event, day)" ng-class="{\'picker-selected\':day.selected, \'picker-off\':!day.selectable, \'today\':day.today}">{{day ? day.format(\'D\') : \'\'}}</div>' +
                '<div class="text-center picker-day picker-empty" ng-repeat="x in emptyLastDays">&nbsp;</div>' +
                '</div>' +
                '</div>',
            link: function (scope) {

                /*utility functions*/
                var checkNavigationButtons = function () {
                        var today = moment().format(scope.format),
                            previousMonth = moment(scope.month,scope.format).subtract(1, 'month'),
                            nextMonth = moment(scope.month,scope.format).add(1, 'month');
                        scope.disableBackButton = scope.disallowBackPastMonths && today.isAfter(previousMonth, 'month');
                        scope.disableNextButton = scope.disallowGoFuturMonths && today.isBefore(nextMonth, 'month');

                        var lastDay = scope.convertedDaysSelected[scope.convertedDaysSelected.length - 1],
                            firstDay = scope.convertedDaysSelected[0];

                        scope.highlightNav = scope.autoHighlightNav || scope.highlightNav;


                        scope.highlightedPrev = scope.highlightNav &&
                            (previousMonth.isAfter(firstDay, 'month') || previousMonth.isSame(firstDay, 'month')) && !angular.isUndefined(firstDay);
                        scope.highlightedNext = scope.highlightNav &&
                            (nextMonth.isBefore(lastDay, 'month') || nextMonth.isSame(lastDay, 'month')) && !angular.isUndefined(lastDay);

                    },
                    getDaysOfWeek = function () {
                        /*To display days of week names in moment.lang*/
                        var momentDaysOfWeek = moment().localeData()._weekdaysMin,
                            days = [];

                        for (var i = 1; i < 7; i++) {
                            days.push(momentDaysOfWeek[i]);
                        }

                        if (scope.sundayFirstDay) {
                            days.splice(0, 0, momentDaysOfWeek[0]);
                        } else {
                            days.push(momentDaysOfWeek[0]);
                        }

                        return days;
                    };

                /*scope functions*/
                scope.$watch('daysSelected', function (newValue) {
                    console.log("daysSelected");
                    if (newValue) {
                        var momentDates = [];
                        newValue.sort().map(function (timestamp) {
                            momentDates.push(moment(timestamp));
                        });

                        scope.convertedDaysSelected = momentDates;
                        scope.generate();
                    }
                }, true);

                scope.$watch('monthPresented', function (value) {
                    scope.month = moment(value).startOf('month');
                    scope.generate();
                }, true);

                scope.$watch('weekDaysOff', function () {
                    scope.generate();
                }, true);

                scope.$watch('daysOff', function (value) {
                    if (value !== undefined) {
                        $log.warn('daysOff option deprecated since version 1.1.6, please use highlightDays');
                    }
                    scope.generate();
                }, true);

                scope.$watch('allDaysOff', function () {
                    scope.generate();
                }, true);


                //default values
                scope.month = scope.month || moment().startOf('day');
                scope.days = [];
                scope.convertedDaysSelected = scope.convertedDaysSelected || [];
                scope.weekDaysOff = scope.weekDaysOff || [];
                scope.daysOff = scope.daysOff || [];
                scope.disableBackButton = false;
                scope.disableNextButton = false;
                scope.daysOfWeek = getDaysOfWeek();
                scope.format= scope.format || "DD/MM/YYYY";


                scope.$watch('ngModel', function(){
                    scope.convertedDaysSelected=[];
                    scope.ngModel.forEach(function(elt){
                        scope.convertedDaysSelected.push(moment(elt,scope.format));
                    });
                    scope.generate();
                });


                /**
                 * Called when user clicks a date
                 * @param Event event the click event
                 * @param Moment momentDate a moment object extended with selected and isSelectable booleans
                 * @see #momentDate
                 * @callback dayClick
                 * @callback callback deprecated
                 */
                scope.toggleDay = function (event, momentDate) {
                    event.preventDefault();

                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayClick == 'function') {
                        scope.dayClick(event, momentDate);
                    }

                    if (momentDate.selectable && !prevented) {
                        momentDate.selected = !momentDate.selected;

                        if (momentDate.selected) {
                            scope.convertedDaysSelected.push(momentDate.format(scope.format));
                        } else {
                            scope.convertedDaysSelected = scope.convertedDaysSelected.filter(function (date) {
                                return date.valueOf() !== momentDate.valueOf();
                            });
                        }
                    }
                    var formatedMoments = [];
                    scope.convertedDaysSelected.forEach(function(elt){
                        if(typeof elt === "object") {
                            formatedMoments.push(elt._i);
                        } else {
                            formatedMoments.push(elt);
                        }
                    });

                    formatedMoments=formatedMoments.sort(function(a,b){
                        var el1 = a.split("/"), el2 = b.split("/");
                        if (el1[0]>el2[0]){
                            return 1;
                        }
                        return -1;
                    });
                    formatedMoments=formatedMoments.sort(function(a,b){
                        var el1 = a.split("/"), el2 = b.split("/");
                        if (el1[1]>el2[1]){
                            return 1;
                        }
                        return -1;
                    });
                    formatedMoments=formatedMoments.sort(function(a,b){
                        var el1 = a.split("/"), el2 = b.split("/");
                        if (el1[2]>el2[2]){
                            return 1;
                        }
                        return -1;
                    });

                    scope.ngModel=[].concat(formatedMoments);

                };

                /**
                 * Hover day
                 * @param Event event
                 * @param Moment day
                 */
                scope.hoverDay = function (event, day) {
                    event.preventDefault();
                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayHover == 'function') {
                        scope.dayHover(event, day);
                    }

                    if (!prevented) {
                        day.hover = event.type === 'mouseover' ? true : false;
                    }
                };

                /*Navigate to previous month*/
                scope.previousMonth = function () {
                    if (!scope.disableBackButton) {
                        var oldMonth = moment(scope.month,scope.format);
                        scope.month = scope.month.subtract(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Navigate to next month*/
                scope.nextMonth = function () {
                    if (!scope.disableNextButton) {
                        var oldMonth = moment(scope.month,scope.format);
                        scope.month = scope.month.add(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Check if the date is off : unselectable*/
                scope.isDayOff = function (scope, date) {
                    return scope.allDaysOff ||
                        (angular.isArray(scope.weekDaysOff) && scope.weekDaysOff.some(function (dayOff) {
                            return date.day() === dayOff;
                        })) ||
                        (angular.isArray(scope.daysOff) && scope.daysOff.some(function (dayOff) {
                            return date.isSame(dayOff, 'day');
                        })) ||
                        (angular.isArray(scope.highlightDays) && scope.highlightDays.some(function (highlightDay) {
                            return date.isSame(highlightDay.date, 'day') && !highlightDay.selectable;
                        }));
                };

                /*Check if the date is selected*/
                scope.isSelected = function (scope, date) {
                    return scope.convertedDaysSelected.some(function (d) {
                        return date.isSame(d, 'day');
                    });
                };

                /*Generate the calendar*/
                scope.generate = function () {
                    var previousDay = moment(scope.month,scope.format).date(0),
                        firstDayOfMonth = moment(scope.month,scope.format).date(1),
                        days = [],
                        now = moment().format(scope.format),
                        lastDayOfMonth = moment(firstDayOfMonth,scope.format).endOf('month'),
                        maxDays = lastDayOfMonth.date();

                    var createDate = function(){
                        var date = moment(previousDay.add(1, 'days'),scope.format);
                        if(angular.isArray(scope.highlightDays)){
                            var hlDay = scope.highlightDays.filter(function(d){
                                return date.isSame(d.date, 'day');
                            });
                            date.css = hlDay.length > 0 ? hlDay[0].css : '';
                            date.title = hlDay.length > 0 ? hlDay[0].title : '';
                        }
                        date.selectable = !scope.isDayOff(scope, date);
                        date.selected = scope.isSelected(scope, date);
                        date.today = date.isSame(now, 'day');
                        return date;
                    };

                    scope.emptyFirstDays = [];

                    var emptyFirstDaysStartIndex;
                    if (firstDayOfMonth.day() === 0) {
                        emptyFirstDaysStartIndex = scope.sundayFirstDay ? 0 : 6;
                    } else {
                        emptyFirstDaysStartIndex = firstDayOfMonth.day() - (scope.sundayFirstDay ? 0 : 1);
                    }
                    for (var i = emptyFirstDaysStartIndex; i > 0; i--) {
                        scope.emptyFirstDays.push({});
                    }

                    for (var j = 0; j < maxDays; j++) {
                        days.push(createDate());
                    }

                    scope.emptyLastDays = [];
                    var emptyLastDaysStartIndex = scope.sundayFirstDay ? 6 : 7;
                    if (lastDayOfMonth.day() === 0 && !scope.sundayFirstDay) {
                        emptyLastDaysStartIndex = 0;
                    } else {
                        emptyLastDaysStartIndex -= lastDayOfMonth.day();
                    }
                    for (var k = emptyLastDaysStartIndex; k > 0; k--) {
                        scope.emptyLastDays.push({});
                    }
                    scope.days = days;
                    checkNavigationButtons();
                };

                scope.generate();
            }
        };
    }]);
