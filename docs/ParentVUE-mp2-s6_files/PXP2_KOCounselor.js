﻿(function ($, ko) {
    var DATE_FORMAT = 'MM/DD/YYYY';
    var TIME_FORMAT = 'hh:mm a';

    ST.LoadTemplate('Templates/PXP/PXP2_KOCounselor.html')

    var counselorData;
    function loadData() {
        return api('LoadCounselorData')
            .then(function (data) {
                counselorData = data;
            });
    }
    loadData()
        .then(function () {
            var $dlgContent = $('#DialogContent');
            if ($dlgContent[0]) {
                $dlgContent.append(ich['PXP.RequestCounselor.Embedded']({
                    Translate: function () {
                        return function (text, render) {
                            return PXP.Translations.Counselor[text];
                        }
                    }
                }));

                ko.applyBindings(new vmCounselorModal(counselorData), $dlgContent[0]);
            }
        });

    function closeModal() {
        var $modal = $('.co-modal').last();
        if ($modal.length) {
            ST.CloseModal($modal);
        }
        else if (PXP.IsMobile) {
            window.location.href = 'PXP2_Login_Student.aspx?Logout=1&regenerateSessionId=True';
        }
    }

    $.extend(Namespace('PXP.Actions'), {
        ShowCounselorRequestDialog: function (ev) {
            var $this = $(this);

            if (!counselorData) {
                $this.addClass('loading');
                loadData()
                    .then(function (data) {
                        $this.removeClass('loading');
                        init_modal('PXP.RequestCounselor.Modal', new vmCounselorModal(counselorData));
                    });
            }
            else {
                init_modal('PXP.RequestCounselor.Modal', new vmCounselorModal(counselorData));
            }
        }
    });

    function init_modal(template, vm) {
        var $dlg = ich[template]({
            Translate: function () {
                return function (text, render) {
                    return PXP.Translations.Counselor[text];
                }
            }
        });
        $(document.body).append($dlg);

        ko.applyBindings(vm, $dlg[0]);

        $dlg.modal();
        $dlg.on('hidden.bs.modal', function () {
            $dlg.remove();
        });
    }

    function api(method, data) {
        return PXPCallWebMethod('Home_PXP2.aspx/' + method,
            {
                request: $.extend({ agu: PXP.AGU }, data || {})
            })
            .then(function (res) {
                if (res.counselorData) {
                    counselorData = res.counselorData;
                }
                return res;
            });
    }

    function vmCounselorModal(data) {
        $.extend(this, data || {});

        this.hasHistory = ko.pureComputed(function () {
            return this.history && this.history.length > 0;
        }.bind(this));

        this.note = ko.observable(data.note);
        this.reason = ko.observable(this.reasons.filter(function (r) { return r.value === data.reason; })[0]);
        this.counselor = ko.observable(this.counselorList.filter(function (r) { return r.value === (data.assignedStaffGU || data.counselorStaffGU); })[0]);
    }

    vmCounselorModal.prototype = {
        showDetails: function () {
            init_modal('PXP.RequestCounselor.Details', new vmCounselorDetails(counselorData));
        },

        deleteRequest: function () {
            var inst = this;
            ST.ShowConfirmation(PXP.Translations.Counselor.DeleteMessage)
                .done(function ()
                {
                    return api('DeleteCounselorMeeting',
                        {
                            agu: PXP.AGU,
                            currentMeetingGU: inst.currentMeetingGU
                        })
                        .then(function () {
                            closeModal();
                            if (!PXP.IsMobile) {
                                window.location.reload();
                            }
                        });
                });
        },

        requestMeeting: function () {
            var reason = ((this.reason() && this.reason().value) || '').trim();
            var counselorStaffGU = this.counselorStaffGU;
            if (this.allowStudentsToChangeCounselor) {
                counselorStaffGU = ((this.counselor() && this.counselor().value) || '').trim();
            }
             
            var note = (this.note() || '').trim();

            if (!note) {
                ST.ShowMessage(PXP.Translations.Counselor.ErrNoteRequired);
            }
            else if (!reason) {
                ST.ShowMessage(PXP.Translations.Counselor.ErrReasonRequired);
            }
            else if (!counselorStaffGU && this.allowStudentsToChangeCounselor) {
                ST.ShowMessage(PXP.Translations.Counselor.Err_CounselorRequired);
            }
            else {
                return api('RequestCounselorMeeting',
                    {
                        agu: PXP.AGU,
                        currentMeetingGU: this.currentMeetingGU,
                        note: note,
                        reason: reason,
                        studentSchYrGU: this.studentSchYrGU,
                        counselorStaffSchoolYearGU: this.counselorStaffSchoolYearGU,
                        counselorStaffGU: counselorStaffGU,
                        studentFirstName: this.studentFirstName
                    })
                    .then(function () {
                        closeModal();
                        if (!PXP.IsMobile) {
                            window.location.reload();
                        }
                    });
            }
        },

        close: function () {
            closeModal();
        }
    };

    function vmCounselorDetails(data) {
        $.extend(this, data);

        if (this.assignedDateTime) {
            this.assignedDateTime = moment(this.assignedDateTime, DATE_FORMAT + ' ' + TIME_FORMAT).calendar();
        }
    }

})(jQuery, ko);
