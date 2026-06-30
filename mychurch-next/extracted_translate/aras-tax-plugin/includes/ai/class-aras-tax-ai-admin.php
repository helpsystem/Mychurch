<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Aras Tax AI Admin - Settings Page for AI Features
 */
class Aras_Tax_AI_Admin {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_ai_menu' ), 11 );
        add_action( 'admin_init', array( $this, 'register_ai_settings' ) );
        add_action( 'admin_notices', array( $this, 'ai_setup_notice' ) );
    }

    public function add_ai_menu() {
        add_submenu_page(
            'aras-tax-settings',
            __( 'AI Settings', 'aras-tax' ),
            __( 'AI Settings', 'aras-tax' ),
            'manage_options',
            'aras-tax-ai',
            array( $this, 'render_ai_settings_page' )
        );
    }

    public function register_ai_settings() {
        register_setting( 'aras_tax_ai_group', 'aras_tax_ai_options', array( $this, 'sanitize_ai_options' ) );

        add_settings_section(
            'aras_ai_general_section',
            __( 'AI General Settings', 'aras-tax' ),
            array( $this, 'render_general_section' ),
            'aras-tax-ai'
        );

        add_settings_section(
            'aras_ai_chat_section',
            __( 'Chatbot Settings', 'aras-tax' ),
            array( $this, 'render_chat_section' ),
            'aras-tax-ai'
        );

        add_settings_section(
            'aras_ai_translate_section',
            __( 'Translator Settings', 'aras-tax' ),
            array( $this, 'render_translate_section' ),
            'aras-tax-ai'
        );

        add_settings_section(
            'aras_ai_model_section',
            __( 'Model & API', 'aras-tax' ),
            array( $this, 'render_model_section' ),
            'aras-tax-ai'
        );

        add_settings_field( 'aras_ai_enabled', __( 'Enable AI Features', 'aras-tax' ), array( $this, 'render_enabled_field' ), 'aras-tax-ai', 'aras_ai_general_section' );
        add_settings_field( 'aras_ai_ollama_url', __( 'Ollama API URL', 'aras-tax' ), array( $this, 'render_ollama_url_field' ), 'aras-tax-ai', 'aras_ai_model_section' );
        add_settings_field( 'aras_ai_model', __( 'AI Model', 'aras-tax' ), array( $this, 'render_model_field' ), 'aras-tax-ai', 'aras_ai_model_section' );
        add_settings_field( 'aras_ai_system_prompt', __( 'System Prompt', 'aras-tax' ), array( $this, 'render_system_prompt_field' ), 'aras-tax-ai', 'aras_ai_model_section' );
        add_settings_field( 'aras_ai_chat_enabled', __( 'Enable Chatbot', 'aras-tax' ), array( $this, 'render_chat_enabled_field' ), 'aras-tax-ai', 'aras_ai_chat_section' );
        add_settings_field( 'aras_ai_translate_enabled', __( 'Enable Translator', 'aras-tax' ), array( $this, 'render_translate_enabled_field' ), 'aras-tax-ai', 'aras_ai_translate_section' );
        add_settings_field( 'aras_ai_default_from', __( 'Default Source Language', 'aras-tax' ), array( $this, 'render_default_from_field' ), 'aras-tax-ai', 'aras_ai_translate_section' );
        add_settings_field( 'aras_ai_default_to', __( 'Default Target Language', 'aras-tax' ), array( $this, 'render_default_to_field' ), 'aras-tax-ai', 'aras_ai_translate_section' );
    }

    public function sanitize_ai_options( $input ) {
        $sanitized = array();
        $sanitized['aras_ai_enabled']           = ( $input['aras_ai_enabled'] ?? 'no' ) === 'yes' ? 'yes' : 'no';
        $sanitized['aras_ai_chat_enabled']      = ( $input['aras_ai_chat_enabled'] ?? 'yes' ) === 'yes' ? 'yes' : 'no';
        $sanitized['aras_ai_translate_enabled'] = ( $input['aras_ai_translate_enabled'] ?? 'yes' ) === 'yes' ? 'yes' : 'no';
        $sanitized['aras_ai_ollama_url']        = esc_url_raw( $input['aras_ai_ollama_url'] ?? 'http://localhost:11434' );
        $sanitized['aras_ai_model']             = sanitize_text_field( $input['aras_ai_model'] ?? 'llama3.2' );
        $sanitized['aras_ai_system_prompt']     = sanitize_textarea_field( $input['aras_ai_system_prompt'] ?? '' );
        $sanitized['aras_ai_default_from']      = sanitize_text_field( $input['aras_ai_default_from'] ?? 'en' );
        $sanitized['aras_ai_default_to']        = sanitize_text_field( $input['aras_ai_default_to'] ?? 'ar' );
        return $sanitized;
    }

    public function render_ai_settings_page() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $is_enabled = ( $options['aras_ai_enabled'] ?? 'no' ) === 'yes';

        // Check Ollama status
        $ollama_url = trailingslashit( $options['aras_ai_ollama_url'] ?? 'http://localhost:11434' );
        $ollama_status = $this->check_ollama_status( $ollama_url );
        ?>
        <div class="wrap aras-tax-admin aras-ai-admin">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

            <div class="aras-ai-hero">
                <div class="aras-ai-hero-icon">🤖</div>
                <div class="aras-ai-hero-content">
                    <h2>Aras Tax AI Assistant</h2>
                    <p><?php _e( 'Power your website with local AI for customer support and translation.', 'aras-tax' ); ?></p>
                    <div class="aras-ai-status">
                        <span class="aras-ai-status-dot <?php echo $ollama_status ? 'online' : 'offline'; ?>"></span>
                        <span class="aras-ai-status-text">
                            <?php echo $ollama_status ? __( 'Ollama is running', 'aras-tax' ) : __( 'Ollama is not detected', 'aras-tax' ); ?>
                        </span>
                    </div>
                </div>
            </div>

            <?php if ( ! $ollama_status && $is_enabled ) : ?>
            <div class="notice notice-error">
                <p>
                    <strong>⚠️ <?php _e( 'Ollama is not running!', 'aras-tax' ); ?></strong><br>
                    <?php _e( 'Please install and start Ollama on your server. See the setup guide below.', 'aras-tax' ); ?>
                </p>
            </div>
            <?php endif; ?>

            <?php if ( ! $is_enabled ) : ?>
            <div class="notice notice-info">
                <p>
                    <strong>ℹ️ <?php _e( 'AI Features Disabled', 'aras-tax' ); ?></strong><br>
                    <?php _e( 'Enable AI features below to activate the chatbot and translator.', 'aras-tax' ); ?>
                </p>
            </div>
            <?php endif; ?>

            <form method="post" action="options.php">
                <?php
                settings_fields( 'aras_tax_ai_group' );
                do_settings_sections( 'aras-tax-ai' );
                submit_button( 'Save AI Settings' );
                ?>
            </form>

            <hr>

            <div class="aras-ai-setup-guide">
                <h2>🛠️ <?php _e( 'Quick Setup Guide', 'aras-tax' ); ?></h2>

                <div class="aras-setup-steps">
                    <div class="aras-setup-step">
                        <div class="aras-step-number">1</div>
                        <h3><?php _e( 'Install Ollama', 'aras-tax' ); ?></h3>
                        <p><?php _e( 'Download and install Ollama from', 'aras-tax' ); ?> <a href="https://ollama.ai" target="_blank">ollama.ai</a></p>
                        <pre class="aras-setup-code">curl -fsSL https://ollama.ai/install.sh | sh</pre>
                    </div>

                    <div class="aras-setup-step">
                        <div class="aras-step-number">2</div>
                        <h3><?php _e( 'Pull a Model', 'aras-tax' ); ?></h3>
                        <p><?php _e( 'Download a local AI model (recommended: llama3.2)', 'aras-tax' ); ?></p>
                        <pre class="aras-setup-code">ollama pull llama3.2</pre>
                        <p><small><?php _e( 'Or for multilingual support:', 'aras-tax' ); ?></small></p>
                        <pre class="aras-setup-code">ollama pull mistral</pre>
                    </div>

                    <div class="aras-setup-step">
                        <div class="aras-step-number">3</div>
                        <h3><?php _e( 'Start Ollama', 'aras-tax' ); ?></h3>
                        <p><?php _e( 'Run Ollama as a background service', 'aras-tax' ); ?></p>
                        <pre class="aras-setup-code">ollama serve &</pre>
                        <p><small><?php _e( 'Or use systemd for production:', 'aras-tax' ); ?></small></p>
                        <pre class="aras-setup-code">sudo systemctl enable ollama
sudo systemctl start ollama</pre>
                    </div>

                    <div class="aras-setup-step">
                        <div class="aras-step-number">4</div>
                        <h3><?php _e( 'Configure Plugin', 'aras-tax' ); ?></h3>
                        <p><?php _e( 'Enable AI features above and verify the Ollama URL is correct.', 'aras-tax' ); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    private function check_ollama_status( $url ) {
        $response = wp_remote_get( trailingslashit( $url ) . 'api/tags', array(
            'timeout'   => 3,
            'blocking'  => true,
        ) );

        if ( is_wp_error( $response ) ) {
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        return ( $code === 200 );
    }

    // ─── Field Renderers ───

    public function render_general_section() {
        echo '<p>' . __( 'Toggle AI features on/off for your website.', 'aras-tax' ) . '</p>';
    }

    public function render_chat_section() {
        echo '<p>' . __( 'Configure the AI chatbot widget.', 'aras-tax' ) . '</p>';
    }

    public function render_translate_section() {
        echo '<p>' . __( 'Configure the AI translation widget.', 'aras-tax' ) . '</p>';
    }

    public function render_model_section() {
        echo '<p>' . __( 'Connect to your local Ollama instance and choose a model.', 'aras-tax' ) . '</p>';
    }

    public function render_enabled_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_enabled'] ?? 'no';
        ?>
        <label>
            <input type="checkbox" name="aras_tax_ai_options[aras_ai_enabled]" value="yes" <?php checked( $value, 'yes' ); ?> />
            <?php _e( 'Enable all AI features', 'aras-tax' ); ?>
        </label>
        <p class="description"><?php _e( 'Master toggle for AI chatbot and translator.', 'aras-tax' ); ?></p>
        <?php
    }

    public function render_ollama_url_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_ollama_url'] ?? 'http://localhost:11434';
        ?>
        <input type="url" name="aras_tax_ai_options[aras_ai_ollama_url]" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
        <p class="description"><?php _e( 'URL of your local Ollama server. Default: http://localhost:11434', 'aras-tax' ); ?></p>
        <?php
    }

    public function render_model_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_model'] ?? 'llama3.2';

        $models = array(
            'llama3.2'   => 'Llama 3.2 (Recommended, Fast)',
            'llama3.1'   => 'Llama 3.1 (Good for multilingual)',
            'mistral'    => 'Mistral (Excellent multilingual)',
            'qwen2.5'    => 'Qwen 2.5 (Best for Arabic/Persian/Kurdish)',
            'phi3'       => 'Phi-3 (Lightweight)',
            'gemma2'     => 'Gemma 2 (Google, balanced)',
            'deepseek-r1' => 'DeepSeek R1 (Reasoning)',
        );
        ?>
        <select name="aras_tax_ai_options[aras_ai_model]" class="regular-text">
            <?php foreach ( $models as $key => $name ) : ?>
                <option value="<?php echo esc_attr( $key ); ?>" <?php selected( $value, $key ); ?>>
                    <?php echo esc_html( $name ); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="description">
            <?php _e( 'Make sure the model is downloaded: ', 'aras-tax' ); ?>
            <code>ollama pull {model}</code>
        </p>
        <?php
    }

    public function render_system_prompt_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_system_prompt'] ?? '';
        ?>
        <textarea name="aras_tax_ai_options[aras_ai_system_prompt]" rows="6" class="large-text"><?php echo esc_textarea( $value ); ?></textarea>
        <p class="description"><?php _e( 'Custom system prompt for the AI chatbot. Leave empty to use the default tax advisor prompt.', 'aras-tax' ); ?></p>
        <?php
    }

    public function render_chat_enabled_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_chat_enabled'] ?? 'yes';
        ?>
        <label>
            <input type="checkbox" name="aras_tax_ai_options[aras_ai_chat_enabled]" value="yes" <?php checked( $value, 'yes' ); ?> />
            <?php _e( 'Show floating chatbot widget', 'aras-tax' ); ?>
        </label>
        <p class="description"><?php _e( 'Displays a floating AI chat button on the bottom-right of your site.', 'aras-tax' ); ?></p>
        <?php
    }

    public function render_translate_enabled_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_translate_enabled'] ?? 'yes';
        ?>
        <label>
            <input type="checkbox" name="aras_tax_ai_options[aras_ai_translate_enabled]" value="yes" <?php checked( $value, 'yes' ); ?> />
            <?php _e( 'Enable translator shortcode', 'aras-tax' ); ?>
        </label>
        <p class="description"><?php _e( 'Use shortcode [aras_ai_translate] to add the translation widget to any page.', 'aras-tax' ); ?></p>
        <?php
    }

    public function render_default_from_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_default_from'] ?? 'en';
        $languages = Aras_Tax_AI_Engine::get_available_languages();
        ?>
        <select name="aras_tax_ai_options[aras_ai_default_from]" class="regular-text">
            <?php foreach ( $languages as $code => $name ) : ?>
                <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $value, $code ); ?>>
                    <?php echo esc_html( $name ); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php
    }

    public function render_default_to_field() {
        $options = get_option( 'aras_tax_ai_options', array() );
        $value   = $options['aras_ai_default_to'] ?? 'ar';
        $languages = Aras_Tax_AI_Engine::get_available_languages();
        ?>
        <select name="aras_tax_ai_options[aras_ai_default_to]" class="regular-text">
            <?php foreach ( $languages as $code => $name ) : ?>
                <option value="<?php echo esc_attr( $code ); ?>" <?php selected( $value, $code ); ?>>
                    <?php echo esc_html( $name ); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php
    }

    public function ai_setup_notice() {
        $screen = get_current_screen();
        if ( $screen && strpos( $screen->id, 'aras-tax' ) !== false ) {
            $options = get_option( 'aras_tax_ai_options', array() );
            if ( ( $options['aras_ai_enabled'] ?? 'no' ) === 'yes' ) {
                $ollama_url = trailingslashit( $options['aras_ai_ollama_url'] ?? 'http://localhost:11434' );
                $response = wp_remote_get( $ollama_url . 'api/tags', array( 'timeout' => 3 ) );
                if ( is_wp_error( $response ) ) {
                    ?>
                    <div class="notice notice-error is-dismissible">
                        <p>
                            <strong>🤖 Aras Tax AI:</strong>
                            <?php _e( 'Ollama is not running on your server. Please install Ollama and pull a model (e.g., llama3.2) for AI features to work.', 'aras-tax' ); ?>
                            <a href="https://ollama.ai" target="_blank">Download Ollama →</a>
                        </p>
                    </div>
                    <?php
                }
            }
        }
    }
}
