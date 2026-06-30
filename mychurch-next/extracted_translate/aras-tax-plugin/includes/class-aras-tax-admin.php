<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Admin Class - Handles admin settings page for Aras Tax Services
 */
class Aras_Tax_Admin {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    public function add_admin_menu() {
        add_menu_page(
            __( 'Aras Tax Services', 'aras-tax' ),
            __( 'Aras Tax', 'aras-tax' ),
            'manage_options',
            'aras-tax-settings',
            array( $this, 'render_settings_page' ),
            'dashicons-money-alt',
            30
        );

        add_submenu_page(
            'aras-tax-settings',
            __( 'Dashboard', 'aras-tax' ),
            __( 'Dashboard', 'aras-tax' ),
            'manage_options',
            'aras-tax-settings',
            array( $this, 'render_settings_page' )
        );

        add_submenu_page(
            'aras-tax-settings',
            __( 'Tax Forms', 'aras-tax' ),
            __( 'Tax Forms', 'aras-tax' ),
            'manage_options',
            'aras-tax-forms',
            array( $this, 'render_forms_page' )
        );

        add_submenu_page(
            'aras-tax-settings',
            __( 'Services', 'aras-tax' ),
            __( 'Services', 'aras-tax' ),
            'manage_options',
            'aras-tax-services',
            array( $this, 'render_services_page' )
        );

        add_submenu_page(
            'aras-tax-settings',
            __( 'Tax Calculator', 'aras-tax' ),
            __( 'Tax Calculator', 'aras-tax' ),
            'manage_options',
            'aras-tax-calculator-admin',
            array( $this, 'render_calculator_admin_page' )
        );
    }

    public function register_settings() {
        register_setting( 'aras_tax_settings_group', 'aras_tax_options', array( $this, 'sanitize_options' ) );

        add_settings_section(
            'aras_tax_general_section',
            __( 'General Settings', 'aras-tax' ),
            array( $this, 'render_general_section' ),
            'aras-tax-settings'
        );

        add_settings_section(
            'aras_tax_branding_section',
            __( 'Branding & Colors', 'aras-tax' ),
            array( $this, 'render_branding_section' ),
            'aras-tax-settings'
        );

        add_settings_field( 'aras_tax_phone', __( 'Phone Number', 'aras-tax' ), array( $this, 'render_phone_field' ), 'aras-tax-settings', 'aras_tax_general_section' );
        add_settings_field( 'aras_tax_email', __( 'Email Address', 'aras-tax' ), array( $this, 'render_email_field' ), 'aras-tax-settings', 'aras_tax_general_section' );
        add_settings_field( 'aras_tax_address', __( 'Address', 'aras-tax' ), array( $this, 'render_address_field' ), 'aras-tax-settings', 'aras_tax_general_section' );
        add_settings_field( 'aras_tax_header_text', __( 'Header Text', 'aras-tax' ), array( $this, 'render_header_text_field' ), 'aras-tax-settings', 'aras_tax_branding_section' );
        add_settings_field( 'aras_tax_header_subtext', __( 'Header Subtext', 'aras-tax' ), array( $this, 'render_header_subtext_field' ), 'aras-tax-settings', 'aras_tax_branding_section' );
        add_settings_field( 'aras_tax_primary_color', __( 'Primary Color', 'aras-tax' ), array( $this, 'render_primary_color_field' ), 'aras-tax-settings', 'aras_tax_branding_section' );
        add_settings_field( 'aras_tax_accent_color', __( 'Accent Color', 'aras-tax' ), array( $this, 'render_accent_color_field' ), 'aras-tax-settings', 'aras_tax_branding_section' );
        add_settings_field( 'aras_tax_show_banner', __( 'Show Banner', 'aras-tax' ), array( $this, 'render_show_banner_field' ), 'aras-tax-settings', 'aras_tax_branding_section' );
        add_settings_field( 'aras_tax_tax_year', __( 'Tax Year', 'aras-tax' ), array( $this, 'render_tax_year_field' ), 'aras-tax-settings', 'aras_tax_general_section' );
    }

    public function sanitize_options( $input ) {
        $sanitized = array();
        $sanitized['aras_tax_phone']          = sanitize_text_field( $input['aras_tax_phone'] ?? '' );
        $sanitized['aras_tax_email']          = sanitize_email( $input['aras_tax_email'] ?? '' );
        $sanitized['aras_tax_address']        = sanitize_text_field( $input['aras_tax_address'] ?? '' );
        $sanitized['aras_tax_header_text']    = sanitize_text_field( $input['aras_tax_header_text'] ?? '' );
        $sanitized['aras_tax_header_subtext'] = sanitize_text_field( $input['aras_tax_header_subtext'] ?? '' );
        $sanitized['aras_tax_primary_color']  = sanitize_hex_color( $input['aras_tax_primary_color'] ?? '#1a365d' );
        $sanitized['aras_tax_accent_color']   = sanitize_hex_color( $input['aras_tax_accent_color'] ?? '#c9a84c' );
        $sanitized['aras_tax_show_banner']    = ( $input['aras_tax_show_banner'] ?? 'yes' ) === 'yes' ? 'yes' : 'no';
        $sanitized['aras_tax_tax_year']       = sanitize_text_field( $input['aras_tax_tax_year'] ?? '2025-2026' );
        return $sanitized;
    }

    public function render_settings_page() {
        $options = get_option( 'aras_tax_options', array() );
        ?>
        <div class="wrap aras-tax-admin">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

            <div class="aras-tax-header">
                <div class="aras-tax-logo-section">
                    <img src="<?php echo ARAS_TAX_PLUGIN_URL; ?>assets/images/logo.svg" alt="Aras Tax Services" style="max-width: 120px;" onerror="this.style.display='none'">
                    <h2>ARAS TAX SERVICES</h2>
                    <p class="aras-tax-tagline">Professional Tax & Accounting Solutions</p>
                </div>
            </div>

            <form method="post" action="options.php">
                <?php
                settings_fields( 'aras_tax_settings_group' );
                do_settings_sections( 'aras-tax-settings' );
                submit_button( 'Save Settings' );
                ?>
            </form>

            <hr>

            <h2><?php _e( 'Shortcodes', 'aras-tax' ); ?></h2>
            <table class="form-table">
                <tr>
                    <th><?php _e( 'Service Banner', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_banner]</code></td>
                </tr>
                <tr>
                    <th><?php _e( 'Tax Calculator', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_calculator]</code></td>
                </tr>
                <tr>
                    <th><?php _e( 'Contact Information', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_contact]</code></td>
                </tr>
                <tr>
                    <th><?php _e( 'W-4 Download', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_w4_download]</code></td>
                </tr>
                <tr>
                    <th><?php _e( 'Service List', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_services]</code></td>
                </tr>
                <tr>
                    <th><?php _e( 'Team Members', 'aras-tax' ); ?></th>
                    <td><code>[aras_tax_team]</code></td>
                </tr>
            </table>
        </div>
        <?php
    }

    public function render_forms_page() {
        ?>
        <div class="wrap aras-tax-admin">
            <h1><?php _e( 'Tax Forms', 'aras-tax' ); ?></h1>
            <p><?php _e( 'Manage downloadable tax forms for your clients.', 'aras-tax' ); ?></p>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e( 'Form Name', 'aras-tax' ); ?></th>
                        <th><?php _e( 'Description', 'aras-tax' ); ?></th>
                        <th><?php _e( 'Shortcode', 'aras-tax' ); ?></th>
                        <th><?php _e( 'Action', 'aras-tax' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Form W-4 (2025)</td>
                        <td>Employee's Withholding Certificate</td>
                        <td><code>[aras_tax_w4_download]</code></td>
                        <td><a href="<?php echo ARAS_TAX_PLUGIN_URL; ?>assets/docs/fw4.pdf" target="_blank">Download</a></td>
                    </tr>
                    <tr>
                        <td>Form 1040 (2025)</td>
                        <td>U.S. Individual Income Tax Return</td>
                        <td><code>[aras_tax_1040_download]</code></td>
                        <td><a href="#" onclick="alert('Form coming soon'); return false;">Download</a></td>
                    </tr>
                    <tr>
                        <td>Form 1099-NEC (2025)</td>
                        <td>Nonemployee Compensation</td>
                        <td><code>[aras_tax_1099_download]</code></td>
                        <td><a href="#" onclick="alert('Form coming soon'); return false;">Download</a></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function render_services_page() {
        $services = array(
            array(
                'title'       => 'Strategy & Planning',
                'icon'        => 'dashicons-chart-line',
                'number'      => '01',
                'description' => 'We approached with complex project deliverables to provide strategic tax planning solutions.',
            ),
            array(
                'title'       => 'Financial Consulting',
                'icon'        => 'dashicons-money-alt',
                'number'      => '02',
                'description' => 'Comprehensive financial consulting services for businesses and individuals.',
            ),
            array(
                'title'       => 'Business Planning',
                'icon'        => 'dashicons-portfolio',
                'number'      => '03',
                'description' => 'Expert guidance to help you navigate taxes and reach your financial aspirations.',
            ),
            array(
                'title'       => 'Efficiency Experts',
                'icon'        => 'dashicons-performance',
                'number'      => '04',
                'description' => 'Supporting your financial success with expert tax solutions and tailored advice.',
            ),
        );
        ?>
        <div class="wrap aras-tax-admin">
            <h1><?php _e( 'Our Services', 'aras-tax' ); ?></h1>
            <p><?php _e( 'Aras Tax Services provides expert guidance and innovative strategies tailored to your unique needs.', 'aras-tax' ); ?></p>

            <div class="aras-services-grid">
                <?php foreach ( $services as $service ) : ?>
                <div class="aras-service-card">
                    <div class="aras-service-number"><?php echo esc_html( $service['number'] ); ?></div>
                    <span class="dashicons <?php echo esc_attr( $service['icon'] ); ?>"></span>
                    <h3><?php echo esc_html( $service['title'] ); ?></h3>
                    <p><?php echo esc_html( $service['description'] ); ?></p>
                    <a href="#" class="button button-secondary">Read More</a>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
    }

    public function render_calculator_admin_page() {
        ?>
        <div class="wrap aras-tax-admin">
            <h1><?php _e( 'Tax Calculator Settings', 'aras-tax' ); ?></h1>
            <p><?php _e( 'Configure the tax calculator for your clients. Use shortcode: <code>[aras_tax_calculator]</code>', 'aras-tax' ); ?></p>

            <div class="notice notice-info">
                <p><?php _e( 'The tax calculator is currently available via shortcode. Tax brackets are based on 2025-2026 federal tax rates.', 'aras-tax' ); ?></p>
            </div>

            <h2><?php _e( 'Available Tax Calculators', 'aras-tax' ); ?></h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e( 'Calculator', 'aras-tax' ); ?></th>
                        <th><?php _e( 'Shortcode', 'aras-tax' ); ?></th>
                        <th><?php _e( 'Description', 'aras-tax' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Federal Income Tax</td>
                        <td><code>[aras_tax_calculator type="federal"]</code></td>
                        <td>Calculate federal income tax based on 2025-2026 brackets</td>
                    </tr>
                    <tr>
                        <td>State Income Tax</td>
                        <td><code>[aras_tax_calculator type="state"]</code></td>
                        <td>Calculate state income tax (coming soon)</td>
                    </tr>
                    <tr>
                        <td>Self-Employment Tax</td>
                        <td><code>[aras_tax_calculator type="self-employment"]</code></td>
                        <td>Calculate self-employment tax obligations</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }

    // ─── Render Individual Fields ───

    public function render_general_section() {
        echo '<p>' . __( 'Configure general settings for Aras Tax Services plugin.', 'aras-tax' ) . '</p>';
    }

    public function render_branding_section() {
        echo '<p>' . __( 'Customize the look and feel of the plugin.', 'aras-tax' ) . '</p>';
    }

    public function render_phone_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_phone'] ?? '(205) 555-0100';
        echo '<input type="text" name="aras_tax_options[aras_tax_phone]" value="' . esc_attr( $value ) . '" class="regular-text" />';
    }

    public function render_email_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_email'] ?? 'info@aras-cpa.com';
        echo '<input type="email" name="aras_tax_options[aras_tax_email]" value="' . esc_attr( $value ) . '" class="regular-text" />';
    }

   public function render_address_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_address'] ?? 'Birmingham, AL';
        echo '<input type="text" name="aras_tax_options[aras_tax_address]" value="' . esc_attr( $value ) . '" class="regular-text" />';
    }

    public function render_header_text_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_header_text'] ?? 'Perfect Tax Consulting Solutions 2025 - 2026';
        echo '<input type="text" name="aras_tax_options[aras_tax_header_text]" value="' . esc_attr( $value ) . '" class="regular-text" />';
    }

    public function render_header_subtext_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_header_subtext'] ?? 'Your trusted partner for smart tax strategies and financial goal achievement.';
        echo '<textarea name="aras_tax_options[aras_tax_header_subtext]" rows="3" class="large-text">' . esc_textarea( $value ) . '</textarea>';
    }

    public function render_primary_color_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_primary_color'] ?? '#1a365d';
        echo '<input type="text" name="aras_tax_options[aras_tax_primary_color]" value="' . esc_attr( $value ) . '" class="aras-color-picker" />';
    }

    public function render_accent_color_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_accent_color'] ?? '#c9a84c';
        echo '<input type="text" name="aras_tax_options[aras_tax_accent_color]" value="' . esc_attr( $value ) . '" class="aras-color-picker" />';
    }

    public function render_show_banner_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_show_banner'] ?? 'yes';
        echo '<label><input type="checkbox" name="aras_tax_options[aras_tax_show_banner]" value="yes" ' . checked( $value, 'yes', false ) . ' /> ' . __( 'Show banner on frontend', 'aras-tax' ) . '</label>';
    }

    public function render_tax_year_field() {
        $options = get_option( 'aras_tax_options', array() );
        $value   = $options['aras_tax_tax_year'] ?? '2025-2026';
        echo '<input type="text" name="aras_tax_options[aras_tax_tax_year]" value="' . esc_attr( $value ) . '" class="regular-text" />';
    }
}
