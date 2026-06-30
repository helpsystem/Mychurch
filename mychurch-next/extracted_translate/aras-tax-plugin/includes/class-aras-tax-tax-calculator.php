<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Tax Calculator Class - Handles AJAX tax calculation
 */
class Aras_Tax_Tax_Calculator {

    /**
     * 2025 Federal Tax Brackets
     */
    private static $tax_brackets = array(
        'single' => array(
            array( 'min' => 0, 'max' => 11600, 'rate' => 0.10 ),
            array( 'min' => 11600, 'max' => 47150, 'rate' => 0.12 ),
            array( 'min' => 47150, 'max' => 100525, 'rate' => 0.22 ),
            array( 'min' => 100525, 'max' => 191950, 'rate' => 0.24 ),
            array( 'min' => 191950, 'max' => 243725, 'rate' => 0.32 ),
            array( 'min' => 243725, 'max' => 609350, 'rate' => 0.35 ),
            array( 'min' => 609350, 'max' => PHP_INT_MAX, 'rate' => 0.37 ),
        ),
        'married_joint' => array(
            array( 'min' => 0, 'max' => 23200, 'rate' => 0.10 ),
            array( 'min' => 23200, 'max' => 94300, 'rate' => 0.12 ),
            array( 'min' => 94300, 'max' => 201050, 'rate' => 0.22 ),
            array( 'min' => 201050, 'max' => 383900, 'rate' => 0.24 ),
            array( 'min' => 383900, 'max' => 487450, 'rate' => 0.32 ),
            array( 'min' => 487450, 'max' => 731200, 'rate' => 0.35 ),
            array( 'min' => 731200, 'max' => PHP_INT_MAX, 'rate' => 0.37 ),
        ),
        'married_separate' => array(
            array( 'min' => 0, 'max' => 11600, 'rate' => 0.10 ),
            array( 'min' => 11600, 'max' => 47150, 'rate' => 0.12 ),
            array( 'min' => 47150, 'max' => 100525, 'rate' => 0.22 ),
            array( 'min' => 100525, 'max' => 191950, 'rate' => 0.24 ),
            array( 'min' => 191950, 'max' => 243725, 'rate' => 0.32 ),
            array( 'min' => 243725, 'max' => 365600, 'rate' => 0.35 ),
            array( 'min' => 365600, 'max' => PHP_INT_MAX, 'rate' => 0.37 ),
        ),
        'head_household' => array(
            array( 'min' => 0, 'max' => 16550, 'rate' => 0.10 ),
            array( 'min' => 16550, 'max' => 63100, 'rate' => 0.12 ),
            array( 'min' => 63100, 'max' => 100500, 'rate' => 0.22 ),
            array( 'min' => 100500, 'max' => 191950, 'rate' => 0.24 ),
            array( 'min' => 191950, 'max' => 243700, 'rate' => 0.32 ),
            array( 'min' => 243700, 'max' => 609350, 'rate' => 0.35 ),
            array( 'min' => 609350, 'max' => PHP_INT_MAX, 'rate' => 0.37 ),
        ),
    );

    /**
     * Standard Deductions 2025
     */
    private static $standard_deductions = array(
        'single'            => 14600,
        'married_joint'     => 29200,
        'married_separate'  => 14600,
        'head_household'    => 21900,
    );

    public function __construct() {
        add_action( 'wp_ajax_aras_tax_calculate', array( $this, 'calculate_tax_ajax' ) );
        add_action( 'wp_ajax_nopriv_aras_tax_calculate', array( $this, 'calculate_tax_ajax' ) );
    }

    public function calculate_tax_ajax() {
        check_ajax_referer( 'aras_tax_nonce', 'nonce' );

        $income   = floatval( $_POST['income'] ?? 0 );
        $filing   = sanitize_text_field( $_POST['filing_status'] ?? 'single' );
        $deductions = floatval( $_POST['deductions'] ?? 0 );
        $tax_type = sanitize_text_field( $_POST['tax_type'] ?? 'federal' );

        if ( $income <= 0 ) {
            wp_send_json_error( array( 'message' => __( 'Invalid income amount.', 'aras-tax' ) ) );
        }

        if ( ! isset( self::$tax_brackets[ $filing ] ) ) {
            $filing = 'single';
        }

        // Use standard deduction if no custom deduction provided
        if ( $deductions <= 0 ) {
            $deductions = self::$standard_deductions[ $filing ];
        }

        $taxable_income = max( 0, $income - $deductions );

        if ( $tax_type === 'self-employment' ) {
            $result = $this->calculate_self_employment_tax( $taxable_income );
        } else {
            $result = $this->calculate_federal_tax( $taxable_income, $filing, $income );
        }

        wp_send_json_success( $result );
    }

    /**
     * Calculate federal income tax based on 2025 brackets
     */
    public function calculate_federal_tax( $taxable_income, $filing_status, $gross_income ) {
        $brackets = self::$tax_brackets[ $filing_status ];
        $total_tax = 0;
        $breakdown = array();

        foreach ( $brackets as $bracket ) {
            if ( $taxable_income > $bracket['min'] ) {
                $taxable_in_bracket = min( $taxable_income, $bracket['max'] ) - $bracket['min'];
                $tax_in_bracket     = $taxable_in_bracket * $bracket['rate'];
                $total_tax         += $tax_in_bracket;

                if ( $taxable_in_bracket > 0 ) {
                    $breakdown[] = array(
                        'range'  => '$' . number_format( $bracket['min'] ) . ' - ' . ( $bracket['max'] === PHP_INT_MAX ? '∞' : '$' . number_format( $bracket['max'] ) ),
                        'rate'   => $bracket['rate'] * 100,
                        'amount' => $tax_in_bracket,
                    );
                }
            }
        }

        $effective_rate = $gross_income > 0 ? ( $total_tax / $gross_income ) * 100 : 0;
        $monthly_tax    = $total_tax / 12;

        return array(
            'taxable_income'  => $taxable_income,
            'total_tax'       => $total_tax,
            'effective_rate'  => $effective_rate,
            'monthly_tax'     => $monthly_tax,
            'filing_status'   => $filing_status,
            'breakdown'       => $breakdown,
            'tax_year'        => '2025',
        );
    }

    /**
     * Calculate self-employment tax
     */
    public function calculate_self_employment_tax( $net_income ) {
        $se_tax_rate     = 0.153; // 12.4% Social Security + 2.9% Medicare
        $se_taxable_base = $net_income * 0.9235; // 92.35% of net income is subject to SE tax
        $se_tax          = $se_taxable_base * $se_tax_rate;

        // Deduction for half of SE tax
        $deduction = $se_tax * 0.5;

        return array(
            'taxable_income' => $se_taxable_base,
            'total_tax'      => $se_tax,
            'effective_rate' => $se_tax_rate * 100,
            'monthly_tax'    => $se_tax / 12,
            'deduction'      => $deduction,
            'tax_year'       => '2025',
        );
    }
}
