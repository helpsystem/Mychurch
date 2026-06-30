/**
 * Aras Tax Admin Chat - Real-time Voice Translation
 */
(function ($) {
    'use strict';

    $(document).ready(function () {
        if (typeof arasAdminChat === 'undefined') return;

        const state = {
            selectedConv: null,
            userLang: 'en',
            isRecording: false,
            recognition: null,
            isAutoSpeak: true,
        };

        const STT_LANGS = {
            'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
            'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
        };

        const TTS_LANGS = {
            'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
            'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
        };

        const LANG_NAMES = {
            'en': '🇺🇸 English', 'ar': '🇸🇦 العربية', 'ku': '🇮🇶 کوردی',
            'fa': '🇮🇷 فارسی', 'es': '🇪🇸 Español', 'tr': '🇹🇷 Türkçe',
            'fr': '🇫🇷 Français', 'de': '🇩🇪 Deutsch',
        };

        // DOM Elements
        const $convList = $('#arasConvList');
        const $convCount = $('#arasChatCount');
        const $chatHeader = $('#arasChatHeader');
        const $chatMessages = $('#arasChatMessages');
        const $chatWelcome = $('#arasChatWelcome');
        const $chatUserName = $('#arasChatUserName');
        const $chatUserLang = $('#arasChatUserLang');
        const $adminInput = $('#arasAdminInput');
        const $sendBtn = $('#arasAdminSend');
        const $voiceBtn = $('#arasVoiceInput');
        const $voiceIndicator = $('#arasVoiceIndicator');
        const $speakBtn = $('#trasSpeakMsg');
        const $suggestions = $('#arasSuggestedResponses');
        const $suggestList = $('#arasSuggestionsList');
        const $statusBar = $('#arasChatStatus');
        const $statusText = $('#arasStatusText');
        const $preview = $('#arasTranslationPreview');
        const $previewOrig = $('#arasPreviewOriginal');
        const $previewTrans = $('#arasPreviewTranslated');

        // Speech Recognition Setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        function initSpeechRecognition(lang) {
            if (!SpeechRecognition) {
                alert('Browser does not support speech recognition. Use Chrome or Edge.');
                return null;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = STT_LANGS[lang] || 'fa-IR';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = function () {
                state.isRecording = true;
                $voiceIndicator.fadeIn(200);
                $voiceBtn.addClass('recording');
                showStatus('🎤 Listening...');
            };

            recognition.onresult = function (event) {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript;
                    } else {
                        interimText += transcript;
                    }
                }

                // Show live interim text
                const displayText = finalText || interimText;
                $adminInput.val(displayText);

                if (finalText) {
                    translateAndSend(finalText, lang);
                }
            };

            recognition.onerror = function (event) {
                if (event.error !== 'no-speech') {
                    stopRecording();
                    showStatus('❌ Speech error: ' + event.error);
                }
            };

            recognition.onend = function () {
                if (state.isRecording) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            return recognition;
        }

        function translateAndSend(text, fromLang) {
            const toLang = state.userLang;

            if (fromLang === 'fa' && toLang !== 'fa') {
                // Admin spoke Persian → translate to user language
                showStatus('🌐 Translating Persian → ' + (LANG_NAMES[toLang] || toLang));

                $.ajax({
                    url: arasAdminChat.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'aras_admin_translate',
                        nonce: arasAdminChat.nonce,
                        text: text,
                        from: 'fa',
                        to: toLang,
                    },
                    success: function (response) {
                        if (response.success) {
                            $previewOrig.text(text);
                            $previewTrans.text(response.data.translation);
                            $preview.fadeIn(200);
                            $adminInput.attr('data-translated', response.data.translation);
                        }
                    }
                });
            } else if (fromLang !== 'fa') {
                // User spoke → translate to Persian for admin
                showStatus('🌐 Translating ' + (LANG_NAMES[fromLang] || fromLang) + ' → Persian');

                $.ajax({
                    url: arasAdminChat.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'aras_admin_translate',
                        nonce: arasAdminChat.nonce,
                        text: text,
                        from: fromLang,
                        to: 'fa',
                    },
                    success: function (response) {
                        if (response.success) {
                            addVoiceMessage(text, response.data.translation, fromLang);
                            if (state.isAutoSpeak) {
                                speakPersian(response.data.translation);
                            }
                        }
                    }
                });
            }
        }

        function addVoiceMessage(original, translated, lang) {
            const isRtl = ['ar', 'ku', 'fa'].includes(lang);
            const langName = LANG_NAMES[lang] || lang;
            const msgHtml = '<div class="aras-voice-message" dir="' + (isRtl ? 'rtl' : 'ltr') + '">' +
                '<div class="aras-voice-msg-header">' +
                '<span class="aras-voice-icon">🎤</span>' +
                '<span class="aras-voice-lang">' + langName + '</span>' +
                '<button class="aras-voice-play" onclick="window.arasSpeak(\'' + original.replace(/'/g, "\\'") + '\', \'' + lang + '\')">🔊 Play</button>' +
                '</div>' +
                '<div class="aras-voice-original">' + original + '</div>' +
                '<div class="aras-voice-translated">' +
                '<span class="aras-voice-trans-label">Persian Translation:</span> ' + translated +
                '</div></div>';

            $chatMessages.append(msgHtml);
            scrollBottom();
        }

        function speakPersian(text) {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fa-IR';
            utterance.rate = 0.9;

            const voices = window.speechSynthesis.getVoices();
            const faVoice = voices.find(v => v.lang.startsWith('fa'));
            if (faVoice) utterance.voice = faVoice;

            showStatus('🔊 Speaking...');
            utterance.onend = function () { hideStatus(); };
            window.speechSynthesis.speak(utterance);
        }

        // Expose speak function globally
        window.arasSpeak = function (text, lang) {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = TTS_LANGS[lang] || 'en-US';
            utterance.rate = 0.9;

            const voices = window.speechSynthesis.getVoices();
            const matchVoice = voices.find(v => v.lang.startsWith(lang));
            if (matchVoice) utterance.voice = matchVoice;

            window.speechSynthesis.speak(utterance);
        };

        function startRecording() {
            if (state.isRecording) { stopRecording(); return; }

            const lang = 'fa';
            state.recognition = initSpeechRecognition(lang);
            if (state.recognition) {
                try { state.recognition.start(); } catch(e) {}
            }
        }

        function stopRecording() {
            state.isRecording = false;
            if (state.recognition) {
                try { state.recognition.stop(); } catch(e) {}
            }
            $voiceIndicator.fadeOut(200);
            $voiceBtn.removeClass('recording');
            hideStatus();
        }

        function showStatus(text) {
            $statusText.text(text);
            $statusBar.fadeIn(200);
        }

        function hideStatus() {
            $statusBar.fadeOut(200);
        }

        function scrollBottom() {
            $chatMessages.scrollTop($chatMessages[0].scrollHeight);
        }

        // Load conversations
        function loadConversations() {
            $.post(arasAdminChat.ajaxUrl, {
                action: 'aras_admin_get_conversations',
                nonce: arasAdminChat.nonce,
            }, function (response) {
                if (response.success) renderConversations(response.data.conversations);
            });
        }

        function renderConversations(convs) {
            $convList.empty();
            $convCount.text(convs.length);

            if (!convs.length) {
                $convList.html('<div class="aras-acp-empty"><span class="aras-acp-empty-icon">💬</span><p>No conversations yet</p></div>');
                return;
            }

            convs.forEach(function (conv) {
                const initial = conv.user_name.charAt(0).toUpperCase();
                const $item = $('<div class="aras-acp-conv-item" data-conv-id="' + conv.id + '">' +
                    '<div class="aras-acp-conv-avatar">' + initial + '</div>' +
                    '<div class="aras-acp-conv-info">' +
                    '<div class="aras-acp-conv-name">' + conv.user_name + '</div>' +
                    '<div class="aras-acp-conv-msg">' + (conv.last_msg || '...') + '</div>' +
                    '</div>' +
                    '<span class="aras-acp-conv-time">' + conv.msg_count + ' 💬</span></div>');

                $item.on('click', function () {
                    selectConversation(conv.id, conv.user_lang, conv.user_name, conv.user_email, conv.started_at);
                });

                $convList.append($item);
            });
        }

        function selectConversation(convId, userLang, userName, userEmail, startedAt) {
            state.selectedConv = convId;
            state.userLang = userLang;

            $chatWelcome.hide();
            $chatHeader.show();
            $chatUserName.text(userName);
            $chatUserLang.text(LANG_NAMES[userLang] || userLang);
            $('#arasAcpUserLang').text('🌐 ' + (LANG_NAMES[userLang] || userLang));
            $('#arasAcpUserEmail').text('📧 ' + (userEmail || 'N/A'));
            $('#arasAcpUserTime').text('🕐 ' + startedAt);

            loadMessages(convId);
            loadSuggestions();
            $('#arasAcpPreviewLang').text('→ ' + (LANG_NAMES[userLang] || userLang));
        }

        function loadMessages(convId) {
            $.post(arasAdminChat.ajaxUrl, {
                action: 'aras_admin_get_messages',
                nonce: arasAdminChat.nonce,
                conversation_id: convId,
            }, function (response) {
                if (response.success) renderMessages(response.data.messages);
            });
        }

        function renderMessages(messages) {
            $chatMessages.empty();

            messages.forEach(function (msg) {
                const isUser = msg.role === 'user';
                const isRtl = ['ar', 'ku', 'fa'].includes(msg.lang);
                const langName = LANG_NAMES[msg.lang] || msg.lang;

                let bubbleContent = msg.content;
                if (msg.translation_used) {
                    bubbleContent += '<div class="aras-msg-translation">🌐 Translated from Persian → ' + langName + '</div>';
                }

                const html = '<div class="aras-msg ' + (isUser ? 'aras-msg-user' : 'aras-msg-admin') + '" dir="' + (isRtl ? 'rtl' : 'ltr') + '">' +
                    '<div class="aras-msg-avatar">' + (isUser ? '👤' : '👔') + '</div>' +
                    '<div class="aras-msg-bubble">' + bubbleContent +
                    '<div class="aras-msg-meta">' +
                    '<span class="aras-msg-lang">' + langName + '</span>' +
                    '<span class="aras-msg-time">' + msg.timestamp + '</span></div></div></div>';

                $chatMessages.append(html);
            });

            scrollBottom();
        }

        function loadSuggestions() {
            if (!state.selectedConv) return;

            const lastUserMsg = $chatMessages.find('.aras-msg-user:last .aras-msg-bubble').text().trim();
            if (!lastUserMsg) return;

            showStatus(arasAdminChat.suggesting);

            $.post(arasAdminChat.ajaxUrl, {
                action: 'aras_admin_suggest_response',
                nonce: arasAdminChat.nonce,
                conversation_id: state.selectedConv,
                user_message: lastUserMsg,
                user_lang: state.userLang,
                count: 3,
            }, function (response) {
                hideStatus();
                if (response.success && response.data.suggestions.length) {
                    $suggestList.empty();
                    response.data.suggestions.forEach(function (suggestion) {
                        const $item = $('<div class="aras-suggestion-item">' + suggestion + '</div>');
                        $item.on('click', function () {
                            $adminInput.val(suggestion);
                            $adminInput.focus();
                        });
                        $suggestList.append($item);
                    });
                    $suggestions.fadeIn(200);
                }
            });
        }

        // Send message
        function sendMessage() {
            const text = $adminInput.val().trim();
            if (!text || !state.selectedConv) return;

            let translatedText = $adminInput.attr('data-translated') || text;
            const autoTranslate = $('#arasAcpAutoTranslate').is(':checked');

            showStatus(arasAdminChat.sending);
            $sendBtn.prop('disabled', true);

            $.ajax({
                url: arasAdminChat.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aras_admin_chat_send',
                    nonce: arasAdminChat.nonce,
                    conversation_id: state.selectedConv,
                    message: text,
                    translated_message: translatedText,
                    auto_translate: autoTranslate ? 'yes' : 'no',
                    target_lang: state.userLang,
                },
                success: function (response) {
                    if (response.success) {
                        const adminMsgHtml = '<div class="aras-msg aras-msg-admin" dir="rtl">' +
                            '<div class="aras-msg-avatar">👔</div>' +
                            '<div class="aras-msg-bubble">' + response.data.original +
                            (response.data.translation_used ? '<div class="aras-msg-translation">🌐 Translated → ' + (LANG_NAMES[state.userLang] || state.userLang) + '</div>' : '') +
                            '<div class="aras-msg-meta"><span class="aras-msg-lang">🇮🇷 Persian</span>' +
                            '<span class="aras-msg-time">Just now</span></div></div></div>';

                        $chatMessages.append(adminMsgHtml);
                        scrollBottom();
                        $adminInput.val('').removeAttr('data-translated');
                        $preview.hide();
                        loadSuggestions();
                    }
                },
                error: function () { showStatus('❌ Send error'); },
                complete: function () {
                    $sendBtn.prop('disabled', false);
                    hideStatus();
                    $adminInput.focus();
                }
            });
        }

        // Event bindings
        $sendBtn.on('click', sendMessage);
        $voiceBtn.on('click', startRecording);
        $('#arasVoiceStop').on('click', stopRecording);

        $speakBtn.on('click', function () {
            state.isAutoSpeak = !state.isAutoSpeak;
            $(this).toggleClass('active', state.isAutoSpeak);
            showStatus(state.isAutoSpeak ? '🔊 Auto-speak ON' : '🔇 Auto-speak OFF');
            setTimeout(hideStatus, 2000);
        });

        $('#arasRefreshSuggestions').on('click', loadSuggestions);
        $('#arasHidePreview').on('click', function () { $preview.hide(); });
        $('#arasAcpClearBtn').on('click', function () { $adminInput.val(''); });

        $adminInput.on('keydown', function (e) {
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
        });

        // Auto-speak toggle for incoming messages
        $('#arasAcpSpeakToggle').on('click', function () {
            state.isAutoSpeak = !state.isAutoSpeak;
            $(this).toggleClass('active', state.isAutoSpeak);
        });

        // Init
        loadConversations();
        setInterval(loadConversations, 10000);

        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = function () {};
            window.speechSynthesis.getVoices();
        }
    });
})(jQuery);
