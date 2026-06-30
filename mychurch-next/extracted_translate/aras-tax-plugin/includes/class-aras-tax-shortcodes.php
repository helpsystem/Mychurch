<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Shortcodes Class - Handles all public shortcodes
 */
class Aras_Tax_Shortcodes {

    public function __construct() {
        add_shortcode( 'aras_tax_banner', array( $this, 'render_banner' ) );
        add_shortcode( 'aras_tax_calculator', array( $this, 'render_calculator' ) );
        add_shortcode( 'aras_tax_contact', array( $this, 'render_contact' ) );
        add_shortcode( 'aras_tax_w4_download', array( $this, 'render_w4_download' ) );
        add_shortcode( 'aras_tax_services', array( $this, 'render_services' ) );
        add_shortcode( 'aras_tax_team', array( $this, 'render_team' ) );
        add_shortcode( 'aras_tax_1040_download', array( $this, 'render_1040_download' ) );
        add_shortcode( 'aras_tax_1099_download', array( $this, 'render_1099_download' ) );
    }

    public function render_banner( $atts ) {
        $options = get_option( 'aras_tax_options', array() );

        if ( isset( $options['aras_tax_show_banner'] ) && $options['aras_tax_show_banner'] !== 'yes' ) {
            return '';
        }

        $atts = shortcode_atts( array(
            'title'   => $options['aras_tax_header_text'] ?? 'Perfect Tax Consulting Solutions 2025 - 2026',
            'subtitle' => $options['aras_tax_header_subtext'] ?? 'Your trusted partner for smart tax strategies and financial goal achievement.',
            'style'   => 'default',
        ), $atts, 'aras_tax_banner' );

        $primary_color = $options['aras_tax_primary_color'] ?? '#1a365d';
        $accent_color  = $options['aras_tax_accent_color'] ?? '#c9a84c';

        ob_start();
        ?>
        <div class="aras-tax-banner" style="background: linear-gradient(135deg, <?php echo esc_attr( $primary_color ); ?> 0%, #2c5282 100%);">
            <div class="aras-tax-banner-content">
                <div class="aras-tax-banner-logo">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <rect x="5" y="5" width="50" height="50" rx="10" fill="<?php echo esc_attr( $accent_color ); ?>"/>
                        <path d="M30 15 L30 45 M18 22 L30 15 L42 22 M20 35 L40 35" stroke="<?php echo esc_attr( $primary_color ); ?>" stroke-width="3" fill="none"/>
                        <circle cx="30" cy="30" r="5" fill="<?php echo esc_attr( $primary_color ); ?>"/>
                    </svg>
                </div>
                <h1 class="aras-tax-banner-title"><?php echo esc_html( $atts['title'] ); ?></h1>
                <p class="aras-tax-banner-subtitle"><?php echo esc_html( $atts['subtitle'] ); ?></p>
                <div class="aras-tax-banner-actions">
                    <a href="#aras-tax-services" class="aras-btn aras-btn-primary">Explore More</a>
                    <a href="#aras-tax-contact" class="aras-btn aras-btn-outline">Learn More</a>
                </div>
            </div>
            <div class="aras-tax-banner-shape"></div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_calculator( $atts ) {
        $atts = shortcode_atts( array(
            'type' => 'federal',
        ), $atts, 'aras_tax_calculator' );

        ob_start();
        ?>
        <div class="aras-tax-calculator" id="aras-tax-calc">
            <div class="aras-calc-header">
                <span class="aras-calc-icon">📊</span>
                <h3><?php _e( 'Tax Calculator', 'aras-tax' ); ?></h3>
                <p><?php _e( 'Estimate your tax obligations quickly and easily.', 'aras-tax' ); ?></p>
            </div>
            <form id="arasTaxCalcForm" class="aras-calc-form">
                <?php wp_nonce_field( 'aras_tax_nonce', 'aras_tax_nonce' ); ?>

                <div class="aras-calc-group">
                    <label for="aras_filing_status"><?php _e( 'Filing Status', 'aras-tax' ); ?></label>
                    <select id="aras_filing_status" name="filing_status">
                        <option value="single"><?php _e( 'Single', 'aras-tax' ); ?></option>
                        <option value="married_joint"><?php _e( 'Married Filing Jointly', 'aras-tax' ); ?></option>
                        <option value="married_separate"><?php _e( 'Married Filing Separately', 'aras-tax' ); ?></option>
                        <option value="head_household"><?php _e( 'Head of Household', 'aras-tax' ); ?></option>
                    </select>
                </div>

                <div class="aras-calc-group">
                    <label for="aras_income"><?php _e( 'Annual Gross Income ($)', 'aras-tax' ); ?></label>
                    <input type="number" id="aras_income" name="income" min="0" step="100" placeholder="75000" />
                </div>

                <div class="aras-calc-group">
                    <label for="aras_deductions"><?php _e( 'Deductions ($)', 'aras-tax' ); ?></label>
                    <input type="number" id="aras_deductions" name="deductions" min="0" step="100" placeholder="12950" />
                </div>

                <div class="aras-calc-group">
                    <label for="aras_tax_type"><?php _e( 'Tax Type', 'aras-tax' ); ?></label>
                    <select id="aras_tax_type" name="tax_type">
                        <option value="federal"><?php _e( 'Federal Income Tax', 'aras-tax' ); ?></option>
                        <option value="self-employment"><?php _e( 'Self-Employment Tax', 'aras-tax' ); ?></option>
                    </select>
                </div>

                <button type="submit" class="aras-btn aras-btn-primary aras-calc-submit">
                    <?php _e( 'Calculate Tax', 'aras-tax' ); ?>
                </button>
            </form>

            <div id="arasTaxResult" class="aras-calc-result" style="display:none;">
                <h4><?php _e( 'Estimated Tax Breakdown', 'aras-tax' ); ?></h4>
                <div class="aras-calc-result-grid">
                    <div class="aras-result-item">
                        <span class="aras-result-label"><?php _e( 'Taxable Income', 'aras-tax' ); ?></span>
                        <span class="aras-result-value" id="aras_taxable_income">$0.00</span>
                    </div>
                    <div class="aras-result-item">
                        <span class="aras-result-label"><?php _e( 'Estimated Tax', 'aras-tax' ); ?></span>
                        <span class="aras-result-value aras-result-highlight" id="aras_estimated_tax">$0.00</span>
                    </div>
                    <div class="aras-result-item">
                        <span class="aras-result-label"><?php _e( 'Effective Tax Rate', 'aras-tax' ); ?></span>
                        <span class="aras-result-value" id="aras_effective_rate">0%</span>
                    </div>
                    <div class="aras-result-item">
                        <span class="aras-result-label"><?php _e( 'Monthly Tax', 'aras-tax' ); ?></span>
                        <span class="aras-result-value" id="aras_monthly_tax">$0.00</span>
                    </div>
                </div>
                <p class="aras-calc-disclaimer">
                    <?php _e( 'This is an estimate only. Consult with a tax professional for accurate calculations.', 'aras-tax' ); ?>
                </p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_contact( $atts ) {
        $options = get_option( 'aras_tax_options', array() );

        $atts = shortcode_atts( array(
            'phone'   => $options['aras_tax_phone'] ?? '(205) 555-0100',
            'email'   => $options['aras_tax_email'] ?? 'info@aras-cpa.com',
            'address' => $options['aras_tax_address'] ?? 'Birmingham, AL',
        ), $atts, 'aras_tax_contact' );

        ob_start();
        ?>
        <div class="aras-tax-contact" id="aras-tax-contact">
            <div class="aras-contact-header">
                <h3><?php _e( 'Contact Us', 'aras-tax' ); ?></h3>
                <p><?php _e( 'Get in touch with our expert team.', 'aras-tax' ); ?></p>
            </div>
            <div class="aras-contact-grid">
                <div class="aras-contact-item">
                    <span class="aras-contact-icon">📞</span>
                    <div class="aras-contact-info">
                        <h4><?php _e( 'Phone', 'aras-tax' ); ?></h4>
                        <a href="tel:<?php echo esc_attr( preg_replace('/[^0-9+]/', '', $atts['phone']) ); ?>"><?php echo esc_html( $atts['phone'] ); ?></a>
                    </div>
                </div>
                <div class="aras-contact-item">
                    <span class="aras-contact-icon">✉️</span>
                    <div class="aras-contact-info">
                        <h4><?php _e( 'Email', 'aras-tax' ); ?></h4>
                        <a href="mailto:<?php echo esc_attr( $atts['email'] ); ?>"><?php echo esc_html( $atts['email'] ); ?></a>
                    </div>
                </div>
                <div class="aras-contact-item">
                    <span class="aras-contact-icon">📍</span>
                    <div class="aras-contact-info">
                        <h4><?php _e( 'Address', 'aras-tax' ); ?></h4>
                        <p><?php echo esc_html( $atts['address'] ); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_w4_download( $atts ) {
        $options = get_option( 'aras_tax_options', array() );
        $url     = $options['aras_tax_w4_form_url'] ?? ARAS_TAX_PLUGIN_URL . 'assets/docs/fw4.pdf';
        $year    = $options['aras_tax_tax_year'] ?? '2025-2026';

        ob_start();
        ?>
        <div class="aras-tax-w4-download">
            <div class="aras-w4-card">
                <div class="aras-w4-icon">📄</div>
                <h4><?php _e( 'Download W-4 Form', 'aras-tax' ); ?></h4>
                <p><?php printf( __( 'Download and print a blank %s W-4 form for employee withholding.', 'aras-tax' ), esc_html( $year ) ); ?></p>
                <a href="<?php echo esc_url( $url ); ?>" class="aras-btn aras-btn-primary" target="_blank" download>
                    <?php _e( 'Download W-4 Forms', 'aras-tax' ); ?>
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_1040_download( $atts ) {
        ob_start();
        ?>
        <div class="aras-tax-w4-download">
            <div class="aras-w4-card">
                <div class="aras-w4-icon">📄</div>
                <h4><?php _e( 'Download 1040 Form', 'aras-tax' ); ?></h4>
                <p><?php _e( 'Download the U.S. Individual Income Tax Return form.', 'aras-tax' ); ?></p>
                <a href="#" class="aras-btn aras-btn-primary" onclick="alert('Form 1040 coming soon'); return false;">
                    <?php _e( 'Download 1040 Forms', 'aras-tax' ); ?>
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_1099_download( $atts ) {
        ob_start();
        ?>
        <div class="aras-tax-w4-download">
            <div class="aras-w4-card">
                <div class="aras-w4-icon">📄</div>
                <h4><?php _e( 'Download 1099-NEC Form', 'aras-tax' ); ?></h4>
                <p><?php _e( 'Download the Nonemployee Compensation form.', 'aras-tax' ); ?></p>
                <a href="#" class="aras-btn aras-btn-primary" onclick="alert('Form 1099 coming soon'); return false;">
                    <?php _e( 'Download 1099 Forms', 'aras-tax' ); ?>
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_services( $atts ) {
        $services = array(
            array(
                'title'       => 'Strategy & Planning',
                'icon'        => '📋',
                'description' => 'We work closely with you to develop a strategic roadmap that aligns with your business objectives and tax planning needs.',
            ),
            array(
                'title'       => 'Financial Consulting',
                'icon'        => '💰',
                'description' => 'Comprehensive financial consulting services tailored to help you achieve your financial goals and optimize your tax strategy.',
            ),
            array(
                'title'       => 'Business Planning',
                'icon'        => '📊',
                'description' => 'We provide expert guidance to help you navigate taxes and reach your financial aspirations with informed decisions.',
            ),
            array(
                'title'       => 'Efficiency Experts',
                'icon'        => '⚡',
                'description' => 'Supporting your financial success with expert tax solutions and tailored advice to maximize your returns.',
            ),
        );

        ob_start();
        ?>
        <div class="aras-tax-services" id="aras-tax-services">
            <div class="aras-services-header">
                <span class="aras-shape-label"><?php _e( 'Strategic Financial Consulting', 'aras-tax' ); ?></span>
                <h3><?php _e( 'Our Services', 'aras-tax' ); ?></h3>
                <p><?php _e( 'We provide expert guidance and innovative strategies tailored to your unique needs, enabling you to achieve sustainable growth and long-term success.', 'aras-tax' ); ?></p>
            </div>
            <div class="aras-services-grid">
                <?php foreach ( $services as $service ) : ?>
                <div class="aras-service-card">
                    <div class="aras-service-icon"><?php echo esc_html( $service['icon'] ); ?></div>
                    <h4><?php echo esc_html( $service['title'] ); ?></h4>
                    <p><?php echo esc_html( $service['description'] ); ?></p>
                    <a href="#" class="aras-service-link"><?php _e( 'Read More', 'aras-tax' ); ?> →</a>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_team( $atts ) {
        $team = array(
            array(
                'name'   => 'Aras, CPA',
                'role'   => 'Tax Consultant & Founder',
                'image'  => '',
            ),
            array(
                'name'   => 'Tax Specialist',
                'role'   => 'Senior Tax Advisor',
                'image'  => '',
            ),
            array(
                'name'   => 'Business Analyst',
                'role'   => 'Financial Planning',
                'image'  => '',
            ),
            array(
                'name'   => 'Account Manager',
                'role'   => 'Client Relations',
                'image'  => '',
            ),
        );

        ob_start();
        ?>
        <div class="aras-tax-team">
            <div class="aras-team-header">
                <span class="aras-shape-label"><?php _e( 'Meet Our Experts', 'aras-tax' ); ?></span>
                <h3><?php _e( 'Collaboration Success', 'aras-tax' ); ?></h3>
                <p><?php _e( 'Our portfolio showcases a diverse range of projects that reflect our commitment to delivering excellence.', 'aras-tax' ); ?></p>
            </div>
            <div class="aras-team-grid">
                <?php foreach ( $team as $member ) : ?>
                <div class="aras-team-card">
                    <div class="aras-team-avatar">
                        <?php if ( $member['image'] ) : ?>
                            <img src="<?php echo esc_url( $member['image'] ); ?>" alt="<?php echo esc_attr( $member['name'] ); ?>" />
                        <?php else : ?>
                            <span class="aras-team-initials"><?php echo esc_html( strtoupper( substr( $member['name'], 0, 1 ) ) ); ?></span>
                        <?php endif; ?>
                    </div>
                    <h4><?php echo esc_html( $member['name'] ); ?></h4>
                    <p class="aras-team-role"><?php echo esc_html( $member['role'] ); ?></p>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
