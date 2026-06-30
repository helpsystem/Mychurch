<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Public Class - Handles frontend functionality
 */
class Aras_Tax_Public {

    public function __construct() {
        add_action( 'wp_footer', array( $this, 'render_footer_branding' ) );

        // Auto-insert banner if enabled
        add_filter( 'the_content', array( $this, 'auto_insert_banner' ), 10 );
    }

    /**
     * Render branding in footer
     */
    public function render_footer_branding() {
        if ( ! is_admin() ) :
        ?>
        <div class="aras-tax-footer-branding">
            <p>
                <a href="https://aras-cpa.com/" target="_blank" rel="noopener">
                    <?php _e( 'Powered by Aras Tax Services', 'aras-tax' ); ?>
                </a>
                &bull;
                <a href="tel:<?php echo esc_attr( $this->get_phone() ); ?>">
                    <?php echo esc_html( $this->get_phone() ); ?>
                </a>
            </p>
        </div>
        <?php
        endif;
    }

    /**
     * Auto-insert banner at top of content if enabled
     */
    public function auto_insert_banner( $content ) {
        if ( is_singular() && is_front_page() ) {
            $options = get_option( 'aras_tax_options', array() );
            if ( isset( $options['aras_tax_show_banner'] ) && $options['aras_tax_show_banner'] === 'yes' ) {
                $banner = do_shortcode( '[aras_tax_banner]' );
                if ( $banner ) {
                    return $banner . $content;
                }
            }
        }
        return $content;
    }

    private function get_phone() {
        $options = get_option( 'aras_tax_options', array() );
        return $options['aras_tax_phone'] ?? '(205) 555-0100';
    }
}
