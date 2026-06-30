/**
 * Aras Tax Admin Chat - Frontend JavaScript
 * - Voice input (Speech-to-Text)
 * - Voice output (Text-to-Speech)
 * - Auto-detect user language
 * - Start conversation & send to admin panel
 */
(function ($) {
    'use strict';

    $(document).ready(function () {
        if (typeof arasAiChat === 'undefined') return;

        const $toggle     = $('#arasAiChatToggle');
        const $window     = $('#arasAiChatWindow');
        const $close      = $('#arasAiChatClose');
        const $messages   = $('#arasAiChatMessages');
        const $form       = $('#arasAiChatForm');
        const $input      = $('#arasAiChatInput');
        const $send       = $('#arasAiChatSend');
        const $statusDot  = $('.aras-status-dot');
        const $statusText = $('.aras-status-text');
        const $langDetect = $('#arasAiLangDetect');
        const $langBtn    = $('#arasAiLangSelector');
        const $langDrop   = $('#arasAiLangDropdown');
        const $suggestionList = $('#arasAiSuggestionList');

        let chatHistory    = [];
        let isProcessing   = false;
        let currentLang    = arasAiChat.browserLang || 'en';
        let conversationId = '';

        // ── Toggle Chat ──
        $toggle.on('click', function () {
            if ($window.is(':visible')) {
                $window.slideUp(250);
            } else {
                $window.slideDown(250);
                $input.focus();
                checkStatus();
                loadSuggestions();
                detectLanguageOnOpen();
            }
        });

        $close.on('click', function () {
            $window.slideUp(250);
        });

        // ── Language Selector ──
        $langBtn.on('click', function (e) {
            e.stopPropagation();
            $langDrop.slideToggle(200);
        });

        $(document).on('click', function () {
            $langDrop.slideUp(200);
        });

        $langDrop.on('click', '.aras-lang-option', function () {
            const lang = $(this).data('lang');
            currentLang = lang;
            $langDrop.slideUp(200);

            if (lang === 'auto') {
                $langDetect.html('🔍 ' + 'Auto-detect enabled');
            } else {
                const name = $(this).text().trim();
                $langDetect.html('🌐 ' + name);
                applyLanguageDirection(lang);
            }

            loadSuggestions();
        });

        function detectLanguageOnOpen() {
            const browserLang = arasAiChat.browserLang || 'en';
            const langNames = {
                'en': '🇺🇸 English', 'ar': '🇸🇦 العربية', 'ku': '🇮🇶 کوردی',
                'fa': '🇮🇷 فارسی', 'es': '🇪🇸 Español', 'tr': '🇹🇷 Türkçe',
                'fr': '🇫🇷 Français', 'de': '🇩🇪 Deutsch', 'zh': '🇨🇳 中文',
                'ru': '🇷🇺 Русский', 'hi': '🇮🇳 हिन्दी', 'pt': '🇧🇷 Português',
                'ja': '🇯🇵 日本語', 'ko': '🇰🇷 한국어',
            };
            currentLang = browserLang;
            $langDetect.html('🌐 ' + (langNames[browserLang] || browserLang));
            applyLanguageDirection(browserLang);
        }

        function applyLanguageDirection(lang) {
            const rtlLangs = ['ar', 'ku', 'fa'];
            if (rtlLangs.includes(lang)) {
                $messages.css('direction', 'rtl');
                $input.css('direction', 'rtl').attr('placeholder', getRtlPlaceholder(lang));
            } else {
                $messages.css('direction', 'ltr');
                $input.css('direction', 'ltr').attr('placeholder', arasAiChat.placeholder);
            }
        }

        function getRtlPlaceholder(lang) {
            const p = {
                'ar': 'اسأل سؤالاً عن الضرائب...',
                'ku': 'پرسیارێکی باج بکە...',
                'fa': 'سوال مالیاتی بپرسید...',
            };
            return p[lang] || '...';
        }

        // ── Load Smart Suggestions ──
        function loadSuggestions() {
            $.post(arasAiChat.ajaxUrl, {
                action: 'aras_ai_suggest',
                nonce: arasAiChat.nonce,
                lang: currentLang === 'auto' ? arasAiChat.browserLang : currentLang,
            }, function (response) {
                if (response.success && response.data.suggestions) {
                    renderSuggestions(response.data.suggestions);
                }
            });
        }

        function renderSuggestions(suggestions) {
            $suggestionList.empty();
            suggestions.forEach(function (s) {
                const $item = $('<div class="aras-ai-suggestion-item"></div>');
                $item.html('<span class="aras-suggestion-icon">' + s.icon + '</span><span class="aras-suggestion-text">' + s.text + '</span>');
                $item.data('question', s.text);
                $suggestionList.append($item);
            });
        }

        // ── Check Status ──
        function checkStatus() {
            $.post(arasAiChat.ajaxUrl, {
                action: 'aras_ai_check_status',
                nonce: arasAiChat.nonce
            }, function (response) {
                if (response.success && response.data.status === 'online') {
                    $statusDot.removeClass('offline');
                    $statusText.text('Online');
                } else {
                    $statusDot.addClass('offline');
                    $statusText.text('Offline');
                }
            }).fail(function () {
                $statusDot.addClass('offline');
                $statusText.text('Offline');
            });
        }

        // ── Add Message ──
        function addMessage(content, type, lang) {
            const isRtl = ['ar', 'ku', 'fa'].includes(lang || currentLang);
            const html = '<div class="aras-ai-message aras-ai-' + type + '-message"' + (isRtl ? ' dir="rtl"' : '') + '>' +
                '<div class="aras-ai-message-avatar">' + (type === 'bot' ? '🤖' : '👤') + '</div>' +
                '<div class="aras-ai-message-content">' + content + '</div></div>';
            $messages.append(html);
            scrollBottom();
        }

        function showTyping() {
            $messages.append('<div class="aras-ai-typing" id="arasAiTyping">' +
                '<div class="aras-ai-typing-dot"></div>' +
                '<div class="aras-ai-typing-dot"></div>' +
                '<div class="aras-ai-typing-dot"></div></div>');
            scrollBottom();
        }

        function removeTyping() {
            $('#arasAiTyping').remove();
        }

        function scrollBottom() {
            $messages.scrollTop($messages[0].scrollHeight);
        }

        // ── Send Message ──
        $form.on('submit', function (e) {
            e.preventDefault();
            sendMessage();
        });

        function sendMessage() {
            const message = $input.val().trim();
            if (!message || isProcessing) return;

            addMessage(message, 'user', currentLang);
            chatHistory.push({ role: 'user', content: message });

            $input.val('');
            isProcessing = true;
            $send.prop('disabled', true);
            showTyping();

            // If this is the first message, start a conversation
            if (!conversationId) {
                startConversation(message);
                return;
            }

            $.ajax({
                url: arasAiChat.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aras_ai_chat',
                    nonce: arasAiChat.nonce,
                    message: message,
                    history: JSON.stringify(chatHistory),
                    lang: currentLang,
                },
                success: function (response) {
                    removeTyping();
                    if (response.success) {
                        const reply = response.data.reply;
                        const replyLang = response.data.language;
                        const replyLangName = response.data.lang_name;

                        addMessage(reply, 'bot', replyLang);
                        chatHistory.push({ role: 'assistant', content: reply });

                        $('#arasAiResponseLang').find('.aras-lang-badge').text('🌐 Response in: ' + replyLangName);
                        $('#arasAiResponseLang').fadeIn(300).delay(4000).fadeOut(300);

                        // Speak response if voice is enabled
                        if (window.speechSynthesis && reply) {
                            speakText(reply, replyLang);
                        }
                    } else {
                        addMessage(response.data.message || arasAiChat.offline, 'bot');
                    }
                },
                error: function () {
                    removeTyping();
                    addMessage(arasAiChat.offline, 'bot');
                },
                complete: function () {
                    isProcessing = false;
                    $send.prop('disabled', false);
                    $input.focus();
                }
            });
        }

        // ── Start Conversation (notify admin) ──
        function startConversation(firstMessage) {
            $.post(arasAiChat.ajaxUrl, {
                action: 'aras_admin_chat_start',
                nonce: arasAiChat.nonce,
                name: 'Website Visitor',
                message: firstMessage,
                lang: currentLang,
            }, function (response) {
                if (response.success) {
                    conversationId = response.data.conversation_id;
                }
                // Continue with normal AI chat
                sendMessage();
            });
        }

        // ── Speech-to-Text (Voice Input) ──
        function initVoiceInput() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return; // Browser doesn't support
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            // Set recognition language
            const langMap = {
                'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
                'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
                'zh': 'zh-CN', 'ru': 'ru-RU',
            };
            recognition.lang = langMap[currentLang] || 'en-US';
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = function (event) {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                $input.val(transcript);

                if (event.results[event.results.length - 1].isFinal) {
                    $input.val(transcript);
                }
            };

            recognition.onerror = function () {
                console.log('Speech recognition error');
            };

            return recognition;
        }

        // ── Text-to-Speech (Voice Output) ──
        function speakText(text, lang) {
            if (!window.speechSynthesis) return;

            const langMap = {
                'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
                'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
                'zh': 'zh-CN', 'ru': 'ru-RU', 'hi': 'hi-IN', 'pt': 'pt-BR',
                'ja': 'ja-JP', 'ko': 'ko-KR',
            };

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langMap[lang] || 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            // Try to find a matching voice
            const voices = window.speechSynthesis.getVoices();
            const targetLang = langMap[lang] || 'en-US';
            const matchingVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            window.speechSynthesis.speak(utterance);
        }

        // Load voices
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = function () {};
            window.speechSynthesis.getVoices();
        }

        // ── Click Suggestion ──
        $(document).on('click', '.aras-ai-suggestion-item', function () {
            const question = $(this).data('question');
            if (question) {
                $input.val(question);
                sendMessage();
            }
        });

        // ── Keyboard ──
        $input.on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $window.is(':visible')) {
                $window.slideUp(250);
            }
        });

        setTimeout(checkStatus, 1000);
    });
})(jQuery);
