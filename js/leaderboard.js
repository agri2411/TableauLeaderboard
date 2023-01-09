'use strict';

(function() {

    let worksheet = null;
    let unregisterHandlerFunctions = [];

    $(document).ready(function() {

        tableau.extensions.initializeAsync({
            'configure': configure
        }).then(function() {

            loadData();

        }, function() {
            console.log('Error while Initializing: ' + err.toString());
        });
    });

    function fetchFilters() {

        unregisterHandlerFunctions.forEach(function(unregisterHandlerFunction) {
            unregisterHandlerFunction();
        });

        const dashboard = tableau.extensions.dashboardContent.dashboard;
        dashboard.worksheets.forEach(function(worksheet) {
            let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
            unregisterHandlerFunctions.push(unregisterHandlerFunction);
        });

    }

    function filterChangedHandler(filterEvent) {
        $('#contentWrapper').html(" ");
        $('#totalRow').html(" ");
        loadData();
        fetchFilters();
    }


    function getSettings() {

        var dashboard = tableau.extensions.dashboardContent.dashboard;
        const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

        var sheetName = tableau.extensions.settings.get("worksheet");
        if (sheetName == undefined || sheetName == "" || sheetName == null) {
            $("#configure").show();
            $("#contentWrapper").html("");
            //loadData();
            return;
        } else {

            // If a worksheet is selected, then we hide the configuration screen.
            $("#configure").hide();
        }

        // Use the worksheet name saved in the Settings to find and return
        // the worksheet object.
        worksheet = worksheets.find(function(sheet) {
            return sheet.name === sheetName;
        });
    }

    function loadData() {

        getSettings()
        fetchFilters();
        var underlying = tableau.extensions.settings.get("underlying");
        var max_no_records = tableau.extensions.settings.get("max_no_records"),
            category, measure, rank;

        if (underlying == 1) {
            worksheet.getUnderlyingDataAsync({
                maxRows: max_no_records
            }).then(function(underlying) {

                var data = [];
                var column_names = tableau.extensions.settings.get("column_names").split("|");
                for (i = 0; i < column_names.length; i++) {
                    data.push({
                        title: column_names[i]
                    });
                }
                const worksheetData = underlying.data;
                var column_order = tableau.extensions.settings.get("column_order").split("|");
                var tableData = makeArray(underlying.columns.length, underlying.totalRowCount);
                for (var i = 0; i < tableData.length; i++) {
                    for (var j = 0; j < tableData[i].length; j++) {
                        // you can get the value or formatted value

                        tableData[i][j] = worksheetData[i][column_order[j] - 1].formattedValue;
                    }
                }

            })
        } else {
            worksheet.getSummaryDataAsync({
                maxRows: max_no_records
            }).then(function(sumdata) {


                var enableLeaderboardTotal = tableau.extensions.settings.get("leaderboardTotal");
                var data = [];
                var column_names = tableau.extensions.settings.get("column_names").split("|");
                for (i = 0; i < column_names.length; i++) {
                    data.push({
                        title: column_names[i]
                    });
                }
                const worksheetData = sumdata.data;
                var column_order = tableau.extensions.settings.get("column_order").split("|");
                var tableData = makeArray(sumdata.columns.length, sumdata.totalRowCount);

                if (enableLeaderboardTotal == 'Y') {
                    $('#contentWrapper').hide();
                    for (var i = 0; i < 1; i++) {

                        var dataArr =   (typeof(worksheetData[i]) === "undefined") ? 0 : worksheetData[i],
                            slanotper =  (typeof(dataArr[0]) === "undefined" || (dataArr[0]) == 0) ? 0 : dataArr[0].formattedValue,
                            slaper  =    (typeof(dataArr[1]) === "undefined" || (dataArr[1]) == 0) ? 0 : dataArr[1].formattedValue,
                            totallbl = (typeof(dataArr[2]) === "undefined" || (dataArr[2]) == 0) ? 0 : dataArr[2].formattedValue,
                            slaLbl =    (typeof(dataArr[3]) === "undefined" || (dataArr[3]) == 0) ? 0 : dataArr[3].formattedValue,
                            slanotLbl =    (typeof(dataArr[4]) === "undefined" || (dataArr[4]) == 0) ? 0 : dataArr[4].formattedValue;

                        $('.totalWrapper').remove();
                        var mainDiv = $("<div>", {
                            id: 'totalWrapper' + i,
                            html: "",
                            class: "totalWrapper"
                        });
                        $("<div/>", {
                            id: "row" + i + "colWrapper",
                            html: "",
                            class: "totalContentWrapper"
                        }).appendTo($(mainDiv));


                        $("<div/>", {
                            id: "row" + i + "col1",
                            html: "<div> <span style='font-size:14px;'>Total</span></div> <div> <span id='totalLbl' class='slaFont'>" + totallbl + "</span></div>",
                            class: "countWrapper"
                        }).appendTo($(mainDiv));

                        $("<div/>", {
                            id: "row" + i + "col1",
                            html: "<div> <span style='font-size:14px;'>Within SLA</span></div> <div> <span id='slaLbl' class='slaFont'>" + slanotLbl + "<span class='slaPerFont'> (" +slanotper+ "%)</span></span></div>",
                            class: "slaWrapper"
                        }).appendTo($(mainDiv));

                        $("<div/>", {
                            id: "row" + i + "col1",
                            html: "<div> <span style='font-size:14px;'>SLA Breached</span></div> <div> <span id='slanotLbl' class='slaFont'>" + slaLbl + "<span class='slaPerFont'> (" +slaper+ "%)</span></span></div>",
                            class: "notslaWrapper"
                        }).appendTo($(mainDiv));

                        $(mainDiv).appendTo("#totalRow");

                    }
                } else {
                    $('#totalRow').hide();
                     $('.wigdetContent').remove();
                    $("<div/>", {
                        html: "",
                        class: "wigdetContent"
                    }).prependTo("#contentWrapper");


                    var mainDiv = $("<div>", {
                        html: "",
                        class: "tableHeader"
                    })

                    $("<span/>", {
                        id: "leaderboardTitle",
                        html: "",
                        class: "tableHeadWrapper"
                    }).appendTo($(mainDiv));

                    $(mainDiv).prependTo(".wigdetContent");

                    $("<div/>", {
                        style: "width:100%;  background-color:#fff",
                        html: "",
                        class: "tableContent"
                    }).appendTo(".wigdetContent");

                    $("<div/>", {
                        html: "",
                        class: "toptableContent"
                    }).insertAfter(".tableHeader");
                    //for (var i = 0; i < tableData.length; i++) {
                    for (var i = 0; i < 5; i++) {
                        //for (var j = 0; j < tableData[i].length; j++) {
                        var dataArr =   (typeof(worksheetData[i]) === "undefined") ? 0 : worksheetData[i];
                            category =  (typeof(dataArr[0]) === "undefined" || (dataArr[0]) == 0) ? ' ' : dataArr[0].formattedValue,
                            rank =      (typeof(dataArr[1]) === "undefined" || (dataArr[1]) == 0) ? 0 : dataArr[1].formattedValue,
                            measure =   (typeof(dataArr[2]) === "undefined" || (dataArr[2]) == 0) ? ' ' : dataArr[2].formattedValue;

                        if (i == 0) {

                            var mainDiv = $("<div>", {
                                id: 'row' + i,
                                style: "width:100%; height:60px;",
                                html: "",
                                class: "rowWrapper"
                            })

                            $("<div/>", {
                                id: "row" + i + "col2",
                                style: "float:left; width:55%;",
                                html: "<span class='topperName'>" + category + "</span>",
                                class: "rowContent2"
                            }).appendTo($(mainDiv));

                            $("<div/>", {
                                id: "row" + i + "col3",
                                style: "float:left; width:25%;",
                                html: "<span class='topScore'>" + measure + "</span>",
                                class: "rowContent3"
                            }).appendTo($(mainDiv));

                            var tropyImg = (rank == 0) ? "rowContent4" : "rowContent4 trophyTop";
                            $("<div/>", {
                                id: "row" + i + "col4",
                                style: "float:left; width:10%;",
                                html: "",
                                class: tropyImg
                            }).appendTo($(mainDiv));

                            $(mainDiv).appendTo(".toptableContent");
                        } else {
                            var mainDiv = $("<div>", {
                                id: 'row' + i,
                                style: "width:100%; height:40px; border-bottom:1px solid #d1d1d1;",
                                html: "",
                                class: "rowWrapper"
                            })

                            var rankLabel = (rank == 0) ? ' ' : (rank == 2) ? 'nd' : (rank == 3) ? 'rd' : 'th';
                            var rankElem = (rank == 0) ? ' ' : rank
                            $("<div/>", {
                                id: "row" + i + "col1",
                                style: "float:left; width:10%; position: relative;left: 5px;",
                                html: "<span class='rank rankFont'>" + rankElem + "</span><span class='rankFont' style='font-size:10px;'>" + rankLabel + "<span>",
                                class: "rowContent1"
                            }).appendTo($(mainDiv));

                            $("<div/>", {
                                id: "row" + i + "col2",
                                style: "float:left; width:45%; position: relative;left: 5px;",
                                html: "<span class='memberName'>" + category + "</span>",
                                class: "rowContent2"
                            }).appendTo($(mainDiv));

                            $("<div/>", {
                                id: "row" + i + "col3",
                                style: "float:left; width:20%;",
                                html: "<span class='score'>" + measure + "</span>",
                                class: "rowContent3"
                            }).appendTo($(mainDiv));

                            var tropyImg = (rank == 0) ? "rowContent4" : (rank >= 1 && rank <= 2) ? "rowContent4 trophySecond" : (rank == 3) ? "rowContent4 trophyThird" : "rowContent4 trophyOthers";
                            $("<div/>", {
                                id: "row" + i + "col4",
                                style: "float:left; width:10%;",
                                html: "",
                                class: tropyImg
                            }).appendTo($(mainDiv));

                            $(mainDiv).appendTo(".tableContent");
                        }
                    }
                }

                var titleTab = tableau.extensions.settings.get("headerTitle");
                if (titleTab != undefined && titleTab.length > 0)
                    $("#leaderboardTitle").html(titleTab)

                var titleColor = tableau.extensions.settings.get("titleBg");
                if (titleColor != undefined && titleColor.length > 0)
                    $(".tableHeader").css("background-color", titleColor)

                var rowColor = tableau.extensions.settings.get("rowBg");
                if (rowColor != undefined && rowColor.length > 0)
                    $(".toptableContent").css("background-color", rowColor)

            })
        }
    }


    function makeArray(d1, d2) {
        var arr = new Array(d1),
            i, l;
        for (i = 0, l = d2; i < l; i++) {
            arr[i] = new Array(d1);
        }
        return arr;
    }

    function configure() {

        const popupUrl = `${window.location.origin}/Tutorial/leaderboard/dialog.html`;

        let input = "";

        tableau.extensions.ui.displayDialogAsync(popupUrl, input, {
            height: 540,
            width: 800
        }).then((closePayload) => {
            // The close payload is returned from the popup extension via the closeDialog method.
            $('#interval').text(closePayload);
        }).catch((error) => {
            // One expected error condition is when the popup is closed by the user (meaning the user
            // clicks the 'X' in the top right of the dialog).  This can be checked for like so:
            switch (error.errorCode) {
                case tableau.ErrorCodes.DialogClosedByUser:
                    console.log("Dialog was closed by user");
                    break;
                default:
                    console.error(error.message);
            }
        });
    }
})();
