/*
Copyright The Infusion copyright holders
See the AUTHORS.md file at the top-level directory of this distribution and at
https://github.com/fluid-project/infusion/raw/main/AUTHORS.md.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/main/Infusion-LICENSE.txt
*/

"use strict";

/** Render a timestamp from a Date object into a helpful fixed format for debug logs to millisecond accuracy
 * @param {Date} date - The date to be rendered
 * @return {String} - A string format consisting of hours:minutes:seconds.millis for the datestamp padded to fixed with
 */

fluid.renderTimestamp = function (date) {
    var zeropad = function (num, width) {
        if (!width) { width = 2; }
        var numstr = (num === undefined ? "" : num.toString());
        return "00000".substring(5 - width + numstr.length) + numstr;
    };
    return zeropad(date.getHours()) + ":" + zeropad(date.getMinutes()) + ":" + zeropad(date.getSeconds()) + "." + zeropad(date.getMilliseconds(), 3);
};

fluid.isTracing = false;

fluid.registerNamespace("fluid.tracing");

fluid.tracing.pathCount = [];

fluid.tracing.summarisePathCount = function (pathCount) {
    pathCount = pathCount || fluid.tracing.pathCount;
    var togo = {};
    for (var i = 0; i < pathCount.length; ++i) {
        var path = pathCount[i];
        if (!togo[path]) {
            togo[path] = 1;
        }
        else {
            ++togo[path];
        }
    }
    var toReallyGo = [];
    fluid.each(togo, function (el, path) {
        toReallyGo.push({path: path, count: el});
    });
    toReallyGo.sort(function (a, b) {return b.count - a.count;});
    return toReallyGo;
};

fluid.tracing.condensePathCount = function (prefixes, pathCount) {
    prefixes = fluid.makeArray(prefixes);
    var prefixCount = {};
    fluid.each(prefixes, function (prefix) {
        prefixCount[prefix] = 0;
    });
    var togo = [];
    fluid.each(pathCount, function (el) {
        var path = el.path;
        if (!fluid.find(prefixes, function (prefix) {
            if (path.indexOf(prefix) === 0) {
                prefixCount[prefix] += el.count;
                return true;
            }
        })) {
            togo.push(el);
        }
    });
    fluid.each(prefixCount, function (count, path) {
        togo.unshift({path: path, count: count});
    });
    return togo;
};

fluid.obtainException = function () {
    return new Error("Trace exception");
};

fluid.registerNamespace("fluid.exceptionDecoders");

fluid.decodeStack = function () {
    var e = fluid.obtainException();
    return fluid.exceptionDecoders.standard(e);
};

fluid.exceptionDecoders.standard = function (e) {
    var delimiter = "at ";
    var lines = e.stack.replace(/(?:\n@:0)?\s+$/m, "").replace(/^\(/gm, "{anonymous}(").split("\n");
    return fluid.transform(lines, function (line) {
        line = line.replace(/\)/g, "");
        var atind = line.indexOf(delimiter);
        return atind === -1 ? [line] : [line.substring(atind + delimiter.length), line.substring(0, atind)];
    });
};

// Main entry point for callers.
fluid.getCallerInfo = function (atDepth) {
    atDepth = (atDepth || 3);
    var stack = fluid.decodeStack();
    var element = stack && stack[atDepth] && stack[atDepth][0]; // TODO: Last guard is necessary on Safari, see FLUID-6482
    if (element) {
        var lastslash = element.lastIndexOf("/");
        if (lastslash === -1) {
            lastslash = 0;
        }
        var nextColon = element.indexOf(":", lastslash);
        return {
            path: element.substring(0, lastslash),
            filename: element.substring(lastslash + 1, nextColon),
            index: element.substring(nextColon + 1)
        };
    } else {
        return null;
    }
};

/** Generates a string for padding purposes by replicating a character a given number of times
 * @param {Character} c - A character to be used for padding
 * @param {Integer} count - The number of times to repeat the character
 * @return {String} - A string of length <code>count</code> consisting of repetitions of the supplied character
 */
// UNOPTIMISED
fluid.generatePadding = function (c, count) {
    var togo = "";
    for (var i = 0; i < count; ++i) {
        togo += c;
    }
    return togo;
};

// Marker so that we can render a custom string for properties which are not direct and concrete
fluid.SYNTHETIC_PROPERTY = Object.freeze({});

// utility to avoid triggering custom getter code which could throw an exception - e.g. express 3.x's request object
fluid.getSafeProperty = function (obj, key) {
    var desc = Object.getOwnPropertyDescriptor(obj, key); // supported on all of our environments - is broken on IE8
    return desc && !desc.get ? obj[key] : fluid.SYNTHETIC_PROPERTY;
};

fluid.prettyPrintJSONImpl = function (obj, small, options) {
    function out(str) {
        options.output += str;
    }
    var big = small + options.indentChars, isFunction = typeof(obj) === "function";
    if (options.maxRenderChars !== undefined && options.output.length > options.maxRenderChars) {
        return true;
    }
    if (obj === null) {
        out("null");
    } else if (obj === undefined) {
        out("undefined"); // NB - object invalid for JSON interchange
    } else if (obj === fluid.SYNTHETIC_PROPERTY) {
        out("[Synthetic property]");
    } else if (fluid.isPrimitive(obj) && !isFunction) {
        out(JSON.stringify(obj));
    }
    else {
        if (options.stack.indexOf(obj) !== -1) {
            out("(CIRCULAR)"); // NB - object invalid for JSON interchange
            return;
        }
        options.stack.push(obj);
        var i;
        if (fluid.isArrayable(obj)) {
            if (obj.length === 0) {
                out("[]");
            } else {
                out("[\n" + big);
                for (i = 0; i < obj.length; ++i) {
                    if (fluid.prettyPrintJSONImpl(obj[i], big, options)) {
                        return true;
                    }
                    if (i !== obj.length - 1) {
                        out(",\n" + big);
                    }
                }
                out("\n" + small + "]");
            }
        }
        else {
            out("{" + (isFunction ? " Function" : "") + "\n" + big); // NB - Function object invalid for JSON interchange
            var keys = fluid.keys(obj);
            for (i = 0; i < keys.length; ++i) {
                var key = keys[i];
                var value = fluid.getSafeProperty(obj, key);
                out(JSON.stringify(key) + ": ");
                if (fluid.prettyPrintJSONImpl(value, big, options)) {
                    return true;
                }
                if (i !== keys.length - 1) {
                    out(",\n" + big);
                }
            }
            out("\n" + small + "}");
        }
        options.stack.pop();
    }
    return;
};

/** Render a complex JSON object into a nicely indented format suitable for human readability.
 * @param {Object} obj - The object to be rendered
 * @param {Object} options - An options structure governing the rendering process. This supports the following options:
 *     <code>indent</code> {Integer} the number of space characters to be used to indent each level of containment (default value: 4)
 *     <code>maxRenderChars</code> {Integer} rendering the object will cease once this number of characters has been generated
 * @return {String} - The generated output.
 */
fluid.prettyPrintJSON = function (obj, options) {
    options = jQuery.extend({indent: 4, stack: [], output: ""}, options);
    options.indentChars = fluid.generatePadding(" ", options.indent);
    fluid.prettyPrintJSONImpl(obj, "", options);
    return options.output;
};

/**
 * Dumps a DOM element into a readily recognisable form for debugging - produces a
 * "semi-selector" summarising its tag name, class and id, whichever are set.
 *
 * @param {jQueryable} element - The element to be dumped
 * @return {String} - A string representing the element.
 */
fluid.dumpEl = function (element) {
    var togo;

    if (!element) {
        return "null";
    }
    if (element.nodeType === 3 || element.nodeType === 8) {
        return "[data: " + element.data + "]";
    }
    if (element.nodeType === 9) {
        return "[document: location " + element.location + "]";
    }
    if (!element.nodeType && fluid.isArrayable(element)) {
        togo = "[";
        for (var i = 0; i < element.length; ++i) {
            togo += fluid.dumpEl(element[i]);
            if (i < element.length - 1) {
                togo += ", ";
            }
        }
        return togo + "]";
    }
    element = jQuery(element);
    togo = element.get(0).tagName;
    if (element.id) {
        togo += "#" + element.id;
    }
    if (element.attr("class")) {
        togo += "." + element.attr("class");
    }
    return togo;
};

/** BEGIN IOC DEBUGGING METHODS **/
fluid["debugger"] = function () {
    debugger; // eslint-disable-line no-debugger
};

fluid.defaults("fluid.debuggingProbe", {
    gradeNames: ["fluid.component"]
});

// probe looks like:
// target: {preview other}.listeners.eventName
// priority: first/last
// func: console.log/fluid.log/fluid.debugger
fluid.probeToDistribution = function (probe) {
    var instantiator = fluid.globalInstantiator;
    var parsed = fluid.parseContextReference(probe.target);
    var segs = fluid.model.parseToSegments(parsed.path, instantiator.parseEL, true);
    if (segs[0] !== "options") {
        segs.unshift("options"); // compensate for this insanity until we have the great options flattening
    }
    var parsedPriority = fluid.parsePriority(probe.priority);
    if (parsedPriority.constraint && !parsedPriority.constraint.target) {
        parsedPriority.constraint.target = "authoring";
    }
    return {
        target: "{/ " + parsed.context + "}." + instantiator.composeSegments.apply(null, segs),
        record: {
            func: probe.func,
            funcName: probe.funcName,
            args: probe.args,
            priority: fluid.renderPriority(parsedPriority)
        }
    };
};

fluid.registerProbes = function (probes) {
    var probeDistribution = fluid.transform(probes, fluid.probeToDistribution);
    var memberName = "fluid_debuggingProbe_" + fluid.allocateGuid();
    fluid.construct([memberName], {
        type: "fluid.debuggingProbe",
        distributeOptions: probeDistribution
    });
    return memberName;
};

fluid.deregisterProbes = function (probeName) {
    fluid.destroy([probeName]);
};

/** END IOC DEBUGGING METHODS **/
