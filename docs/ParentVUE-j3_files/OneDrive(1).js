var ONEDRIVEPICKER = ONEDRIVEPICKER || (function () {
    var _this = this;
    var me = {}; //private objects
    var expose = {}; //public objects

    expose.AssignmentID = 0;
    expose.KeyGU = "";
    expose.DocumentNotes = "";
    expose.UploadSuccessCallback = null;
    expose.UploadFailCallback = null;
    expose.StartLoadSpinner = null;
    expose.StopLoadSpinner = null;

    me.init = function () {
        WL.init({
            client_id: $("[name='divConnectionData']").attr("odclientid"),
            redirect_uri: window.location.protocol + '//' + window.location.hostname + me.getRootURLPath(window.location.pathname) + '/OneDriveResponse.htm',
            scope: ["wl.signin", "onedrive.readonly", "wl.skydrive"],
            response_type: "token"
        });
    };

    me.getRootURLPath = function (pathname) {
        var result = "";
        if (pathname && pathname.length > 0) {
            var aSplit = pathname.split("/");
            if (aSplit && aSplit.length > 2) {
                for (i = 0; i < aSplit.length - 1; i++) {
                    if (aSplit[i].length > 0) {
                        result = result + "/" + aSplit[i];
                    }
                }
            }
        }
        return result;
    };

    me.arrayBufferToBase64 = function (buffer) {
        if (buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }
        return "";
    }

    me.uploadFile = function (byteArray, fileName) {
        if (byteArray && byteArray.length > 0) {
            var jsonData = new String()
            jsonData = JSON.stringify({
                base64File: me.arrayBufferToBase64(byteArray),
                documentName: encodeURIComponent(fileName),
                assignmentID: encodeURIComponent(expose.AssignmentID),
                keyGU: expose.KeyGU,
                documentNotes: encodeURIComponent(expose.DocumentNotes)
            });
            expose.StartLoadSpinner();
            $.ajax({
                url: "Service/PXPDropBox.asmx/UploadOneDriveDocument",
                data: jsonData,
                accepts: "json",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                method: "post",
                success: expose.UploadSuccessCallback,
                error: expose.UploadFailCallback
            });
        }
    };
    me.downloadFile = function (link, fileName) {
        if (link && link.length > 0) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', link, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function (oEvent) {
                if (this.status == 200) {
                    var arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        var byteArray = new Uint8Array(arrayBuffer);
                        me.uploadFile(byteArray, fileName);
                    }
                }
            };
            xhr.onerror = function () {
                me.uploadFile(null, fileName);
            };
            xhr.send();
        }
    };

    me.receiveFile = function (link, fileName) {
        if (link && link.length > 0) {
            var jsonData = new String()
            jsonData = JSON.stringify({
                downloadURL: encodeURIComponent(link),
                documentName: encodeURIComponent(fileName),
                assignmentID: encodeURIComponent(expose.AssignmentID),
                keyGU: expose.KeyGU,
                documentNotes: encodeURIComponent(expose.DocumentNotes)
            });
            expose.StartLoadSpinner();
            $.ajax({
                url: "Service/PXPDropBox.asmx/UploadOneDriveDocument",
                data: jsonData,
                accepts: "json",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                method: "post",
                success: expose.UploadSuccessCallback,
                error: expose.UploadFailCallback
            });
        }
    };

    me.handleSelectedFiles = function (response) {
        if (response && response.value && response.value.length > 0) {
            for (i = 0; i < response.value.length; i++) {
                if (response.value[i] && response.value[i]['@microsoft.graph.downloadUrl'].length > 0) {
                    me.receiveFile(response.value[i]['@microsoft.graph.downloadUrl'], response.value[i].name);
                }
            }
        }
    };

    expose.ShowPicker = function (assignmentID, keyGU, documentNotes, uploadSuccessCallback, uploadFailCallback, startLoadSpinner, stopLoadSpinner) {

        let pickerOptions = {
            clientId: $("[name='divConnectionData']").attr("odclientid"),
            action: "download",
            viewType: "files",
            advanced: {
                redirectUri: window.location.protocol + '//' + window.location.hostname + me.getRootURLPath(window.location.pathname) + '/OneDriveResponse.htm',
            },
            success: me.handleSelectedFiles,
            cancel: null,
            linkType: "downloadLink",
            multiSelect: true
        }

        expose.AssignmentID = assignmentID;
        expose.KeyGU = keyGU;
        expose.DocumentNotes = documentNotes;
        expose.UploadSuccessCallback = uploadSuccessCallback;
        expose.UploadFailCallback = uploadFailCallback;
        expose.StartLoadSpinner = startLoadSpinner;
        expose.StopLoadSpinner = stopLoadSpinner;
        //me.init();
        OneDrive.open(pickerOptions);

    };

    return expose;
}());