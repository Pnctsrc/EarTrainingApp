var app = new Vue({
    el: '#app',
    data: {
        data: {},
        loading: false,
        skill: '',
        difficulty: '',
        no_data: false,
        first_request_made: false,
        report_overview: {},
        overview_ready: false,
        no_overview: false,
        year_list: [],
        month_list: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        retrieved_data: {},
        month_checked: '',
        year_checked: '',
    },
    created: function () {
        $.ajax({
            type: "POST",
            url: '/report/get_overview_data',
            success: function (data) {
                //group by skill
                for (let record of data) {
                    const month = Number(record.month);
                    const year = Number(record.year);
                    const skill = record.question.skill.toString();
                    const difficulty = record.question.difficulty;

                    if (!app.report_overview[skill]) app.report_overview[skill] = {};

                    if (!app.report_overview[skill][difficulty]) app.report_overview[skill][difficulty] = {};

                    if (!app.report_overview[skill][difficulty][year]) app.report_overview[skill][difficulty][year] = {};
                        
                    if (!app.report_overview[skill][difficulty][year][month]) app.report_overview[skill][difficulty][year][month] = true;
                }

                for (let skill in app.report_overview) {
                    for (let difficulty in app.report_overview[skill]) {
                        for (let year in app.report_overview[skill][difficulty]) {
                            if ($.inArray(Number(year), app.year_list) == -1) {
                                app.year_list.push(Number(year));
                            }
                        }
                    }
                }

                app.overview_ready = true;
            },
            error: function (err) {
                if (err.status != 404) {
                    window.alert(err.message);
                }
                app.no_overview = true;
            },
            dataType: 'json',
        })
    },
    updated: function () {
        app.initialize();

        //uncheck disabled radio buttons
        if ($("#month-box input:checked[type='radio'][disabled]")[0]) {
            $("#month-box input:checked[type='radio'][disabled]").prop("checked", false);
            app.month_checked = '';
        }

        if ($("#year-box input:checked[type='radio'][disabled]")[0]) {
            $("#year-box input:checked[type='radio'][disabled]").prop("checked", false);
            app.year_checked = '';
        } 
    },
    methods: {
        retrieve: function () {
            app.loading = true;
            app.no_data = false;

            //check before sending request
            if (app.data[app.skill] &&
                app.data[app.skill][app.difficulty] &&
                app.data[app.skill][app.difficulty][app.year_checked] &&
                app.data[app.skill][app.difficulty][app.year_checked][app.month_checked]) {
                app.loading = false;
                return;
            }


            const skill_id = app.skill;
            const difficulty = app.difficulty;
            const year = Number(app.year_checked);
            const month = Number(app.month_checked);
            $.ajax({
                type: "POST",
                url: '/report/get_report_data',
                data: {
                    skill_id: skill_id,
                    difficulty: difficulty,
                    year: year,
                    month: month,
                },
                success: function (data) {
                    const grouped_data = {};
                    //group by date
                    for (let report of data) {
                        const current_date_obj = new Date(report.date);
                        const current_date = report.date.split('T')[0];

                        if (!grouped_data[current_date]) {
                            grouped_data[current_date] = {
                                date: current_date_obj,
                                questions: [report],
                            }
                        } else {
                            grouped_data[current_date].questions.push(report);
                        }
                    }

                    //store data
                    const unsorted_data = [];
                    for (let grouped_report in grouped_data) {
                        unsorted_data.push(grouped_data[grouped_report]);
                    }

                    if (!app.data[skill_id]) app.data[skill_id] = {};
                    if (!app.data[skill_id][difficulty]) app.data[skill_id][difficulty] = {};
                    if (!app.data[skill_id][difficulty][year]) app.data[skill_id][difficulty][year] = {};
                    if (!app.data[skill_id][difficulty][year][month]) app.data[skill_id][difficulty][year][month] = unsorted_data.sort(function (a, b) {
                        return a.date - b.date;
                    });

                    //calculate values
                    for (let report of app.data[skill_id][difficulty][year][month]) {
                        const total = report.questions.length;

                        var perfect_count = 0;
                        for (let question_report of report.questions) {
                            if (question_report.is_perfect) perfect_count++;
                        }

                        report.average_score = (perfect_count / total).toFixed(3);
                    }

                    app.loading = false;
                    if (!app.first_request_made) app.first_request_made = true;
                },
                error: function (err) {
                    if (err.status != 404) {
                        window.alert(err.message);
                    }
                    app.no_data = true;
                    app.loading = false;
                    if (!app.first_request_made) app.first_request_made = true;
                },
                dataType: 'json',
            })
        },
        initialize: function () {
            if (!app.skill ||
                !app.difficulty ||
                !app.data[app.skill] ||
                !app.data[app.skill][app.difficulty] ||
                !app.data[app.skill][app.difficulty][app.year_checked] ||
                !app.data[app.skill][app.difficulty][app.year_checked][app.month_checked]) return;

            const chartData = app.data[app.skill][app.difficulty][app.year_checked][app.month_checked];
            const chart = AmCharts.makeChart("chartdiv", {
                type: "serial",
                addClassNames: true,
                dataProvider: chartData,
                chartScrollbar: {
                    autoGridCount: true,
                    graph: "g1",
                    scrollbarHeight: 40,
                    minimum: 10,
                },
                categoryField: "date",
                graphs: [{
                    id: "g1",
                    valueField: "average_score",
                    useNegativeColorIfDown: true,
                    balloonFunction: function (graphDataItem, graph) {
                        var value = graphDataItem.values.value;
                        return `${graphDataItem.category.toDateString().substring(4)}<br><b>Average score: ${value * 100 + "%"}<b>`;
                    },
                    bullet: "round",
                    bulletBorderAlpha: 1,
                    bulletBorderColor: "#FFFFFF",
                    hideBulletsCount: 50,
                    lineThickness: 2,
                    lineColor: "#67b7dc",
                    negativeLineColor: 'rgb(255, 158, 1)',
                }],
                chartCursor: {
                    valueLineEnabled: true,
                    valueLineBalloonEnabled: true,
                    cursorColor: 'black',
                },
                categoryAxis: {
                    parseDates: true,
                    axisAlpha: 0,
                    minHorizontalGap: 60,
                },
                valueAxes: [{
                    id: 'v1',
                    labelFunction: function (value, valueText) {
                        return Number(valueText) * 100 + "%";
                    },
                }]
            });

            chart.addListener("rendered", zoomChart);
            chart.addListener("clickGraphItem", dailyDetail);
            zoomChart();

            // this method is called when chart is first inited as we listen for "rendered" event
            function zoomChart() {
                // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
                chart.zoomToIndexes(chartData.length - 40, chartData.length - 1);
            }

            function dailyDetail() {
                console.log("clicked!");
            }
        },
        check_month: function (month) {
            if (!app.skill) return true;
            if (!app.year_checked) return true;
            if (app.report_overview[app.skill] &&
                app.report_overview[app.skill][app.difficulty] &&
                app.report_overview[app.skill][app.difficulty][app.year_checked] &&
                app.report_overview[app.skill][app.difficulty][app.year_checked][month])
                    return false;
            return true;
        },
        check_year: function (year) {
            if (!app.skill) return true;
            if (app.report_overview[app.skill] &&
                app.report_overview[app.skill][app.difficulty] &&
                app.report_overview[app.skill][app.difficulty][year])
                return false;
            return true;
        },
    },
    watch: {
        skill: function (newVal, oldVal) {
            if (oldVal == "" && newVal != undefined) $("#initial-option").remove();
            if (!app.difficulty || !app.year_checked || !app.month_checked) return;
            app.retrieve();
        },
        difficulty: function (newVal, oldVal) {
            if (oldVal == "" && newVal != undefined) app.first_request_made;
            if (!app.skill || !app.year_checked || !app.month_checked) return;
            app.retrieve();
        },
        year_checked: function () {
            if (!app.skill || !app.difficulty || !app.month_checked) return;
            app.retrieve();
        },
        month_checked: function () {
            if (!app.skill || !app.difficulty || !app.year_checked) return;
            app.retrieve();
        },
    },
})