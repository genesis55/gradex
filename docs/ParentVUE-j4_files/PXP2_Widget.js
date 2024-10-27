﻿var PXP = PXP || {};

$.extend(PXP, {
    Widget: {
        Actions: {
            FlipCard: function (ev) {
                if ($(this).hasClass('Disabled') == false) {
                    var $cont = $(this).closest('.card-container');
                    var $card = $(this).closest('.card');

                    if ($card.hasClass('flipped') == false) {
                        var sel = this.getAttribute('data-target')
                            ? '[id="' + this.getAttribute('data-target') + '"]'
                            : '.back';

                        $card.children('.back')
                            .css('z-index', '1')
                            .filter(sel)
                            .css('z-index', '2');

                        ev.preventDefault();
                    }

                    //$cont.width($cont.width());
                    //$cont.height($cont.height());

                    $card.toggleClass('flipped');
                }
            }
        }
    }
});

$(document).delegate('[data-toggle~=flip]', 'click', PXP.Widget.Actions.FlipCard);

$.extend(Namespace('PXP.Actions'), {
    GetWidgetData: function (ev) {
        CallWebMethod({
            url: 'Service/PXPCommunication.asmx/GetWidgetData',
            data: JSON.stringify({
                widget: this.getAttribute('data-target'),
                agu: $(this).closest('[data-agu]').attr('data-agu')
            })
        })
        .done(function (res) {
            console.log(res);
        });
    }
});
