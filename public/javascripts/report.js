var app = new Vue({
    el: '#app',
    data: {
        data: {},
        loading: false,
        skill: '',
        difficulty: '',
        no_data: false,
        first_request_made: false,
    },
    updated: function () {
        app.initialize();
    },
    methods: {
        retrieve: function () {
            app.loading = true;
            app.no_data = false;

            const skill_id = app.skill;
            const difficulty = app.difficulty;
            $.ajax({
                type: "POST",
                url: '/report/get_report_data',
                data: {
                    skill_id: skill_id,
                    difficulty: difficulty,
                },
                success: function (data) {
                    app.data[skill_id] = {};

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
                    app.data[skill_id][difficulty] = unsorted_data.sort(function (a, b) {
                        // Turn your strings into dates, and then subtract them
                        // to get a value that is either negative, positive, or zero.
                        return a.date - b.date;
                    });

                    //calculate values
                    for (let report of app.data[skill_id][difficulty]) {
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
            if (!app.skill || !app.difficulty || !app.data[app.skill] || !app.data[app.skill][app.difficulty]) return;

            const chartData = app.data[app.skill][app.difficulty];
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
    },
    watch: {
        skill: function (newVal, oldVal) {
            if (oldVal == "" && newVal != undefined) $("#initial-option").remove();
            if (!app.difficulty) return;
            app.retrieve();
        },
        difficulty: function (newVal, oldVal) {
            if (oldVal == "" && newVal != undefined) app.first_request_made;
            if (!app.skill) return;
            app.retrieve();
        },
    },
})