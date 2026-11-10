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
 * Render the development connection check.
 *
 * @return string
 */
function superpath_hvac_game_render() {
    return '<p>' . esc_html__(
        'Awesome - PacTruck development plugin is working!',
        'superpath-hvac-game'
    ) . '</p>';
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