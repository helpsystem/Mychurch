<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Aras Tax AI Translator v2 - Enhanced with auto-detect, bidirectional display & RTL
 */
class Aras_Tax_AI_Translator {

    public function __construct() {
        add_shortcode( 'aras_ai_translate', array( $this, 'render_translate_shortcode' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    public function enqueue_assets() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $translate_enabled = isset( $options['aras_ai_translate_enabled'] ) && $options['aras_ai_translate_enabled'] === 'yes';

        if ( $translate_enabled ) {
            wp_enqueue_style(
                'aras-tax-ai-translate',
                ARAS_TAX_PLUGIN_URL . 'assets/css/ai/translate.css',
                array(),
                ARAS_TAX_VERSION
            );

            wp_enqueue_script(
                'aras-tax-ai-translate',
                ARAS_TAX_PLUGIN_URL . 'assets/js/ai/translate.js',
                array( 'jquery' ),
                ARAS_TAX_VERSION,
                true
            );

            wp_localize_script( 'aras-tax-ai-translate', 'arasAiTranslate', array(
                'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
                'nonce'         => wp_create_nonce( 'aras_ai_nonce' ),
                'languages'     => Aras_Tax_AI_Engine::get_available_languages(),
                'translating'   => __( 'Translating...', 'aras-tax' ),
                'error'         => __( 'Translation error. Please try again.', 'aras-tax' ),
                'detecting'     => __( '🔍 Detecting language...', 'aras-tax' ),
                'swapLang'      => __( 'Swap languages', 'aras-tax' ),
            ) );
        }
    }

    public function render_translate_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'default_from'  => 'auto',
            'default_to'    => 'ar',
            'title'         => __( 'Language Translator', 'aras-tax' ),
            'show_switch'   => 'yes',
            'show_back_trans' => 'yes',
            'placeholder_from' => 'Type or paste text to translate...',
            'placeholder_to'   => 'Translation will appear here...',
        ), $atts, 'aras_ai_translate' );

        $languages = Aras_Tax_AI_Engine::get_available_languages();

        ob_start();
        ?>
        <div class="aras-ai-translator-widget" id="arasAiTranslator">
            <!-- Header -->
            <div class="aras-translator-header">
                <span class="aras-translator-icon">🌐</span>
                <div class="aras-translator-header-text">
                    <h3><?php echo esc_html( $atts['title'] ); ?></h3>
                    <p class="aras-translator-subtitle">
                        <?php _e( 'Translate text naturally with AI-powered human-like translation.', 'aras-tax' ); ?>
                    </p>
                </div>
            </div>

            <!-- Language Controls -->
            <div class="aras-translator-controls">
                <div class="aras-translator-select-group">
                    <label for="aras_translate_from"><?php _e( 'From', 'aras-tax' ); ?></label>
                    <select id="aras_translate_from" class="aras-translate-select">
                        <?php foreach ( $languages as $code => $name ) : ?>
                            <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $atts['default_from'], $code ); ?>>
                                <?php echo esc_html( $name ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <?php if ( $atts['show_switch'] === 'yes' ) : ?>
                <button id="aras_translate_switch" class="aras-translate-switch" title="<?php esc_attr_e('Swap languages', 'aras-tax'); ?>">
                    ⇄
                </button>
                <?php endif; ?>

                <div class="aras-translator-select-group">
                    <label for="aras_translate_to"><?php _e( 'To', 'aras-tax' ); ?></label>
                    <select id="aras_translate_to" class="aras-translate-select">
                        <?php foreach ( $languages as $code => $name ) : ?>
                            <?php if ( $code !== 'auto' ) : ?>
                            <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $atts['default_to'], $code ); ?>>
                                <?php echo esc_html( $name ); ?>
                            </option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <!-- Detected Language Display -->
            <div id="aras_detected_lang" class="aras-detected-lang" style="display:none;">
                <span class="aras-detected-icon">🔍</span>
                <span class="aras-detected-text"></span>
            </div>

            <!-- Text Areas -->
            <div class="aras-translator-textarea-group">
                <div class="aras-textarea-wrapper">
                    <div class="aras-textarea-header">
                        <span class="aras-textarea-label" id="aras_input_lang_label">English</span>
                        <button id="aras_copy_input" class="aras-copy-btn" title="Copy">📋</button>
                        <span id="aras_input_char_count" class="aras-char-count">0</span>
                    </div>
                    <textarea id="aras_translate_input" class="aras-translate-input" rows="4"
                              placeholder="<?php echo esc_attr( $atts['placeholder_from'] ); ?>"
                              oninput="updateInputLang(this.value)"></textarea>
                </div>

                <div class="aras-textarea-wrapper">
                    <div class="aras-textarea-header">
                        <span class="aras-textarea-label" id="aras_output_lang_label">العربية</span>
                        <button id="aras_copy_output" class="aras-copy-btn" title="Copy">📋</button>
                    </div>
                    <textarea id="aras_translate_output" class="aras-translate-output" rows="4"
                              readonly placeholder="<?php echo esc_attr( $atts['placeholder_to'] ); ?>"></textarea>
                </div>
            </div>

            <!-- Back Translation (Quality Check) -->
            <div id="aras_back_trans_container" class="aras-back-trans-container" style="display:none;">
                <div class="aras-back-trans-header">
                    <span>↩️</span>
                    <span><?php _e( 'Back Translation (Quality Check)', 'aras-tax' ); ?></span>
                    <button id="aras_hide_back" class="aras-close-back">✕</button>
                </div>
                <div id="aras_back_translation" class="aras-back-trans-text"></div>
            </div>

            <!-- Translate Button -->
            <button id="aras_translate_btn" class="aras-translate-button">
                <span class="aras-translate-btn-text">🔄 <?php _e( 'Translate', 'aras-tax' ); ?></span>
                <span class="aras-translate-btn-loading" style="display:none;">
                    <span class="aras-translate-spinner"></span>
                    <span><?php echo esc_html( $atts['show_back_trans'] === 'yes' ? __( 'Translating & checking quality...', 'aras-tax' ) : __( 'Translating...', 'aras-tax' ) ); ?></span>
                </span>
            </button>

            <!-- Language Pairs Quick Access -->
            <div class="aras-quick-pairs">
                <span class="aras-quick-label"><?php _e( 'Quick translate:', 'aras-tax' ); ?></span>
                <button class="aras-quick-pair" data-from="en" data-to="ar">🇺🇸 → 🇸🇦</button>
                <button class="aras-quick-pair" data-from="ar" data-to="en">🇸🇦 → 🇺🇸</button>
                <button class="aras-quick-pair" data-from="en" data-to="ku">🇺🇸 → 🇮🇶</button>
                <button class="aras-quick-pair" data-from="ku" data-to="en">🇮🇶 → 🇺🇸</button>
                <button class="aras-quick-pair" data-from="en" data-to="fa">🇺🇸 → 🇮🇷</button>
                <button class="aras-quick-pair" data-from="fa" data-to="en">🇮🇷 → 🇺🇸</button>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
