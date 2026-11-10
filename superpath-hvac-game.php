<?php
/**
 * Plugin Name: Superpath HVAC Game
 * Description: Development starter for project PacTruck.
 * Version: 0.0.1
 * Text Domain: superpath-hvac-game
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Load the bundled game and render its WordPress container.
 *
 * @return string
 */
function superpath_hvac_game_render() {
    $script_path = __DIR__ . '/dist/game.js';
    $style_path  = __DIR__ . '/dist/game.css';

    if ( ! file_exists( $script_path ) || ! file_exists( $style_path ) ) {
        return '<p>' . esc_html__(
            'The game is temporarily unavailable.',
            'superpath-hvac-game'
        ) . '</p>';
    }

    // Enqueue only when the shortcode is rendered; WordPress avoids duplicates.
    wp_enqueue_style(
        'superpath-hvac-game',
        wp_make_link_relative( plugins_url( 'dist/game.css', __FILE__ ) ),
        array(),
        (string) filemtime( $style_path )
    );
    wp_enqueue_script(
        'superpath-hvac-game',
        wp_make_link_relative( plugins_url( 'dist/game.js', __FILE__ ) ),
        array(),
        (string) filemtime( $script_path ),
        true
    );

    $container_id = wp_unique_id( 'superpath-hvac-game-' );

    return '<div class="superpath-hvac-game"><div id="' . esc_attr( $container_id ) . '" '
        . 'class="superpath-hvac-game__canvas" data-superpath-hvac-game>'
        . '<p data-game-status>' . esc_html__( 'Loading game…', 'superpath-hvac-game' ) . '</p>'
        . '<noscript>' . esc_html__(
            'Please enable JavaScript to play.',
            'superpath-hvac-game'
        ) . '</noscript></div></div>';
}

/**
 * Register the game shortcode.
 */
function superpath_hvac_game_register_shortcodes() {
    add_shortcode(
        'superpath_hvac_game',
        'superpath_hvac_game_render'
    );
}

add_action( 'init', 'superpath_hvac_game_register_shortcodes' );
