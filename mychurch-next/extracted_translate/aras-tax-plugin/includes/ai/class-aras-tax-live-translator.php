<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Aras Tax Live Speech Translator
 * 
 * Real-time speech-to-speech translation:
 * - Live speech recognition with interim results
 * - Real-time text display as you speak
 * - Instant translation to target language
 * - Auto speech output in target language
 * - Conversation mode (two-way)
 */
class Aras_Tax_Live_Translator {

    public function __construct() {
        add_shortcode( 'aras_live_translator', array( $this, 'render_live_translator' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_live_assets' ) );
    }

    public function enqueue_live_assets() {
        wp_enqueue_style( 'aras-live-translator', ARAS_TAX_PLUGIN_URL . 'assets/css/ai/live-translator.css', array(), ARAS_TAX_VERSION );
        wp_enqueue_script( 'aras-live-translator', ARAS_TAX_PLUGIN_URL . 'assets/js/ai/live-translator.js', array( 'jquery' ), ARAS_TAX_VERSION, true );

        wp_localize_script( 'aras-live-translator', 'arasLive', array(
            'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
            'nonce'     => wp_create_nonce( 'aras_ai_nonce' ),
            'languages' => Aras_Tax_AI_Engine::get_available_languages(),
            'strings'   => array(
                'startListening'  => __( 'Start Listening', 'aras-tax' ),
                'stopListening'   => __( 'Stop', 'aras-tax' ),
                'listening'       => __( '🎤 Listening...', 'aras-tax' ),
                'processing'      => __( '⚡ Translating...', 'aras-tax' ),
                'speaking'        => __( '🔊 Speaking...', 'aras-tax' ),
                'idle'            => __( 'Press to start speaking', 'aras-tax' ),
                'error'           => __( 'Speech recognition not supported', 'aras-tax' ),
                'swapLangs'       => __( 'Swap Languages', 'aras-tax' ),
                'conversation'    => __( 'Conversation Mode', 'aras-tax' ),
                'autoSpeak'       => __( 'Auto-speak translation', 'aras-tax' ),
                'liveTranscript'  => __( 'Live Transcript', 'aras-tax' ),
                'translation'     => __( 'Translation', 'aras-tax' ),
                'clearAll'        => __( 'Clear', 'aras-tax' ),
                'copyText'        => __( 'Copy', 'aras-tax' ),
                'speakText'       => __( 'Speak', 'aras-tax' ),
                'waiting'         => __( 'Waiting for speech...', 'aras-tax' ),
                'detected'        => __( 'Detected', 'aras-tax' ),
            ),
        ) );
    }

    public function render_live_translator( $atts ) {
        $atts = shortcode_atts( array(
            'from'        => 'auto',
            'to'          => 'ar',
            'title'       => __( 'Live Speech Translator', 'aras-tax' ),
            'conversation' => 'yes',
            'auto_speak'  => 'yes',
            'show_history' => 'yes',
        ), $atts, 'aras_live_translator' );

        $languages = Aras_Tax_AI_Engine::get_available_languages();
        $lang_flags = array(
            'en' => '🇺🇸', 'ar' => '🇸🇦', 'ku' => '🇮🇶', 'fa' => '🇮🇷',
            'es' => '🇪🇸', 'fr' => '🇫🇷', 'de' => '🇩🇪', 'tr' => '🇹🇷',
            'zh' => '🇨🇳', 'ru' => '🇷🇺', 'hi' => '🇮🇳', 'pt' => '🇧🇷',
            'ja' => '🇯🇵', 'ko' => '🇰🇷',
        );

        ob_start();
        ?>
        <div class="aras-live-translator" id="arasLiveTranslator"
             data-auto-speak="<?php echo esc_attr( $atts['auto_speak'] ); ?>"
             data-conversation="<?php echo esc_attr( $atts['conversation'] ); ?>">

            <!-- Header -->
            <div class="aras-lt-header">
                <span class="aras-lt-header-icon">🎙️</span>
                <div class="aras-lt-header-text">
                    <h2><?php echo esc_html( $atts['title'] ); ?></h2>
                    <p><?php _e( 'Real-time speech translation with AI', 'aras-tax' ); ?></p>
                </div>
            </div>

            <!-- Language Bar -->
            <div class="aras-lt-lang-bar">
                <div class="aras-lt-lang-select">
                    <label><?php _e( 'Speaking in:', 'aras-tax' ); ?></label>
                    <select id="arasLtFrom">
                        <?php foreach ( $languages as $code => $name ) : ?>
                            <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $atts['from'], $code ); ?>>
                                <?php echo esc_html( $name ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <button id="arasLtSwap" class="aras-lt-swap-btn" title="<?php esc_attr_e( 'Swap languages', 'aras-tax' ); ?>">
                    ⇄
                </button>

                <div class="aras-lt-lang-select">
                    <label><?php _e( 'Translate to:', 'aras-tax' ); ?></label>
                    <select id="arasLtTo">
                        <?php foreach ( $languages as $code => $name ) : ?>
                            <?php if ( $code !== 'auto' ) : ?>
                            <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $atts['to'], $code ); ?>>
                                <?php echo esc_html( $name ); ?>
                            </option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <!-- Main Translation Area -->
            <div class="aras-lt-main">
                <!-- Left: Original Speech -->
                <div class="aras-lt-panel aras-lt-panel-source">
                    <div class="aras-lt-panel-header">
                        <span class="aras-lt-panel-lang" id="arasLtFromLang">🎤 Speaking...</span>
                        <span class="aras-lt-panel-status" id="arasLtSourceStatus">⏸ <?php _e( 'Press to start', 'aras-tax' ); ?></span>
                    </div>
                    <div class="aras-lt-panel-content" id="arasLtSourceContent">
                        <span class="aras-lt-placeholder"><?php _e( 'Your speech will appear here as you talk...', 'aras-tax' ); ?></span>
                    </div>
                    <div class="aras-lt-panel-actions">
                        <button class="aras-lt-action-btn" id="arasLtSourceCopy" title="Copy">📋</button>
                        <button class="aras-lt-action-btn" id="arasLtSourceSpeak" title="Speak">🔊</button>
                    </div>
                </div>

                <!-- Center: Big Mic Button -->
                <div class="aras-lt-center">
                    <button id="arasLtMicBtn" class="aras-lt-mic-btn" title="Start Speaking">
                        <div class="aras-lt-mic-inner">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        </div>
                        <div class="aras-lt-mic-ring"></div>
                        <div class="aras-lt-mic-label" id="arasLtMicLabel">
                            <?php _e( 'Press to Speak', 'aras-tax' ); ?>
                        </div>
                    </button>

                    <!-- Waveform Visualizer -->
                    <div class="aras-lt-waveform" id="arasLtWaveform">
                        <canvas id="arasLtWaveCanvas" width="200" height="60"></canvas>
                    </div>
                </div>

                <!-- Right: Translated Speech -->
                <div class="aras-lt-panel aras-lt-panel-target">
                    <div class="aras-lt-panel-header">
                        <span class="aras-lt-panel-lang" id="arasLtToLang">🌐 Translation...</span>
                        <span class="aras-lt-panel-status" id="arasLtTargetStatus">⏳ <?php _e( 'Waiting...', 'aras-tax' ); ?></span>
                    </div>
                    <div class="aras-lt-panel-content" id="arasLtTargetContent">
                        <span class="aras-lt-placeholder"><?php _e( 'Translation will appear here...', 'aras-tax' ); ?></span>
                    </div>
                    <div class="aras-lt-panel-actions">
                        <button class="aras-lt-action-btn" id="arasLtTargetCopy" title="Copy">📋</button>
                        <button class="aras-lt-action-btn" id="arasLtTargetSpeak" title="Speak">🔊</button>
                    </div>
                </div>
            </div>

            <!-- Live Interim Text (shown while speaking) -->
            <div class="aras-lt-interim" id="arasLtInterim" style="display:none;">
                <span class="aras-lt-interim-label">💬 <?php _e( 'Live:', 'aras-tax' ); ?></span>
                <span class="aras-lt-interim-text" id="arasLtInterimText"></span>
            </div>

            <!-- Translation Speed Indicator -->
            <div class="aras-lt-speed" id="arasLtSpeed" style="display:none;">
                <span class="aras-lt-speed-icon">⚡</span>
                <span class="aras-lt-speed-text" id="arasLtSpeedText"></span>
            </div>

            <!-- Conversation Mode (Two-way) -->
            <?php if ( $atts['conversation'] === 'yes' ) : ?>
            <div class="aras-lt-conversation">
                <div class="aras-lt-conv-header">
                    <span>💬</span>
                    <span><?php _e( 'Conversation Mode', 'aras-tax' ); ?></span>
                    <label class="aras-lt-conv-toggle">
                        <input type="checkbox" id="arasLtConvMode" />
                        <span class="aras-lt-conv-slider"></span>
                    </label>
                </div>
                <div id="arasLtConvArea" class="aras-lt-conv-area" style="display:none;">
                    <div class="aras-lt-conv-speakers">
                        <button class="aras-lt-conv-speaker active" data-side="a" id="arasLtSpeakerA">
                            <span class="aras-lt-conv-speaker-lang" id="arasLtSpeakerALang">🎤 Speaker A</span>
                        </button>
                        <span class="aras-lt-conv-vs">↔</span>
                        <button class="aras-lt-conv-speaker" data-side="b" id="arasLtSpeakerB">
                            <span class="aras-lt-conv-speaker-lang" id="arasLtSpeakerBLang">🌐 Speaker B</span>
                        </button>
                    </div>
                    <p class="aras-lt-conv-hint">
                        <?php _e( 'Each speaker presses their button to talk. The other side hears the translation.', 'aras-tax' ); ?>
                    </p>
                </div>
            </div>
            <?php endif; ?>

            <!-- History -->
            <?php if ( $atts['show_history'] === 'yes' ) : ?>
            <div class="aras-lt-history">
                <div class="aras-lt-history-header">
                    <h3>📜 <?php _e( 'Translation History', 'aras-tax' ); ?></h3>
                    <button id="arasLtClearHistory" class="aras-lt-clear-btn">🗑️ <?php _e( 'Clear All', 'aras-tax' ); ?></button>
                </div>
                <div id="arasLtHistoryList" class="aras-lt-history-list">
                    <div class="aras-lt-history-empty">
                        <span>💭</span>
                        <p><?php _e( 'No translations yet. Press the mic button to start!', 'aras-tax' ); ?></p>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Settings Row -->
            <div class="aras-lt-settings">
                <label class="aras-lt-setting">
                    <input type="checkbox" id="arasLtAutoSpeak" <?php checked( $atts['auto_speak'], 'yes' ); ?> />
                    <span class="aras-lt-setting-slider"></span>
                    <span class="aras-lt-setting-label">🔊 <?php _e( 'Auto-speak translation', 'aras-tax' ); ?></span>
                </label>

                <label class="aras-lt-setting">
                    <input type="checkbox" id="arasLtContinuous" checked />
                    <span class="aras-lt-setting-slider"></span>
                    <span class="aras-lt-setting-label">🔄 <?php _e( 'Continuous listening', 'aras-tax' ); ?></span>
                </label>

                <label class="aras-lt-setting">
                    <input type="checkbox" id="arasLtShowInterim" checked />
                    <span class="aras-lt-setting-slider"></span>
                    <span class="aras-lt-setting-label">📝 <?php _e( 'Show live transcript', 'aras-tax' ); ?></span>
                </label>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
