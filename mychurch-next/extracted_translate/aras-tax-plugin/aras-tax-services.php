<?php
/**
 * Plugin Name: Aras Tax Services
 * Plugin URI: https://aras-cpa.com/
 * Description: A professional WordPress plugin for Aras Tax Services - Tax & Accounting with AI-powered chatbot, multilingual translator (14 languages), tax forms, service listings, tax calculator, and branded widgets.
 * Version: 1.0.0
 * Author: Aras Tax Services
 * Author URI: https://aras-cpa.com/
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: aras-tax
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

// ─────────────────────────────────────────────
// Plugin Constants
// ─────────────────────────────────────────────
define( 'ARAS_TAX_VERSION', '1.0.0' );
define( 'ARAS_TAX_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ARAS_TAX_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'ARAS_TAX_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// ─────────────────────────────────────────────
// Include Required Files
// ─────────────────────────────────────────────
require_once ARAS_TAX_PLUGIN_DIR . 'includes/class-aras-tax-admin.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/class-aras-tax-shortcodes.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/class-aras-tax-widget.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/class-aras-tax-tax-calculator.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/class-aras-tax-public.php';

// AI Components
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/class-aras-tax-ai-engine.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/class-aras-tax-ai-chat.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/class-aras-tax-ai-translator.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/class-aras-tax-ai-admin.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/admin/class-aras-tax-ai-admin-chat.php';
require_once ARAS_TAX_PLUGIN_DIR . 'includes/ai/class-aras-tax-live-translator.php';

/**
 * Main Plugin Class
 */
class Aras_Tax_Services {

    /**
     * Single instance of the plugin
     */
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        register_activation_hook( __FILE__, array( $this, 'activate' ) );
        register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );

        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
        add_action( 'init', array( $this, 'init' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_public_assets' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
    }

    public function load_textdomain() {
        load_plugin_textdomain( 'aras-tax', false, dirname( ARAS_TAX_PLUGIN_BASENAME ) . '/languages' );
    }

    public function init() {
        // Initialize shortcodes
        new Aras_Tax_Shortcodes();

        // Initialize widget
        new Aras_Tax_Widget();

        // Initialize tax calculator
        new Aras_Tax_Tax_Calculator();

        // Initialize AI engine (always, for AJAX handlers)
        new Aras_Tax_AI_Engine();

        // Initialize AI chat (frontend)
        new Aras_Tax_AI_Chat();

        // Initialize AI translator
        new Aras_Tax_AI_Translator();

        // Initialize Live Speech Translator
        new Aras_Tax_Live_Translator();

        // Initialize public functionality
        new Aras_Tax_Public();

        // Initialize admin
        if ( is_admin() ) {
            new Aras_Tax_Admin();
            new Aras_Tax_AI_Admin();
            new Aras_Tax_AI_Admin_Chat();
        }
    }

    public function activate() {
        // Set default options
        $default_options = array(
            'aras_tax_phone'          => '(205) 555-0100',
            'aras_tax_email'          => 'info@aras-cpa.com',
            'aras_tax_address'        => 'Birmingham, AL',
            'aras_tax_header_text'    => 'Perfect Tax Consulting Solutions 2025 - 2026',
            'aras_tax_header_subtext' => 'Your trusted partner for smart tax strategies and financial goal achievement.',
            'aras_tax_primary_color'  => '#1a365d',
            'aras_tax_accent_color'   => '#c9a84c',
            'aras_tax_show_banner'    => 'yes',
            'aras_tax_w4_form_url'    => ARAS_TAX_PLUGIN_URL . 'assets/docs/fw4.pdf',
            'aras_tax_tax_year'       => '2025-2026',
        );

        if ( ! get_option( 'aras_tax_options' ) ) {
            add_option( 'aras_tax_options', $default_options );
        }

        flush_rewrite_rules();
    }

    public function deactivate() {
        flush_rewrite_rules();
    }

    public function enqueue_public_assets() {
        wp_enqueue_style(
            'aras-tax-public',
            ARAS_TAX_PLUGIN_URL . 'assets/css/public.css',
            array(),
            ARAS_TAX_VERSION
        );

        wp_enqueue_script(
            'aras-tax-public',
            ARAS_TAX_PLUGIN_URL . 'assets/js/public.js',
            array( 'jquery' ),
            ARAS_TAX_VERSION,
            true
        );

        // Pass plugin settings to JS
        $options = get_option( 'aras_tax_options', array() );
        wp_localize_script( 'aras-tax-public', 'arasTaxData', array(
            'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
            'nonce'         => wp_create_nonce( 'aras_tax_nonce' ),
            'primaryColor'  => isset( $options['aras_tax_primary_color'] ) ? $options['aras_tax_primary_color'] : '#1a365d',
            'accentColor'   => isset( $options['aras_tax_accent_color'] ) ? $options['aras_tax_accent_color'] : '#c9a84c',
        ) );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'aras-tax' ) === false ) {
            return;
        }

        wp_enqueue_style(
            'aras-tax-admin',
            ARAS_TAX_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            ARAS_TAX_VERSION
        );

        wp_enqueue_script(
            'aras-tax-admin',
            ARAS_TAX_PLUGIN_URL . 'assets/js/admin.js',
            array( 'jquery', 'wp-color-picker' ),
            ARAS_TAX_VERSION,
            true
        );

        wp_enqueue_style( 'wp-color-picker' );
    }
}

// Initialize the plugin
$aras_tax_plugin = Aras_Tax_Services::get_instance();
