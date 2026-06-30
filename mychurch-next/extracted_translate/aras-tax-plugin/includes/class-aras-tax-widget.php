<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Widget Class - Sidebar widget for Aras Tax Services
 */
class Aras_Tax_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'aras_tax_widget',
            __( 'Aras Tax Services Widget', 'aras-tax' ),
            array( 'description' => __( 'Display Aras Tax Services contact info and quick links.', 'aras-tax' ),
                   'classname'   => 'aras-tax-widget'
            )
        );
    }

    public function widget( $args, $instance ) {
        $options = get_option( 'aras_tax_options', array() );

        $title      = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Aras Tax Services', 'aras-tax' );
        $phone      = ! empty( $instance['phone'] ) ? $instance['phone'] : ( $options['aras_tax_phone'] ?? '(205) 555-0100' );
        $email      = ! empty( $instance['email'] ) ? $instance['email'] : ( $options['aras_tax_email'] ?? 'info@aras-cpa.com' );
        $address    = ! empty( $instance['address'] ) ? $instance['address'] : ( $options['aras_tax_address'] ?? 'Birmingham, AL' );
        $show_w4    = ! empty( $instance['show_w4'] );
        $primary_color = $options['aras_tax_primary_color'] ?? '#1a365d';
        $accent_color  = $options['aras_tax_accent_color'] ?? '#c9a84c';

        echo $args['before_widget'];
        echo '<div class="aras-widget-content" style="--aras-primary: ' . esc_attr( $primary_color ) . '; --aras-accent: ' . esc_attr( $accent_color ) . ';">';
        echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
        ?>
        <div class="aras-widget-info">
            <div class="aras-widget-item">
                <span class="aras-widget-icon">📞</span>
                <a href="tel:<?php echo esc_attr( preg_replace('/[^0-9+]/', '', $phone) ); ?>"><?php echo esc_html( $phone ); ?></a>
            </div>
            <div class="aras-widget-item">
                <span class="aras-widget-icon">✉️</span>
                <a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a>
            </div>
            <div class="aras-widget-item">
                <span class="aras-widget-icon">📍</span>
                <span><?php echo esc_html( $address ); ?></span>
            </div>
        </div>

        <?php if ( $show_w4 ) : ?>
        <div class="aras-widget-w4">
            <a href="<?php echo esc_url( ARAS_TAX_PLUGIN_URL . 'assets/docs/fw4.pdf' ); ?>" class="aras-w4-link" target="_blank" download>
                📄 <?php _e( 'Download W-4 Form', 'aras-tax' ); ?>
            </a>
        </div>
        <?php endif; ?>

        <div class="aras-widget-cta">
            <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="aras-btn aras-btn-primary aras-widget-btn">
                <?php _e( 'Request Consultation', 'aras-tax' ); ?>
            </a>
        </div>
        <?php
        echo '</div>';
        echo $args['after_widget'];
    }

    public function form( $instance ) {
        $title   = isset( $instance['title'] ) ? $instance['title'] : 'Aras Tax Services';
        $phone   = isset( $instance['phone'] ) ? $instance['phone'] : '(205) 555-0100';
        $email   = isset( $instance['email'] ) ? $instance['email'] : 'info@aras-cpa.com';
        $address = isset( $instance['address'] ) ? $instance['address'] : 'Birmingham, AL';
        $show_w4 = isset( $instance['show_w4'] ) ? $instance['show_w4'] : true;
        ?>
        <p>
            <label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:' ); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id( 'phone' ); ?>"><?php _e( 'Phone:' ); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id( 'phone' ); ?>" name="<?php echo $this->get_field_name( 'phone' ); ?>" type="text" value="<?php echo esc_attr( $phone ); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id( 'email' ); ?>"><?php _e( 'Email:' ); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id( 'email' ); ?>" name="<?php echo $this->get_field_name( 'email' ); ?>" type="email" value="<?php echo esc_attr( $email ); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id( 'address' ); ?>"><?php _e( 'Address:' ); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id( 'address' ); ?>" name="<?php echo $this->get_field_name( 'address' ); ?>" type="text" value="<?php echo esc_attr( $address ); ?>">
        </p>
        <p>
            <input type="checkbox" id="<?php echo $this->get_field_id( 'show_w4' ); ?>" name="<?php echo $this->get_field_name( 'show_w4' ); ?>" value="1" <?php checked( $show_w4, true ); ?>>
            <label for="<?php echo $this->get_field_id( 'show_w4' ); ?>"><?php _e( 'Show W-4 Download Link' ); ?></label>
        </p>
        <?php
    }

    public function update( $new_instance, $old_instance ) {
        $instance = array();
        $instance['title']   = sanitize_text_field( $new_instance['title'] ?? '' );
        $instance['phone']   = sanitize_text_field( $new_instance['phone'] ?? '' );
        $instance['email']   = sanitize_email( $new_instance['email'] ?? '' );
        $instance['address'] = sanitize_text_field( $new_instance['address'] ?? '' );
        $instance['show_w4'] = ! empty( $new_instance['show_w4'] );
        return $instance;
    }
}
