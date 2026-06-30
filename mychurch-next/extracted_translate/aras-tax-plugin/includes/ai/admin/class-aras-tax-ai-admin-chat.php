<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Aras Tax AI Admin Chat - Complete Admin Panel
 */
class Aras_Tax_AI_Admin_Chat {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_admin_chat_menu' ), 12 );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

        // AJAX handlers
        add_action( 'wp_ajax_aras_admin_chat_send', array( $this, 'admin_send_message' ) );
        add_action( 'wp_ajax_aras_admin_get_messages', array( $this, 'get_messages' ) );
        add_action( 'wp_ajax_aras_admin_get_conversations', array( $this, 'get_conversations' ) );
        add_action( 'wp_ajax_aras_admin_suggest_response', array( $this, 'suggest_response' ) );
        add_action( 'wp_ajax_aras_admin_voice_process', array( $this, 'voice_process' ) );
        add_action( 'wp_ajax_nopriv_aras_admin_chat_start', array( $this, 'start_chat' ) );
    }

    public function add_admin_chat_menu() {
        add_submenu_page(
            'aras-tax-settings',
            __( '💬 Admin Chat', 'aras-tax' ),
            __( '💬 Admin Chat', 'aras-tax' ),
            'manage_options',
            'aras-tax-admin-chat',
            array( $this, 'render_admin_chat_page' )
        );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'aras-tax-admin-chat' ) === false ) return;

        wp_enqueue_style( 'aras-tax-admin-chat', ARAS_TAX_PLUGIN_URL . 'assets/css/ai/admin/chat.css', array(), ARAS_TAX_VERSION );
        wp_enqueue_script( 'aras-tax-admin-chat', ARAS_TAX_PLUGIN_URL . 'assets/js/ai/admin/chat.js', array( 'jquery' ), ARAS_TAX_VERSION, true );

        wp_localize_script( 'aras-tax-admin-chat', 'arasAdminChat', array(
            'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
            'nonce'         => wp_create_nonce( 'aras_admin_nonce' ),
            'listening'     => __( '🎤 Listening...', 'aras-tax' ),
            'speaking'      => __( '🔊 Speaking...', 'aras-tax' ),
            'sending'       => __( '⏳ Translating & Sending...', 'aras-tax' ),
            'suggesting'    => __( '🤖 Generating suggestions...', 'aras-tax' ),
            'noConv'        => __( 'Select a conversation', 'aras-tax' ),
            'placeholder'   => __( 'پاسخ خود را به فارسی بنویسید...', 'aras-tax' ),
        ) );
    }

    /**
     * Admin Chat Page
     */
    public function render_admin_chat_page() {
        $options = get_option( 'aras_tax_ai_options', array() );
        ?>
        <div class="wrap aras-admin-chat-page">
            <div class="aras-acp-header">
                <h1>🤖 <span class="aras-acp-brand">Aras Tax</span> — <?php _e( 'Admin Chat Center', 'aras-tax' ); ?></h1>
                <div class="aras-acp-header-actions">
                    <span class="aras-acp-status" id="arasAcpStatus">
                        <span class="aras-acp-status-dot"></span>
                        <?php _e( 'Checking AI...', 'aras-tax' ); ?>
                    </span>
                    <button id="arasAcpSettings" class="aras-acp-btn aras-acp-btn-outline">⚙️ <?php _e( 'Settings', 'aras-tax' ); ?></button>
                </div>
            </div>

            <div class="aras-acp-container">
                <!-- LEFT: Conversations Sidebar -->
                <div class="aras-acp-sidebar">
                    <div class="aras-acp-sidebar-header">
                        <h3>💬 <?php _e( 'Conversations', 'aras-tax' ); ?></h3>
                        <span class="aras-acp-count" id="arasConvCount">0</span>
                    </div>
                    <div class="aras-acp-search">
                        <input type="text" id="arasConvSearch" placeholder="🔍 <?php esc_attr_e( 'Search conversations...', 'aras-tax' ); ?>" />
                    </div>
                    <div id="arasConvList" class="aras-acp-conv-list">
                        <div class="aras-acp-empty">
                            <span class="aras-acp-empty-icon">💬</span>
                            <p><?php _e( 'No conversations yet', 'aras-tax' ); ?></p>
                        </div>
                    </div>
                </div>

                <!-- RIGHT: Chat Area -->
                <div class="aras-acp-main" id="arasAcpMain">
                    <!-- Welcome (shown when no conversation selected) -->
                    <div id="arasAcpWelcome" class="aras-acp-welcome">
                        <div class="aras-acp-welcome-content">
                            <span class="aras-acp-welcome-icon">💬</span>
                            <h2><?php _e( 'Welcome to Admin Chat Center', 'aras-tax' ); ?></h2>
                            <p><?php _e( 'Select a conversation from the left to start chatting with your visitors.', 'aras-tax' ); ?></p>
                            <div class="aras-acp-features">
                                <div class="aras-acp-feature">
                                    <span class="aras-acp-feature-icon">🌐</span>
                                    <div>
                                        <h4><?php _e( 'Auto Translation', 'aras-tax' ); ?></h4>
                                        <p><?php _e( 'User messages translated to Persian automatically', 'aras-tax' ); ?></p>
                                    </div>
                                </div>
                                <div class="aras-acp-feature">
                                    <span class="aras-acp-feature-icon">🤖</span>
                                    <div>
                                        <h4><?php _e( 'AI Suggestions', 'aras-tax' ); ?></h4>
                                        <p><?php _e( 'Smart Persian response suggestions', 'aras-tax' ); ?></p>
                                    </div>
                                </div>
                                <div class="aras-acp-feature">
                                    <span class="aras-acp-feature-icon">🎤</span>
                                    <div>
                                        <h4><?php _e( 'Voice Input', 'aras-tax' ); ?></h4>
                                        <p><?php _e( 'Speak your response, auto-translated to user language', 'aras-tax' ); ?></p>
                                    </div>
                                </div>
                                <div class="aras-acp-feature">
                                    <span class="aras-acp-feature-icon">🔊</span>
                                    <div>
                                        <h4><?php _e( 'Voice Output', 'aras-tax' ); ?></h4>
                                        <p><?php _e( 'Listen to user messages in their language', 'aras-tax' ); ?></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Active Chat (hidden by default) -->
                    <div id="arasAcpChat" class="aras-acp-chat" style="display:none;">
                        <!-- Chat Header -->
                        <div class="aras-acp-chat-header">
                            <div class="aras-acp-user-info">
                                <div class="aras-acp-user-avatar">👤</div>
                                <div>
                                    <h4 id="arasAcpUserName">—</h4>
                                    <div class="aras-acp-user-meta">
                                        <span id="arasAcpUserLang" class="aras-acp-lang-badge">🌐 —</span>
                                        <span id="arasAcpUserTime" class="aras-acp-time-badge">🕐 —</span>
                                        <span id="arasAcpUserEmail" class="aras-acp-email-badge">📧 —</span>
                                    </div>
                                </div>
                            </div>
                            <div class="aras-acp-chat-actions">
                                <button id="arasAcpVoiceToggle" class="aras-acp-action-btn" title="Voice Input">🎤</button>
                                <button id="arasAcpSpeakToggle" class="aras-acp-action-btn active" title="Auto-speak messages">🔊</button>
                                <button id="arasAcpTranslateToggle" class="aras-acp-action-btn active" title="Auto-translate">🌐</button>
                                <button id="arasAcpEndChat" class="aras-acp-action-btn aras-acp-action-danger" title="End Chat">🔴</button>
                            </div>
                        </div>

                        <!-- Messages -->
                        <div id="arasAcpMessages" class="aras-acp-messages">
                            <!-- Messages loaded dynamically -->
                        </div>

                        <!-- Typing Indicator -->
                        <div id="arasAcpTyping" class="aras-acp-typing" style="display:none;">
                            <div class="aras-acp-typing-dot"></div>
                            <div class="aras-acp-typing-dot"></div>
                            <div class="aras-acp-typing-dot"></div>
                            <span id="arasAcpTypingText"></span>
                        </div>

                        <!-- Translation Status -->
                        <div id="arasAcpTransStatus" class="aras-acp-trans-status" style="display:none;">
                            <span class="aras-acp-trans-icon">🌐</span>
                            <span class="aras-acp-trans-text"></span>
                        </div>

                        <!-- AI Suggestions Panel -->
                        <div id="arasAcpSuggestions" class="aras-acp-suggestions" style="display:none;">
                            <div class="aras-acp-suggestions-header">
                                <span>🤖</span>
                                <span><?php _e( 'پیشنهادات پاسخ هوشمند', 'aras-tax' ); ?></span>
                                <button id="arasAcpRefreshSuggestions" class="aras-acp-refresh-btn" title="Refresh">🔄</button>
                            </div>
                            <div id="arasAcpSuggestionList" class="aras-acp-suggestion-list">
                                <!-- Populated by JS -->
                            </div>
                        </div>

                        <!-- Input Area -->
                        <div class="aras-acp-input-area">
                            <!-- Voice Recording Indicator -->
                            <div id="arasAcpVoiceIndicator" class="aras-acp-voice-indicator" style="display:none;">
                                <div class="aras-acp-voice-waves">
                                    <span class="aras-voice-wave"></span>
                                    <span class="aras-voice-wave"></span>
                                    <span class="aras-voice-wave"></span>
                                    <span class="aras-voice-wave"></span>
                                    <span class="aras-voice-wave"></span>
                                </div>
                                <span class="aras-acp-voice-text">🎤 <?php _e( 'Listening... Speak your response', 'aras-tax' ); ?></span>
                                <button id="arasAcpVoiceStop" class="aras-acp-voice-stop">⏹ Stop</button>
                            </div>

                            <div class="aras-acp-input-row">
                                <div class="aras-acp-input-col">
                                    <label class="aras-acp-input-label">
                                        <span class="aras-acp-label-icon">✍️</span>
                                        <?php _e( 'Admin Response (Persian)', 'aras-tax' ); ?>
                                    </label>
                                    <textarea id="arasAcpInput" class="aras-acp-textarea" rows="3"
                                              placeholder="<?php esc_attr_e( 'پاسخ خود را به فارسی بنویسید...', 'aras-tax' ); ?>"></textarea>
                                    <div class="aras-acp-input-tools">
                                        <button id="arasAcpVoiceBtn" class="aras-acp-tool-btn" title="Voice Input (Speech-to-Text)">
                                            🎤 <span><?php _e( 'Voice', 'aras-tax' ); ?></span>
                                        </button>
                                        <button id="arasAcpSpeakBtn" class="aras-acp-tool-btn" title="Read aloud (TTS)">
                                            🔊 <span><?php _e( 'Speak', 'aras-tax' ); ?></span>
                                        </button>
                                        <button id="arasAcpSuggestBtn" class="aras-acp-tool-btn" title="AI Suggestions">
                                            🤖 <span><?php _e( 'AI Suggest', 'aras-tax' ); ?></span>
                                        </button>
                                        <button id="arasAcpClearBtn" class="aras-acp-tool-btn" title="Clear">
                                            🗑️ <span><?php _e( 'Clear', 'aras-tax' ); ?></span>
                                        </button>
                                    </div>
                                </div>

                                <div class="aras-acp-preview-col">
                                    <label class="aras-acp-input-label">
                                        <span class="aras-acp-label-icon">🌐</span>
                                        <?php _e( 'Translation Preview', 'aras-tax' ); ?>
                                        <span id="arasAcpPreviewLang" class="aras-acp-preview-lang"></span>
                                    </label>
                                    <div id="arasAcpPreview" class="aras-acp-preview">
                                        <span class="aras-acp-preview-placeholder"><?php _e( 'Translation will appear here...', 'aras-tax' ); ?></span>
                                    </div>
                                </div>
                            </div>

                            <div class="aras-acp-send-row">
                                <div class="aras-acp-send-options">
                                    <label class="aras-acp-checkbox">
                                        <input type="checkbox" id="arasAcpAutoTranslate" checked />
                                        <span><?php _e( 'Auto-translate to user language', 'aras-tax' ); ?></span>
                                    </label>
                                    <select id="arasAcpTargetLang" class="aras-acp-target-select">
                                        <option value="auto">🔍 <?php _e( 'Auto-detect user language', 'aras-tax' ); ?></option>
                                        <option value="en">🇺🇸 English</option>
                                        <option value="ar">🇸🇦 العربية</option>
                                        <option value="ku">🇮🇶 کوردی</option>
                                        <option value="fa">🇮🇷 فارسی</option>
                                        <option value="es">🇪🇸 Español</option>
                                        <option value="tr">🇹🇷 Türkçe</option>
                                        <option value="fr">🇫🇷 Français</option>
                                        <option value="de">🇩🇪 Deutsch</option>
                                    </select>
                                </div>
                                <button id="arasAcpSendBtn" class="aras-acp-send-btn">
                                    <span class="aras-acp-send-text">📨 <?php _e( 'Translate & Send', 'aras-tax' ); ?></span>
                                    <span class="aras-acp-send-loading" style="display:none;">
                                        <span class="aras-acp-spinner"></span>
                                        <?php _e( 'Translating...', 'aras-tax' ); ?>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    // ─── AJAX Handlers ───

    public function start_chat() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $user_name  = sanitize_text_field( $_POST['name'] ?? 'Visitor' );
        $user_email = sanitize_email( $_POST['email'] ?? '' );
        $first_msg  = sanitize_textarea_field( $_POST['message'] ?? '' );
        $user_lang  = isset( $_POST['lang'] ) ? sanitize_text_field( $_POST['lang'] ) : 'en';

        $conv_id = 'conv_' . time() . '_' . wp_generate_password( 6, false );

        $conv = array(
            'id'         => $conv_id,
            'user_name'  => $user_name,
            'user_email' => $user_email,
            'user_lang'  => $user_lang,
            'started_at' => current_time( 'mysql' ),
            'last_msg'   => current_time( 'mysql' ),
            'messages'   => array(),
            'status'     => 'active',
        );

        if ( ! empty( $first_msg ) ) {
            $conv['messages'][] = array(
                'role'      => 'user',
                'content'   => $first_msg,
                'lang'      => $user_lang,
                'timestamp' => current_time( 'mysql' ),
            );
        }

        $convs = get_option( 'aras_ai_conversations', array() );
        $convs[ $conv_id ] = $conv;
        update_option( 'aras_ai_conversations', $convs );

        wp_send_json_success( array( 'conversation_id' => $conv_id, 'user_lang' => $user_lang ) );
    }

    public function get_conversations() {
        check_ajax_referer( 'aras_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) { wp_send_json_error(); }

        $convs = get_option( 'aras_ai_conversations', array() );
        $list  = array();

        foreach ( $convs as $id => $conv ) {
            $last_msg = '';
            if ( ! empty( $conv['messages'] ) ) {
                $last = end( $conv['messages'] );
                $last_msg = mb_substr( $last['content'], 0, 50 );
            }
            $list[] = array(
                'id'         => $id,
                'user_name'  => $conv['user_name'],
                'user_email' => $conv['user_email'],
                'user_lang'  => $conv['user_lang'],
                'started_at' => $conv['started_at'],
                'last_msg'   => $last_msg,
                'status'     => $conv['status'],
                'msg_count'  => count( $conv['messages'] ),
            );
        }

        usort( $list, function( $a, $b ) {
            return strtotime( $b['started_at'] ) - strtotime( $a['started_at'] );
        });

        wp_send_json_success( array( 'conversations' => $list ) );
    }

    public function get_messages() {
        check_ajax_referer( 'aras_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) { wp_send_json_error(); }

        $conv_id = sanitize_text_field( $_POST['conversation_id'] ?? '' );
        $convs   = get_option( 'aras_ai_conversations', array() );

        if ( ! isset( $convs[ $conv_id ] ) ) {
            wp_send_json_error( array( 'message' => 'Not found' ) );
        }

        $conv = $convs[ $conv_id ];
        $messages = array();

        foreach ( $conv['messages'] as $msg ) {
            $messages[] = array(
                'role'             => $msg['role'],
                'content'          => $msg['content'],
                'content_fa'       => isset( $msg['content_fa'] ) ? $msg['content_fa'] : '',
                'content_original' => isset( $msg['content_original'] ) ? $msg['content_original'] : $msg['content'],
                'lang'             => isset( $msg['lang'] ) ? $msg['lang'] : '',
                'timestamp'        => isset( $msg['timestamp'] ) ? $msg['timestamp'] : '',
                'is_voice'         => isset( $msg['is_voice'] ) ? $msg['is_voice'] : false,
            );
        }

        wp_send_json_success( array(
            'messages'   => $messages,
            'user_lang'  => $conv['user_lang'],
            'user_name'  => $conv['user_name'],
            'user_email' => $conv['user_email'],
            'started_at' => $conv['started_at'],
        ) );
    }

    public function admin_send_message() {
        check_ajax_referer( 'aras_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) { wp_send_json_error(); }

        $conv_id       = sanitize_text_field( $_POST['conversation_id'] ?? '' );
        $admin_msg     = sanitize_textarea_field( $_POST['message'] ?? '' );
        $auto_translate = ( $_POST['auto_translate'] ?? 'yes' ) === 'yes';
        $target_lang   = sanitize_text_field( $_POST['target_lang'] ?? 'auto' );

        if ( empty( $conv_id ) || empty( $admin_msg ) ) {
            wp_send_json_error( array( 'message' => 'Missing data' ) );
        }

        $convs = get_option( 'aras_ai_conversations', array() );
        if ( ! isset( $convs[ $conv_id ] ) ) {
            wp_send_json_error( array( 'message' => 'Conv not found' ) );
        }

        $conv      = $convs[ $conv_id ];
        $user_lang = ( $target_lang === 'auto' ) ? ( $conv['user_lang'] ?? 'en' ) : $target_lang;

        // Translate admin message to user language
        $translated = $admin_msg;
        $translation_used = false;

        if ( $auto_translate && $user_lang !== 'fa' ) {
            $translated = $this->translate_text( $admin_msg, 'fa', $user_lang );
            if ( $translated ) $translation_used = true;
        }

        $conv['messages'][] = array(
            'role'             => 'admin',
            'content'          => $translated,
            'content_fa'       => $admin_msg,
            'lang'             => $user_lang,
            'translation_used' => $translation_used,
            'timestamp'        => current_time( 'mysql' ),
        );

        $conv['last_msg'] = current_time( 'mysql' );
        $convs[ $conv_id ] = $conv;
        update_option( 'aras_ai_conversations', $convs );

        wp_send_json_success( array(
            'original'   => $admin_msg,
            'translated' => $translated,
            'user_lang'  => $user_lang,
        ) );
    }

    public function suggest_response() {
        check_ajax_referer( 'aras_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) { wp_send_json_error(); }

        $user_msg   = sanitize_textarea_field( $_POST['user_message'] ?? '' );
        $user_lang  = sanitize_text_field( $_POST['user_lang'] ?? 'en' );
        $conv_id    = sanitize_text_field( $_POST['conversation_id'] ?? '' );
        $count      = intval( $_POST['count'] ?? 3 );

        if ( empty( $user_msg ) ) { wp_send_json_error(); }

        // Translate user message to Persian for admin context
        $persian_msg = $user_msg;
        if ( $user_lang !== 'fa' ) {
            $translated = $this->translate_text( $user_msg, $user_lang, 'fa' );
            if ( $translated ) $persian_msg = $translated;
        }

        // Get conversation history
        $history = '';
        $convs = get_option( 'aras_ai_conversations', array() );
        if ( isset( $convs[ $conv_id ] ) ) {
            $last_msgs = array_slice( $convs[ $conv_id ]['messages'], -6 );
            foreach ( $last_msgs as $m ) {
                $role_label = ( $m['role'] === 'user' ) ? 'کاربر' : 'ادمین';
                $history .= $role_label . ': ' . $m['content'] . "\n";
            }
        }

        // Generate AI suggestions
        $options  = get_option( 'aras_tax_ai_options', array() );
        $model    = $options['aras_ai_model'] ?? 'llama3.2';
        $ollama   = trailingslashit( $options['aras_ai_ollama_url'] ?? 'http://localhost:11434' );

        $system_prompt = "تو یک دستیار حرفه‌ای برای ادمین شرکت Aras Tax Services هستی. وظیفه تو ارائه {$count} پیشنهاد پاسخ حرفه‌ای و گرم به زبان فارسی است. "
            . "پاسخ‌ها باید: 1) مرتبط باشند 2) لحن حرفه‌ای و دوستانه داشته باشند 3) از اصطلاحات صحیح مالیاتی استفاده کنند 4) مختصر باشند. "
            . "فقط JSON آرایه‌ای بده. مثال: [\"پاسخ اول\", \"پاسخ دوم\"]";

        $payload = array(
            'model'    => $model,
            'messages' => array(
                array( 'role' => 'system', 'content' => $system_prompt ),
                array( 'role' => 'user',   'content' => "پیام کاربر: {$persian_msg}\nتاریخچه:\n{$history}" ),
            ),
            'stream' => false, 'temperature' => 0.7,
        );

        $response = wp_remote_post( $ollama . 'api/chat', array(
            'method'  => 'POST',
            'body'    => json_encode( $payload ),
            'headers' => array( 'Content-Type' => 'application/json' ),
            'timeout' => 60,
        ) );

        if ( is_wp_error( $response ) ) {
            $fallback = array(
                "سلام! ممنون از پیام شما. تیم مالیاتی آراس در اسرع وقت پاسخ کامل‌تری خواهد داد. 📞 (205) 555-0100",
                "با تشکر از سوالتان. برای مشاوره دقیق‌تر لطفاً با کارشناسان ما تماس بگیرید.",
                "سلام! خوشحالیم که به Aras Tax Services مراجعه کردید. چگونه می‌توانیم بیشتر کمک کنیم؟",
            );
            wp_send_json_success( array( 'suggestions' => $fallback, 'user_msg_fa' => $persian_msg, 'model' => 'fallback' ) );
            return;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $suggestions = array();

        if ( isset( $body['message']['content'] ) ) {
            $content = trim( $body['message']['content'] );
            $json = json_decode( $content, true );
            if ( is_array( $json ) ) {
                $suggestions = $json;
            } else {
                preg_match_all( '/[""]([^""]+)[""]/', $content, $matches );
                if ( ! empty( $matches[1] ) ) {
                    $suggestions = $matches[1];
                } else {
                    $suggestions = array_filter( array_map( 'trim', explode( "\n", $content ) ) );
                }
            }
        }

        wp_send_json_success( array(
            'suggestions' => array_slice( $suggestions, 0, $count ),
            'user_msg_fa' => $persian_msg,
            'user_lang'   => $user_lang,
            'model'       => $model,
        ) );
    }

    public function voice_process() {
        check_ajax_referer( 'aras_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) { wp_send_json_error(); }

        $voice_text = sanitize_textarea_field( $_POST['voice_text'] ?? '' );
        if ( empty( $voice_text ) ) { wp_send_json_error(); }

        // The browser sends text via Speech-to-Text API
        // We detect its language and show to admin
        $engine      = new Aras_Tax_AI_Engine();
        $ref         = new ReflectionMethod( $engine, 'detect_language' );
        $ref->setAccessible( true );
        $detected    = $ref->invoke( $engine, $voice_text );

        // Translate to Persian for admin display
        $persian = $voice_text;
        if ( $detected !== 'fa' ) {
            $translated = $this->translate_text( $voice_text, $detected, 'fa' );
            if ( $translated ) $persian = $translated;
        }

        wp_send_json_success( array(
            'original'      => $voice_text,
            'persian'       => $persian,
            'detected_lang' => $detected,
        ) );
    }

    /**
     * Translate text using Ollama
     */
    private function translate_text( $text, $from, $to ) {
        $options    = get_option( 'aras_tax_ai_options', array() );
        $model      = $options['aras_ai_model'] ?? 'llama3.2';
        $ollama_url = trailingslashit( $options['aras_ai_ollama_url'] ?? 'http://localhost:11434' );

        $langs      = Aras_Tax_AI_Engine::get_available_languages();
        $from_name  = isset( $langs[ $from ] ) ? $langs[ $from ] : $from;
        $to_name    = isset( $langs[ $to ] ) ? $langs[ $to ] : $to;

        $system_prompt = "You are a professional human translator from {$from_name} to {$to_name}. "
            . "Use natural language with correct tax/accounting terminology. "
            . "ONLY output the translation, nothing else.";

        $payload = array(
            'model'    => $model,
            'messages' => array(
                array( 'role' => 'system', 'content' => $system_prompt ),
                array( 'role' => 'user',   'content' => $text ),
            ),
            'stream' => false, 'temperature' => 0.1,
        );

        $response = wp_remote_post( $ollama_url . 'api/chat', array(
            'method'  => 'POST',
            'body'    => json_encode( $payload ),
            'headers' => array( 'Content-Type' => 'application/json' ),
            'timeout' => 30,
        ) );

        if ( is_wp_error( $response ) ) return false;

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        return isset( $body['message']['content'] ) ? trim( $body['message']['content'] ) : false;
    }
}
