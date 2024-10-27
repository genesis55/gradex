﻿
var DROPBOXFILESOURCEHANDLER = DROPBOXFILESOURCEHANDLER || (function () {
    var _this = this;
    var me = {}; //private objects
    var expose = {}; //public objects

    expose.StartLoadSpinner = function () {
        $("body").addClass("loading");
    };
    me.stopLoadSpinner = function () {
        $("body").removeClass("loading");
    };

    me.sourceIcon_LocalDrive = "images/PXP/filesource_LocalDrive.png";
    me.sourceIcon_GoogleDrive = "images/PXP/filesource_GoogleDrive.png";
    me.sourceIcon_OneDrive = "images/PXP/filesource_OneDrive.png";

    expose.openNewWindow = function (e, g) {
        var newWindowID = window.open('FileDownload.aspx?fdID=' + e + '&dbID=' + g, 'winName', 'height=600,width=600,resizable=1');
    }


    var LastDropboxFileSourceID = 0;

    expose.openFlexViewer = function (docID) {
        var personGU = PXP.EncryptedStudentGU;
        var l = (screen.width / 2) - ((screen.width / 1.25) / 2);
        var t = (screen.height / 2) - ((screen.height / 1.1) / 2);
        var flexPopup = window.open('PXP_FlexViewer.aspx?d=' + docID + '&k=' + personGU, 'FlexViewer', 'height=' + (screen.height / 1.1) + ',width=' + (screen.width / 1.25) + ',resizable=1');
    }


    expose.submitRemoveItem = function (e) {
        var selHidden = document.getElementById('hidRemove_' + e);
        selHidden.value = e;

        DROPBOXFILESOURCEHANDLER.StartLoadSpinner();
        document.forms['studentForm'].submit();
    }


    expose.validateUploadFile = function () {
        var uploadControl = document.getElementById('fileInput');
        if (uploadControl.value === "") {
            return false;
        }
        else {
            DROPBOXFILESOURCEHANDLER.StartLoadSpinner();
            DROPBOXFILESOURCEHANDLER.LocalFileUpload(uploadControl);
            return true;
        }
    }




    me.decodeURI = function (encodedText) {
        return decodeURIComponent(encodedText.replace(/\+/g, '%20'));
    };

    me.pickerCallBack = function (data) {
        me.clearMessages();
        var url = "";
        var $gdrive = $(".g-drive");
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            for (var i = 0; i < data[google.picker.Response.DOCUMENTS].length; i++) {
                var doc = data[google.picker.Response.DOCUMENTS][i];
                url = doc[google.picker.Document.URL];
                if (url && url.length > 0) {
                    expose.StartLoadSpinner();
                    GOOGLEDRIVEPICKER.GetFile(doc[google.picker.Document.ID], me.uploadGoogleDocument);
                }
            }
        }
    };

    me.uploadGoogleDocument = function (fileGetResponse) {
        if (fileGetResponse) {
            var jsonData = {
                fileData: JSON.stringify(fileGetResponse),
                assignmentID: PXP.GBFocus.assignmentID(),
                keyGU: $("[name='divConnectionData']").attr("studentData"),
                documentNotes: $("#txtDBoxNotes").val()
            };

            $.ajax({
                url: "Service/PXPDropBox.asmx/UploadGoogleDocument",
                data: JSON.stringify(jsonData),
                accepts: "json",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                method: "post",
                success: me.uploadDocumentSuccess,
                error: me.uploadDocumentFail
            });
        }
    };

    expose.LocalFileUpload = function (uploadControl) {
        var lfu = this;
        var progress_bar_id = "#UploadProgress";
        var progressBarStatus = $(progress_bar_id).dxProgressBar({
            min: 0,
            max: 100,
            value: 0,
            width: "100%",
            statusFormat: function (value) {
                return "Uploading: " + value * 100 + "%";
            },
            onComplete: function (e) {
                e.element.addClass("complete");
            },
            onInitialized: function (e) {
                e.element.removeClass("complete");
            }
        }).dxProgressBar("instance");

        lfu.progressHandling = function (e) {
            var percent = 0;
            var position = event.loaded || event.position;
            var total = event.total;
            if (event.lengthComputable) {
                percent = Math.ceil(position / total * 100);
            }
            progressBarStatus.option("value", percent);
        };
        for (var i = 0; i < uploadControl.files.length; i++) {
            var file = uploadControl.files[i];
            var formData = new FormData();
            // add assoc key values, this will be posts values
            formData.append("file", file, file.name);
            formData.append("assignmentID", PXP.GBFocus.assignmentID());
            formData.append("keyGU", $("[name='divConnectionData']").attr("studentData"));
            formData.append("documentNotes", encodeURIComponent($("#txtDBoxNotes").val()));
            uploadControl.value = "";

            $.ajax({
                type: "POST",
                url: "Service/PXPDropBox.asmx/UploadLocalDocument",
                xhr: function () {
                    var myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', lfu.progressHandling, false);
                    }
                    return myXhr;
                },
                success: me.uploadDocumentSuccess,
                error: me.uploadDocumentFail,
                accepts: "json",
                dataType: "json",
                contentType: false,
                async: true,
                data: formData,
                cache: false,
                processData: false,
                timeout: 60000
            });
        }
    };

    me.uploadDocumentSuccess = function (ajaxResponse) {
        var response = me.getJSONResponse(ajaxResponse);
        if (response) {
            var dropBoxGrid = $('#DropBoxGrid').data('dxDataGrid');
            if (dropBoxGrid) {
                //$(".iconColumn").closest("tr").after(me.getNewRow(result.newDocID, me.decodeURI(result.newDocName), result.newDocSize, me.decodeURI(result.newDocNotes)));
                var newRow = false;
                if (dropBoxGrid.columnCount() > 3) {
                    dropBoxGrid.addRow();
                    newRow = true;
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(0).dataField, response.newDocID);
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(1).dataField,
                        "<div><a href=\"javascript:DROPBOXFILESOURCEHANDLER.openFlexViewer(" + response.newDocID + "," + PXP.GBFocus.studentGU() + ");\"><img border=\"0\" src=\"images/PXP/viewDoc.png\" /></img></a><a href=\"javascript:DROPBOXFILESOURCEHANDLER.openNewWindow(" + response.newDocID + ", '0');\">" + response.newDocName + "</a></div>");
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(2).dataField,
                        "<div valign=\"top\"><a href=\"javascript:DROPBOXFILESOURCEHANDLER.openNewWindow(" + response.newDocID + ", '0');\">" + me.decodeURI(response.newDocNotes) + "</a></div>");
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(3).dataField,
                        "<div valign=\"top\"><a href=\"javascript:DROPBOXFILESOURCEHANDLER.openNewWindow(" + response.newDocID + ", '0');\">" + me.getCurrentDate() + "</a></div>");
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(4).dataField,
                        "<div valign=\"top\"><a href=\"javascript:DROPBOXFILESOURCEHANDLER.openNewWindow(" + response.newDocID + ", '0');\">" + Math.round((response.newDocSize / 1024)).toString() + " KB</a></div>");
                }
                if (dropBoxGrid.columnCount() > 5 && newRow) {
                    dropBoxGrid.cellValue(0, dropBoxGrid.columnOption(5).dataField,
                        "<div valign=\"top\"><div style=\"width:100%;\"><input type=\"button\" value=\"Remove\" onclick=\"DROPBOXFILESOURCEHANDLER.LocalFileRemove('" + response.newDocID + "');\"/></div><input type=\"hidden\" id=\"hidRemove_" + response.newDocID + "\" name=\"hidRemove_" + response.newDocID + "\" value=\"\" /></div>");
                }
                if (newRow) {
                    dropBoxGrid.saveEditData();
                }
            }
            $("#footerAnchor").hide();
        }
        me.stopLoadSpinner();
    };
    me.uploadDocumentFail = function (jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message) {
            message = jqXHR.responseJSON.Message;
        }
        me.setError(message);
        me.stopLoadSpinner();
    };

    expose.LocalFileRemove = function (documentID) {
        var formData = new FormData();
        // add assoc key values, this will be posts values
        formData.append("assignmentID", PXP.GBFocus.assignmentID());
        formData.append("studentGU", PXP.GBFocus.studentGU());
        formData.append("documentID", documentID);

        $.ajax({
            type: "POST",
            url: "Service/PXPDropBox.asmx/RemoveDocument",
            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                return myXhr;
            },
            success: me.removeDocumentSuccess,
            error: me.uploadDocumentFail,
            accepts: "json",
            dataType: "json",
            contentType: false,
            async: true,
            data: formData,
            cache: false,
            processData: false,
            timeout: 60000
        });
    };
    me.removeDocumentSuccess = function (ajaxResponse) {
        var response = me.getJSONResponse(ajaxResponse);
        if (response) {
            var dbox = $('#DropBoxGrid').data('dxDataGrid');
            if (dbox) {
                var rows = dbox.getVisibleRows();
                for (var i = 0, len = rows.length; i < len; i++) {
                    var id = parseInt(rows[i].data.ID) || -1;
                    if (response.newDocID === id) {
                        dbox.deleteRow(i);
                        me.stopLoadSpinner();
                        return;
                    }
                }
            }
        }
        me.stopLoadSpinner();
    };

    me.setError = function (errorText) {
        $("[name='divFileMessage']").html('<span class="error"> Error: ' + errorText + '</span>');
    };
    me.clearMessages = function () {
        $("[name='divFileMessage']").html("");
    };
    me.getQueryStringArray = function () {
        var qd = new Array();
        location.search.substr(1).split("&").forEach(function (item) { var k = item.split("=")[0], v = item.split("=")[1]; v = v && me.decodeURI(v); (k in qd) ? qd[k].push(v) : qd[k] = [v] })
        return qd;
    };
    me.getCurrentDate = function () {
        var currentDate = new Date();
        return (currentDate.getMonth() + 1).toString() + "/" + currentDate.getDate() + "/" + currentDate.getFullYear() + " " + currentDate.toLocaleTimeString().toString();
    };
    me.getJSONResponse = function (rawResponse) {
        var resultResponse = null;
        if (rawResponse) {
            if (rawResponse.hasOwnProperty("d")) {
                resultResponse = rawResponse.d;
            }
            else {
                resultResponse = rawResponse;
            }
        }
        return resultResponse;
    };

    me.fileSourceClick_LocalDrive = function () {
        $("#fileInput").click();
    };
    me.fileSourceClick_GoogleDrive = function () {
        DROPBOXFILESOURCEHANDLER.ShowGoogleDrivePicker();
    };
    me.fileSourceClick_OneDrive = function () {
        DROPBOXFILESOURCEHANDLER.ShowOneDrivePicker();
    };

    me.bindFileSourceOpenButton = function (selectedIndex) {
        var $button = $("#btnOpenFileSource");
        $button.off("click");
        switch (selectedIndex) {
            case 0:
                $button.on("click", me.fileSourceClick_LocalDrive);
                break;
            case 1:
                $button.on("click", me.fileSourceClick_GoogleDrive);
                break;
            case 2:
                $button.on("click", me.fileSourceClick_OneDrive);
                break;
        }
    };
    me.bindFileSourceDropDown = function () {
        var dataSource = {
            store:
            {
                type: "array",
                key: "value",
                data:
                    [
                        {
                            text: "My Computer",
                            value: 0,
                            description: "Upload from your hard drive",
                            imageSrc: me.sourceIcon_LocalDrive
                        },
                        {
                            text: "Google Drive",
                            value: 1,
                            description: "Upload from Google Drive",
                            imageSrc: me.sourceIcon_GoogleDrive
                        },
                        {
                            text: "OneDrive",
                            value: 2,
                            description: "Upload from OneDrive",
                            imageSrc: me.sourceIcon_OneDrive
                        }
                    ]
            }
        };

        //create other options
        $('#FileSourceDropdown').dxSelectBox({
            dataSource: dataSource,
            value: dataSource[window.LastDropboxFileSourceID],
            onValueChanged: function (e) {
                window.LastDropboxFileSourceID = e.value.value;
                me.bindFileSourceOpenButton(e.value.value);
            },
            itemTemplate: function (itemData, itemIndex, $itemElement) {
                return $('<div class="file-source-item" />').append($('<img src="' + itemData.imageSrc + '"><div><label>' + itemData.text + '</label><small>' + itemData.description + '</small></div>'));
            },
            fieldTemplate: function (itemData, $itemElement) {
                var $result;
                if (itemData) {
                    $result = $('<div class="file-source-item" />').append($('<img src="' + itemData.imageSrc + '" /><div><label>' + itemData.text + '</label><small>' + itemData.description + '</small></div><div class="tb"></div>'));
                    $result.find("div.tb").dxTextBox({
                        value: itemData.text,
                        visible: false
                    });
                    $itemElement.append($result);
                } else {
                    $result = $('<div class="file-source-item" />').append($('<img src="" /><div><label></label><small></small></div><div class="tb"></div>'));
                    $result.find("div.tb").dxTextBox({
                        value: "",
                        visible: false
                    });
                    $itemElement.append($result);
                }
            }
        });
        //set the first option.
        var selectedID = window.LastDropboxFileSourceID || 0;
        var dxSelectBox = $("#FileSourceDropdown").dxSelectBox("instance");
        if (dxSelectBox) {
            dxSelectBox.option('value', selectedID);
            me.bindFileSourceOpenButton(selectedID);
        }
    };

    expose.GetQueryStringParameter = function (parameter) {
        var qd = me.getQueryStringArray();
        if (qd && qd[parameter] && qd[parameter] !== 'undefined') {
            return qd[parameter][0];
        }
        return null;
    };

    expose.ShowGoogleDrivePicker = function () { GOOGLEDRIVEPICKER.ShowPicker(me.pickerCallBack); };
    expose.ShowOneDrivePicker = function () {
        ONEDRIVEPICKER.ShowPicker(PXP.GBFocus.assignmentID(), $("[name='divConnectionData']").attr("studentData"), $("#txtDBoxNotes").val(), me.uploadDocumentSuccess, me.uploadDocumentFail, expose.StartLoadSpinner, me.stopLoadSpinner);
    };


    expose.Init = function () {
        me.bindFileSourceDropDown();
    };

    return expose;
}());


