/**
 * Aras Tax Services - Admin JavaScript
 */
(function ($) {
    'use strict';

    $(document).ready(function () {

        // ── Color Picker Initialization ──
        $('.aras-color-picker').wpColorPicker();

        // ── Show/Hide banner option toggle ──
        $('#aras_tax_show_banner').on('change', function () {
            if ($(this).is(':checked')) {
                $(this).val('yes');
            } else {
                $(this).val('no');
            }
        });

    });
})(jQuery);
