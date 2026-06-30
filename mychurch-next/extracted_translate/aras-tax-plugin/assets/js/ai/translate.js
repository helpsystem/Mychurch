/**
 * Aras Tax AI Translator v2 - Enhanced JavaScript
 * - Auto language detection with visual feedback
 * - Bidirectional translation with quality check
 * - Quick language pairs
 * - RTL support
 * - Copy to clipboard
 */
(function ($) {
    'use strict';

    $(document).ready(function () {
        if (typeof arasAiTranslate === 'undefined') return;

        const $input        = $('#aras_translate_input');
        const $output       = $('#aras_translate_output');
        const $from         = $('#aras_translate_from');
        const $to           = $('#aras_translate_to');
        const $switchBtn    = $('#aras_translate_switch');
        const $translate    = $('#aras_translate_btn');
        const $btnText      = $('.aras-translate-btn-text');
        const $btnLoading   = $('.aras-translate-btn-loading');
        const $detectedLang = $('#aras_detected_lang');
        const $detectedText = $('.aras-detected-text');
        const $backTrans    = $('#aras_back_trans_container');
        const $backText     = $('#aras_back_translation');
        const $hideBack     = $('#aras_hide_back');
        const $charCount    = $('#aras_input_char_count');
        const $inputLang    = $('#aras_input_lang_label');
        const $outputLang   = $('#aras_output_lang_label');

        const languages = arasAiTranslate.languages;

        // Language names mapping
        const langNames = {
            'en': 'English',
            'ar': 'العربية',
            'ku': 'کوردی',
            'fa': 'فارسی',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'tr': 'Türkçe',
            'zh': '中文',
            'ru': 'Русский',
            'hi': 'हिन्दी',
            'pt': 'Português',
            'ja': '日本語',
            'ko': '한국어',
        };

        // RTL languages
        const rtlLangs = ['ar', 'ku', 'fa', 'he', 'ur'];

        // ── Auto-detect language from text ──
        window.updateInputLang = function(text) {
            $charCount.text(text.length);

            if (!text.trim()) {
                $detectedLang.hide();
                $input.removeClass('rtl');
                return;
            }

            // Quick detection
            const detected = detectLanguage(text);
            const name = langNames[detected] || detected;

            $detectedLang.show().find('.aras-detected-text').text(
                arasAiTranslate.detecting.replace('...', ': ' + name)
            );

            // Apply RTL
            if (rtlLangs.includes(detected)) {
                $input.addClass('rtl');
            } else {
                $input.removeClass('rtl');
            }

            // If "auto" is selected, update the "From" label
            if ($from.val() === 'auto') {
                $inputLang.text(name);
            }
        };

        function detectLanguage(text) {
            // Arabic script
            if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) {
                // Check for Kurdish
                const kurdishWords = ['دەتوانیت', 'باشە', 'چۆن', 'زۆر', 'سوپاس', 'کە'];
                for (const w of kurdishWords) {
                    if (text.includes(w)) return 'ku';
                }

                // Check for Persian
                const persianChars = /[\u067E\u0686\u0698\u06A9\u06AF]/;
                if (persianChars.test(text)) return 'fa';

                return 'ar';
            }
            // Chinese
            if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)) return 'zh';
            // Japanese
            if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
            // Korean
            if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko';
            // Cyrillic
            if (/[\u0400-\u04FF]/.test(text)) return 'ru';
            // Devanagari
            if (/[\u0900-\u097F]/.test(text)) return 'hi';
            // Turkish
            if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) return 'tr';

            return 'en';
        }

        // ── Translate Button ──
        $translate.on('click', function (e) {
            e.preventDefault();

            const text = $input.val().trim();
            if (!text) {
                $output.val('');
                $backTrans.hide();
                return;
            }

            let from = $from.val();
            const to   = $to.val();

            // Auto-detect
            if (from === 'auto') {
                from = detectLanguage(text);
            }

            if (from === to) {
                $output.val(text);
                $inputLang.text(langNames[from] || from);
                $outputLang.text(langNames[to] || to);
                applyDirection(to);
                return;
            }

            // Update labels
            $inputLang.text(langNames[from] || from);
            $outputLang.text(langNames[to] || to);
            applyDirection(to);

            // Show loading
            $translate.prop('disabled', true);
            $btnText.hide();
            $btnLoading.show();
            $output.val('');
            $backTrans.hide();

            $.ajax({
                url: arasAiTranslate.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aras_ai_translate',
                    nonce: arasAiTranslate.nonce,
                    text: text,
                    from: from,
                    to: to
                },
                success: function (response) {
                    if (response.success) {
                        const data = response.data;
                        $output.val(data.translation);

                        // Show detected language
                        $detectedLang.show().find('.aras-detected-text').text(
                            '🌐 Detected: ' + (data.detected_from_name || from) + ' → ' + (data.to_name || to)
                        );

                        // Show back-translation for quality check
                        if (data.back_translation) {
                            $backTrans.show().find('#aras_back_translation').text(data.back_translation);
                        }
                    } else {
                        $output.val(response.data.message || arasAiTranslate.error);
                    }
                },
                error: function () {
                    $output.val(arasAiTranslate.error);
                },
                complete: function () {
                    $translate.prop('disabled', false);
                    $btnText.show();
                    $btnLoading.hide();
                }
            });
        });

        // ── Ctrl+Enter to Translate ──
        $input.on('keydown', function (e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                $translate.click();
            }
        });

        // ── Switch Languages ──
        $switchBtn.on('click', function () {
            const fromVal = $from.val();
            const toVal   = $to.val();

            // Don't allow switching to "auto" as target
            if (toVal === 'auto') {
                $from.val('en');
            } else {
                $from.val(toVal);
            }
            $to.val(fromVal === 'auto' ? 'en' : fromVal);

            // Swap texts
            const outputText = $output.val();
            const inputText  = $input.val();
            if (outputText) {
                $input.val(outputText);
                $output.val(inputText);
                updateInputLang(outputText);
            }

            // Swap labels
            const tmpLabel = $inputLang.text();
            $inputLang.text($outputLang.text());
            $outputLang.text(tmpLabel);

            // Swap directions
            const tmpDir = $input.css('direction');
            $input.css('direction', $output.css('direction'));
            $output.css('direction', tmpDir);
        });

        // ── Quick Language Pairs ──
        $(document).on('click', '.aras-quick-pair', function () {
            const from = $(this).data('from');
            const to   = $(this).data('to');

            $from.val(from);
            $to.val(to);

            $inputLang.text(langNames[from] || from);
            $outputLang.text(langNames[to] || to);

            applyDirection(to);

            // Auto-translate if text exists
            if ($input.val().trim()) {
                $translate.click();
            }
        });

        // ── Hide Back Translation ──
        $hideBack.on('click', function () {
            $backTrans.slideUp(200);
        });

        // ── Copy Buttons ──
        $('#aras_copy_input').on('click', function () {
            copyToClipboard($input.val());
        });

        $('#aras_copy_output').on('click', function () {
            copyToClipboard($output.val());
        });

        function copyToClipboard(text) {
            if (!text) return;

            navigator.clipboard.writeText(text).then(function () {
                // Visual feedback
                const $btn = event.target;
                const original = $btn.textContent;
                $btn.textContent = '✅';
                setTimeout(function () {
                    $btn.textContent = original;
                }, 1500);
            });
        }

        // ── Apply Direction ──
        function applyDirection(lang) {
            if (rtlLangs.includes(lang)) {
                $output.addClass('rtl');
            } else {
                $output.removeClass('rtl');
            }
        }
    });
})(jQuery);
