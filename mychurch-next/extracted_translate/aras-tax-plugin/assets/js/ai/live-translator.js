/**
 * Aras Tax Live Speech Translator - Frontend JavaScript
 * 
 * Real-time features:
 * - Live speech recognition with interim results
 * - Text appears AS you speak (word by word)
 * - Instant translation to target language
 * - Auto speech output (TTS) in target language
 * - Two-way conversation mode
 * - Audio waveform visualization
 * - Translation history
 */
(function ($) {
    'use strict';

    $(document).ready(function () {
        if (typeof arasLive === 'undefined') return;

        // ─── State ───
        const state = {
            isListening: false,
            isTranslating: false,
            isSpeaking: false,
            recognition: null,
            analyser: null,
            audioContext: null,
            mediaStream: null,
            animationId: null,
            convMode: false,
            activeSpeaker: 'a',
            history: [],
            currentText: '',
            interimText: '',
            translationTime: 0,
        };

        // Language codes for Web Speech API
        const STT_CODES = {
            'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
            'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
            'zh': 'zh-CN', 'ru': 'ru-RU', 'hi': 'hi-IN', 'pt': 'pt-BR',
            'ja': 'ja-JP', 'ko': 'ko-KR',
        };

        const TTS_CODES = {
            'en': 'en-US', 'ar': 'ar-SA', 'ku': 'ckb-IQ', 'fa': 'fa-IR',
            'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR', 'de': 'de-DE',
            'zh': 'zh-CN', 'ru': 'ru-RU', 'hi': 'hi-IN', 'pt': 'pt-BR',
            'ja': 'ja-JP', 'ko': 'ko-KR',
        };

        const LANG_NAMES = {
            'en': '🇺🇸 English', 'ar': '🇸🇦 العربية', 'ku': '🇮🇶 کوردی',
            'fa': '🇮🇷 فارسی', 'es': '🇪🇸 Español', 'tr': '🇹🇷 Türkçe',
            'fr': '🇫🇷 Français', 'de': '🇩🇪 Deutsch', 'zh': '🇨🇳 中文',
            'ru': '🇷🇺 Русский', 'hi': '🇮🇳 हिन्दी', 'pt': '🇧🇷 Português',
            'ja': '🇯🇵 日本語', 'ko': '🇰🇷 한국어',
        };

        const RTL_LANGS = ['ar', 'ku', 'fa', 'he', 'ur'];

        // ─── DOM Elements ───
        const $micBtn       = $('#arasLtMicBtn');
        const $micLabel     = $('#arasLtMicLabel');
        const $fromSelect   = $('#arasLtFrom');
        const $toSelect     = $('#arasLtTo');
        const $swapBtn      = $('#arasLtSwap');
        const $sourceContent = $('#arasLtSourceContent');
        const $targetContent = $('#arasLtTargetContent');
        const $sourceStatus = $('#arasLtSourceStatus');
        const $targetStatus = $('#arasLtTargetStatus');
        const $fromLang     = $('#arasLtFromLang');
        const $toLang       = $('#arasLtToLang');
        const $interim      = $('#arasLtInterim');
        const $interimText  = $('#arasLtInterimText');
        const $speed        = $('#arasLtSpeed');
        const $speedText    = $('#arasLtSpeedText');
        const $waveform     = $('#arasLtWaveform');
        const $waveCanvas   = $('#arasLtWaveCanvas');
        const $historyList  = $('#arasLtHistoryList');
        const $autoSpeak    = $('#arasLtAutoSpeak');
        const $continuous   = $('#arasLtContinuous');
        const $showInterim  = $('#arasLtShowInterim');
        const $convToggle   = $('#arasLtConvMode');
        const $convArea     = $('#arasLtConvArea');
        const $speakerA     = $('#arasLtSpeakerA');
        const $speakerB     = $('#arasLtSpeakerB');

        // ─── Check Browser Support ───
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            $micBtn.prop('disabled', true).addClass('disabled');
            $micLabel.text(arasLive.strings.error);
            return;
        }

        // ─── Mic Button Click ───
        $micBtn.on('click', function () {
            if (state.isListening) {
                stopListening();
            } else {
                startListening();
            }
        });

        // ─── Swap Languages ───
        $swapBtn.on('click', function () {
            const fromVal = $fromSelect.val();
            const toVal = $toSelect.val();

            // Don't allow swapping when "auto" is target
            if (toVal !== 'auto') {
                $fromSelect.val(toVal);
                $toSelect.val(fromVal === 'auto' ? 'en' : fromVal);
                updateLangLabels();
            }

            // Swap content too
            const sourceText = $sourceContent.text().trim();
            const targetText = $targetContent.text().trim();
            if (targetText && !targetText.includes('Translation will')) {
                $sourceContent.text(targetText);
                $targetContent.text(sourceText);
            }

            // Visual feedback
            $(this).css('transform', 'rotate(180deg)');
            setTimeout(() => $(this).css('transform', ''), 300);
        });

        // ─── Language Change ───
        $fromSelect.on('change', updateLangLabels);
        $toSelect.on('change', updateLangLabels);

        function updateLangLabels() {
            const fromLang = $fromSelect.val();
            const toLang = $toSelect.val();

            $fromLang.text('🎤 ' + (fromLang === 'auto' ? 'Auto-detect' : (LANG_NAMES[fromLang] || fromLang)));
            $toLang.text('🌐 ' + (LANG_NAMES[toLang] || toLang));

            // Update direction
            if (RTL_LANGS.includes(fromLang)) {
                $sourceContent.css('direction', 'rtl');
            } else {
                $sourceContent.css('direction', 'ltr');
            }

            if (RTL_LANGS.includes(toLang)) {
                $targetContent.css('direction', 'rtl');
            } else {
                $targetContent.css('direction', 'ltr');
            }
        }

        // ─── Conversation Mode ───
        $convToggle.on('change', function () {
            state.convMode = $(this).is(':checked');
            if (state.convMode) {
                $convArea.slideDown(200);
            } else {
                $convArea.slideUp(200);
            }
        });

        $speakerA.on('click', function () {
            state.activeSpeaker = 'a';
            $speakerA.addClass('active').removeClass('recording');
            $speakerB.removeClass('active recording');
            updateSpeakerLabels();
        });

        $speakerB.on('click', function () {
            state.activeSpeaker = 'b';
            $speakerB.addClass('active').removeClass('recording');
            $speakerA.removeClass('active recording');
            updateSpeakerLabels();
        });

        function updateSpeakerLabels() {
            const fromLang = $fromSelect.val();
            const toLang = $toSelect.val();

            if (state.activeSpeaker === 'a') {
                $speakerA.find('.aras-lt-conv-speaker-lang').text('🎤 Speaker A: ' + (LANG_NAMES[fromLang] || fromLang));
                $speakerB.find('.aras-lt-conv-speaker-lang').text('🌐 Speaker B: ' + (LANG_NAMES[toLang] || toLang));
            } else {
                $speakerB.find('.aras-lt-conv-speaker-lang').text('🎤 Speaker B: ' + (LANG_NAMES[toLang] || toLang));
                $speakerA.find('.aras-lt-conv-speaker-lang').text('🌐 Speaker A: ' + (LANG_NAMES[fromLang] || fromLang));
            }
        }

        // ─── Clear History ───
        $('#arasLtClearHistory').on('click', function () {
            state.history = [];
            $historyList.html('<div class="aras-lt-history-empty"><span>💭</span><p>' + arasLive.strings.noHistory + '</p></div>');
        });

        // ─── Copy Buttons ───
        $('#arasLtSourceCopy').on('click', function () {
            copyText($sourceContent.text());
        });
        $('#arasLtTargetCopy').on('click', function () {
            copyText($targetContent.text());
        });

        // ─── Speak Buttons ───
        $('#arasLtSourceSpeak').on('click', function () {
            speakText($sourceContent.text(), $fromSelect.val());
        });
        $('#arasLtTargetSpeak').on('click', function () {
            speakText($targetContent.text(), $toSelect.val());
        });

        function copyText(text) {
            if (!text || text.includes('will appear')) return;
            navigator.clipboard.writeText(text).then(function () {
                // Brief visual feedback
            });
        }

        // ─── Speech Recognition Setup ───
        function createRecognition(lang) {
            const recognition = new SpeechRecognition();
            recognition.lang = STT_CODES[lang] || 'en-US';
            recognition.continuous = $continuous.is(':checked');
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = function () {
                state.isListening = true;
                $micBtn.addClass('listening');
                $micLabel.text(arasLive.strings.listening);
                $sourceStatus.html('🔴 ' + arasLive.strings.listening);
                startWaveform();
            };

            recognition.onresult = function (event) {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Show interim results LIVE
                if (interimTranscript && $showInterim.is(':checked')) {
                    state.interimText = interimTranscript;
                    $interim.fadeIn(100);
                    $interimText.text(interimTranscript);
                    $sourceStatus.html('🟡 Speaking...');
                }

                // When we have final text, process it
                if (finalTranscript) {
                    state.currentText += (state.currentText ? ' ' : '') + finalTranscript;
                    $sourceContent.text(state.currentText);
                    $interim.hide();

                    // Auto-translate
                    translateText(state.currentText, $fromSelect.val(), $toSelect.val());
                }
            };

            recognition.onerror = function (event) {
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    console.log('Speech error:', event.error);
                    stopListening();
                    $sourceStatus.html('❌ Error: ' + event.error);
                }
            };

            recognition.onend = function () {
                // Auto-restart if continuous mode
                if (state.isListening && $continuous.is(':checked')) {
                    try { recognition.start(); } catch (e) {
                        stopListening();
                    }
                } else {
                    stopListening();
                }
            };

            return recognition;
        }

        // ─── Start Listening ───
        function startListening() {
            const lang = $fromSelect.val();
            state.recognition = createRecognition(lang === 'auto' ? 'en' : lang);
            state.currentText = '';
            state.interimText = '';

            try {
                state.recognition.start();
            } catch (e) {
                console.log('Recognition error:', e);
                stopListening();
            }
        }

        // ─── Stop Listening ───
        function stopListening() {
            state.isListening = false;
            if (state.recognition) {
                try { state.recognition.stop(); } catch (e) {}
                state.recognition = null;
            }
            stopWaveform();
            $micBtn.removeClass('listening');
            $micLabel.text(arasLive.strings.idle);
            $sourceStatus.html('⏸ ' + arasLive.strings.waiting);
            $interim.hide();
        }

        // ─── Waveform Visualization ───
        function startWaveform() {
            const canvas = $waveCanvas[0];
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) {
                    state.mediaStream = stream;
                    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = state.audioContext.createMediaStreamSource(stream);
                    state.analyser = state.audioContext.createAnalyser();
                    state.analyser.fftSize = 256;
                    source.connect(state.analyser);

                    const bufferLength = state.analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    function drawWave() {
                        if (!state.isListening) return;

                        state.animationId = requestAnimationFrame(drawWave);
                        state.analyser.getByteFrequencyData(dataArray);

                        ctx.clearRect(0, 0, width, height);

                        const barWidth = (width / bufferLength) * 2.5;
                        let x = 0;

                        for (let i = 0; i < bufferLength; i++) {
                            const barHeight = (dataArray[i] / 255) * height;

                            // Gradient color based on amplitude
                            const hue = 210 + (dataArray[i] / 255) * 30;
                            const saturation = 60 + (dataArray[i] / 255) * 20;
                            ctx.fillStyle = 'hsla(' + hue + ', ' + saturation + '%, 50%, 0.7)';

                            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
                            x += barWidth;
                        }
                    }

                    drawWave();
                })
                .catch(function (err) {
                    console.log('Microphone access denied:', err);
                });
        }

        function stopWaveform() {
            if (state.animationId) {
                cancelAnimationFrame(state.animationId);
            }
            if (state.mediaStream) {
                state.mediaStream.getTracks().forEach(function (track) {
                    track.stop();
                });
                state.mediaStream = null;
            }
            if (state.audioContext) {
                state.audioContext.close();
                state.audioContext = null;
            }

            // Clear canvas
            const canvas = $waveCanvas[0];
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // ─── Translate Text via AJAX ───
        function translateText(text, fromLang, toLang) {
            if (!text || fromLang === toLang) {
                $targetContent.text(text);
                return;
            }

            const startTime = performance.now();
            state.isTranslating = true;
            $micBtn.addClass('translating');
            $micLabel.text(arasLive.strings.processing);
            $targetStatus.html('⚡ ' + arasLive.strings.processing);

            $.ajax({
                url: arasLive.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aras_ai_translate',
                    nonce: arasLive.nonce,
                    text: text,
                    from: fromLang,
                    to: toLang,
                },
                success: function (response) {
                    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
                    state.translationTime = elapsed;

                    if (response.success) {
                        const translation = response.data.translation;
                        $targetContent.text(translation);
                        $targetStatus.html('✅ Translated in ' + elapsed + 's');

                        // Show speed indicator
                        $speed.fadeIn(200);
                        $speedText.text('⚡ Translated in ' + elapsed + ' seconds');
                        setTimeout(function () { $speed.fadeOut(500); }, 3000);

                        // Auto-speak if enabled
                        if ($autoSpeak.is(':checked')) {
                            speakText(translation, toLang);
                        }

                        // Add to history
                        addToHistory(text, translation, fromLang, toLang, elapsed);
                    } else {
                        $targetContent.text(response.data.message || 'Translation error');
                        $targetStatus.html('❌ Error');
                    }
                },
                error: function () {
                    $targetContent.text('Translation service unavailable');
                    $targetStatus.html('❌ Error');
                },
                complete: function () {
                    state.isTranslating = false;
                    $micBtn.removeClass('translating');
                    if (state.isListening) {
                        $micLabel.text(arasLive.strings.listening);
                    } else {
                        $micLabel.text(arasLive.strings.idle);
                    }
                }
            });
        }

        // ─── Add to History ───
        function addToHistory(original, translated, from, to, time) {
            const item = {
                original: original,
                translated: translated,
                from: from,
                to: to,
                time: time,
                timestamp: new Date().toLocaleTimeString(),
            };

            state.history.unshift(item);

            // Keep only last 50
            if (state.history.length > 50) {
                state.history.pop();
            }

            renderHistory();
        }

        function renderHistory() {
            if (!state.history.length) {
                $historyList.html('<div class="aras-lt-history-empty"><span>💭</span><p>No translations yet</p></div>');
                return;
            }

            $historyList.empty();

            state.history.forEach(function (item) {
                const fromName = LANG_NAMES[item.from] || item.from;
                const toName = LANG_NAMES[item.to] || item.to;

                const html = '<div class="aras-lt-history-item">' +
                    '<div class="aras-lt-history-original">' + escapeHtml(item.original) + '</div>' +
                    '<div class="aras-lt-history-arrow">→</div>' +
                    '<div class="aras-lt-history-translated">' + escapeHtml(item.translated) + '</div>' +
                    '<div class="aras-lt-history-time">' + item.timestamp + ' • ' + fromName + ' → ' + toName + ' • ' + item.time + 's</div>' +
                    '</div>';

                $historyList.append(html);
            });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ─── Text-to-Speech ───
        function speakText(text, lang) {
            if (!window.speechSynthesis || !text) return;

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = TTS_CODES[lang] || 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            // Try to find matching voice
            const voices = window.speechSynthesis.getVoices();
            const targetLang = TTS_CODES[lang] || 'en-US';
            const matchingVoice = voices.find(function (v) {
                return v.lang.startsWith(targetLang.split('-')[0]);
            });

            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            utterance.onstart = function () {
                state.isSpeaking = true;
                $micBtn.addClass('speaking');
                $micLabel.text(arasLive.strings.speaking);
                $targetStatus.html('🔊 ' + arasLive.strings.speaking);
            };

            utterance.onend = function () {
                state.isSpeaking = false;
                $micBtn.removeClass('speaking');
                if (state.isListening) {
                    $micLabel.text(arasLive.strings.listening);
                } else {
                    $micLabel.text(arasLive.strings.idle);
                }
                $targetStatus.html('✅ Done');
            };

            window.speechSynthesis.speak(utterance);
        }

        // ─── Load Voices ───
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = function () {
                window.speechSynthesis.getVoices();
            };
            window.speechSynthesis.getVoices();
        }

        // ─── Init ───
        updateLangLabels();
        renderHistory();
    });
})(jQuery);
