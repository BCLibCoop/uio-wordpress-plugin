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

$(document).ready(function () {

    var tocPlaceholder = "<div class='flc-toc-tocContainer toc'> </div>";
    var uioTemplateSpec = {
        uioTemplate : {
            url : uioData.pluginUrl + "template.html"
        }
    };

    // Fetch the template text, and when we have it, proceed
    fluid.fetchResources(uioTemplateSpec, function (spec) {

        // Add the sliding panel template to the page
        $(uioData.uioTemplateSelector).prepend(spec.uioTemplate.resourceText);

        // Add the table of contents placeholder to the page
        $(uioData.uioTocSelector).prepend(tocPlaceholder);

        // Create the prefs editor
        fluid.uiOptions(".flc-prefsEditor-separatedPanel", {
            preferences: [
                "fluid.prefs.textSize",
                "fluid.prefs.lineSpace",
                "fluid.prefs.textFont",
                "fluid.prefs.contrast",
                "fluid.prefs.tableOfContents",
                "fluid.prefs.enhanceInputs",
                "fluid.prefs.letterSpace",
                "fluid.prefs.wordSpace",
                "fluid.prefs.syllabification",
            ],
            auxiliarySchema: {
                terms: {
                    templatePrefix: uioData.pluginUrl + "lib/infusion/src/framework/preferences/html",
                    messagePrefix: uioData.pluginUrl + "lib/infusion/src/framework/preferences/messages",
                },
                "fluid.prefs.tableOfContents": {
                    enactor: {
                        tocTemplate: uioData.pluginUrl + "lib/infusion/src/components/tableOfContents/html/TableOfContents.html",
                        tocMessage: uioData.pluginUrl + "lib/infusion/src/framework/preferences/messages/tableOfContents-enactor.json",
                        ignoreForToC: {
                            overviewPanel: ".flc-overviewPanel",
                        },
                    }
                },
                "fluid.prefs.syllabification": {
                    enactor: {
                        terms: {
                            patternPrefix: uioData.pluginUrl + "lib/infusion/src/lib/hypher/patterns"
                        }
                    }
                }
            },
            prefsEditorLoader: {
                lazyLoad: true,
            },
        });
    });
});
