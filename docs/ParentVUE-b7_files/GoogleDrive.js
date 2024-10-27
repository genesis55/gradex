﻿var GOOGLEDRIVEPICKER = GOOGLEDRIVEPICKER || (function () {
    var _this = this;
    var me = {}; //private objects
    var expose = {}; //public objects

    me.pickerCallback;
    me.developerKey;
    me.clientId;
    me.scope;
    me.pickerApiLoaded;
    me.driveApiLoaded;
    me.gapiInited;
    me.gisInited;
    me.pickerCreated;
    me.picker;
    me.client;
    me.access_token;
    me.popupBlockerPass;

    me.checkBeforeStart = function () {
        if (me.gapiInited && me.gisInited) {
            gapi.load('picker', { 'callback': me.onPickerApiLoad });
        }
    };

    me.onGsiClientLoad = function () {
        me.client = google.accounts.oauth2.initTokenClient({
            client_id: me.clientId,
            scope: me.scope,
            callback: (tokenResponse) => {
                if (tokenResponse.error !== undefined) {
                    throw (resp);
                }
                me.access_token = tokenResponse.access_token;
                me.createPicker();
            },
        });
        me.gisInited = true;
        me.checkBeforeStart();
    };

    me.onJsApiLoad = function () {
        gapi.load('client', () => {
            gapi.client.init({
                // NOTE: OAuth2 'scope' and 'client_id' parameters have moved to initTokenClient().
            })
                .then(function () {  // Load the drive API discovery document.
                    gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                    me.gapiInited = true;
                    me.checkBeforeStart();
                });
        })
    };

    me.init = function () {
        if (me.pickerApiLoaded) { return; }
        let googleScript1 = "https://accounts.google.com/gsi/client";
        let googleScript3 = "https://apis.google.com/js/api.js";
        me.developerKey = $("[name='divConnectionData']").attr("gddevkey");
        me.clientId = $("[name='divConnectionData']").attr("gdclientid");
        me.scope = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile';
        me.pickerApiLoaded = false;
        me.pickerCreated = false;
        $.getScript(googleScript3, me.onJsApiLoad);
        $.getScript(googleScript1, me.onGsiClientLoad);
    };



    me.requestAccessToken = function () {
        try {
            //prior to requesting the access token check for a popup blocker as this will cause the auth window to not open.
            if (!me.popupBlockerPass) {
                let popup = window.open('about:blank', '_blank');
                if (popup) {
                    me.popupBlockerPass = true;
                    popup.close();
                }
            }
            if (me.popupBlockerPass) {
                me.client.requestAccessToken();
            } else {
                alert('A popup blocker is enabled that blocked access to sign in to Google. Please disable the popup blocker and try again. (On phones and tablets this will be your default browser)');
            }
        } catch (e) {
            console.error(e);
            alert(e);
        }
    }

    me.onPickerApiLoad = function () {
        me.pickerApiLoaded = true;
        gapi.client.load('drive', 'v2', me.onDriveApiLoad);
    }

    me.onDriveApiLoad = function () {
        me.driveApiLoaded = true;
        me.requestAccessToken();
    }

    me.createPicker = function () {
        if (me.pickerApiLoaded) {
            if (me.access_token) {
                me.picker = new google.picker.PickerBuilder()
                    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                    .addView(new google.picker.DocsView())
                    .addView(google.picker.ViewId.RECENTLY_PICKED)
                    .setDeveloperKey(me.developerKey)
                    .setOAuthToken(me.access_token)
                    .setCallback(me.pickerCallback)
                    .build();
                me.pickerCreated = true;
                me.picker.setVisible(true);
            } else {
                me.requestAccessToken();
            }
        } else {
            me.init();
        }
    }

    expose.GetFile = function (fileId, callback) {
        var request = gapi.client.request({ 'path': '/drive/v3/files/' + fileId, 'method': 'GET' });
        request.execute(function (resp) {
            callback(resp);
            console.log(resp);
        });
    };

    expose.DownloadFile = function (downloadUrl, callback) {
        if (downloadUrl) {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', downloadUrl, true);
            xhr.responseType = "arraybuffer";
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function (oEvent) {
                if (this.status == 200) {
                    var arrayBuffer = xhr.response;
                    if (arrayBuffer) {
                        var byteArray = new Uint8Array(arrayBuffer);
                        callback(byteArray);
                    }
                }

            };
            xhr.onerror = function () {
                callback(null);
            };
            xhr.send();
        } else {
            callback(null);
        }
    };
    expose.ShowPicker = function (callback) {
        if (me.pickerCreated) {
            me.picker.setVisible(true);
        } else {
            me.pickerCallback = callback;
            me.createPicker();
        }
    };


    return expose;
}());