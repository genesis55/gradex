
function SetStreamsNotificationTag($elementToTag) {

    $.ajax({
        type: "POST",
        url: "StreamCommand.aspx/GetStreamsNotificationData",
        beforeSend: function (request) {
            request.setRequestHeader("CURRENT_WEB_PORTAL", window.CURRENT_WEB_PORTAL);
        },
        data: "",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        complete: function (msg) {
            //dont do anything for now, placeholder only
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            if (XMLHttpRequest.responseText) {
                alert(textStatus + ':' + XMLHttpRequest.responseText);
            }
        },
        success: function (data, textStatus) {
            //based on the return data display a tag on the element passed in
            var GRP_Count = data.d.GRP_Count;
            var Last_Group_Date = data.d.Last_Group_Date;
            var Last_Message_Date = data.d.Last_Message_Date;
            var MSG_Count = data.d.MSG_Count;
            var Special_Text = data.d.Special_Text;
            var Total_Count = data.d.Total_Count;
            if (Total_Count > 0) {
                //build a div to hold the data
                var titleText = '';
                if (MSG_Count > 0) { titleText += (MSG_Count > 1) ? MSG_Count + ' new private streams' : MSG_Count + ' new private stream'; }
                if (MSG_Count > 0 && GRP_Count > 0) { titleText += '\n' }
                if (GRP_Count > 0) { titleText += (GRP_Count > 1) ? GRP_Count + ' new group streams' : GRP_Count + ' new group stream'; }
                var notifybox = $('<div class="StreamsNotificationBox" title="' + titleText + '">' + Total_Count + '</div>').hide();
                $elementToTag.css('position', 'relative');
                $elementToTag.append(notifybox);
                notifybox.fadeIn();
            } else {

				//Multiple divs on same page can use this class so get all of them and apply timeout 
				const nodes = document.querySelectorAll('.StreamsNotificationBox:not(.SynergyMailUnread)');

				for (let i = 0; i < nodes.length; i++) {

					var taskNotificationsCount = parseInt(nodes[i].innerText);

					if (taskNotificationsCount <= 0) {
						setTimeout(() => {
							CloseStreamsNotification();
						}, 5000);
					}
				}
            }
            setTimeout(() => {
                SetStreamsNotificationTag($elementToTag);
            }, 60000);
        }
    });
};

function CloseStreamsNotification() {
    $('div.StreamsNotificationBox').fadeOut(300, function () { $(this).remove(); });
};

$(document).ready(function () {
    var $StreamsMenu = $('a[href*="_Streams.aspx"]').first();
    SetStreamsNotificationTag($StreamsMenu);
});
