<?php
/**
 * Copyright 2015–2019 OCAD University
 *
 * Licensed under the Educational Community License (ECL), Version 2.0 or the New
 * BSD license. You may not use this file except in compliance with one these
 * Licenses.
 *
 * You may obtain a copy of the ECL 2.0 License and BSD License at
 * https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
 *
 * @package User_Interface_Options
 */

/**
 * Add necessary files to headers
 */
function uio_styles_scripts() {
	/* Add the CSS files to the header */
	wp_register_style( 'fluid', UIO_PLUGIN_URL . 'lib/infusion/src/framework/core/css/fluid.css', array(), UIO_LIBRARY_VERSION );
	wp_style_add_data( 'fluid', 'path', UIO_PLUGIN_DIR . 'lib/infusion/src/framework/core/css/fluid.css' );
	wp_register_style( 'Enactors', UIO_PLUGIN_URL . 'lib/infusion/src/framework/preferences/css/Enactors.css', array(), UIO_LIBRARY_VERSION );
	wp_register_style( 'PrefsEditor', UIO_PLUGIN_URL . 'lib/infusion/src/framework/preferences/css/PrefsEditor.css', array(), UIO_LIBRARY_VERSION );
	wp_register_style( 'SeparatedPanelPrefsEditor', UIO_PLUGIN_URL . 'lib/infusion/src/framework/preferences/css/SeparatedPanelPrefsEditor.css', array(), UIO_LIBRARY_VERSION );
	wp_enqueue_style( 'uio', UIO_PLUGIN_URL . 'uio.css', array( 'fluid', 'Enactors', 'PrefsEditor', 'SeparatedPanelPrefsEditor' ), UIO_PLUGIN_VERSION );
	wp_style_add_data( 'uio', 'path', UIO_PLUGIN_DIR . 'uio.css' );

	/* Add the JS files to the header */
	wp_register_script( 'infusion', UIO_PLUGIN_URL . 'lib/infusion/infusion-uiOptions.js', array(), UIO_LIBRARY_VERSION, false );
	wp_enqueue_script( 'uio', UIO_PLUGIN_URL . 'uio.js', array( 'jquery', 'jquery-ui-core', 'infusion' ), UIO_PLUGIN_VERSION, false );

	/* Expose PHP data via JavaScript */
	$uio_data = array(
		'pluginUrl'           => UIO_PLUGIN_URL,
		'uioTemplateSelector' => get_option( 'uio_template_selector', 'body' ),
		'uioTocSelector'      => get_option( 'uio_toc_selector', '#primary' ),
	);
	wp_localize_script( 'uio', 'uioData', $uio_data );
}

add_action( 'wp_enqueue_scripts', 'uio_styles_scripts', 100 );
