<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Aras Tax AI Chat v3 - Enhanced with Admin Chat Integration
 */
class Aras_Tax_AI_Chat {

    public function __construct() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
        add_action( 'wp_footer', array( $this, 'render_chat_button' ) );
        add_shortcode( 'aras_ai_chat', array( $this, 'render_chat_shortcode' ) );
    }

    public function enqueue_assets() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $enabled = isset( $options['aras_ai_enabled'] ) && $options['aras_ai_enabled'] === 'yes';

        if ( ! $enabled ) return;

        wp_enqueue_style(
            'aras-tax-ai-chat',
            ARAS_TAX_PLUGIN_URL . 'assets/css/ai/chat.css',
            array(),
            ARAS_TAX_VERSION
        );

        wp_enqueue_script(
            'aras-tax-ai-chat',
            ARAS_TAX_PLUGIN_URL . 'assets/js/ai/chat.js',
            array( 'jquery' ),
            ARAS_TAX_VERSION,
            true
        );

        $options = get_option( 'aras_tax_options', array() );
        $browser_lang = $this->get_browser_language();

        wp_localize_script( 'aras-tax-ai-chat', 'arasAiChat', array(
            'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
            'nonce'         => wp_create_nonce( 'aras_ai_nonce' ),
            'primaryColor'  => $options['aras_tax_primary_color'] ?? '#1a365d',
            'accentColor'   => $options['aras_tax_accent_color'] ?? '#c9a84c',
            'title'         => __( 'Aras Tax AI Assistant', 'aras-tax' ),
            'placeholder'   => __( 'Ask a tax question...', 'aras-tax' ),
            'send'          => __( 'Send', 'aras-tax' ),
            'typing'        => __( 'AI is typing...', 'aras-tax' ),
            'offline'       => __( 'AI service is offline.', 'aras-tax' ),
            'disclaimer'    => __( 'AI provides general info. Consult a CPA.', 'aras-tax' ),
            'poweredBy'     => __( 'Powered by', 'aras-tax' ),
            'browserLang'   => $browser_lang,
            'autoDetected'  => sprintf( __( '🌐 Detected: %s', 'aras-tax' ), $browser_lang ),
            'suggestTitle'  => __( '💡 Suggested questions:', 'aras-tax' ),
        ) );
    }

    private function get_browser_language() {
        if ( ! isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) return 'en';
        $browser = strtolower( substr( $_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2 ) );
        $lang_map = array(
            'en' => 'en', 'ar' => 'ar', 'ku' => 'ku', 'fa' => 'fa',
            'es' => 'es', 'fr' => 'fr', 'de' => 'de', 'tr' => 'tr',
            'zh' => 'zh', 'ru' => 'ru', 'hi' => 'hi', 'pt' => 'pt',
            'ja' => 'ja', 'ko' => 'ko',
        );
        return isset( $lang_map[ $browser ] ) ? $lang_map[ $browser ] : 'en';
    }

    public function render_chat_button() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $enabled = isset( $options['aras_ai_enabled'] ) && $options['aras_ai_enabled'] === 'yes';
        $chat_enabled = isset( $options['aras_ai_chat_enabled'] ) && $options['aras_ai_chat_enabled'] === 'yes';

        if ( ! $enabled || ! $chat_enabled || is_admin() ) return;
        ?>
        <button id="arasAiChatToggle" class="aras-ai-chat-toggle" aria-label="Open Chat">
            <span class="aras-ai-chat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
                </svg>
            </span>
            <span class="aras-ai-chat-badge">AI</span>
        </button>

        <div id="arasAiChatWindow" class="aras-ai-chat-window" style="display:none;">
            <div class="aras-ai-chat-header">
                <div class="aras-ai-chat-header-info">
                    <div class="aras-ai-chat-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M12 2L18 6V10C18 14 15.5 17 12 18C8.5 17 6 14 6 10V6L12 2Z"/>
                            <circle cx="12" cy="10" r="2"/>
                        </svg>
                    </div>
                    <div>
                        <div class="aras-ai-chat-title">Aras Tax AI</div>
                        <div class="aras-ai-chat-status">
                            <span class="aras-status-dot"></span>
                            <span class="aras-status-text">Online</span>
                        </div>
                        <div class="aras-ai-lang-detect" id="arasAiLangDetect">🔍 Detecting...</div>
                    </div>
                </div>
                <div class="aras-ai-header-actions">
                    <button id="arasAiLangSelector" class="aras-ai-lang-btn" title="Language">🌐</button>
                    <button id="arasAiChatClose" class="aras-ai-chat-close">✕</button>
                </div>
            </div>

            <div id="arasAiLangDropdown" class="aras-ai-lang-dropdown" style="display:none;">
                <div class="aras-lang-option" data-lang="auto">🔍 Auto</div>
                <div class="aras-lang-option" data-lang="en">🇺🇸 English</div>
                <div class="aras-lang-option" data-lang="ar">🇸🇦 العربية</div>
                <div class="aras-lang-option" data-lang="ku">🇮🇶 کوردی</div>
                <div class="aras-lang-option" data-lang="fa">🇮🇷 فارسی</div>
                <div class="aras-lang-option" data-lang="es">🇪🇸 Español</div>
                <div class="aras-lang-option" data-lang="tr">🇹🇷 Türkçe</div>
                <div class="aras-lang-option" data-lang="fr">🇫🇷 Français</div>
            </div>

            <div id="arasAiChatMessages" class="aras-ai-chat-messages">
                <div class="aras-ai-message aras-ai-bot-message">
                    <div class="aras-ai-message-avatar">🤖</div>
                    <div class="aras-ai-message-content">
                        <p class="aras-ai-welcome-text">
                            <?php _e( 'Hello! 👋 I\'m your Aras Tax AI assistant.', 'aras-tax' ); ?><br>
                            <?php _e( 'Ask me anything about taxes, deductions, or forms.', 'aras-tax' ); ?>
                        </p>
                        <div class="aras-ai-suggestions-container" id="arasAiSuggestions">
                            <p class="aras-suggestions-title">💡 <?php _e( 'Quick questions:', 'aras-tax' ); ?></p>
                            <div class="aras-ai-suggestions" id="arasAiSuggestionList"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="aras-ai-chat-input-area">
                <form id="arasAiChatForm" class="aras-ai-chat-form">
                    <input type="text" id="arasAiChatInput" class="aras-ai-chat-input"
                           placeholder="<?php esc_attr_e('Ask a tax question...', 'aras-tax'); ?>" autocomplete="off" />
                    <button type="submit" id="arasAiChatSend" class="aras-ai-chat-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </form>
                <div class="aras-ai-disclaimer">
                    <?php _e( '🤖 AI provides general info. Consult a CPA for advice.', 'aras-tax' ); ?>
                </div>
                <div class="aras-ai-response-lang" id="arasAiResponseLang" style="display:none;">
                    <span class="aras-lang-badge"></span>
                </div>
            </div>
        </div>
        <?php
    }

    public function render_chat_shortcode( $atts ) {
        ob_start();
        $this->render_chat_button();
        ?>
        <style>.aras-ai-chat-window-shortcode{position:static!important;width:100%!important;max-width:700px!important;height:600px!important;margin:20px auto;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.15)}</style>
        <?php
        return ob_get_clean();
    }
}
