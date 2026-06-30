/**
 * Aras Tax Services - Public JavaScript
 */
(function ($) {
    'use strict';

    $(document).ready(function () {

        // ── Tax Calculator Form Submission ──
        $('#arasTaxCalcForm').on('submit', function (e) {
            e.preventDefault();

            var $form    = $(this);
            var $btn     = $form.find('.aras-calc-submit');
            var $result  = $('#arasTaxResult');
            var originalText = $btn.text();

            // Validate
            var income = parseFloat($('#aras_income').val());
            if (!income || income <= 0) {
                alert(arasTaxData.strings ? arasTaxData.strings.please_enter_valid_income : 'Please enter a valid income amount.');
                return;
            }

            // Show loading
            $btn.text('Calculating...').prop('disabled', true);

            $.ajax({
                url: arasTaxData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aras_tax_calculate',
                    nonce: arasTaxData.nonce,
                    filing_status: $('#aras_filing_status').val(),
                    income: income,
                    deductions: parseFloat($('#aras_deductions').val()) || 0,
                    tax_type: $('#aras_tax_type').val()
                },
                success: function (response) {
                    if (response.success) {
                        var data = response.data;

                        $('#aras_taxable_income').text('$' + formatNumber(data.taxable_income));
                        $('#aras_estimated_tax').text('$' + formatNumber(data.total_tax));
                        $('#aras_effective_rate').text(data.effective_rate.toFixed(2) + '%');
                        $('#aras_monthly_tax').text('$' + formatNumber(data.monthly_tax));

                        $result.fadeIn(300);
                    } else {
                        alert(response.data.message || 'An error occurred. Please try again.');
                    }
                },
                error: function () {
                    alert('An error occurred. Please try again.');
                },
                complete: function () {
                    $btn.text(originalText).prop('disabled', false);
                }
            });
        });

        // ── Smooth Scroll for Banner Buttons ──
        $('a[href^="#aras-tax-"]').on('click', function (e) {
            var target = $(this.getAttribute('href'));
            if (target.length) {
                e.preventDefault();
                $('html, body').stop().animate({
                    scrollTop: target.offset().top - 80
                }, 600);
            }
        });

        // ── Apply Custom Colors ──
        if (arasTaxData.primaryColor) {
            $(':root').css('--aras-primary', arasTaxData.primaryColor);
        }
        if (arasTaxData.accentColor) {
            $(':root').css('--aras-accent', arasTaxData.accentColor);
        }

        // ── Number Formatter ──
        function formatNumber(num) {
            return parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    });
})(jQuery);
