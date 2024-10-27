// TinyColor v1.0.0
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function() {

var trimLeft = /^[\s,#]+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    math = Math,
    mathRound = math.round,
    mathMin = math.min,
    mathMax = math.max,
    mathRandom = math.random;

var tinycolor = function tinycolor (color, opts) {

    color = (color) ? color : '';
    opts = opts || { };

    // If input is already a tinycolor, return itself
    if (color instanceof tinycolor) {
       return color;
    }
    // If we are called as a function, call using new instead
    if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
    }

    var rgb = inputToRGB(color);
    this._r = rgb.r,
    this._g = rgb.g,
    this._b = rgb.b,
    this._a = rgb.a,
    this._roundA = mathRound(100*this._a) / 100,
    this._format = opts.format || rgb.format;
    this._gradientType = opts.gradientType;

    // Don't let the range of [0,255] come back in [0,1].
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1
    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    if (this._r < 1) { this._r = mathRound(this._r); }
    if (this._g < 1) { this._g = mathRound(this._g); }
    if (this._b < 1) { this._b = mathRound(this._b); }

    this._ok = rgb.ok;
    this._tc_id = tinyCounter++;
};

tinycolor.prototype = {
    isDark: function() {
        return this.getBrightness() < 128;
    },
    isLight: function() {
        return !this.isDark();
    },
    isValid: function() {
        return this._ok;
    },
    getFormat: function() {
        return this._format;
    },
    getAlpha: function() {
        return this._a;
    },
    getBrightness: function() {
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    },
    setAlpha: function(value) {
        this._a = boundAlpha(value);
        this._roundA = mathRound(100*this._a) / 100;
        return this;
    },
    toHsv: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    },
    toHsvString: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
        return (this._a == 1) ?
          "hsv("  + h + ", " + s + "%, " + v + "%)" :
          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    },
    toHsl: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    },
    toHslString: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
        return (this._a == 1) ?
          "hsl("  + h + ", " + s + "%, " + l + "%)" :
          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    },
    toHex: function(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
    },
    toHexString: function(allow3Char) {
        return '#' + this.toHex(allow3Char);
    },
    toHex8: function() {
        return rgbaToHex(this._r, this._g, this._b, this._a);
    },
    toHex8String: function() {
        return '#' + this.toHex8();
    },
    toRgb: function() {
        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    },
    toRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    },
    toPercentageRgb: function() {
        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    },
    toPercentageRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    },
    toName: function() {
        if (this._a === 0) {
            return "transparent";
        }

        if (this._a < 1) {
            return false;
        }

        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    },
    toFilter: function(secondColor) {
        var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";

        if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = s.toHex8String();
        }

        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    },
    toString: function(format) {
        var formatSet = !!format;
        format = format || this._format;

        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === "name" && this._a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === "rgb") {
            formattedString = this.toRgbString();
        }
        if (format === "prgb") {
            formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
        }
        if (format === "hex3") {
            formattedString = this.toHexString(true);
        }
        if (format === "hex8") {
            formattedString = this.toHex8String();
        }
        if (format === "name") {
            formattedString = this.toName();
        }
        if (format === "hsl") {
            formattedString = this.toHslString();
        }
        if (format === "hsv") {
            formattedString = this.toHsvString();
        }

        return formattedString || this.toHexString();
    },

    _applyModification: function(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
    },
    lighten: function() {
        return this._applyModification(lighten, arguments);
    },
    brighten: function() {
        return this._applyModification(brighten, arguments);
    },
    darken: function() {
        return this._applyModification(darken, arguments);
    },
    desaturate: function() {
        return this._applyModification(desaturate, arguments);
    },
    saturate: function() {
        return this._applyModification(saturate, arguments);
    },
    greyscale: function() {
        return this._applyModification(greyscale, arguments);
    },
    spin: function() {
        return this._applyModification(spin, arguments);
    },

    _applyCombination: function(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
    },
    analogous: function() {
        return this._applyCombination(analogous, arguments);
    },
    complement: function() {
        return this._applyCombination(complement, arguments);
    },
    monochromatic: function() {
        return this._applyCombination(monochromatic, arguments);
    },
    splitcomplement: function() {
        return this._applyCombination(splitcomplement, arguments);
    },
    triad: function() {
        return this._applyCombination(triad, arguments);
    },
    tetrad: function() {
        return this._applyCombination(tetrad, arguments);
    }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function(color, opts) {
    if (typeof color == "object") {
        var newColor = {};
        for (var i in color) {
            if (color.hasOwnProperty(i)) {
                if (i === "a") {
                    newColor[i] = color[i];
                }
                else {
                    newColor[i] = convertToPercentage(color[i]);
                }
            }
        }
        color = newColor;
    }

    return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {

    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var ok = false;
    var format = false;

    if (typeof color == "string") {
        color = stringInputToObject(color);
    }

    if (typeof color == "object") {
        if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
            color.s = convertToPercentage(color.s);
            color.v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, color.s, color.v);
            ok = true;
            format = "hsv";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
            color.s = convertToPercentage(color.s);
            color.l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, color.s, color.l);
            ok = true;
            format = "hsl";
        }

        if (color.hasOwnProperty("a")) {
            a = color.a;
        }
    }

    a = boundAlpha(a);

    return {
        ok: ok,
        format: color.format || format,
        r: mathMin(255, mathMax(rgb.r, 0)),
        g: mathMin(255, mathMax(rgb.g, 0)),
        b: mathMin(255, mathMax(rgb.b, 0)),
        a: a
    };
}


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b){
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
    };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;

    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
 function hsvToRgb(h, s, v) {

    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);

    var i = math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    // Return a 3 character hex if possible
    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }

    return hex.join("");
}
    // `rgbaToHex`
    // Converts an RGBA color plus alpha transparency to hex
    // Assumes r, g, b and a are contained in the set [0, 255]
    // Returns an 8 character hex
    function rgbaToHex(r, g, b, a) {

        var hex = [
            pad2(convertDecimalToHex(a)),
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        return hex.join("");
    }

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) { return false; }
    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};
tinycolor.random = function() {
    return tinycolor.fromRatio({
        r: mathRandom(),
        g: mathRandom(),
        b: mathRandom()
    });
};


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function desaturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s -= amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function saturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s += amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function greyscale(color) {
    return tinycolor(color).desaturate(100);
}

function lighten (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l += amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

function brighten(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var rgb = tinycolor(color).toRgb();
    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    return tinycolor(rgb);
}

function darken (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l -= amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function spin(color, amount) {
    var hsl = tinycolor(color).toHsl();
    var hue = (mathRound(hsl.h) + amount) % 360;
    hsl.h = hue < 0 ? 360 + hue : hue;
    return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function complement(color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + 180) % 360;
    return tinycolor(hsl);
}

function triad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
}

function tetrad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
}

function splitcomplement(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
}

function analogous(color, results, slices) {
    results = results || 6;
    slices = slices || 30;

    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices;
    var ret = [tinycolor(color)];

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
}

function monochromatic(color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
    var modification = 1 / results;

    while (results--) {
        ret.push(tinycolor({ h: h, s: s, v: v}));
        v = (v + modification) % 1;
    }

    return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function(color1, color2, amount) {
    amount = (amount === 0) ? 0 : (amount || 50);

    var rgb1 = tinycolor(color1).toRgb();
    var rgb2 = tinycolor(color2).toRgb();

    var p = amount / 100;
    var w = p * 2 - 1;
    var a = rgb2.a - rgb1.a;

    var w1;

    if (w * a == -1) {
        w1 = w;
    } else {
        w1 = (w + a) / (1 + w * a);
    }

    w1 = (w1 + 1) / 2;

    var w2 = 1 - w1;

    var rgba = {
        r: rgb2.r * w1 + rgb1.r * w2,
        g: rgb2.g * w1 + rgb1.g * w2,
        b: rgb2.b * w1 + rgb1.b * w2,
        a: rgb2.a * p  + rgb1.a * (1 - p)
    };

    return tinycolor(rgba);
};


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/AERT#color-contrast>

// `readability`
// Analyze the 2 colors and returns an object with the following properties:
//    `brightness`: difference in brightness between the two colors
//    `color`: difference in color/hue between the two colors
tinycolor.readability = function(color1, color2) {
    var c1 = tinycolor(color1);
    var c2 = tinycolor(color2);
    var rgb1 = c1.toRgb();
    var rgb2 = c2.toRgb();
    var brightnessA = c1.getBrightness();
    var brightnessB = c2.getBrightness();
    var colorDiff = (
        Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
        Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
        Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
    );

    return {
        brightness: Math.abs(brightnessA - brightnessB),
        color: colorDiff
    };
};

// `readable`
// http://www.w3.org/TR/AERT#color-contrast
// Ensure that foreground and background color combinations provide sufficient contrast.
// *Example*
//    tinycolor.isReadable("#000", "#111") => false
tinycolor.isReadable = function(color1, color2) {
    var readability = tinycolor.readability(color1, color2);
    return readability.brightness > 125 && readability.color > 500;
};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// *Example*
//    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
tinycolor.mostReadable = function(baseColor, colorList) {
    var bestColor = null;
    var bestScore = 0;
    var bestIsReadable = false;
    for (var i=0; i < colorList.length; i++) {

        // We normalize both around the "acceptable" breaking point,
        // but rank brightness constrast higher than hue.

        var readability = tinycolor.readability(baseColor, colorList[i]);
        var readable = readability.brightness > 125 && readability.color > 500;
        var score = 3 * (readability.brightness / 125) + (readability.color / 500);

        if ((readable && ! bestIsReadable) ||
            (readable && bestIsReadable && score > bestScore) ||
            ((! readable) && (! bestIsReadable) && score > bestScore)) {
            bestIsReadable = readable;
            bestScore = score;
            bestColor = tinycolor(colorList[i]);
        }
    }
    return bestColor;
};


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
    var flipped = { };
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            flipped[o[i]] = i;
        }
    }
    return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
    a = parseFloat(a);

    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }

    return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));

    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    // Handle floating point rounding errors
    if ((math.abs(n - max) < 0.000001)) {
        return 1;
    }

    // Convert into [0, 1] range if it isn't already
    return (n % max) / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
    return mathMin(1, mathMax(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
    return c.length == 1 ? '0' + c : '' + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
    if (n <= 1) {
        n = (n * 100) + "%";
    }

    return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
    return (parseIntFromHex(h) / 255);
}

var matchers = (function() {

    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";

    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    return {
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
})();

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color == 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }

    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hex8.exec(color))) {
        return {
            a: convertHexToDecimal(match[1]),
            r: parseIntFromHex(match[2]),
            g: parseIntFromHex(match[3]),
            b: parseIntFromHex(match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? "name" : "hex"
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            format: named ? "name" : "hex"
        };
    }

    return false;
}

// Node: Export function
if (typeof module !== "undefined" && module.exports) {
    module.exports = tinycolor;
}
// AMD/requirejs: Define the module
else if (typeof define === 'function' && define.amd) {
    define(function () {return tinycolor;});
}
// Browser: Expose to window
else {
    window.tinycolor = tinycolor;
}

})();
/* ST Class Hierarchy:
   STGroupControl
      STGroup
      STLayoutTable
      STComplexControl
         STView
         STTab
         STGrid
         STTree
         STCheckboxList

   STControl
      STButton
      STStaticText
      STTitleText
      STPhoto
      STEditText
         STDate
         STPhone
         STDateTime
         STTimeOfDay
         STString
         STNumeric
         STGuid
         STSSN
         STMemo
         STHtml
      STDropDown
      STCheckbox


    Namespaces:

    ST: Global methods and properties
        ST.Actions: Triggered event actions, usually from button clicks
        ST.XMLRequest: XML Generators for server requests
*/

//$.fn.delegate = (function (origMethod) {
//    return function () {
//        return this;
//    };
//})($.fn.delegate);

//$.fn.on = (function (origMethod) {
//    return function () {
//        var args = [];

//        for (var i = 0; i < arguments.length; i++) {
//            var arg = arguments[i];
//            if ($.isFunction(arg)) {
//                args.push((function (arg) {
//                    return function (ev) {
//                        var res = arg.apply(this, arguments);
//                        if (res === false) {
//                            console.log('CANCELLED');
//                            console.log(ev.type);
//                        }
//                        else if (ev && (ev.type == 'click' || ev.type == 'focus' || ev.type == 'mousedown' || ev.type == 'mouseup')) {
//                            console.log(ev.type);
//                            console.log(arg);
//                        }

//                        return res;
//                    }
//                })(arg));
//            }
//            else {
//                args.push(arg);
//            }
//        }

//        return origMethod.apply(
//            this, args
//        );
//    };
//}) ($.fn.on);

//Alert the user that the upload worked and refreshes the parent view that
//requested the upload
function UploadSuccess(gridIDToRefresh) {
    ST.UploadSuccess(gridIDToRefresh);
} //UploadSuccess

function LogMessage(level, msg) {
    if (level >= currentLogLevel) {
        console.log(msg);
    }
}

var inErrorHandler = false;

function HandleError(ex) {
    // User-error: no need to log it
    if (typeof ex === 'string') {
    }
    else if (ex) {
        var data = {
            '@MESSAGE': ex.message || ex.description,
            'STACKTRACE': {
                'LINE': ST.EscapeXML(ex.stack).split('\n')
            }
        };

        if (!inErrorHandler) {
            inErrorHandler = true;
            ST.SendServerEvent(null, 'Rev_Log_Exception', {
                '@FOCUS_KEY': ST.RevFocusKey,
                'ERROR': data
            }).always(function() {
                inErrorHandler = false;
            });
        }

        console.error(ex);
    }
}
window.error = jQuery.error = HandleError;

function CreateSubClass(base, ctor, proto) {
    ctor.prototype = Object.create(base.prototype);
    $.extend(ctor.prototype, proto);

    return ctor;
}

function elvis_get() {
    var undef;
    var bSetIfNull = arguments[0] === true;
    var idx = bSetIfNull ? 1 : 0;

    if (bSetIfNull) {
        var res = arguments[idx++] || {};
        while (res !== undef && res !== null && idx < arguments.length) {
            var key = arguments[idx++];
            if (res[key] === undef || res === null) {
                res[key] = {};
            }

            res = res[key];
        }
    }
    else {
        var res = arguments[idx++];
        while (res !== undef && res !== null && idx < arguments.length) {
            res = res[arguments[idx++]];
        }
    }

    return res;
}

function Namespace(nsName, obj) {
    var ns = obj || window;

    try {
        var nsArr = nsName.split('.');

        while (nsArr.length > 0) {
            var name = nsArr.shift();

            ns[name] = ns[name] || {};
            ns = ns[name];
        }
    }
    catch (ex) { HandleError(ex); }

    return ns;
}

/// Initializers
$(document).ready(function () {
    // Associate this window with the root window
    ST.GetRootWindow();

    // Fix bootstrap stealing focus from overlays
    if ($.fn.modal) {
        $.fn.modal.Constructor.prototype.enforceFocus = $.noop;
    }

    // Stop animating the feedback tab on mouseover
    setTimeout(function () {
        $('#Feedback').removeClass('fade');
    }, 2000);

    // Check touch capability
    if (ST.IsMobileDevice) {
        $(document.body).addClass('touch');
    }
    else {
        $(document.body).addClass('no-touch');
    }

    // Check if we are a touch device
    if (ST.IsMobileDevice) {
        document.documentElement.className += " touch";
    }

    if ($(document.body).hasClass('SynergyPassThrough') && ST.Preferences.STColorTheme) {
        ST.Theme.ApplyColorTheme(ST.Preferences.STColorTheme);
    }

    if (document.body.getAttribute('data-theme')) {
        ST.Theme.ApplyColorTheme(document.body.getAttribute('data-theme'));
    }

    // Dim the overlay frame on mouseover titlebar
    $('#WindowInfo > div').first().hover(
        function () {
            $(window.parent.document.body).children('iframe').css('opacity', 0.2);
        },
        function () {
            $(window.parent.document.body).children('iframe').css('opacity', 1);
        }
    );

    var $view = $('#PrimaryView');
    if ($view.length && window.STView) {
        $view.addClass('REV_VIEW');
        var viewData = $view.viewData();
        if (!viewData) {
            var viewXML = $.parseXML('<REV_VIEW></REV_VIEW>').documentElement;
            viewData = new STView(viewXML, $view[0]);
            $view.data('STComplexControl', viewData);
        }
    }
});

// Restrict scroll-wheel actions to scrolling containers when the mouse is over them.
$(document).delegate('.scrolling-container', 'mouseenter mouseover mousewheel DOMMouseScroll', function (ev) {
    if (!this.scrollingInitialized) {
        this.scrollingInitialized = true;

        $(this).on('mousewheel DOMMouseScroll', function (ev) {
            if (ev.originalEvent) {
                var delta = ev.originalEvent.wheelDelta || -ev.originalEvent.detail;
                this.scrollTop += (delta < 0 ? 1 : -1) * 30;

                ev.preventDefault();
                ev.stopPropagation();
            }
        })
        .trigger(ev.type);

        return false;
    }
});

$.extend(Namespace('Enum'), {
    AddFlag: function (val, flag) {
        return (val || 0) | flag;
    },

    RemoveFlag: function (val, flag) {
        return (val || 0) & ~flag;
    },

    HasFlag: function (val, flag) {
        return !!((val || 0) & flag);
    },

    // LogLevel is used by LogMessage() to determine which messages to display.
    // the global variable currentLogLevel determines the minimum level to display
    LogLevel: {
        // Debug messages are messages to assist in developing a section or sections of code,
        // and are generally useful with assertion type logic.
        Debug: 0,

        // Info messages are similar to debug messages, except they output useful stats
        // about the current session.
        Info: 1,

        // Warn messages are errors that occur during normal program flow, but are non-critical
        Warn: 2,

        // Error messages occur when a branch of code is reached that should not be executed during
        // normal program flow.
        Error: 3,

        // Critical messages are fatal user errors or coding errors which will cause the UX to be
        // unstable.
        CriticalError: 4
    },

    UserType: {
        Staff: 0,
        Parent: 1,
        Student: 2,
        Other: 3
    },

    XmlRequestFlags: {
        IncludeScrollFields: 0x01,
        IncludeDataGroup: 0x02,
        SendComplex: 0x04,
        SendAllButGrids: 0x08,
        NoIncludeDataElements: 0x10,
        IncludeDataInElementsNode: 0x20,
        ExcludeScrollFields: 0x40,
        Remember: 0x80,
        DontSendNullIdentity: 0x100,
        IncludeGridState: 0x200,
        IncludeViewRefs: 0x400
    },

    GetElementsFlags: {
        OnlyDirty: 0x01,
        OnlyNonBlank: 0x02,
        CurrentValueOnly: 0x04,
        SendAllButGrids: 0x08,
        All: 0x10,
        IncludeViewRefs: 0x20,
        SendSimpleGrids: 0x40
    },

    FocusActiveEnum: {
        0: 'Show Active Only',
        1: 'Show Inactive Only',
        2: 'Show Active and Inactive'
    }
});
var currentLogLevel = currentLogLevel || Enum.LogLevel.Warn;

(function ($) {
    var inIframe;

    $.extend(Namespace('ST'), {
        CKConfig: {
            Default: {
                typing: {
                    transformations: {
                        include: []
                    }
                },
                toolbar: {
                    items: [
                        'heading', '|',
                        'alignment', '|',
                        'bold', 'italic', 'strikethrough', 'underline', '|',
                        'link', '|',
                        'bulletedList', 'numberedList',
                        'fontfamily', 'fontsize', 'fontColor', 'fontBackgroundColor', '|',
                        'insertTable', '|',
                        'outdent', 'indent', '|',
                        'uploadImage', 'blockQuote', '|',
                        'undo', 'redo', 'fullScreen'
                    ]
                },
                fontFamily: {
                    options: [
                        'default',
                        'Arial/Arial, Helvetica, sans-serif;',
                        'Candara/Candara, Verdana, sans-serif;',
                        'Comic Sans MS/Comic Sans MS, cursive;',
                        'Courier New/Courier New, Courier, monospace;',
                        'Georgia/Georgia, serif;',
                        'Lato Hairline/Lato Hairline, Verdana, sans-serif;',
                        'Lato Light/Lato Light, Verdana, sans-serif;',
                        'Lucida Sans Unicode/Lucida Sans Unicode, Lucida Grande, sans-serif;',
                        'Tahoma/Tahoma, Geneva, sans-serif;',
                        'Times New Roman/Times New Roman, Times, serif;',
                        'Trebuchet MS/Trebuchet MS, Helvetica, sans-serif;',
                        'Verdana/Verdana, Geneva, sans-serif'
                    ]
                },
                heading: {
                    options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' }
                    ]
                },
                image: {
                    resizeUnit: 'px',
                    styles: [
                        'alignLeft', 'alignCenter', 'alignRight'
                    ],
                    resizeOptions: [
                        {
                            name: 'resizeImage:original',
                            label: 'Original',
                            value: null
                        },
                        {
                            name: 'resizeImage:50',
                            label: '250px',
                            value: '250'
                        },
                        {
                            name: 'resizeImage:75',
                            label: '400px',
                            value: '400'
                        }
                    ],
                    toolbar: [
                        'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight',
                        '|',
                        'resizeImage',
                        '|',
                        'imageTextAlternative'
                    ]
                },
                table: {
                    contentToolbar: ['tableRow', 'tableColumn', 'mergeTableCells', 'tableCellProperties', 'tableProperties']
                },
                list: {
                    properties: {
                        styles: true,
                        startIndex: false,
                        reversed: false
                    }
                },
            }
        },

        /**
         * Returns an array of header cells in the order they are rendered
         * @param {HTMLTableElement} table
         */
        FlattenHeader: function (table) {
            const res = [];
            const processedCells = [];

            function processRow(tr, numCells) {
                if (tr) {
                    const $nextRows = $(tr).nextAll('tr').not('.FindModeRow');

                    numCells = numCells || tr.cells.length;
                    for (var c = 0; numCells && c < tr.cells.length; c++) {
                        const cell = tr.cells[c];

                        if (cell.rowSpan < $nextRows.length + 1 || cell.classList.contains('REV_SUPERTITLE')) {
                            processRow($nextRows[0], cell.colSpan);
                        }
                        else if (processedCells.indexOf(cell) === -1) {
                            numCells--;
                            processedCells.push(cell);

                            res.push(cell);
                        }
                    }
                }
            }

            $(table).children('thead')
                .children('tr')
                .not('.FindModeRow')
                .each(function () {
                    processRow(this);
                });

            return res;
        },

        PrefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        PrimaryView$: window.ko && ko.observable(),
        WithinIFrame: function () {
            if (inIframe === undefined) {
                inIframe = null;
                if (window !== window.parent && window.parent.$ && !ST.DC) {
                    inIframe = window.parent
                        .$('iframe')
                        .not('.Overlay')
                        .filter(function () { return this.contentWindow === window; })[0] || null;

                    if (inIframe) {
                        $(document.body.parentElement).addClass('within-iframe');
                    }
                }
            }

            return inIframe;
        },

        CompareWithUndef: function (a, b) {
            var a_undefined = a === undefined || isNaN(a);
            var b_undefined = b === undefined || isNaN(b);

            if (a_undefined && b_undefined) {
                return 0;
            }
            else if (a_undefined) {
                return -1;
            }
            else if (b_undefined) {
                return 1;
            }

            return (a < b) ? - 1 : (a > b) ? 1 : 0;
        }
    });

    $(document).ready(function () {
        ST.WithinIFrame();
    });
})(jQuery);

(function ($) {
    var commandLists = {};
    var deferredObjects = {};

    $.extend(Namespace('ST'), {
        QueueCallback: function (category, callback) {
            category = category || 'root';

            const bHighPriority = category[0] === '!';
            if (bHighPriority) {
                category = category.substr(1);
            }

            const commandList = commandLists[category] = commandLists[category] || [];
            deferredObjects[category] = deferredObjects[category] || $.resolve();

            if (bHighPriority) {
                commandList.splice(0, 0, callback);
            }
            else {
                commandList.push(callback);
            }

            function getNext() {
                const cmd = commandList.shift();

                if (commandList.length === 0) {
                    deferredObjects[category] = null;
                }

                return cmd && cmd();
            }

            deferredObjects[category] = deferredObjects[category].then(getNext, getNext);
        },

        QueueRequest: function (callback) {
            this.QueueCallback('ST.SendServerEvent', callback);
        }
    });
})(jQuery);

$.extend(Namespace('ST'), {
    Preferences: ST.Preferences || {},
    ServerSubscriptions: (ST.ServerSubscriptions || []),

    STYLE_CLASSES: {
        NONE: 'StyleNone',
        STYLENONE: 'StyleNone',
        STYLENOTAVAILABLE: 'StyleNotAvailable',
        STYLEDATALESSEMP: 'StyleDataLessEmp',
        STYLELESSEMPHASIS: 'StyleLessEmphasis',
        STYLEEMPHASIS: 'StyleEmphasis',
        STYLEMOREEMPHASIS: 'StyleMoreEmphasis',
        STYLEHIGHLIGHT: 'StyleHighLight',
        STYLEWHITE: 'StyleWhite',
        STYLECURRENTDATE: 'StyleCurrentDate',
        STYLEBRIGHTHIGHLIGHT: 'StyleBrightHighLight',
        STYLEBRIGHTHIGHLIGHTWITHBORDER: 'StyleBrightHighLightWithBorder',
        STYLEERROR: 'StyleError',
        STYLEWARNING: 'StyleWarning',
        STYLELIGHTBLUE: 'StyleLightBlue',
        STYLEHIDE: 'StyleHide',
        STYLECLEAR: 'StyleClear',
        STYLEGREEN: 'StyleGreen',
        STYLEGREENLIGHT: 'StyleGreenLight',
        STYLERED: 'StyleRed',
        STYLEREDLIGHT: 'StyleRedLight',
        STYLEORANGE: 'StyleOrange',
        STYLEVIOLET: 'StyleViolet',
        STYLEOVERDUE: 'StyleOverdue',
        STYLEINPROGRESS: 'StyleInProgress',
        STYLECOMPLETE: 'StyleComplete',
        STYLEGRAYLIGHT: 'StyleGrayLight',
        BORDERTHICK: 'BorderThick'
    },

    UUIDv4: function () {
        var rand = (window.crypto && crypto.getRandomValues)
            ? function (c) { return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4); }
            : function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);

                return v;
            };

        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
            return rand(c).toString(16).toUpperCase();
        });
    },

    GetQueryString: function (param) {
        const q = window.location.search.substr(1);
        const res = {};

        q.split('&')
            .forEach(pair => {
                const idx = pair.indexOf('=');
                if (idx !== -1) {
                    res[pair.substr(0, idx)] = decodeURIComponent(pair.substr(idx + 1)).replace(/\+/g, " ");
                }
            });

        return !!param ? res[param] : res;
    },

    CopyXMLNode: function (node, wnd) {
        var newNode = null;

        if (node) {
            try {
                newNode = wnd.document.importNode(node, true);
            }
            catch (err) {
                try {
                    var outerHTML = node.xml || node.outerHTML || (new XMLSerializer()).serializeToString(node);
                    if (outerHTML) {
                        newNode = wnd.$.parseXML(outerHTML).documentElement;
                    }
                }
                catch (err) {
                    newNode = node.cloneNode(true);
                }
            }
            if (newNode) {
                $.each($(node.ownerDocument.documentElement).prop("attributes"), function () {
                    newNode.setAttribute(this.name, newNode.getAttribute(this.name) || this.value);
                });

            }
        }
        return newNode;
    },

    ModifierKeyActive: function (ev) {
        var modifierKeys = (ST.Preferences.ModifierKeys || '0').split(',');
        var bActive = !!ev;

        if (ev) {
            for (var i = 0; i < modifierKeys.length; i++) {
                switch (modifierKeys[i]) {
                    case '0': // Ctrl / Meta
                        if (!(ev.ctrlKey || ev.metaKey)) {
                            bActive = false;
                        }
                        break;
                    case '1': // Shift
                        if (!ev.shiftKey) {
                            bActive = false;
                        }
                        break;
                    case '2': // Alt
                        if (!ev.altKey) {
                            bActive = false;
                        }
                        break;
                }
            }
        }

        return bActive;
    },

    GetUniqueID: function (el, prefix) {
        ST.GetUniqueID.currentID = ST.GetUniqueID.currentID || 1;
        var id = (prefix || '') + '_';

        // Get the first letter of each parent guid and concatenate it onto the id
        var parent = el;
        var parentID = '';
        while (parent) {
            if (parent.getAttribute && parent.getAttribute('data-guid')) {
                parentID = parent.getAttribute('data-guid')[0] + parentID;
            }
            parent = parent.parentNode;
        }
        id += parentID;

        var srcName = el.getAttribute('data-src-name');
        if (srcName) {
            id += '_' + srcName.substr(srcName.lastIndexOf('-') + 1);
        }
        else {
            id += '_' + (ST.GetUniqueID.currentID++);
        }

        return id;
    },

    Truncate: function (str, maxLen) {
        var res = str || '';

        if (maxLen > 3 && !!str) {
            if (str.length > maxLen) {
                res = str.substr(0, maxLen - 3) + '...';
            }
        }

        return res;
    },

    GetFeedbackLocation: function () {
        var $pv = $('#PrimaryView');
        var viewData = $pv.viewData();

        var url;

        if ($pv.hasClass('hidden') == false) {
            if (viewData) {
                return viewData.XmlNode.getAttribute('QUALIFIED_NAME');
            }
            else {
                url = $pv.children('iframe').attr('src');
            }
        }

        return (url || window.location.href).match(/[^\/]*$/)[0];
    },

    RefreshPageLayout: function (bImmediately) {
        clearTimeout(this.RefreshPagelayoutTimer);
        this.RefreshPagelayoutTimer = null;

        function refreshPageLayout() {
            var undef;

            var $ph = $('#PageHeader');
            var $ud = $('#UserDocks');

            if (ST.DocumentValidation) {
                ST.DocumentValidation.UpdateCSSRules();
            }

            if ($ph.length) {

                var offset = $('#PrimaryView .REV_BODY').offset();
                if (offset) {
                    var windowHeight = window.CurrentHeight || $(window).height();
                    var phHeight = parseFloat($ph.outerHeight());
                    var scrollTop = $(document).scrollTop();

                    var pvOffset = $('#PrimaryView').offset()
                    var topOffset = offset.top;

                    if (!window.hasBeenResized) {
                        window.hasBeenResized = true;
                        var viewData = $('#PrimaryView').data('STComplexControl');
                        if (viewData) {
                            var width = viewData.XmlNode.getAttribute('REV_WIDTH');
                            var height = viewData.XmlNode.getAttribute('REV_HEIGHT');
                            if (width && height) {
                                //V_POSITION="CENTER" H_POSITION="CENTER" 
                                height = parseInt(height);
                                window.resizeTo(width, height);
                                ST.CenterWindow();
                            }
                        }
                    }

                    if (window.memoFSRule === undef) {
                        window.memoFSRule = ST.FindCSSRule('.REV_EDIT_MULTI_LINE.fullscreen');
                    }
                    if (window.memoFSRule) {
                        window.memoFSRule.style.top = phHeight + 30 + 'px';
                    }

                    // Ensure the main page dropdowns don't extend beyond the bottom of the page
                    if (window.menuBarDropdownRule === undef) {
                        window.menuBarDropdownRule = ST.FindCSSRule('#MenuBar .nav > li > .dropdown-menu');
                        window.focusMenuDropdownRules = {
                            focusYear: ST.FindCSSRule('#WindowInfo #wiFocusYear > .dropdown-menu'),
                            params: ST.FindCSSRule('#WindowInfo #wiShowParameters > .dropdown-menu'),
                            orgName: ST.FindCSSRule('#WindowInfo #wiFocusOrgName > .dropdown-menu')
                        };
                    }

                    if (window.menuBarDropdownRule) {
                        window.menuBarDropdownRule.style.maxHeight = (windowHeight - topOffset - 25) + 'px';

                        window.focusMenuDropdownRules.focusYear.style.maxHeight = (windowHeight - topOffset - 25) + 'px';
                        window.focusMenuDropdownRules.params.style.maxHeight = (windowHeight - topOffset - 25) + 'px';
                        window.focusMenuDropdownRules.orgName.style.maxHeight = (windowHeight - topOffset - 25) + 'px';
                    }

                    // Adjust overlay locations
                    if (window.overlayRule === undef) {
                        window.overlayRule = ST.FindCSSRule('body > .Overlay');
                        window.overlayBGRule = ST.FindCSSRule('body > .Overlay-bg');
                    }

                    if (window.overlayRule) {
                        window.overlayRule.style.top = pvOffset.top + 20 + 'px';
                    }

                    if (window.overlayBGRule) {
                        window.overlayBGRule.style.top = pvOffset.top + 'px';
                    }

                    // Retain the height of the tab content area
                    if (window.tabHeightRule === undef) {
                        window.tabHeightRule = ST.FindCSSRule('.full-tab-height');
                    }

                    if (window.tabHeightRule) {
                        window.tabHeightRule.style.minHeight = (windowHeight - topOffset - $ud.outerHeight()) + 'px';
                    }

                    // Ensure the tree views do not grow beyond the viewable height
                    if (window.treeViewRule === undef) {
                        window.koTreeViewRule = ST.FindCSSRule('#PrimaryView .st-ko-tree > .panel-body > .st-tree-hierarchy');
                        window.koTreeHeadingRule = ST.FindCSSRule('#PrimaryView .st-ko-tree > .panel-heading');

                        window.treeViewRule = ST.FindCSSRule('#PrimaryView .REV_TREE:not(.hide-detail) > .panel-body > div > .non-detail-content > .tree-view');
                        window.treeHeadingRule = ST.FindCSSRule('#PrimaryView .REV_TREE:not(.hide-detail) > .panel-heading');
                    }

                    if (window.treeViewRule && window.stickySupported) {
                        window.treeHeadingRule.style.top = 0;
                        window.treeViewRule.style.top = '30px';
                        window.treeViewRule.style.maxHeight = (windowHeight - topOffset - $ud.outerHeight() - 55) + 'px';

                        window.koTreeHeadingRule.style.top = 0;
                        window.koTreeViewRule.style.top = '24px';
                        window.koTreeViewRule.style.maxHeight = (windowHeight - topOffset - $ud.outerHeight() - 55) + 'px';
                    }

                    // Adjust the max-height for all of the menus
                    if (window.menuHeightRule === undef) {
                        window.menuHeightRule = ST.FindCSSRule('#PrimaryView .REV_ACTION_AREA > .REV_MENU > .dropdown-menu');
                        window.filterHeightRule = ST.FindCSSRule('#REV_FILTERS > .dropdown-menu');
                        window.jqdropdownHeightRule = ST.FindCSSRule('#JQDropDown');
                        window.viewBodyFSRule = ST.FindCSSRule('.ViewBodyFS');
                    }

                    if (window.menuHeightRule) {
                        window.menuHeightRule.style.maxHeight = (windowHeight - topOffset - 75) + 'px';
                        window.filterHeightRule.style.maxHeight = (windowHeight - topOffset - 75) + 'px';
                        window.jqdropdownHeightRule.style.maxHeight = (windowHeight - topOffset - 75) + 'px';

                        window.viewBodyFSRule.style.maxHeight = (windowHeight - topOffset - $ud.outerHeight()) + 'px';
                        window.viewBodyFSRule.style.height = (windowHeight - topOffset - $ud.outerHeight()) + 'px';
                    }

                    // Adjust the min-width for detail views
                    if (window.detailViewRule === undef) {
                        window.detailViewRule = ST.FindCSSRule('#PrimaryView .GridData > table > tbody > tr.details > td > div > .REV_VIEW');
                    }

                    if (window.detailViewRule) {
                        window.detailViewRule.style.minWidth = ($('#PrimaryView').width() - 100) + 'px';
                    }

                    if (!window.fullScreenEditorRule) {
                        window.fullScreenEditorRule = ST.FindCSSRule('#fullscreeneditor');
                    };

                    window.fullScreenEditorRule.style.top = pvOffset.top + 'px';
                    window.fullScreenEditorRule.style.left = pvOffset.left + 'px';

                    if (ST.Grids.RefreshStickyGrids) {
                        ST.Grids.RefreshStickyGrids();
                    }
                }

                function setTabWidth(tabName, selector) {
                    var w = ST.Preferences['Width_' + tabName] || '';

                    // Only set the sizing for pinned tabs
                    var $tab = $('#' + tabName);
                    if ($tab.hasClass('pinned') == false) {
                        w = '';
                    }

                    if (selector) {
                        $(selector)
                            .css('width', w)
                            .css('min-width', w);
                    }

                    $tab.css('width', w)
                        .css('min-width', w)
                        .toggleClass('sized', !!w);
                }

                if (!ST.Preferences.AccessibilityMode) {
                    var $pm = $('#PAD_MENU');
                    var $bm = $('#Bookmarks_BM');
                    var $hm = $('#History_BM');

                    if ($pm.closest('.tab-page').hasClass('active') || bImmediately) {
                        var pmOffset = $pm.offset();
                        if (pmOffset) {
                            $pm.outerHeight(windowHeight - pmOffset.top + scrollTop - 5);
                        }
                    }
                    setTabWidth('NC_PADTree', '#NC_PADTree #PAD_MENU');

                    if ($bm.closest('.tab-page').hasClass('active') || bImmediately) {
                        var bmOffset = $bm.offset();
                        if (bmOffset) {
                            $bm.outerHeight(windowHeight - bmOffset.top + scrollTop - 5);
                        }
                    }
                    setTabWidth('NC_Bookmarks');

                    if ($hm.closest('.tab-page').hasClass('active') || bImmediately) {
                        var hmOffset = $hm.offset();
                        if (hmOffset) {
                            $hm.outerHeight(windowHeight - hmOffset.top + scrollTop - 5);
                        }
                    }
                    setTabWidth('NC_History');
                }
            }

            // Refresh the popup
            if (ST.Preferences.ShowBOInformation) {
                $(document.body).children('.popover.fade')
                    .remove();
            }

            // Refresh the position of dropdowns
            if (window.iconPicker) {
                window.iconPicker.reposition();
            }
        }

        if (bImmediately) {
            refreshPageLayout();
        }
        else {
            this.RefreshPagelayoutTimer = setTimeout(refreshPageLayout, 10);
        }
    },

    SendServerEvent: function (viewEl, eventName, requestObj, statusText, skipSendServerState, overrideViewData, skipSendPassThrough, bNoDisable) {
        var obj = requestObj;

        if (!requestObj['REV_REQUEST']) {
            // Update the focus key and impersonation
            requestObj['@FOCUS_KEY'] = requestObj['@FOCUS_KEY'] || ST.RevFocusKey;
            requestObj['@WINDOW_ID'] = window.name;
            if (ST.Impersonated) {
                requestObj['@IMPERSONATE'] = 'Y';
            }

            if (ST.GetRootTXPWindow()) {
                requestObj['@FROM_TXP'] = 'Y';
            }

            // Create the full request based on the event name
            obj = {
                'REV_REQUEST': {
                    'EVENT': {
                        '@NAME': eventName,
                        'REQUEST': requestObj
                    }
                }
            };
        }
        else {
            // Retrieve all of the events and update the focus key and impersonation
            var events = $.isArray(requestObj['REV_REQUEST']['EVENT']) ? requestObj['REV_REQUEST']['EVENT'] : [requestObj['REV_REQUEST']['EVENT']];
            for (var i = 0; i < events.length; i++) {
                var ev = events[i];
                ev['@FOCUS_KEY'] = ev['@FOCUS_KEY'] || ST.RevFocusKey;
                ev['@WINDOW_ID'] = window.name;
                if (ST.Impersonated) {
                    ev['@IMPERSONATE'] = 'Y';
                }
            }
        }

        var viewData = overrideViewData || $(viewEl || '#PrimaryView').viewData();

        // Ensure the preferences are saved
        $('.REV_VIEW').each(function () {
            var viewData = $(this).viewData();
            if (viewData && !viewData.CommittingPreferences) {
                viewData.CommittingPreferences = true;
                viewData.CommitPreferences();
                viewData.CommittingPreferences = false;
            }
        });

        if (viewData) {
            viewData.CopySessionStateToXMLObject(obj, skipSendServerState, skipSendPassThrough);
        }

        bNoDisable = bNoDisable || !viewEl;

        ST.SendServerEvent.pendingRequests = ST.SendServerEvent.pendingRequests || [];

         var $overlay = (bNoDisable) ? $() :
            ich['ST.LoadingOverlay']()
            .css({left: 0, top: 0, width: '100%', height: '100%'})
            .appendTo(viewEl);

        // Using jquery deferred promises to ensure events are submitted in order
        // This breaks RI's launched from TXP.  Since all it does is allow busy icons to work in some situations,
        // it is currently disabled.
        //ST.SendServerEvent.deferredObject = ST.SendServerEvent.deferredObject.then(function () {
        var res = ST.XMLCallWebMethod('XMLDoRequest', json2xml(obj), bNoDisable)
            .fail(function () {
                ST.SendServerEvent.deferredObject = null;
            })
            .always(function (response) {
                $overlay.remove();
                //ST.ServerEventList = ST.ServerEventList.slice(ST.ServerEventList.indexOf(callback), 1);

                if (response && response.documentElement) {
                    var parseResponse = response && response.documentElement;
                    var msg;

                    if ($(response.documentElement).find('> REV_RETURN[ERRTYPE="RevFocusException"] > ERROR').length) {
                        msg = 'Incompatible focus. Loading view at original focus.';
                    }
                    else if ($(response.documentElement).find('> REV_RETURN[ERRTYPE="HistoryEntityNotFoundException"] > ERROR').length) {
                        msg = 'Entity not found at current focus. Loading view at original focus.';
                    }

                    if (msg) {
                        if (elvis_get(obj, 'REV_REQUEST', 'EVENT', 'REQUEST', 'REV_RENDER', '@HISTORY_NAVIGATION') === 'Y'
                            || elvis_get(obj, 'REV_REQUEST', 'EVENT', 'REQUEST', 'REV_RENDER', 'VIEW', 'REV_DATA_ROOT', 'REV_DATA_REQUEST', '@HISTORY_ENTITY') === 'Y'
                            || elvis_get(obj, 'REV_REQUEST', 'EVENT', 'REQUEST', 'REV_DATA_ROOT', 'REV_DATA_REQUEST', '@HISTORY_ENTITY') === 'Y') {
                            parseResponse = false;

                            $.pnotify_notice(msg);
                        }
                    }

                    if (parseResponse) {
                        ST.ParseXML.call(viewEl || $('#PrimaryView')[0], response.documentElement);

                        if (window.viewManager) {
                            window.viewManager.parseXMLResponse(viewEl || $('#PrimaryView')[0], response.documentElement);
                        }
                    }
                }

                ST.QueueRequest(() => res);

                var idx = ST.SendServerEvent.pendingRequests.indexOf(res);
                if (idx != -1) {
                    ST.SendServerEvent.pendingRequests.splice(idx, 1);
                }
            });
        //});

        ST.SendServerEvent.pendingRequests.push(res);
        return res;
    }, //SendServerEvent

    API: async function (viewData, eventName, requestData) {
        const $overlay = !viewData ? $() :
            ich['ST.LoadingOverlay']()
                .css({ left: 0, top: 0, width: '100%', height: '100%' })
                .appendTo(viewData.DomElement);

        let $disabled = $();
        let $disabledTabs = $();

        try {
            // Temporarily disable all form elements
            if (viewData) {
                $disabled = $();
                $disabledTabs = $('#PrimaryView .REV_TAB_LABEL').not('.disabled').addClass('disabled');
                $('#imgLoading').show();
            }

            // Send the request
            const res = await fetch(`api/v1/st_web_events/${eventName}`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData || {})
            });

            // Validate the results
            if (res.ok) {
                const json = await res.json();
                if (json.error) {
                    throw json.error;
                }
                else {
                    return json.result;
                }
            }
        }
        finally {
            $overlay.remove();

            $disabled.removeAttr('disabled');
            $disabledTabs.removeClass('disabled');
            $('#imgLoading').hide();
        }
    },

    CalculateStringWidth: function (str) {
        return ST.CalculateTextWidth(str.length);
    },

    AsArray: function (obj) {
        if (obj === null || obj === undefined)
            return [];

        return $.isArray(obj) ? obj : [obj];
    },

    IsOnOrYes: function (text) {
        text = (text || '').toString().toUpperCase();
        return text == 'ON' || text == 'Y' || text == 'YES' || text == 'TRUE' || text == '1';
    },

    StripCR: function (str) {
        return (str || '').replace(/\r/g, '');
    },

    AllowedHTMLTags: ['em', 'b', 'i', 'br', 'ul', 'ol', 'li', 'font'],
    StripHTMLMarkup: function (str, bStripAll) {
        ST.StripHTMLMarkup.$html = ST.StripHTMLMarkup.$html || $('<div></div>');

        if (str) {
            str = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

            try {
                // remove script tags
                var $html = ST.StripHTMLMarkup.$html;
                $html.html(str);

                $html.fastFind('script,iframe,[onclick]').remove();
                $html.fastFind('a').filter(function () {
                    return (this.getAttribute('href') || '').indexOf('javascript:') === 0;
                }).remove();

                str = $html.html();
            }
            catch (e) {
                return '';
            }
        }

        if (bStripAll) {
            var pattern = '<[^>]*?>'; // remove all tags
            return (str || '')
                .replace(/"javascript:.*?"/igm, '')
                .replace(new RegExp(pattern, 'ig'), '');
        }
        else {
            // Generate a regex string for the allowed tags
            var allowed = '/?' + ST.AllowedHTMLTags.join('|/?');

            var pattern = '<(?!(' + allowed + '))[^>]*?>'; // remove all non-authorized tags
            var pattern2 = /<(\w+)\s+[^>]+?>(.*?)<\/\1>/ig; // remove all attributes
            return (str || '')
                .replace(/"javascript:.*?"/igm, '');
            // We can be a little more flexible with markup options
            //.replace(new RegExp(pattern, 'ig'), '')
            //.replace(pattern2, '$2');
        }
    },

    CalculateTextWidth: function (numChars) {
        if (!document.charWidth) {
            // Insert a temporary element into the document, then get the width
            var $el = $('<span class="form-control" style="display:inline-block;width:auto">X</span>').appendTo(document.body);
            document.charWidth = $el.width();
            document.inputPadding = parseInt($el.css('padding-right')) + parseInt($el.css('padding-left'));
            $el.remove();
        }

        return document.charWidth * numChars;
    },

    SizeWindowToContents: function () {
        var $body = $(document.body);
        $body.height('auto');
        $body.width('auto');
        $body.css('display', 'inline-block');
        $body.css('overflow', 'hidden');

        $body.addClass('REV_DIALOG');
        window.resizeTo($body.outerWidth() + 15, $body.outerHeight() + 75);

        ST.CenterWindow();
    },

    CenterWindow: function () {
        if (!ST.WindowCentered) {
            var left = (window.screen.availWidth - window.outerWidth);
            var top = (window.screen.availHeight - window.outerHeight);

            window.moveTo(0, 0);
            window.moveBy((left / 2), (top / 2));
            ST.WindowCentered = true;
        }
    },

    TransformImagePath: function (path) {
        var upath = path?.toUpperCase();
        if (upath
            && upath.indexOf('HTTP') !== 0
            && upath.indexOf('/') !== 0
            && upath.indexOf('DATA:IMAGE') === -1
            && upath.indexOf('PHOTOS') !== 0
            && upath.indexOf('IMAGES/') !== 0
            && upath.indexOf('GLYPH/') !== 0) {
            path = 'Images/' + path;
        }

        // Convert legacy paths to ST paths
        if (ST.Preferences.ClassicNav) {
            var re = new RegExp('images/st_', 'i');
            path = path.replace(re, 'Images/');
        }
        else if (path) {
            path = path.replace(new RegExp('Images/AURORA', 'i'), 'Images/ST_AURORA');
            path = path.replace(new RegExp('Images/GENESEA', 'i'), 'Images/ST_GENESEA');
            path = path.replace(new RegExp('Images/GENESIS', 'i'), 'Images/ST_GENESIS');
            path = path.replace(new RegExp('Images/REVELATION', 'i'), 'Images/ST_REVELATION');
        }

        return path;
    },

    IsValidImagePath: function (path) {
        return !!(path && path.indexOf('.') != -1);
    },

    SetRootWindow: function (wnd) {
        window.rootWindow = wnd;

        // move all of our windows to the root window
        if (ST.WindowList && wnd.ST && wnd.ST.WindowList) {
            wnd.ST.WindowList = $.merge(wnd.ST.WindowList, ST.WindowList);
        }

        // cancel any active timers
        if (ST.Timers) {
            for (var t in ST.Timers) {
                var timer = ST.Timers[t];
                if (timer.type == 'interval') {
                    clearInterval(timer.id);
                }
                else if (timer.type == 'timer') {
                    clearTimeout(timer.id);
                }
            }
        }

        // remove any debugging windows
        $('#SessionTimers').remove();
    },

    GetRootTXPWindow: function () {
        var undef;
        var count = 0;
        var wndDict = {};

        if (ST.rootTXPWindow === undef) {
            ST.rootTXPWindow = null;

            var wnd = window.top;
            try {
                var prevWnd = wnd;
                while (wnd.opener && wnd.opener.open && count++ < 20 && !wndDict[wnd.name]) {
                    wndDict[wnd.name] = true;

                    wnd = wnd.opener.top;
                    if (wnd.Unlock) {
                        ST.rootTXPWindow = wnd;
                    }

                    if (wnd === prevWnd) {
                        break;
                    }
                    prevWnd = wnd;
                }

                if (wnd.Unlock) {
                    ST.rootTXPWindow = wnd;
                }
            }
            catch (ex) { }
        }

        return ST.rootTXPWindow;
    },


    GetRootWindow: function () {
        var impersonated = ST.Impersonated || false;

        try {
            if (!window.rootWindow) {
                var root = window;

                if (root.parentWindow) {
                    root = root.parentWindow;
                }
                else {
                    while (root.top.opener
                        && root.top.opener != root
                        && root.top.opener.ST
                        && root.top.opener.ST.CloseChildFindWindows
                        && root.top.opener.ST.Impersonated === impersonated) {
                        root = root.top.opener;
                    }

                    while (root.parent
                        && root.parent != root
                        && root.parent.ST
                        && root.parent.ST.CloseChildFindWindows
                        && root.parent.ST.Impersonated === impersonated) {
                        root = root.parent.top;
                    }
                }

                window.rootWindow = (root.top.ST && root.top.ST.CloseChildFindWindows) ? root.top : root;
            }
        }
        catch (e) {
            window.rootWindow = root;
        }

        // Link the preferences object to the root window's preferences
        if (window.rootWindow.ST) {
            window.ST.Preferences = window.rootWindow.ST.Preferences;
        }

        return window.rootWindow;
    },

    // Bubble up to the topmost window that contains an ST object
    GetRootInstance: function () {
        return ST.GetRootWindow().ST;
    },

    GetParentWindow: function (ignoreModal) {
        var root = window;

        try {
            // See if a modal exists
            var modal;
            var nodes = document.body.childNodes;
            var len = nodes.length;
            var re = new RegExp(/\bmodal\b/);
            for (var i = 0; i < len; i++) {
                if (nodes[i].getAttribute && re.test(nodes[i].getAttribute('class'))) {
                    modal = nodes[i];
                    break;
                }
            }

            // Get the parent if no modal
            if (ignoreModal || !modal) {
                var i = 0;
                do {
                    if (root.parentWindow) {
                        root = root.parentWindow;
                    }
                    else if (root.opener && root.opener.ST) {
                        root = root.opener;
                    }
                    else if (root.parent && root.parent.ST) {
                        root = root.parent;
                    }
                } while (root !== window && root.closing && root !== ST.GetRootWindow() && i++ < 40);
            }
        }
        catch (e) { }

        return root;
    },

    GetParentInstance: function () {
        return ST.GetParentWindow().ST;
    },

    GetPassThroughXML: function () {
        var wnd = ST.GetParentWindow();
        var $view = wnd.$('#PrimaryView');
        var xml = $view.data('XMLNode');

        if (xml) {
            return xml.parentNode;
        }
    },

    SetIFramesClickable: function (bEnabled) {
        $('.REV_VIEW > iframe, body > iframe').parent().children('.overlay').remove();

        if (!bEnabled) {
            $('.REV_VIEW > iframe, body > iframe').each(function () {
                var $overlay = $('<div class="overlay" style="opacity: 0; z-index: initial" />');
                var offset = $(this).offset();

                if (offset) {
                    $overlay.css({
                        top: offset.top + 'px',
                        left: offset.left + 'px',
                        width: $(this).outerWidth() + 'px',
                        height: $(this).outerHeight() + 'px'
                    });

                    $(this).parent().append();
                }
            });
        };
    },

    _CurrentWindowID: 1,
    CloseOverlay: function () {
        function closeOverlay() {

            var wnd = ST.GetParentWindow(true);

            if (!wnd) return;

            var viewData = wnd.$('#PrimaryView').viewData();
            if (viewData) {
                viewData.RefreshUIState();
            }

            if (ST.IsOverlay(window)) {
                if (wnd !== window) {
                    $('#DocumentValidation', wnd.document).remove();
                    $(wnd.document.body, wnd.document).removeClass('Overlayed  Overlayed-detached');

                    if (wnd.ST.DocumentValidation) {
                        wnd.ST.DocumentValidation.UpdateCSSRules();
                    }

                    window.ignoreUnloadMessage = true;
                    window.location.href = 'about:blank';
                }
                else {
                    ST.CloseModal();
                }
            }
            else {
                window.ignoreUnloadMessage = true;
                ST.CloseWindow(window);
            }
        }

        var viewData = $('#PrimaryView').viewData();
        if (viewData) {
            viewData.CheckCanMove().done(closeOverlay);
        }
        else {
            closeOverlay();
        }
    },

    CloseChooserWindow: function () {
        $(document.body).removeClass('Overlayed Overlayed-detached');
        try {
            if (ST.ChooserWindow && !ST.ChooserWindow.closed) {
                ST.ChooserWindow.close();
                ST.ChooserWindow = null;
            }
        }
        catch (ex) { }
    },

    CloseSelf: function (args) {
        if (args && args.sourceWindowID !== window.name) {
            try {
                window.ignoreUnloadMessage = true;

                // FF and Chrome do not let us close user-created windows, so we settle for redirection
                window.location.replace(args.url + ((args.errId) ? '&err=' + args.errId : ''));

                window.close();
            }
            catch (ex) { }
        }
    },

    SignOut: function (errId, fromTXP) {
        // Ensure this is executed from the root instance
        if (!ST.Impersonated && window !== ST.GetRootWindow()) {
            return ST.GetRootInstance().SignOut(errId, fromTXP);
        }

        try {
            // Close all of our children
            window.ignoreUnloadMessage = true;
            ST.CloseAllWindows();

            if (ST.CurrentWebPortal === 2) {
                var url = top.window.location.href;
                if (url.toLowerCase().indexOf('survey')) {
                    ST.ShowConfirmation("Session has been lost and the page needs to be reloaded")
                        .done(function () {
                            top.window.location.reload();
                        });
                }
                else {
                    window.location.replace(url + '?logout=1');
                }
            }
            else {
                // Build the path to the login page
                var url = top.window.location.href;
                url = url.substring(0, url.lastIndexOf('/'));
                url += '/Login.aspx?logout=1';

                if (ST.Impersonated) {
                    url += '&IMPERSONATE=Y';
                }

                // Close all other root windows
                if (!ST.Impersonated) {
                    // Logout any sibling session windows, as well
                    if (ST.SyncronizeCommand) {
                        ST.SyncronizeCommand('ST.CloseSelf', {
                            sourceWindowID: window.name,
                            url: url,
                            errId: errId
                        });
                    }
                }

                var txpWindow = ST.GetRootTXPWindow();
                if (txpWindow) {
                    txpWindow.location.replace(url + ((errId) ? '&err=' + errId : ''));
                } else {
                    window.location.replace(url + ((errId) ? '&err=' + errId : ''));
                }
            }
        }
        catch (ex) { HandleError(ex); }
    },

    OpenViewInDialog: function (viewID, identity, extraData, viewData, modalOpts) {
        viewData = viewData || $('#PrimaryView').viewData();
        var xmlObj = $.extend(true, {
            'REV_RENDER': {
                'VIEW': {
                    '@GUID': viewID,
                    '@RENDER_VIEW': 'YES',
                    '@MODE': 'NORMAL',
                    '@TYPE': 'DIALOG',
                    '@MODAL': 'Y',
                    'REV_DATA_ROOT': {
                        '@ACTION': 'CURRENT',
                        '@PRIMARY_OBJECT': '',
                        'REV_DATA_REQUEST': {
                            'REV_VIEW': {
                                '@GUID': viewID
                            }
                        },
                        'IDENTITY': identity && {
                            'REV_ELEMENT': identity
                        }
                    }
                },
                'QUERY': ST.QueryNode,
                'PASS_THROUGH': viewData && {
                    '@ParentViewGU': viewData.GUID,
                    '@ParentViewClientID': viewData.DomElement.id
                }
            }
        }, extraData || {});

        return ST.OpenDialog(null, xmlObj, null, modalOpts);
    },

    OpenDialog: function ($view, xmlObj, url, modalOpts) {
        $('<div />').stModal($.extend({
            width: '800px',
            allowClose: function () {
                var res = $.resolve();
                var viewData = $(this).find('.REV_VIEW').first().viewData();

                if (viewData) {
                    if (viewData.isModalNonDismissible) {
                        res = $.reject();
                    }
                    else {
                        var autoSavePref;
                        if (viewData.GUID != ST.Query.QueryViewGUID) {
                            autoSavePref = Enum.AutosaveOpt.AlwaysPrompt;
                        }
                        res = viewData.CheckCanMove(false, autoSavePref);
                    }
                }

                return res;
            }
        }, modalOpts || {}));

        var $view = $('.modal .modal-body').last().children('div');

        var $modal = $('body > .st-modal').last();
        $modal.addClass('loading');

        var deferred = new jQuery.Deferred();

        ST.SendServerEvent($view[0], 'Rev_Get_View', xmlObj)
            .done(function (response) {
                var $inner = $view.closest('.modal-dialog');
                var viewData = $view.viewData();

                var title = $inner.fastFind('.REV_HEAD > .Title .Name').first().text();
                $inner.fastFind('.modal-title').text(title);

                $inner.fastFind('.modal-header > div')
                    .prepend(ich['ST.View.InfoMenu']($.extend(
                        viewData ? viewData.CreateInfoMenuTemplateObject() : {},
                        { ShowAdminConfig: false }
                    )));

                if (viewData) {
                    viewData.UpdateModalSize();
                }
                else {
                    var minWidth = $(response).fastFind('REV_VIEW').attr('MIN_WIDTH');
                    if (minWidth) {
                        $view.css('min-width', minWidth);
                        $inner.css('min-width', minWidth);
                    }

                    var height = $(response).fastFind('REV_VIEW').attr('REV_HEIGHT');
                    if (height) {
                        $view.children('.REV_BODY').css({
                            'height': height,
                            'overflow-y': 'auto'
                        });
                    }
                }

                if (!(modalOpts && modalOpts.fullscreen)) {
                    // Center the dialog
                    $inner.css({
                        left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
                    });

                    if ($inner.outerWidth() > $(window).width()) {
                        $inner.css({ left: 0 });
                    }

                    if ($inner.outerHeight() > $(window).height()) {
                        $inner.css({ top: 0 });
                    }
                }

                if (viewData) {
                    viewData.SetFocusToFirstField();
                }

                deferred.resolve($view);
            })
            .fail(function () {
                deferred.reject();
            })
            .always(function () {
                $modal.removeClass('loading');
            });

        return deferred.promise();
    },

    OpenInIFrame: function ($view, xmlObj, iframe) {
        if (!xmlObj['REV_REQUEST']) {
            xmlObj = {
                'REV_REQUEST': {
                    'EVENT': {
                        '@NAME': 'WDWActionEvent',
                        'REQUEST': xmlObj
                    }
                }
            };
        }

        var $body = $(document.body);
        var $form = $body.children('form').first();
        var $iframe = $(iframe);

        if (!iframe.id) {
            iframe.id = 'iframe' + ST._uniqueID++;
            iframe.name = iframe.id;
            iframe.setAttribute('name', iframe.id);

            // IE cannot handle dyamically setting name/id for an iframe, so we need to detach/reattach this iframe
            var $ph = $('<div class="hidden"></div>').insertBefore(iframe);
            $iframe.detach();
            $ph.replaceWith($iframe);
        }

        $iframe.focus();

        ST.PrepareFormForSubmit($form);
        var qstr = (ST.Impersonated) ? '?IMPERSONATE=Y' : '';
        $form.find('input[name="data"]').val(json2xml(xmlObj));
        $form.attr('action', 'ST_Content.aspx' + qstr);
        $form.attr('target', iframe.id).submit();

        return ST.OnWindowLoaded($iframe[0].contentWindow);
    },

    OnWindowLoaded: function (wnd, timeout) {
        var deferred = jQuery.Deferred();

        var onLoaded;
        var tookTooLong = setTimeout(function () {
            clearInterval(onLoaded);
            deferred.resolve();
        }, timeout || 15000);

        onLoaded = setInterval(function () {
            if (wnd.st_loaded == true) {
                clearTimeout(tookTooLong);
                clearInterval(onLoaded);
                deferred.resolve(wnd);
            }
        }, 200);

        return deferred.promise();
    },

    GetLoaderURL: function () {
        if (ST.Preferences.STColorTheme === '0') {
            if (ST.PrefersDarkMode) {
                return 'ST_Loading.html?theme=1';
            }
            else {
                return 'ST_Loading.html';
            }
        }
        else {
            return 'ST_Loading.html?theme=' + ST.Preferences.STColorTheme;
        }
    },

    OpenOverlay: function ($view, xmlObj, url) {
        if (!xmlObj['REV_REQUEST']) {
            xmlObj = {
                'REV_REQUEST': {
                    'EVENT': {
                        '@NAME': 'WDWActionEvent',
                        'REQUEST': xmlObj
                    }
                }
            };
        }

        var viewData = $view.viewData();

        if (viewData) {
            var req = xmlObj['REV_REQUEST']['EVENT']['REQUEST'];

            if (req) {
                // Always append the server state
                var ss = viewData.GetServerState();
                if (ss) {
                    req['SERVER_STATE'] = ss;
                }

                req['PASS_THROUGH'] = req['PASS_THROUGH'] || {
                    '@ParentViewGU': viewData.GUID,
                    '@ParentViewClientID': viewData.DomElement.id,
                    '@ParentTabGU': viewData.GetCurrentTabGU()
                };

                if (viewData.QueryNode) {
                    req['QUERY'] = viewData.QueryNode;
                }
            }
        }

        // hide any open dropdown lists
        $(document.body).children('.st-dropdown-list').addClass('hidden');

        var ovrName = 'Overlay' + ST.GetRootInstance()._CurrentWindowID++;
        var $body = $(document.body);
        var $form = $body.children('form');
        var $iframe = $('iframe.Overlay');

        // Ensure unload events aren't triggered when re-opening an overlay window;
        if ($iframe.length && $iframe[0].contentWindow) {
            $iframe[0].contentWindow.RefreshParentOnClose = false;
        }

        // For Chrome, overwriting the current iframe content will cause any executing scripts
        // in that iframe to freeze.
        setTimeout(function () {
            $body.addClass('Overlayed');

            // Browsers such as Firefox and IE do not allow changing iframe id/name
            // attributes when they are inside the dom, so we have to detach the
            // iframe before updating these attributes.
            var $ph = $('<div class="hidden"></div>').insertBefore($iframe);
            $iframe.detach();
            $iframe.attr('src', ST.GetLoaderURL()).attr('name', ovrName).attr('id', ovrName);
            $ph.replaceWith($iframe);

            $iframe.focus();

            ST.OnWindowLoaded($iframe[0].contentWindow)
                .done(function () {
                    $iframe.focus();

                    ST.PrepareFormForSubmit($form);

                    var qstr = (ST.Impersonated) ? '?IMPERSONATE=Y' : '';
                    $form.find('input[name="data"]').val(json2xml(xmlObj));
                    $form.attr('action', (url || 'ST_Content.aspx') + qstr);
                    $form.attr('target', ovrName)[0].submit();
                });
        }, 0);

        return $iframe[0].contentWindow;
    },

    XML_CHAR_MAP: {
        '<': '&#60;',
        '>': '&#62;',
        '&': '&#38;',
        '"': '&quot;',
        "'": '&#39;',
        '\t': '&#09;', // tab (spell checker)
        ']]>': '&#93;&#93;>'
        //'\n': '&#xA;', // merge line breaks
        //'\r': '&#xD;'
    },

    EscapeXML: function (s) {
        s = s || '';

        return ST.EscapeUnescapeXML(s, ST.XML_CHAR_MAP);
    },

    UnescapeXML: function (s) {
        s = s || '';

        // create the reverse of ST.XML_CHAR_MAP
        if (!ST.XML_CHAR_MAP_REV) {
            ST.XML_CHAR_MAP_REV = {};

            for (var key in ST.XML_CHAR_MAP) {
                var val = ST.XML_CHAR_MAP[key];

                if (val) {
                    ST.XML_CHAR_MAP_REV[val] = key;
                }
            }
        }

        return ST.EscapeUnescapeXML(s, ST.XML_CHAR_MAP_REV);
    },

    EscapeUnescapeXML: function (s, charMap) {

        var expr = Object.keys(charMap).join("|");
        var re = new RegExp('(' + expr + ')', 'g');
        return s.replace(re, function (ch) {
            return charMap[ch];
        });
    },

    RenderViewMatch: function (guid, type) {
        // Ensure this is executed from the root window
        if (ST.GetRootWindow() !== window) {
            return ST.GetRootInstance().RenderViewMatch(guid, type);
        }

        var dList = [];

        var $view = $('#PrimaryView');
        if ($view.attr('data-guid') == guid) {
            var res = ST.LoadView(type, guid);
            dList.push(res || $.resolve());
        }

        for (var i in ST.WindowList) {
            var wnd = ST.WindowList[i];
            if (wnd.$ && wnd.$('#PrimaryView').attr('data-guid') == guid) {
                if (wnd.ST) {
                    var res = wnd.ST.LoadView(type, guid, 'CURRENT_WINDOW');
                    dList.push(res || $.resolve());
                }
            }
        }

        return $.when.apply(window, dList).promise();
    },

    ClosePopups: function () {
        // Close all of the relation popups
        $('.st-relation-dropdown').each(function () {
            var input = $(this).data('input');
            if (input && input.relationSearchField) {
                input.relationSearchField.Close();
            }
        });

        $('.popover').not('.NFA-popover').remove();
    },

    LoadViewWithIdentity: function ($view, viewID, identity, tabID, moveOptions, mode, extendData, xmlOptions, focusKey) {
        /// <summary>
        /// Load a view and tab and focus to an identity.
        /// </summary>
        /// <param name="$view">The view element to assign the view to.  If null, will use the primary view</param>
        /// <param name="viewID"></param>
        /// <param name="identity"></param>
        /// <param name="tabID"></param>
        /// <param name="moveOptions"></param>
        /// <returns type="">Returns a jQuery promise which will fail if the identity cannot be loaded</returns>

        ST.ClosePopups();

        var viewData = $view.viewData();
        var deferred = new jQuery.Deferred();
        var tmpDeferred = $.resolve();
        var bDoNotClearData = (moveOptions & Enum.MoveOptions.DoNotClearData) > 0;
        var bDoNotIncludeNullIdentity = Enum.HasFlag(moveOptions, Enum.MoveOptions.bDoNotIncludeNullIdentity);

        if (viewData && !(moveOptions & Enum.MoveOptions.KeepData) && !viewData.isReloading && !bDoNotClearData) {
            var canMove = (viewData && moveOptions & Enum.MoveOptions.CheckDirty) ? viewData.CheckCanMove() : $.resolve();
            tmpDeferred = canMove.done(function () {
                viewData.ClearData();
            });
        }

        // Load the view and tab
        if (!viewData || viewData.isReloading || viewData.GUID != viewID || (focusKey && focusKey !== ST.RevFocusKey)
            && (!!identity || bDoNotIncludeNullIdentity)) {
            if (!identity && viewData && viewData.isReloading) {
                identity = viewData.GetIdentity();
            }

            var xmlObj = ST.XMLRequest.GetViewAndTab(
                $view,
                viewID,
                identity,
                tabID,
                mode,
                extendData,
                xmlOptions,
                focusKey
            );

            var dataNode = $view.data('DocValData');
            if (dataNode) {
                xmlObj['REV_DATA_ROOT'] = dataNode;
            }

            var event = 'WDWActionEvent';
            if (Enum.HasFlag(xmlOptions, Enum.XmlRequestFlags.Remember)) {
                event = 'Rev_Get_View';
            }

            var canMove = (viewData && moveOptions & Enum.MoveOptions.CheckDirty && !viewData.isReloading) ? viewData.CheckCanMove() : $.resolve();
            tmpDeferred = tmpDeferred.then(canMove)
                .then(function () {
                    if (viewData) {
                        viewData.ClearIntervals();
                    }
                    return ST.SendServerEvent($view[0], event, xmlObj);
                })
                .fail(function () {
                    deferred.reject();
                });
        }
        else {
            tmpDeferred = $.resolve();
        }

        // Load only the tab
        tmpDeferred.then(function () {
            var viewData = $view.viewData();

            if (viewData && tabID && viewData.GetCurrentTabGU() != tabID) {
                tmpDeferred = viewData.ShowTab(tabID)
            }
            else {
                tmpDeferred = $.resolve();
            }

            function setCurrent() {
                var currIdentity = viewData && viewData.GetIdentity();

                if (viewData && identity && currIdentity != identity) {
                    tmpDeferred = viewData.SetCurrent(identity);
                }
                else {
                    tmpDeferred = $.resolve();
                }

                tmpDeferred
                    .done(function (arg) {
                        deferred.resolve(arg);
                    })
                    .fail(function () {
                        LogMessage(Enum.LogLevel.Warn, 'ST.LoadViewWithIdentity(): unable to load view.');
                        deferred.reject();
                    });
            }

            // Load the current identity
            return tmpDeferred
                .done(setCurrent)
                .fail(function () {
                    if (Enum.HasFlag(moveOptions, Enum.MoveOptions.IgnoreMissingTab)) {
                        setCurrent()
                    }
                    else {
                        LogMessage(Enum.LogLevel.Warn, 'ST.LoadViewWithIdentity(): unable to load view.');
                        deferred.reject();
                    }
                });
        });

        return deferred.promise();
    },

    LoadView: function (type, id, bDetached, bNoRemember, bIncludeState, bIncludeViewNode, focusKey, extendData) {
        // unless otherwise requested, launch from the root window
        if (bDetached !== 'CURRENT_WINDOW' && ST.GetRootWindow() !== window && $('body').hasClass('ChildView') == false) {
            return ST.GetRootInstance().LoadView(type, id, bDetached, bNoRemember, bIncludeState, bIncludeViewNode, focusKey, extendData);
        }
        ST.ClosePopups();

        var bForceRemember = bNoRemember === false;
        var isNewWindow = bDetached && bDetached !== 'CURRENT_WINDOW';
        if (id) {
            var xmlObj = {
                '@FOCUS_KEY': focusKey || ST.RevFocusKey,
                'REV_RENDER': {
                    '@REMEMBER': (!bForceRemember && (isNewWindow || bNoRemember)) ? null : 'Y',
                    '@VIEW': id,
                    '@TYPE': (type || 'VIEW').toUpperCase(),
                    '@INFRAME': 'Y',
                    '@FRAME': '0',
                    '@INCLUDE_STATE': bIncludeState ? 'Y' : null,
                    'VIEW': (bIncludeViewNode !== true) ? null : {
                        '@GUID': id,
                        '@RENDER_VIEW': 'YES',
                        '@MODE': 'NORMAL'
                    }
                },
            };

            if (extendData) {
                $.extend(true, xmlObj, extendData);
            }

            var res;
            if (bDetached === true) {
                res = ST.OpenWindow({
                    'REV_REQUEST': {
                        'EVENT': {
                            '@NAME': 'Rev_Get_View',
                            'REQUEST': xmlObj
                        }
                    }
                }, null, null, null, bIncludeState);
            }
            else {
                ST.CloseChooserWindow();
                if ($('.st-modal').length) {
                    ST.CloseModal($('.st-modal'));
                }

                var $view = $('#PrimaryView');
                var viewData = $view.viewData();
                res = new jQuery.Deferred();

                var canMove = (viewData && viewData.CheckCanMove()) || $.resolve();
                canMove
                    .done(function () {
                        if (viewData) {
                            if (ST.UserDock) {
                                ST.UserDock.ClearData();
                            }

                            viewData.QueryNode = null;
                            viewData.SetServerState(null);
                        }

                        ST.SendServerEvent($('#PrimaryView')[0], 'Rev_Get_View', xmlObj, null, true)
                            .done(function () {
                                res.resolve();
                            })
                            .fail(function () {
                                LogMessage(Enum.LogLevel.Warn, 'ST.LoadView(): unable to load view.');
                                res.reject();
                            });
                    })
                    .fail(function () {
                        res.reject();
                    });
            }

            return res.promise();
        }

        return $.reject();
    },

    RefreshView: function () {
        var viewData = $('#PrimaryView').data('STComplexControl');
        if (viewData) {
            viewData.Refresh();
        }
    },

    IsModal: function (win) {
        return !!(ST.GetModal().length);
    },

    GetModal: function (win) {
        var win = win || window;
        return win.$(document.body).children('.modal').last();
    },

    IsOverlay: function (win) {
        win = win || window;

        if (win.ST && !win.ST.WithinIFrame()) {
            var winOpener = null;
            try {
                if (!win.location.pathname.toUpperCase().endsWith('ST_CONTENT.ASPX')) {
                    return false;
                }

                winOpener = win.opener;
            }
            catch (ex) { }

            return !!(!winOpener && win != win.parent && win.parent.ST);
        }
    },

    WindowList: {},

    SaveWindowList: function () {
        if (window !== ST.GetRootWindow()) {
            return ST.GetRootInstance().SaveWindowList();
        }

        var wndList = {};
        for (var i in ST.WindowList) {
            var wnd = ST.WindowList[i];

            try {
                if (wnd.name) {
                    wndList[wnd.name] = wnd.location.href;
                }
            }
            catch (ex) { }
        }

        try {
            window.localStorage['STWindows'] = JSON.stringify(wndList);
        }
        catch (ex) { }
    },

    LoadWindowList: function () {
        // Ensure we execute this at the root level
        if (window !== ST.GetRootWindow()) {
            return ST.GetRootInstance().LoadWindowList();
        }

        // Reset the stored list of windows
        ST.WindowList = {};

        // Iterate the names of the windows and try to reload them
        var wndList = JSON.parse(ST.GetRootWindow().localStorage['STWindows'] || '{}');
        for (var i in wndList) {
            var wnd = window.open('', i, '');

            // If this window does not exist
            if (wnd.location.href == 'about:blank') {
                wnd.close();
            }
            else {
                ST.WindowList[i] = wnd
            }
        }
    },

    GetCurrentWindowID: function () {
        var rootInst = ST.GetRootInstance();
        var currentWindowID = parseInt(localStorage['CurrentWindowID'] || 0);

        rootInst.currentWindowID = Math.max(rootInst.currentWindowID || 0, currentWindowID);
        rootInst.currentWindowID++;

        currentWindowID = rootInst.currentWindowID;
        localStorage['CurrentWindowID'] = currentWindowID;

        return currentWindowID;
    },

    OpenWindowURL: function (url, windowName, parameters) {
        var currentWindowID = ST.GetCurrentWindowID();

        var winName = windowName || ('NewWindow' + currentWindowID);

        // Default parameters for windows
        parameters = $.extend({
            directories: 'no',
            location: 'no',
            menubar: 'yes',
            resizable: 'yes',
            scrollbars: 'yes',
            status: 'yes',
            titlebar: 'yes',
            toolbar: 'no'
        }, parameters);

        // Create a list of strings for each parameter
        var paramPairs = [];
        for (var i in parameters) {
            paramPairs.push(i + '=' + parameters[i]);
        }

        // Setup the window and set some variables
        var defaultWinStyle = paramPairs.join(',');
        var wnd = ST.GetRootWindow().open(url, winName, defaultWinStyle);

        // Add this window to the list
        ST.GetRootInstance().WindowList[winName] = wnd;
        ST.SaveWindowList();

        // Force the window into the foreground
        setTimeout(function () {
            wnd.focus();
        }, 250);
    },

    OpenViewWindow: function (viewGU, tabGU, identity, extraParams) {
        var xmlObj = {
            'REV_REQUEST': $.extend(true, {
                'EVENT': {
                    '@NAME': 'Rev_Get_View',
                    'REQUEST': {
                        'REV_RENDER': {
                            '@FOCUS_KEY': ST.RevFocusKey,
                            'VIEW': {
                                '@GUID': viewGU,
                                '@RENDER_VIEW': 'YES',
                                '@MODE': 'NORMAL',
                                'TAB': (tabGU) ? {
                                    '@GUID': tabGU
                                } : null,
                                'REV_DATA_ROOT': !identity ? null : {
                                    '@ACTION': 'CURRENT',
                                    'REV_DATA_REQUEST': {
                                        'REV_VIEW': {
                                            '@GUID': viewGU,
                                            'REV_TAB': tabGU && {
                                                '@GUID': tabGU
                                            }
                                        }
                                    },
                                    'IDENTITY': {
                                        'REV_ELEMENT': identity
                                    }
                                },
                            }
                        }
                    }
                }
            }, extraParams)
        };

        return ST.OpenWindow(xmlObj);
    },

    OpenWindow: function (xmlObj, windowName, url, windowOptions, includeQueryNode) {
        var rootST = ST.GetRootInstance();

        // wrap our request, if necessary
        if (!xmlObj['REV_REQUEST'] && !url) {
            xmlObj = {
                'REV_REQUEST': {
                    'EVENT': {
                        '@NAME': 'WDWActionEvent',
                        'REQUEST': xmlObj
                    }
                }
            };
        }

        // Always append the server state
        if (!url) {
            var $modal = $(document.body).children('.st-modal').last();
            var $view = $('#PrimaryView');
            if ($modal.length) {
                $view = $modal.find('.REV_VIEW').first();
            }

            var viewData = $view.viewData();

            if (viewData != undefined) {
                var ss = viewData.GetServerState();
                if (ss && ss['D']) {
                    var arr = ST.AsArray(ss['D']);
                    if (arr.length) {
                        var serverState = [];
                        for (var i = 0; i < arr.length; i++) {
                            if (arr[i]['@K'] !== 'PAGING_FIND_XML') {
                                serverState.push(arr[i]);
                            }
                        }
                        if (serverState.length) {
                            xmlObj['REV_REQUEST']['EVENT']['SERVER_STATE'] = { 'D': serverState };
                        }
                    }
                }
            }

            if (viewData && viewData.QueryNode && includeQueryNode) {
                xmlObj['REV_REQUEST']['EVENT']['QUERY'] = xml2obj(viewData.QueryNode);
            }
            else if (includeQueryNode && ST.QueryState()) {
                xmlObj['REV_REQUEST']['EVENT']['QUERY'] = xml2obj(ST.QueryState());
            }

            if (viewData && viewData.isTXPView) {
                xmlObj['REV_REQUEST']['EVENT']['REQUEST']['PASS_THROUGH'] = {
                    '@ParentViewGU': viewData.GUID,
                    '@ParentViewClientID': viewData.DomElement.id,
                    '@ParentTabGU': viewData.GetCurrentTabGU(),
                    '@ParentViewName': viewData.ViewName,
                    '@FromTXPView': 'Y'
                };

                return ST.OpenOverlay($view, xmlObj);
            }
        }

        var currentWindowID = ST.GetCurrentWindowID()
        var winName = windowName || ('NewWindow' + currentWindowID);

        // Initialize the new window attributes
        var winStyle = $.extend({
            //directories: false,
            location: false,
            menubar: true,
            resizable: true,
            scrollbars: true,
            status: true,
            titlebar: true,
            toolbar: false
        }, windowOptions);

        // Ensure Edge doesn't try opening a tiny window
        if (!winStyle.width) {
            var wnd = ST.WithinIFrame() ? window.parent : window;

            var newWidth = wnd.innerWidth || $(wnd).width();
            var newHeight = wnd.innerHeight || $(wnd).height();
            if (newWidth < wnd.screen.availWidth) {
                winStyle.width = newWidth;
                winStyle.height = newHeight;
            }
            else {
                winStyle.width = 1024;
                winStyle.height = 768;
            }
        }

        var winStyles = [];
        for (var i in winStyle) {
            var val = typeof winStyle[i] !== 'boolean'
                ? winStyle[i]
                : (winStyle[i] ? '1' : '0');

            winStyles.push(i + '=' + val);
        }

        // Add this window to the list
        var wnd;
        if (rootST.WindowList[winName] && !rootST.WindowList[winName].closed) {
            wnd = rootST.WindowList[winName];
        }
        else {
            wnd = window.open(ST.GetLoaderURL(), winName, winStyles.join(','));
        }

        ST.LastOpenedWindow = wnd;
        rootST.WindowList = rootST.WindowList || {};
        rootST.WindowList[winName] = wnd;
        ST.SaveWindowList();

        setTimeout(function () {
            wnd.focus();
        }, 250);

        return ST.PostToWindow(xmlObj, wnd, url);
    },

    GetWindow: function (winName) {
        var res = window;
        var rootWindow = ST.GetRootWindow();

        if (rootWindow.ST.WindowList[winName]) {
            res = rootWindow.ST.WindowList[winName];
        }

        return res;
    },

    PostToWindow: function (xmlObj, wnd, url) {
        var deferred = new jQuery.Deferred();

        window.pendingRequest = window.pendingRequest || {};
        window.pendingRequest[wnd.name] = function () {
            delete window.pendingRequest[wnd.name];

            var $mainForm = $('#main_form');
            if ($mainForm.length == 0) {
                $mainForm = $('<form id="main_form" action="ST_Content.aspx" method="post" enctype="application/x-www-form-urlencoded"><input type="hidden" name="data" /></form>')
                    .appendTo(document.body);
            }

            ST.PrepareFormForSubmit($('#main_form'));

            $(wnd).ready(function () {
                deferred.resolve(wnd);
            });

            wnd.focus();
            url = url || 'ST_Content.aspx';
            var param = new Array();
            if (ST.Impersonated) {
                param.push('IMPERSONATE=Y');
            }
            if (xmlObj && xmlObj.REV_REQUEST && xmlObj.REV_REQUEST.NONREDIRECT) {
                param.push('NONREDIRECT=Y');
            }
            if (window.CURRENT_WEB_PORTAL) {
                param.push('PORTAL=' + window.CURRENT_WEB_PORTAL);
            }
            else if (ST.CurrentWebPortal) {
                param.push('PORTAL=' + ST.CurrentWebPortal);
            }
            if (param.length > 0) {
                url += '?' + param.join('&');
            }

            $('#main_form').attr('action', url);
            $('#main_form input[name="data"]').val(json2xml(xmlObj));
            $('#main_form')
                .attr('target', wnd.name)
                .submit();
        };

        if (wnd.ST) {
            wnd.noUnload = true;
            window.pendingRequest[wnd.name]();
            wnd.noUnload = undefined;
        }
        else {
            // IE will only fire $(wnd|wnd.document).ready()
            // We only execute this in IE because FF will skip showing the loading
            // animation and all other browsers work using the above method.
            var re = /\bTrident|MSIE|Edge\b/;
            if (re.test(window.navigator.userAgent)) {
                $(wnd).ready(function () {
                    window.pendingRequest[wnd.name]();
                });
            }
        }

        return deferred.promise();
    },

    CheckCanMove: function (wnd, autosaveOpt) {
        wnd = wnd || window;
        var res = $.resolve();

        $('.REV_VIEW', wnd.document).each(function () {
            var viewData = wnd.$(this, wnd.document).viewData();
            if (viewData) {
                res = res.then(function () {
                    return viewData.CheckCanMove(false, autosaveOpt);
                });
            }
        });

        $('iframe', wnd.document).each(function () {
            var ifWnd = this.contentWindow;
            if (ifWnd.$) {
                ifWnd.$('.REV_VIEW').each(function () {
                    var viewData = ifWnd.$(this).viewData();
                    if (viewData) {
                        res = res.then(function () {
                            return viewData.CheckCanMove(false, autosaveOpt);
                        });
                    }
                });
            }
        });

        return res;
    },

    CloseWindow: function (wnd, bCheckDirty) {
        wnd = wnd || window;
        var res = $.resolve();

        if (typeof (wnd) === 'string') {
            wnd = ST.GetRootInstance().GetWindow(wnd);
        }

        try {
            wnd.closing = false;
            if (ST.IsOverlay(wnd)) {
                ST.CloseOverlay(wnd);
            }
            else {
                if (bCheckDirty) {
                    res = ST.CheckCanMove(wnd, Enum.AutosaveOpt.AlwaysPrompt);
                }

                var iframe = wnd.ST && wnd.ST.WithinIFrame();
                var $modal = iframe && wnd.parent.$(iframe).closest('.modal');
                var bIsInModal = $modal && $modal.length > 0;

                wnd.closing = !bIsInModal;
                res = res.then(function () {
                    wnd.ignoreUnloadMessage = true;

                    // Remove this window from the list
                    try {
                        delete ST.GetRootInstance().WindowList[wnd.name];
                    }
                    catch (ex) { }
                    ST.SaveWindowList();

                    if (bIsInModal) {
                        wnd.parent.ST.CloseModal($modal);
                    }
                    else {
                        var interval = setInterval(function () {
                            if (!wnd.pendingRequest || Object.keys(wnd.pendingRequest).length === 0) {
                                if (ST.ReparentChildWindows(wnd)) {
                                    wnd.close();
                                    clearInterval(interval);
                                }
                            }
                        }, 200);
                    }
                });
            }
        }
        catch (ex) { HandleError(ex); }

        return res;
    },

    ReparentChildWindows: function (wnd) {
        var success = true;

        // Reparent all windows that have this window as a parent
        var wndList = ST.GetRootInstance().WindowList;
        if (wndList) {
            if (wnd.ST) {
                var parentWindow = wnd.ST.GetParentWindow();
                for (var w in wndList) {
                    try {
                        var pWnd = null;

                        if (wndList[w].ST) pWnd = wndList[w].ST.GetParentWindow();
                        else {
                            // Wait until the window has loaded before we update the variables
                            var isLoading = wndList[w].location.href.endsWith('.html')
                                || wndList[w].location.href.endsWith('.aspx');

                            if (wndList[w].opener === wnd && isLoading) {
                                success = false;
                            }
                        }

                        if (pWnd === wnd) {
                            wndList[w].parentWindow = parentWindow;
                        }
                    }
                    catch (ex) { }
                }
            }
        }

        return success;
    },

    ForEachWindow: function (callback, bIncludeIFrames) {
        const inst = ST.GetRootInstance();
        if (inst) {
            callback(ST.GetRootWindow());

            for (var i in inst.WindowList) {
                try {
                    callback(inst.WindowList[i]);

                    if (bIncludeIFrames && inst.WindowList[i].$) {
                        inst.WindowList[i].$('.REV_VIEW > iframe, body > iframe')
                            .each(function () {
                                callback(this.contentWindow);
                            });
                    }
                }
                catch (ex) { }
            }
        }

        if (bIncludeIFrames) {
            $('.REV_VIEW iframe, body > iframe, body .Overlay > iframe').each(function () {
                callback(this.contentWindow);
            });
        }
    },

    CloseAllWindows: function () {
        var inst = ST.GetRootInstance();
        if (inst) {
            for (var i in inst.WindowList) {
                try {
                    inst.WindowList[i].ignoreUnloadMessage = true;
                    inst.WindowList[i].close();
                }
                catch (ex) { }
            }

            inst.WindowList = {};
        }
        ST.SaveWindowList();
    },

    CenterModal: function ($modal) {
        $modal.fastFind('.modal-dialog').each(function () {
            var $inner = $(this);

            $inner.css({
                left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
            });

            var winHeight = $(window).height();
            var dlgHeight = $inner.outerHeight();
            if (winHeight > dlgHeight) {
                $modal.addClass('vcentered');
            }
        });
    },

    CloseModal: function ($modal, wndCloseDelay, animateToLocation) {
        $modal = $modal || $(document.body).children('.modal').last();
        if ($modal.length) {
            if (animateToLocation) {
                var $dlg = $modal.children('.modal-dialog');
                var $clone = $dlg
                    .clone()
                    .addClass('modal')
                    .css({
                        transition: 'all linear .5s',
                        overflow: 'hidden',
                        position: 'fixed',
                        margin: 0,
                        left: $dlg.css('left'),
                        top: $dlg.css('top'),
                        width: $dlg.width() + 'px',
                        height: $dlg.height() + 'px',
                        transform: 'scale(1,1)',
                        'transform-origin': 'top left',
                    })
                    .appendTo(document.body);

                setTimeout(function () {
                    $clone.css('transform', 'scale(0.1, 0.1)')
                        .css('left', animateToLocation.left + 'px')
                        .css('top', animateToLocation.top + 'px');
                }, 0);

                setTimeout(function () {
                    $clone.remove();
                }, 500);
            }
            $modal.modal('hide');
            window.closing = false;
        }
        else {
            var viewData = $('#PrimaryView').viewData();
            if (!viewData || viewData.isDialog) {
                window.closing = true;
                setTimeout(ST.CloseWindow, wndCloseDelay || 0);
            }
        }
    },

    ShowVerboseConfirmation: function (xmlObj) {

        function getServerStateValue(key) {
            var serverStateArr = ST.AsArray(elvis_get(xmlObj, 'STATE', 'SERVER_STATE', 'D'));
            if (serverStateArr) {
                var obj = serverStateArr.filter(function (item) { return item['@K'] === key; })[0];
                if (obj) {
                    return obj['@V'];
                }
            }
            return null;
        }

        var confirmType = getServerStateValue('__CONFIRM_TYPE__');
        var confirmMsg = getServerStateValue('__CONFIRM_MSG__');

        if (confirmType === '1' && confirmMsg) {
            return ST.ShowConfirmation(confirmMsg);
        }
        else {
            var deferred = new jQuery.Deferred();

            $('<div/>').stModal({
                width: '800px'
            });

            var $view = $('.modal .modal-body > div').last();

            ST.SendServerEvent($view[0], 'Rev_Get_View', xmlObj)
                .done(function (response) {
                    var $inner = $view.closest('.modal-dialog');

                    var title = $inner.fastFind('.REV_HEAD > .Title .Name').first().text();
                    $inner.find('.modal-title').text(title);

                    // Center the dialog
                    $inner.css({
                        left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
                    });

                    // Confirm button
                    $view.find('[data-guid="__BUTTON_CONFIRM_SAVE__"]')
                        .removeAttr('data-action')
                        .on('click', function (ev) {
                            var viewData = $view.viewData();

                            if (viewData) {
                                var inputTextCtrl = viewData.FindControls('Revelation-ButtonConfirmation-ConfirmationInput')[0];
                                if (inputTextCtrl) {
                                    var originalResponse = inputTextCtrl.GetControlValue();
                                    var formattedResponse = originalResponse.toUpperCase().trim();

                                    if (formattedResponse == "YES") {
                                        deferred.resolve();
                                        ST.CloseModal();
                                    }
                                    else if (formattedResponse == "NO") {
                                        deferred.reject();
                                        ST.CloseModal();
                                    }
                                    else {
                                        alert("'" + originalResponse + "' is not a valid response.");
                                    }
                                }
                            }
                        });


                    // Yes button
                    $view.find('[data-guid="__CONFIRM_BUTTON_YES__"]')
                        .removeAttr('data-action')
                        .on('click', function (ev) {
                            deferred.resolve();
                            ST.CloseModal();
                        });

                    // No button
                    $view.find('[data-guid="__CONFIRM_BUTTON_NO__"]')
                        .removeAttr('data-action')
                        .on('click', function (ev) {
                            deferred.reject();
                            ST.CloseModal();
                        });
                });

            return deferred.promise();
        }
    },

    ShowPrompt: function (prompt, title, icon) {
        return $().stModal({
            template: 'ST.Modal.Prompt',
            prompt: prompt,
            title: title || 'Synergy',
            icon: icon,
            confirmType: 'success',
            okayText: 'OK',
            cancelText: 'cancel'
        });
    },

    ShowMessage: function (message, title, icon, notificationType) {
        var lastActiveInput = ST.LastActiveInput;
        return $().stModal({
            template: 'ST.Modal.Message',
            message: message,
            title: title || 'Synergy',
            icon: icon,
            notificationType: notificationType
        }).done(function () {
            if (lastActiveInput && $(lastActiveInput).isInView()) {
                lastActiveInput.focus();
            }
        });
    },

    ShowConfirmation: function (message, opts) {
        return $().stModal($.extend({
            template: 'ST.Modal.Confirmation',
            title: 'Confirm',
            message: message,
            confirmType: 'success',
            okayText: 'Yes',
            cancelText: 'No'
        }, opts || {}));
    },

    ShowSaveUndoCancel: function (message) {
        return $().stModal({
            template: 'ST.Modal.SaveUndoCancel',
            message: message,
            saveText: 'Save and Continue',
            undoText: 'Undo and Continue',
            cancelText: 'Cancel'
        });
    },

    ShowProgressDialog: function (type, title, bUseExisting) {
        var $dialog = !bUseExisting ? $() : $(document.body)
            .fastFind('.modal-progress[progress-type="' + type + '"]')
            .closest('.st-modal');

        if ($dialog.length) {
            $dialog.fastFind('.modal-title').html(title);
        }
        else {
            $().stModal({
                template: 'ST.Modal.Progress',
                allowClose: false,
                title: title || '',
                vCenter: true
            });

            $dialog = $('.st-modal').last();
            $dialog.find('.modal-progress').attr('progress-type', type);

            $dialog.data('startTime', new Date());
        }

        return $dialog;
    },

    CloseProgressDialog: function($dialog, minTime, animateToLocation) {
        if ($dialog && $dialog.length) {
            minTime = minTime || 1000;
            var startTime = $dialog.data('startTime') || 0;
            var interval = Math.max(minTime - (new Date() - startTime), 0);
            if (interval > 0) {
                setTimeout(function () {
                    ST.CloseModal($dialog, 0, animateToLocation);
                }, interval);
            }
            else {
                ST.CloseModal($dialog, 0, animateToLocation);
            }
        }
    },

    UploadSuccess: function (gridIDToRefresh) {
        if (gridIDToRefresh) {
            console.error('Unimplemented: Grid Refreshing');
        }
        else {
            //Locate and refresh the requesting view
            console.error('Unimplemented: View Refreshing');
        }

        // TODO: Relay the result to the parent window/view

        //Close the upload window
        ST.CloseOverlay();
    },

    SetPreference: function (pref, value) {
        if (value === true || value === false) {
            value = (value) ? 'Y' : 'N';
        }
        else if (value !== 0 && !value) {
            value = '';
        }

        return ST.SendServerEvent(null, 'Rev_Set_Preferences', {
            'PREFERENCE': {
                '@NAME': pref,
                '#cdata': value
            }
        });
    },

    SetPreferences: function (prefMap) {
        var prefs = [];

        for (var i in prefMap) {
            prefs.push({
                '@NAME': i,
                '#cdata': prefMap[i]
            });
        }

        return ST.SendServerEvent(null, 'Rev_Set_Preferences', {
            'PREFERENCE': prefs
        });
    },

    RefreshIFrames: function () {
        setTimeout(function () {
            $('iframe:visible')
                .not('.cke_wysiwyg_frame')
                .filter(function () {
                    return !!this.getAttribute('src');
                })
                .each(function () {
                    var wnd = this.contentWindow;
                    if (wnd && wnd != window && wnd.location.href !== 'about:blank' && wnd.document.readyState === 'complete') {
                        var viewData = $(this).viewData();

                        if (wnd.OnSynergyFocusChanged) {
                            wnd.OnSynergyFocusChanged(ST.RevFocusKey);
                        }
                        else if (viewData && $(this).parent().hasThisClass('REV_VIEW')) {
                            viewData.Refresh();
                        }
                        else {
                            wnd.ignoreUnloadMessage = true;
                            wnd.location = wnd.location.href;
                        }
                    }
                });
        }, 0);
    },

    EmptyElement: function (el) {
        var lastChild;
        while (lastChild = el.lastChild) {
            el.removeChild(lastChild);
        }
    },

    UpdateYearType: function () {
        $(document.body).removeClass('PriorYear FutureYear');
        switch (ST.RevYearType) {
            case 'PREV':
                $(document.body).addClass('PriorYear');
                break;
            case 'NEXT':
                $(document.body).addClass('FutureYear');
                break;
        }

        ST.RefreshIFrames();
    },

    FocusKeyDict: {},

    GetFocusKey: function (orgYearGU, orgGU, yearGU) {
        var res = new jQuery.Deferred();
        var focusKey;
        if (orgYearGU || orgGU || yearGU) {
            var dictKey = orgYearGU + '_' + orgGU + '_' + yearGU;
            focusKey = ST.FocusKeyDict[dictKey];
            if (focusKey) {
                res.resolve(focusKey);
            }
            else {
                if (!orgYearGU) {
                    orgGU = orgGU || ST.FocusOrgGU;
                    yearGU = yearGU || ST.FocusYearGU;
                }

                ST.SendServerEvent(null, 'Rev_Get_FocusKey', {
                        '@OrgYearGU': orgYearGU,
                        '@OrgGU': orgGU,
                        '@YearGU': yearGU,
                        '@ShowInactive': 'ActiveAndInactive',
                        '@DontUpdateCurrentFocus': 'Y'
                    })
                    .done(function (node) {
                        focusKey = node
                            && node.documentElement
                            && node.documentElement.getAttribute('FOCUS_KEY');
                        ST.FocusKeyDict[dictKey] = focusKey;
                        res.resolve(focusKey);
                    });
            }
        }
        else {
            res.resolve();
        }
        return res.promise();
    },

    PrepareFormForSubmit: function ($form) {
        var $inputs = $($form.data('SpecialParams'));
        $inputs.remove();

        var inputs = [];
        for (var i in ST.SpecialParameters) {
            var parm = ST.SpecialParameters[i];
            inputs.push(
                $('<input type="hidden" />')
                    .attr('name', parm.name)
                    .attr('value', parm.value)[0]
            );
        }
        ST.SpecialParameters = [];

        $form.append(inputs);
        $form.data('SpecialParams', inputs)
    },

    _uniqueID: (new Date()).getTime(),
    PostFormToWeb: function (form, eventName, xmlObj, $view) {
        /// <summary>
        /// Perform a request to the server using a form/post and pass the result back through
        /// the xml parsers
        /// </summary>
        /// <param name="form"></param>
        /// <param name="xmlObj"></param>
        /// <returns type="">A deferred promise</returns>
        var deferred = new jQuery.Deferred();

        let param = [];
        if (window.CURRENT_WEB_PORTAL) {
            param.push('PORTAL=' + window.CURRENT_WEB_PORTAL);
        }
        else if (ST.CurrentWebPortal) {
            param.push('PORTAL=' + ST.CurrentWebPortal);
        }
        if (ST.Impersonated) {
            param.push('IMPERSONATE=Y');
        }

        var qstr = '?' + param.join('&');
        form.setAttribute('ACTION', 'ST_UploadFile.aspx' + qstr);
        form.setAttribute('METHOD', 'POST');

        var id = 'form' + ST._uniqueID++;
        form.setAttribute('target', id);
        var frameHTML = '<iframe name="' + id + '" id="' + id + '" width="0" height="0" frameborder="0" src="' + ST.GetLoaderURL() + '" style="position:absolute;visibility: hidden; left:-100px"></iframe>';
        var $iframe = $(frameHTML).appendTo(document.body);

        if (!xmlObj['REV_REQUEST']) {
            xmlObj = {
                'REV_REQUEST': {
                    'EVENT': {
                        '@NAME': eventName,
                        'REQUEST': xmlObj
                    }
                }
            };
        }

        var viewData = $(form).viewData();

        if (viewData) {
            viewData.CopySessionStateToXMLObject(xmlObj);
        }

        // Get or create the xml input element
        var xml = $(form).find('input[name="data"]')[0] ||
             $(form).find('input[name="xml"]')[0] ||
             $('<input type="hidden" name="xml" />').appendTo(form)[0];
        xml.value = json2xml(xmlObj);

        // Initialize the response event
        var wnd = window;

        function initIFrame() {
            $iframe.on('load', function () {
                var inst = this;

                var el = inst.contentWindow &&
                    inst.contentWindow.document &&
                    inst.contentWindow.document.documentElement;

                if (!el) {
                    LogMessage(Enum.LogLevel.CriticalError, 'ST.PostFormToWeb(): iframe window not found.');
                    deferred.reject();
                }
                else {
                    deferred.resolve(el);
                }

                $view = $view || wnd.$(
                    wnd.$(form, wnd.document).closestView()[0] ||
                    wnd.$('#PrimaryView', wnd.document)[0]
                );

                // Call the xml parsers
                try {
                    $(form).find('input[type="file"]').val('');

                    var outerHTML = el.outerHTML || (new XMLSerializer()).serializeToString(el);
                    wnd.ST.ParseXML.call($view[0], wnd.$.parseXML(outerHTML).documentElement);

                    if (wnd.viewManager) {
                        wnd.viewManager.parseXMLResponse($view[0], wnd.$.parseXML(outerHTML).documentElement);
                    }
                }
                catch (ex) { }

                $iframe.remove();
            });

            form.submit();
        }

        // Chrome triggers the onload event for the placeholder html page,
        // so we must wait for it to load before submitting the form.
        var interval = setInterval(function () {
            var wnd = $iframe[0].contentWindow;
            if (wnd && wnd.st_loaded) {
                initIFrame();
                clearInterval(interval);
            }
        }, 200);

        return deferred.promise();
    },

    WebMethodLatency: ST.WebMethodLatency || 0,
    SpecialParameters: [],
    AjaxDefaults: {},
    XMLCallWebMethod: function (webMethod, xml, bNoDisable) {
        var latencyDeferred = new jQuery.Deferred();

        var data = { xml: xml };
        for (var i in ST.SpecialParameters) {
            var parm = ST.SpecialParameters[i];
            data[parm.name] = parm.value;
        }
        ST.SpecialParameters = [];

        var params = [];

        if (ST.Impersonated) {
            params.push('IMPERSONATE=Y');
        }

        if (window.CURRENT_WEB_PORTAL !== undefined) {
            params.push('PORTAL=' + window.CURRENT_WEB_PORTAL);
        }
        else if (ST.CurrentWebPortal !== undefined) {
            params.push('PORTAL=' + ST.CurrentWebPortal);
        }

        var qstr = '?' + params.join('&');

        var url = 'Service/RTCommunication.asmx/' + webMethod + qstr;

        if (window.applicationRoot) {
            url = location.origin + applicationRoot + url;
        }

        var opts = $.extend({}, ST.AjaxDefaults, {
            type: 'POST',
            dataType: 'xml',
            beforeSend: function (request) {
                request.setRequestHeader("CURRENT_WEB_PORTAL", window.CURRENT_WEB_PORTAL);
            },
            url: url,
            data: data,
            fail: function (response) {
                if (!response.documentElement) {
                    if (!response.d || false == $.isArray(response.d)) {
                        response.d = [{
                            ID: 'unkerr0',
                            Message: 'Unknown Error',
                            stack: [response.responseText]
                        }];
                    }
                }
                // TODO: Handle web errors
            }
        });

        function callWebMethod() {
            $.ajax(opts)
                .done(function (response) {
                    if (response.d) {
                        if (response.d.Errors && response.d.Errors.length > 0) {
                            latencyDeferred.reject({
                                d: response.d.Errors
                            });
                        }
                        else {
                            var res = {
                                d: (response.d.Response || [])
                            };
                            latencyDeferred.resolve(res);
                        }
                    }
                    else {
                        var errCount = $(response.documentElement).find('REV_DATA_ROOT[CANCEL_TYPE],> REV_RETURN > ERROR, > REV_RETURN > Error, > REV_RESPONSE > Error, > Error').length;
                        if (errCount) {
                            window.closing = false;
                            latencyDeferred.reject(response);
                        }
                        else {
                            if (response.documentElement.nodeName === 'JSON_RESPONSE') {
                                var cdata = elvis_get(response.documentElement, 'childNodes', 0, 'textContent');
                                latencyDeferred.resolve(cdata && JSON.parse(cdata));
                            }
                            else {
                                latencyDeferred.resolve(response);
                            }
                        }
                    }
                })
                .fail(function (response, textStatus, errorThrown) {
                    if (response.d && response.d.Errors) {
                        latencyDeferred.reject({
                            d: response.d.Errors
                        });
                    }
                    else {
                        latencyDeferred.reject(response, textStatus, errorThrown);

                        if (response.status) {
                            var msg = response.status + ' - ' + response.statusText;
                            if (ST.ShowRequestErrors) {
                                ST.ShowMessage('<b>Request Failed</b>: ' + msg);
                            }
                            else {
                                console.error('Request Failed: ' + msg);
                            }
                        }
                    }
                });
        }

        // Mimic latency
        if (ST.WebMethodLatency && opts.async !== false) {
            $().wait($.isFunction(ST.WebMethodLatency) ? ST.WebMethodLatency() : (ST.WebMethodLatency || 100))
                .done(callWebMethod);
        }
        else {
            callWebMethod();
        }

        // Temporarily disable all form elements
        if (!bNoDisable) {
            // This feature has been disabled because IE slows to a crawl when selectors return more than
            // about 100 items.  Since we use an overlay, this should not be needed, anyway.
            // $('#PrimaryView :input').filter(':visible').not('[disabled]').attr('disabled', 'disabled');
            var $disabled = $();
            var $disabledTabs = $('#PrimaryView .REV_TAB_LABEL').not('.disabled').addClass('disabled');
        }

        // Ensure this is appended to the end of the chain
        setTimeout(function () {
            if (!bNoDisable) {
                $('#imgLoading').show();
            }

            latencyDeferred.always(function () {
                $('#imgLoading').hide();
                if (!bNoDisable) {
                    $disabled.removeAttr('disabled');
                    $disabledTabs.removeClass('disabled');
                }
            })
        }, 0);

        // Process return results
        return latencyDeferred.promise()
            .done(function (response) {
                //TODO: Log Message
            })
            .fail(function (response) {
                if (opts.fail) {
                    opts.fail(response);
                }
            });
    },

    CallWebMethod: function (options) {
        var latencyDeferred = new jQuery.Deferred();

        var opts = $.extend({
            type: 'POST',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            fail: function (response) {
                if (!response.d || false == $.isArray(response.d)) {
                    response.d = [{
                        ID: 'unkerr0',
                        Message: 'Unknown Error',
                        stack: [response.responseText]
                    }];
                }

                // TODO: Handle web errors
            }
        }, options);

        // Mimic latency
        var jqXHR;
        $().wait($.isFunction(ST.WebMethodLatency) ? ST.WebMethodLatency() : (ST.WebMethodLatency || 100))
        .done(function () {
            jqXHR = $.ajax(opts)
                .done(function (response) {
                    if (response.d) {
                        if (response.d.Errors && response.d.Errors.length > 0) {
                            latencyDeferred.reject({
                                d: response.d.Errors
                            });
                        }
                        else {
                            var res = {
                                d: (response.d.Response || response.d || [])
                            };
                            latencyDeferred.resolve(res);
                        }
                    }
                    else {
                        latencyDeferred.resolve(response);
                    }
                })
                .fail(function (response) {
                    if (response.d && response.d.Errors) {
                        latencyDeferred.reject({
                            d: response.d.Errors
                        });
                    }
                    else {
                        latencyDeferred.reject(response);
                    }
                })
        });

        // Process return results
        return $.extend(latencyDeferred.promise(), {
            xhr: function () {
                return jqXHR;
            }
        })
        .done(function (response) {
            //TODO: Log Message
        })
        .fail(function (response) {
            if (opts.fail) {
                opts.fail(response);
            }
        })
        .always(function () {
        });
    },

    KeyCodes: {
        F5: 116,
        BACKSPACE: 8,
        SPACE: 32,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        ESCAPE: 27,
        SPACE: 32,
        PGUP: 33,
        PGDN: 34,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        DELETE: 46,
        COMMA: 188,
        SEMICOLON: 186,
        ';': 59,
        ',': 44,
        A: 65,
        a: 65,
        F: 70,
        f: 70,
        N: 78,
        n: 78,
        R: 82,
        r: 82,
        S: 83,
        s: 83,
        Y: 89,
        y: 89,
        Z: 90,
        z: 90
    }
});

///
/// XML Parsers
///
(function ($) {
    var xmlHandlers = {};

    $.extend(Namespace('ST'), {
        ///
        /// Registers a parser for a node name.
        ///
        /// nodeName: The name of the node to parse
        /// parentNodeNames: An array of parent nodes to which this is a child.  An empty array or null indicates an open hierarchy
        /// parser: A method which accepts the node as the argument and returns a created html object or null.  (this) points to the parent element.
        ///
        XMLSelectParsers: [],
        XMLParsers: [],
        RegisterXMLParser: function (xPath, parser) {
            try {
                // if xpath is an array, it is assumed to be an array of regex patterns
                if ($.isArray(xPath)) {
                    for (var i = 0; i < xPath.length; i++) {
                        ST.XMLParsers.push({
                            regex: new RegExp('^' + xPath[i] + '$'),
                            xPath: xPath[i],
                            handler: parser
                        })
                    }
                }
                // passing in an object should be the preferred method
                else if ($.isPlainObject(xPath)) {
                    // Note that while selectors are faster than regular expressions,
                    // they are not executed in any guaranteed order
                    if (xPath.selector) {
                        ST.XMLSelectParsers.push({
                            selector: xPath.selector,
                            handler: parser
                        });
                    }
                    if (xPath.regex) {
                        ST.XMLParsers.push({
                            regex: new RegExp('^' + xPath.regex + '$'),
                            xPath: xPath.regex,
                            handler: parser
                        });
                    }
                }
                else {
                    ST.XMLParsers.push({
                        regex: new RegExp('^' + xPath + '$'),
                        xPath: xPath,
                        handler: parser
                    });
                }
            }
            catch (ex) { HandleError(ex); }
        }, // RegisterXMLParser

        ///
        /// Validate that a parser is defined and valid for the given node, then return the html object for that parser.
        ///
        ParseXML: function (node) {
            var name = node.nodeName;
            var parserMethod = null;

            try {
                // parse the selectors, first
                var el = this;
                for (var i = 0; i < ST.XMLSelectParsers.length; i++) {
                    var xmlParser = ST.XMLSelectParsers[i];
                    if (xmlParser.selector) {
                        var $node = $(node).fastFind(xmlParser.selector);
                        if ($node.length > 0) {
                            $node.each(function () {
                                parserMethod = xmlParser.handler;
                                parserMethod.call(el, this);
                            });
                        }
                    }
                }

                // resolve the hierarchy path to the current node
                var path = '';
                var parentNode = node;
                while (parentNode && parentNode.nodeName) {
                    path = '/' + parentNode.nodeName + path;
                    parentNode = parentNode.parentNode;
                }

                if (!xmlHandlers[path]) {
                    xmlHandlers[path] = [];

                    // iterate all parsers for any that match this node
                    var numParsers = ST.XMLParsers.length;
                    for (var i = 0; i < numParsers; i++) {
                        var xmlParser = ST.XMLParsers[i];
                        var regex = xmlParser.regex;

                        if (regex.test(path)) {
                            xmlHandlers[path].push(xmlParser.handler);
                        }
                    }
                }

                for (var i = 0; i < xmlHandlers[path].length; i++) {
                    xmlHandlers[path][i].call(this, node);
                }

                if (xmlHandlers[path].length === 0) {
                    console.error('ST.ParseXML: Undefined path - ' + path);
                }
            }
            catch (ex) { HandleError(ex); }

            return this;
        },

        ParseXMLAttributes: function (node) {
            var inst = this;

            if (this.XMLAttributes) {
                var len = node.attributes.length;
                for (var i = 0; i < len; i++) {
                    var attr = node.attributes[i];
                    if (this.XMLAttributes[attr.name]) {
                        this.XMLAttributes[attr.name](node, attr.value);
                    }
                    else {
                        console.error('Missing handler for attribute: ' + node.nodeName + '[' + attr.name + ']');
                    }
                }
            }
        },

        // Iterate and parse all of the children for an element
        XMLParseChildren: function (el, node) {
            var parseXML = ST.ParseXML.bind(el);

            Array.from(node.childNodes)
                .filter(n => n.nodeType === 1)
                .forEach(n => {
                    let res = parseXML(n);
                });

            return el;
        },

        InitScrollEventDelegate: function (fn, scrollingContainer) {
            var scrollID = 'scrollEvent_' + ST.UUIDv4()
            if (scrollingContainer) {
                $(scrollingContainer).scroll(fn);
            }
            else {
                $(document).delegate('#PrimaryView .REV_BODY', 'mouseenter', function (ev) {
                    if (!this[scrollID]) {
                        this[scrollID] = true;
                        $(this).scroll(fn);
                    }
                });
            }
        }
    });
})(jQuery);

(function ($) {
    var templates = {};

    $.extend(Namespace('ST'), {
        LoadTemplates: function () {
            var deferred = new jQuery.Deferred();

            if (window.ich) {
                var res = ST.LoadTemplate("Templates/ST_Templates.html");

                if (ST.Templates) {
                    for (var i = 0; i < ST.Templates.length; i++) {
                        res = res.then(ST.LoadTemplate(ST.Templates[i]));
                    }
                }

                res.done(function () {
                    setTimeout(function () {
                        deferred.resolve();
                    }, 200);
                })
                .fail(function () {
                    deferred.reject();
                });
            }
            else {
                deferred.reject();
            }

            return deferred.promise();
        },

        LoadTemplate: function (path, synchronous) {
            templates[path] = templates[path] ||
                $.ajax({
                    cache: true,
                    url: path + '?' + ST.ResourceCacheString,
                    async: !synchronous
                })
                .done(function (e) {
                    $("<div></div>")
                        .html(e)
                        .find("script")
                        .each(function () {
                            if (!ich[this.id]) {
                                ich.addTemplate(this.id, this.innerHTML);
                                const origICH = ich[this.id];

                                if (window.ko && this.id.indexOf('KO.Component.') === 0) {
                                    if (ko.components.isRegistered(this.id) == false) {
                                        ko.components.register(this.id, {
                                            template: this.innerHTML
                                        });
                                    }

                                    const id = this.id;
                                    ich[this.id] = function (data, el) {
                                        var bindings = 'component: { name: "' + id + '", params: $data }';

                                        ko.unapplyBindings($(el));

                                        $(el).attr('data-bind', bindings);
                                        ko.applyBindings(data || {}, el);

                                        return $(el);
                                    };
                                }
                                else if (window.ko && this.id.indexOf('KO.') === 0) {
                                    $(document.body).append(this);

                                    ich[this.id] = function ($parent, data, extraBindings) {
                                        const $el = $('<div></div>')
                                            .append(origICH(data))
                                            .attr('data-bind', extraBindings || '')
                                            .appendTo($parent);

                                        ko.applyBindings(data || {}, $el[0]);

                                        if ($.isFunction(data.load)) {
                                            data.load($el);
                                        }

                                        return $el;
                                    };
                                }
                            }
                        })
                });

            return templates[path];
        }
    });
})(jQuery);

(function ($) {
    var serverState;
    var queryState;

    $.extend(Namespace('ST'), {
        ServerState: function (node) {
            if (arguments.length === 0) {
                return serverState;
            }

            serverState = node;
        },

        QueryState: function (node) {
            if (arguments.length === 0) {
                return queryState;
            }

            queryState = node;
        }
    });
})(jQuery);

///
/// Master Page Actions
///
$.extend(Namespace('ST.Actions'), {
    EatClick: function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    },

    StopPropagation: function (ev) {
        ev.stopPropagation();
    },

    PreventDefault: function (ev) {
        ev.preventDefault();
    },

    CloseWindow: function (ev) {
        var $view = $(this).closest('.REV_VIEW');
        if ($view.length === 0) {
            $view = $('#PrimaryView').first();
        }
        var viewData = $view.viewData();
        if (viewData) {
            viewData.CheckCanMove().done(function () {
                viewData.Close();
            });
        }
        else {
            if (ST.IsModal()) {
                ST.CloseModal(ST.GetModal());
            }
            else if (ST.IsOverlay()) {
                ST.CloseOverlay();
            }
            else {
                ST.CloseWindow();
            }
        }
    },

    SignOut: function (ev) {
        var canMove = $.resolve();

        var viewData = $('#PrimaryView').data('STComplexControl');
        if (viewData) {
            canMove = viewData.CheckCanMove(true);
        }

        function signOut() {
            var rootST = ST.GetRootInstance();
            var childWindowResults = [];
            var childWindowError = '';

            // Check if any child windows have pending changes
            for (var i in rootST.WindowList) {
                var wnd = rootST.WindowList[i];
                try // Ignore access errors
                {
                    if (wnd !== window && wnd.$) {
                        wnd.$('.REV_VIEW').each(function () {
                            var viewData = wnd.$(this).data('STComplexControl');
                            if (viewData) {
                                var deferred = viewData.CheckCanMove(true).fail(function() {
                                    childWindowError = "There are still one or more views with pending changes.  Are you sure you wish to continue";
                                });

                                childWindowResults.push(deferred);
                            }
                        });
                    }
                }
                catch (ex) { }
            }

            $.when(childWindowResults)
            .done(function () {
                if (childWindowError) {
                    ST.ShowConfirmation(childWindowError)
                    .done(function() {
                        ST.SignOut();
                    });
                }
                else {
                    ST.SignOut();
                }
            });
        }

        // Check if the current window has any pending changes
        canMove.done(signOut)
        .fail(function () {
            ST.ShowConfirmation("You are about to leave without saving changes.  Are you sure you wish to continue?")
            .done(signOut);
        });

        ev.preventDefault();
    },

    LoadHomeView: function (ev) {
        return ST.LoadView(ST.HomeViewType, ST.HomeViewGUID);
    },

    ViewAppInfo: function (ev) {
        $().stModal({
            template: 'ST.Modal.AppInfo',
                AppInfo: ST.AppInformation,
            CurrYear: new Date().getFullYear()
        });
    },

    ToggleExceptionDetails: function (ev) {
        var $details = $(this).siblings('.details');
        var $icon = $(this).children('span');

        $details.toggleClass('active');
        if ($details.hasClass('active')) {
            $icon.removeClass('glyphicon-chevron-down');
            $icon.addClass('glyphicon-chevron-up');
        }
        else {
            $icon.addClass('glyphicon-chevron-down');
            $icon.removeClass('glyphicon-chevron-up');
        }
    },

    ShowExceptionPane: function (ev) {
        $(this).parent()
            .addClass('active')
            .siblings()
            .removeClass('active');
    },

    OpenDialogFromCloudIcon: function(ev) {
        var viewID = $(this).attr('data-view-id');
        var $view = $(this).closestView();
        var viewData = $view.viewData();

        viewData.CheckCanMove(false, Enum.AutosaveOpt.NoAutosave)
            .done(function () { ST.Actions.OpenDialog($view, viewID); });
    },

    OpenDialog: function ($view, viewID, extendData) {
        
        var viewData = $view.viewData();

        if (viewID && viewData) {
            var xmlObj = {
                'REV_RENDER': {
                    'VIEW': {
                        '@GUID': viewID,
                        '@RENDER_VIEW': 'YES',
                        '@MODE': 'NORMAL',
                        '@TYPE': 'DIALOG',
                        '@MODAL': 'Y',
                        'REV_DATA_ROOT': {
                            '@ACTION': 'CURRENT',
                            '@PRIMARY_OBJECT': '',
                            'REV_DATA_REQUEST': {
                                'REV_VIEW': {
                                    '@GUID': viewID
                                }
                            }
                        }
                    },
                    'REV_DATA_GROUP': {
                        'REV_ELEMENT': viewData && viewData.GetDataGroupElements()
                    },
                    'QUERY': viewData.QueryNode
                }
            };

            if (extendData) {
                $.extend(true, xmlObj, extendData);
            }

            return ST.OpenDialog($view, xmlObj);
        }

        return $.resolve();
    },
});

(function ($) {
    let cssRules = null;

    function initRulesDictionary() {
        if (!cssRules) {
            cssRules = {};

            for (let ss in document.styleSheets) {
                const sheet = document.styleSheets[ss];
                const rules = sheet.cssRules || sheet.rules;
                for (let css in rules) {
                    const cssRule = rules[css];
                    const selectorText = cssRule.selectorText;
                    if (selectorText && !cssRules[selectorText]) {
                        cssRules[selectorText] = cssRule;

                        const parts = selectorText.split(',');
                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i].trim();

                            const normalizedSelector = normalizeSelector(part);
                            cssRules[normalizedSelector] = cssRules[normalizedSelector] || cssRule;
                        }
                    }
                }
            }
        }

        clearTimeout(initRulesDictionary.timer);
        initRulesDictionary.timer = setTimeout(function () {
            cssRules = null;
        }, 3000);
    }

    function normalizeSelector(selector) {
        const res = [];

        var parts = selector.split(' ');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i]
                .split('.')
                .join(' .')
                .split('#')
                .join(' #')
                .split(' ')
                .sort(function (a, b) {
                    return a.substr(1).localeCompare(b.substr(1));
                })
                .join('');

            if (part) {
                res.push(part);
            }
        }

        return res.join(' ');
    }

    let $styleSheet;
    $.extend(Namespace('ST'), {
        FindCSSRule: function (selector) {
            function addCSSRule(sheet, selector, rules, index) {
                if (sheet.insertRule) {
                    sheet.insertRule(selector + "{" + rules + "}", index);
                }
                else if (sheet.addRule) {
                    sheet.addRule(selector, rules, index);
                }

                cssRules[normalizeSelector(selector)] = (sheet.cssRules || sheet.rules)[0];
            }

            initRulesDictionary();
            const normalizedSelector = normalizeSelector(selector);
            if (cssRules[normalizedSelector]) {
                return cssRules[normalizedSelector];
            }

            // Rule not found, so create one
            $styleSheet = $styleSheet || $('<style></style>').appendTo(document.head);
            const sheet = $styleSheet[0].sheet;

            addCSSRule(sheet, selector, '', 0);
            return (sheet.cssRules || sheet.rules)[0];
        }
    });
})(jQuery);

///
/// Global control actions
///
$.extend(Namespace('ST.Actions'), {
    TagInput: {
        RemoveTag: function (ev) {
            var $parent = $(this).closest('.tag-input');
            $(this).siblings('.hidden').removeClass('hidden');

            if (STQA.RemoveCurrentTag) {
                STQA.RemoveCurrentTag(this.textContent);
            }

            $(this).remove();

            // Update the value of the control
            var value = '';
            $parent.children('.tag').each(function () {
                value += this.textContent + ' ';
            });

            $parent.attr('data-value', value.trim())
                .prop('value', value.trim());
        }
    }
});

if (!window.PXP) { // PXP defines its own action handler
    ///
    /// Actions:
    ///     The [data-action] attribute specifies a click event handler, which will be defined in the namespace ST.Actions
    /// 
    ///     To keep things organized, it is recommended to specify a child namespace, as well.
    ///
    $(document).delegate('[data-action]', 'initialize mouseenter mousedown tap click focus change', function (ev) {
        if (!this.dataActionInitialized) {
            function performAction(ev) {
                var $this = $(this);
                var bNoClick = $this.parents().add(this).withClass('no-click').length == 0;

                if (!this.getAttribute('disabled') && !$this.hasClass('loading') && bNoClick) {
                    var action = this.getAttribute('data-action') || 'UNKNOWN';
                    var ns;

                    // allow specifying namespaces in actions
                    if (action.indexOf('.') == -1) {
                        ns = Namespace('ST.Actions');
                    }
                    else {
                        ns = Namespace('ST.Actions.' + action.substr(0, action.lastIndexOf('.')));
                        action = action.substr(action.lastIndexOf('.') + 1);
                    }

                    var method = ns[action] || ST.Actions['UNKNOWN'];
                    if (method != undefined) {
                        if (ST.ServerMessage) {
                            ST.ServerMessage.Log.call(this, this.getAttribute('data-action'));
                        }
                        method.call(this, ev);
                    }
                }

                if (this.nodeName == 'A' && !ev.ctrlKey) {
                    ev.preventDefault();
                }
            }

            var el = this;
            var evTypeList = this.getAttribute('data-action-type') || 'click';
            evTypeList.split(' ').forEach(function (evType) {
                if (evType == "hover") {
                    $(el).hover(
                        function (ev) {
                            var delay = this.getAttribute('data-hover') || 250;

                            $(el).wait(delay).done(function () {
                                performAction.call(el, ev);
                                $(el).tooltip('hide');
                            });
                        },
                        function (ev) {
                            $(el).wait(-1);
                        }
                    );
                }
                else if (evType == 'click') {
                    $(el).wait(-1);

                    function onClick(ev) {
                        var bIgnoreError = $('.error-regex').length == 0
                            || $(this).hasThisClass('REV_CRUD_UNDO')
                            || $(this).hasThisClass('revert-ctrl-val')
                            || $(this).hasThisClass('revert-ctrl-val-toolbar');

                        if (bIgnoreError) {
                            if (!this.touchClicked) {
                                if (ev.ctrlKey) {
                                    window.ctrlKeyPressed = true;
                                    ST.GetRootWindow().ignoreUnloadMessage = true;
                                    setTimeout(function () { ST.GetRootWindow().ignoreUnloadMessage = false; }, 0);
                                }

                                performAction.call(this, ev);
                                delete window.ctrlKeyPressed;
                            }
                            this.touchClicked = false;
                        }
                    }

                    $(el).on('tap', function (ev) {
                        try {
                            if (ev.originalEvent) {
                                var touches = ev.originalEvent.touches || ev.originalEvent.targetTouches;

                                this.touchStart = {
                                    x: touches[0].pageX,
                                    y: touches[0].pageY
                                };
                            }

                            $(this).wait(100).done(function () {
                                el.touchClicked = true;

                                ev.type = 'click';
                                performAction.call(el, ev);
                            });

                            ev.stopPropagation();
                            ev.preventDefault();
                        }
                        catch (ex) { alert(ex.message); }
                    })
                    .on('touchmove', function (ev) {
                        try {
                            if (this.touchStart) {
                                if (Math.abs(ev.originalEvent.touches[0].pageX - this.touchStart.x) > 5 ||
                                    Math.abs(ev.originalEvent.touches[0].pageY - this.touchStart.y) > 5) {

                                    $(this).wait(-1);
                                    this.touchStart = null;
                                }

                                ev.preventDefault();
                            }
                            else {
                                $(this).wait(-1);
                            }
                        }
                        catch (ex) { alert(ex.message); }
                    })
                    .on('click', onClick)
                    .on('keydown', function (ev) {
                        if (ev.target === this) {
                            switch (ev.which || ev.charCode) {
                                case ST.KeyCodes.ENTER:
                                case ST.KeyCodes.SPACE:
                                    ev.type = 'click';
                                    onClick.call(this, ev);
                            }
                        }
                    });
                }
                else {
                    $(el).wait(-1);
                    $(el).on(evType, performAction);
                }
            });

            $(el).on('mousedown touchstart', function (ev) {
                $(el).tooltip('hide');
            });

            this.dataActionInitialized = true;

            if (evTypeList.split(' ').indexOf(ev.type) != -1
                || evTypeList.split(' ').indexOf('hover') != -1
                || ev.type == 'touchstart' || ev.type == 'tap') {
                $(el).trigger(ev.type);
            }
        }
    });

    // Allow links to be clicked without forcing an unload message
    $(document).delegate('a[data-action]', 'click', function (ev) {
        ev.preventDefault();
    });
}

///
/// Ensure functionality
///
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// No session storage for older browsers, which are not supported, anyhow.
if (!window.sessionStorage) {
    window.sessionStorage = {
        getItem: function() { return ""; },
        setItem: function() {},
        length: 0,
        removeItem: function() {}
    }
}

///
/// Polyfill
///
if (!RegExp.escape) {
    var re = /[-\/\\^$*+?.()|[\]{}]/g;
    RegExp.escape = function (s) {
        return s.replace(re, '\\$&');
    };
}

if (!Element.prototype.scrollIntoViewIfNeeded) {
    Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
        centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

        var parent = this.parentNode,
            parentComputedStyle = window.getComputedStyle(parent, null),
            parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width')),
            parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width')),
            overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
            overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight),
            overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
            overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth),
            alignWithTop = overTop && !overBottom;

        if ((overTop || overBottom) && centerIfNeeded) {
            parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
        }

        if ((overLeft || overRight) && centerIfNeeded) {
            parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
        }

        if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
            this.scrollIntoView(alignWithTop);
        }
    };
}

if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function (searchString, position) {
            var subjectString = this.toString();
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        }
    });
}

if (!Object.values) {
    Object.values = function (obj) {
        var vals = [];
        for (var key in obj) {
            vals.push(obj[key]);
        }
        return vals;
    };
}

function getObjectValues(obj) {
    var vals = [];
    for (var key in obj) {
        vals.push(obj[key]);
    }
    return vals;
}

function toDictionary(arr, key) {
    var keyMethod = typeof key === 'function'
        ? key
        : function (it) {
            return it[key];
        };
        
    return arr.reduce(function (obj, val) {
        obj[keyMethod(val)] = val;
        return obj
    }, {});
}


function indexOfObject(arr, f) {
    if (arr) {
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            if (arr[i] && f.call(arr[i], arr[i])) {
                return i;
            }
        }
    }
    return -1;
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

// Polyfill for array filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun/*, thisArg*/) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

    Array.prototype.forEach = function (callback, thisArg) {

        var T, k;

        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let k be 0
        k = 0;

        // 7. Repeat, while k < len
        while (k < len) {

            var kValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[k];

                // ii. Call the Call internal method of callback with T as the this value and
                // argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (fun /*, thisArg*/) {
        'use strict';

        if (this == null) {
            throw new TypeError('Array.prototype.some called on null or undefined');
        }

        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

// polyfill and security fallback for localStorage
try {
    (function () {
        var value = window.localStorage["TEST_DATA"];
    })();
}
catch (ex) {
    window.accessDeniedLocalStorage = true;
}

if (!window.localStorage || window.accessDeninedLocalStorage) {
    window.localStorage = {
        getItem: function (sKey) {
            if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        key: function (nKeyId) {
            return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
        },
        setItem: function (sKey, sValue) {
            if (!sKey) { return; }
            document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
            this.length = document.cookie.match(/\=/g).length;
        },
        length: 0,
        removeItem: function (sKey) {
            if (!sKey || !this.hasOwnProperty(sKey)) { return; }
            document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            this.length--;
        },
        hasOwnProperty: function (sKey) {
            return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        }
    };
    window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
}


// polyfill for MutationObserver
//if (!window.MutationObserver) {
//    window.MutationObserver = function MutationObserver(callBack) {
//        this.callBack = callBack;
//        this.observables = {};
//    }

//    window.MutationObserver._uniqueID = (new Date()).getTime();
//    window.MutationObserver.prototype = {
//        observe: function (element, options) {
//            /// <summary>
//            /// Observe a dom element for any changes that may occur
//            /// </summary>
//            /// <param name="element"></param>
//            /// <param name="options"></param>
//            /// <remarks>This is a generic polyfill which will always trigger the observable anytime the html has changed</remarks>

//            this.element = element;
//            element.mutationID = element.mutationID || 'observable' + window.MutationObserver._uniqueID++;

//            // ensure we only attach this observable once for each element
//            if (!this.observables[element.mutationID]) {
//                this.observables[element.mutationID] = true;

//                var inst = this;
//                return this.interval = setInterval(function () {
//                    var html;
//                    html = inst.element.outerHTML;
//                    if (html !== inst.oldHtml) {
//                        inst.oldHtml = html;
//                        return inst.callBack.apply(element, [{
//                            target: element
//                        }]);
//                    }
//                }, 200);
//            }
//        },

//        disconnect: function () {
//            this.observables[this.element.mutationID] = false;

//            return window.clearInterval(this.interval);
//        }
//    };
//}

(function ($) {
    perfTimers = {};

    $.extend(Namespace('ST'), {
        PerfStart: function (name, obj) {
            if (window.performance && ST.DebugPerf) {
                console.log('PerfStart: ' + name);
                if (obj) {
                    console.log(obj);
                }

                perfTimers[name] = performance.now();
            }
        },

        PerfStop: function (name) {
            if (window.performance && ST.DebugPerf) {
                var time = performance.now();
                perfTimers[name] = time - perfTimers[name];

                console.log('PerfStop: ' + name + '(' + perfTimers[name] + ' ms)');
            }
        }
    });
})(jQuery);

ST.RegisterXMLParser('.*/SEND_FEEDBACK', function () { /* do nothing */ });

(function ($, ko) {
    if (!$.fn.viewModel) {
        $.fn.viewModel = function () {
            if (this[0] && ko) {
                this.$vmElement = this.$vmElement || this.closest(':data(viewModel)');
                return this.$vmElement.data('viewModel') || ko.dataFor(this[0]);
            }
        };
    }
})(jQuery, window.ko);
if (window.ko) {
    var scrolledElementsToWatch = [];

    ko.deferredComputed = function () {
        if (arguments.length === 1 && typeof arguments[0] === 'function') {
            return ko.computed({
                read: arguments[0],
                deferEvaluation: true
            });
        }
        else {
            console.error('deferredComuted() only supports a single callback argument');
        }
    };

    function elementInView(el, bFullyVisible) {
        var rect = el.getBoundingClientRect(),
            top = rect.top,
            height = rect.height,
            el = el.parentNode;

        if (el) {
            do {
                rect = el.getBoundingClientRect();
                if (top <= rect.bottom === false) return false;
                // Check if the element is out of view due to a container scrolling
                if ((top + height) <= rect.top) return false;

                if ($(el).hasThisClass('scrolling-container')) {
                    break;
                }

                el = el.parentNode;
            } while (el && el != document.body);
        }

        // Check its within the document viewport
        return top <= document.documentElement.clientHeight;
    }

    var scrolledElementsTimer;
    function checkScrolledIntoView() {
        clearTimeout(scrolledElementsTimer);
        scrolledElementsTimer = setTimeout(function () {
            scrolledElementsToWatch = $(scrolledElementsToWatch).get();

            $(scrolledElementsToWatch)
                .filter(':visible')
                .each(function () {
                    if (elementInView(this)) {
                        this.koOnScrolledIntoView();
                    }
                });
        }, 250);
    }

    if (ST.InitScrollEventDelegate) {
        ST.InitScrollEventDelegate(checkScrolledIntoView);
    }

    ko.bindingHandlers.scrolledIntoView = {
        init: function (element, valueAccessor, bindingAccessor, vm, context) {
            scrolledElementsToWatch.push(element);

            element.koOnScrolledIntoView = function () {
                valueAccessor().call(vm);
            }

            const $sc = $(element).closest('.scrolling-container');
            if ($sc[0] && !$sc[0].checkScrolledIntoViewInitialized) {
                $sc[0].checkScrolledIntoViewInitialized = true;
                $sc.scroll(checkScrolledIntoView);
            }
        }
    };

    ko.bindingHandlers.editableText = {
        init: function (element, valueAccessor) {
            $(element).on('blur', function () {
                var observable = valueAccessor();
                observable($(this).text());
            });
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).text(value);
        }
    };

    ko.bindingHandlers.editableTextInput = {
        init: function (element, valueAccessor) {
            $(element).on('input', function () {
                var observable = valueAccessor();
                observable(this.textContent);
            });
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            element.textContent = value;
        }
    };

    ko.bindingHandlers.visibility = {
        init: function (element, valueAccessor, bindingAccessor, context) {
            var visibilityValue = valueAccessor();
            function updateVisibility(isVisible) {
                element.style.visibility = isVisible ? 'visible' : 'hidden';
            }

            updateVisibility(ko.unwrap(visibilityValue));
            if (ko.isObservable(visibilityValue)) {
                visibilityValue.subscribe(updateVisibility);
            }
        }
    }

    ko.bindingHandlers.contextMenu = {
        init: function (element, valueAccessor, bindingAccessor, context) {
            if (valueAccessor()) {
                var value = valueAccessor();
                $(element).contextMenu(value.template, value.data);
            }
        }
    };

    ko.bindingHandlers.jqSortable = {
        init: function (element, valueAccessor) {
            // jqueryUI is slow to initialize, so we defer initialization
            $(element).on('mouseenter', function (ev) {
                const inst = this;

                if (!this.sortableInitialized) {
                    this.sortableInitialized = true;

                    const options = valueAccessor();
                    if (ko.isObservable(options.disabled)) {
                        options.disabled.subscribe(function (disabled) {
                            $(inst).sortable('option', 'disabled', disabled);
                        });
                        options.disabled = options.disabled();
                    }
                    $(this).sortable(options);
                }
            });
        }
    };

    ko.bindingHandlers.jqDraggable = {
        init: function (element, valueAccessor) {
            // jqueryUI is slow to initialize, so we defer initialization
            $(element).on('mouseenter', function (ev) {
                if (!this.draggableInitialized) {
                    this.draggableInitialized = true;
                    $(this).draggable(valueAccessor());
                }
            });
        }
    };

    ko.bindingHandlers.jqDroppable = {
        init: function (element, valueAccessor) {
            $(element).droppable(valueAccessor());
        }
    };

    //attach meta-data
    ko.bindingHandlers.sortableItem = {
        init: function (element, valueAccessor) {
            var options = valueAccessor();
            $(element).data("sortItem", ko.dataFor(element));
            $(element).data("parentList", arguments[4].$parent);
        }
    };

    //connect items with observableArrays
    ko.bindingHandlers.sortableList = {
        init: function (element, valueAccessor, allBindingsAccessor, context) {
            $(element).data("sortList", ko.dataFor(element)); //attach meta-data
            $(element).sortable({
                update: function (event, ui) {
                    var item = ko.dataFor(ui.item[0]) || ui.item.data("sortItem");
                    if (item) {
                        //identify parents
                        var originalParent = valueAccessor();
                        //var newParent = ui.item.parent().data("sortList");
                        //figure out its new position
                        var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                        if (position >= 0) {
                            originalParent.remove(item);
                            originalParent.splice(position, 0, item);
                        }
                    }
                },
                connectWith: '.container'
            });
        }
    };

    ko.bindingHandlers.stModal = {
        init: function (element, valueAccessor, allBindingsAccessor, context) {
            const $dlg = $(element);
            const $parent = $dlg.parent();

            let isVisible = valueAccessor();
            let options = {
                allowClose: true
            };

            if (!ko.isObservable(isVisible)) {
                options = $.extend(options, isVisible);

                if (!ko.isObservable(options.show)) {
                    throw 'stModal: missing "show" observable';
                }
                isVisible = options.show;
            }

            const $inner = $dlg.fastFind('.modal-dialog');
            const $dlgBody = $inner.fastFind('.modal-body').first();
            $dlg.on('show.bs.modal', function () {
                $(document.body).append(element);

                recomputeZIndices();
            });
            $dlg.on('shown.bs.modal', function () {
                ST.CenterModal($dlg);
                $dlgBody.css({
                    'min-width': $dlgBody.width() + 'px',
                    'min-height': $dlgBody.height() + 'px'
                });

                recomputeZIndices();
            });
            $dlg.on('hidden.bs.modal', function () {
                isVisible(false);
                $parent.append(element);
                $dlgBody.css({ 'min-width': null, 'min-height': null });
            });

            $dlg.on('mousedown', function (ev) {
                this.clickStartedInside = $inner.pointIsInside({ x: document.currentPageX, y: document.currentPageY });
            });
            $dlg.on('click', function (ev) {
                if (false == $inner.pointIsInside({ x: document.currentPageX, y: document.currentPageY })) {
                    if (this.clickStartedInside) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                    }
                    else if ($.isFunction(options.allowClose)) {
                        options.allowClose.call(context)
                            .done(function () {
                                $dlg.modal('hide');
                            });
                    }
                }
            });

            $dlg.modal({
                show: !!isVisible(),
                backdrop: (options.allowClose === true ? true : 'static'),
                keyboard: options.allowClose
            });

            isVisible.subscribe(function (show) {
                if (!!show) {
                    $(element).modal('show');
                }
                else {
                    $(element).modal('hide');
                }
            });

            function recomputeZIndices() {
                let zIndex = 1250;
                $(document.body).children('.modal').each(function () {
                    $(this).next().css('z-index', zIndex++);
                    $(this).css('z-index', zIndex++);
                });
            }
        }
    }

    ko.bindingHandlers.stRadioList = {
        init: function (el, arg) {
            $(el).radioList({
                onClass: 'btn-success',
                value$: arg()
            });
        }
    };

    ko.bindingHandlers.saveElement = {
        init: function (el, arg) {
            if (ko.isObservable(arg())) {
                arg()(el);
            }
        }
    };

    ko.bindingHandlers.selected = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var selected = ko.utils.unwrapObservable(valueAccessor());
            if (selected) element.select();
        }
    };

    // Set the focus without linking focus state to the observable
    ko.bindingHandlers.focused = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var focused = ko.utils.unwrapObservable(valueAccessor());
            if (focused) {
                setTimeout(function () { element.focus() }, 0);
            }
        }
    };

    ko.bindingHandlers.wheel = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var callback = valueAccessor();
            var handler = function (e) {
                var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                callback.call(viewModel, delta);
            };

            // IE9, Chrome, Safari, Opera
            element.addEventListener("mousewheel", handler, false);
            // Firefox
            element.addEventListener("DOMMouseScroll", handler, false);
        }
    };

    // Create binding handler for JQuery UI Droppable
    ko.bindingHandlers.stDroppable = {
        init: function (element, valueAccessor) {
            if (valueAccessor) {
                $(element).droppable(ko.unwrap(valueAccessor()));
            }
        }
    };

    $.fn.stCKEditor = function (opts, viewModel) {
        return this.each(function () {
            viewModel = viewModel || this;

            var value = opts;
            if (opts.value) {
                value = opts.value;
            }

            const inst = this;
            inst.ckEditorInstance?.destroy();

            CKEditor.SynergyClassicEditor
                .create(this, ST.CKConfig.Default)
                .then(function (editor) {
                    inst.ckEditorInstance = editor;

                    $(editor.sourceElement).data('ck-editor', editor);
                    $(editor.sourceElement.nextElementSibling).data('ck-editor', editor);

                    var $modal = $(editor.sourceElement).closest('.modal');
                    if ($modal.length) {
                        ST.CenterModal($modal);
                    }

                    if (opts.copyAttributes) {
                        var $editor = $(editor.sourceElement.nextElementSibling);
                        Array.from(editor.sourceElement.attributes)
                            .filter(function (a) {
                                return a.name.indexOf('data-') === 0 && a.name !== 'data-bind';
                            })
                            .forEach(function (attr) {
                                $editor.attr(attr.name, attr.value);
                            });
                    }

                    editor.ui.focusTracker.on('change:isFocused', function (evt, data, isFocused) {
                        if (isFocused) {
                            editor.sourceElement.nextElementSibling.classList.add('ck-editor-focus');
                            opts.onFocus && opts.onFocus.call(viewModel, evt, editor);
                        }
                        else {
                            editor.sourceElement.nextElementSibling.classList.remove('ck-editor-focus');
                            opts.onBlur && opts.onBlur.call(viewModel, evt, editor);
                        }
                    });

                    if (ko.isObservable(value)) {
                        editor.setData(value() || '');
                        editor.model.document.on('change:data', function (ev) {
                            value(editor.getData());
                        });
                    }

                    opts.onInit && opts.onInit.call(viewModel, editor);
                });
        });
    };

    ko.bindingHandlers.stCKEditor = {
        init: function (element, valueAccessor, bindings, viewModel) {
            //$(element).data('ck-opts', ko.unwrap(valueAccessor()));
        },

        update: function (element, valueAccessor, bindings, viewModel) {
            const opts = ko.isObservable(valueAccessor())
                ? { value: valueAccessor() }
                : ko.unwrap(valueAccessor());

            if (opts) {
                $(element).stCKEditor(opts, viewModel);
            }
        }
    }

    ko.bindingHandlers.radioList = {
        init: function (element, accessor) {
            $(element).radioList({
                value$: accessor()
            });
        }
    }

    ko.bindingHandlers.imageData = {
        init: function (element, accessor) {
            let value = accessor();
            let onError = function (err) {
                console.error(err);
            }
            let onImageReceived = function (name, data) {
                value(data);
            }

            if (!ko.isObservable(value)) {
                onError = value.onError || onError;
                onImageReceived = value.onImageReceived || onImageReceived;

                value = value.value;
            }

            if (element.nodeName !== 'INPUT' && element.getAttribute('type') !== 'file') {
                console.error('loadFileData can only be used on file inputs.');
            }
            else if (!ko.isObservable(value)) {
                console.error('An observable must be specified to receive the data.');
            }
            else {
                $(element).on('change', function () {
                    const reader = new FileReader();

                    onImageReceived(null, null);
                    if (this.files?.length > 0) {
                        for (var file of this.files) {
                            reader.addEventListener('load', (e) => {
                                const data = e.target.result;
                                const mimeType = data.substr(0, data.indexOf(';')).substr('data:'.length);
                                if (mimeType.split('/')[0] !== 'image') {
                                    onError('Invalid Image Format');
                                }
                                else {
                                    onImageReceived(file.name, data);
                                }
                            });
                            reader.readAsDataURL(file);
                        }
                    }
                });
            }
        }
    }

    ko.bindingHandlers.loadFileData = {
        init: function (element, accessor) {
            var value = accessor();

            if (!ko.isObservable(value)) {
                var mimeTypeRE = value.mimeTypeRE;
                value = value.value;
            }

            if (element.nodeName !== 'INPUT' && element.getAttribute('type') !== 'file') {
                console.error('loadFileData can only be used on file inputs.');
            }
            else if (!ko.isObservable(value)) {
                console.error('An observable must be specified to receive the data.');
            }
            else {
                var fileInput = element;
                fileInput.setAttribute('name', 'file');

                $(fileInput).on('change', function () {
                    var formData = new FormData();
                    formData.append('data', JSON.stringify({
                        mimeTypeRE: mimeTypeRE
                    }));
                    formData.append('attachments[]', this.files[0]);

                    ST.CallOAuthService('ST.Synergy', 'GetFileInfo', {},
                        {
                            contentType: false,
                            data: formData,
                            processData: false
                        })
                        .done(function (res) {
                            value(res.Result);
                        });
                });
            }
        }
    }

    ko.bindingHandlers.dblclick = {
        init: function (element, valueAccessor, bindings, viewModel, context) {
            return ko.bindingHandlers.event.init.call(this, element, function () {
                return {
                    dblclick: valueAccessor()
                }
            }, bindings, viewModel, context);
        }
    };

    // Toggles an "open" class on a container
    let documentDropdownHandler = null;
    function closeDropdown() {
        if (documentDropdownHandler) {
            documentDropdownHandler.show(false);
            documentDropdownHandler = null;
        }
    }
    $(document).on('mousedown', function (ev) {
        if (documentDropdownHandler) {
            if (!documentDropdownHandler.element.contains(ev.target)
                && documentDropdownHandler.element !== ev.target) {
                closeDropdown();
            }
        }
    });

    ko.bindingHandlers.stDropdown = {
        init: function (element, valueAccessor, bindings, viewModel, context) {
            const show = valueAccessor();

            if (ko.isObservable(show)) {
                show.subscribe(toggleShow);
                toggleShow(show());
            }
            else {
                toggleShow(show);
            }

            function toggleShow(bShow) {
                $(element).toggleClass('open', bShow);

                closeDropdown();

                if (bShow) {
                    documentDropdownHandler = {
                        element: element,
                        show: show
                    };
                }
            }
        }
    }
}

(function ($, ko) {
    if (!$.fn.viewModel) {
        $.fn.viewModel = function () {
            if (this[0] && ko) {
                this.$vmElement = this.$vmElement || this.closest(':data(viewModel)');
                return this.$vmElement.data('viewModel') || ko.dataFor(this[0]);
            }
        };
    }
})(jQuery, window.ko);
/// JQuery Addons
(function ($) {
    $.pad = function (n, width, z) {
        z = z || '0';
        n = n + '';

        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    $.range = function (start, end, inc, pad) {
        var res = [];

        if (start > end) {
            inc = inc || -1;
            while (start > end) {
                res.push((pad) ? $.pad(start, pad) : start);
                start += inc;
            }
        }
        else {
            inc = inc || 1;
            while (start < end) {
                res.push((pad) ? $.pad(start, pad) : start);
                start += inc;
            }
        }

        return res;
    };

    $.fn.getEvents = function (type) {
        var res = [];

        this.each(function () {
            var events = jQuery._data(this, 'events') || {};
            jQuery.merge(res,  events[type] || []);
        });

        return res;
    };

    // wrapper for jQuery's first() to allow specifying a filter method
    $.fn.first = function (callback) {
        if (callback) {
            this.each(function () {
                if (callback.apply(this)) {
                    return $(this);
                }
            });

            return $();
        }

        return this.eq(0);
    };

    $.fn.any = function (callback) {
        var res = false;

        for (var i = 0; i < this.length; i++) {
            if (callback.call(this[i])) {
                res = true;
                break;
            }
        }

        return res;
    };

    $.fn.pointIsInside = function (pt) {
        var res = false;

        this.each(function () {
            if (!res) {
                var $this = $(this);
                var offset = $this.offset();
                var ptOffset = {
                    x: pt.x - offset.left,
                    y: pt.y - offset.top
                };

                res = (ptOffset.x >= 0 && ptOffset.x < $this.outerWidth()) &&
                      (ptOffset.y >= 0 && ptOffset.y < $this.outerHeight());
            }
        });

        return res;
    };

    // Utility event handler for $.fn.autoClose()
    var autoCloseArray = [];
    $(document).on('click', function (ev) {
        if (ev.originalEvent) {
            // IE sometimes returns negative x,y values... why?
            if (ev.pageX > 0 && ev.pageY > 0) {
                var arr = [];
                for (var i = 0; i < autoCloseArray.length; i++) {
                    var ac = autoCloseArray[i];
                    if (ac.el.parentNode) {
                        var bPtInside = $(ac.el).add(ac.siblings).pointIsInside({
                            x: ev.pageX,
                            y: ev.pageY
                        });

                        var isActiveElement = $(ac.el).add(ac.siblings).get().some(function (el) {
                            return (document.activeElement === el || el.contains(document.activeElement));
                        });

                        if (!bPtInside && !isActiveElement) {
                            ac.deferred.resolve();
                        }
                        else {
                            arr.push(ac);
                        }
                    }
                }

                autoCloseArray = arr;
            }
        }
    });

    // Utility event handler for $.fn.autoClose()
    if (ST.InitScrollEventDelegate) {
        ST.InitScrollEventDelegate(function (ev) {
            var arr = [];
            for (var i = 0; i < autoCloseArray.length; i++) {
                var ac = autoCloseArray[i];
                if (!ac.allowScroll) {
                    ac.deferred.resolve();
                }
                else {
                    arr.push(ac);
                }
            }

            autoCloseArray = arr;
        });
    }

    // Automatically hide an element if clicked outside.
    // Note that any delegations made to this element, its siblings, or any of their children
    // from below their hierarchy will also be ignored.
    $.fn.autoClose = function (options) {
        if ($(document.body).hasClass('touch')) {
            //return $.reject();
        }

        var deferredList = [];

        this.each(function () {
            var ac = $.extend({
                mouseLeaveDelay: -1,
                allowScroll: false,
                siblings: $(),
            }, options);

            ac.el = this;
            ac.deferred = new jQuery.Deferred();
            
            var $this = $(this);
            ac.deferred.always(function () {
                if ($this.hasClass('hidden') == false) {
                    $this.addClass('hidden');
                }

                // This option is deprecated in favor of deferred objects
                if (ac.close) {
                    ac.close.call(ac.el);
                }
            });

            if (ac.mouseLeaveDelay >= 0) {
                var $el = $(this);
                $el.add(ac.siblings).off('.autoClose');
                $el.add(ac.siblings).on('mouseleave.autoClose', function (ev) {
                    if (ev.pageX > 0 && ev.pageY > 0) {
                        var bPtInside = $(ac.el).add(ac.siblings).pointIsInside({
                            x: ev.pageX,
                            y: ev.pageY
                        });

                        if (!bPtInside) {
                            $el.wait(ac.mouseLeaveDelay)
                                .done(function () {
                                    var idx = autoCloseArray.indexOf(ac);
                                    autoCloseArray.splice(idx, 1);

                                    ac.deferred.resolve();
                                });
                        }
                    }
                })
                .on('mouseenter.autoClose', function(ev) {
                    $el.wait(-1);
                });
            }

            deferredList.push(ac.deferred);

            // Don't let the current click be captured
            setTimeout(function () {
                autoCloseArray.push(ac);
            }, 0);
        });

        return $.when.apply(window, deferredList).promise();
    };

    $.fn.isBelowScreen = function () {
        var winHeight = $(window).height();
        var scrollTop = $(document).scrollTop();

        var isBelowScreen = false;

        this.each(function () {
            var offset = $(this).offset();

            if (offset) {
                var bottomPos = offset.top + $(this).outerHeight() - scrollTop;
                if (bottomPos >= winHeight) {
                    isBelowScreen = true;
                }
            }
        });

        return isBelowScreen;
    };

    // Automatically flip an absolutely positioned control
    // when it extends beyond the screen by setting the
    // top/bottom attributes accordingly
    $.fn.autoFlip = function () {
        var winHeight = $(window).height();
        var scrollTop = $(document).scrollTop();

        return this
            .css({
                top: '',
                bottom: ''
            })
            .each(function () {
                var offset = $(this).offset();

                if (offset) {
                    var bottomPos = offset.top + $(this).outerHeight() - scrollTop;

                    if (bottomPos < winHeight) {
                        $(this).css('top', '100%');
                    }
                    else {
                        $(this).css('bottom', '100%');
                    }
                }
            });
    };

    /// Print any element
    $.fn.print = function (options) {
        var $oldBody = $(document.body).detach();

        document.body = document.createElement('body');
        $(document.body).append(this.clone());

        window.print();
        $(document.body).replaceWith($oldBody);
    };

    /// Simulate stopPropagation() with delegated controls
    $.fn.ignoreEvent = function (ev, bSet) {
        var res = false;

        if (ev == this.data('ignoreEvent')) {
            res = true;
        }

        if (bSet) {
            this.data('ignoreEvent', ev);
            this.parents().data('ignoreEvent', ev);
        }
        else {
            this.removeData('ignoreEvent');
        }

        return res;
    };

    function listContains(arrStr, it) {
        if (!it) {
            return false;
        }

        return (arrStr || '').split(' ').indexOf(it) > -1;
    }

    $.fn.hasThisClass = function (className) {
        if (this[0]) {
            return listContains(this[0].getAttribute('class'), className);
        }
        return false;
    };

    $.fn.withClass = function (className) {
        return this.filter(function () {
            return this.getAttribute && listContains(this.getAttribute('class'), className);
        });
    };

    $.fn.closestWithClass = function (className) {
        var res = [];

        this.each(function () {
            var parent = this;
            while (parent && parent.getAttribute) {
                if (listContains(parent.getAttribute('class'), className)) {
                    res.push(parent);
                    break;
                }

                parent = parent.parentNode;
            }
        });

        return $(res);
    }

    var origRemove = $.fn.remove;
    $.fn.remove = function (a, b) {
        this.trigger('removing');
        return origRemove.call(this, a, b);
    };

    $.fn.resetInitVars = function (a) {
        this.find('[data-action]').add(this).each(function () {
            this.dataActionInitialized = false;
        });
        return this;
    };

    var origHide = $.fn.hide;
    $.fn.hide = function () {
        this.not('.hidden').trigger('hiding');
        return origHide.call(this);
    };

    // Fix the jQuery 3+ version of outerHeight returning undefined on empty sets
    $.fn.outerHeight = (function (origOuterHeight) {
        return function () {
            return origOuterHeight.apply(this, arguments) || 0;
        };
    })($.fn.outerHeight);

    // Fix the jQuery 3+ version of height returning undefined on empty sets
    $.fn.height = (function (origHeight) {
        return function () {
            return origHeight.apply(this, arguments) || 0;
        };
    })($.fn.height);

    // Fix the jQuery 3+ version of outerWidth returning undefined on empty sets
    $.fn.outerWidth = (function (origOuterWidth) {
        return function () {
            return origOuterWidth.apply(this, arguments) || 0;
        };
    })($.fn.outerWidth);

    // Fix the jQuery 3+ version of width returning undefined on empty sets
    $.fn.width = (function (origWidth) {
        return function () {
            return origWidth.apply(this, arguments) || 0;
        };
    })($.fn.width);

    var origAddClass = $.fn.addClass;
    $.fn.addClass = function (classes) {
        classes = classes || '';

        if (typeof classes === "string") {
            if (classes.split(' ').indexOf('hidden') != -1) {
                this.attr('aria-hidden', 'true');
                this.not('hidden').trigger('hiding');
            }
        }

        return origAddClass.call(this, classes);
    };

    var origRemoveClass = $.fn.removeClass;
    $.fn.removeClass = function (classes) {
        // JQuery.removeClass accepts a function which is incompatible with this logic intercepting
        //   a "hidden" class.  We'll just ignore this logic when a function is passed in
        classes = classes || '';
        if (!$.isFunction(classes) && classes.split(' ').indexOf('hidden') != -1) {
            this.removeAttr('aria-hidden');
        }

        return origRemoveClass.call(this, classes);
    };

    // Check for existence before attempting to remove a class
    $.fn.removeExistingClass = function (classes) {
        this.withClass(classes).removeClass(classes);
        return this;
    };

    /// <summary>
    /// Ensure getScript() is only called once per script.
    /// </summary>
    /// <param name="$"></param>
    $.getScriptOnce = function (url) {
        ST.LoadedScripts = ST.LoadedScripts || {};
        if (!ST.LoadedScripts[url]) {
            ST.LoadedScripts[url] = $.ajax({
                url: url,
                dataType: "script",
                cache: true
            });
        }

        return ST.LoadedScripts[url];
    };

    $.isPromise = function (obj) {
        /// <summary>
        /// Detect whether an object is a deferred promise or not
        /// </summary>
        /// <param name="obj"></param>
        /// <remarks>A sufficiently determined developer can defeat this method, but
        /// we are not worried about that.</remarks>

        return (obj && typeof obj.then === 'function' && typeof obj.promise === 'function');
    };

    $.reject = function () {
        /// <summary>
        /// Create a promise and reject it (imagine 'false' for promises)
        /// </summary>

        var deferred = new jQuery.Deferred();
        deferred.reject.apply(deferred, arguments);

        return deferred.promise();
    };

    $.resolve = function () {
        /// <summary>
        /// Create a promise and resolve it (imagine 'true' for promises)
        /// </summary>

        var deferred = new jQuery.Deferred();
        deferred.resolve.apply(deferred, arguments);

        return deferred.promise();
    };

    $.fn.STControlData = function () {
        if (this[0]) {
            if (!this[0].$STControl) {
                var parent = this[0];
                while (parent && $(parent).hasClass('REV_CONTROL') == false) {
                    if ((parent.nodeName == 'TD' || parent.nodeName == 'TH') && (parent.getAttribute('data-idxdata') || parent.getAttribute('data-idxnode'))) {
                        var gridData = $(parent).gridData();
                        parent = gridData && gridData.GetControl(parent);
                        if (parent) {
                            parent = parent.DomElement;
                        }

                        break;
                    }
                    else {
                        parent = parent.parentNode;
                    }
                }

                this[0].$STControl = $(parent);
            }

            return this[0].$STControl.data('STControl');
        }
        return null;
    };

    $.fn.addSubscription = function (subscription) {
        return this.each(function () {
            var subs = $(this).attr('data-subscriptions');

            if (subs) {
                $(this).attr('data-subscriptions', $.merge(subs.split(' '), subscription.split(' ')).join(' '));
            }
            else {
                $(this).attr('data-subscriptions', subscription);
            }
        });
    };

    $.fn.matchesForNode = function (node) {
        var srcName = node.getAttribute('SRC_NAME') || '';
        var srcObjectGU = node.getAttribute('SRC_OBJECT_GUID') || '';

        var filter = '[data-src-name="' + srcName + '"]';
        filter += '[data-src-object-guid="' + srcObjectGU + '"]';

        return this.filter(filter);
    };

    $.fn.getOriginalValue = function (el) {
        var value = '';
        var ctrl = $(this).closest(':data(STControl)').STControlData();

        if (ctrl) {
            value = ctrl.getOriginalValue()
        }

        return value;
    }; // getOriginalValue

    $.fn.addOverlay = function () {
        return $(this).each(function () {
            var $overlay = $(this).data('STOverlay');
            if (!$overlay) {
                var $bg = $('<div class="WaitOverlay-BG"></div>');
                $overlay = ich['ST.WaitOverlay']().add($bg).appendTo('body');

                $(this).data('STOverlay', $overlay);
            }

            $overlay.offset($(this).offset());
            $overlay.outerWidth($(this).outerWidth());
            $overlay.outerHeight($(this).outerHeight());
        });
    };

    $.fn.removeOverlay = function () {
        return $(this).each(function () {
            var $overlay = $(this).data('STOverlay');
            if (!$overlay) {
                $overlay.remove();
            }
        });
    };

    $.fn.isInView = function () {
        /// <function>jQuery.isInView</function>
        /// <summary>
        /// Check if an element is in the viewable area of the window.
        /// </summary>
        var isInView = true;

        var winTop = 0;
        var winLeft = 0;
        var winRight = (window.innerWidth || document.documentElement.clientWidth);
        var winBottom = (window.innerHeight || document.documentElement.clientHeight);

        var scrollingEl = this.parents().filter(function () {
            return this.scrollTop > 0;
        })[0];

        if (scrollingEl) {
            var rect = scrollingEl.getBoundingClientRect();
            winLeft = rect.left;
            winTop = rect.top;
            winRight = rect.right;
            winBottom = rect.bottom;
        }

        this.each(function () {
            var bounding = this.getBoundingClientRect();
            if (bounding.top >= winTop &&
                bounding.left >= winLeft &&
                bounding.right <= winRight &&
                bounding.bottom <= winBottom) {
            }
            else {
                isInView = false;
            }
        });

        return isInView;
    };

    $.fn.scrollIntoView = function (opts) {
        /// <function deprecated="true">jQuery.scrollIntoView()</function>
        /// <summary>
        /// Scroll an element into view.
        /// </summary>

        var $this = this;
        if ($this.length == 1) {
            var paddingBottom = $('#UserDocks').outerHeight() + $('#UserDocks').children('.handle').outerHeight();
            if (opts && opts.paddingBottom) {
                paddingBottom += parseInt(opts.paddingBottom);
            }

            var offset = $this.offset();
            var height = $this.outerHeight();
            var pos = {
                left: offset.left,
                top: offset.top,
                right: offset.left + $this.outerWidth(),
                bottom: offset.top + height
            };

            var scrollTop = $(document).scrollTop();
            var bottom = scrollTop + $(window).height() - paddingBottom;
            var right = $(document).scrollLeft() + $(window).width();
            var paddingTop;
            if (opts && (opts.paddingTop || opts.paddingTop === 0)) {
                paddingTop = parseInt(opts.paddingTop);
            }
            else {
                paddingTop = 0;
            }
            
            if (height + offset.top > bottom || offset.top < scrollTop) {
                scrollTop = offset.top - paddingTop;
            }
            pos.left = Math.min(right - $(window).width(), pos.left);

            $('html,body').stop().animate({
                scrollTop: scrollTop,
                scrollLeft: pos.left
            }, 250);
        }
    };

    $.fn.transformImagePath = function () {
        this.filter('img[src]').each(function () {
            this.setAttribute('src', ST.TransformImagePath(this.getAttribute('src')));
        });

        return this;
    };

    var glyphStyles = {};

    $.fn.setGlyph = function (glyphPath) {
        var glyphClass = '';

        var lcPath = glyphPath.toLowerCase();
        if (lcPath.startsWith('fa-')) {
            this.addClass('fa ' + lcPath);
        }
        else if (lcPath.startsWith('glyphicon-')) {
            this.addClass('glyphicon ' + lcPath);
        }
        else {
            var idx = lcPath.indexOf('/');
            var version = lcPath.substr(2, idx - 2);
            var name = lcPath.substr(idx + 1);

            if (parseInt(name)) {
                var className = 'glyph-' + lcPath.substr(0, idx) + '-' + name;
                glyphStyles[lcPath] = glyphStyles[lcPath] || ST.FindCSSRule('.' + className + ':before');
                glyphStyles[lcPath].content = '\\' + name;
                this.addClass(className);
            }

            if (lcPath.startsWith('fa')) {
                switch (version) {
                    case '47':
                        this.addClass('fa');
                        break;
                    default:
                        this.addClass('fa');
                        break;
                }
            }
            else if (lcPath.startsWith('gi')) {
                switch (version) {
                    case '30':
                        this.addClass('glyphicon');
                        break;
                    default:
                        this.addClass('glyphicon');
                        break;
                }
            }
        }

        return this;
    };

    $.fn.transformImagePaths = function (attrName) {
        // Chrome will load attempt to load images before inserting them into the DOM,
        // so we allow defining a different attribute for defining the source image.
        attrName = attrName || 'src';

        this.fastFind('img[' + attrName + ']').each(function () {
            var src = this.getAttribute(attrName);
            var prefix;

            function checkPrefix(pfx) {
                prefix = pfx;
                return src.toUpperCase().indexOf(prefix.toUpperCase()) === 0;
            }

            $(this).css('visiblity', '');
            if (!src) {
                $(this).css('visiblity', 'hidden');
            }
            else if (checkPrefix('GLYPH/') || checkPrefix('Images/GLYPH/')) {
                var glyphPath = src.substr(prefix.length);

                var idx = glyphPath.indexOf('?');
                if (idx > -1) {
                    glyphPath = glyphPath.substring(0, glyphPath.indexOf('?'))
                }

                var $el = $('<span data-toggle="tooltip"></span>')
                    .attr({
                        title: this.getAttribute('alt')
                    })
                    .setGlyph(glyphPath);

                $(this).replaceWith($el);
            }
            else {
                var path = ST.TransformImagePath(src);
                if (path) {
                    this.setAttribute('src', path);
                }
            }
        });

        return this;
    };

    // Assign a context menu to an element, given a template and template parameters
    // Note that the menu is generated dynamically and removed when finished.
    $.fn.contextMenu = function (template, params) {
        return this.on('contextmenu', function (ev) {
            if (!!ST.Debug && (ev.ctrlKey || ev.shiftKey)) {
                return;
            }
            ev.stopPropagation();
            ev.preventDefault();

            $(document.body).children('.contextMenu').remove();

            var data = (typeof params == "function") ? params.call(this) : params || {};
            if (data === false) {
                return;
            }

            $(data.rootElement).addClass('stickied');
            var $menu = ich[template](data)
                .addClass('contextMenu')
                .appendTo('body')
                .on('hiding', function (ev) {
                    $menu.remove();
                })
                .on('removing', function (ev) {
                    $(data.rootElement).removeClass('stickied');
                })
                .data('parent', this)
                .position({
                    my: 'left top',
                    at: 'left top',
                    of: ev,
                    collision: 'flip flip'
                });

            if (data.onInitialize) {
                data.onInitialize($menu);
            }

            $menu.autoClose({
                mouseLeaveDelay: 500
            })
        });
    };

    $.fn.observe = function (config, method) {
        /// <summary>
        /// Attach an observable to an element or elements.
        /// </summary>
        /// <param name="config">An array of properties to observe, or a mutation config structure</param>
        /// <param name="method">callback for the observer</param>

        // Generate the config variable
        var cfg = {
            attributes: true,
            childList: true,
            characterData: true,
        };

        if ($.isArray(config)) {
            for (var i in config) {
                cfg[config[i]] = true;
            }
        }
        else {
            $.extend(cfg, config);
        }

        // Create the observer
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                method.call(m.target, m);
            });
        });

        // Attach the observer to the elements
        return this.each(function () {
            observer.observe(this, cfg);
        });
    };

    // because we initialize data-action events at the document root,
    // the action will not be initialized when triggering a click
    // if any other element stops propagation
    var jqTrigger = $.fn.trigger;
    $.fn.trigger = function () {
        if (arguments[0] == 'click') {
            jqTrigger.call(this, 'initialize');
        }
        return jqTrigger.apply(this, arguments);
    };

    // Return a promise that will be executed after a given time
    // pass a time < 0 to stop the timer.
    $.fn.wait = function (ms, bExtendTime) {
        var $this = this;
        var deferred = $this.data('wait.Deferred') || new jQuery.Deferred();

        if (bExtendTime) {
            var ext = $this.data('wait.Extension') || 0;
            $this.data('wait.Extension', ext + ms);
        }
        else if ($this.data('wait.Timer')) {
            clearTimeout($this.data('wait.Timer'));
            deferred.reject();
            deferred = new jQuery.Deferred();
        }
        $this.data('wait.Deferred', deferred);

        if (ms >= 0) {
            // inline function to allow recursive calls
            function startTimer(ms) {
                var timer = setTimeout(function () {
                    var ext = $this.data('wait.Extension') || 0;
                    $this.removeData('wait.Extension');

                    if (ext > 0) {
                        startTimer(ext);
                    }
                    else if (deferred.state() == 'pending') {
                        deferred.resolve();
                    }
                }, ms);

                $this.data('wait.Timer', timer);
            }

            startTimer(ms);
        }
        else {
            deferred.reject();
        }

        return deferred.promise().always(function () {
            $this.removeData('wait.Timer');
            $this.removeData('wait.Deferred');
            $this.removeData('wait.Extension');
        });
    };

    $.fn.innerXML = function () {
        var s;
        if (window.XMLSerializer) {
            s = new XMLSerializer();
        }

        var el = this.first()[0];
        if (el) {
            return (s) ? s.serializeToString(el) : (el.xml || el.innerHTML);
        }

        return '';
    };

    $.fn.rootView = function () {
        var res = $();

        this.each(function () {
            var $this = $(this);

            if (!this.rootView || $(this.rootView).hasThisClass('VM_Detail')) {
                this.rootView = $this.parents('.REV_VIEW').add($this.filter('.REV_VIEW')).first()[0];
            }

            res = res.add(this.rootView || $(this).closestView());
        });

        return res;
    }

    $.fn.closestView = function () {
        var closestView = null;
        var ctrl = this.data('STControl');

        if (ctrl) {
            ctrl.ClosestView = ctrl.ClosestView || this.closestWithClass('REV_VIEW')[0];
            closestView = ctrl.ClosestView;
        }
        else if (this.length) {
            closestView = this[0].closestView || this.closestWithClass('REV_VIEW')[0];
            if (!closestView) {
                closestView = this.closestWithClass('modal-header').siblings('.modal-body').children('.REV_VIEW')[0];
            }

            this[0].closestView = closestView;
        }
        else {
            closestView = this.closestWithClass('REV_VIEW')[0];
        }

        return $(closestView);
    };

    $.fn.gridData = function () {
        var parent = this[0];

        while (parent) {
            if (parent.tagName === undefined || parent.tagName === 'BODY') {
                return null;
            }

            var className = parent.getAttribute('class');
            if (listContains(className, 'REV_VIEW')) {
                return null;
            }

            if (listContains(className, 'REV_GRID')) {
                break;
            }

            parent = parent.parentNode;
        }

        return $(parent).data('STComplexControl');
    };

    $.fn.viewData = function () {
        return this.closestView().data('STComplexControl');
    };

    $.fn.filterAttr = function (attr, val, mod) {
        return this.filter('[' + attr + (mod ? mod : '') + '="' + val + '"]');
    };

    $.fn.setCursorPosition = function (pos) {
        return this.each(function () {
            if (this.setSelectionRange) {
                this.setSelectionRange(pos, pos);
            }
            else if (this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                if (pos < 0) {
                    pos = $(this).val().length + pos;
                }
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
            else if (document.createRange) {
                var sel = window.getSelection();
                var range = document.createRange();

                range.setStart(this, pos);
                range.collapse(true);

                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    };

    $.fn.moveCursorToStart = function () {
        return this.each(function () {
            var inp = this;
            if (inp.createTextRange) {
                var part = inp.createTextRange();
                part.move("character", 0);
                part.select();
            }
            else if (inp.setSelectionRange) {
                inp.setSelectionRange(0, 0);
            }
        });
    };

    $.fn.moveCursorToEnd = function () {
        return this.each(function () {
            var el = this;
            el.focus();

            var val = el.value;
            el.value = '';
            el.value = val;
        });
    }

    $.fn.positionAtMouseCursor = function (ev) {
        var x = (ev && ev.pageX) || document.currentPageX;
        var y = (ev && ev.pageY) || document.currentPageY;

        this.each(function () {
            var css = {
                left: 'auto',
                right: 'auto',
                top: 'auto',
                bottom: 'auto'
            };

            var $this = $(this);
            var w = $this.outerWidth();
            var h = $this.outerHeight();

            if (x + w + 5 < $(window).width() + $(document).scrollLeft()) {
                css.left = x + 5;
            }
            else {
                css.left = x - (w + 5);
            }

            if (y + h + 5 < $(window).height() + $(document).scrollTop()) {
                css.top = y;
            }
            else {
                css.top = y - h;
            }

            $this.css(css);
        });
    };

    $.fn.replaceText = function (insertText) {
        insertText = insertText || '';
        var el = this.get(0);
        var pos = 0, pos2 = 0;

        if (el.selectionStart) {
            pos = el.selectionStart;
            pos2 = el.selectionEnd;
        }
        else if (document.selection) {
            var sel = document.selection.createRange();
            var selLength = document.selection.createRange().text.length;
            sel.moveStart('character', -el.value.length);
            pos = sel.text.length - selLength;
            pos2 = pos + selLength;
        }

        var val = this.val();
        val = val.substr(0, pos) + insertText + val.substr(pos2);

        this.first()
            .val(val)
            .focus()
            .setCursorPosition(pos + insertText.length);

        return this;
    };

    $.parseRSS = function (url) {
        var deferred = new jQuery.Deferred();

        var rssURL = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%20%3D%20\'' + encodeURIComponent(url) + '\'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'
        $.ajax({
            url: rssURL,
            dataType: 'json'
        })
        .done(function (data) {
            if (data && data.query && data.query.results) {
                deferred.resolve(data.query.results.feed);
            }
            else {
                deferred.reject(data);
            }
        })
        .fail(function (data) {
            deferred.reject(data);
        });

        return deferred.promise();
    };

    // Use querySelectorAll instead of jQuery's find, if possible.
    if (document.querySelectorAll) {
        $.fn.fastFind = function (selector) {
            var res = [];
            this.each(function () {
                if (this.querySelectorAll) {
                    var q = this.querySelectorAll(selector);
                    var len = q.length;
                    for (var i = 0; i < len; i++) {
                        res.push(q[i]);
                    }
                }
            });
            return $(res);
        };
    }
    else {
        $.fn.fastFind = $.fn.find;
    }

    // faster version of jQuery .filter()
    $.fn.fastFilter = function (selector) {
        var res = [];

        this.each(function () {
            var matches = (this.msMatchesSelector || this.matches);
            if (matches && matches.call(this, selector)) {
                res.push(this);
            }
        });

        return $(res);
    };

    // faster version of jQuery .not()
    $.fn.except = function (selector) {
        var res = [];

        this.each(function () {
            var matches = (this.msMatchesSelector || this.matches);
            if (matches && !matches.call(this, selector)) {
                res.push(this);
            }
        });

        return $(res);
    };

    // focus on items in a list based on typed characters
    $.fn.typeFind = function (options) {
        var opts = $.extend({
            // selector for which items to match
            selector: 'li > a:visible',

            // time to reset the filter to a blank string
            reset_ms: 1000,

            // search from last match
            start_at_previous: true
        }, options);

        return this.each(function() {
            var inst = this;
            $(inst).delegate(opts.selector, 'focus', function (ev) {
                $(inst).data('curr_match', this);

                if (!inst.filterTimeout) {
                    $(inst).data('prev_match', this);
                }
            });
        })
        .keypress(function (ev) {
            var inst = this;
            if (ev.which) {
                var ch = String.fromCharCode(ev.which);
                if (ch) {
                    // Allow jumping to specific items
                    var filter = $(this).data('filter') || '';
                    filter += ch;
                    $(this).data('filter', filter);

                    // find the first string starting with this filter and focus to it
                    var $all_items = $(this).find(opts.selector);
                    var $items = $all_items;

                    // Start the search at the previously selected node
                    if (opts.start_at_previous) {
                        var prevMatch = $(this).data('prev_match');
                        var idx = $items.index(prevMatch);
                        $items = $items.slice(idx + 1);
                    }

                    var re = new RegExp('^\\s*' + filter, 'i');
                    var $matches = $items
                        .filter(function () {
                            return re.test(this.textContent);
                        });

                    // wrap to top if no matches were found
                    if ($matches.length == 0 && opts.start_at_previous) {
                        $matches = $all_items
                            .filter(function () {
                                return re.test(this.textContent);
                            });
                    }

                    // Clear the filter after the timeout period
                    clearTimeout(inst.filterTimeout);
                    inst.filterTimeout = setTimeout(function () {
                        $(inst).removeData('filter');
                        $(this).data('prev_match', $(this).data('curr_match'));

                        inst.filterTimeout = 0;
                    }, opts.reset_ms);

                    // Select the item
                    $matches.first().focus();

                    ev.stopPropagation();
                }
            }
        });
    };

}(jQuery));

/*	This work is licensed under Creative Commons GNU LGPL License.

License: http://creativecommons.org/licenses/LGPL/2.1/
Version: 0.9
Author:  Stefan Goessner/2006
Web:     http://goessner.net/ 
*/
function json2xml(o, tab) {
    function encodeAmpersands(str) {
        return str && str.replace && str.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
    }
    function escapeCData(str) {
        return typeof str === 'string'
            ? str.replaceAll(']]>', '&#93;&#93;>')
            : str;
    }
    var toXml = function (v, name, ind) {
        var xml = "";

        if (v == null || typeof(v) == 'undefined') return xml;

        if (typeof (v.cloneNode) === 'function') {
            xml += v.outerXML || v.xml || (new XMLSerializer()).serializeToString(v);
        }
        else if (v instanceof Array || (typeof (v) != "string" && v.length)) {
            for (var i = 0, n = v.length; i < n; i++)
                xml += ind + toXml(v[i], name, ind);
        }
        else if (typeof (v) == "object") {
            var hasChild = false;
            xml += ind + "<" + name;
            for (var m in v) {
                if (m.charAt(0) == "@" && !(v[m] == null || typeof (v[m]) == 'undefined'))
                    xml += " " + m.substr(1) + "=\"" + encodeAmpersands(ST.EscapeXML(v[m].toString())) + "\"";
                else
                    hasChild = true;
            }
            xml += hasChild ? ">" : "/>";
            if (hasChild) {
                for (var m in v) {
                    if (m == "#text")
                        xml += v[m].replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;');

                    else if (m == "#cdata" && v[m] !== undefined)
                        xml += "<![CDATA[" + escapeCData(v[m]) + "]]>";

                    else if (m.charAt(0) != "@")
                        xml += toXml(v[m], m, ind);
                }
                xml += "</" + name + ">";
            }
        }
        else {
            xml += ind + "<" + name + ">" + encodeAmpersands(v.toString()) + "</" + name + ">";
        }
        return xml;
    }, xml = "";
    for (var m in o)
        xml += toXml(o[m], m, "");

    return xml;
}

/*	This work is licensed under Creative Commons GNU LGPL License.

License: http://creativecommons.org/licenses/LGPL/2.1/
Version: 0.9
Author:  Stefan Goessner/2006
Web:     http://goessner.net/ 
*/
function xml2obj(xml, tab, emptyObject) {
    var X = {
        toObj: function (xml) {
            var o = {};
            if (xml.nodeType == 1) {   // element node ..
                if (xml.attributes.length)   // element with attributes  ..
                    for (var i = 0; i < xml.attributes.length; i++)
                        o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].value || "").toString();
                if (xml.firstChild) { // element has child nodes ..
                    var textChild = 0, cdataChild = 0, hasElementChild = false;
                    for (var n = xml.firstChild; n; n = n.nextSibling) {
                        if (n.nodeType == 1) hasElementChild = true;
                        else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
                        else if (n.nodeType == 4) cdataChild++; // cdata section node
                    }
                    if (hasElementChild) {
                        if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
                            X.removeWhite(xml);
                            for (var n = xml.firstChild; n; n = n.nextSibling) {
                                if (n.nodeType == 3)  // text node
                                    o["#text"] = X.escape(n.nodeValue);
                                else if (n.nodeType == 4)  // cdata node
                                    o["#cdata"] = X.escape(n.nodeValue);
                                else if (o[n.nodeName]) {  // multiple occurence of element ..
                                    if (o[n.nodeName] instanceof Array)
                                        o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                    else
                                        o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                }
                                else  // first occurence of element..
                                    o[n.nodeName] = X.toObj(n);
                            }
                        }
                        else { // mixed content
                            if (!xml.attributes.length)
                                o = X.escape(X.innerXml(xml));
                            else
                                o["#text"] = X.escape(X.innerXml(xml));
                        }
                    }
                    else if (textChild) { // pure text
                        if (!xml.attributes.length)
                            o = X.escape(X.innerXml(xml));
                        else
                            o["#text"] = X.escape(X.innerXml(xml));
                    }
                    else if (cdataChild) { // cdata
                        if (cdataChild > 1)
                            o = X.escape(X.innerXml(xml));
                        else
                            for (var n = xml.firstChild; n; n = n.nextSibling)
                                o["#cdata"] = X.escape(n.nodeValue);
                    }
                }
                if (!xml.attributes.length && !xml.firstChild) o = emptyObject || null;
            }
            else if (xml.nodeType == 9) { // document.node
                o = X.toObj(xml.documentElement);
            }
            else
                alert("unhandled node type: " + xml.nodeType);
            return o;
        },
        toJson: function (o, name, ind) {
            var json = name ? ("\"" + name + "\"") : "";
            if (o instanceof Array) {
                for (var i = 0, n = o.length; i < n; i++)
                    o[i] = X.toJson(o[i], "", ind + "\t");
                json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
            }
            else if (o == null)
                json += (name && ":") + "null";
            else if (typeof (o) == "object") {
                var arr = [];
                for (var m in o)
                    arr[arr.length] = X.toJson(o[m], m, ind + "\t");
                json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
            }
            else if (typeof (o) == "string")
                json += (name && ":") + "\"" + o.toString() + "\"";
            else
                json += (name && ":") + o.toString();
            return json;
        },
        innerXml: function (node) {
            var s = ""
            if ("innerHTML" in node)
                s = node.innerHTML;
            else {
                var asXml = function (n) {
                    var s = "";
                    if (n.nodeType == 1) {
                        s += "<" + n.nodeName;
                        for (var i = 0; i < n.attributes.length; i++)
                            s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                        if (n.firstChild) {
                            s += ">";
                            for (var c = n.firstChild; c; c = c.nextSibling)
                                s += asXml(c);
                            s += "</" + n.nodeName + ">";
                        }
                        else
                            s += "/>";
                    }
                    else if (n.nodeType == 3)
                        s += n.nodeValue;
                    else if (n.nodeType == 4 && n.nodeValue !== undefined)
                        s += "<![CDATA[" + n.nodeValue + "]]>";
                    return s;
                };
                for (var c = node.firstChild; c; c = c.nextSibling)
                    s += asXml(c);
            }
            return s;
        },
        escape: function (txt) {
            return txt == "true" ? true : txt == "false" ? false : txt.replaceAll('&#93;&#93;>', ']]>');
            /*
                this breaks stuff:
                    .replace(/[\\]/g, "\\\\")
                   .replace(/[\"]/g, '\\"')
                   .replace(/[\n]/g, '\\n')
                   .replace(/[\r]/g, '\\r');*/
        },
        removeWhite: function (e) {
            e.normalize();
            for (var n = e.firstChild; n; ) {
                if (n.nodeType == 3) {  // text node
                    if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                        var nxt = n.nextSibling;
                        e.removeChild(n);
                        n = nxt;
                    }
                    else
                        n = n.nextSibling;
                }
                else if (n.nodeType == 1) {  // element node
                    X.removeWhite(n);
                    n = n.nextSibling;
                }
                else                      // any other node
                    n = n.nextSibling;
            }
            return e;
        }
    };
    if (xml.nodeType == 9) // document node
        xml = xml.documentElement;
    //var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
    //return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";

    return X.toObj(X.removeWhite(xml));
}
/* Bootstrap Extensions

    Bootstrap can be quite verbose for some simple tasks.

*/

(function ($) {
    $.extend(Namespace('ST.Actions.Modal'), {
        Close: function (ev) {
            var $dlg = $(this).closest('.modal');
            var viewData = $dlg
                .find('.REV_VIEW')
                .first()
                .viewData();

            if (viewData) {
                var autoSavePref;
                if (viewData.GUID != ST.Query.QueryViewGUID) {
                    autoSavePref = Enum.AutosaveOpt.AlwaysPrompt;
                }
                viewData.CheckCanMove(false, autoSavePref).done(function () {
                    $dlg.modal('hide');
                });
            }
            else {
                $dlg.modal('hide');
            }
        }
    });

    $.fn.stModal = function (options, value) {
        // Allow easy setting of options
        if (typeof (options) == "string") {
            var opts = $(this).data('STModal') || {};
            opts[options] = value;

            return;
        }

        options = $.extend({
            title: '',
            body: '',
            controls: '',
            template: '',
            init: function ($dlg) { },
            // allowClose can be true, false, or a method which returns a deferred object
            allowClose: true,
            draggable: true,
            result: false,
            show: true,
            vCenter: false,
            hCenter: true,
            focusPrimaryButton: true,
            viewModel: null,
            zIndex: 0,
            notificationType: 'dialog'
        }, options);

        options.deferred = new jQuery.Deferred(); // Signal the client upon completion

        if (options.fullscreen) {
            options.hCenter = false;
            options.vCenter = false;
        }

        var $content;
        if (options.template) {
            if (!options.viewModel) {
                $content = ich[options.template](options);

                var $title = $content.filter('.title');
                if ($title.html()) {
                    options.title = $title.html();
                }

                var $controls = $content.filter('.controls');
                options.controls = $controls.html();

                $content = $content.not($title).not($controls);
            }
        }
        else {
            $content = this.clone();
        }

        var $dlg;

        if (options.customDialog) {
            $dlg = this;
        }
        else {
            $dlg = ich['ST.Modal'](options);
            $dlg.data('STModal', options);
            $dlg.appendTo('body');
        }

        if (options.template && options.viewModel) {
            var $content = $('<div></div>').appendTo('body');
            ich[options.template]($content, options.viewModel);

            $content.fastFind('.title').appendTo($dlg.fastFind('.modal-title'));
            $content.fastFind('.controls').appendTo($dlg.fastFind('.controls'));
        }
        
        var cssClass = $dlg.attr('class');

        // Initialize the dialog
        $dlg.modal($.extend({
            show: false,
            backdrop: (options.allowClose === true ? true : 'static'),
            keyboard: options.allowClose
        }, options));

        setTimeout(function () {
            if (options.show) {
                $dlg.addClass(cssClass);
                $dlg.modal("show");
            }

            if (options.fullscreen) {
                $dlg.addClass('fullscreen');
            }
        }, 0);

        // Add this element as the content
        if (!options.customDialog) {
            if (!options.body) {
                $dlg.find('.modal-body').empty();
            }
            $dlg.find('.modal-body').append($content);
        }

        var $inner = $dlg.fastFind('.modal-dialog');

        if (options.width) {
            $inner.css('min-width', options.width);
        }

        if (options.onInitialize) {
            options.onInitialize($dlg);
        }

        var initialized = false;

        // Make draggable once shown
        $dlg.on('shown.bs.modal', function () {
            // Push this dialog to the top of the z order
            var maxZIndex = Math.max.apply(null, $(document.body).find('.st-modal:visible').map(function () {
                var zIndex = parseInt($(this).css('z-index'));
                return isNaN(zIndex) ? 0 : zIndex;
            }));

            if (maxZIndex < options.zIndex) {
                maxZIndex = options.zIndex;
            }

            var dlgData = $dlg.data('bs.modal');

            if (dlgData) {
                dlgData.$backdrop.css('z-index', maxZIndex + 1);
                dlgData.$element.css('z-index', maxZIndex + 2);
            }

            if (!initialized) {
                initialized = true;

                if (options.draggable) {
                    $inner.draggable({
                        handle: '.modal-header',
                        start: function (ev, ui) {
                            $(document.body).children('.st-dropdown-list').addClass('hidden');
                        },
                        stop: function (ev, ui) {
                            var top = Math.max(parseInt(ui.helper.css('top')), 0);
                            var width = ui.helper.width();
                            var left = Math.max(parseInt(ui.helper.css('left')), -width + 200);

                            // Drag the dialog back into view if dropped
                            // outside the window
                            ui.helper.animate({
                                top: top + 'px',
                                left: left + 'px'
                            }, 500);
                        }
                    });
                }

                if (options.init) {
                    options.init($dlg);
                }

                if (options.focusPrimaryButton) {
                    $dlg.find('.btn-primary,.btn-success').focus();
                }

                // Grid column selector gets misaligned, this will fix that
                ST.RefreshPageLayout();

                // Auto-submit prompt dialogs on enter
                if (options.template == 'ST.Modal.Prompt') {
                    $dlg.find('[name="prompt"]').on('keypress', function (ev) {
                        switch (ev.which) {
                            case ST.KeyCodes.ENTER:
                                $dlg.find('.btn-primary,.btn-success')
                                    .first()
                                    .click();

                                ev.stopPropagation();
                                break;
                        }
                    })
                    .focus();
                }
            }

            if (options.hCenter === true && options.fullscreen == false) {
                $inner.css({
                    left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
                });
            }
        });

        $dlg.delegate('.close', 'click', function () {
            options.result = false;
        });

        $dlg.delegate('.btnOkay', 'click', function () {
            options.result = true;
        });

        $dlg.delegate('.btnSave', 'click', function () {
            options.result = 'save';
        });

        $dlg.delegate('.btnUndo', 'click', function () {
            options.result = 'undo';
        });

        $dlg.delegate('.btn', 'keypress', function (ev) {
            ev.stopPropagation();
        });

        // Center the dialog
        $dlg.modal("show");
        if (options.hCenter === true) {
            $inner.css({
                left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
            });
        }
        if (options.vCenter === true) {
            // center the dialog vertically
            var winHeight = $(window).height();
            var dlgHeight = $inner.outerHeight();
            if (winHeight > dlgHeight) {
                $dlg.addClass('vcentered');
            }
        }
        $dlg.modal("hide");

        // If we execute a function on clicking the background, initialize that here
        $dlg.on('mousedown', function (ev) {
            this.clickStartedInside = $inner.pointIsInside({ x: document.currentPageX, y: document.currentPageY });
        });
        $dlg.on('click', function (ev) {
            if (false == $inner.pointIsInside({ x: document.currentPageX, y: document.currentPageY })) {
                if (this.clickStartedInside) {
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                }
                else {
                    if ($.isFunction(options.allowClose)) {
                        options.allowClose.call($dlg)
                            .done(function () {
                                $dlg.modal('hide');
                            });
                    }
                }
            }
        });

        // When hidden, we are done
        $dlg.on('hidden.bs.modal', function (ev) {
            if (options.result) {
                options.deferred.resolve($(this), options.result);
            }
            else {
                options.deferred.reject($(this), options.result);
            }

            if (options.keepOnHide) {
                $dlg.css('z-index', '');
            }
            else {
                $dlg.remove();
            }
        });

        return options.deferred.promise();
    };

    // Allow a method to be called before creating/rendering a popover.
    if ($.fn.popover) {
        $.fn.popover.Constructor.prototype.show = (function (origShow) {
            return function () {
                if (this.options.onInitialize) {
                    this.options.onInitialize.call(this);
                }
                origShow.apply(this, arguments);
            }
        })($.fn.popover.Constructor.prototype.show);
    }

    function lazyInitTagInput(ev) {
        var el = $(this).closest('.tag-input')[0];
        if (!el.tagInputInitialized) {
            el.tagInputInitialized = true;
            $(el).tagInput(this.value).trigger(ev.type);

            return false;
        }
    }

    $(document).on('click', function () {
        $(document.body).find('.tag-popover').addClass('hidden');
    });

    //$(document).delegate('.tag-input', 'mouseover', lazyInitTagInput);
    //$(document).delegate('.tag-input input', 'focus', lazyInitTagInput);

    $.extend(Namespace('ST.Actions.Cloud'), {
        GetTagListResponse: function (xmlNode, cloudGridData, requestNode) {
            var $popover = ich['STQA.Tags.Popover'](xml2obj(xmlNode));

            $(this).data('popover')
                   .replaceWith($popover);

            $(this).data('popover', $popover);
        }
    });

    $.fn.getTagInput = function () {
        return this.closest('.tag-input')[0];
    };

    $.fn.tagInput = function (options) {
        var $res = $();
        var opts = $.extend({
            value: '',
            maxItems: 5,
            caseInsensitive: true
        }, options);

        this.each(function () {
            var $input = $(this);
            $input.wrap('<div class="tag-input form-control"></div>');

            var $itemList = $('<div class="item-list"></div>').insertBefore($input);
            var $el = $input.parent();
            var inst = $el[0];

            $el.addClass($input.attr('class'));
            $input.removeAttr('class');

            // Initialize the methods for this instance
            var val = (opts.value || this.value);
            var itemList = val ? val.split(',') : [];

            $.extend(inst, {
                removeItem: function (itemValue) {
                    if (itemValue) {
                        var removedCount = 0;
                        while (itemList.indexOf(itemValue) != -1) {
                            itemList.splice(itemList.indexOf(itemValue), 1);
                            removedCount++;
                        }

                        if (removedCount) {
                            this.value = itemList.join(',');
                            $(this).trigger('change');
                        }
                    }

                    // Remove this tag from the static tag list once removed
                    if (STQA && STQA.CurrentTag) {
                        var tags = [];
                        for (var i = 0; i < STQA.CurrentTag.length; i++) {
                            if (STQA.CurrentTag[i] != itemValue) {
                                tags.push(STQA.CurrentTag[i]);
                            }
                        }

                        STQA.CurrentTag = tags;
                    }
                },

                addItem: function (itemValue) {
                    if (itemValue
                        && itemList.indexOf(itemValue) == -1
                        && (!opts.maxItems || itemList.length < opts.maxItems)) {

                        itemList.push(itemValue);
                        this.value = itemList.join(',');

                        $(this).trigger('change');
                    }
                }
            });

            // Initialize the value property
            Object.defineProperty(inst, 'value', {
                get: function () {
                    return itemList.join(',');
                },

                set: function (val) {
                    itemList = val ? val.split(',') : [];

                    if (opts.maxItems) {
                        itemList = itemList.slice(0, opts.maxItems);

                        if (itemList.length >= opts.maxItems) {
                            $input.addClass('hidden');
                        }
                        else {
                            $input.removeClass('hidden');
                        }
                    }

                    var itemHtml = '';
                    for (var i = 0; i < itemList.length; i++) {
                        itemHtml += '<span class="item">' + itemList[i] + '</span>';
                    }
                    $itemList.html(itemHtml);

                    $input.val('');
                }
            });

            inst.value = itemList.join(',');

            // Add handlers for clicking to remove items
            $el.delegate('.item', 'click', function (ev) {
                inst.removeItem(this.textContent);
            });

            $el.on('click', function (ev) {
                $input.focus();
                ev.stopPropagation();
            });

            $input.on('click', function (ev) {
                ev.stopPropagation();
            });

            $input.on('keydown', function (ev) {
                switch (ev.which) {
                    case ST.KeyCodes.BACKSPACE:
                        if (!this.value && itemList.length) {
                            inst.removeItem(itemList[itemList.length - 1]);

                            ev.preventDefault();
                        }
                        break;
                }
            });

            $input.on('keyup', function (ev) {
                switch (ev.which) {
                    case ST.KeyCodes.ENTER:
                    case ST.KeyCodes.TAB:
                    case ST.KeyCodes.COMMA:
                    case ST.KeyCodes.SEMICOLON:
                        inst.addItem(this.value.replace(/,$|\s*$|;$/g, ''));
                        this.value = '';
                        break;
                }
            });

            $input.on('focus', function (ev) {
                $el.addClass('focused');
            });

            $input.on('blur', function (ev) {
                if ($(this).hasClass('ignore-blur-event')) {
                    ev.preventDefault();
                }
                else {
                    inst.addItem(this.value);
                    this.value = '';

                    $el.removeClass('focused');
                }
            });
        });

        return $res;
    };

    $.fn.autoWidthInput = function () {
        return this.each(function () {
            var $span = $('<span class="hidden"></span>').insertAfter(this);
            $(this).on('keyup', function () {
                $span.removeClass('hidden');
                $span.text(this.value);
                $(this).width($span.width() + 15);
                $span.addClass('hidden');
            });
        });
    };

    $.findSTViewElement = function (viewID) {
        var $body = $(document.body);

        $('iframe').each(function () {
            var frameBody = this.contentDocument && this.contentDocument.body;
            if (frameBody) {
                $body = $body.add(frameBody);
            }
        });

        return $body.find('.REV_VIEW[data-guid="' + viewID + '"]');
    }

    $.fn.closeDropdown = function (ev) {
        return this.closest('.dropdown').removeClass('open').trigger("hide.bs.dropdown", ev);
    };
})(jQuery);

// Initialize scrolling tables
(function ($) {
    function copyHeader(src, dest) {
        var $thead = $(src).children('thead');
        var $theadCells = $thead.find('th');

        $thead.css('height', '');

        // Update all of the cell widths
        $theadCells.removeClass('invisible')
        .css({
            minWidth: '',
            width: ''
        })
        .each(function () {
            $(this).css({
                minWidth: $(this).outerWidth()
            });
        })
        .last()
        .width('100%');

        var $new_thead = $thead.clone();

        dest.setAttribute('class', src.getAttribute('class'));
        $(dest).removeClass('table-scrolling');

        // Update cell sizes
        $new_thead.find('th').each(function (idx) {
            var $th = $theadCells.eq(idx);
            var w = $th.outerWidth();

            $(this).css('min-width', w + 'px');
        })
        .last()
        .width('100%');

        // Update the destination header
        $(dest).children('thead').replaceWith($new_thead);

        var $content = $(src).parent();
        var $head = $(dest).parent();
        $content.css('margin-top', $head.outerHeight() + 'px');

        $thead.css('height', '0px');
        $theadCells.addClass('invisible');
    }

    $.fn.scrollingTable = function (cmd) {
        /// <summary>
        /// JQuery extension to build a scrolling table structure and assign events to it
        /// </summary>

        if (typeof cmd === 'string') {
            var $tables = this.find('.table-scrolling-container');
            $tables = $tables.add(this.filter('.table-scrolling-container'));

            switch (cmd.toLowerCase()) {
                case 'refresh':
                    $tables.each(function () {
                        var $head = $(this).children('.table-scrolling-head');
                        var $content = $(this).children('.table-scrolling-content');

                        copyHeader($content.children('table')[0], $head.children('table')[0]);
                    });
                    break;
            }

            return this;
        }

        return this.each(function () {
            this.scrollingTableInitialized = true;

            // Basic structure of a scrolling table.
            var contentHTML = '<div class="table-scrolling-container">'
                + '<div class="table-scrolling-head"><table><thead></thead></table></div>'
                + '<div class="table-scrolling-content"></div>'
                + '</div>';

            var $el = $(contentHTML);
            var $head = $el.children('.table-scrolling-head');
            var $content = $el.children('.table-scrolling-content');

            // Duplicate the header element
            copyHeader(this, $head.children('table')[0]);

            // Append the container to the doc and add this content to it
            $el.insertBefore(this);
            $content.append(this);

            // Because the header wasn't attached to the document, this failed inside copyHeader()
            $content.css('margin-top', $head.outerHeight() + 'px');

            // Setup the scroll event
            $content.scroll(function () {
                $head.scrollLeft($content.scrollLeft());
            });

            // initialize the observer for this content:
            var config = {
                attributes: true,
                childList: true,
                characterData: true
            };
            $content.find('tbody > tr').observe(config, function () {
                var el = this;

                clearTimeout(this.copyHeaderTimeout);
                this.copyHeaderTimeout = setTimeout(function () {
                    var $container = $(el).closest('.table-scrolling-container');
                    var $head = $container.children('.table-scrolling-head');
                    var $content = $container.children('.table-scrolling-content');
                    var $table = $content.children('table');
                    var $thead = $table.children('thead');

                    copyHeader($table[0], $head.children('table')[0]);

                    // Copy the scroll position
                    $head.scrollLeft($content.scrollLeft());
                }, 10);
            });
        });
    };

    $(document).delegate('.dropdown-menu.ignore-click', 'mousedown click', function (ev) {
        ev.stopPropagation();
    });

    $(document).ready(function() {
        function updateScrollingTables() {
            // Initialize any uninitialized tables
            $('table.table-scrolling').filter(function () {
                return !this.scrollingTableInitialized;
            })
            .scrollingTable();
        }

        updateScrollingTables();

        var config = { attributes: true, childList: true, characterData: true };
        $(document.body).observe(config, updateScrollingTables);
    });

    $(document).delegate('.dropdown[data-container]', 'show.bs.dropdown', function (ev) {
        var $dd = $(this).children('.dropdown-menu');
        $dd.data('dropdown', this);
        $(this).data('ddElement', $dd[0]);

        $(this.getAttribute('data-container')).append($dd);

        $dd.css('position', 'absolute');
        $dd.position({
            my: 'left top',
            at: 'left bottom',
            of: this
        });
    });

    $(document).delegate('.dropdown[data-container]', 'hide.bs.dropdown', function (ev) {
        var $dd = $($(this).data('ddElement'));
        $(this).removeData('ddElement');

        $(this).append($dd.css({
            position: false,
            left: false,
            top: false
        }));
    });

    $(document).delegate('.dropdown.open .dropdown-menu', 'mousedown.dropdown', function (ev) {
        document.ddMouseDown = false;
        ev.stopPropagation();
    });

    $(document).on('mousedown.dropdown', function (ev) {
        document.ddMouseDown = true;
    });

    $(document).delegate('.dropdown.open', 'hide.bs.dropdown', function (ev) {
        if (!document.ddMouseDown) {
            return false;
        }
    });
})(jQuery);

(function($){
  $.event.special.destroyed = {
    remove: function(o) {
      if (o.handler) {
        o.handler()
      }
    }
  }
})(jQuery);(function ($) {
    $.fn.radioList = function (opts) {
        opts = $.extend({
            onClass: 'btn-success',
            offClass: 'btn-default',
            value$: ko.observable()
        }, opts);

        return this.each(function () {
            var inst = this;

            function checkRadio(el) {
                var onClass = el.getAttribute('data-onClass') || opts.onClass;
                var offClass = el.getAttribute('data-offClass') || opts.offClass;

                var $label = $(el).attr('checked', 'checked').closest('label');
                inst.value = el.value;
                opts.value$(el.value);

                if ($label.hasThisClass(offClass)) {
                    // active label/radio
                    $label.removeClass(offClass);
                }
                if (!$label.hasThisClass(onClass)) {
                    $label.addClass(onClass);
                }
                if (!$label.hasThisClass('checked')) {
                    $label.addClass('checked');
                }

                // inactive label/radio
                var $siblings = $label.siblings('label');
                $siblings.fastFilter('.' + onClass).removeClass(onClass);
                $siblings.not('.' + offClass).addClass(offClass)
                $siblings.fastFilter('.checked').removeClass('checked');
            }

            if (!this.RadioListInitialized) {
                this.RadioListInitialized = true;

                var $radios = $(this).fastFind('input[type="radio"]');

                $radios.on('change', function (ev) {
                    if (this.checked) {
                        checkRadio(this);
                    }
                });

                var val = this.getAttribute('data-value');
                this.removeAttribute('data-value');

                if (val || opts.initSelection !== false) {
                    var selectedRadio = $radios.filter('[value="' + opts.value$() + '"]')[0]
                        || $radios.filter(':checked')[0]
                        || $radios.filter('[value="' + val + '"]')[0];

                    if (selectedRadio) {
                        checkRadio(selectedRadio);
                        selectedRadio.checked = true;
                    }
                }
            }
        });
    };

})(jQuery);

{
    const observer = new MutationObserver((mutations) => {
        mutations
            .filter(m => {
                for (n of (m.addedNodes || [])) {
                    if (n.nodeType === 1) {
                        for (el of n.querySelectorAll('.radio-list')) {
                            $(el).radioList();
                        }
                    }
                }
            });
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

$(document).delegate('.radio-list', 'mouseenter', function (ev) {
    $(this).radioList();
});

$(document).delegate('.radio-list input[type="radio"]', 'change', function (ev) {
    $(this).closest('.radio-list').radioList();
});
(function ($) {
    // Allow hover over menus to open them
    $(document).delegate('[data-toggle="dropdown-hover"],[data-toggle="dropdown"].dropdown-hover', 'mouseenter', function (ev) {
        if (!this.dropdownHoverInitialized) {
            this.dropdownHoverInitialized = true;

            var $this = $(this);
            var $el = $(this).parent();
            $el.delegate('li > a', 'click', function (ev) {
                $el.removeClass('open');
            });

            var delay = this.getAttribute('data-delay') || 250;
            $el.hover(
                function (ev) {
                    var isEnabled = $this.attr('data-toggle') === 'dropdown-hover' || $this.hasThisClass('dropdown-hover');

                    if (isEnabled) {
                        $el.wait(delay)
                            .done(function () {
                                $el.addClass('open')
                                    .closestWithClass('panel-heading')
                                    .addClass('open');

                                var $dd = $el.children('.dropdown-menu').first();
                                if (!$dd.hasThisClass('pull-right')) {
                                    $dd.css({ left: null, right: null });
                                    if (!$dd.isInView()) {
                                        $dd.css({ left: '0px', right: 'auto' });
                                    }
                                }
                            });
                    }
                },
                function (ev) {
                    var bPtInside = $el.children('.dropdown-menu').pointIsInside({
                        x: ev.pageX,
                        y: ev.pageY
                    });

                    if (!bPtInside) {
                        $el.wait(delay)
                            .done(function () {
                                $el.removeClass('open')
                                    .closestWithClass('panel-heading')
                                    .removeClass('open');
                            });
                    }
                }
            );

            $(this).trigger(ev.type);
        }
    });

    $(document).delegate('[data-toggle="dropdown-hover"]', 'mouseenter', function () {
        var el = this;

        /// Don't close a hover-enabled menu on click
        $(el).on('click.hovered', function (ev) {
            ev.stopPropagation();
        });

        clearTimeout($(el).data('hoverTimer'));
        var $ul = $(this).children('ul.dropdown-menu')
            .data('parent', el)
            .appendTo('body')
            .css({
                top: '',
                height: '',
                position: 'fixed'
            })
            .position({
                my: 'left top',
                at: 'left bottom',
                of: el,
                collision: 'flip flip'
            });

        var offset = $ul.offset();
        if (offset &&
            (offset.top < $(document).scrollTop() ||
                offset.top + $ul.outerHeight() > $(document).scrollTop() + $(window).height())
        ) {
            $ul.position({
                my: 'left top',
                at: 'right top',
                of: el,
                collision: 'flip flip'
            })
                .css({
                    top: 0,
                    position: 'fixed',
                    overflow: 'auto'
                })
                .outerHeight($(window).height());
        }
    });

    $(document).delegate('ul.dropdown-menu', 'mouseenter', function () {
        var $trigger = $($(this).data('parent'));
        clearTimeout($trigger.data('hoverTimer'));
    });

    $(document).delegate('[data-toggle="dropdown-hover"]', 'mouseleave', function (ev) {
        var el = this;

        /// Don't close a hover-enabled menu on click
        $(el).off('.hovered');

        var timer = setTimeout(function () {
            $(document.body).children('ul.dropdown-menu')
                .each(function () {
                    $(this).appendTo($(this).data('parent'));
                });
        }, 200);
        $(this).data('hoverTimer', timer);
    });

    $(document).delegate('ul.dropdown-menu', 'mouseleave', function () {
        var el = this;
        var $trigger = $($(this).data('parent'));

        var timer = setTimeout(function () {
            $(el).appendTo($trigger);
        }, 200);
        $trigger.data('hoverTimer', timer);
    });
}) (jQuery);/* ROOT.js

    Handle parsing of the root document node for views

    Application Level Events:

    App_Set_OriginalValue: Retrieve the stored value for a control and set it as the control's value.
    App_Clear_Value: Clear the control's value
*/

ST.RegisterXMLParser('.*?(/REV_WDW_RESPONSE|/RESPONSE|/REV_RESPONSE)', function (node) {
    ST.RefreshPageLayout();

    if (node.getAttribute('FOCUS_KEY') && ST.IsOnOrYes(node.getAttribute('DONT_UPDATE_CURRENT_FOCUS')) === false) {
        ST.RevFocusKey = node.getAttribute('FOCUS_KEY');
    }

    // Parse the children
    return ST.XMLParseChildren(this, node);
});

ST.RegisterXMLParser('.*?/REV_WDW_RESPONSE/PARTIAL_DEF', function (node) {
    // Parse the children
    return ST.XMLParseChildren(this, node);
});

ST.RegisterXMLParser('.*?/REV_WDW_RESPONSE/PASS_THROUGH', function (node) {
    var $view = $(this).closestView();
    var viewData = $view.viewData();

    if (viewData) {
        viewData.PassThroughNode = node;

        var passThroughObj = xml2obj(viewData.PassThroughNode);

        var bIsJobQueueExecuteOrResultView = viewData.GUID == '83D77CA0-88CA-4054-A342-C92F8192249D' || viewData.GUID == '67E93687-85D4-4696-A7F3-F722B62219D9';

        if (passThroughObj && passThroughObj.SUBTITLE && !bIsJobQueueExecuteOrResultView) {
            viewData.$viewSubtitle = viewData.$viewSubtitle || $view.find('.Subtitle');
            if (viewData.$viewSubtitle.hasClass('hidden')) {
                viewData.$viewSubtitle
                    .removeClass('hidden')
                    .append(ich['ST.View.Subtitle'](passThroughObj.SUBTITLE));
                ST.RefreshPageLayout();
            }
        }
    }
});

// This node name is used for trees, job queue actions, and for "Transfer"
ST.RegisterXMLParser('.*?(/ROOT)', function (node) {
    if (node.parentNode && node.parentNode.nodeName !== 'REV_DATA_ROOT') {
        ST.XMLParseChildren(this, node);

        // Execute Client Actions
        ST.ProcessClientState(this, node);
    }

    return this;
});
/* REV_RETURN.js:

    Parse the errors and messages that return from the server
*/

ST.RegisterXMLParser('.*?/MANUAL_FILE', function (node) {
    var viewData = $(this).viewData();
    if (viewData) {
        if ($(node).fastFind('CLIENT_ACTION').not('[TYPE="Server_State"]').length === 0 && $(node).fastFind('REV_GRID').length === 0) {
            viewData.Refresh();
        }
    }
    return ST.XMLParseChildren(this, node);
});

ST.RegisterXMLParser('.*?/REV_RETURN', function (node) {
    var $error = $(node).children('ERROR');
    var result = node.getAttribute('RESULT');

    try {
        // first check for error
        if ($error[0] || result === 'ERROR') {
            // if ST.GetViewEvent is set, then this is the first response and should close the window
            var firstTime = !!ST.GetViewEvent || !$(this).viewData();
            var errText = $error.first().text();

            switch (errText) {
                case 'INVALID_TOKEN':
                    break;

                case 'NO CONTEXT OBJECT':
                    ST.SignOut(1025);
                    break;

                default:
                    errText = '';
                    $error.each(function () {
                        errText += $(this).text().replace(/\n/g, '<br/>');
                        var row = this.getAttribute('Row');
                    if (row) {
                        errText += '<br/>(row: ' + row + ')';
                    }
                        errText += '<br/>';
                    });

                    var $this = $(this);
                    ST.ShowMessage(errText, 'Error', 'fa fa-exclamation-triangle')
                        .always(function () {
                            if (firstTime) {
                                var $modal = $this.closest('.modal');
                                if ($modal.length === 1) {
                                    ST.CloseModal($modal);
                                }
                                else if ($(document.body).hasClass('ChildView')) {
                                    ST.CloseWindow();
                                }
                            }
                        });

                    $('.st-modal-content.message-box').last()
                        .closest('.st-modal')
                        .addClass('error-message-box');

                    // When changing focus while on a restricted view, this prevents
                    // the focus from being updated and the view being cleared.
                    //throw ($error.text());
            }
        }
        else {
            switch (result) {
                case 'NO_ROWS_FOUND':
                    break;
                case 'MESSAGE':
                    break;
                case 'SAVED':
                    var viewData = $(this).data('STComplexControl');
                    if (viewData && !openNewWindow) {
                        if (ST.IsOnOrYes(node.ownerDocument.documentElement.getAttribute('NO_REFRESH'))
                            || viewData.noRefreshParentOnClose) {
                            node.setAttribute('NO_REFRESH', 'Y');
                        }

                        if (viewData.PassThroughNode) {
                            var openNewWindow = ST.IsOnOrYes(viewData.PassThroughNode.getAttribute('OPEN_NEW_WINDOW'));
                            var parentViewGU = viewData.PassThroughNode.getAttribute('ParentViewGU');
                            var parentTabGU = viewData.PassThroughNode.getAttribute('ParentTabGU');
                            var controlGU = viewData.PassThroughNode.getAttribute('ControlGU');

                            if (!openNewWindow) {
                                var wnd = ST.GetParentWindow();
                                (function () {
                                    var $el = wnd.$('.REV_VIEW[data-guid="' + parentViewGU + '"]');

                                    if (parentTabGU) {
                                        $el = $el.find('.REV_TAB[data-guid="' + parentTabGU + '"]');
                                    }

                                    if (controlGU) {
                                        $el = $el.find('.REV_COMPLEX_CONTROL[data-guid="' + controlGU + '"]');
                                    }

                                    var obj = $el.data('STComplexControl');
                                    if (obj) {
                                        obj.OnSaved(xml2obj(node));
                                    }
                                })();
                            }
                        }
                        else {
                            if (viewData) {
                                viewData.OnSaved(xml2obj(node));
                            }
                        }
                    }
                    break;
                default:
                    throw 'Unknown Return Result: ' + node.getAttribute('RESULT');
                    break;
            }
        }
    }
    catch (ex) { HandleError(ex); }

    return ST.XMLParseChildren(this, node);
});

ST.RegisterXMLParser('.*?/REV_RETURN/ERROR', function (node) {
    // Do nothing, as this node was handled above
});

ST.RegisterXMLParser('.*?/REV_RETURN/QUERY', function (node) {
    var viewData = $(this).viewData();
    if (viewData) {
        viewData.QueryNode = node;
    }
});

ST.RegisterXMLParser('.*?/REV_RETURN/MESSAGE', function (node) {
    var message = $(node).text().trim().replace(/\n/g, '<br/>');
    var $view = $(this).closestView();
    var viewData = $view.viewData();

    // don't show "No [X] were found" messages for snapshots
    if ($view.hasClass('Snapshot') && message.indexOf('were found') != -1) {
        var $snapshot = $view.closest('.snapshot');
        if ($snapshot.length && $snapshot.hasClass('loading')) {
            $snapshot
                .find('.snapshot-unavailable .message')
                .text(message);
            $snapshot
                .removeClass('hidden')
                .removeClass('loading')
                .addClass('unavailable');
            var snapshotData = $snapshot.data('data');
            if (snapshotData) {
                setTimeout(function () {
                    viewData.PositionSnapshot(snapshotData.$el, $snapshot)
                }, 250);
            }
        }
        return;
    }

    try {
        switch (message) {
            case 'NEED_TO_RENDER_FIND_GRAPH':
            case 'NEED_TO_RENDER_FIND_RESULT_VIEW':
                if (ST.XMLRequest.FindResults) {
                    ST.OpenWindow(ST.XMLRequest.FindResults($view))
                    .done(function (wnd) {
                        wnd.SrcViewGU = viewData.GUID;
                        wnd.SrcViewType = viewData.XmlNode.getAttribute('TYPE');
                        wnd.SrcPrimaryObjectGU = viewData.PrimaryObjectGU;
                        wnd.SrcTabGU = viewData.GetCurrentTabGU();
                    });
                }
                break;

            case 'NO CONTEXT OBJECT':
                ST.SignOut(1025);
                break;

            case 'Session is locked':
                console.warn(message);
                break;

            default:
                var messageShown = false;
                if (node && node.parentElement) {
                    var closeFind = $view.hasClass('VM_FindResult') && node.parentElement.getAttribute('RESULT') == 'NO_ROWS_FOUND';
                    var closeEmpty = $('#PrimaryView').children().length == 0;

                    if ($(document.body).hasClass('ChildView')
                        && (closeFind || closeEmpty)) {
                        messageShown = true;
                        ST.ShowMessage(message).done(function () {
                            viewData.Close();
                        });
                    }
                }

                if (!messageShown) {
                    $.pnotify_notice(message);
                }
                break;
        }
    }
    catch (ex) { HandleError(ex); }

    return this;
});

ST.RegisterXMLParser('.*?/(REV_RESPONSE)', function (node) {
    var $errors = $(node).children('Error');

    try {
        if ($errors.length > 0) {
            var data = {
                Errors: $errors.map(function (idx) {
                    var err = this;

                    return {
                        Index: idx,
                        ErrorID: 'ERR_' + idx,
                        ErrorTitle: 'Error ' + (idx + 1),
                        ErrorMessage: err.getAttribute('MESSAGE'),
                        StackTrace: $(err).children('StackTrace').map(function () {
                            return {
                                Text: $(this).text().trim()
                            };
                        }).get()
                    };
                }).get()
            };

            $().stModal({
                template: 'ST.Modal.Exception',
                Errors: data.Errors,
                ExceptionMessage: data.Errors[0].ErrorMessage,
                width: '800px'
            });

            $(document.body).children('.modal').last().addClass('ExceptionModal');

            throw 'Application Error: ' + data.Errors[0].ErrorTitle + '\n\n' + data.Errors[0].ErrorMessage; 
        }
    }
    catch (ex) { HandleError(ex); }
});

ST.RegisterXMLParser('.*?/(REV_RETURN|REV_RESPONSE)/Error', function (node) {
    var message = node.getAttribute('MESSAGE');

    switch (message) {
        case 'NO CONTEXT OBJECT':
            ST.SignOut(1025);
            break;
    }
});

$(document).delegate('.STException .nav-tabs a', 'click focus', function (ev) {
    if (!this.TabInitialized) {
        this.TabInitialized = true;

        $(this).on('click', function (ev) {
            $(this).closest('li').addClass('active').siblings().removeClass('active');
            $(this.getAttribute('href')).addClass('active').siblings().removeClass('active');

            ev.preventDefault();
        }).trigger(ev);
    }
});
/* STX_QUERY.js
*/

(function ($, ko) {
    const ConditionalType = {
        Property: '0',
        Constant: '1',
        Parameter: '2'
    };

    const JoinTypes = [
        'Inner',
        'Outer'
    ];

    function queryData($view) {
        return $view.data('STQuery');
    }

    class BOProperty {
        constructor(xmlNode) {
            this.xmlNode = xmlNode;
        }

        get id() { return this.xmlNode.getAttribute('ID'); }
        get srcElement() { return this.xmlNode.getAttribute('SRCELEMENT'); }
        get boid() { return this.xmlNode.getAttribute('BOID'); }
        get type() { return this.xmlNode.getAttribute('TYPE'); }
        get conditional() { return ST.IsOnOrYes(this.xmlNode.getAttribute('CONDITIONAL')); }
    }

    async function loadBOProperties(boid) {
        const propertyNode = await ST.SendServerEvent(null, 'Query_Get_BOProperties', {
            '@FOCUS_KEY': ST.RevFocusKey,
            '@BOID': boid,
            '@EXCLUDE_MB': 'Y'
        });

        return $(propertyNode.documentElement)
            .fastFind('PROPERTY')
            .map(function () { return new BOProperty(this); })
            .get();
    }

    function loadBODetails(boid) {
        return ST.SendServerEvent(null, 'Query_Get_BODetails', {
            'BOID': boid
        });
    }

    class BOCondition {
        constructor(stQuery, cond, defaultAlias) {
            cond = cond || {};

            this.stQuery = stQuery;
            this.aliases = Array.from(Object.keys(stQuery.boData));

            this.leftAlias = ko.observable(cond['@ALIAS'] || defaultAlias);
            this.leftProperty = ko.observable(cond['@SRCELEMENT']);
            this.leftProperties = ko.observable(stQuery.boData[this.leftAlias()]?.Properties || []);
            this.leftAlias.subscribe((alias) => this.fillProperties(this.leftProperties, alias));

            this.rightAlias = ko.observable(cond['@ALIASRIGHT']);
            this.rightProperty = ko.observable(cond['@SRCELEMENTRIGHT']);
            this.rightProperties = ko.observable(stQuery.boData[this.rightAlias()]?.Properties || []);
            this.rightAlias.subscribe((alias) => this.fillProperties(this.rightProperties, alias));

            this.not = ko.observable(ST.IsOnOrYes(cond['@NOT']));
            this.operator = ko.observable(cond['@VALUETYPE'] || 'Equal');

            this.paramName = ko.observable(cond['@PARAMNAME']);
            this.paramValue = ko.observable(cond['@PARAMVALUE']);
            this.paramLabel = ko.observable(cond['@PARAMLABEL']);

            this.constantValue = ko.observable(cond['@VALUE']);
            this.conditionalType = ko.observable(cond['@VALUETYPE'] || this.computeConditionalType());
            this.showAllConditionals = ko.observable(false);

            this.conditionalType.subscribe(() => this.showAllConditionals(false));
        }

        getXmlObject() {
            const type = this.conditionalType();

            const res = {
                '@VALUETYPE': type,
                '@ALIAS': this.leftAlias(),
                '@SRCELEMENT': this.leftProperty(),
                '@NOT': this.not() ? 'Y' : 'N',
                '@TYPE': this.operator(),
                '@PARENTIDLEFT': this.stQuery.boData[this.leftAlias()]?.ID,
                '@PARENTIDRIGHT': this.stQuery.boData[this.rightAlias()]?.ID,
            };

            if (type === ConditionalType.Parameter) {
                res['@PARAMNAME'] = this.paramName();
                res['@PARAMVALUE'] = this.paramValue();
                res['@PARAMLABEL'] = this.paramLabel();
            }
            else if (type === ConditionalType.Property) {
                res['@ALIASRIGHT'] = this.rightAlias();
                res['@SRCELEMENTRIGHT'] = this.rightProperty();
            }
            else if (type === ConditionalType.Constant) {
                res['@VALUE'] = this.constantValue();
            }

            return res;
        //    public const string ATTR_SRCELEMENTORIGINALRIGHT = "SRCELEMENTORIGINALRIGHT";
        //    public const string ATTR_AGGREGATETYPE = "AGGREGATETYPE";
        }

        computeConditionalType() {
            if (this.paramName()) {
                return ConditionalType.Parameter;
            }
            else if (this.rightAlias() && this.rightProperty()) {
                return ConditionalType.Property;
            }
            else {
                return ConditionalType.Constant;
            }
        }

        toggleShowAllConditionals() {
            this.showAllConditionals(!this.showAllConditionals());
        }

        fillProperties(propList, alias) {
            const boNode = this.stQuery.boData[alias];
            propList(boNode?.Properties || [])
        }
    }

    class JoinOptions {
        constructor(stQuery, queryNode, parentNode, boNode) {
            this.stQuery = stQuery;
            this.queryNode = queryNode;

            this.boNode = boNode;
            this.parentNode = parentNode;

            this.joinType = ko.observable(boNode.JoinOptions?.['@JOINTYPE'] || 'Outer');
            this.joinTypes = JoinTypes;

            this.boProperty = ko.observable(boNode.JoinOptions?.['@LEFTPROPERTY'] || boNode.Details.JoinSource);
            this.boProperties = boNode.Properties;

            this.parentProperty = ko.observable(boNode.JoinOptions?.['@RIGHTPROPERTY'] || boNode.Details.JoinDest);
            this.parentProperties = parentNode.Properties;

            const joinConditions = ST.AsArray(boNode.JoinOptions?.CONDITIONCONTAINER.CONDSIMPLE || [])
                .map((cond) => new BOCondition(stQuery, cond, parentNode.Alias));
            this.joinConditions = ko.observableArray(joinConditions || []);
        }

        getXmlObject() {
            return {
                '@JOINTYPE': this.joinType(),
                '@LEFTPROPERTYALIAS': this.boNode.Alias,
                '@LEFTPROPERTY': this.boProperty(),
                '@RIGHTPROPERTYALIAS': this.parentNode.Alias,
                '@RIGHTPROPERTY': this.parentProperty(),
                'CONDITIONCONTAINER': {
                    '@TYPE': 'And',
                    'CONDSIMPLE': this.joinConditions()
                        .map((cond) => cond.getXmlObject())
                }
            };
        }

        addJoinCondition() {
            this.joinConditions.push(new BOCondition(this.stQuery, null, this.parentNode.Alias));
        }
    }

    class STQuery {
        constructor($view) {
            this.$view = $view;
            $view.data('STQuery', this);

            this.$boTree = $view.fastFind('.bo-tree .tree').first();
            this.$propTable = $view.fastFind('.prop-table tbody').empty();
            this.$sortTable = $view.fastFind('.st-query-sort tbody').empty();

            this.$content = $view.fastFind('.st-query-columns .bo-tree .content');

            this.boData = {};
        }

        parseNode(node) {
            const inst = this;
            inst.$content.addClass('hidden');

            // Output the BO tree
            let currentBO;
            $(node).fastFind('BO').each(function () {
                const $root = (this.parentNode.nodeName == 'BO') ? inst.$boTree.fastFind('[data-alias="' + this.parentNode.getAttribute('ALIAS') + '"]') : inst.$boTree;
                const $el = inst.insertBO($root, this);

                const alias = this.getAttribute('ALIAS');
                if (alias && (!currentBO || inst.boData[alias].BOID == node.getAttribute('CURRENTSELECTEDBO'))) {
                    currentBO = $el[0];
                }
            });

            if (currentBO) {
                ST.Actions.Query.DisplayBOProperties.call(currentBO);
            }

            // sort the properties
            const props = $(node).fastFind('PROPERTY')
                .get()
                .sort(function (a, b) {
                    return parseInt(a.getAttribute('ORDER') || 0) - parseInt(b.getAttribute('ORDER') || 0);
                });

            // generate the rows and add them to the table
            inst.$propTable.empty()
                .append(
                    $(props).map(function () {
                        var bod = inst.boData[this.getAttribute('ALIAS')];
                        return inst.createPropertyRow(bod, this)[0];
                    })
                );

            inst.$propTable.children().each(function () {
                ST.Query.MarkSelected($(this), true);
            });

            // Add the conditions
            const $condTree = this.$view.fastFind('.st-query-conditions .cond-tree .tree').empty();
            const condNode = $(node).children('CONDITIONCONTAINER')[0];
            ST.Query.ParseContainer($condTree, condNode);

            ST.Query.CheckRootConditionButton(this.$view);
            ST.Query.CheckRootNodeButton(this.$view);

            // Add the sorts
            $(node).fastFind('SORTGROUP > SORT').each(function () {
                ST.Query.Sort.AppendSortRow(inst.$sortTable, this);
            });

            ST.Query.Sort.EnsureBlankRow(this.$view);
            ST.Query.UpdateParameters(this.$view);

            // Re-center the modal (if we are in one)
            this.$view.closest('.modal-dialog')
                .each(function () {
                    const $inner = $(this);
                    $inner.css({
                        left: $(document).scrollLeft() + ($(window).width() - $inner.outerWidth()) / 2
                    });
                });
        }

        createPropertyRow(boData, node) {
            const tplParams = $.extend({
                '@BO_NAME': boData ? boData.Name : '',
                '@ALIAS': boData ? boData.Alias : ''
            }, xml2obj(node));

            const $row = ich['ST.Query.Columns.PropertyRow'](tplParams)
                .data('data', {
                    ID: node.getAttribute('ID'),
                    Alias: boData ? boData.Alias : '',
                    Name: boData ? node.getAttribute('SRCELEMENT') : node.getAttribute('STATICTEXT'),
                    Graph: ST.IsOnOrYes(node.getAttribute('GRAPH'))
                })
                .data('XMLNode', node);

            const $cells = $row.children();
            $('.prop-table thead th.hidden').each(function () {
                const srcName = this.getAttribute('data-src-name');
                $cells.fastFilter(`[data-src-name="${srcName}"]`).addClass('hidden');
            });

            function getAggregateValue(agg) {
                switch (agg) {
                    case '0': return 'None';
                    case '1': return 'Sum';
                    case '2': return 'Count';
                    case '3': return 'Min';
                    case '4': return 'Max';
                    case '5': return 'Avg';
                    default: return agg;
                }
            }

            function getDisplayTypeValue(dt) {
                switch (dt) {
                    case 'Default': return '0';
                    case 'Both': return '1';
                    case 'Code': return '3';
                    case 'Description': return '2';
                    default: return dt;
                }
            }

            const $inputs = $row.fastFind('input,select');
            $inputs.filter('[name="labelOverride"]').val(node.getAttribute('LABELOVERRIDE'));
            $inputs.filter('[name="order"]').val(node.getAttribute('ORDER'));
            $inputs.filter('[name="width"]').val(node.getAttribute('WIDTH'));
            $inputs.filter('[name="hide"]')[0].checked = node.getAttribute('HIDE') == 'Y';
            $inputs.filter('[name="group"]').val(node.getAttribute('GROUP'));
            $inputs.filter('[name="break"]').val(node.getAttribute('BREAK'));
            $inputs.filter('[name="rowNum"]').val(node.getAttribute('LABELROW'));
            $inputs.filter('[name="labelDispWidth"]').val(node.getAttribute('LABELWIDTH'));
            $inputs.filter('[name="display"]').val(getDisplayTypeValue(node.getAttribute('DISPLAYTYPE')));
            $inputs.filter('[name="altCode"]').val(node.getAttribute('ALTCODETYPE'));
            $inputs.filter('[name="format"]').val(node.getAttribute('FORMATSPEC'));
            $inputs.filter('[name="aggregate"]').val(getAggregateValue(node.getAttribute('AGGREGATETYPE')));

            return $row;
        }


        insertBO($treeNode, node) {
            const stQuery = this;

            const alias = node.getAttribute('ALIAS') || ST.Query.GetNextAlias(this.$view);
            const namespace = node.getAttribute('NAMESPACE') || 'K12';

            node.setAttribute('ALIAS', alias);
            node.setAttribute('NAMESPACE', namespace);

            if (node.getAttribute('JOINTYPE') && !node.getAttribute('JOINSOURCEALIAS')) {
                var bod = $treeNode.data('data');
                if (bod) {
                    node.setAttribute('JOINSOURCEALIAS', bod.Alias);
                }
            }

            stQuery.boData[alias] = {
                ID: node.getAttribute('ID'),
                Namespace: namespace,
                BOID: node.getAttribute('BOID'),
                Name: node.getAttribute('NAME'),
                NameOrig: node.getAttribute('NAMEORIGINAL'),
                Alias: alias,

                JoinType: node.getAttribute('JOINTYPE'),
                JoinSrcAlias: node.getAttribute('JOINSOURCEALIAS'),
                JoinSrcProperty: node.getAttribute('JOINSOURCEPROPERTY'),
                JoinSrcPropertyOrig: node.getAttribute('JOINSOURCEPROPERTYORIG'),
                JoinDestID: $treeNode.attr('id'), // node.getAttribute('JOINDESTINATIONID'),
                JoinDestProperty: node.getAttribute('JOINDESTINATIONPROPERTY'),
                JoinDestPropertyOrig: node.getAttribute('JOINDESTINATIONPROPERTYORIG'),
            };

            $(node).children('JOINOPTIONS').each(function () {
                stQuery.boData[alias].JoinOptions = xml2obj(this);
            });

            const isJoinedBO = !!(stQuery.boData[alias].JoinSrcAlias || stQuery.boData[alias].JoinDestID);
            const data = $.extend(
                {
                    ShowJoinButton: isJoinedBO
                },
                xml2obj(node)
            );

            $treeNode.addClass('parent');
            return ich['ST.Query.Columns.BONode'](data)
                .data('XMLNode', node)
                .data('data', stQuery.boData[alias])
                .appendTo($treeNode);
        }
    }

    $.extend(Namespace('ST.Query'), {
        XMLRequest: {
            BOTree: function ($rootNode, $propTable, parentNamespace) {
                var boData = $rootNode.data('data');
                if (!boData) { return null; }

                var bo = {
                    '@ID': boData.ID,
                    '@BOID': boData.BOID,
                    '@NAMESPACE': (boData.Namespace != 'K12') ? boData.Namespace : null,
                    '@NAME': boData.Name,
                    '@NAMEORIGINAL': boData.NameOrig,
                    '@ALIAS': boData.Alias,
                    '@JOINTYPE': boData.JoinType,
                    '@JOINSOURCEPROPERTY': boData.JoinSrcProperty,
                    '@JOINSOURCEPROPERTYORIG': boData.JoinSrcPropertyOrig,
                    '@JOINDESTINATIONID': boData.JoinDestID,
                    '@JOINDESTINATIONPROPERTY': boData.JoinDestProperty,
                    '@JOINDESTINATIONPROPERTYORIG': boData.JoinDestPropertyOrig,
                    '@JOINSOURCEALIAS': boData.JoinSrcAlias,
                    'JOINOPTIONS': boData.JoinOptions,

                    'BO': [],
                    'PROPERTY': []
                };

                var $rows = $propTable.fastFind('tbody > tr');

                // Add the child nodes
                $rootNode.children('.bo-node').each(function () {
                    bo['BO'].push(ST.Query.XMLRequest.BOTree($(this), $propTable, boData.Namespace));
                });

                var isRoot = $rootNode.parent().hasClass('tree');

                // Add the properties
                $rows.filter(function () {
                    return $(this).data('data').Alias == boData.Alias || (isRoot && !this.getAttribute('data-alias'));
                })
                    .each(function () {
                        var propData = $(this).data('data');
                        var idx = $(this).prevAll('tr').length + 1;

                        var $inputs = $(this).children().not('.hidden').fastFind('input, select');

                        bo['PROPERTY'].push({
                            '@ID': propData ? propData.ID : '',
                            '@SRCELEMENT': (propData && propData.Alias) ? propData.Name : null,
                            '@STATICTEXT': $inputs.filter('[name="staticText"]').val() || null,
                            '@ALIAS': propData ? propData.Alias : '',
                            '@LABELOVERRIDE': $inputs.filter('[name="labelOverride"]').val() || null,
                            '@ORDER': idx,
                            '@WIDTH': $inputs.filter('[name="width"]').val() || null,
                            '@HIDE': $inputs.filter('[name="hide"]')[0].checked ? 'Y' : null,
                            '@GROUP': $inputs.filter('[name="group"]').val() || null,
                            '@BREAK': $inputs.filter('[name="break"]').val() || null,
                            '@LABELROW': parseInt($inputs.filter('[name="rowNum"]').val()) || null,
                            '@LABELWIDTH': $inputs.filter('[name="labelDispWidth"]').val() || null,
                            '@DISPLAYTYPE': $inputs.filter('[name="display"]').val() || null,
                            '@ALTCODETYPE': $inputs.filter('[name="altCode"]').val() || null,
                            '@FORMATSPEC': $inputs.filter('[name="format"]').val() || null,
                            '@AGGREGATETYPE': $inputs.filter('[name="aggregate"]').val() || null,
                            '@GRAPH': propData.Graph ? 'Y' : null
                        });
                    });

                return bo;
            },

            Conditions: function ($rootNode, parameters) {
                const stQuery = queryData($rootNode.closestView());
                const cc = {
                    '@ID': $rootNode.attr('id'),
                    '@TYPE': $rootNode.attr('data-type'),

                    'CONDITIONCONTAINER': [],
                    'CONDSIMPLE': [],
                    'CONDCOMPLEX': []
                };

                $rootNode.children('.condition-group').each(function () {
                    if ($(this).fastFind('.condition').length) {
                        cc['CONDITIONCONTAINER'].push(ST.Query.XMLRequest.Conditions($(this), parameters));
                    }
                });

                $rootNode.children('.condition').each(function () {
                    const cond = $(this).data('data');
                    if (!cond) return;

                    var data = {
                        '@ID': cond.id,
                        '@TYPE': cond.type,
                        '@NOT': cond.not ? 'Y' : null,
                        '@SRCELEMENT': cond.srcelement,
                        '@SRCELEMENTORIGINAL': cond.srcelementorig,
                        '@ALIAS': cond.alias,
                        '@PARENTIDLEFT': cond.parentid || stQuery.boData[cond.alias].ID,
                        '@SRCELEMENTRIGHT': cond.srcelementright,
                        '@ALIASRIGHT': cond.aliasright,
                        '@PARENTIDRIGHT': cond.parentidright || (cond.aliasright && stQuery.boData[cond.aliasright].ID),
                        '@PARAMNAME': cond.paramname,
                        '@PARAMVALUE': !!cond.paramname ? parameters[cond.paramname] : '',
                        '@PARAMLABEL': cond.paramlabel,
                        'QUERYSTRING': cond.querystring
                    };

                    if (cond.querystring) {
                        data['@TYPE'] = cond.type = 'In';
                        cc['CONDCOMPLEX'].push(data);
                    }
                    else {
                        switch (cond.type) {
                            case 'Equal':
                            case 'Less':
                            case 'LessOrNULL':
                            case 'LessThanOrEqual':
                            case 'LessThanOrEqualOrNULL':
                            case 'Greater':
                            case 'GreaterOrNULL':
                            case 'GreaterThanOrEqual':
                            case 'GreaterThanOrEqualOrNULL':
                                data['@VALUE'] = cond.value;

                                cc['CONDSIMPLE'].push(data);
                                break;
                            case 'In':
                            case 'Contains':
                            case 'StartsWith':
                            case 'EndsWith':
                                data['O'] = [];
                                (cond.value || '').split(',').forEach(function (v) {
                                    data['O'].push({ '@VAL': v });
                                });

                                cc['CONDCOMPLEX'].push(data);
                                break;
                        }
                    }
                });

                return cc;
            },

            SortGroup: function ($sortTable) {
                var res = {
                    'SORT': []
                };

                $sortTable.children('tr').each(function () {
                    var $opt = $(this).fastFind('select[name="property"]').children('option:checked');
                    var sortType = $(this).find('input[name="order"]:checked').val();

                    if ($opt.attr('data-name')) {
                        res['SORT'].push({
                            '@PARENTID': $opt.attr('data-parentid'),
                            '@SRCELEMENT': $opt.attr('data-name'),
                            '@ALIAS': $opt.attr('data-alias'),
                            '@SORTTYPE': sortType
                        });
                    }
                });

                return res;
            },

            QueryXML: function ($view) {
                var $boRoot = $view.fastFind('.st-query-columns .bo-node').first();
                var $propTable = $view.fastFind('.st-query-columns .prop-table').first();
                var $condRoot = $view.fastFind('.st-query-conditions .cond-tree .condition-group').first();
                var $sortTable = $view.fastFind('.st-query-sort tbody').first();
                var $paramRoot = $view.fastFind('.st-query-parameters').first();

                var viewData = $view.viewData();

                var queryGU = (viewData.QueryNode && viewData.QueryNode.getAttribute('GUID')) || viewData.GetIdentity();
                qData = {
                    '@NAME': viewData.GetControlValue('Revelation-Query-RevQuery-Name'),
                    '@FIXEDLENGTH': 'N',
                    '@SUPPRESSHEADER': 'N',
                    '@ORIENTATION': viewData.GetControlValue('Revelation-Query-RevQuery-Orientation'),
                    '@EXPORTFILTERTYPE': viewData.GetControlValue('Revelation-Query-RevQuery-OutputType'),
                    //'@CURRENTSEELECTEDBO': '-GUID',
                    '@DELIMETERDD': 'Comma',
                    '@QUERYTYPE': viewData.GetControlValue('Revelation-Query-RevQuery-Type'),
                    '@GUID': queryGU,
                    'LABELDEF': {},
                    'DESCRIPTION': viewData.GetControlValue('Revelation-Query-RevQuery-Description')
                };

                var boData = ST.Query.XMLRequest.BOTree($boRoot, $propTable);
                qData['BO'] = boData;

                var parameters = {};
                $paramRoot.fastFind('[name]').each(function () {
                    parameters[this.getAttribute('name')] = $(this).val();
                });

                var conditionData = ST.Query.XMLRequest.Conditions($condRoot, parameters);
                qData['CONDITIONCONTAINER'] = conditionData;

                var sortData = ST.Query.XMLRequest.SortGroup($sortTable);
                qData['SORTGROUP'] = sortData;


                return qData;
            }
        },

        QueryViewGUID: 'E51430E2-DFD1-4348-9266-BDCFB437820D',
        ApplyToView: function ($view) {
            var viewData = $view.viewData();
            var $qCols = $view.fastFind('.st-query-columns');

            if ($qCols.length) {
                viewData.QueryNode = $.parseXML(json2xml({
                    QUERY: ST.Query.XMLRequest.QueryXML($view)
                })).documentElement;

                if (viewData.GetServerState()) {
                    var $serverState = $(viewData.GetServerStateXML());
                    $serverState
                        .find('> [K="__Q_DATA_"] > QUERY')
                        .replaceWith(viewData.QueryNode);

                    viewData.SetServerState($serverState[0]);
                }

                var $typeInQueryElem = $('[data-src-name="Revelation-Query-RevQuery-QueryText"]');
                if ($typeInQueryElem.closest('.REV_TAB.active').length == 0) {
                    $typeInQueryElem.STControlData().SetControlValue('');
                }
            }
        },

        MarkSelected: function ($tr, bIncludeRow) {
            var alias = $tr.attr('data-alias');
            var srcElement = $tr.attr('data-srcelement');

            var $content = $tr.closest('.st-query-columns').fastFind('.content');
            var boData = $content.data('BOData');

            if (boData && boData.Alias == alias) {
                var sel = '[data-srcelement="' + srcElement + '"][data-alias="' + alias + '"]';
                var bSelected = $tr.siblings(sel).length == 0 || bIncludeRow;

                $content.fastFind('.list li[data-srcelement="' + srcElement + '"]')
                    .toggleClass('selected', bSelected);
            }
        },

        UpdateParameters: function ($view) {
            var paramList = [];
            $($view.viewData().QueryNode).fastFind('[PARAMNAME]')
                .filter(function () {
                    return this.getAttribute('PARAMNAME');
                })
                .each(function () {
                    paramList.push({
                        Node: this,
                        Name: this.getAttribute('PARAMNAME'),
                        Label: this.getAttribute('PARAMLABEL') || this.getAttribute('SRCELEMENT'),
                        Value: this.getAttribute('PARAMVALUE')
                    });
                });

            $view.fastFind('.st-query-parameters')
                .replaceWith(ich['ST.Query.Parameters']({
                    Parameters: paramList
                }));

            ST.RefreshPageLayout();
        },

        CheckRootConditionButton: function ($view) {
            var $panel = $view.fastFind('.st-query-conditions .panel-conditions');

            if ($panel.fastFind('.tree').children().length == 0) {
                $panel.children('.content')
                    .addClass('hidden');

                $view.fastFind('[id="AddRootConditionButton"]')
                    .removeClass('hidden')
                    .siblings('.panel-body')
                    .addClass('hidden');
            }
            else {
                $view.fastFind('[id="AddRootConditionButton"]')
                    .addClass('hidden')
                    .siblings('.panel-body')
                    .removeClass('hidden');
            }
        },

        CheckRootNodeButton: function ($view) {
            $view.fastFind('[id="AddRootNodeButton"]').remove();

            var $tree = $view.fastFind('.st-query-columns .bo-tree .tree');
            if ($tree.children().length == 0) {
                $tree.append(ich['ST.Query.Columns.AddRoot']());

                var $content = $view.fastFind('.st-query-columns .bo-tree .content');
                $content.addClass('hidden');
            }
        },

        GetNextAlias: function ($view) {
            var idx = 0;

            $view.fastFind('.bo-node').each(function () {
                var alias = this.getAttribute('data-alias');

                alias = parseInt(alias.substr(1));
                idx = Math.max(idx, alias + 1);
            });

            return 'R' + idx;
        },

        GetBOProperties: function ($el, boid) {
            // retrieve the properties for this object
            var deferred;
            if (!$el.data('Properties')) {
                // If not already loaded, make a request
                $el.closest('.panel').addClass('loading');
                deferred = ST.SendServerEvent(null, 'Query_Get_BOProperties', {
                    '@FOCUS_KEY': ST.RevFocusKey,
                    '@BOID': boid
                })
                    .done(function (node) {
                        $el.data('Properties', node);
                    })
                    .always(function () {
                        $el.closest('.panel').removeClass('loading');
                    });
            }
            else {
                // Trigger the response
                deferred = $.resolve($el.data('Properties'));
            }

            return deferred.promise();
        },

        LoadConditionTable: function ($view, condition) {
            const stQuery = queryData($view);
            const $table = $view.fastFind('.st-query-conditions table').first();
            ST.Query.Conditions.InitConditionsTable($table);

            $view.fastFind('[id="UpdateCondition"]').toggleClass('hidden', !condition);
            if (condition) {
                if (condition.alias) {
                    let boid = stQuery.boData[condition.alias].BOID;
                    let $dd = $table.fastFind('select[name="property"]');
                    let $option = $table.fastFind('select[name="object"]')
                        .children('option[data-alias="' + condition.alias + '"]')
                        .prop('selected', true);

                    ST.Query.Conditions.FillDropDown($dd, $option, boid)
                        .done(function () {
                            $dd.val(condition.srcelement);
                        });
                }

                $table.fastFind('input[name="paramname"]').val(condition.paramname);
                $table.fastFind('input[name="paramlabel"]').val(condition.paramlabel);
                $table.fastFind('textarea[name="innerselect"]').val(condition.querystring);
                $table.fastFind('input[name="NOT"]').prop('checked', condition.not);
                $table.fastFind('select[name="cond"]').val(condition.type);

                var valueType = condition.paramname
                    ? 'PARAM'
                    : condition.querystring
                        ? 'INNERSELECT'
                        : (condition.aliasright ? 'P' : 'V');
                $table.fastFind('input[name="value_type"][value="' + valueType + '"]').prop('checked', true);

                if (condition.aliasright) {
                    let boid = stQuery.boData[condition.aliasright].BOID;
                    let $dd = $table.fastFind('select[name="value_property"]');
                    let $option = $table.fastFind('select[name="value_object"]')
                        .children('option[data-alias="' + condition.aliasright + '"]')
                        .prop('selected', true);

                    ST.Query.Conditions.FillDropDown($dd, $option, boid)
                        .done(function () {
                            $dd.val(condition.srcelementright);
                        });
                }
                else {
                    $table.fastFind('input[name="value_string"]').val(condition.value);
                }
            }
            else {
                ST.Query.Conditions.ClearConditionTable($table);
            }

            $view.find('input:checked').trigger('change');
        },

        ParseContainer: function ($root, node) {
            const stQuery = queryData($root.closestView());
            const $children = $(node).children();

            if ($children.length) {
                if (!node.getAttribute('TYPE')) {
                    node.setAttribute('TYPE', 'And');
                }

                const $el = ich['ST.Query.Conditions.Group'](xml2obj(node))
                    .contextMenu('ST.Query.Conditions.Group.ContextMenu');
                const $group = $el.filter('.condition-group');

                $root.append($el);
                $el.trigger('initialize');

                // Parse the child nodes
                $children.each(function () {
                    if (this.nodeName === 'CONDITIONCONTAINER') {
                        ST.Query.ParseContainer($group, this);
                    }
                    else if (this.nodeName === 'CONDSIMPLE' || this.nodeName === 'CONDINNER' || this.nodeName === 'CONDCOMPLEX') {
                        const alias = this.getAttribute('ALIAS');
                        const ralias = this.getAttribute('ALIASRIGHT');
                        const cond = {
                            id: this.getAttribute('ID'),
                            parentname: stQuery.boData[alias].Name,
                            alias: alias,
                            srcelement: this.getAttribute('SRCELEMENT'),
                            srcelementorig: this.getAttribute('SRCELEMENTORIGINAL'),
                            not: this.getAttribute('NOT') == 'Y',
                            type: this.getAttribute('TYPE'),
                            value: this.getAttribute('VALUE'),
                            parentidleft: this.getAttribute('PARENTIDLEFT'),
                            parentidright: this.getAttribute('PARENTIDRIGHT'),
                            paramname: this.getAttribute('PARAMNAME'),
                            paramvalue: this.getAttribute('PARAMVALUE'),
                            paramlabel: this.getAttribute('PARAMLABEL'),
                            querystring: $(this).children('QUERYSTRING').text(),
                            parentnameright: ralias && stQuery.boData[ralias].Name,
                            aliasright: ralias,
                            srcelementright: this.getAttribute('SRCELEMENTRIGHT'),
                            DisplayString: ST.Actions.Query.Conditions.GetDisplayString
                        };

                        if (cond.type == 'NotEqual') {
                            cond.type = 'Equal';
                            cond.not = true;
                        }

                        if (this.nodeName == 'CONDCOMPLEX') {
                            cond.value = [];
                            $(this).children('O').each(function () {
                                cond.value.push(this.getAttribute('VAL'));
                            });

                            cond.value = cond.value.join(',');
                        }

                        const displayTable = {
                            'Equal': '=',
                            'Less': '&lt;',
                            'LessOrNULL': '&lt;',
                            'LessThanOrEqual': '&lt;=',
                            'LessThanOrEqualOrNULL': '&lt;=',
                            'Greater': '&gt;',
                            'GreaterOrNULL': '&gt;',
                            'GreaterThanOrEqual': '&gt;=',
                            'GreaterThanOrEqualOrNULL': '&gt;=',
                            'In': 'In',
                            'Contains': 'Contains',
                            'StartsWith': 'StartsWith',
                            'EndsWith': 'EndsWith'
                        };

                        cond.type_desc = function () { return displayTable[cond.type]; }

                        cond.$el = ich['ST.Query.Conditions.Condition'](cond)
                            .data('data', cond)
                            .data('XMLNode', this);

                        $group.children('i').remove();
                        $group.append(cond.$el);
                    }
                });
            }
        },

        GetBODataByID: function ($view, id) {
            return $view.fastFind('[id="' + id + '"]').data('data');
        },

        ParseNode: function ($view, node) {
            const stQuery = new STQuery($view);

            stQuery.parseNode(node);
        },

        RemoveTreeNode: function ($view, alias) {
            var $node = $view.fastFind('.st-query-columns .bo-tree .bo-node[data-alias="' + alias + '"]');

            if ($node.length) {
                var $propTable = $view.fastFind('.st-query-columns .prop-table tbody');
                var $content = $view.fastFind('.st-query-columns .bo-tree .content');
                var $condTree = $view.fastFind('.st-query-conditions .cond-tree .tree');
                var $sortTable = $view.fastFind('.st-query-sort tbody');

                $node.fastFind('.bo-node[data-alias]').add($node).each(function () {
                    var el = this;
                    var boData = $(this).data('data');

                    // Remove all fields that match these BO's
                    $propTable.children()
                        .filter(function () {
                            var propData = $(this).data('data');
                            return propData.Alias == boData.Alias;
                        })
                        .remove();

                    // Remove all conditions that match these BO's
                    $condTree.fastFind('.condition')
                        .filter(function () {
                            var condData = $(this).data('data');
                            return condData.alias == boData.Alias || condData.aliasright == boData.Alias;
                        })
                        .remove();

                    // Remove all sort types that match these BO's
                    $sortTable.children()
                        .filter(function () {
                            var $opt = $(this).find('select[name="property"] > option:checked');

                            return $opt.attr('data-alias') == boData.Alias;
                        })
                        .remove();
                });

                // Remove any empty condition blocks
                $condTree.fastFind('.condition-group').each(function () {
                    var $this = $(this);
                    if ($this.children().length == 0) {
                        $this.prev().remove();
                        $this.remove();
                    }
                });

                // Clear the content area if this is the active node
                if ($node.hasClass('active')) {
                    $content.addClass('hidden');
                    $content.removeData('BOData')
                        .removeData('Properties')
                        .fastFind('.list')
                        .empty();
                }

                $node.parent().toggleClass('parent', $node.parent().children('.bo-node').length);

                $node.remove();
            }

            ST.Query.CheckRootNodeButton($view);
            ST.Query.ApplyToView($view);
        }, // RemoveTreeNode

        GetQueryTextControl: function ($view) {
            var viewData = $view.viewData();
            return viewData.FindControl('Revelation-Query-RevQuery-QueryText');
        }, // GetQueryTextControl

        UpdateQueryText: function ($view) {
            ST.Query.ApplyToView($view);

            var viewData = $view.viewData();
            if (viewData && viewData.QueryNode) {
                var xmlObj = $.extend(
                    { '@FOCUS_KEY': ST.RevFocusKey },
                    { 'QUERY': viewData.QueryNode }
                );

                var $panel = $view.fastFind('.st-query-text').closest('.panel');
                $panel.addClass('loading');

                ST.SendServerEvent(null, 'Query_Get_QueryText', xmlObj)
                    .always(function () {
                        $panel.removeClass('loading');
                    })
                    .done(function (response) {
                        var node = response.documentElement;

                        if (node) {
                            ST.Query.GetQueryTextControl($view).SetControlValue($(node).children('QUERY_TEXT').text());
                        }
                    });
            }
        } // UpdateQueryText
    });

    $.extend(Namespace('ST.Query.Columns'), {
        ApplyPropertyFilters: function ($view) {
            var $list = $view.fastFind('.st-query-columns .filterTypes');
            var $btn = $list.siblings('.btn');

            var $cbUnchecked = $list.fastFind('input[type="checkbox"]')
                .filter(function () {
                    return !this.checked;
                });

            // Mark the list as filtered
            $btn.toggleClass('filtered', $cbUnchecked.length > 0);

            // Hide any list items which are not checked
            var uncheckedProp = {};
            $cbUnchecked.each(function () {
                uncheckedProp[$(this).parent().text().trim()] = true;
            });

            var $propList = $view.fastFind('.st-query-columns .list');
            $propList.fastFind('li')
                .removeClass('hidden')
                .filter(function () {
                    var type = $(this).children().eq(1).text().trim();
                    return uncheckedProp[type]
                })
                .addClass('hidden');
        }
    });

    const queryCommandStack = [];
    $.extend(Namespace('ST.Actions.Query'), {
        Columns: {
            EatClick: function (ev) {
                ev.stopPropagation();
            },

            ToggleAllFilters: function (ev) {
                $(this).blur();

                var $cbList = $(this).closest('ul')
                    .fastFind('input[type="checkbox"]');

                var $cbUnchecked = $cbList
                    .filter(function () {
                        return !this.checked;
                    });

                $cbList.prop('checked', $cbUnchecked.length > 0)
                    .parent()
                    .toggleClass('checked', $cbUnchecked.length > 0);

                ST.Query.Columns.ApplyPropertyFilters($(this).closestView());
            },

            ToggleFilterType: function (ev) {
                ST.Query.Columns.ApplyPropertyFilters($(this).closestView());
            },

            AddLiteralProperty: function (ev) {
                var $view = $(this).closestView();

                var boNode = $view.fastFind('.st-query-columns .bo-tree .tree > [data-alias="R0"]').first()[0];
                if (boNode) {
                    var $row = ich['ST.Query.Columns.PropertyRow']({
                        '@STATICTEXT': 'Text'
                    })
                        .data('data', {
                            ID: '',
                            Name: 'Text',
                            Alias: ''
                        })
                        .appendTo($(this).parent().fastFind('table tbody'));

                    var hiddenCols = {};
                    $view.fastFind('.st-query-columns .prop-table thead th.hidden')
                        .each(function () {
                            hiddenCols[this.getAttribute('data-src-name')] = true;
                        });

                    $row.children().each(function () {
                        if (hiddenCols[this.getAttribute('data-src-name')]) {
                            $(this).addClass('hidden');
                        }
                    });

                    ST.Query.ApplyToView($view);
                }
            }
        },

        AddFKBO: function (ev) {
            const target = $(this).closest('.st-modal').data('target');
            const $view = $(target || this).closestView();
            const $boTreeNode = $(this).closest('.bo-tree').fastFind('.bo-node.active').first();
            const stQuery = queryData($view);

            ST.SendServerEvent($view[0], 'Query_Get_FKBO', {
                '@FOCUS_KEY': ST.RevFocusKey,
                '@SRC_ELEMENT': $(this).closest('li').attr('data-srcelement'),
                '@SRC_OBJECT': $(this).closest('li').attr('data-srcobject')
            })
                .done(function (res) {
                    $(res).fastFind('BO').each(function () {
                        // ensure this BO doesn't already exist
                        var node = this;
                        var $matches = $boTreeNode.children('.bo-node').filter(function () {
                            var bod = $(this).data('data');
                            return bod && bod.BOID == node.getAttribute('BOID') &&
                                bod.JoinSrcProperty == node.getAttribute('JOINSOURCEPROPERTY') &&
                                bod.JoinDestProperty == node.getAttribute('JOINDESTINATIONPROPERTY');
                        });

                        if ($matches.length == 0) {
                            stQuery.insertBO($boTreeNode, this);
                            ST.Query.ApplyToView($view);
                        }
                    });
                });

            if (ev) {
                ev.stopPropagation();
            }
        },

        IncludeAllObjects: function (ev) {
            var $modal = $('.modal.SelectBO');

            if (this.checked) {
                $modal.fastFind('.bo-list')[0].useSearch = true;
                $modal.fastFind('.filter').trigger('keyup');
            }
            else {
                $modal.removeClass('modal');
                ST.CloseModal($modal);
                ST.Actions.Query.ShowAddBODialog.call($modal.data('target'), null);
            }
        },

        ShowAddBODialog: function (ev) {
            var boData = $(this).closest('.bo-node').data('data');

            $().stModal({
                template: 'ST.Modal.SelectBO',
                allowShowAll: true,
                vCenter: true,
                hCenter: true,
            });

            var $modal = $('.modal').last().addClass('SelectBO');

            ST.Query.BindEvents($modal);
            $modal.on('shown.bs.modal', function () {
                $(this).fastFind('.filter').focus();
            });

            $modal.fastFind('.bo-list').on('scroll', function (ev) {
                var $this = $(this);
                var $more = this.$moreResultsButton;

                if ($more && $more.length && $more.hasClass('loading') == false) {
                    if ($more.offset().top - $this.offset().top < $this.height()) {
                        $more.trigger('click');
                    }
                }
            });

            $modal.data('target', this);
            $modal.addClass('loading');
            ST.SendServerEvent(null, 'Query_Get_RelatedBusinessObjects', {
                '@FOCUS_KEY': ST.RevFocusKey,
                '@BOID': boData && boData.BOID
            })
                .done(function (node) {
                    $modal.data('BONodeList', node.documentElement);
                    ST.Actions.Query.UpdateBOList.call($modal[0], null);
                })
                .always(function () {
                    $modal.removeClass('loading');
                });
        },

        ShowJoinOptions: async function (ev) {
            const $boNode = $(this).closest('.bo-node');
            const boNode = $boNode.data('data');
            const parentNode = $boNode.parent().closest('.bo-node').data('data');
            const queryNode = $(this).closest('.tree').data('XMLNode');
            const stQuery = queryData($boNode.closestView());

            if (!boNode.Properties || !parentNode.Properties) {
                const $progress = ST.ShowProgressDialog('query', 'Loading BO Details');

                if (!boNode.Properties) {
                    boNode.Properties = await loadBOProperties(boNode.BOID);
                    boNode.Details = await loadBODetails(boNode.BOID);
                }

                if (!parentNode.Properties) {
                    parentNode.Properties = await loadBOProperties(parentNode.BOID);
                    parentNode.Details = await loadBODetails(parentNode.BOID);
                }

                ST.CloseProgressDialog($progress);
            }

            const vm = new JoinOptions(stQuery, queryNode, parentNode, boNode);
            $().stModal(
                {
                    //backdrop: 'static', // disallow clicking the background to dismiss
                    vCenter: true,
                    hCenter: true,
                    template: 'ST.Query.Modal.JoinOptions',
                    init: function ($dlg) {
                        $dlg.addClass('st-query-modal').data('viewModel', vm);

                        ko.applyBindings(vm, $dlg[0]);
                        ST.CenterModal($dlg);
                    }
                })
                .done(function () {
                    boNode.JoinOptions = vm.getXmlObject();
                    ST.Query.ApplyToView($boNode.closestView());
                });
        },

        ShowMore: function (ev) {
            var $btn = $(this);
            var $modal = $btn.closest('.SelectBO');
            var $ul = $modal.fastFind('.bo-list');
            var nodes = $modal.data('BONodeList');
            var $filter = $modal.fastFind('.filter');

            $btn.addClass('loading');
            ST.SendServerEvent(null, 'Query_Find_BusinessObjects', {
                '@FILTER': $filter.val(),
                '@PAGE': (parseInt(nodes.getAttribute('PAGE') || 0)) + 1
            })
                .done(function (node) {
                    $(nodes).append($(node.documentElement).children());
                    nodes.setAttribute('PAGE', node.documentElement.getAttribute('PAGE'));

                    ST.Actions.Query.UpdateBOList.call($modal[0], null);
                    $filter.trigger('keyup');

                    if (node.documentElement.getAttribute('HAS_MORE')) {
                        $ul[0].$moreResultsButton = ich['ST.Query.BOList.MoreResults']();
                        $ul.append($ul[0].$moreResultsButton);
                    }
                })
                .always(function () {
                    $btn.removeClass('loading');
                });
        },

        UpdateBOList: function (ev) {
            var $modal = $(this).closest('.SelectBO');
            var $input = $modal.fastFind('input');
            var $list = $modal.fastFind('.bo-list');

            $list.empty();

            var boList = $modal.data('BONodeList');
            $list.append(ich['ST.Query.BOList'](xml2obj(boList)));
        },

        SetActive: function (ev) {
            $(this).addClass('active')
                .siblings()
                .removeClass('active');
        },

        SelectBO: function (ev) {
            const $modal = $(this).closest('.SelectBO');
            const $list = $modal.fastFind('.bo-list');
            const $active = $list.children('.active');
            const nodeList = $modal.data('BONodeList');

            if ($active.length) {
                var $bo = $(nodeList).fastFind('BO[BOID="' + $active.attr('data-boid') + '"]');

                if ($bo.length) {
                    const target = $modal.data('target');
                    const $view = $(target).closestView();
                    const stQuery = queryData($view);

                    let $boTreeNode = $(target).closest('.bo-node');
                    if ($boTreeNode.length == 0) {
                        $boTreeNode = $(target).closest('.tree');
                    }

                    const alias = ST.Query.GetNextAlias($view);
                    $bo.attr('ALIAS', alias);

                    stQuery.boData[alias] = {
                        ID: $bo.attr('ID'),
                        Namespace: $bo.attr('NAMESPACE'),
                        BOID: $bo.attr('BOID'),
                        Name: $bo.attr('NAME'),
                        Alias: alias
                    };

                    const data = $.extend(
                        {
                            ShowJoinButton: !$boTreeNode.hasThisClass('tree')
                        },
                        xml2obj($bo[0])
                    );

                    const $branch = ich['ST.Query.Columns.BONode'](data)
                        .data('data', stQuery.boData[alias]);

                    $boTreeNode.addClass('parent').append($branch);

                    ST.Actions.Query.DisplayBOProperties.call($branch[0]);

                    ST.Query.ApplyToView($view);
                    ST.Query.CheckRootNodeButton($view);
                }
            }
        },

        AppendField: function (ev) {
            const $this = $(this);
            const $view = $this.closestView();
            const stQuery = queryData($view);

            const $propTable = $view.fastFind('.prop-table');
            const $tbody = $propTable.fastFind('tbody');
            const $content = $this.closest('.content');

            const boData = $content.data('BOData');
            const srcelement = this.getAttribute('data-srcelement');
            const node = $($content.data('Properties').documentElement).fastFind('PROPERTY[SRCELEMENT="' + srcelement + '"]')[0];


            // Create a temporary object for animation
            const $el = $this.clone()
                .css({
                    position: 'absolute',
                    zIndex: 10000
                })
                .offset($(this).offset());
            $el.text($el.fastFind('.name').text());
            $el.appendTo(document.body);

            // Make a pretty animation before creating the row
            const offset = $propTable.offset();
            $el.animate({
                top: offset.top + $propTable.outerHeight(),
                left: offset.left
            },
                {
                    duration: 500,
                    complete: function () {
                        // Generate the row and add it to the table
                        const $row = stQuery.createPropertyRow(boData, node);
                        $tbody.append($row);
                        ST.Query.MarkSelected($row, true);

                        $this.addClass('selected');
                        $el.remove();

                        ST.Query.Sort.EnsureBlankRow($view);
                        ST.Query.ApplyToView($view);
                    }
                });

            const addFK = $(this).fastFind('[data-action="Query.AddFKBO"]')[0];
            if (addFK) {
                ST.Actions.Query.AddFKBO.call(addFK);
            }
        },

        RemoveTreeNode: function (ev) {
            const $node = $(this).closest('.bo-node');
            ST.Query.RemoveTreeNode($node.closestView(), $node.attr('data-alias'));

            ev.stopPropagation();
        },

        RemoveField: function (ev) {
            var $view = $(this).closestView();
            var $tr = $(this).closest('tr');

            // Unmark this field as being selected
            ST.Query.MarkSelected($tr, false);

            // Remove any sort options relating to this field
            var propData = $tr.data('data');
            $view.fastFind('.st-query-sort tbody select[name="property"] > option[data-property-id="' + propData.ID + '"]')
                .remove();

            $tr.remove();

            ST.Query.ApplyToView($(this).closestView());
        },

        ToggleGraphMode: function (ev) {
            var $view = $(this).closestView();
            var $tr = $(this).closest('tr');

            var allowToggleGraph = $(this).closest('tbody').fastFind('[data-action="Query.ToggleGraphMode"].active').length < 2;

            if ($(this).hasClass('active') || allowToggleGraph) {
                $(this).toggleClass('active');

                var propData = $tr.data('data');
                if (propData) {
                    propData.Graph = $(this).hasClass('active');
                }

                ST.Query.ApplyToView($(this).closestView());
            }
        },

        DisplayBOProperties: function (ev) {
            var $this = $(this);
            var $boTree = $this.closest('.bo-tree');
            var $content = $boTree.fastFind('.content').first();

            $content.removeData('Properties');
            $content.data('BOData', $(this).closest('.bo-node').data('data'));

            // retrieve the properties for this object
            var deferred;
            if (!$this.data('Properties')) {
                var boData = $this.closest('.bo-node').data('data');

                // If not already loaded, make a request
                $content.addClass('loading');
                deferred = ST.SendServerEvent(null, 'Query_Get_BOProperties', {
                    '@FOCUS_KEY': ST.RevFocusKey,
                    '@BOID': boData.BOID
                })
                    .always(function () {
                        $content.removeClass('loading');
                    });
            }
            else {
                // Trigger the response
                deferred = $.resolve($this.data('Properties'));
            }

            $boTree.fastFind('.tree .bo-node.active').removeClass('active');
            $this.closest('.bo-node').addClass('active');

            deferred.done(function (node) {
                // Refresh the list of fields
                $content.data('Properties', node);
                $this.data('Properties', node);
                var $el = ich['ST.Query.Columns.BOFields'](xml2obj(node.documentElement));

                // Append the data
                $content.removeClass('hidden loading')
                    .fastFind('.list')
                    .empty()
                    .append($el);

                // Mark all fields that are currently selected
                $this.closest('.st-query-columns')
                    .fastFind('.prop-table tbody > tr')
                    .each(function () {
                        ST.Query.MarkSelected($(this), true);
                    });

                ST.Query.Columns.ApplyPropertyFilters($this.closestView());
            });
        },

        EditInnerSelect: function () {
            const textarea = $(this).siblings('textarea')[0];

            $(this).closest('tr')
                .fastFind('input[name="value_type"][value="INNERSELECT"]')
                .prop('checked', true)
                .trigger('change');

            queryCommandStack.unshift(function (queryText) {
                textarea.value = queryText;
            });

            ST.Actions.Query.OpenQueryDesigner({
                queryText: textarea.value
            });
        },

        SetSTQueryText: function (args) {
            const cmd = queryCommandStack.shift();
            if (cmd) {
                cmd(args?.STQueryText?.['#cdata']);
            }
        },

        OpenQueryDesigner: function (params) {
            const srcName = params.SrcName && params.SrcName['#cdata'];
            const queryUiBoid = params.QueryUiBoid && params.QueryUiBoid['#cdata'];
            const viewGU = params.ViewGU && params.ViewGU['#cdata'];
            const includeParameter = params.IncludeParameter && params.IncludeParameter['#cdata'];
            const queryText = params.queryText && (params.queryText['#cdata'] || params.queryText);
            let additionalServerState = params.AdditionalServerState && params.AdditionalServerState['#cdata'];

            const viewData = $('.REV_VIEW[data-guid="' + viewGU + '"]').viewData();
            const ctrl = viewData?.FindControls(srcName)[0];
            const serverState = [
                { '@K': 'QUERY_TEXT', '@V': queryText || ctrl?.GetControlValue() },
                { '@K': 'FROM_SYNERGY', '@V': 'Y' },
                { '@K': 'PARENT_SRC_NAME', '@V': srcName },
                { '@K': 'REV_QUERY_UI_BOID', '@V': queryUiBoid },
                { '@K': 'INCLUDE_PARAMETER', '@V': includeParameter }
            ];

            if (additionalServerState) {
                additionalServerState = JSON.parse(additionalServerState);
                for (var key in additionalServerState) {
                    serverState.push({ '@K': key, '@V': additionalServerState[key] });
                }
            }

            ST.OpenViewInDialog('50AA41AC-0156-4A21-820B-9E0C5A319D43', null, {
                'REV_RENDER': {
                    'SERVER_STATE': {
                        'D': serverState
                    }
                }
            }, viewData);
        }
    });

    $.extend(Namespace('ST.Query.Conditions'), {
        FillDropDown: function ($dd, $option, boid) {
            $dd.empty();

            return ST.Query.GetBOProperties($option, boid)
                .done(function (node) {
                    node = node && node.documentElement;

                    $(node).fastFind('PROPERTY[CONDITIONAL="Y"]')
                        .each(function () {
                            var $opt = $('<option>' + this.getAttribute('SRCELEMENT') + '</option>')
                                .attr('data-property-id', this.getAttribute('ID'))
                                .attr('value', this.getAttribute('NAME'));

                            $dd.append($opt);
                        });
                });
        },

        GetCondition: function ($table) {
            const $view = $($table.closest('.st-modal').data('target') || $table.closestView()[0]);
            const stQuery = queryData($view);

            const condType = $table.find('input[name="value_type"]:checked').val();
            const useRightProperty = condType === 'P';
            const useParameter = condType === 'PARAM';

            const alias = $table.find('select[name="object"] > option:checked').attr('data-alias');
            const aliasright = (useRightProperty) ? $table.find('select[name="value_object"] > option:checked').attr('data-alias') : null;

            const boLeft = stQuery.boData[alias] || {};
            const boRight = (aliasright && stQuery.boData[aliasright]) || {};

            const valueString = $table.fastFind('input[name="value_string"]').val();
            return obj = {
                bo: $table.fastFind('select[name="object"]').val(),
                alias: alias,
                parentid: boLeft.ID,
                parentname: boLeft.Name,
                paramname: useParameter ? $table.fastFind('input[name="paramname"]').val() : '',
                paramlabel: useParameter ? $table.fastFind('input[name="paramlabel"]').val() : '',
                srcid: $table.find('select[name="property"] > option:selected').attr('data-property-id'),
                srcelement: $table.fastFind('select[name="property"]').val(),
                not: valueString === 'PARAM' ? null : $table.fastFind('input[name="NOT"]').prop('checked'),
                type: valueString === 'PARAM' ? null : $table.fastFind('select[name="cond"]').val(),
                querystring: condType === 'INNERSELECT' ? $table.fastFind('textarea[name="innerselect"]').val() : '',
                value: valueString,
                aliasright: aliasright,
                parentidright: boRight.ID,
                parentnameright: boRight.Name,
                srcidright: $table.find('select[name="value_property"] > option:selected').attr('data-property-id'),
                srcelementright: (useRightProperty) ? $table.fastFind('select[name="value_property"]').val() : '',
                type_desc: function () {
                    var displayTable = {
                        'Equal': '=',
                        'Less': '&lt;',
                        'LessOrNULL': '&lt;',
                        'LessThanOrEqual': '&lt;=',
                        'LessThanOrEqualOrNULL': '&lt;=',
                        'Greater': '&gt;',
                        'GreaterOrNULL': '&gt;',
                        'GreaterThanOrEqual': '&gt;=',
                        'GreaterThanOrEqualOrNULL': '&gt;=',
                        'In': 'In',
                        'Contains': 'Contains',
                        'StartsWith': 'StartsWith',
                        'EndsWith': 'EndsWith'
                    };

                    return displayTable[this.type];
                },
                DisplayString: ST.Actions.Query.Conditions.GetDisplayString
            };
        },

        ClearConditionTable: function ($table) {
            $table.fastFind('[name="object"] > option').first().prop('selected', true);
            $table.fastFind('[name="property"]').empty();
            $table.fastFind('[name="NOT"]').prop('checked', false);
            $table.fastFind('[name="cond"]').first().prop('checked', true);
            $table.fastFind('[name="value_type"]').first().prop('checked', true);
            $table.fastFind('[name="value_string"]').val('');
            $table.fastFind('[name="value_object"] > option').first().prop('selected', true);
            $table.fastFind('[name="value_property"]').empty();
            $table.fastFind('[name="paramname"]').val('');
            $table.fastFind('[name="paramlabel"]').val('');
            $table.fastFind('[name="innerselect"]').val('');

            $table.find('input:checked').trigger('change');
        },

        InitConditionsTable: function ($table) {
            var $view = $(
                $('.modal.STConditionDialog').data('target') ||
                $table.closestView()[0]
            );

            var boData = { '': {} };
            $view.fastFind('.st-query-columns .bo-tree .bo-node')
                .each(function () {
                    boData[this.getAttribute('data-alias')] = $(this).data('data');
                    boData[this.getAttribute('data-alias')].Properties = $(this).children('.title').data('Properties');
                });

            var $select = $table.fastFind('select[name="value_object"],select[name="object"]');
            $select.empty();
            for (var i in boData) {
                var bod = boData[i];

                var name = bod.Name ? bod.Alias + '.' + bod.Name : '';
                var $opt = $('<option data-alias="' + (bod.Alias || '') + '">' + name + '</option>')
                    .attr('value', bod.Name || '')
                    .data('Properties', bod.Properties);

                $select.each(function () {
                    $(this).append($opt.clone(true));
                });
            }

            ST.Query.Conditions.ClearConditionTable($table);

            // Auto-select the first non-null object
            $select = $table.fastFind('select[name="object"]');
            var bo = ST.Query.PreviousSelectedBO || $select.children().filter(function () {
                return !!this.getAttribute('value');
            }).first().attr('value');
            $select.val(bo).trigger('change');
        }
    });

    $.extend(Namespace('ST.Actions.Query.Conditions'), {
        ShowAddConditionDialog: function (ev) {
            const $view = $(this).closestView();
            const viewData = $view.viewData();

            $().stModal({
                vCenter: true,
                hCenter: true,
                backdrop: 'static', // disallow clicking the background to dismiss
                template: 'ST.Query.Modal.AddCondition',
                IncludeParameter: !!viewData,
                IncludeInnerSelect: !!viewData
            });

            const $modal = $('.modal').last();
            ST.Query.BindEvents($modal);
            $modal.addClass('STConditionDialog').data('target', $view[0]);
            ST.Query.Conditions.InitConditionsTable($modal.fastFind('.cond-table'));
        },

        AddGroup: function (ev) {
            var $view = $(this).closestView();

            var $condTree = $(this).closest('.cond-tree');
            var active = $condTree.fastFind('.active')[0] ||
                $condTree.fastFind('.condition-group').first()[0];
            var $activeGroup = $(active).closest('.condition-group');

            $activeGroup.children('i').remove();

            var $group = ich['ST.Query.Conditions.Group']({ '@TYPE': $(this).attr('data-type') });
            $group.contextMenu('ST.Query.Conditions.Group.ContextMenu');

            if (active) {
                $(active).trigger('click');
                $group.appendTo($activeGroup);
            }
            else {
                $group.trigger('click');
                $group.appendTo($condTree.fastFind('.tree'));
            }
            $group.trigger('initialize');

            ST.Query.CheckRootConditionButton($view);
            ST.Query.ApplyToView($view);
        },

        RemoveGroup: function (ev) {
            var el = this;
            var $view = $(el).closestView();

            ST.ShowConfirmation('This operation cannot be undone.  Do you still wish to delete this group and it\'s descendents?')
                .done(function () {
                    var activeGroup = $(el).closest('.condition-group')[0] ||
                        $(el).closest('.panel-conditions')
                            .fastFind('.tree .active')
                            .closest('.condition-group')[0];

                    if (activeGroup) {
                        $(activeGroup).parent().trigger('click');
                        $(activeGroup).remove();
                    }

                    ST.Query.CheckRootConditionButton($view);
                    ST.Query.ApplyToView($view);
                    ST.Query.UpdateParameters($view);
                });
        },

        SelectGroup: function (ev) {
            var $tree = $(this).closest('.tree');

            $tree.fastFind('.active').removeClass('active');
            $(this).addClass('active');

            var $content = $tree.closest('.panel-conditions').children('.content');
            $content.empty()
                // Do not show the group panel
                .addClass('hidden')
            //.removeClass('hidden')
            //.append(ich['ST.Query.Conditions.GroupDetail']())
            //.fastFind('input[type="radio"][value="' + this.getAttribute('data-type') + '"]')
            //.prop('checked', true)
            //.trigger('change');

            ev.stopPropagation();
        },

        ChangeGroupType: function (ev) {
            var $contextMenu = $(this).closest('.contextMenu');

            if ($contextMenu.length) {
                var parent = $contextMenu.data('parent');

                // close the context menu
                $contextMenu.remove();

                $(parent).closest('.condition-group')
                    .attr('data-type', this.getAttribute('data-type'));
            }
            else if (this.checked) {
                $(this).closest('.panel-conditions')
                    .find('> .cond-tree .active')
                    .closest('.condition-group')
                    .attr('data-type', this.value);
            }
        },

        AddCondition: function (ev, markActive, $replace) {
            var $modal = $('.modal.STConditionDialog');
            var $view = $(
                $modal.data('target') ||
                $(this).closestView()[0]
            );

            var $table = $(
                $modal.fastFind('.cond-table')[0] ||
                $view.fastFind('.cond-table')[0]
            );

            // Create a condition and it's element
            var cond = ST.Query.Conditions.GetCondition($table);

            if (cond.alias && cond.srcelement) {
                ST.Query.PreviousSelectedBO = cond.bo;

                var $cond = ich['ST.Query.Conditions.Condition'](cond)
                    .data('data', cond)

                // Append a condition to this group.
                if ($replace && $replace.length) {
                    $replace.replaceWith($cond);
                }
                else {
                    // get the active node
                    var $tree = $view.fastFind('.st-query-conditions .tree');
                    var $active = $(
                        $tree.fastFind('.active')[0] ||
                        $tree.fastFind('.condition-group')[0] ||
                        ich['ST.Query.Conditions.Group']({ '@TYPE': 'And' })
                            .contextMenu('ST.Query.Conditions.Group.ContextMenu')
                            .appendTo($tree)[0]
                    );

                    $active.closest('.condition-group')
                        .trigger('initialize')
                        .append($cond)
                        .children('i')
                        .remove();
                }

                ST.Query.CheckRootConditionButton($view);
                ST.Query.ApplyToView($view);

                $cond.trigger('initialize'); // initialize the click handler so ev.stopPropagation() will work

                if (markActive) {
                    $cond.addClass('active');
                }

                ST.Query.UpdateParameters($view);

                return $cond;
            }

            return $();
        },

        ClosePanel: function (ev) {
            var $this = $(this);
            setTimeout(function () {
                $this.closest('.content').addClass('hidden');
            }, 0);
        },

        UpdateCondition: function (ev) {
            var $view = $(this).closestView();
            var $active = $view.fastFind('.st-query-conditions .cond-tree .condition.active');

            if ($active.length) {
                var type = $active.closest('.condition-group').attr('data-type');
                var $cond = ST.Actions.Query.Conditions.AddCondition.call(this, ev, true, $active);
            }

            ST.Query.ApplyToView($view);
            ST.Query.UpdateParameters($view);
        },

        GetDisplayString: function () {
            var res = '[' + this.parentname + '.' + this.srcelement + '] ';

            if (this.not) {
                res += 'NOT ';
            }

            res += this.type_desc() + ' ';

            if (this.parentnameright) {
                res += '[' + this.parentnameright + '.' + this.srcelementright + '] ';
            }
            else if (this.paramname) {
                res += '@' + this.paramname;
            }
            else if (this.querystring) {
                res += '[QUERY]';
            }
            else {
                res += "'" + this.value + "'";
            }

            return res;
        },

        RemoveCondition: function (ev) {
            var $view = $(this).closestView();
            var active = $(this).closest('.condition')[0] ||
                $view.fastFind('.st-query-conditions .cond-tree .condition.active')[0];

            $(active).closest('.condition-group').trigger('click');
            $(active).remove();

            ST.Query.ApplyToView($view);
        },

        SelectCondition: function (ev) {
            var $tree = $(this).closest('.tree');
            var viewData = $tree.viewData();

            $tree.fastFind('.active').removeClass('active');
            $(this).addClass('active');

            var $content = $tree.closest('.panel-conditions')
                .children('.content')
                .removeClass('hidden')
                .empty()
                .append(ich['ST.Query.Conditions.ConditionDetail']({
                    IncludeParameter: !!viewData,
                    IncludeInnerSelect: !!viewData
                }));

            // Populate the condition table
            ST.Query.LoadConditionTable($(this).closestView(), $(this).data('data'));
            ev.stopPropagation();
        },

        _SelectObject: function (ev, $property) {
            const target = $(this).closest('.st-modal').data('target');
            const $view = $(target || this).closestView();
            const option = this.options[this.selectedIndex];
            const stQuery = queryData($view);

            if (option && $property.length) {
                const alias = option.getAttribute('data-alias');
                const boid = alias && stQuery.boData[alias].BOID;
                if (boid) {
                    ST.Query.Conditions.FillDropDown($property, $(option), boid);
                }
            }
        },

        SelectObject: function (ev) {
            ST.Actions.Query.Conditions._SelectObject.call(this, ev, $(this).closest('table').fastFind('select[name="property"]'));
        },

        SelectValueObject: function (ev) {
            ST.Actions.Query.Conditions._SelectObject.call(this, ev, $(this).closest('table').fastFind('select[name="value_property"]'));
        }
    });

    $.extend(Namespace('ST.Query.Sort'), {
        EnsureBlankRow: function ($view) {
            const stQuery = queryData($view);
            const $table = $view.fastFind('.st-query-sort tbody');

            // Remove an existing blank rows
            $table.fastFind('select[name="property"]')
                .filter(function () {
                    return $(this).val() == '';
                })
                .closest('tr')
                .remove();

            // Replace the row
            const properties = $view.fastFind('.st-query-columns .prop-table tbody > tr')
                .filter(function () {
                    return this.getAttribute('data-alias');
                })
                .map(function () {
                    var propData = $(this).data('data');
                    return {
                        '@ID': propData.ID,
                        '@SRCELEMENT': propData.Name,
                        '@ALIAS': propData.Alias,
                        '@PARENTID': stQuery.boData[propData.Alias].ID,
                        '@BO_NAME': stQuery.boData[propData.Alias].Name
                    };
                }).get();

            $table.append(ich['ST.Query.Sort.Row']({ PROPERTY: properties }));
        },

        AppendSortRow: function ($table, node) {
            ST.Query.Sort.EnsureBlankRow($table.closestView());

            var $tr = $table.fastFind('tr').last();
            $tr.attr('id', node.getAttribute('ID'));

            var alias = node.getAttribute('ALIAS');
            var srcElement = node.getAttribute('SRCELEMENT');
            $tr.fastFind('select[name="property"] option[data-alias="' + alias + '"][data-name="' + srcElement + '"]').prop('selected', true);

            var sortType = node.getAttribute('SORTTYPE') || 'Ascending';
            sortType = (sortType.toUpperCase().substr(0, 4) == 'DESC') ? 'Descending' : 'Ascending';
            $tr.fastFind('input[name="order"][value="' + sortType + '"]').prop('checked', true);
        }
    });

    $.extend(Namespace('ST.Actions.Query.Sort'), {
        PropertySelected: function (ev) {
            var $view = $(this).closestView();

            ST.Query.Sort.EnsureBlankRow($view);
            ST.Query.ApplyToView($view);
        },

        RemoveRow: function (ev) {
            var $view = $(this).closestView();
            $(this).closest('tr').remove();

            ST.Query.Sort.EnsureBlankRow($view);
            ST.Query.ApplyToView($view);
        },

        ChangeOrder: function (ev) {
            ST.Query.ApplyToView($(this).closestView());
        }
    });
})(jQuery, ko);

ST.RegisterXMLParser('.*?/REV_DATA_ROOT/QUERY', function (node) {
    var $view = $(this).closestView();
    var viewData = $view.viewData();

    if (viewData) {
        viewData.QueryNode = node;
        ST.Query.PrevQueryNode = node;

        //ST.Query.ClearColumns();
        var $boTree = $view.fastFind('.bo-tree .tree').first();
        if ($boTree.length) {
            $boTree.data('XMLNode', node);
            $boTree.empty();

            ST.Query.ParseNode($view, node);
        }
    }
    else {
        ST.QueryState(node);
    }
});

ST.RegisterXMLParser('.*?/QUERY_RESPONSE', function (node) {
    /* Do Nothing */
});

// Setup query filters
(function () {
    function ApplyFilter(input, $list) {
        var filterText = input.value;

        $list.removeClass('filtered');
        $list.children('.match').removeClass('match');
        if (filterText) {
            // Grab all of the elements that match the filter text and mark them as matches
            var re = new RegExp('(' + filterText + ')', 'i');
            var $matches = $list.children().filter(function () {
                var $name = $(
                    $(this).fastFind('.name')[0] || this
                );

                var text = $name.text();
                if (re.test(text)) {
                    $name.html(text.replace(re, '<span class="match-text">$1</span>'));
                    return true;
                }

                return false;
            })
            .addClass('match');

            // select the first match as active
            if ($matches.filter('.active').length == 0) {
                $matches.first()
                    .addClass('active')
                    .siblings()
                    .removeClass('active');
            }

            // set/unset filtered status
            $list.toggleClass('filtered', $matches.length > 0);
        }
    }

    function scrollIntoView(el) {
        var $sc = $(el).closest('.scrolling-container');
        var scOffset = $sc.offset();
        var offset = $(el).offset();

        if (offset.top < scOffset.top) {
            $sc.scrollTop(
                $sc.scrollTop() - (scOffset.top - offset.top)
            );
        }
        else {
            var elBottom = (offset.top + $(el).outerHeight());
            var scBottom = (scOffset.top + $sc.outerHeight());

            if (elBottom > scBottom) {
                $sc.scrollTop(
                    $sc.scrollTop() + (elBottom - scBottom)
                );
            }
        }
    }

    function SelectPrev($list) {
        var active = $list.children('.active')[0] ||
            $list.children('.match')[0] ||
            $list.children(':not(.break)')[0];

        var prev = $(active).prevAll('.match')[0] ||
            $(active).prevAll(':visible:not(.break)')[0] ||
            $list.children('.match')[0] ||
            $list.children(':not(.break)')[0];

        $(prev).addClass('active')
               .siblings()
               .removeClass('active');

        scrollIntoView(prev);
    }

    function SelectNext($list) {
        var active = $list.children('.active')[0] ||
            $list.children('.match')[0] ||
            $list.children(':visible:not(.break)')[0];

        var next = $(active).nextAll('.match')[0] ||
            $(active).nextAll(':visible:not(.break)')[0] ||
            $list.children('.match').last()[0] ||
            $list.children(':visible:not(.break)').last()[0];

        $(next).addClass('active')
               .siblings()
               .removeClass('active');

        scrollIntoView(next);
    }

    $.extend(Namespace('ST.Query'), {
        BindEvents: function ($view) {
            if ($view.prop('stQueryEventsBound')) {
                return;
            }
            $view.prop('stQueryEventsBound', true);

            // drag behavior for conditions
            $view.delegate('.st-query-conditions .cond-tree .condition', 'mouseenter', function (ev) {
                if (!$(this).hasClass('ui-draggable')) {
                    $(this).draggable({
                        //connectToSortable: '.condition-group',
                        revert: true,
                        helper: function (ev) {
                            return $(this).clone(true, true).removeClass('zero-height').css({
                                backgroundColor: '#dddddd',
                                opacity: .75,
                                zIndex: '1000'
                            });
                        },
                        start: function (ev, ui) {
                            $(this).addClass('zero-height');
                        },
                        stop: function (ev, ui) {
                            $(this).removeClass('zero-height').siblings('i').remove();

                            // Greedy sortables keep this event from bubbling up to the body element
                            // so we need to remove overlays.
                            ST.SetIFramesClickable(true);
                        }
                    });
                }
            });

            // Disable the condition type when adding parameters
            $view.delegate('.cond-table input[name="value_type"]', 'change', function (ev) {
                var $eqCells = $(this).closest('.cond-table').fastFind('.cond-equality > *');
                if (this.value === 'PARAM' && this.checked) {
                    // disable the type row
                    $eqCells.css('visibility', 'hidden');
                }
                else {
                    // enable the type row
                    $eqCells.css('visibility', '');
                }
            });

            // Hover behavior for condition groups, as well as drag/drop
            $view.delegate('.st-query-conditions .cond-tree .condition-group', 'mouseenter initialize', function (ev) {

                // Only highlight the inner-most group
                function updateHoveredGroups($tree) {
                    $tree.fastFind('.condition-group')
                        .removeClass('hovered')
                        .filter(function () { return this.hovered; })
                        .last()
                        .addClass('hovered');
                }

                if (!this.hoverInitialized) {
                    this.hoverInitialized = true;

                    $(this)
                        //.sortable({
                        //    delay: 250,
                        //    distance: 10,
                        //    items: '> div',
                        //    opacity: .75,
                        //    tolerance: 'pointer',
                        //    over: function (ev, ui) {
                        //        $(this).addClass('hovered');
                        //    },
                        //    out: function (ev, ui) {
                        //        $(this).removeClass('hovered');
                        //    },
                        //    stop: function (ev, ui) {
                        //        ui.item.removeAttr('style');
                        //    }
                        //})
                        .draggable({
                            appendTo: 'body',
                            helper: 'clone',
                            opacity: 0.7,
                            revert: true,
                            revertDuration: 0,
                            zIndex: 5000,
                            start: function (ev, ui) {
                                $(this).addClass('hidden');
                            },
                            stop: function (ev, ui) {
                                $(this).removeClass('hidden');
                            }
                        })
                        .droppable({
                            accept: '.condition-group,.condition',
                            greedy: true,
                            hoverClass: 'hovered',
                            tolerance: 'pointer',
                            over: function (ev, ui) {
                                //var $ph = ui.helper.clone().empty()
                                //.removeAttr('style')
                                //.css({
                                //    position: 'relative',
                                //    display: 'inline-block'
                                //});

                                //$ph.width(ui.helper.width());
                                //$ph.height(ui.helper.height());

                                //$ph.addClass('placeholder');
                                //$(this).append($ph);
                            },
                            out: function (ev, ui) {
                                //$(this).children('.placeholder').remove();
                            },
                            drop: function (ev, ui) {
                                //$(this).children('i').remove();
                                ui.helper.remove();
                                $(this).append(ui.draggable);

                                //var $ph = $(
                                //    $(this).children('.placeholder')[0] ||
                                //    this
                                //);

                                //$ph.replaceWith(ui.draggable);
                            }
                        })
                        .hover(
                            function (ev) {
                                this.hovered = true;
                                updateHoveredGroups($(this).closest('.tree'));
                            },
                            function (ev) {
                                this.hovered = false;
                                updateHoveredGroups($(this).closest('.tree'));
                            }
                        )
                        .trigger(ev.type);
                }
            });

            // Sort tab is selected
            $view.delegate('.REV_TAB_LABEL[data-guid="6008707F-50CE-4EC8-AFB1-A175D6006796"] > a', 'focus', function (ev) {
                var $view = $(this).closestView();

                ST.Query.Sort.EnsureBlankRow($view);
            });

            // Query tab is selected
            $view.delegate('.REV_TAB_LABEL[data-guid="256FEF24-7AAB-4214-BF5A-D755381CFB8E"] > a', 'focus', function (ev) {
                var $view = $(this).closestView();

                ST.Query.UpdateQueryText($view);
            });

            // Select the 'V' radio box when the value string input is selected
            $view.delegate('.cond-table [name="value_string"]', 'focus', function () {
                $(this).closest('tr')
                    .fastFind('input[name="value_type"][value="V"]')
                    .prop('checked', true)
                    .trigger('change');
            });

            // Select the 'P' radio box when the value object/property input is selected
            $view.delegate('.cond-table [name="value_object"], .cond-table [name="value_property"]', 'focus', function () {
                $(this).closest('tr')
                    .fastFind('input[name="value_type"][value="P"]')
                    .prop('checked', true)
                    .trigger('change');
            });

            // Select the 'PARAM' radio box when the parameter input is selected
            $view.delegate('.cond-table [name="paramname"], .cond-table [name="paramlabel"]', 'focus', function () {
                $(this).closest('tr')
                    .fastFind('input[name="value_type"][value="PARAM"]')
                    .prop('checked', true)
                    .trigger('change');
            });

            // Select the 'INNERSELECT' radio box when the parameter input is selected
            $view.delegate('.cond-table [name="innerselect"]', 'focus', function () {
                $(this).closest('tr')
                    .fastFind('input[name="value_type"][value="INNERSELECT"]')
                    .prop('checked', true)
                    .trigger('change');
            });

            // Handle List Paste and Drop
            function processMultiSearch(input, data) {
                var values = [];

                (data || '').split(/[,\n\t]/).forEach(function (v) {
                    if (v.trim()) {
                        values.push(v.trim());
                    }
                });

                if (values.length > 1) {
                    if (input) {
                        input.value = values.join(',');
                    }
                }

                return values.length > 1;
            }

            $view.delegate('.cond-table input[name="value_string"]', 'drop', function (ev) {
                var types = ev.originalEvent.dataTransfer.types;
                if (types.indexOf("text/plain") !== -1) {
                    if (processMultiSearch(this, ev.originalEvent.dataTransfer.getData("text/plain"))) {
                        ev.preventDefault();
                    }
                }
            });

            $view.delegate('.cond-table input[name="value_string"]', 'paste', function (ev) {
                var clipboardData = ev.originalEvent.clipboardData || window.clipboardData;
                if (clipboardData) {
                    if (processMultiSearch(this, clipboardData.getData('Text'))) {
                        ev.preventDefault();
                    }
                }
            });

            $view.delegate('.st-query-columns .filter', 'focus', function () {
                if (!this.filterInitialized) {
                    this.filterInitialized = true;

                    $(this).on('focus', function (ev) {
                        $(this).val('').trigger('keyup');
                    })
                        .on('keydown', function (ev) {
                            var $ul = $(this).closest('.panel-body').fastFind('.list > ul');
                            var code = (ev.keyCode ? ev.keyCode : ev.which);

                            switch (code) {
                                case ST.KeyCodes.UP:
                                    SelectPrev($ul);
                                    break;
                                case ST.KeyCodes.DOWN:
                                    SelectNext($ul);
                                    break;
                                case ST.KeyCodes.ENTER:
                                    $ul.fastFind('.active').trigger('click');
                                    break;
                            }
                        })
                        .on('keyup', function (ev) {
                            var $ul = $(this).closest('.panel-body').fastFind('.list > ul');
                            ApplyFilter(this, $ul);
                        });
                }
            });

            $view.filter('.SelectBO').delegate('.filter', 'focus', function () {
                if (!this.filterInitialized) {
                    this.filterInitialized = true;

                    $(this).on('focus', function (ev) {
                        $(this).val('').trigger('keyup');
                    })
                        .on('keydown', function (ev) {
                            var $ul = $(this).closest('.modal-body').fastFind('.bo-list');

                            switch (ev.which) {
                                case ST.KeyCodes.UP:
                                    SelectPrev($ul);
                                    break;
                                case ST.KeyCodes.DOWN:
                                    SelectNext($ul);
                                    break;
                                case ST.KeyCodes.ENTER:
                                    var active = $ul.fastFind('.active')[0];
                                    if (active) {
                                        ST.Actions.Query.SelectBO.call(active);
                                        ST.CloseModal();
                                    }
                                    break;
                            }
                        })
                        .on('keyup', function (ev) {
                            var $ul = $(this).closest('.modal-body').fastFind('.bo-list');

                            if ($ul[0].useSearch && $ul[0].prevFilter != this.value) {
                                var el = this;
                                var $modal = $ul.closest('.modal');

                                clearTimeout(this.searchTimer);
                                this.searchTimer = setTimeout(function () {
                                    ST.SendServerEvent(null, 'Query_Find_BusinessObjects', {
                                        '@FILTER': el.value
                                    })
                                        .done(function (node) {
                                            $ul[0].prevFilter = el.value;
                                            $modal.data('BONodeList', node.documentElement);

                                            ST.Actions.Query.UpdateBOList.call($modal[0], null);
                                            ApplyFilter(el, $ul);

                                            if (node.documentElement.getAttribute('HAS_MORE')) {
                                                $ul[0].$moreResultsButton = ich['ST.Query.BOList.MoreResults']();
                                                $ul.append($ul[0].$moreResultsButton);
                                            }
                                        });
                                }, 200);
                            }
                            else {
                                ApplyFilter(this, $ul);
                            }
                        });
                }
            });

            // Auto-select an object when clicked
            $view.filter('.SelectBO').delegate('div[data-action="Query.SetActive"]', 'click', function () {
                $(this).closest('.SelectBO').fastFind('.btn-primary').first().trigger('click');
            });

            $view.delegate('.st-query-columns .prop-table', 'mouseenter mouseover', function (ev) {
                if (!this.sortableInitialized) {
                    this.sortableInitialized = true;

                    var $view = $(this).closestView();
                    $(this).fastFind('tbody').first().sortable({
                        handle: '.handle',
                        helper: function (ev, ui) {
                            var $el = ui.clone().css({
                                display: 'inline-block',
                                position: 'absolute'
                            });

                            // Static widths for the rows
                            var $children = ui.children();
                            $el.children().each(function (idx) {
                                $(this).width($children.eq(idx).width());
                            });

                            return $el;
                        },
                        stop: function () {
                            ST.Query.ApplyToView($view);
                        }
                    });
                }
            });

            // Update the query after all changes to parameters
            $view.delegate('.st-query-parameters :input', 'change', function () {
                ST.Query.ApplyToView($(this).closestView());
            });

            // Update the query after all changes
            $view.delegate('.st-query-columns input, .st-query-columns select', 'change', function () {
                ST.Query.ApplyToView($(this).closestView());
            });

            $view.delegate('.bo-node .expander', 'mouseenter', function () {
                if (!this.treeInitialized) {
                    this.treeInitialized = true;

                    $(this).on('click', function (ev) {
                        $(this).closest('.bo-node').toggleClass('collapsed');
                        ev.stopPropagation();
                    });
                }
            });

            // Automatically update the current condition
            $view.delegate('.st-query-conditions .cond-table :input', 'change', function (ev) {
                var el = this;

                if (ev.originalEvent) {
                    clearTimeout(ST.Actions.Query.Conditions.UpdateConditionTimer);
                    ST.Actions.Query.Conditions.UpdateConditionTimer = setTimeout(function () {
                        ST.Actions.Query.Conditions.UpdateCondition.call(el, ev);
                    }, 100);
                }
            });
        }
    });
})();
/*
 * STX_JSChart.js
 *
 * This is a highly modified version of ChartNew.js
 * https://github.com/FVANCOP/ChartNew.js
 *
 * ChartNew.js is an adaptation of the chart.js source developped by Nick Downie (2013)
 * https://github.com/nnnick/Chart.js
 *
 */

// polyfill
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    }
};

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
};

function isIE() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1)
        ? parseInt(myNav.split('msie')[1])
        : myNav.indexOf('trident') != -1 ? 11 : false;
};

var charJSPersonalDefaultOptions = {};
var charJSPersonalDefaultOptionsLine = {};
var charJSPersonalDefaultOptionsRadar = {};
var charJSPersonalDefaultOptionsPolarArea = {};
var charJSPersonalDefaultOptionsPie = {};
var charJSPersonalDefaultOptionsDoughnut = {};
var charJSPersonalDefaultOptionsBar = {};
var charJSPersonalDefaultOptionsStackedBar = {};
var charJSPersonalDefaultOptionsHorizontalBar = {};
var charJSPersonalDefaultOptionsHorizontalStackedBar = {};

(function ($) {
    ///////// FUNCTIONS THAN CAN BE USED IN THE TEMPLATES ///////////////////////////////////////////

    function mergeObjectsRecursive(dstObj) {
        for (var a = 1; a < arguments.length; a++) {
            var obj = arguments[a];

            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if ($.isArray(obj[i])) {
                        dstObj[i] = $.merge([], obj[i]);
                    }
                    else if ($.isPlainObject(obj[i])) {
                        dstObj[i] = dstObj[i] || {};
                        mergeObjectsRecursive(dstObj[i], obj[i]);
                    }
                    else if (obj[i] && typeof obj[i] == 'object') {
                        dstObj[i] = Object.create(dstObj[i] || obj[i]);
                        mergeObjectsRecursive(dstObj[i], obj[i]);
                    }
                    else {
                        dstObj[i] = obj[i];
                    }
                }
            }
        }

        return dstObj;
    }

    function roundToWithThousands(config, num, place) {
        var newval = 1 * unFormat(config, num);
        if (typeof (newval) == "number" && place != "none") {
            if (place <= 0) {
                var roundVal = -place;
                newval = +(Math.round(newval + "e+" + roundVal) + "e-" + roundVal);
            } else {
                var roundVal = place;
                var divval = "1e+" + roundVal;
                newval = +(Math.round(newval / divval)) * divval;
            }
        }
        newval = fmtChartJS(config, newval, "none");
        return (newval);
    };

    function unFormat(config, num) {
        if ((config.decimalSeparator != "." || config.thousandSeparator != "") && typeof (num) == "string") {
            var v1 = "" + num;
            if (config.thousandSeparator != "") {
                while (v1.indexOf(config.thousandSeparator) >= 0) v1 = "" + v1.replace(config.thousandSeparator, "");
            }
            if (config.decimalSeparator != ".") v1 = "" + v1.replace(config.decimalSeparator, ".")
            return 1 * v1;
        } else {
            return num;
        }
    };

    function fmtChartJSPerso(config, value, fmt) {
        switch (fmt) {
            case "SampleJS_Format":
                if (typeof (value) == "number") return_value = "My Format : " + value.toString() + " $";
                else return_value = value + "XX";
                break;
            case "Change_Month":
                if (typeof (value) == "string") return_value = value.toString() + " 2014";
                else return_value = value.toString() + "YY";
                break;
            default:
                return_value = value;
                break;
        }
        return (return_value);
    };

    function fmtChartJS(config, value, fmt) {
        var return_value;
        if (fmt == "notformatted") {
            return_value = value;
        } else if (fmt == "none" && typeof (value) == "number") {
            if (config.roundNumber != "none") {
                if (config.roundNumber <= 0) {
                    var roundVal = -config.roundNumber;
                    value = +(Math.round(value + "e+" + roundVal) + "e-" + roundVal);
                } else {
                    var roundVal = config.roundNumber;
                    var divval = "1e+" + roundVal;
                    value = +(Math.round(value / divval)) * divval;
                }
            }
            if (config.decimalSeparator != "." || config.thousandSeparator != "") {
                return_value = value.toString().replace(/\./g, config.decimalSeparator);
                if (config.thousandSeparator != "") {
                    var part1 = return_value;
                    var part2 = "";
                    var posdec = part1.indexOf(config.decimalSeparator);
                    if (posdec >= 0) {
                        part2 = part1.substring(posdec + 1, part1.length);
                        part2 = part2.split('').reverse().join(''); // reverse string
                        part1 = part1.substring(0, posdec);
                    }
                    part1 = part1.toString().replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
                    // part2=part2.toString().replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
                    part2 = part2.split('').reverse().join(''); // reverse string
                    return_value = part1
                    if (part2 != "") return_value = return_value + config.decimalSeparator + part2;
                }
            } else return_value = value;
        } else if (fmt != "none" && fmt != "notformatted") {
            return_value = fmtChartJSPerso(config, value, fmt);
        } else {
            return_value = value;
        }
        return (return_value);
    };

    function addParameters2Function(data, fctName, fctList) {
        var mathFunctions = {
            mean: {
                data: data.data,
                datasetNr: data.v11
            },
            varianz: {
                data: data.data,
                datasetNr: data.v11
            },
            stddev: {
                data: data.data,
                datasetNr: data.v11
            },
            cv: {
                data: data.data,
                datasetNr: data.v11
            },
            median: {
                data: data.data,
                datasetNr: data.v11
            }
        };
        // difference to current value (v3)
        dif = false;
        if (fctName.substr(-3) == "Dif") {
            fctName = fctName.substr(0, fctName.length - 3);
            dif = true;
        }
        if (typeof eval(fctName) == "function") {
            var parameter = eval(fctList + "." + fctName);
            if (dif) {
                // difference between v3 (current value) and math function
                return data.v3 - window[fctName](parameter);
            }
            return window[fctName](parameter);
        }
        return;
    }
    //Is a number function

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    CanvasRenderingContext2D.prototype.fillTextMultiLine = function (text, x, y, yLevel, lineHeight) {
        var lines = ("" + text).split("\n");
        // if its one line => in the middle 
        // two lines one above the mid one below etc.	
        if (yLevel == "middle") {
            y -= ((lines.length - 1) / 2) * lineHeight;
        } else if (yLevel == "bottom") { // default
            y -= (lines.length - 1) * lineHeight;
        }
        for (var i = 0; i < lines.length; i++) {
            this.fillText(lines[i], x, y);
            y += lineHeight;
        }
    }
    CanvasRenderingContext2D.prototype.measureTextMultiLine = function (text, lineHeight) {
        var textWidth = 0;
        var lg;
        var lines = ("" + text).split("\n");
        var textHeight = lines.length * lineHeight;
        // if its one line => in the middle 
        // two lines one above the mid one below etc.	
        for (var i = 0; i < lines.length; i++) {
            lg = this.measureText(lines[i]).width;
            if (lg > textWidth) textWidth = lg;
        }
        return {
            textWidth: textWidth,
            textHeight: textHeight
        };
    }
    cursorDivCreated = false;

    function createCursorDiv() {
        if (cursorDivCreated == false) {
            var div = document.createElement('divCursor');
            div.id = 'divCursor';
            div.style.position = 'absolute';
            div.style.zIndex = 5000;
            document.body.appendChild(div);
            cursorDivCreated = true;
        }
    };
    function checkBrowser() {
        this.ver = navigator.appVersion
        this.dom = document.getElementById ? 1 : 0
        this.ie5 = (this.ver.indexOf("MSIE 5") > -1 && this.dom) ? 1 : 0;
        this.ie4 = (document.all && !this.dom) ? 1 : 0;
        this.ns5 = (this.dom && parseInt(this.ver) >= 5) ? 1 : 0;
        this.ns4 = (document.layers && !this.dom) ? 1 : 0;
        this.bw = (this.ie5 || this.ie4 || this.ns4 || this.ns5)
        return this
    };
    bw = new checkBrowser();

    function mergeChartConfig(defaults, userDefined) {
        var returnObj = {};
        for (var attrname in defaults) {
            returnObj[attrname] = defaults[attrname];
        }
        for (var attrname in userDefined) {
            returnObj[attrname] = userDefined[attrname];
        }
        return returnObj;
    };

    function saveCanvas(ctx, data, config, tpgraph) {
        cvSave = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var saveCanvasConfig = {
            savePng: false,
            annotateDisplay: false,
            animation: false,
            dynamicDisplay: false
        };
        var savePngConfig = mergeChartConfig(config, saveCanvasConfig);
        savePngConfig.clearRect = false;
        /* And ink them */
        switch (tpgraph) {
            case "Bar":
                new Chart(ctx.canvas.getContext("2d")).Bar(data, savePngConfig);
                break;
            case "Pie":
                new Chart(ctx.canvas.getContext("2d")).Pie(data, savePngConfig);
                break;
            case "Doughnut":
                new Chart(ctx.canvas.getContext("2d")).Doughnut(data, savePngConfig);
                break;
            case "Radar":
                new Chart(ctx.canvas.getContext("2d")).Radar(data, savePngConfig);
                break;
            case "PolarArea":
                new Chart(ctx.canvas.getContext("2d")).PolarArea(data, savePngConfig);
                break;
            case "HorizontalBar":
                new Chart(ctx.canvas.getContext("2d")).HorizontalBar(data, savePngConfig);
                break;
            case "StackedBar":
                new Chart(ctx.canvas.getContext("2d")).StackedBar(data, savePngConfig);
                break;
            case "HorizontalStackedBar":
                new Chart(ctx.canvas.getContext("2d")).HorizontalStackedBar(data, savePngConfig);
                break;
            case "Line":
                new Chart(ctx.canvas.getContext("2d")).Line(data, savePngConfig);
                break;
        }
        if (config.savePngOutput == "NewWindow") {
            var image = ctx.canvas.toDataURL();
            ctx.putImageData(cvSave, 0, 0);
            window.open(image, '_blank');
        }
        if (config.savePngOutput == "CurrentWindow") {
            var image = ctx.canvas.toDataURL();
            ctx.putImageData(cvSave, 0, 0);
            window.location.href = image;
        }
        if (config.savePngOutput == "Save") {
            //          document.location.href= ctx.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            //          ctx.putImageData(cvSave,0,0); 
            var image = ctx.canvas.toDataURL();
            var downloadLink = document.createElement("a");
            downloadLink.href = image;
            downloadLink.download = config.savePngName + ".png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    //if (isIE() < 9 && isIE() != false) {
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        }
    };
    //};
    var dynamicDisplay = new Array();
    var dynamicDisplayList = new Array();

    function dynamicFunction(data, config, ctx, tpgraph) {
        if (config.dynamicDisplay) {
            if (ctx.canvas.id == "") {
                var cvdate = new Date();
                var cvmillsec = cvdate.getTime();
                ctx.canvas.id = "Canvas_" + cvmillsec;
            }
            if (typeof (dynamicDisplay[ctx.canvas.id]) == "undefined") {
                dynamicDisplayList[dynamicDisplayList["length"]] = ctx.canvas.id;
                dynamicDisplay[ctx.canvas.id] = [ctx.canvas, false, false, data, config, ctx.canvas, tpgraph];
                dynamicDisplay[ctx.canvas.id][1] = isScrolledIntoView(ctx.canvas);
                window.onscroll = scrollFunction;
            }
            if (dynamicDisplay[ctx.canvas.id][1] == false || dynamicDisplay[ctx.canvas.id][2] == true) return false;
            dynamicDisplay[ctx.canvas.id][2] = true;
        }
        return true;
    };

    function isScrolledIntoView(element) {
        var xPosition = 0;
        var yPosition = 0;
        elem = element;
        while (elem) {
            xPosition += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
            yPosition += (elem.offsetTop - elem.scrollTop + elem.clientTop);
            elem = elem.offsetParent;
        }
        if (xPosition + element.width / 2 >= window.pageXOffset &&
            xPosition + element.width / 2 <= window.pageXOffset + window.innerWidth &&
            yPosition + element.height / 2 >= window.pageYOffset &&
            yPosition + element.height / 2 <= window.pageYOffset + window.innerHeight
        ) return (true);
        else return false;
    };

    function scrollFunction() {
        for (var i = 0; i < dynamicDisplayList["length"]; i++) {
            if (isScrolledIntoView(dynamicDisplay[dynamicDisplayList[i]][5]) && dynamicDisplay[dynamicDisplayList[i]][2] == false) {
                dynamicDisplay[dynamicDisplayList[i]][1] = true;
                switch (dynamicDisplay[dynamicDisplayList[i]][6]) {
                    case "Bar":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).Bar(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "Pie":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).Pie(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "Doughnut":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).Doughnut(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "Radar":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).Radar(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "PolarArea":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).PolarArea(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "HorizontalBar":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).HorizontalBar(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "StackedBar":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).StackedBar(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "HorizontalStackedBar":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).HorizontalStackedBar(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                    case "Line":
                        new Chart(document.getElementById(dynamicDisplayList[i]).getContext("2d")).Line(dynamicDisplay[dynamicDisplayList[i]][3], dynamicDisplay[dynamicDisplayList[i]][4]);
                        break;
                }
            }
        }
    };
    var jsGraphAnnotate = new Array();

    function clearAnnotate(ctxid) {
        jsGraphAnnotate[ctxid] = [];
    };

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();

        return {
            x: (evt.clientX - rect.left),
            y: (evt.clientY - rect.top)
        }
    };

    var cachebis = {};

    function doMouseAction(config, ctx, event, data, action, funct) {
        //Set these variables:
        fromLeft = 10; // How much from the left of the cursor should the div be?
        fromTop = 10; // How much from the top of the cursor should the div be?

        function tmplbis(str, data) {
            var mathFunctionList = ["mean", "varianz", "stddev", "cv", "median"];
            var regexMath = new RegExp('<%=((?:(?:.*?)\\W)??)((?:' + mathFunctionList.join('|') + ')(?:Dif)?)\\(([0-9]*?)\\)(.*?)%>', 'g');
            while (regexMath.test(str)) {
                str = str.replace(regexMath, function ($0, $1, $2, $3, $4) {
                    if ($3) {
                        var rndFac = $3;
                    } else {
                        var rndFac = 2;
                    }
                    var value = addParameters2Function(data, $2, "mathFunctions");
                    if (isNumber(value)) {
                        return '<%=' + $1 + '' + Math.round(Math.pow(10, rndFac) * value) / Math.pow(10, rndFac) + '' + $4 + '%>';
                    }
                    return '<%= %>';
                });
            }
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            // first check if it's can be an id
            var fn = /^[A-Za-z][-A-Za-z0-9_:.]*$/.test(str) ? cachebis[str] = cachebis[str] ||
                tmplbis(document.getElementById(str).innerHTML) :
                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +
                    // Introduce the data as local variables using with(){}
                    "with(obj){p.push('" +
                    // Convert the template into pure JavaScript
                    str
                    .replace(/[\r\n]/g, "\\n")
                    .replace(/[\t]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t").join("');")
                    .split("%>").join("p.push('")
                    .split("\r").join("\\'") + "');}return p.join('');");
            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        };

        function cursorInit() {
            scrolled = bw.ns4 || bw.ns5 ? "window.pageYOffset" : "document.body.scrollTop"
            if (bw.ns4) document.captureEvents(Event.MOUSEMOVE)
        };

        function makeCursorObj(obj, nest) {
            createCursorDiv();
            nest = (!nest) ? '' : 'document.' + nest + '.'
            this.css = bw.dom ? document.getElementById(obj).style : bw.ie4 ? document.all[obj].style : bw.ns4 ? eval(nest + "document.layers." + obj) : 0;
            this.moveIt = b_moveIt;
            cursorInit();
            return this
        };

        function b_moveIt(x, y) {
            this.x = x;
            this.y = y;
            this.css.left = this.x + "px";
            this.css.top = this.y + "px";
        };

        if (action == "annotate") {
            var annotateDIV = document.getElementById('divCursor');
            show = false;
            onData = false;
            annotateDIV.className = (config.annotateClassName) ? config.annotateClassName : '';
            annotateDIV.style.border = (config.annotateClassName) ? '' : config.annotateBorder;
            annotateDIV.style.padding = (config.annotateClassName) ? '' : config.annotatePadding;
            annotateDIV.style.borderRadius = (config.annotateClassName) ? '' : config.annotateBorderRadius;
            annotateDIV.style.backgroundColor = (config.annotateClassName) ? '' : config.annotateBackgroundColor;
            annotateDIV.style.color = (config.annotateClassName) ? '' : config.annotateFontColor;
            annotateDIV.style.fontFamily = (config.annotateClassName) ? '' : config.annotateFontFamily;
            annotateDIV.style.fontSize = (config.annotateClassName) ? '' : config.annotateFontSize + "pt";
            annotateDIV.style.fontStyle = (config.annotateClassName) ? '' : config.annotateFontStyle;
        }
        if (action == "annotate") {
            show = false;
            annotateDIV.style.display = show ? '' : 'none';
        }
        canvas_pos = getMousePos(ctx.canvas, event);
        for (i = 0; i < jsGraphAnnotate[ctx.ChartNewId]["length"]; i++) {
            if (jsGraphAnnotate[ctx.ChartNewId][i][0] == "ARC") {
                distance = Math.sqrt((canvas_pos.x - jsGraphAnnotate[ctx.ChartNewId][i][1]) * (canvas_pos.x - jsGraphAnnotate[ctx.ChartNewId][i][1]) + (canvas_pos.y - jsGraphAnnotate[ctx.ChartNewId][i][2]) * (canvas_pos.y - jsGraphAnnotate[ctx.ChartNewId][i][2]));
                if (distance > jsGraphAnnotate[ctx.ChartNewId][i][3] && distance < jsGraphAnnotate[ctx.ChartNewId][i][4]) {
                    angle = Math.acos((canvas_pos.x - jsGraphAnnotate[ctx.ChartNewId][i][1]) / distance);
                    if (canvas_pos.y < jsGraphAnnotate[ctx.ChartNewId][i][2]) angle = -angle;
                    while (angle < 0) {
                        angle += 2 * Math.PI;
                    }
                    while (angle > 2 * Math.PI) {
                        angle -= 2 * Math.PI;
                    }
                    if (angle < config.startAngle * (Math.PI / 360)) angle += 2 * Math.PI;
                    if ((angle > jsGraphAnnotate[ctx.ChartNewId][i][5] && angle < jsGraphAnnotate[ctx.ChartNewId][i][6]) || (angle > jsGraphAnnotate[ctx.ChartNewId][i][5] - 2 * Math.PI && angle < jsGraphAnnotate[ctx.ChartNewId][i][6] - 2 * Math.PI) || (angle > jsGraphAnnotate[ctx.ChartNewId][i][5] + 2 * Math.PI && angle < jsGraphAnnotate[ctx.ChartNewId][i][6] + 2 * Math.PI)) {
                        v1 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][7], config.fmtV1); // V1=Label
                        v2 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][8], config.fmtV2); // V2=Data Value
                        v3 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][9], config.fmtV3); // V3=Cumulated Value
                        v4 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][10], config.fmtV4); // V4=Total Data Value
                        v5 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][11], config.fmtV5); // V5=Angle
                        v6 = fmtChartJS(config, 100 * jsGraphAnnotate[ctx.ChartNewId][i][8] / jsGraphAnnotate[ctx.ChartNewId][i][10], config.fmtV6); // v6=Percentage;
                        v6 = roundToWithThousands(config, v6, config.roundPct);
                        v7 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][1], config.fmtV7); // v7=midPointX of arc;
                        v8 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][2], config.fmtV8); // v8=midPointY of arc;
                        v9 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][3], config.fmtV9); // v9=radius Minimum;
                        v10 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][4], config.fmtV10); // v10=radius Maximum;
                        v11 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][5], config.fmtV11); // v11=start angle;
                        v12 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][6], config.fmtV12); // v12=stop angle;
                        v13 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][12], config.fmtV13); // v13=position in Data;
                        graphPosX = canvas_pos.x;
                        graphPosY = canvas_pos.y;
                        onData = true;
                        if (action == "annotate") {
                            dispString = tmplbis(config.annotateLabel, {
                                config: config,
                                v1: v1,
                                v2: v2,
                                v3: v3,
                                v4: v4,
                                v5: v5,
                                v6: v6,
                                v7: v7,
                                v8: v8,
                                v9: v9,
                                v10: v10,
                                v11: v11,
                                v12: v12,
                                v13: v13,
                                graphPosX: graphPosX,
                                graphPosY: graphPosY
                            });
                            annotateDIV.innerHTML = dispString;
                            show = true;
                        } else {
                            funct(event, ctx, config, data, {
                                v1: v1,
                                v2: v2,
                                v3: v3,
                                v4: v4,
                                v5: v5,
                                v6: v6,
                                v7: v7,
                                v8: v8,
                                v9: v9,
                                v10: v10,
                                v11: v11,
                                v12: v12,
                                v13: v13,
                                graphPosX: graphPosX,
                                graphPosY: graphPosY
                            });
                        }
                        if (action == "annotate") {
                            x = bw.ns4 || bw.ns5 ? event.pageX : event.x;
                            y = bw.ns4 || bw.ns5 ? event.pageY : event.y;
                            if (bw.ie4 || bw.ie5) y = y + eval(scrolled);
                            oCursor.moveIt(x + fromLeft, y + fromTop);
                        }
                    }
                }
            } else if (jsGraphAnnotate[ctx.ChartNewId][i][0] == "RECT") {
                if (canvas_pos.x > jsGraphAnnotate[ctx.ChartNewId][i][1] && canvas_pos.x < jsGraphAnnotate[ctx.ChartNewId][i][3] && canvas_pos.y < jsGraphAnnotate[ctx.ChartNewId][i][2] && canvas_pos.y > jsGraphAnnotate[ctx.ChartNewId][i][4]) {
                    v1 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][5], config.fmtV1); // V1=Label1
                    v2 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][6], config.fmtV2); // V2=Label2
                    v3 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][7], config.fmtV3); // V3=Data Value
                    v4 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][8], config.fmtV4); // V4=Cumulated Value
                    v5 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][9], config.fmtV5); // V5=Total Data Value
                    v6 = fmtChartJS(config, 100 * jsGraphAnnotate[ctx.ChartNewId][i][7] / jsGraphAnnotate[ctx.ChartNewId][i][9], config.fmtV6); // v6=Percentage;
                    v6 = roundToWithThousands(config, v6, config.roundPct);
                    v7 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][1], config.fmtV7); // v7=top X of rectangle;
                    v8 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][2], config.fmtV8); // v8=top Y of rectangle;
                    v9 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][3], config.fmtV9); // v9=bottom X of rectangle;
                    v10 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][4], config.fmtV10); // v10=bottom Y of rectangle;
                    v11 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][10], config.fmtV11); // v11=position in Dataset;
                    v12 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][11], config.fmtV12); // v12=position in Dataset[v11].Data;
                    graphPosX = canvas_pos.x;
                    graphPosY = canvas_pos.y;
                    onData = true;
                    if (action == "annotate") {
                        dispString = tmplbis(config.annotateLabel, {
                            config: config,
                            v1: v1,
                            v2: v2,
                            v3: v3,
                            v4: v4,
                            v5: v5,
                            v6: v6,
                            v7: v7,
                            v8: v8,
                            v9: v9,
                            v10: v10,
                            v11: v11,
                            v12: v12,
                            graphPosX: graphPosX,
                            graphPosY: graphPosY,
                            data: data
                        });
                        annotateDIV.innerHTML = dispString;
                        show = true;
                    } else {
                        funct(event, ctx, config, data, {
                            v1: v1,
                            v2: v2,
                            v3: v3,
                            v4: v4,
                            v5: v5,
                            v6: v6,
                            v7: v7,
                            v8: v8,
                            v9: v9,
                            v10: v10,
                            v11: v11,
                            v12: v12,
                            graphPosX: graphPosX,
                            graphPosY: graphPosY
                        });
                    }
                    if (action == "annotate") {
                        x = bw.ns4 || bw.ns5 ? event.pageX : event.x;
                        y = bw.ns4 || bw.ns5 ? event.pageY : event.y;
                        if (bw.ie4 || bw.ie5) y = y + eval(scrolled);
                        oCursor.moveIt(x + fromLeft, y + fromTop);
                    }
                }
            } else if (jsGraphAnnotate[ctx.ChartNewId][i][0] == "POINT") {
                distance = Math.sqrt((canvas_pos.x - jsGraphAnnotate[ctx.ChartNewId][i][1]) * (canvas_pos.x - jsGraphAnnotate[ctx.ChartNewId][i][1]) + (canvas_pos.y - jsGraphAnnotate[ctx.ChartNewId][i][2]) * (canvas_pos.y - jsGraphAnnotate[ctx.ChartNewId][i][2]));
                if (distance < 10) {
                    v1 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][3], config.fmtV1); // V1=Label1
                    v2 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][4], config.fmtV2); // V2=Label2
                    v3 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][5], config.fmtV3); // V3=Data Value
                    v4 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][6], config.fmtV4); // V4=Difference with Previous line
                    v5 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][7], config.fmtV5); // V5=Difference with next line;
                    v6 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][8], config.fmtV6); // V6=max;
                    v7 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][9], config.fmtV7); // V7=Total;
                    v8 = fmtChartJS(config, 100 * jsGraphAnnotate[ctx.ChartNewId][i][5] / jsGraphAnnotate[ctx.ChartNewId][i][9], config.fmtV8); // v8=percentage;
                    v8 = roundToWithThousands(config, v8, config.roundPct);
                    v9 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][1], config.fmtV9); // v9=pos X of point;
                    v10 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][2], config.fmtV10); // v10=pos Y of point;
                    v11 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][10], config.fmtV11); // v11=position in Dataset;
                    v12 = fmtChartJS(config, jsGraphAnnotate[ctx.ChartNewId][i][11], config.fmtV12); // v12=position in Dataset[v11].Data;
                    graphPosX = canvas_pos.x;
                    graphPosY = canvas_pos.y;
                    onData = true;
                    if (action == "annotate") {
                        dispString = tmplbis(config.annotateLabel, {
                            config: config,
                            v1: v1,
                            v2: v2,
                            v3: v3,
                            v4: v4,
                            v5: v5,
                            v6: v6,
                            v7: v7,
                            v8: v8,
                            v9: v9,
                            v10: v10,
                            v11: v11,
                            v12: v12,
                            graphPosX: graphPosX,
                            graphPosY: graphPosY,
                            data: data
                        });
                        annotateDIV.innerHTML = dispString;
                        show = true;
                    } else {
                        funct(event, ctx, config, data, {
                            v1: v1,
                            v2: v2,
                            v3: v3,
                            v4: v4,
                            v5: v5,
                            v6: v6,
                            v7: v7,
                            v8: v8,
                            v9: v9,
                            v10: v10,
                            v11: v11,
                            v12: v12,
                            graphPosX: graphPosX,
                            graphPosY: graphPosY
                        });
                    }
                    if (action == "annotate") {
                        x = bw.ns4 || bw.ns5 ? event.pageX : event.x;
                        y = bw.ns4 || bw.ns5 ? event.pageY : event.y;
                        if (bw.ie4 || bw.ie5) y = y + eval(scrolled);
                        oCursor.moveIt(x + fromLeft, y + fromTop);
                    }
                }
            }
            if (action == "annotate") {
                annotateDIV.style.display = show ? '' : 'none';
            }
        }
        if (onData == false && action != "annotate") {
            funct(event, ctx, config, data, null);
        }
    };

    function ChartSegment(ctx, fillColor, strokeColor, strokeWidth) {
        var segment = this;

        $.extend(this, {
            children: [],

            ctx: ctx,
            highlight: false,
            fillColor: fillColor || '#cccccc',
            strokeColor: strokeColor || '#aaaaaa',
            strokeWidth: strokeWidth || 0,
        });
    }

    ChartSegment.prototype = {
        addText: function (textSegment, hAlign, bHInside, vAlign, bVInside) { },
        pointIsInside: function (x, y) { },
        drawShape: function () { },

        draw: function (animPc, argsToAnimate) {
            // Temporarily set the arguments
            var tmp = {};
            if (argsToAnimate) {
                for (var i = 0; i < argsToAnimate.length; i++) {
                    var arg = argsToAnimate[i];
                    tmp[arg] = this[arg];

                    this[arg] = this[arg] * animPc;
                }
            }

            this.ctx.save();
            this.initContext();
            this.drawShape(animPc);
            this.ctx.restore();

            // Put the original values back the way we found them
            if (argsToAnimate) {
                for (var i = 0; i < argsToAnimate.length; i++) {
                    var arg = argsToAnimate[i];
                    this[arg] = tmp[arg];
                }
            }

            this.drawChildren(animPc);
        },

        drawChildren: function (animPc) {
            this.children.forEach(function (child) {
                child.draw(animPc);
            });
        },

        initContext: function () {
            this.ctx.fillStyle = this.fillColor;

            this.ctx.lineWidth = this.strokeWidth;
            this.ctx.strokeStyle = this.strokeColor;
        },

        TextSegment: function (text, x, y, font, angle, padding, params) {
            this.pointIsInside = function (mx, my) {
                return false;
            };

            this.drawShape = function (animPc) {
                var undef;

                if (params) {
                    for (var i in params) {
                        this.ctx[i] = params[i];
                    }
                }

                if (animPc === undef || animPc >= 1) {
                    this.ctx.font = font;
                    this.ctx.fillStyle = params.fillStyle || '#000000';
                    this.ctx.translate(x, this.ctx.canvas.height - y);
                    this.ctx.rotate(angle);

                    text = ST.StripHTMLMarkup(text, true);

                    if (text.indexOf('\n') == -1) {
                        this.ctx.fillText(text, 0, 0);
                    }
                    else {
                        this.ctx.fillTextMultiLine(text, 0, 0, this.ctx.textBaseline, this.ctx.fontSize || parseInt(this.ctx.font.split(' ')[0]));
                    }
                }
            };

            return this;
        },

        LineSegment: function (startX, startY, endX, endY, endColor) {
            this.lengthX = endX - startX;
            this.lengthY = endY - startY;

            this.pointIsInside = function (x, y) {
                //this.ctx.save();
                //this.ctx.strokeWidth = this.ctx.strokeWidth || 1;

                //this.ctx.beginPath();
                //this.ctx.moveTo(startX - this.ctx.strokeWidth, this.ctx.canvas.height - startY + this.ctx.strokeWidth);
                //this.ctx.lineTo(startX + this.lengthX - this.ctx.strokeWidth, this.ctx.canvas.height - (startY + this.lengthY) + this.ctx.strokeWidth);
                //this.ctx.lineTo(startX + this.lengthX + this.ctx.strokeWidth, this.ctx.canvas.height - (startY + this.lengthY) - this.ctx.strokeWidth);
                //this.ctx.lineTo(startX + this.ctx.strokeWidth, this.ctx.canvas.height - startY - this.ctx.strokeWidth);
                //this.ctx.lineTo(startX - this.ctx.strokeWidth, this.ctx.canvas.height - startY + this.ctx.strokeWidth);
                //this.ctx.closePath();

                //var res = this.ctx.isPointInPath(x, y);
                //this.ctx.restore();

                //return res;
            };

            this.drawShape = function (animPc) {
                var grad = this.ctx.createLinearGradient(startX, this.ctx.canvas.height - startY, endX, this.ctx.canvas.height - endY);
                if (this.highlight) {
                    var color = new tinycolor(this.fillColor);
                    if (color.isDark()) {
                        color.lighten(20);
                    }
                    else {
                        color.darken(10);
                    }

                    grad.addColorStop(0, color.toHexString());
                    if (endColor) {
                        var color = new tinycolor(endColor);
                        if (color.isDark()) {
                            color.lighten(20);
                        }
                        else {
                            color.darken(10);
                        }

                        grad.addColorStop(1, color.toHexString());
                    }
                }
                else {
                    grad.addColorStop(0, this.fillColor);
                    if (endColor) {
                        grad.addColorStop(1, endColor);
                    }
                }

                this.ctx.strokeStyle = grad;
                this.ctx.strokeWidth = this.ctx.strokeWidth || 1;

                this.ctx.beginPath();
                this.ctx.moveTo(startX, this.ctx.canvas.height - startY);
                this.ctx.lineTo(startX + this.lengthX, this.ctx.canvas.height - (startY + this.lengthY));
                this.ctx.closePath();

                this.ctx.stroke();
            };

            return this;
        },

        CircleSegment: function (midX, midY, radius, padding) {
            padding = padding || 0;
            this.radius = radius;

            this.pointIsInside = function (x, y) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(midX, this.ctx.canvas.height - midY, this.radius + padding, 0, Math.PI * 2, false);
                this.ctx.closePath();

                var res = this.ctx.isPointInPath(x, y);
                this.ctx.restore();

                return res;
            };

            this.drawShape = function (animPc) {
                this.ctx.beginPath();
                this.ctx.arc(midX, this.ctx.canvas.height - midY, this.radius, 0, Math.PI * 2, false);
                this.ctx.closePath();
                this.ctx.fill();

                if (this.strokeWidth) {
                    this.ctx.stroke();
                }
            };

            return this;
        },

        ArcSegment: function (midX, midY, innerRadius, outerRadius, startAngle, stopAngle, bAnimateDelta) {
            this.innerRadius = innerRadius;
            this.outerRadius = outerRadius;
            this.startAngle = startAngle;
            this.stopAngle = stopAngle;
            this.angleDelta = stopAngle - startAngle;

            this.pointIsInside = function (x, y) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, this.outerRadius, this.startAngle, this.stopAngle, false);
                this.ctx.arc(midX, midY, this.innerRadius, this.stopAngle, this.startAngle, true);
                this.ctx.closePath();

                var res = this.ctx.isPointInPath(x, y);
                this.ctx.restore();

                return res;
            };

            this.drawShape = function (animPc) {
                this.ctx.beginPath();
                var stopAngle = (bAnimateDelta) ? this.startAngle + this.angleDelta : this.stopAngle;
                this.ctx.arc(midX, midY, this.outerRadius, this.startAngle, stopAngle, false);
                this.ctx.arc(midX, midY, this.innerRadius, stopAngle, this.startAngle, true);
                this.ctx.closePath();

                this.ctx.fill();

                if (this.strokeWidth) {
                    this.ctx.stroke();
                }
            }

            return this;
        },

        RectSegment: function (x, y, w, h) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;

            function inRange(val, a, b) {
                return val > Math.min(a, b) && val <= Math.max(a, b);
            }

            this.pointIsInside = function (mx, my) {
                return inRange(mx, this.x, this.x + this.width) &&
                       inRange(my, this.ctx.canvas.height - this.y, this.ctx.canvas.height - this.y - this.height);
            };

            this.drawShape = function (animPc) {
                // Render the rectangle
                var yPos = this.ctx.canvas.height - this.y;
                this.ctx.beginPath();
                this.ctx.moveTo(this.x, yPos);
                this.ctx.lineTo(this.x, yPos - this.height);
                this.ctx.lineTo(this.x + this.width, yPos - this.height);
                this.ctx.lineTo(this.x + this.width, yPos);
                this.ctx.closePath();

                this.ctx.fill();

                if (this.strokeWidth) {
                    this.ctx.stroke();
                }
            };

            return this;
        },

        Button: function (x, y, w, h, font, label) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;

            var textSegment = new ChartSegment(this.ctx, '#ffffff', '#888888', 0).TextSegment(
                label,
                x + (w / 2),
                y + (h / 2),
                font,
                0, 0,
                {
                    fillStyle: new tinycolor(this.fillColor).isDark() ? '#ffffff' : '#000000',
                    textAlign: 'center',
                    textBaseline: 'middle'
                }
            );
            this.children.push(textSegment);

            function inRange(val, a, b) {
                return val > Math.min(a, b) && val <= Math.max(a, b);
            }

            this.pointIsInside = function (mx, my) {
                return inRange(mx, this.x, this.x + this.width) &&
                       inRange(my, this.ctx.canvas.height - this.y, this.ctx.canvas.height - this.y - this.height);
            };

            this.drawShape = function (animPc) {
                // Render the rectangle
                var yPos = this.ctx.canvas.height - this.y;
                this.ctx.beginPath();
                this.ctx.moveTo(this.x, yPos);
                this.ctx.lineTo(this.x, yPos - this.height);
                this.ctx.lineTo(this.x + this.width, yPos - this.height);
                this.ctx.lineTo(this.x + this.width, yPos);
                this.ctx.closePath();

                this.ctx.fill();

                if (this.strokeWidth) {
                    this.ctx.stroke();
                }
            };

            return this;
        }
    };

    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * If you omit the last three params, it will draw a rectangle
     * outline with a 5 pixel border radius
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     * @param {Number} [radius = 5] The corner radius; It can also be an object 
     *                 to specify different radii for corners
     * @param {Number} [radius.tl = 0] Top left
     * @param {Number} [radius.tr = 0] Top right
     * @param {Number} [radius.br = 0] Bottom right
     * @param {Number} [radius.bl = 0] Bottom left
     * @param {Boolean} [fill = false] Whether to fill the rectangle.
     * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
     */
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == 'undefined') {
            stroke = true;
        }

        if (typeof radius === 'undefined') {
            radius = 5;
        }

        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }
        else {
            var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    function contextFont(family, style, size) {
        $.extend(this, {
            family: family || 'arial',
            style: style || '#888',
            size: size || 12,

            toString: function () {
                return this.size + "px " + this.family;
            }
        });
    }

    var legendDefaultOptions = {
        rect: null,
        labels: [],
        colors: [],
        bgColor: null,
        border: 0,
        borderColor: 'rgba(128,128,128,0.4)',
        font: new contextFont('arial', '#888', 12),
        padding: 5,
        margin: 5,
        layout: 'vertical', // 'vertical', 'horizontal'
        vAlign: 'center', // 'top', 'center', 'bottom'
        hAlign: 'right' // 'left', 'center', 'right'
    };

    function getMaxLabelWidth(ctx, labels, font) {
        var maxLabelWidth = 0;
        var originalFont = ctx.font;

        ctx.font = font.toString();
        labels.forEach(function (lbl) {
            var textMsr = ctx.measureTextMultiLine(lbl.toString(), font.size);
            maxLabelWidth = Math.max(maxLabelWidth, textMsr.textWidth);
        });
        ctx.font = originalFont;

        return maxLabelWidth;
    }

    function getMaxLabelHeight(ctx, labels, font, angle) {
        var maxLabelHeight = 0;
        var originalFont = ctx.font;

        ctx.font = font.toString();
        labels.forEach(function (lbl) {
            var textMsr = ctx.measureTextMultiLine(lbl.toString(), font.size);
            maxLabelHeight = Math.max(maxLabelHeight, textMsr.textHeight);
        });
        ctx.font = originalFont;

        return maxLabelHeight;
    }

    function drawLegend(ctx, options) {
        options = mergeObjectsRecursive({}, legendDefaultOptions, options);

        var labelHeight = getMaxLabelHeight(ctx, options.labels, options.font);
        var labelWidth = getMaxLabelWidth(ctx, options.labels, options.font) + 5 + labelHeight;

        options.rect = { x: 0, y: 0, w: 0, h: 0 };

        if (options.labels && options.labels.length) {
            // calculate the rect
            var w = options.layout == 'vertical'
                ? labelWidth + options.padding * 2
                : (labelWidth + options.padding) * options.labels.length + options.padding;

            var h = options.layout == 'vertical'
                ? (labelHeight + options.padding) * options.labels.length + options.padding
                : labelHeight + options.padding * 2;

            var x = options.hAlign == 'left'
                ? options.margin
                : options.hAlign == 'right'
                    ? ctx.canvas.width - w - options.margin
                    : (ctx.canvas.width - w) / 2;

            var y = options.vAlign == 'top'
                ? options.margin
                : options.vAlign == 'bottom'
                    ? ctx.canvas.height - h - options.margin
                    : (ctx.canvas.height - h) / 2;

            options.rect = { x: x, y: y, w: w, h: h };

            // render the background w/border
            if (options.bgColor || options.border) {
                ctx.strokeWidth = options.border;
                ctx.strokeStyle = options.borderColor;
                ctx.fillStyle = options.bgColor || '#fff';

                roundRect(ctx,
                    options.rect.x, options.rect.y,
                    options.rect.w, options.rect.h,
                    5, !!options.bgColor, options.border > 0
                );
            }

            var xPos = options.rect.x + options.padding;
            var yPos = options.rect.y + options.padding;
            for (var i = 0; i < options.labels.length; i++) {
                // render the color block
                ctx.fillStyle = options.colors[i];
                roundRect(ctx,
                    xPos, yPos,
                    labelHeight, labelHeight,
                    2, true, false);

                // render the label
                var textSegment = new ChartSegment(ctx, '#ffffff', options.font.style, 0).TextSegment(
                    options.labels[i].toString(),
                    xPos + labelHeight + 5, ctx.canvas.height - yPos,
                    options.font.toString(),
                    0, 0,
                    {
                        fillStyle: options.font.style,
                        textAlign: 'left',
                        textBaseline: 'top'
                    }
                );

                textSegment.draw();

                if (options.layout == 'vertical') {
                    yPos += labelHeight + options.padding;
                }
                else {
                    xPos += labelWidth + options.padding;
                }
            }
        }

        return options;
    }

    var scaleDefaultOptions = {
        rect: null,
        bgColor: null,
        font: new contextFont('arial', '#888', 12),
        originAxisWidth: 2,
        originAxisColor: 'rgba(128,128,128,0.4)',
        seriesPadding: 2,
        topPadding: 0,

        xAxis: {
            labels: [],
            padding: 2,
            step: 0,
            style: 'rgba(128, 128, 128, 0.2)',
            font: new contextFont('arial', '#888', 12),
            title: {
                font: new contextFont('arial', '#888', 12),
                label: ''
            },
            strokeWidth: 1,
            centerLine: false,
            textAlignment: 'center',
            angle: 0
        },

        yAxis: {
            labels: [],
            padding: 2,
            step: 0,
            style: 'rgba(128, 128, 128, 0.2)',
            font: new contextFont('arial', '#888', 12),
            strokeWidth: 0,
            centerLine: true,
            textAlignment: 'center'
        }
    };

    // rect is from upper left
    function drawScale(ctx, options, legendOptions) {
        options = mergeObjectsRecursive({}, scaleDefaultOptions, options);

        legendOptions = mergeObjectsRecursive({}, legendDefaultOptions, legendOptions || {});
        legendOptions = drawLegend(ctx, legendOptions);

        options.legendOptions = legendOptions;

        options.yAxis.font = options.yAxis.font || options.font;
        options.xAxis.font = options.xAxis.font || options.font;

        options.yAxis.isNumberAxis = !isNaN(parseFloat(options.yAxis.labels[0]));
        options.xAxis.isNumberAxis = !options.yAxis.isNumberAxis && !isNaN(parseFloat(options.xAxis.labels[0]));

        var yAxisLabelHeight = getMaxLabelHeight(ctx, options.yAxis.labels, options.yAxis.font);

        // Autocalculate the scale dimensions (box without labels)
        var top = options.topPadding;
        var left = getMaxLabelWidth(ctx, options.yAxis.labels, options.yAxis.font) + 4;
        var minWidth = (getMaxLabelWidth(ctx, options.xAxis.labels, options.xAxis.font) + options.xAxis.padding) * options.xAxis.labels.length;
        var width = Math.max(minWidth, ctx.canvas.width - left);

        var bottom = getMaxLabelHeight(ctx, options.xAxis.labels, options.xAxis.font, options.xAxis.angle) + 5;

        if (options.xAxis.title.label) {
            bottom += options.xAxis.title.font.size + 19;
        }

        var minHeight = (yAxisLabelHeight + options.yAxis.padding) * options.yAxis.labels.length;
        var height = Math.max(minHeight, ctx.canvas.height - bottom);

        if (legendOptions.layout == 'vertical') {
            if (legendOptions.hAlign == 'left') {
                left += legendOptions.rect.w + legendOptions.padding;
                width -= legendOptions.rect.w + legendOptions.padding;
            }
            else {
                width -= legendOptions.rect.w + legendOptions.padding;
            }
        }
        else {
            if (legendOptions.vAlign == 'top') {
                top += legendOptions.rect.h + legendOptions.padding;
                height -= legendOptions.rect.h + legendOptions.padding;
            }
            else {
                height -= legendOptions.rect.h + legendOptions.padding;
            }
        }

        options.rect = {
            x: left,
            y: top,
            w: width,
            h: height
        };

        options.origSteps = options.origSteps || {
            xAxis: options.xAxis.step,
            yAxis: options.yAxis.step
        };

        // Autocalculate the step value
        options.xAxis.step = options.origSteps.xAxis || options.rect.w / options.xAxis.labels.length;
        options.yAxis.step = options.origSteps.yAxis || options.rect.h / options.yAxis.labels.length;

        // Draw the background color
        if (options.bgColor) {
            ctx.fillStyle = options.bgColor;
            ctx.beginPath();
            ctx.moveTo(options.rect.x, options.rect.y + options.rect.h);
            ctx.lineTo(options.rect.x, options.rect.y);
            ctx.lineTo(options.rect.x + options.rect.w, options.rect.y);
            ctx.lineTo(options.rect.x + options.rect.w, options.rect.y + options.rect.h);
            ctx.closePath();
            ctx.fill();
        }

        // Draw the origin axes
        ctx.lineWidth = options.originAxisWidth;
        ctx.strokeStyle = options.originAxisColor;

        ctx.beginPath();
        ctx.moveTo(options.rect.x, options.rect.y);
        ctx.lineTo(options.rect.x, options.rect.y + options.rect.h);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.lineTo(options.rect.x, options.rect.y + options.rect.h);
        ctx.lineTo(options.rect.x + options.rect.w, options.rect.y + options.rect.h);
        ctx.closePath();
        ctx.stroke();

        // Draw the vertical lines
        if (options.xAxis.strokeWidth) {
            var xStart = options.rect.x;
            var xEnd = options.rect.x + options.rect.w;

            // zero starts at the origin, otherwise we start at the step location
            if (!options.xAxis.isNumberAxis) {
                xStart += (options.xAxis.centerLine) ? options.xAxis.step / 2 : options.xAxis.step;
            }

            if (options.xAxis.isNumberAxis|| options.xAxis.centerLine) {
                xEnd -= options.xAxis.step / 2;
            }

            // Render each of the y axis lines
            for (var x = xStart; x <= xEnd; x += options.xAxis.step) {
                ctx.lineWidth = options.xAxis.strokeWidth;
                ctx.strokeStyle = options.xAxis.style;

                ctx.beginPath();
                ctx.moveTo(x, options.rect.y);
                ctx.lineTo(x, options.rect.y + options.rect.h);
                ctx.closePath();
                ctx.stroke();
            }

        }

        // render the horizontal lines
        if (options.yAxis.strokeWidth) {
            for (var y = options.rect.y + options.rect.h - options.yAxis.step; y > options.rect.y; y -= options.yAxis.step) {
                ctx.lineWidth = options.yAxis.strokeWidth;
                ctx.strokeStyle = options.yAxis.style;

                ctx.beginPath();
                ctx.moveTo(options.rect.x, y);
                ctx.lineTo(options.rect.x + options.rect.w, y);
                ctx.closePath();
                ctx.stroke();
            }

        }

        options.xAxis.labelAreaHeight = 0;

        // draw the labels along the x axis
        if (options.xAxis.labels.length) {
            var xPos = options.rect.x;
            if (!options.xAxis.isNumberAxis) {
                xPos += options.xAxis.step / 2;
            }

            options.xAxis.labelAreaHeight += options.xAxis.title.font.size + 2;

            var yPos = ctx.canvas.height - (options.rect.y + options.rect.h) - 2;
            options.xAxis.labels.forEach(function (lbl) {
                var textSegment = new ChartSegment(ctx, '#ffffff', options.xAxis.font.style, 0).TextSegment(
                    lbl.toString(),
                    xPos,
                    yPos,
                    options.xAxis.font.toString(),
                    options.xAxis.angle,
                    0,
                    {
                        fillStyle: options.xAxis.font.style,
                        textAlign: 'center',
                        textBaseline: 'top'
                    }
                );

                textSegment.draw();
                xPos += options.xAxis.step;
            });

            if (options.xAxis.title.label) {
                var xPos = (options.rect.w / 2) + options.rect.x;
                var yPos = ctx.canvas.height - (options.rect.y + options.rect.h + options.xAxis.labelAreaHeight) - 7;

                var textSegment = new ChartSegment(ctx, '#ffffff', options.xAxis.title.font.style, 0).TextSegment(
                    options.xAxis.title.label,
                    xPos,
                    yPos,
                    options.xAxis.title.font.toString(),
                    options.xAxis.angle,
                    0,
                    {
                        fillStyle: options.xAxis.title.font.style,
                        textAlign: 'center',
                        textBaseline: 'top'
                    });

                textSegment.draw();

                options.xAxis.labelAreaHeight += options.xAxis.title.font.size + 15;
            }
        }

        // Draw the labels up the y axis
        if (options.yAxis.labels.length) {
            var labels = $.merge([], options.yAxis.labels);
            var yPos = ctx.canvas.height - (options.rect.y + options.rect.h);

            // zero starts at the origin, otherwise we start at the step location
            if (!options.yAxis.isNumberAxis) {
                yPos += (options.yAxis.centerLine) ? options.yAxis.step / 2 : options.yAxis.step;
                labels.reverse();
            }

            labels.forEach(function (lbl) {
                var textSegment = new ChartSegment(ctx, '#ffffff', options.yAxis.font.style, 0).TextSegment(
                    lbl.toString(),
                    options.rect.x - 4, yPos,
                    options.yAxis.font.toString(),
                    0, 0,
                    {
                        fillStyle: options.yAxis.font.style,
                        textAlign: 'right',
                        textBaseline: options.yAxis.centerLine ? 'middle' : 'bottom'
                    }
                );

                textSegment.draw();
                yPos += options.yAxis.step;
            });
        }

        return options;
    }

    //Easing functions adapted from Robert Penner's easing equations
    //http://www.robertpenner.com/easing/
    var animationOptions = {
        linear: function (t) {
            return t;
        },
        easeInQuad: function (t) {
            return t * t;
        },
        easeOutQuad: function (t) {
            return -1 * t * (t - 2);
        },
        easeInOutQuad: function (t) {
            if ((t /= 1 / 2) < 1) return 1 / 2 * t * t;
            return -1 / 2 * ((--t) * (t - 2) - 1);
        },
        easeInCubic: function (t) {
            return t * t * t;
        },
        easeOutCubic: function (t) {
            return 1 * ((t = t / 1 - 1) * t * t + 1);
        },
        easeInOutCubic: function (t) {
            if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t;
            return 1 / 2 * ((t -= 2) * t * t + 2);
        },
        easeInQuart: function (t) {
            return t * t * t * t;
        },
        easeOutQuart: function (t) {
            return -1 * ((t = t / 1 - 1) * t * t * t - 1);
        },
        easeInOutQuart: function (t) {
            if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t * t;
            return -1 / 2 * ((t -= 2) * t * t * t - 2);
        },
        easeInQuint: function (t) {
            return 1 * (t /= 1) * t * t * t * t;
        },
        easeOutQuint: function (t) {
            return 1 * ((t = t / 1 - 1) * t * t * t * t + 1);
        },
        easeInOutQuint: function (t) {
            if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t * t * t;
            return 1 / 2 * ((t -= 2) * t * t * t * t + 2);
        },
        easeInSine: function (t) {
            return -1 * Math.cos(t / 1 * (Math.PI / 2)) + 1;
        },
        easeOutSine: function (t) {
            return 1 * Math.sin(t / 1 * (Math.PI / 2));
        },
        easeInOutSine: function (t) {
            return -1 / 2 * (Math.cos(Math.PI * t / 1) - 1);
        },
        easeInExpo: function (t) {
            return (t == 0) ? 1 : 1 * Math.pow(2, 10 * (t / 1 - 1));
        },
        easeOutExpo: function (t) {
            return (t == 1) ? 1 : 1 * (-Math.pow(2, -10 * t / 1) + 1);
        },
        easeInOutExpo: function (t) {
            if (t == 0) return 0;
            if (t == 1) return 1;
            if ((t /= 1 / 2) < 1) return 1 / 2 * Math.pow(2, 10 * (t - 1));
            return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
        },
        easeInCirc: function (t) {
            if (t >= 1) return t;
            return -1 * (Math.sqrt(1 - (t /= 1) * t) - 1);
        },
        easeOutCirc: function (t) {
            return 1 * Math.sqrt(1 - (t = t / 1 - 1) * t);
        },
        easeInOutCirc: function (t) {
            if ((t /= 1 / 2) < 1) return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
            return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
        },
        easeInElastic: function (t) {
            var s = 1.70158;
            var p = 0;
            var a = 1;
            if (t == 0) return 0;
            if ((t /= 1) == 1) return 1;
            if (!p) p = 1 * .3;
            if (a < Math.abs(1)) {
                a = 1;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
        },
        easeOutElastic: function (t) {
            var s = 1.70158;
            var p = 0;
            var a = 1;
            if (t == 0) return 0;
            if ((t /= 1) == 1) return 1;
            if (!p) p = 1 * .3;
            if (a < Math.abs(1)) {
                a = 1;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
            return a * Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) + 1;
        },
        easeInOutElastic: function (t) {
            var s = 1.70158;
            var p = 0;
            var a = 1;
            if (t == 0) return 0;
            if ((t /= 1 / 2) == 2) return 1;
            if (!p) p = 1 * (.3 * 1.5);
            if (a < Math.abs(1)) {
                a = 1;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
            if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) * .5 + 1;
        },
        easeInBack: function (t) {
            var s = 1.70158;
            return 1 * (t /= 1) * t * ((s + 1) * t - s);
        },
        easeOutBack: function (t) {
            var s = 1.70158;
            return 1 * ((t = t / 1 - 1) * t * ((s + 1) * t + s) + 1);
        },
        easeInOutBack: function (t) {
            var s = 1.70158;
            if ((t /= 1 / 2) < 1) return 1 / 2 * (t * t * (((s *= (1.525)) + 1) * t - s));
            return 1 / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
        },
        easeInBounce: function (t) {
            return 1 - animationOptions.easeOutBounce(1 - t);
        },
        easeOutBounce: function (t) {
            if ((t /= 1) < (1 / 2.75)) {
                return 1 * (7.5625 * t * t);
            } else if (t < (2 / 2.75)) {
                return 1 * (7.5625 * (t -= (1.5 / 2.75)) * t + .75);
            } else if (t < (2.5 / 2.75)) {
                return 1 * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375);
            } else {
                return 1 * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375);
            }
        },
        easeInOutBounce: function (t) {
            if (t < 1 / 2) return animationOptions.easeInBounce(t * 2) * .5;
            return animationOptions.easeOutBounce(t * 2 - 1) * .5 + 1 * .5;
        }
    };

    function clear(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function calculateScale(axis, config, maxSteps, minSteps, maxValue, minValue, labelTemplateString) {
        var graphMin, graphMax, graphRange, stepValue, numberOfSteps, valueRange, rangeOrderOfMagnitude, decimalNum;
        var logarithmic, yAxisMinimumInterval;
        if (axis == 2) {
            logarithmic = config.logarithmic2;
            yAxisMinimumInterval = config.yAxisMinimumInterval2;
        } else {
            logarithmic = config.logarithmic;
            yAxisMinimumInterval = config.yAxisMinimumInterval;
        }
        if (!logarithmic) { // no logarithmic scale
            valueRange = maxValue - minValue;
            rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange);
            graphMin = Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude);
            graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude);
            if (typeof yAxisMinimumInterval == "number") {
                graphMin = graphMin - (graphMin % yAxisMinimumInterval);
                while (graphMin > minValue) graphMin = graphMin - yAxisMinimumInterval;
                if (graphMax % yAxisMinimumInterval > 0.0000001 && graphMax % yAxisMinimumInterval < yAxisMinimumInterval - 0.0000001) {
                    graphMax = roundScale(config, (1 + Math.floor(graphMax / yAxisMinimumInterval)) * yAxisMinimumInterval);
                }
                while (graphMax < maxValue) graphMax = graphMax + yAxisMinimumInterval;
            }
        } else { // logarithmic scale
            var minMag = calculateOrderOfMagnitude(minValue);
            var maxMag = calculateOrderOfMagnitude(maxValue) + 1;
            graphMin = Math.pow(10, minMag);
            graphMax = Math.pow(10, maxMag);
            rangeOrderOfMagnitude = maxMag - minMag;
        }
        graphRange = graphMax - graphMin;
        stepValue = Math.pow(10, rangeOrderOfMagnitude);
        numberOfSteps = Math.round(graphRange / stepValue);
        if (!logarithmic) { // no logarithmic scale
            //Compare number of steps to the max and min for that size graph, and add in half steps if need be.
            var stopLoop = false;
            while (!stopLoop && (numberOfSteps < minSteps || numberOfSteps > maxSteps)) {
                if (numberOfSteps < minSteps) {
                    if (typeof yAxisMinimumInterval == "number") {
                        if (stepValue / 2 < yAxisMinimumInterval) stopLoop = true;
                    }
                    if (!stopLoop) {
                        stepValue /= 2;
                        numberOfSteps = Math.round(graphRange / stepValue);
                    }
                } else {
                    stepValue *= 2;
                    numberOfSteps = Math.round(graphRange / stepValue);
                }
            }
            if (typeof yAxisMinimumInterval == "number") {
                if (stepValue < yAxisMinimumInterval) {
                    stepValue = yAxisMinimumInterval;
                    numberOfSteps = Math.round(graphRange / stepValue);
                }
                if (stepValue % yAxisMinimumInterval > 0.0000001 && stepValue % yAxisMinimumInterval < yAxisMinimumInterval - 0.0000001) {
                    if ((2 * stepValue) % yAxisMinimumInterval < 0.0000001 || (2 * stepValue) % yAxisMinimumInterval > yAxisMinimumInterval - 0.0000001) {
                        stepValue = 2 * stepValue;
                        numberOfSteps = Math.round(graphRange / stepValue);
                    } else {
                        stepValue = roundScale(config, (1 + Math.floor(stepValue / yAxisMinimumInterval)) * yAxisMinimumInterval);
                        numberOfSteps = Math.round(graphRange / stepValue);
                    }
                }
            }
        } else { // logarithmic scale
            numberOfSteps = rangeOrderOfMagnitude; // so scale is 10,100,1000,...
        }
        var labels = [];
        populateLabels(1, config, labelTemplateString, labels, numberOfSteps, graphMin, graphMax, stepValue);
        return {
            steps: numberOfSteps,
            stepValue: stepValue,
            graphMin: graphMin,
            labels: labels,
            maxValue: maxValue
        }
    };

    function roundScale(config, value) {
        var scldec = 0;
        var sscl = "" + config.yAxisMinimumInterval;
        if (sscl.indexOf(".") > 0) {
            scldec = sscl.substr(sscl.indexOf(".")).length;
        }
        return (Math.round(value * Math.pow(10, scldec)) / Math.pow(10, scldec));
    }

    function calculateOrderOfMagnitude(val) {
        return Math.floor(Math.log(val) / Math.LN10);
    };

    //Populate an array of all the labels by interpolating the string.
    function populateLabels(axis, config, labelTemplateString, labels, numberOfSteps, graphMin, graphMax, stepValue) {
        var logarithmic;
        if (axis == 2) {
            logarithmic = config.logarithmic2;
            fmtYLabel = config.fmtYLabel2;
        } else {
            logarithmic = config.logarithmic;
            fmtYLabel = config.fmtYLabel;
        }
        if (labelTemplateString) {
            //Fix floating point errors by setting to fixed the on the same decimal as the stepValue.
            if (!logarithmic) { // no logarithmic scale
                for (var i = 0; i < numberOfSteps + 1; i++) {
                    labels.push(tmpl(labelTemplateString, {
                        value: fmtChartJS(config, 1 * ((graphMin + (stepValue * i)).toFixed(getDecimalPlaces(stepValue))), fmtYLabel)
                    }));
                }
            } else { // logarithmic scale 10,100,1000,...
                var value = graphMin;
                for (var i = 0; i < numberOfSteps + 1; i++) {
                    labels.push(tmpl(labelTemplateString, {
                        value: fmtChartJS(config, 1 * value.toFixed(getDecimalPlaces(value)), fmtYLabel)
                    }));
                    value *= 10;
                }
            }
        }
    };
    //Max value from array
    function Max(array) {
        return Math.max.apply(Math, array);
    };
    //Min value from array
    function Min(array) {
        return Math.min.apply(Math, array);
    };
    //Default if undefined
    function Default(userDeclared, valueIfFalse) {
        if (!userDeclared) {
            return valueIfFalse;
        } else {
            return userDeclared;
        }
    };
    //Apply cap a value at a high or low number
    function CapValue(valueToCap, maxValue, minValue) {
        if (isNumber(maxValue)) {
            if (valueToCap > maxValue) {
                return maxValue;
            }
        }
        if (isNumber(minValue)) {
            if (valueToCap < minValue) {
                return minValue;
            }
        }
        return valueToCap;
    };

    function getDecimalPlaces(num) {
        var numberOfDecimalPlaces;
        if (num % 1 != 0) {
            return num.toString().split(".")[1].length
        } else {
            return 0;
        }
    };

    function mergeChartConfig(defaults, userDefined) {
        var returnObj = {};
        for (var attrname in defaults) {
            returnObj[attrname] = defaults[attrname];
        }
        for (var attrname in userDefined) {
            returnObj[attrname] = userDefined[attrname];
        }
        return returnObj;
    };
    //Javascript micro templating by John Resig - source at http://ejohn.org/blog/javascript-micro-templating/
    var cache = {};

    function tmpl(str, data) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
            cache[str] = cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :
            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +
                // Convert the template into pure JavaScript
                str
                .replace(/[\r\t\n]/g, " ")
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%>/g, "',$1,'")
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'") + "');}return p.join('');");
        // Provide some basic currying to the user
        return data ? fn(data) : fn;
    };

    function dispCrossText(ctx, config, posX, posY, borderX, borderY, overlay, data, animPC, cntiter) {
        var i, disptxt, txtposx, txtposy, textAlign, textBaseline;
        for (i = 0; i < config.crossText.length; i++) {
            if (config.crossText[i] != "" && config.crossTextOverlay[Min([i, config.crossTextOverlay.length - 1])] == overlay && ((cntiter == 1 && config.crossTextIter[Min([i, config.crossTextIter.length - 1])] == "first") || config.crossTextIter[Min([i, config.crossTextIter.length - 1])] == cntiter || config.crossTextIter[Min([i, config.crossTextIter.length - 1])] == "all" || (animPC == 1 && config.crossTextIter[Min([i, config.crossTextIter.length - 1])] == "last"))) {
                ctx.save();
                ctx.beginPath();
                ctx.font = config.crossTextFontStyle[Min([i, config.crossTextFontStyle.length - 1])] + " " + config.crossTextFontSize[Min([i, config.crossTextFontSize.length - 1])] + "px " + config.crossTextFontFamily[Min([i, config.crossTextFontFamily.length - 1])];
                ctx.fillStyle = config.crossTextFontColor[Min([i, config.crossTextFontColor.length - 1])];
                textAlign = config.crossTextAlign[Min([i, config.crossTextAlign.length - 1])];
                textBaseline = config.crossTextBaseline[Min([i, config.crossTextBaseline.length - 1])];
                txtposx = 1 * config.crossTextPosX[Min([i, config.crossTextPosX.length - 1])];
                txtposy = 1 * config.crossTextPosY[Min([i, config.crossTextPosY.length - 1])];
                switch (1 * config.crossTextRelativePosX[Min([i, config.crossTextRelativePosX.length - 1])]) {
                    case 0:
                        if (textAlign == "default") textAlign = "left";
                        break;
                    case 1:
                        txtposx += borderX;
                        if (textAlign == "default") textAlign = "right";
                        break;
                    case 2:
                        txtposx += posX;
                        if (textAlign == "default") textAlign = "center";
                        break;
                    case -2:
                        txtposx += context.canvas.width / 2;
                        if (textAlign == "default") textAlign = "center";
                        break;
                    case 3:
                        txtposx += txtposx + 2 * posX - borderX;
                        if (textAlign == "default") textAlign = "left";
                        break;
                    case 4:
                        // posX=width;
                        txtposx += context.canvas.width;
                        if (textAlign == "default") textAlign = "right";
                        break;
                    default:
                        txtposx += posX;
                        if (textAlign == "default") textAlign = "center";
                        break;
                }
                switch (1 * config.crossTextRelativePosY[Min([i, config.crossTextRelativePosY.length - 1])]) {
                    case 0:
                        if (textBaseline == "default") textBaseline = "top";
                        break;
                    case 3:
                        txtposy += borderY;
                        if (textBaseline == "default") textBaseline = "top";
                        break;
                    case 2:
                        txtposy += posY;
                        if (textBaseline == "default") textBaseline = "middle";
                        break;
                    case -2:
                        txtposy += context.canvas.height / 2;
                        if (textBaseline == "default") textBaseline = "middle";
                        break;
                    case 1:
                        txtposy += txtposy + 2 * posY - borderY;
                        if (textBaseline == "default") textBaseline = "bottom";
                        break;
                    case 4:
                        txtposy += context.canvas.height;
                        if (textBaseline == "default") textBaseline = "bottom";
                        break;
                    default:
                        txtposy += posY;
                        if (textBaseline == "default") textBaseline = "middle";
                        break;
                }
                ctx.textAlign = textAlign;
                ctx.textBaseline = textBaseline;
                ctx.translate(1 * txtposx, 1 * txtposy);
                ctx.rotate(Math.PI * config.crossTextAngle[Min([i, config.crossTextAngle.length - 1])] / 180);
                if (config.crossText[i].substring(0, 1) == "%") {
                    if (typeof config.crossTextFunction == "function") disptxt = config.crossTextFunction(i, config.crossText[i], ctx, config, posX, posY, borderX, borderY, overlay, data, animPC);
                } else disptxt = config.crossText[i];
                ctx.fillTextMultiLine(disptxt, 0, 0, ctx.textBaseline, config.crossTextFontSize[Min([i, config.crossTextFontSize.length - 1])]);
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    function dispCrossImage(ctx, config, posX, posY, borderX, borderY, overlay, data, animPC, cntiter) {
        var i, disptxt, imageposx, imageposy, imageAlign, imageBaseline;
        for (i = 0; i < config.crossImage.length; i++) {
            if (typeof config.crossImage[i] != "undefined" && config.crossImageOverlay[Min([i, config.crossImageOverlay.length - 1])] == overlay && ((cntiter == -1 && config.crossImageIter[Min([i, config.crossImageIter.length - 1])] == "background") || (cntiter == 1 && config.crossImageIter[Min([i, config.crossImageIter.length - 1])] == "first") || config.crossImageIter[Min([i, config.crossImageIter.length - 1])] == cntiter || (cntiter != -1 && config.crossImageIter[Min([i, config.crossImageIter.length - 1])] == "all") || (animPC == 1 && config.crossImageIter[Min([i, config.crossImageIter.length - 1])] == "last"))) {
                ctx.save();
                ctx.beginPath();
                imageAlign = config.crossImageAlign[Min([i, config.crossImageAlign.length - 1])];
                imageBaseline = config.crossImageBaseline[Min([i, config.crossImageBaseline.length - 1])];
                imageposx = 1 * config.crossImagePosX[Min([i, config.crossImagePosX.length - 1])];
                imageposy = 1 * config.crossImagePosY[Min([i, config.crossImagePosY.length - 1])];
                switch (1 * config.crossImageRelativePosX[Min([i, config.crossImageRelativePosX.length - 1])]) {
                    case 0:
                        if (imageAlign == "default") imageAlign = "left";
                        break;
                    case 1:
                        imageposx += borderX;
                        if (imageAlign == "default") imageAlign = "right";
                        break;
                    case 2:
                        imageposx += posX;
                        if (imageAlign == "default") imageAlign = "center";
                        break;
                    case -2:
                        imageposx += context.canvas.width / 2;
                        if (imageAlign == "default") imageAlign = "center";
                        break;
                    case 3:
                        imageposx += imageposx + 2 * posX - borderX;
                        if (imageAlign == "default") imageAlign = "left";
                        break;
                    case 4:
                        // posX=width;
                        imageposx += context.canvas.width;
                        if (imageAlign == "default") imageAlign = "right";
                        break;
                    default:
                        imageposx += posX;
                        if (imageAlign == "default") imageAlign = "center";
                        break;
                }
                switch (1 * config.crossImageRelativePosY[Min([i, config.crossImageRelativePosY.length - 1])]) {
                    case 0:
                        if (imageBaseline == "default") imageBaseline = "top";
                        break;
                    case 3:
                        imageposy += borderY;
                        if (imageBaseline == "default") imageBaseline = "top";
                        break;
                    case 2:
                        imageposy += posY;
                        if (imageBaseline == "default") imageBaseline = "middle";
                        break;
                    case -2:
                        imageposy += context.canvas.height / 2;
                        if (imageBaseline == "default") imageBaseline = "middle";
                        break;
                    case 1:
                        imageposy += imageposy + 2 * posY - borderY;
                        if (imageBaseline == "default") imageBaseline = "bottom";
                        break;
                    case 4:
                        imageposy += context.canvas.height;
                        if (imageBaseline == "default") imageBaseline = "bottom";
                        break;
                    default:
                        imageposy += posY;
                        if (imageBaseline == "default") imageBaseline = "middle";
                        break;
                }
                var imageWidth = config.crossImage[i].width;
                switch (imageAlign) {
                    case "left":
                        break;
                    case "right":
                        imageposx -= imageWidth;
                        break;
                    case "center":
                        imageposx -= (imageWidth / 2);
                        break;
                    default:
                        break;
                }
                var imageHeight = config.crossImage[i].height;
                switch (imageBaseline) {
                    case "top":
                        break;
                    case "bottom":
                        imageposy -= imageHeight;
                        break;
                    case "middle":
                        imageposy -= (imageHeight / 2);
                        break;
                    default:
                        break;
                }
                ctx.translate(1 * imageposx, 1 * imageposy);
                ctx.rotate(Math.PI * config.crossImageAngle[Min([i, config.crossImageAngle.length - 1])] / 180);
                ctx.drawImage(config.crossImage[i], 0, 0);
                //                ctx.stroke();
                ctx.restore();
            }
        }
    };
    //****************************************************************************************
    function setMeasures(data, config, ctx, ylabels, ylabels2, reverseLegend, reverseAxis, drawAxis, drawLegendOnData, legendBox, typegraph) {
        if (config.canvasBackgroundColor != "none") ctx.canvas.style.background = config.canvasBackgroundColor;
        var height = ctx.canvas.height;
        var width = ctx.canvas.width;

        var borderWidth = 0;
        var yAxisLabelWidth = 0;
        var yAxisLabelPos = 0;
        var graphTitleHeight = 0;
        var graphTitlePosY = 0;
        var graphSubTitleHeight = 0;
        var graphSubTitlePosY = 0;
        var footNoteHeight = 0;
        var footNotePosY = 0;
        var yAxisUnitHeight = 0;
        var yAxisUnitPosY = 0;
        var widestLegend = 0;
        var nbeltLegend = 0;
        var nbLegendLines = 0;
        var nbLegendCols = 0;
        var spaceLegendHeight = 0;
        var xFirstLegendTextPos = 0;
        var yFirstLegendTextPos = 0;
        var xLegendBorderPos = 0;
        var yLegendBorderPos = 0;
        var yAxisLabelWidth = 0;
        var yAxisLabelPos = 0;
        var xAxisLabelHeight = 0;
        var xLabelHeight = 0;
        var widestXLabel = 1;
        var highestXLabel = 1;
        var widestYLabel = 0;
        var highestYLabel = 1;
        var widestYLabel2 = 0;
        var highestYLabel2 = 1;
        var leftNotUsableSize = 0;
        var rightNotUsableSize = 0;
        var rotateLabels = 0;
        var xLabelPos = 0;
        // Borders
        if (config.canvasBorders) borderWidth = config.canvasBordersWidth;
        // compute widest X label
        if (drawAxis) {
            ctx.font = config.scaleFontStyle + " " + config.scaleFontSize + "px " + config.scaleFontFamily;
            for (var i = 0; i < data.labels.length; i++) {
                var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, data.labels[i], config.fmtXLabel), config.scaleFontSize);
                //If the text length is longer - make that equal to longest text!
                widestXLabel = (textMsr.textWidth > widestXLabel) ? textMsr.textWidth : widestXLabel;
                highestXLabel = (textMsr.textHeight > highestXLabel) ? textMsr.textHeight : highestXLabel;
            }
            if (widestXLabel < config.xScaleLabelsMinimumWidth) {
                widestXLabel = config.xScaleLabelsMinimumWidth;
            }
        }
        // compute Y Label Width
        if (drawAxis) {
            widestYLabel = 1;
            if (ylabels != null) {
                ctx.font = config.scaleFontStyle + " " + config.scaleFontSize + "px " + config.scaleFontFamily;
                for (var i = ylabels.length - 1; i >= 0; i--) {
                    if (typeof (ylabels[i]) == "string") {
                        if (ylabels[i].trim() != "") {
                            var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, ylabels[i], config.fmtYLabel), config.scaleFontSize);
                            //If the text length is longer - make that equal to longest text!
                            widestYLabel = (textMsr.textWidth > widestYLabel) ? textMsr.textWidth : widestYLabel;
                            highestYLabel = (textMsr.textHeight > highestYLabel) ? textMsr.textHeight : highestYLabel;
                        }
                    }
                }
            }
            if (widestYLabel < config.yScaleLabelsMinimumWidth) {
                widestYLabel = config.yScaleLabelsMinimumWidth;
            }
            widestYLabel2 = 1;
            if (ylabels2 != null && config.yAxisRight) {
                ctx.font = config.scaleFontStyle + " " + config.scaleFontSize + "px " + config.scaleFontFamily;
                for (var i = ylabels2.length - 1; i >= 0; i--) {
                    if (typeof (ylabels2[i]) == "string") {
                        if (ylabels2[i].trim() != "") {
                            var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, ylabels2[i], config.fmtYLabel2), config.scaleFontSize);
                            //If the text length is longer - make that equal to longest text!
                            widestYLabel2 = (textMsr.textWidth > widestYLabel2) ? textMsr.textWidth : widestYLabel2;
                            highestYLabel2 = (textMsr.textHeight > highestYLabel2) ? textMsr.textHeight : highestYLabel2;
                        }
                    }
                }
            } else {
                widestYLabel2 = widestYLabel;
            }
            if (widestYLabel2 < config.yScaleLabelsMinimumWidth) {
                widestYLabel2 = config.yScaleLabelsMinimumWidth;
            }
        }
        // yAxisLabel
        leftNotUsableSize = borderWidth + config.spaceLeft
        rightNotUsableSize = borderWidth + config.spaceRight;
        if (drawAxis) {
            if (typeof (config.yAxisLabel) != "undefined") {
                if (config.yAxisLabel.trim() != "") {
                    yAxisLabelWidth = (config.yAxisFontSize + config.yAxisLabelSpaceLeft + config.yAxisLabelSpaceRight);
                    yAxisLabelPosLeft = borderWidth + config.spaceLeft + config.yAxisLabelSpaceLeft + config.yAxisFontSize;
                    yAxisLabelPosRight = width - borderWidth - config.spaceRight - config.yAxisLabelSpaceLeft - config.yAxisFontSize;
                }
            }
            if (config.yAxisLeft) {
                if (reverseAxis == false) leftNotUsableSize = borderWidth + config.spaceLeft + yAxisLabelWidth + widestYLabel + config.yAxisSpaceLeft + config.yAxisSpaceRight;
                else leftNotUsableSize = borderWidth + config.spaceLeft + yAxisLabelWidth + widestXLabel + config.yAxisSpaceLeft + config.yAxisSpaceRight;
            }
            if (config.yAxisRight) {
                if (reverseAxis == false) rightNotUsableSize = borderWidth + config.spaceRight + yAxisLabelWidth + widestYLabel2 + config.yAxisSpaceLeft + config.yAxisSpaceRight;
                else rightNotUsableSize = borderWidth + config.spaceRight + yAxisLabelWidth + widestXLabel + config.yAxisSpaceLeft + config.yAxisSpaceRight;
            }
        }
        availableWidth = width - leftNotUsableSize - rightNotUsableSize;
        // Title
        if (config.graphTitle.trim() != "") {
            graphTitleHeight = (config.graphTitleFontSize + config.graphTitleSpaceBefore + config.graphTitleSpaceAfter);
            graphTitlePosY = borderWidth + config.spaceTop + graphTitleHeight - config.graphTitleSpaceAfter;
        }
        // subTitle
        if (config.graphSubTitle.trim() != "") {
            graphSubTitleHeight = (config.graphSubTitleFontSize + config.graphSubTitleSpaceBefore + config.graphSubTitleSpaceAfter);
            graphSubTitlePosY = borderWidth + config.spaceTop + graphTitleHeight + graphSubTitleHeight - config.graphSubTitleSpaceAfter;
        }
        // yAxisUnit
        if (drawAxis) {
            if (config.yAxisUnit.trim() != "") {
                yAxisUnitHeight = (config.yAxisUnitFontSize + config.yAxisUnitSpaceBefore + config.yAxisUnitSpaceAfter);
                yAxisUnitPosY = borderWidth + config.spaceTop + graphTitleHeight + graphSubTitleHeight + yAxisUnitHeight - config.yAxisUnitSpaceAfter;
            }
        }
        topNotUsableSize = borderWidth + config.spaceTop + graphTitleHeight + graphSubTitleHeight + yAxisUnitHeight + config.graphSpaceBefore;
        // footNote
        if (typeof (config.footNote) != "undefined") {
            if (config.footNote.trim() != "") {
                footNoteHeight = (config.footNoteFontSize + config.footNoteSpaceBefore + config.footNoteSpaceAfter);
                footNotePosY = height - config.spaceBottom - borderWidth - config.footNoteSpaceAfter;
            }
        }
        // compute space for Legend
        if (typeof (config.legend) != "undefined") {
            if (config.legend == true) {
                ctx.font = config.legendFontStyle + " " + config.legendFontSize + "px " + config.legendFontFamily;
                if (drawLegendOnData) {
                    for (var i = data.datasets.length - 1; i >= 0; i--) {
                        if (typeof (data.datasets[i].title) == "string") {
                            if (data.datasets[i].title.trim() != "") {
                                nbeltLegend++;
                                var textLength = ctx.measureText(fmtChartJS(config, data.datasets[i].title, config.fmtLegend)).width;
                                //If the text length is longer - make that equal to longest text!
                                widestLegend = (textLength > widestLegend) ? textLength : widestLegend;
                            }
                        }
                    }
                } else {
                    for (var i = data.length - 1; i >= 0; i--) {
                        if (typeof (data[i].title) == "string") {
                            if (data[i].title.trim() != "") {
                                nbeltLegend++;
                                var textLength = ctx.measureText(fmtChartJS(config, data[i].title, config.fmtLegend)).width;
                                //If the text length is longer - make that equal to longest text!
                                widestLegend = (textLength > widestLegend) ? textLength : widestLegend;
                            }
                        }
                    }
                }
                if (nbeltLegend > 1 || (nbeltLegend == 1 && config.showSingleLegend)) {
                    widestLegend += config.legendBlockSize + config.legendSpaceBetweenBoxAndText;
                    availableLegendWidth = width - config.spaceLeft - config.spaceRight - 2 * (borderWidth) - config.legendSpaceLeftText - config.legendSpaceRightText;
                    if (config.legendBorders == true) availableLegendWidth -= 2 * (config.legendBordersWidth) - config.legendBordersSpaceLeft - config.legendBordersSpaceRight;
                    maxLegendOnLine = Math.floor((availableLegendWidth + config.legendSpaceBetweenTextHorizontal) / (widestLegend + config.legendSpaceBetweenTextHorizontal));
                    nbLegendLines = Math.ceil(nbeltLegend / maxLegendOnLine);
                    nbLegendCols = Math.ceil(nbeltLegend / nbLegendLines);
                    spaceLegendHeight = nbLegendLines * (config.legendFontSize + config.legendSpaceBetweenTextVertical) - config.legendSpaceBetweenTextVertical + config.legendSpaceBeforeText + config.legendSpaceAfterText;
                    yFirstLegendTextPos = height - borderWidth - config.spaceBottom - footNoteHeight - spaceLegendHeight + config.legendSpaceBeforeText + config.legendFontSize;
                    xFirstLegendTextPos = config.spaceLeft + (width - config.spaceLeft - config.spaceRight - nbLegendCols * (widestLegend + config.legendSpaceBetweenTextHorizontal) + config.legendSpaceBetweenTextHorizontal) / 2;
                    if (config.legendBorders == true) {
                        spaceLegendHeight += 2 * config.legendBordersWidth + config.legendBordersSpaceBefore + config.legendBordersSpaceAfter;
                        yFirstLegendTextPos -= (config.legendBordersWidth + config.legendBordersSpaceAfter);
                        yLegendBorderPos = Math.floor(height - borderWidth - config.spaceBottom - footNoteHeight - spaceLegendHeight + (config.legendBordersWidth / 2) + config.legendBordersSpaceBefore);
                        xLegendBorderPos = Math.floor(xFirstLegendTextPos - config.legendSpaceLeftText - (config.legendBordersWidth / 2));
                        legendBorderHeight = Math.ceil(spaceLegendHeight - config.legendBordersWidth) - config.legendBordersSpaceBefore - config.legendBordersSpaceAfter;
                        legendBorderWidth = Math.ceil(nbLegendCols * (widestLegend + config.legendSpaceBetweenTextHorizontal)) - config.legendSpaceBetweenTextHorizontal + config.legendBordersWidth + config.legendSpaceRightText + config.legendSpaceLeftText;
                    }
                }
            }
        }
        // xAxisLabel
        if (drawAxis) {
            if (typeof (config.xAxisLabel) != "undefined") {
                if (config.xAxisLabel.trim() != "") {
                    xAxisLabelHeight = (config.xAxisFontSize + config.xAxisLabelSpaceBefore + config.xAxisLabelSpaceAfter);
                    xAxisLabelPos = height - borderWidth - config.spaceBottom - footNoteHeight - spaceLegendHeight - config.xAxisLabelSpaceAfter;
                }
            }
        }
        xLabelWidth = 0;
        if (ctx.canvas.width > config.xAxisMinWidthToShowLabels && drawAxis && (config.xAxisBottom || config.xAxisTop)) {
            if (reverseAxis == false) {
                var widestLabel = widestXLabel;
                var highestLabel = highestXLabel;
                nblab = data.labels.length;
            } else {
                var widestLabel = widestYLabel;
                var highestLabel = highestYLabel;
                nblab = ylabels.length;
            }
            if (config.rotateLabels == "smart") {
                rotateLabels = 0;
                if ((availableWidth + config.xAxisSpaceBetweenLabels) / nblab < (widestLabel + config.xAxisSpaceBetweenLabels)) {
                    rotateLabels = 45;
                    if (availableWidth / nblab < Math.abs(Math.cos(rotateLabels * Math.PI / 180) * widestLabel)) {
                        rotateLabels = 90;
                    }
                }
            } else {
                rotateLabels = config.rotateLabels
                if (rotateLabels < 0) rotateLabels = 0;
                if (rotateLabels > 180) rotateLabels = 180;
            }
            if (rotateLabels > 90) rotateLabels += 180;
            xLabelHeight = Math.abs(Math.sin(rotateLabels * Math.PI / 180) * widestLabel) + Math.abs(Math.sin((rotateLabels + 90) * Math.PI / 180) * highestLabel) + config.xAxisSpaceBefore + config.xAxisSpaceAfter;
            xLabelPos = height - borderWidth - config.spaceBottom - footNoteHeight - spaceLegendHeight - xAxisLabelHeight - (xLabelHeight - config.xAxisSpaceBefore) - config.graphSpaceAfter;
            xLabelWidth = Math.abs(Math.cos(rotateLabels * Math.PI / 180) * widestLabel) + Math.abs(Math.cos((rotateLabels + 90) * Math.PI / 180) * highestLabel);
            leftNotUsableSize = Max([leftNotUsableSize, borderWidth + config.spaceLeft + xLabelWidth / 2]);
            rightNotUsableSize = Max([rightNotUsableSize, borderWidth + config.spaceRight + xLabelWidth / 2]);
            availableWidth = width - leftNotUsableSize - rightNotUsableSize;
        }
        if (config.xAxisBottom) {
            bottomNotUsableHeightWithoutXLabels = borderWidth + config.spaceBottom + footNoteHeight + spaceLegendHeight + xAxisLabelHeight;
            bottomNotUsableHeightWithXLabels = bottomNotUsableHeightWithoutXLabels + xLabelHeight + config.graphSpaceAfter;
            availableHeight = height - topNotUsableSize - bottomNotUsableHeightWithXLabels;
        } else {
            bottomNotUsableHeightWithoutXLabels = borderWidth + config.spaceBottom + footNoteHeight + spaceLegendHeight + xAxisLabelHeight;
            bottomNotUsableHeightWithXLabels = bottomNotUsableHeightWithoutXLabels + config.graphSpaceAfter;
            availableHeight = height - topNotUsableSize - bottomNotUsableHeightWithXLabels;
        }
        // ----------------------- DRAW EXTERNAL ELEMENTS -------------------------------------------------
        dispCrossImage(ctx, config, width / 2, height / 2, width / 2, height / 2, false, data, -1, -1);
        if (widestYLabel != 1) {
            // Draw Borders
            if (borderWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = 2 * borderWidth;
                ctx.strokeStyle = config.canvasBordersColor;
                ctx.moveTo(0, 0);
                ctx.lineTo(0, height);
                ctx.lineTo(width, height);
                ctx.lineTo(width, 0);
                ctx.lineTo(0, 0);
                ctx.stroke();
                ctx.restore();
            }
            // Draw Graph Title
            if (graphTitleHeight > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.font = config.graphTitleFontStyle + " " + config.graphTitleFontSize + "px " + config.graphTitleFontFamily;
                ctx.fillStyle = config.graphTitleFontColor;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.translate(config.spaceLeft + (width - config.spaceLeft - config.spaceRight) / 2, graphTitlePosY);
                ctx.fillText(config.graphTitle, 0, 0);
                ctx.stroke();
                ctx.restore();
            }
            // Draw Graph Sub-Title
            if (graphSubTitleHeight > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.font = config.graphSubTitleFontStyle + " " + config.graphSubTitleFontSize + "px " + config.graphSubTitleFontFamily;
                ctx.fillStyle = config.graphSubTitleFontColor;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.translate(config.spaceLeft + (width - config.spaceLeft - config.spaceRight) / 2, graphSubTitlePosY);
                ctx.fillText(config.graphSubTitle, 0, 0);
                ctx.stroke();
                ctx.restore();
            }
            // Draw Y Axis Unit
            if (yAxisUnitHeight > 0) {
                if (config.yAxisLeft) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.font = config.yAxisUnitFontStyle + " " + config.yAxisUnitFontSize + "px " + config.yAxisUnitFontFamily;
                    ctx.fillStyle = config.yAxisUnitFontColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    ctx.translate(leftNotUsableSize, yAxisUnitPosY);
                    ctx.fillText(config.yAxisUnit, 0, 0);
                    ctx.stroke();
                    ctx.restore();
                }
                if (config.yAxisRight) {
                    if (config.yAxisUnit2 == '') config.yAxisUnit2 = config.yAxisUnit;
                    ctx.save();
                    ctx.beginPath();
                    ctx.font = config.yAxisUnitFontStyle + " " + config.yAxisUnitFontSize + "px " + config.yAxisUnitFontFamily;
                    ctx.fillStyle = config.yAxisUnitFontColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    ctx.translate(width - rightNotUsableSize, yAxisUnitPosY);
                    ctx.fillText(config.yAxisUnit2, 0, 0);
                    ctx.stroke();
                    ctx.restore();
                }
            }
            // Draw Y Axis Label
            if (yAxisLabelWidth > 0) {
                if (config.yAxisLeft) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.font = config.yAxisFontStyle + " " + config.yAxisFontSize + "px " + config.yAxisFontFamily;
                    ctx.fillStyle = config.yAxisFontColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    ctx.translate(yAxisLabelPosLeft, topNotUsableSize + (availableHeight / 2));
                    ctx.rotate(-(90 * (Math.PI / 180)));
                    ctx.fillText(config.yAxisLabel, 0, 0);
                    ctx.stroke();
                    ctx.restore();
                }
                if (config.yAxisRight) {
                    if (config.yAxisLabel2 == '') config.yAxisLabel2 = config.yAxisLabel;
                    ctx.save();
                    ctx.beginPath();
                    ctx.font = config.yAxisFontStyle + " " + config.yAxisFontSize + "px " + config.yAxisFontFamily;
                    ctx.fillStyle = config.yAxisFontColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    ctx.translate(yAxisLabelPosRight, topNotUsableSize + (availableHeight / 2));
                    ctx.rotate(+(90 * (Math.PI / 180)));
                    ctx.fillText(config.yAxisLabel2, 0, 0);
                    ctx.stroke();
                    ctx.restore();
                }
            }
            // Draw X Axis Label
            if (xAxisLabelHeight > 0) {
                if (config.xAxisBottom) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.font = config.xAxisFontStyle + " " + config.xAxisFontSize + "px " + config.xAxisFontFamily;
                    ctx.fillStyle = config.xAxisFontColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    ctx.translate(leftNotUsableSize + (availableWidth / 2), xAxisLabelPos);
                    ctx.fillText(config.xAxisLabel, 0, 0);
                    ctx.stroke();
                    ctx.restore();
                }
            }
            // Draw Legend
            if (nbeltLegend > 1 || (nbeltLegend == 1 && config.showSingleLegend)) {
                if (config.legendBorders == true) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = config.legendBordersWidth;
                    ctx.strokeStyle = config.legendBordersColors;
                    ctx.moveTo(xLegendBorderPos, yLegendBorderPos);
                    ctx.lineTo(xLegendBorderPos, yLegendBorderPos + legendBorderHeight);
                    ctx.lineTo(xLegendBorderPos + legendBorderWidth, yLegendBorderPos + legendBorderHeight);
                    ctx.lineTo(xLegendBorderPos + legendBorderWidth, yLegendBorderPos);
                    ctx.lineTo(xLegendBorderPos, yLegendBorderPos);
                    ctx.lineTo(xLegendBorderPos + legendBorderWidth, yLegendBorderPos);
                    ctx.lineTo(xLegendBorderPos, yLegendBorderPos);
                    ctx.lineTo(xLegendBorderPos, yLegendBorderPos + legendBorderHeight);
                    ctx.stroke();
                    ctx.restore();
                }
                nbcols = nbLegendCols - 1;
                ypos = yFirstLegendTextPos - (config.legendFontSize + config.legendSpaceBetweenTextVertical);
                xpos = 0;
                if (drawLegendOnData) fromi = data.datasets.length;
                else fromi = data.length;
                for (var i = fromi - 1; i >= 0; i--) {
                    orderi = i;
                    if (reverseLegend) {
                        if (drawLegendOnData) orderi = data.datasets.length - i - 1;
                        else orderi = data.length - i - 1;
                    }
                    if (drawLegendOnData) tpof = typeof (data.datasets[orderi].title);
                    else tpof = typeof (data[orderi].title)
                    if (tpof == "string") {
                        if (drawLegendOnData) lgtxt = fmtChartJS(config, data.datasets[orderi].title, config.fmtLegend).trim();
                        else lgtxt = fmtChartJS(config, data[orderi].title, config.fmtLegend).trim();
                        if (lgtxt != "") {
                            nbcols++;
                            if (nbcols == nbLegendCols) {
                                nbcols = 0;
                                xpos = xFirstLegendTextPos;
                                ypos += config.legendFontSize + config.legendSpaceBetweenTextVertical;
                            } else {
                                xpos += widestLegend + config.legendSpaceBetweenTextHorizontal;
                            }
                            ctx.save();
                            ctx.beginPath();
                            if (drawLegendOnData) {
                                if (typeof data.datasets[orderi].strokeColor == "function") ctx.strokeStyle = data.datasets[orderi].strokeColor("STROKECOLOR", data, config, orderi, -1, 1, -1, typegraph, ctx, -1, -1, -1, -1);
                                else if (typeof data.datasets[orderi].strokeColor == "string") ctx.strokeStyle = data.datasets[orderi].strokeColor;
                                else ctx.strokeStyle = config.defaultStrokeColor;
                            } else {
                                if (typeof data[orderi].color == "function") ctx.strokeStyle = data[orderi].color("COLOR", data, config, orderi, -1, 1, data[orderi].value, typegraph, ctx, 1, 1, 1, 1);
                                else if (typeof data[orderi].color == "string") ctx.strokeStyle = data[orderi].color;
                                else ctx.strokeStyle = config.defaultStrokeColor;
                            }
                            if (legendBox) {
                                ctx.lineWidth = 1;
                                ctx.moveTo(xpos, ypos);
                                ctx.lineTo(xpos + config.legendBlockSize, ypos);
                                ctx.lineTo(xpos + config.legendBlockSize, ypos - config.legendFontSize);
                                ctx.lineTo(xpos, ypos - config.legendFontSize);
                                ctx.lineTo(xpos, ypos);
                                ctx.closePath();
                                if (drawLegendOnData) {
                                    if (typeof data.datasets[orderi].fillColor == "function") ctx.fillStyle = data.datasets[orderi].fillColor("LEGENDFILLCOLOR", data, config, orderi, -1, 1, -1, typegraph, ctx, xpos, ypos, xpos + config.legendBlockSize, ypos - config.legendFontSize);
                                    else if (typeof data.datasets[orderi].fillColor == "string") ctx.fillStyle = data.datasets[orderi].fillColor;
                                    else ctx.fillStyle = config.defaultFillColor;
                                } else {
                                    if (typeof data[orderi].color == "function") ctx.fillStyle = data[orderi].color("LEGENDFILLCOLOR", data, config, orderi, -1, 1, -1, typegraph, ctx, xpos, ypos - config.legendFontSize, xpos + config.legendBlockSize, ypos);
                                    else if (typeof data[orderi].color == "string") ctx.fillStyle = data[orderi].color;
                                    else ctx.fillStyle = config.defaultFillColor;
                                }
                                ctx.fill();
                            } else {
                                ctx.lineWidth = config.legendColorIndicatorStrokeWidth ?
                                    config.legendColorIndicatorStrokeWidth : config.datasetStrokeWidth;
                                if (config.legendColorIndicatorStrokeWidth && config.legendColorIndicatorStrokeWidth > config.legendFontSize) {
                                    ctx.lineWidth = config.legendFontSize;
                                }
                                ctx.moveTo(xpos + 2, ypos - (config.legendFontSize / 2));
                                ctx.lineTo(xpos + 2 + config.legendBlockSize, ypos - (config.legendFontSize / 2));
                            }
                            ctx.stroke();
                            ctx.restore();
                            ctx.save();
                            ctx.beginPath();
                            ctx.font = config.legendFontStyle + " " + config.legendFontSize + "px " + config.legendFontFamily;
                            ctx.fillStyle = config.legendFontColor;
                            ctx.textAlign = "left";
                            ctx.textBaseline = "bottom";
                            ctx.translate(xpos + config.legendBlockSize + config.legendSpaceBetweenBoxAndText, ypos);
                            ctx.fillText(lgtxt, 0, 0);
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                }
            }
            // Draw FootNote
            if (config.footNote.trim() != "") {
                ctx.save();
                ctx.font = config.footNoteFontStyle + " " + config.footNoteFontSize + "px " + config.footNoteFontFamily;
                ctx.fillStyle = config.footNoteFontColor;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.translate(leftNotUsableSize + (availableWidth / 2), footNotePosY);
                ctx.fillText(config.footNote, 0, 0);
                ctx.stroke();
                ctx.restore();
            }
        }
        clrx = leftNotUsableSize;
        clrwidth = availableWidth;
        clry = topNotUsableSize;
        clrheight = availableHeight;
        return {
            leftNotUsableSize: leftNotUsableSize,
            rightNotUsableSize: rightNotUsableSize,
            availableWidth: availableWidth,
            topNotUsableSize: topNotUsableSize,
            bottomNotUsableHeightWithoutXLabels: bottomNotUsableHeightWithoutXLabels,
            bottomNotUsableHeightWithXLabels: bottomNotUsableHeightWithXLabels,
            availableHeight: availableHeight,
            widestXLabel: widestXLabel,
            highestXLabel: highestXLabel,
            widestYLabel: widestYLabel,
            widestYLabel2: widestYLabel2,
            highestYLabel: highestYLabel,
            rotateLabels: rotateLabels,
            xLabelPos: xLabelPos,
            clrx: clrx,
            clry: clry,
            clrwidth: clrwidth,
            clrheight: clrheight
        };
    };

    function setRect(ctx, config) {
        if (config.clearRect) {
            if (!config.multiGraph) {
                clear(ctx);
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        } else {
            clear(ctx);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = config.savePngBackgroundColor;
            ctx.strokeStyle = config.savePngBackgroundColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, ctx.canvas.height);
            ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
            ctx.lineTo(ctx.canvas.width, 0);
            ctx.lineTo(0, 0);
            ctx.stroke();
            ctx.fill();
        }
    };

    function defMouse(ctx, data, config, tpgraph) {
        if (config.annotateDisplay == true) {
            if (cursorDivCreated == false) oCursor = new makeCursorObj('divCursor');
            if (isIE() < 9 && isIE() != false) ctx.canvas.attachEvent("on" + config.annotateFunction.split(' ')[0], function (event) {
                if ((config.annotateFunction.split(' ')[1] == "left" && event.which == 1) ||
                    (config.annotateFunction.split(' ')[1] == "middle" && event.which == 2) ||
                    (config.annotateFunction.split(' ')[1] == "right" && event.which == 3) ||
                    (typeof (config.annotateFunction.split(' ')[1]) != "string")) doMouseAction(config, ctx, event, data, "annotate", config.mouseDownRight)
            });
            else ctx.canvas.addEventListener(config.annotateFunction.split(' ')[0], function (event) {
                if ((config.annotateFunction.split(' ')[1] == "left" && event.which == 1) ||
                    (config.annotateFunction.split(' ')[1] == "middle" && event.which == 2) ||
                    (config.annotateFunction.split(' ')[1] == "right" && event.which == 3) ||
                    (typeof (config.annotateFunction.split(' ')[1]) != "string")) doMouseAction(config, ctx, event, data, "annotate", config.mouseDownRight)
            }, false);
        }
        if (config.savePng) {
            if (isIE() < 9 && isIE() != false) ctx.canvas.attachEvent("on" + config.savePngFunction.split(' ')[0], function (event) {
                if ((config.savePngFunction.split(' ')[1] == "left" && event.which == 1) ||
                    (config.savePngFunction.split(' ')[1] == "middle" && event.which == 2) ||
                    (config.savePngFunction.split(' ')[1] == "right" && event.which == 3) ||
                    (typeof (config.savePngFunction.split(' ')[1]) != "string")) saveCanvas(ctx, data, config, tpgraph);
            });
            else ctx.canvas.addEventListener(config.savePngFunction.split(' ')[0], function (event) {
                if ((config.savePngFunction.split(' ')[1] == "left" && event.which == 1) ||
                    (config.savePngFunction.split(' ')[1] == "middle" && event.which == 2) ||
                    (config.savePngFunction.split(' ')[1] == "right" && event.which == 3) ||
                    (typeof (config.savePngFunction.split(' ')[1]) != "string")) saveCanvas(ctx, data, config, tpgraph);
            }, false);
        }

        if (isIE() < 9 && isIE() != false) ctx.canvas.attachEvent("onmousewheel", function (event) {
            if (cursorDivCreated) document.getElementById('divCursor').style.display = 'none';
        });
        else ctx.canvas.addEventListener("DOMMouseScroll", function (event) {
            if (cursorDivCreated) document.getElementById('divCursor').style.display = 'none';
        }, false);



        function add_event_listener(type, func, chk) {
            if (typeof func != 'function')
                return;
            function do_func(event) {
                if (chk == null || chk(event)) doMouseAction(config, ctx, event, data, "mouseaction", func);
            };

            if (ctx.canvas.addEventListener) {
                if (type == "mousewheel") type = "DOMMouseScroll";
                ctx.canvas.removeEventListener(type, do_func);
                ctx.canvas.addEventListener(type, do_func, false);
            }
            else if (ctx.canvas.attachEvent) {
                ctx.canvas.attachEvent("on" + type, do_func);
            }
        };
        add_event_listener("mousedown", config.mouseDownLeft, function (e) { return e.which == 1; });
        add_event_listener("mousedown", config.mouseDownMiddle, function (e) { return e.which == 2; });
        add_event_listener("mousedown", config.mouseDownRight, function (e) { return e.which == 3; });
        add_event_listener("mousemove", config.mouseMove);
        add_event_listener("mouseout", config.mouseOut);
        add_event_listener("mousewheel", config.mouseWheel);
    };

    ///////// GRAPHICAL PART OF THE SCRIPT ///////////////////////////////////////////
    //Define the global Chart Variable as a class.
    window.Chart = function (context) {
        context.canvas.chart = this;

        $.extend(this, {
            labelSegments: [],
            segments: [],
            context: context,
            aspectRatio: $(context.canvas).width() / $(context.canvas).height()
        });
        this.resize();

        // Chart types
        this.PolarArea = {};
        this.Radar = {};
        this.Pie = {};
        this.Doughnut = {};
        this.Line = {};
        this.StackedBar = {};
        this.HorizontalStackedBar = {};
        this.Bar = {};
        this.HorizontalBar = {};
        this.defaults = {};
        this.defaults.commonOptions = {
            animationSteps: 30,
            animationEasing: "easeInQuad",
            multiGraph: false,
            clearRect: true, // do not change clearRect options; for internal use only
            dynamicDisplay: false,
            graphSpaceBefore: 5,
            graphSpaceAfter: 5,
            canvasBorders: false,
            canvasBackgroundColor: "none",
            canvasBordersWidth: 3,
            canvasBordersColor: "black",
            graphTitle: "",
            graphTitleFontFamily: "'Arial'",
            graphTitleFontSize: 24,
            graphTitleFontStyle: "bold",
            graphTitleFontColor: "#666",
            graphTitleSpaceBefore: 5,
            graphTitleSpaceAfter: 5,
            graphSubTitle: "",
            graphSubTitleFontFamily: "'Arial'",
            graphSubTitleFontSize: 18,
            graphSubTitleFontStyle: "normal",
            graphSubTitleFontColor: "#666",
            graphSubTitleSpaceBefore: 5,
            graphSubTitleSpaceAfter: 5,
            footNote: "",
            footNoteFontFamily: "'Arial'",
            footNoteFontSize: 8,
            footNoteFontStyle: "bold",
            footNoteFontColor: "#666",
            footNoteSpaceBefore: 5,
            footNoteSpaceAfter: 5,
            legend: false,
            showSingleLegend: false,
            legendFontFamily: "'Arial'",
            legendFontSize: 12,
            legendFontStyle: "normal",
            legendFontColor: "#666",
            legendBlockSize: 15,
            legendBorders: true,
            legendBordersWidth: 1,
            legendBordersColors: "#666",
            legendBordersSpaceBefore: 5,
            legendBordersSpaceAfter: 5,
            legendBordersSpaceLeft: 5,
            legendBordersSpaceRight: 5,
            legendSpaceBeforeText: 5,
            legendSpaceAfterText: 5,
            legendSpaceLeftText: 5,
            legendSpaceRightText: 5,
            legendSpaceBetweenTextVertical: 5,
            legendSpaceBetweenTextHorizontal: 5,
            legendSpaceBetweenBoxAndText: 5,
            annotateDisplay: false,
            savePng: false,
            savePngOutput: "NewWindow", // Allowed values : "NewWindow", "CurrentWindow", "Save"
            savePngFunction: "mousedown right",
            savePngBackgroundColor: 'WHITE',
            annotateFunction: "mousemove",
            annotateFontFamily: "'Arial'",
            annotateBorder: 'none',
            annotateBorderRadius: '2px',
            annotateBackgroundColor: 'rgba(0,0,0,0.8)',
            annotateFontSize: 12,
            annotateFontColor: 'white',
            annotateFontStyle: "normal",
            annotatePadding: "3px",
            annotateClassName: "",
            crossText: [""],
            crossTextIter: ["all"],
            crossTextOverlay: [true],
            crossTextFontFamily: ["'Arial'"],
            crossTextFontSize: [12],
            crossTextFontStyle: ["normal"],
            crossTextFontColor: ["rgba(220,220,220,1)"],
            crossTextRelativePosX: [2],
            crossTextRelativePosY: [2],
            crossTextBaseline: ["middle"],
            crossTextAlign: ["center"],
            crossTextPosX: [0],
            crossTextPosY: [0],
            crossTextAngle: [0],
            crossTextFunction: null,
            crossImage: [undefined],
            crossImageIter: ["all"],
            crossImageOverlay: [true],
            crossImageRelativePosX: [2],
            crossImageRelativePosY: [2],
            crossImageBaseline: ["middle"],
            crossImageAlign: ["center"],
            crossImagePosX: [0],
            crossImagePosY: [0],
            crossImageAngle: [0],
            spaceTop: 0,
            spaceBottom: 0,
            spaceRight: 0,
            spaceLeft: 0,
            decimalSeparator: ".",
            thousandSeparator: "",
            roundNumber: "none",
            roundPct: -1,
            fmtV1: "none",
            fmtV2: "none",
            fmtV3: "none",
            fmtV4: "none",
            fmtV5: "none",
            fmtV6: "none",
            fmtV7: "none",
            fmtV8: "none",
            fmtV9: "none",
            fmtV10: "none",
            fmtV11: "none",
            fmtV12: "none",
            fmtV13: "none",
            fmtXLabel: "none",
            fmtYLabel: "none",
            fmtYLabel2: "none",
            fmtLegend: "none",
            animationStartValue: 0,
            animationStopValue: 1,
            animationCount: 1,
            animationPauseTime: 5,
            animationBackward: false,
            animationStartWithDataset: 1,
            animationStartWithData: 1,
            animationLeftToRight: false,
            animationByDataset: false,
            defaultStrokeColor: "rgba(220,220,220,1)",
            defaultFillColor: "rgba(220,220,220,0.5)",
            mouseDownRight: null,
            mouseDownLeft: null,
            mouseDownMiddle: null,
            mouseMove: null,
            mouseOut: null,
            mouseWheel: null,
            savePngName: "canvas",
            showTooltips: true,
            generateTooltip: function (dataset, data) {
                if (dataset && data) {

                    var tooltipMsg;
                    if (dataset.data && dataset.data[data.idx] && dataset.data[data.idx].tooltip) {
                        tooltipMsg = dataset.data[data.idx].tooltip;
                    }
                    else {
                        tooltipMsg = data.label + ': ' + data.value;
                    }

                    return $('<div></div>')
                        .css({
                            backgroundColor: '#000000',
                            borderRadius: '5px',
                            padding: '2px 5px',
                            margin: '5px',
                            display: 'inline-block',
                            position: 'absolute',
                            color: '#ffffff',
                            opacity: '.90',
                            zIndex: '4000'
                        })
                        .html(tooltipMsg);
                }
            }
        };
        this.defaults.xyAxisCommonOptions = {
            yAxisMinimumInterval: "none",
            yAxisMinimumInterval2: "none",
            yScaleLabelsMinimumWidth: 0,
            xScaleLabelsMinimumWidth: 0,
            xAxisMinWidthToShowLabels: 0,
            yAxisLeft: true,
            yAxisRight: false,
            xAxisBottom: true,
            xAxisTop: false,
            xAxisSpaceBetweenLabels: 5,
            fullWidthGraph: false,
            yAxisLabel: "",
            yAxisLabel2: "",
            yAxisFontFamily: "'Arial'",
            yAxisFontSize: 16,
            yAxisFontStyle: "normal",
            yAxisFontColor: "#666",
            yAxisLabelSpaceRight: 5,
            yAxisLabelSpaceLeft: 5,
            yAxisSpaceRight: 5,
            yAxisSpaceLeft: 5,
            xAxisLabel: "",
            xAxisFontFamily: "'Arial'",
            xAxisFontSize: 16,
            xAxisFontStyle: "normal",
            xAxisFontColor: "#666",
            xAxisLabelSpaceBefore: 5,
            xAxisLabelSpaceAfter: 5,
            xAxisSpaceBefore: 5,
            xAxisSpaceAfter: 5,
            yAxisUnit: "",
            yAxisUnit2: "",
            yAxisUnitFontFamily: "'Arial'",
            yAxisUnitFontSize: 8,
            yAxisUnitFontStyle: "normal",
            yAxisUnitFontColor: "#666",
            yAxisUnitSpaceBefore: 5,
            yAxisUnitSpaceAfter: 5
        };
    }

    //Declare global functions to be called within this namespace here.
    // shim layer with setTimeout fallback
    var requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    Chart.prototype = {
        animate: function () {
            var chart = this;
            var ctx = this.context;
            var data = this.data;
            var config = this.config;
            var drawScale = $.proxy(this.drawScale, this);
            var drawData = $.proxy(this.drawSegments, this);

            var cntiter = 0;
            var animationCount = 1;
            var multAnim = 1;
            if (config.animationStartValue < 0 || config.animationStartValue > 1) config.animation.StartValue = 0;
            if (config.animationStopValue < 0 || config.animationStopValue > 1) config.animation.StopValue = 1;
            if (config.animationStopValue < config.animationStartValue) config.animationStopValue = config.animationStartValue;
            if (isIE() < 9 && isIE() != false) config.animation = false;
            var animFrameAmount = (config.animation) ? 1 / CapValue(config.animationSteps, Number.MAX_VALUE, 1) : 1,
                easingFunction = animationOptions[config.animationEasing],
                percentAnimComplete = (config.animation) ? 0 : 1;
            if (config.animation && config.animationStartValue > 0 && config.animationStartValue <= 1) {
                while (percentAnimComplete < config.animationStartValue) {
                    cntiter++;
                    percentAnimComplete += animFrameAmount;
                }
            }
            var beginAnim = cntiter;
            var beginAnimPct = percentAnimComplete;
            if (typeof drawScale !== "function") drawScale = function () { };

            this.animateFrame = function () {
                var easeAdjustedAnimationPercent = (config.animation) ? CapValue(easingFunction(percentAnimComplete), null, 0) : 1;
                if (1 * cntiter >= 1 * CapValue(config.animationSteps, Number.MAX_VALUE, 1) || config.animation == false) easeAdjustedAnimationPercent = 1;
                else if (easeAdjustedAnimationPercent >= 1) easeAdjustedAnimationPercent = 0.9999;
                if (config.animation && !(isIE() < 9 && isIE() != false) && config.clearRect) {

                    var so = config.scaleOptions;
                    if (so && so.rect) {
                        ctx.clearRect(so.rect.x, ctx.canvas.height - so.rect.y, so.rect.w, so.rect.h);
                    }
                    else if (this.chartMin) {
                        ctx.clearRect(this.chartMin.x, ctx.canvas.height - this.chartMin.y,
                            this.chartMax.x - this.chartMin.x, this.chartMax.y - this.chartMin.y);
                    }
                }
                clear(ctx);
                if (config.scaleOverlay) {
                    drawData(easeAdjustedAnimationPercent);
                    drawScale();
                } else {
                    drawScale();
                    drawData(easeAdjustedAnimationPercent);
                }
            };

            if (config.clearRect) requestAnimFrame(animLoop);
            else animLoop();

            function animLoop() {
                //We need to check if the animation is incomplete (less than 1), or complete (1).
                cntiter += multAnim;
                percentAnimComplete += multAnim * animFrameAmount;
                if (cntiter == config.animationSteps || config.animation == false) percentAnimComplete = 1;
                else if (percentAnimComplete >= 1) percentAnimComplete = 0.999;
                chart.animateFrame();
                //Stop the loop continuing forever
                if (multAnim == -1 && cntiter <= beginAnim) {
                    if (typeof config.onAnimationComplete == "function") config.onAnimationComplete(ctx, config, data, 0, animationCount + 1);
                    multAnim = 1;
                    requestAnimFrame(animLoop);
                } else if (percentAnimComplete < config.animationStopValue) {
                    requestAnimFrame(animLoop);
                } else {
                    if (typeof config.onAnimationComplete == "function") config.onAnimationComplete(ctx, config, data, 1, animationCount + 1);
                    // stop animation ? 
                    if (animationCount < config.animationCount || config.animationCount == 0) {
                        animationCount++;
                        if (config.animationBackward && multAnim == 1) {
                            percentAnimComplete -= animFrameAmount;
                            multAnim = -1;
                        } else {
                            multAnim = 1;
                            cntiter = beginAnim - 1;
                            percentAnimComplete = beginAnimPct - animFrameAmount;
                        }
                        window.setTimeout(animLoop, 2000);
                    }
                }
            };
        },

        // Virtual Methods: These should be overridden by any chart type
        initConstraints: function () { },
        initSegments: function () { },
        drawScale: function () { },
        drawSegments: function (animPc) { },

        setCanvasSize: function (width, height) {
            $(this.context.canvas).width(width).height(height);

            this.context.canvas.width = width;
            this.context.canvas.height = height;
        },

        // Inherited Methods: Only overridden for special cases
        initialize: function () {
            this.labelSegments = [];
            this.segments = [];

            if (this.config.scaleOptions) {
                this.config.scaleOptions.rect = null;
            }

            if (this.config.legendOptions) {
                this.config.legendOptions.rect = null;
            }

            this.initConstraints();

            if (this.config.shrinkToChart || this.config.minWidth || this.config.minHeight) {
                this.setCanvasSize(100, 100);
            }

            this.drawScale();

            var so = this.config.scaleOptions;

            if ((this.config.shrinkToChart || this.config.minWidth || this.config.minHeight) && so) {
                var width = Math.abs(this.config.scaleOptions.rect.x) + this.config.scaleOptions.rect.w + this.config.scaleOptions.xAxis.step;

                var legendHeight = so.legendOptions.rect.h + (so.legendOptions.margin * 2);

                var chartHeight = this.config.scaleOptions.rect.h + this.config.scaleOptions.rect.y + so.xAxis.labelAreaHeight;

                var height = Math.max(legendHeight, chartHeight);

                if (this.config.legendOptions) {
                    var lo = drawLegend(this.context, this.config.legendOptions);
                    if (lo.layout == 'vertical') {
                        width += lo.padding * 2 + lo.rect.w;
                    }
                    else {
                        height += lo.padding * 2 + lo.rect.h;
                    }
                }

                if (this.config.minWidth) {
                    width = Math.max(width, parseInt(this.config.minWidth));
                }

                if (this.config.minHeight) {
                    height = Math.max(height, parseInt(this.config.minHeight));
                }

                this.setCanvasSize(width, height);
                this.initConstraints();
            }

            this.initSegments();
        },

        getFont: function (size, style) {
            return (style || this.config.scaleFontStyle) + " " + (size || this.config.scaleFontSize) + "px " + this.config.scaleFontFamily
        },

        resize: function (width, height) {
            if (height) {
                width = width || height * this.aspectRatio;
            }
            else {
                width = width || $(this.context.canvas).width();
                height = height || width / this.aspectRatio;
            }
            this.context.canvas.width = width;
            this.context.canvas.height = height;

            // this should handle different zoom levels in browsers.
            if (window.devicePixelRatio) {
                //this.context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
                //this.context.canvas.height = height * window.devicePixelRatio;
                //this.context.canvas.width = width * window.devicePixelRatio;
            }
            this.context.canvas.height = Math.min($(this.context.canvas).height(), this.context.canvas.height);
            this.context.canvas.width = Math.min($(this.context.canvas).width(), this.context.canvas.width);

            $(this.context.canvas)
                .width(this.context.canvas.width);

            //this.aspectRatio = this.context.canvas.width / this.context.canvas.height;
        },

        refresh: function (ctx) {
            if (ctx) {
                this.context = ctx;
            }

            this.initialize();
            this.redraw();
        },

        redraw: function () {
            this.initialize();

            this.drawScale();
            this.drawSegments(1);
            this.drawLabels();
        },

        drawLabels: function () {
            this.labelSegments.forEach(function (segment) {
                segment.draw();
            });
        },

        save: function () {
            var ctx = this.context;
            this.cvSave = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        },

        restore: function (ctx) {
            if (ctx) {
                this.context = ctx;
            }

            if (this.cvSave) {
                this.context.putImageData(this.cvSave, 0, 0);
            }
        },

        STBar: function (data, config, bDontInitialize) {
            this.Bar.defaults = {
                inGraphDataShow: false,
                inGraphDataPaddingX: 0,
                inGraphDataPaddingY: 3,
                inGraphDataTmpl: "<%=v3%>",
                inGraphDataAlign: "center",
                inGraphDataVAlign: "bottom",
                inGraphDataRotate: 0,
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataXPosition: 2,
                inGraphDataYPosition: 3,
                scaleOverlay: false,
                scaleOverride: false,
                scaleOverride2: false,
                scaleSteps: null,
                scaleStepWidth: null,
                scaleStartValue: null,
                scaleSteps2: null,
                scaleStepWidth2: null,
                scaleStartValue2: null,
                scaleLineColor: "rgba(0,0,0,.1)",
                scaleLineWidth: 1,
                scaleShowLabels: true,
                scaleShowLabels2: true,
                scaleLabel: "<%=value%>",
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",
                scaleShowGridLines: true,
                scaleXGridLinesStep: 1,
                scaleYGridLinesStep: 1,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                showYAxisMin: true, // Show the minimum value on Y axis (in original version, this minimum is not displayed - it can overlap the X labels)
                rotateLabels: "smart", // smart <=> 0 degre if space enough; otherwise 45 degres if space enough otherwise90 degre; 
                // you can force an integer value between 0 and 180 degres
                logarithmic: false, // can be 'fuzzy',true and false ('fuzzy' => if the gap between min and maximum is big it's using a logarithmic y-Axis scale
                logarithmic2: false, // can be 'fuzzy',true and false ('fuzzy' => if the gap between min and maximum is big it's using a logarithmic y-Axis scale
                scaleTickSizeLeft: 5,
                scaleTickSizeRight: 5,
                scaleTickSizeBottom: 5,
                scaleTickSizeTop: 5,
                barShowStroke: true,
                barStrokeWidth: 2,
                barValueSpacing: 5,
                barDatasetSpacing: 1,
                barBorderRadius: 0,
                animation: true,
                animationSteps: 60,
                animationEasing: "easeOutQuart",
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == '' ? '' : v1) + (v1!='' && v2 !='' ? ' - ' : '')+(v2 == '' ? '' : v2)+(v1!='' || v2 !='' ? ':' : '') + v3 + ' (' + v6 + ' %)'%>",

                showLabels: true,
                showYAxisLabels: true,
                showXAxisLabels: true,
                barSpacing: 2
            };

            // merge annotate defaults
            this.Bar.defaults = mergeChartConfig(this.defaults.commonOptions, this.Bar.defaults);
            this.Bar.defaults = mergeChartConfig(this.defaults.xyAxisCommonOptions, this.Bar.defaults);
            this.Bar.defaults = mergeChartConfig(this.Bar.defaults, charJSPersonalDefaultOptions);
            this.Bar.defaults = mergeChartConfig(this.Bar.defaults, charJSPersonalDefaultOptionsBar);
            config = this.config = (config) ? mergeChartConfig(this.Bar.defaults, config) : this.Bar.defaults;
            this.data = data;

            var chart = this;

            // Allow defaults for data to be specified via the data set or config options
            for (var i = 0; i < data.datasets.length; i++) {
                var ds = data.datasets[i];
                for (var j = 0; j < ds.data.length; j++) {
                    ds.data[j].fillColor = ds.data[j].fillColor
                        || ds.fillColor
                        || config.fillColors[j % config.fillColors.length];

                    ds.data[j].strokeColor = ds.data[j].strokeColor
                        || ds.strokeColor
                        || config.strokeColor;

                    ds.data[j].strokeWidth = ds.data[j].strokeWidth
                        || ds.strokeWidth
                        || config.strokeWidth;

                    ds.data[j].label = ds.data[j].label
                        || (ds.labels && ds.labels[j % ds.labels.length])
                        || ds.label
                        || (config.labels && config.labels[j % config.labels.length]);
                }
            }

            var res = $.extend({
            }, this, {
                initConstraints: function () {
                    var ctx = this.context;
                    var so = this.config.scaleOptions;

                    this.chartMin = {
                        x: 5,
                        y: 10
                    };

                    this.chartMax = {
                        x: ctx.canvas.width - 5,
                        y: ctx.canvas.height - 10
                    };

                    // Calculate the YAxis
                    var values = [];
                    var dataElements = [];
                    for (var i = 0; i < data.datasets.length; i++) {
                        var ds = data.datasets[i];
                        for (var j = 0; j < ds.data.length; j++) {
                            values.push(ds.data[j].value);
                            dataElements.push(ds.data[j]);
                        }
                    }

                    this.minYValue = Math.min.apply(Math, values);
                    this.maxYValue = Math.max.apply(Math, values);

                    if (this.minYValue > 0) {
                        // Round down the min value
                        this.minYValue = Math.floor(this.minYValue - (this.minYValue % 5));

                        // Round up the max value
                        if (this.maxYValue > 10 && this.maxYValue % 5) {
                            this.maxYValue = Math.floor(this.maxYValue + (5 - this.maxYValue % 5));
                        }
                    }

                    var textHeight = config.scaleFontSize;

                    // Calculate how much space we need on the left for labels
                    if (config.showLabels && config.showYAxisLabels) {
                        if (data.yAxisLabel) {
                            this.chartMin.x += textHeight + 5;
                        }

                        this.maxYAxisTextWidth = Math.max(
                            ctx.measureText(this.minYValue.toString()).width,
                            ctx.measureText(this.maxYValue.toString()).width
                        );
                        this.chartMin.x += this.maxYAxisTextWidth + 5;
                    }
                    this.barWidth = (this.chartMax.x - this.chartMin.x - (config.barSpacing * values.length)) / values.length;

                    // Calculate how much space we need at the base for labels
                    this.maxXAxisTextWidth = 0;
                    this.xAxisTextAngle = 0;
                    this.showXAxisLabels = config.showXAxisLabels;

                    for (var i = 0; i < dataElements.length; i++) {
                        this.maxXAxisTextWidth = Math.max(ctx.measureText(dataElements[i].label).width + 10, this.maxXAxisTextWidth);
                    }

                    if (this.barWidth < textHeight / 2 || ctx.canvas.height / 3 < this.maxXAxisTextWidth) {
                        // Don't show x-axis labels if they are too close together
                        this.showXAxisLabels = false;
                        this.chartMin.y += textHeight / 2;
                    }
                    else {
                        if (config.showLabels && this.showXAxisLabels) {
                            if (data.xAxisLabel) {
                                this.chartMin.y += textHeight + 5;
                            }

                            this.chartMin.y += textHeight + 5;
                            if (this.maxXAxisTextWidth > this.barWidth) {
                                var textWidth2 = this.maxXAxisTextWidth * this.maxXAxisTextWidth;
                                this.chartMin.y += Math.sqrt(textWidth2 - this.barWidth * this.barWidth) + textHeight + 5;
                                this.xAxisTextAngle = -Math.acos(this.barWidth / this.maxXAxisTextWidth);
                            }
                        }
                    }

                    // Calculate the step values on the yAxis
                    var yRange = this.maxYValue - this.minYValue;
                    var yAvailablePixels = this.chartMax.y - this.chartMin.y;
                    this.yValueStep = 1;
                    while (yAvailablePixels > 0 && yAvailablePixels < (yRange / this.yValueStep) * (textHeight + 5)) {
                        this.yValueStep++;
                    }
                    this.yPixelsStep = yAvailablePixels / (yRange / this.yValueStep);
                    this.chartYAspect = (this.chartMax.y - this.chartMin.y) / yRange;
                },

                initSegments: function () {
                    var ctx = this.context;
                    var textHeight = config.scaleFontSize;

                    // yAxis Labels
                    var xPos = this.chartMin.x - 5;
                    var yPos = this.chartMin.y;
                    if (config.showLabels && config.showYAxisLabels) {
                        for (var y = this.minYValue; y <= this.maxYValue; y += this.yValueStep) {
                            var textSegment = new ChartSegment(ctx, '#ffffff', '#888888', 0).TextSegment(
                                y.toString(),
                                xPos,
                                yPos,
                                this.getFont(),
                                0,
                                2,
                                {
                                    fillStyle: '#888888',
                                    textAlign: 'right',
                                    textBaseline: 'middle'
                                }
                            );
                            this.labelSegments.push(textSegment);

                            yPos += this.yPixelsStep;
                        }
                    }

                    // Calculate the label baseline
                    var yLabelPos = this.chartMin.y - textHeight;

                    // Calculate the bar baseline
                    var yPos = this.chartMin.y;
                    var halfBarWidth = ((this.barWidth + config.barSpacing) / 2);

                    config.scaleYStart = parseFloat(config.scaleYStart);
                    var yBase = 0;
                    var yBaseValue = 0;
                    if (this.minYValue < 0) {
                        yBase = Math.abs(this.minYValue / this.yValueStep) * this.yPixelsStep;
                    }
                    else if (config.scaleYStart < 0 || isNaN(config.scaleYStart)) {
                        yBaseValue = this.minYValue;
                    }
                    else {
                        yBaseValue = config.scaleYStart;
                    }

                    for (var i = 0; i < data.datasets.length; i++) {
                        var xPos = this.chartMin.x + (i * (this.barWidth + config.barSpacing));

                        var ds = data.datasets[i];
                        for (var j = 0; j < ds.data.length; j++) {
                            // Bar segment
                            var yValueHeight = (ds.data[j].value - yBaseValue) * this.chartYAspect;
                            var segment = new ChartSegment(ctx, ds.data[j].fillColor, ds.data[j].strokeColor, ds.data[j].strokeWidth)
                                .RectSegment(
                                    xPos,
                                    yBase + yPos,
                                    this.barWidth,
                                    yValueHeight
                                );
                            segment.dataset = ds;
                            segment.data = ds.data[j];

                            this.segments.push(segment);

                            // Bar label
                            var textWidth = ctx.measureText(ds.data[j].value.toString()).width + 10;
                            var textAspect = this.barWidth / textWidth;
                            var textSize = Math.min(24, textAspect * config.scaleFontSize);

                            if (textWidth < this.barWidth) {
                                var textSegment = new ChartSegment(ctx, '#ffffff', '#888888', 0).TextSegment(
                                    ds.data[j].value.toString(),
                                    xPos + (this.barWidth / 2),
                                    yBase + yPos + (yValueHeight / 2),
                                    this.getFont(textSize),//(this.barWidth - 5) * textAspect,
                                    0,
                                    2,
                                    {
                                        fillStyle: new tinycolor(ds.data[j].fillColor).isDark() ? '#ffffff' : '#000000',
                                        textAlign: 'center',
                                        textBaseline: 'middle'
                                    }
                                );
                                segment.children.push(textSegment);
                            }

                            // xAxis Label
                            if (config.showLabels && this.showXAxisLabels) {
                                var w = ctx.measureText(ds.data[j].label).width;
                                w *= Math.sin(this.xAxisTextAngle);

                                var textSegment = new ChartSegment(ctx, '#ffffff', '#888888', 0).TextSegment(
                                    ds.data[j].label,
                                    (this.xAxisTextAngle) ? xPos + this.barWidth : xPos + halfBarWidth,
                                    yLabelPos,
                                    this.getFont(),
                                    this.xAxisTextAngle,
                                    2,
                                    {
                                        fillStyle: '#888888',
                                        textAlign: (this.xAxisTextAngle) ? 'right' : 'center',
                                        textBaseline: 'ideographic'
                                    }
                                );
                                this.labelSegments.push(textSegment);
                            }

                            xPos += (this.barWidth + config.barSpacing) * data.datasets.length;
                        }
                    }
                },

                drawScale: function () {
                    var ctx = this.context;
                    this.drawLabels();

                    var textHeight = config.scaleFontSize;

                    // Draw the ticks
                    ctx.strokeStyle = 'rgba(196, 196, 196, 0.5)';
                    ctx.strokeWidth = 1;

                    var yPos = ctx.canvas.height - this.chartMin.y;
                    for (var y = this.minYValue; y <= this.maxYValue; y += this.yValueStep) {
                        ctx.beginPath();
                        ctx.moveTo(this.chartMax.x, yPos);
                        ctx.lineTo(this.chartMin.x, yPos);
                        ctx.stroke();
                        ctx.closePath();

                        yPos -= this.chartYAspect * this.yValueStep;
                    }

                    // Draw the axis
                    ctx.strokeStyle = '#888888';
                    ctx.strokeWidth = 2;

                    yPos = ctx.canvas.height - this.chartMin.y;
                    ctx.beginPath();
                    ctx.lineTo(this.chartMin.x, yPos);
                    ctx.lineTo(this.chartMax.x, yPos);
                    ctx.stroke();
                    ctx.closePath();
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['height']);
                    });
                }
            });

            if (!bDontInitialize) {
                res.initialize();
                res.animate();
            }

            this.context.canvas.chart = res;
            return res;
        },

        STGroupedBar: function (data, config, bDontInitialize) {
            this.Bar.defaults = {
                scaleOptions: mergeObjectsRecursive({}, scaleDefaultOptions),
                legendOptions: legendDefaultOptions,
                inGraphDataShow: false,
                inGraphDataPaddingX: 0,
                inGraphDataPaddingY: 3,
                inGraphDataTmpl: "<%=v3%>",
                inGraphDataAlign: "center",
                inGraphDataVAlign: "bottom",
                inGraphDataRotate: 0,
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataXPosition: 2,
                inGraphDataYPosition: 3,
                scaleOverlay: false,
                scaleOverride: false,
                scaleOverride2: false,
                scaleSteps: null,
                scaleStepWidth: null,
                scaleStartValue: null,
                scaleSteps2: null,
                scaleStepWidth2: null,
                scaleStartValue2: null,
                scaleLineColor: "rgba(0,0,0,.1)",
                scaleLineWidth: 1,
                scaleShowLabels: true,
                scaleShowLabels2: true,
                scaleLabel: "<%=value%>",
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",
                scaleShowGridLines: true,
                scaleXGridLinesStep: 1,
                scaleYGridLinesStep: 1,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                showYAxisMin: true, // Show the minimum value on Y axis (in original version, this minimum is not displayed - it can overlap the X labels)
                rotateLabels: "smart", // smart <=> 0 degre if space enough; otherwise 45 degres if space enough otherwise90 degre; 
                // you can force an integer value between 0 and 180 degres
                logarithmic: false, // can be 'fuzzy',true and false ('fuzzy' => if the gap between min and maximum is big it's using a logarithmic y-Axis scale
                logarithmic2: false, // can be 'fuzzy',true and false ('fuzzy' => if the gap between min and maximum is big it's using a logarithmic y-Axis scale
                scaleTickSizeLeft: 5,
                scaleTickSizeRight: 5,
                scaleTickSizeBottom: 5,
                scaleTickSizeTop: 5,
                barShowStroke: true,
                barStrokeWidth: 2,
                barValueSpacing: 5,
                barDatasetSpacing: 1,
                barBorderRadius: 0,
                animation: true,
                animationSteps: 60,
                animationEasing: "easeOutQuart",
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == '' ? '' : v1) + (v1!='' && v2 !='' ? ' - ' : '')+(v2 == '' ? '' : v2)+(v1!='' || v2 !='' ? ':' : '') + v3 + ' (' + v6 + ' %)'%>",

                showLabels: true,
                showYAxisLabels: true,
                showXAxisLabels: true,
                barSpacing: 2
            };

            // merge annotate defaults
            mergeObjectsRecursive(this.Bar.defaults, this.defaults.commonOptions, this.defaults.xyAxisCommonOptions,
                charJSPersonalDefaultOptions, charJSPersonalDefaultOptionsBar, config);

            this.Bar.defaults = mergeChartConfig(this.defaults.commonOptions, this.Bar.defaults);
            this.Bar.defaults = mergeChartConfig(this.defaults.xyAxisCommonOptions, this.Bar.defaults);
            this.Bar.defaults = mergeChartConfig(this.Bar.defaults, charJSPersonalDefaultOptions);
            this.Bar.defaults = mergeChartConfig(this.Bar.defaults, charJSPersonalDefaultOptionsBar);
            config = this.config = (config) ? mergeChartConfig(this.Bar.defaults, config) : this.Bar.defaults;
            this.data = data;

            var chart = this;

            // Allow defaults for data to be specified via the data set or config options
            for (var i = 0; i < data.datasets.length; i++) {
                var ds = data.datasets[i];
                for (var j = 0; j < ds.data.length; j++) {
                    ds.data[j].fillColor = ds.data[j].fillColor
                        || ds.fillColor
                        || config.fillColors[j % config.fillColors.length];

                    ds.data[j].strokeColor = ds.data[j].strokeColor
                        || ds.strokeColor
                        || config.strokeColor;

                    ds.data[j].strokeWidth = ds.data[j].strokeWidth
                        || ds.strokeWidth
                        || config.strokeWidth;

                    ds.data[j].label = ds.data[j].label
                        || (ds.labels && ds.labels[j % ds.labels.length])
                        || ds.label
                        || (config.labels && config.labels[j % config.labels.length]);
                }
            }

            var res = $.extend({}, this, {
                initConstraints: function () {
                    var ctx = this.context;
                    var so = this.config.scaleOptions;

                    if (so.rect) {
                        this.chartMin = {
                            x: so.rect.x,
                            y: so.rect.y
                        };

                        this.chartMax = {
                            x: so.rect.x + so.rect.w,
                            y: so.rect.y + so.rect.h
                        };
                    }
                    else {
                        this.chartMin = {
                            x: 5,
                            y: 10
                        };

                        this.chartMax = {
                            x: ctx.canvas.width - 5,
                            y: ctx.canvas.height - 10
                        };
                    }

                    // Calculate the YAxis
                    var values = [];
                    var dataElements = [];
                    for (var i = 0; i < data.datasets.length; i++) {
                        var ds = data.datasets[i];
                        for (var j = 0; j < ds.data.length; j++) {
                            values.push(ds.data[j].value);
                            dataElements.push(ds.data[j]);
                        }
                    }

                    var useMinYConfig = this.config.minYValue !== undefined && !isNaN(this.config.minYValue);
                    var useMaxYConfig = this.config.maxYValue !== undefined && !isNaN(this.config.maxYValue);

                    this.minYValue = useMinYConfig ? this.config.minYValue : Math.min.apply(Math, values);
                    this.maxYValue = useMaxYConfig ? this.config.maxYValue : Math.max.apply(Math, values);

                    if (this.minYValue > 0) {
                        // Round down the min value
                        if (!useMinYConfig) {
                            this.minYValue = Math.floor(this.minYValue - (this.minYValue % 5));
                        }

                        // Round up the max value
                        if (!useMaxYConfig && this.maxYValue > 10 && this.maxYValue % 5) {
                            this.maxYValue = Math.floor(this.maxYValue + (5 - this.maxYValue % 5));
                        }
                    }

                    var textHeight = config.scaleFontSize;

                    // Calculate how much space we need on the left for labels
                    if (config.showLabels && config.showYAxisLabels) {
                        if (data.yAxisLabel) {
                            if (!so.rect) {
                                this.chartMin.x += textHeight + 5;
                            }
                        }

                        this.maxYAxisTextWidth = Math.max(
                            ctx.measureText(this.minYValue.toString()).width,
                            ctx.measureText(this.maxYValue.toString()).width
                        );
                        if (!so.rect) {
                            this.chartMin.x += this.maxYAxisTextWidth + 5;
                        }
                    }
                    this.barWidth = (this.chartMax.x - this.chartMin.x - (config.barSpacing * values.length)) / values.length;

                    // Calculate how much space we need at the base for labels
                    this.maxXAxisTextWidth = 0;
                    this.xAxisTextAngle = 0;
                    this.showXAxisLabels = config.showXAxisLabels;

                    for (var i = 0; i < dataElements.length; i++) {
                        this.maxXAxisTextWidth = Math.max(ctx.measureText(dataElements[i].label).width + 10, this.maxXAxisTextWidth);
                    }

                    if (this.barWidth < textHeight / 2 || ctx.canvas.height / 3 < this.maxXAxisTextWidth) {
                        // Don't show x-axis labels if they are too close together
                        this.showXAxisLabels = false;
                        if (!so.rect) {
                            this.chartMin.y += textHeight / 2;
                        }
                    }
                    else {
                        if (config.showLabels && this.showXAxisLabels) {
                            if (data.xAxisLabel) {
                                if (!so.rect) {
                                    this.chartMin.y += textHeight + 5;
                                }
                            }

                            this.chartMin.y += textHeight + 5;
                            if (this.maxXAxisTextWidth > this.barWidth) {
                                var textWidth2 = this.maxXAxisTextWidth * this.maxXAxisTextWidth;
                                if (!so.rect) {
                                    this.chartMin.y += Math.sqrt(textWidth2 - this.barWidth * this.barWidth) + textHeight + 5;
                                }
                                this.xAxisTextAngle = -Math.acos(this.barWidth / this.maxXAxisTextWidth);
                            }
                        }
                    }

                    // Calculate the step values on the yAxis
                    var yRange = this.maxYValue - this.minYValue;
                    var yAvailablePixels = this.chartMax.y - this.chartMin.y;
                    this.yValueStep = 1;
                    while (yAvailablePixels > 0 && yAvailablePixels < (yRange / this.yValueStep) * (textHeight + 5)) {
                        this.yValueStep++;
                    }
                    this.yPixelsStep = yAvailablePixels / (yRange / this.yValueStep);
                    this.chartYAspect = (this.chartMax.y - this.chartMin.y) / yRange;
                    this.yRange = yRange;

                    var lo = this.config.legendOptions;
                    lo.labels = [];
                    lo.colors = [];
                    if (data.datasets.length) {
                        data.datasets.forEach(function (ds) {
                            if (ds.data && ds.data.length) {
                                lo.labels.push(ds.data[0].label);
                                lo.colors.push(ds.data[0].fillColor);
                            }
                        });
                    }

                    var so = this.config.scaleOptions;
                    so.rect = {
                        w: ctx.canvas.width
                    };
                    this.drawScale();

                    var so = this.config.scaleOptions;
                    this.barWidth = (so.rect.w - (data.datasets[0].data.length * so.seriesPadding)) /
                                    (data.datasets.length * data.datasets[0].data.length) - so.xAxis.padding;
                },

                initSegments: function () {
                    var ctx = this.context;
                    var textHeight = config.scaleFontSize;
                    var so = this.config.scaleOptions;
                    var rect = so.rect;
                    var yPos = this.chartMin.y;

                    // Calculate the label baseline
                    var yLabelPos = this.chartMin.y - textHeight;

                    // Calculate the bar baseline
                    var yPos = this.chartMin.y;
                    var halfBarWidth = ((this.barWidth + config.barSpacing) / 2);

                    config.scaleYStart = parseFloat(config.scaleYStart);
                    var yBase = 0;
                    var yBaseValue = 0;
                    if (this.minYValue < 0) {
                        yBase = Math.abs(this.minYValue / this.yValueStep) * this.yPixelsStep;
                    }
                    else if (config.scaleYStart < 0 || isNaN(config.scaleYStart)) {
                        yBaseValue = this.minYValue;
                    }
                    else {
                        yBaseValue = config.scaleYStart;
                    }

                    var unit = (so.rect.h - so.yAxis.step) / this.yRange;
                    yPos = this.context.canvas.height - (rect.y + rect.h);
                    for (var i = 0; i < data.datasets.length; i++) {
                        var xPos = rect.x + (i * (this.barWidth + this.config.barSpacing)) +
                                   so.seriesPadding / 2;

                        var ds = data.datasets[i];
                        for (var j = 0; j < ds.data.length; j++) {
                            // Bar segment
                            var yValueHeight = (ds.data[j].value - yBaseValue) * unit;

                            var segment = new ChartSegment(ctx, ds.data[j].fillColor, ds.data[j].strokeColor, ds.data[j].strokeWidth)
                                .RectSegment(
                                    xPos,
                                    yPos,
                                    this.barWidth,
                                    yValueHeight
                                );
                            segment.dataset = ds;
                            segment.data = ds.data[j];

                            this.segments.push(segment);

                            // Bar label
                            var textWidth = ctx.measureText(ds.data[j].value.toString()).width + 10;
                            var textAspect = this.barWidth / textWidth;
                            var textSize = Math.min(24, textAspect * config.scaleFontSize);

                            if (textWidth < this.barWidth) {
                                var textSegment = new ChartSegment(ctx, '#ffffff', '#888888', 0).TextSegment(
                                    ds.data[j].value.toString(),
                                    xPos + (this.barWidth / 2),
                                    yBase + yPos + (yValueHeight / 2),
                                    this.getFont(textSize),//(this.barWidth - 5) * textAspect,
                                    0,
                                    2,
                                    {
                                        fillStyle: new tinycolor(ds.data[j].fillColor).isDark() ? '#ffffff' : '#000000',
                                        textAlign: 'center',
                                        textBaseline: 'middle'
                                    }
                                );
                                segment.children.push(textSegment);
                            }

                            xPos += (this.barWidth + so.xAxis.padding) * data.datasets.length + so.seriesPadding;
                        }
                    }
                },

                drawScale: function () {
                    // yAxis Labels
                    var xPos = this.chartMin.x - 5;
                    var yPos = this.chartMin.y;
                    var yAxisLabels = [];
                    if (config.showLabels && config.showYAxisLabels) {
                        for (var y = this.minYValue; y <= this.maxYValue; y += this.config.stepYValue || this.yValueStep) {
                            yAxisLabels.push(y)
                        }
                    }

                    var scaleOptions = mergeObjectsRecursive({}, this.config.scaleOptions, {
                        rect: {
                            x: this.chartMin.x,
                            y: 0,
                            w: this.chartMax.x - this.chartMin.x,
                            h: this.chartMax.y - this.chartMin.y
                        },

                        xAxis: {
                            labels: data.labels,
                            strokeWidth: 1,
                            centerLine: false
                        },

                        yAxis: {
                            labels: yAxisLabels,
                            strokeWidth: 1
                        }
                    });

                    this.config.scaleOptions = drawScale(this.context, scaleOptions, this.config.legendOptions);
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['height']);
                    });
                }
            });

            if (!bDontInitialize) {
                res.initialize();
                res.animate();
            }

            this.context.canvas.chart = res;
            return res;
        },

        STLine: function (data, config) {
            var res = $.extend({}, this);

            config.showXAxisLabels = true;
            $.extend(res, res.STBar(data, config, true));

            var baseInitSegments = res.initSegments;
            $.extend(res, {
                initSegments: function () {
                    baseInitSegments.call(this);

                    var config = this.config;

                    var chart = this;
                    var textHeight = config.scaleFontSize;
                    this.segments = [];

                    // Calculate the baseline
                    var halfBarWidth = ((this.barWidth + config.barSpacing) / 2);

                    var yBase = 0;
                    var yBaseValue = 0;
                    if (this.minYValue < 0) {
                        yBase = Math.abs(this.minYValue / this.yValueStep) * this.yPixelsStep;
                    }
                    else {
                        yBaseValue = this.minYValue;
                    }

                    // Iterate through the datasets
                    data.datasets.forEach(function (ds, i) {
                        var prevPt;
                        var xPos = chart.chartMin.x + (i * (chart.barWidth + config.barSpacing)) + halfBarWidth;
                        ds.data.forEach(function (item) {
                            var yPos = yBase + chart.chartMin.y + (item.value - yBaseValue) * chart.chartYAspect;

                            // Draw a line from the previous point
                            if (prevPt) {
                                var segment = new ChartSegment(chart.context, item.fillColor, item.strokeColor, 3)
                                    .LineSegment(xPos, yPos, prevPt.x, prevPt.y, prevPt.color);

                                chart.segments.unshift(segment);
                            }
                            prevPt = {
                                x: xPos, y: yPos, color: item.fillColor
                            };

                            // Render the point itself
                            var segment = new ChartSegment(chart.context, item.fillColor, item.strokeColor, item.strokeWidth)
                                .CircleSegment(xPos, yPos, 5, 5);
                            segment.dataset = ds;
                            segment.data = item;

                            chart.segments.push(segment);

                            // Add a label for this point
                            if (config.showChartLabels) {
                                var textWidth = chart.context.measureText(item.label).width;
                                var xalign = 'left';
                                if (xPos + 10 + textWidth >= chart.chartMax.x) {
                                    xalign = 'right';
                                }

                                var labelSegment = new ChartSegment(chart.context, data.fillColor, data.strokeColor || '#ffffff', data.strokeWidth || 1)
                                    .TextSegment(
                                        item.label,
                                        (xalign == 'left') ? xPos + 10 : xPos - 10,
                                        yPos,
                                        chart.getFont(),
                                        0,
                                        2,
                                        {
                                            fillStyle: '#000000',
                                            textAlign: xalign,
                                            textBaseline: 'middle'
                                        }
                                    );
                                segment.children.push(labelSegment);
                            }

                            xPos += (chart.barWidth + config.barSpacing);
                        })
                    });
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['radius', 'lengthX', 'lengthY']);
                    });
                }
            });

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },

        STPie: function (data, config) {
            this.Pie.defaults = {
                innerRadius: 0,
                inGraphDataShow: false,
                inGraphDataPaddingRadius: 5,
                inGraphDataPaddingAngle: 0,
                inGraphDataTmpl: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                inGraphDataAlign: "off-center", // "right", "center", "left", "off-center" or "to-center"
                inGraphDataVAlign: "off-center", // "bottom", "center", "top", "off-center" or "to-center"
                inGraphDataRotate: 0, // rotateAngle value (0->360) , "inRadiusAxis" or "inRadiusAxisRotateLabels"
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataRadiusPosition: 3,
                inGraphDataAnglePosition: 2,
                segmentShowStroke: true,
                segmentStrokeColor: "#fff",
                segmentStrokeWidth: 2,
                animation: true,
                animationSteps: 100,
                animationEasing: "easeOutBounce",
                animateRotate: true,
                animateScale: false,
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                startAngle: 90,
                radiusScale: 1
            };
            // merge annotate defaults
            this.Pie.defaults = mergeChartConfig(this.defaults.commonOptions, this.Pie.defaults);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptions);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptionsPie);
            config = this.config = (config) ? mergeChartConfig(this.Pie.defaults, config) : this.Pie.defaults;

            var chart = this;
            var res = $.extend({
            }, this, {
                initConstraints: function () {
                    this.chartMin = {
                        y: 5, x: 5
                    };
                    this.chartMax = {
                        y: this.context.canvas.height - 5, x: this.context.canvas.width - 5
                    };

                    this.numCharts = data.datasets.length;
                    this.chartDim = Math.ceil(Math.sqrt(this.numCharts));
                    this.individualChartSize = {
                        x: (this.chartMax.x - this.chartMin.x) / this.chartDim - 5,
                        y: (this.chartMax.y - this.chartMin.y) / this.chartDim - 5
                    };

                    this.chartRadius = Math.min(
                        ((this.chartMax.x - this.chartMin.x - this.chartDim * 5) / this.chartDim) / 2,
                        ((this.chartMax.y - this.chartMin.y - this.chartDim * 5) / this.chartDim) / 2
                        );
                    this.chartRadius = Math.max(0, this.chartRadius);

                    this.innerRadius = this.chartRadius * (config.innerRadius / 100);
                },

                initSegments: function () {
                    var chart = this;

                    var yMid = chart.chartMax.y - (chart.individualChartSize.y / 2) - 5;
                    for (var i = 0; i < data.datasets.length; i++) {
                        var xMid = chart.chartMin.x + (chart.individualChartSize.x / 2) + 5;
                        for (var dim = 0; dim < chart.chartDim && i + dim < data.datasets.length; dim++) {
                            var ds = data.datasets[i + dim];

                            var sum = 0;
                            var total = 0;
                            ds.data.forEach(function (data) {
                                total += Math.abs(data.value);
                            });

                            var ds = data.datasets[i + dim];
                            ds.data.forEach(function (data) {
                                var startAngle = (sum / total) * Math.PI * 2;
                                var stopAngle = startAngle + ((Math.abs(data.value) / total) * Math.PI * 2);
                                sum += Math.abs(data.value);

                                // Arc segment
                                var segment = new ChartSegment(chart.context, data.fillColor, data.strokeColor || '#ffffff', data.strokeWidth || 1)
                                    .ArcSegment(xMid, yMid, chart.innerRadius, chart.chartRadius, startAngle, stopAngle);
                                segment.dataset = ds;
                                segment.data = data;

                                chart.segments.push(segment);

                                // Label segment
                                var angle = (startAngle + stopAngle) / 2;
                                var hRad = chart.chartRadius - 15;
                                var cos = Math.cos(angle);
                                var xPos = xMid + (hRad * cos);
                                var yPos = yMid + (hRad * -Math.sin(angle));

                                var labelSegment = new ChartSegment(chart.context, data.fillColor, data.strokeColor || '#ffffff', data.strokeWidth || 1)
                                    .TextSegment(
                                        data.label,
                                        xPos,
                                        yPos,
                                        chart.getFont(),
                                        cos < 0 ? angle + Math.PI : angle,
                                        2,
                                        {
                                            fillStyle: new tinycolor(data.fillColor).isDark() ? '#ffffff' : '#000000',
                                            textAlign: cos < 0 ? 'left' : 'right',
                                            textBaseline: 'middle'
                                        }
                                    );
                                segment.children.push(labelSegment);
                            });

                            xMid += (chart.individualChartSize.x / 2) + 5;
                        }
                        yMid -= (chart.individualChartSize.y / 2) + 5;
                    }
                },

                drawScale: function (animPc) {
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['startAngle', 'stopAngle', 'innerRadius', 'outerRadius']);
                    });
                }
            });

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },

        STRing: function (data, config) {
            this.Pie.defaults = {
                innerRadius: config.innerRadius || 70,
                inGraphDataShow: false,
                inGraphDataPaddingRadius: 5,
                inGraphDataPaddingAngle: 0,
                inGraphDataTmpl: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                inGraphDataAlign: "off-center", // "right", "center", "left", "off-center" or "to-center"
                inGraphDataVAlign: "off-center", // "bottom", "center", "top", "off-center" or "to-center"
                inGraphDataRotate: 0, // rotateAngle value (0->360) , "inRadiusAxis" or "inRadiusAxisRotateLabels"
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataRadiusPosition: 3,
                inGraphDataAnglePosition: 2,
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",
                segmentShowStroke: true,
                segmentStrokeColor: "#fff",
                segmentStrokeWidth: 2,
                animation: true,
                animationSteps: 100,
                animationEasing: "easeOutBounce",
                animateRotate: true,
                animateScale: false,
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                startAngle: 90,
                radiusScale: 1
            };

            // merge annotate defaults
            this.Pie.defaults = mergeChartConfig(this.defaults.commonOptions, this.Pie.defaults);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptions);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptionsPie);
            config = this.config = (config) ? mergeChartConfig(this.Pie.defaults, config) : this.Pie.defaults;

            var chart = this;

            var res = $.extend({
            }, this, {
                initConstraints: function () {
                    this.chartMin = {
                        y: 5, x: 5
                    };
                    this.chartMax = {
                        y: this.context.canvas.height - 5, x: this.context.canvas.width - 5
                    };

                    this.numCharts = data.datasets.length;
                    this.chartDim = Math.ceil(Math.sqrt(this.numCharts));
                    this.individualChartSize = {
                        x: (this.chartMax.x - this.chartMin.x) / this.chartDim - 5,
                        y: (this.chartMax.y - this.chartMin.y) / this.chartDim - 5
                    };

                    this.chartRadius = Math.min(
                        ((this.chartMax.x - this.chartMin.x - this.chartDim * 5) / this.chartDim) / 2,
                        ((this.chartMax.y - this.chartMin.y - this.chartDim * 5) / this.chartDim) / 2
                        );
                    this.chartRadius = Math.max(0, this.chartRadius);

                    this.innerRadius = this.chartRadius * (config.innerRadius / 100);
                },

                initSegments: function () {
                    var chart = this;

                    var yMid = chart.chartMax.y - (chart.individualChartSize.y / 2) - 5;
                    for (var i = 0; i < data.datasets.length; i++) {
                        var xMid = chart.chartMin.x + (chart.individualChartSize.x / 2) + 5;
                        for (var dim = 0; dim < chart.chartDim && i + dim < data.datasets.length; dim++) {
                            var ds = data.datasets[i + dim];

                            var sum = 0;
                            var total = 0;
                            ds.data.forEach(function (data) {
                                total += Math.abs(data.value);
                            });

                            var ds = data.datasets[i + dim];
                            ds.data.forEach(function (data) {
                                var realStartAngle = chart.config.startAngle * (Math.PI / 180) + 2 * Math.PI;
                                while (realStartAngle < 0) {
                                    realStartAngle += 2 * Math.PI;
                                }
                                while (realStartAngle > 2 * Math.PI) {
                                    realStartAngle -= 2 * Math.PI;
                                }

                                var startAngle = (sum / total) * Math.PI * 2 + realStartAngle;
                                var stopAngle = startAngle + ((Math.abs(data.value) / total) * Math.PI * 2);
                                sum += Math.abs(data.value);

                                // Arc segment
                                var segment = new ChartSegment(chart.context, data.fillColor, data.strokeColor || '#ffffff', data.strokeWidth || 1)
                                    .ArcSegment(xMid, yMid, chart.innerRadius, chart.chartRadius, startAngle, stopAngle);
                                segment.dataset = ds;
                                segment.data = data;

                                chart.segments.push(segment);

                                // Label segment
                                if (chart.config.drawLabels) {
                                    var angle = (startAngle + stopAngle) / 2;
                                    var hRad = chart.chartRadius - 15;
                                    var cos = Math.cos(angle);
                                    var xPos = xMid + (hRad * cos);
                                    var yPos = yMid + (hRad * -Math.sin(angle));

                                    var labelSegment = new ChartSegment(chart.context, data.fillColor, data.strokeColor || '#ffffff', data.strokeWidth || 1)
                                        .TextSegment(
                                            data.label,
                                            xPos,
                                            yPos,
                                            chart.getFont(),
                                            cos < 0 ? angle + Math.PI : angle,
                                            2,
                                            {
                                                fillStyle: new tinycolor(data.fillColor).isDark() ? '#ffffff' : '#000000',
                                                textAlign: cos < 0 ? 'left' : 'right',
                                                textBaseline: 'middle'
                                            }
                                        );
                                    segment.children.push(labelSegment);
                                }
                            });

                            this.valueTotal = total;
                            xMid += (chart.individualChartSize.x / 2) + 5;
                        }
                        yMid -= (chart.individualChartSize.y / 2) + 5;
                    }
                },

                drawScale: function (animPc) {
                    clear(this.context);
                },

                drawSegments: function (animPc) {
                    var chart = this;
                    var ctx = this.context;
                    var textHeight = this.config.scaleFontSize;

                    var xMid = this.chartMin.x + (this.chartMax.x - this.chartMin.x) * 0.5;
                    var yMid = this.chartMin.y + (this.chartMax.y - this.chartMin.y) * 0.5;
                    yMid -= this.innerRadius * 0.3;

                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['startAngle', 'stopAngle', 'innerRadius', 'outerRadius']);
                    });

                    // Render the current percentage
                    var series = (this.activeSegment && this.activeSegment.data) || data.datasets[0].data[0];
                    if (series) {
                        var value = (series.value / this.valueTotal * 100) || 0;
                        var valueText = new ChartSegment(ctx, '#ffffff', series.fillColor, 0)
                            .TextSegment(
                                (value < 1 && value > 0 ? value.toFixed(1).substr(1) : value.toFixed(0)) + '%',
                                xMid,
                                yMid,
                                this.getFont(this.innerRadius * 0.8),
                                0,
                                2,
                                {
                                    fillStyle: series.fillColor,
                                    textAlign: 'center',
                                    textBaseline: 'bottom'
                                }
                            );
                        valueText.draw();

                        // Render the current label
                        var valueText = new ChartSegment(ctx, '#ffffff', series.fillColor, 0)
                            .TextSegment(
                                series.label,
                                xMid,
                                yMid,
                                this.getFont(this.config.scaleFontSize * 1.4, 'bold'),
                                0,
                                2,
                                {
                                    fillStyle: series.fillColor,
                                    textAlign: 'center',
                                    textBaseline: 'top'
                                }
                            );
                        valueText.draw();
                    }
                }
            });

            $(res.context.canvas).on('segment-mouseenter', function (ev, segment) {
                res.redraw();
            });

            $(res.context.canvas).on('segment-mouseleave', function (ev, segment) {
                res.redraw();
            });

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },

        STDoughnut: function (data, config) {
            config.innerRadius = config.innerRadius || 50;
            return this.STPie(data, config);
        },

        STTileMap: function (data, config) {
            this.Pie.defaults = {
                innerRadius: 0,
                inGraphDataShow: false,
                inGraphDataPaddingRadius: 5,
                inGraphDataPaddingAngle: 0,
                inGraphDataTmpl: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                inGraphDataAlign: "off-center", // "right", "center", "left", "off-center" or "to-center"
                inGraphDataVAlign: "off-center", // "bottom", "center", "top", "off-center" or "to-center"
                inGraphDataRotate: 0, // rotateAngle value (0->360) , "inRadiusAxis" or "inRadiusAxisRotateLabels"
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataRadiusPosition: 3,
                inGraphDataAnglePosition: 2,
                segmentShowStroke: true,
                segmentStrokeColor: "#fff",
                segmentStrokeWidth: 2,
                animation: true,
                animationSteps: 100,
                animationEasing: "easeOutBounce",
                animateRotate: true,
                animateScale: false,
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                startAngle: 90,
                radiusScale: 1,
                scaleFontSize: 16
            };
            // merge annotate defaults
            this.Pie.defaults = mergeChartConfig(this.defaults.commonOptions, this.Pie.defaults);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptions);
            this.Pie.defaults = mergeChartConfig(this.Pie.defaults, charJSPersonalDefaultOptionsPie);
            config = this.config = (config) ? mergeChartConfig(this.Pie.defaults, config) : this.Pie.defaults;

            var chart = this;

            var res = $.extend({
            }, this, {
                initConstraints: function () {
                    var chart = this;
                    var ctx = this.context;

                    this.chartMin = {
                        y: 0, x: 0
                    };
                    this.chartMax = {
                        y: this.context.canvas.height, x: this.context.canvas.width
                    };

                    chart.minTileSize = 0;
                    chart.numPoints = 0;
                    chart.maxValue = 0;

                    // Get the number of data points
                    data.datasets.forEach(function (ds, i) {
                        ds.data.forEach(function (item) {
                            chart.numPoints++;
                        });
                    });

                    // Calculate the number of tiles per row and column
                    chart.tilesPerRow = Math.ceil(Math.sqrt(chart.numPoints));
                    chart.tilesPerCol = Math.ceil(chart.numPoints / chart.tilesPerRow);

                    // Calculate the tile size and setup the tile labels
                    ctx.font = chart.getFont();
                    data.datasets.forEach(function (ds, i) {
                        ds.data.forEach(function (item) {
                            if (config.showLabels && ds.data.length > 1) {
                                if (data.datasets.length > 1) {
                                    item.tileLabel = ds.label + ': ' + item.label + '\n' + item.value.toString();
                                }
                                else {
                                    item.tileLabel = item.label + '\n' + item.value.toString();
                                }
                            }
                            else {
                                item.tileLabel = item.value.toString();
                            }

                            item.tileLabel.split('\n').forEach(function (lbl) {
                                var w = ctx.measureText(lbl).width + 20;
                                chart.minTileSize = Math.max(chart.minTileSize, w);
                            });

                            chart.maxValue = Math.max(item.value, chart.maxValue);
                        });
                    });

                    // Maximize the text size
                    var aspect = (ctx.canvas.width / chart.tilesPerRow) / chart.minTileSize;
                    var fontSize = Math.min(config.scaleFontSize * aspect, 36);
                    if (config.showLabels) {
                        fontSize = Math.min((ctx.canvas.height / chart.tilesPerCol - 10) / 2, fontSize);
                    }
                    else {
                        fontSize = Math.min(ctx.canvas.height / chart.tilesPerCol - 10, fontSize);
                    }
                    chart.minTileSize *= fontSize / config.scaleFontSize;
                    config.scaleFontSize = fontSize;

                    // Calculate the number of tiles per row
                    chart.tilesPerRow = Math.min(
                        Math.floor(ctx.canvas.width / chart.minTileSize),
                        Math.ceil(Math.sqrt(chart.numPoints))
                        );

                    var tilesPerCol = Math.ceil(chart.numPoints / chart.tilesPerRow);
                    ctx.canvas.height = Math.max((this.config.scaleFontSize + 5) * tilesPerCol, ctx.canvas.height);
                },

                initSegments: function () {
                    var chart = this;
                    var ctx = this.context;

                    chart.segments = [];

                    // Generate the tile map
                    var offset = 0;
                    chart.tileMap = [];
                    data.datasets.forEach(function (ds, i) {
                        ds.data.forEach(function (item) {
                            var rowIdx = Math.floor(offset / chart.tilesPerRow);
                            var colIdx = offset % chart.tilesPerRow;

                            chart.tileMap[rowIdx] = chart.tileMap[rowIdx] || [];
                            chart.tileMap[rowIdx][colIdx] = item;
                            item.dataset = ds;

                            offset++;
                        });
                    });

                    // Generate the segments
                    var rowSize = ctx.canvas.height / Math.ceil(chart.numPoints / chart.tilesPerRow);
                    if (!config.showLabels) {
                        rowSize = Math.min(rowSize, config.scaleFontSize + 10);
                        ctx.canvas.height = rowSize * chart.tilesPerCol;
                    }
                    else {
                        rowSize = Math.min(rowSize, (config.scaleFontSize + 10) * 2);
                        ctx.canvas.height = rowSize * chart.tilesPerCol;
                    }

                    var yPos = ctx.canvas.height - rowSize;
                    chart.tileMap.forEach(function (row, ds) {
                        var valueTotal = 0;
                        var minValue = Math.ceil(chart.maxValue * (chart.minTileSize / ctx.canvas.width));
                        row.forEach(function (item) {
                            valueTotal += Math.max(minValue, Math.abs(item.value));
                        });

                        var xPos = 0;
                        row.forEach(function (item, c) {
                            var width = Math.ceil(ctx.canvas.width * (Math.max(minValue, Math.abs(item.value)) / valueTotal));

                            var segment = new ChartSegment(ctx, item.fillColor, 'white', 1).Button(
                                xPos, yPos, width, rowSize, chart.getFont(), item.tileLabel
                            );

                            segment.dataset = item.dataset;
                            segment.data = item;

                            chart.segments.push(segment);

                            xPos += width;
                        });
                        yPos -= rowSize;
                    });
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width', 'height']);
                    });
                }
            });

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },

        STSpeedometer: function (config) {
            this.STSpeedometer.defaults = {
                innerRadius: config.innerRadius || 85,
                inGraphDataShow: false,
                inGraphDataPaddingRadius: 5,
                inGraphDataPaddingAngle: 0,
                inGraphDataTmpl: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                inGraphDataAlign: "off-center", // "right", "center", "left", "off-center" or "to-center"
                inGraphDataVAlign: "off-center", // "bottom", "center", "top", "off-center" or "to-center"
                inGraphDataRotate: 0, // rotateAngle value (0->360) , "inRadiusAxis" or "inRadiusAxisRotateLabels"
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataRadiusPosition: 3,
                inGraphDataAnglePosition: 2,
                segmentShowStroke: true,
                segmentStrokeColor: "#fff",
                segmentStrokeWidth: 2,
                animation: true,
                animationSteps: 32,
                animationEasing: "easeOutBounce",
                animateRotate: true,
                animateScale: false,
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == ''? '' : v1+':')+ v2 + ' (' + v6 + ' %)'%>",
                radiusScale: 1,
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",
                title: '',
                startAngle: 180,
                stopAngle: 0,
                startValue: 0,
                stopValue: 100,
                value: ''
            };

            // merge annotate defaults
            this.STSpeedometer.defaults = mergeChartConfig(this.defaults.commonOptions, this.STSpeedometer.defaults);
            this.STSpeedometer.defaults = mergeChartConfig(this.STSpeedometer.defaults, charJSPersonalDefaultOptions);
            this.STSpeedometer.defaults = mergeChartConfig(this.STSpeedometer.defaults, charJSPersonalDefaultOptionsPie);
            config = this.config = (config) ? mergeChartConfig(this.STSpeedometer.defaults, config) : this.STSpeedometer.defaults;

            var chart = this;

            var valueSegment;
            var valueText;
            var scaleSegments = [];
            var res = $.extend({
            }, this, {
                initConstraints: function () {
                    this.chartMin = {
                        y: 5, x: 10
                    };
                    this.chartMax = {
                        y: this.context.canvas.height, x: this.context.canvas.width - 10
                    };

                    if (this.config.title) {
                        this.chartMin.y += this.config.scaleFontSize + 5;
                    }

                    if (this.config.range && this.config.range.length == 2) {
                        this.showLabels = true;
                        this.chartMax.y -= this.config.scaleFontSize + 5;
                    }

                    this.chartRadius = Math.min(
                        (this.chartMax.x - this.chartMin.x) * 0.5,
                        this.chartMax.y - this.chartMin.y
                        );
                    this.chartRadius = Math.max(0, this.chartRadius);
                    this.innerRadius = this.chartRadius * (config.innerRadius / 100);
                },

                initSegments: function () {
                    var chart = this;
                    var ctx = this.context;
                    var textHeight = this.config.scaleFontSize;
                    var xMid = this.chartMin.x + (this.chartMax.x - this.chartMin.x) * 0.5;

                    // title text
                    if (this.config.title) {
                        scaleSegments.push(new ChartSegment(ctx, '#ffffff', '#888888', 0)
                            .TextSegment(
                                this.config.title,
                                xMid,
                                this.chartMax.y - 5,
                                this.getFont('', 'bold'),
                                0,
                                2,
                                {
                                    fillStyle: '#888888',
                                    textAlign: 'center',
                                    textBaseline: 'top'
                                }
                            ));
                    }

                    if (this.showLabels) {
                        // draw the start label
                        var hThickness = (this.chartRadius - this.innerRadius) * 0.5;
                        scaleSegments.push(new ChartSegment(ctx, '#ffffff', '#888888', 0)
                            .TextSegment(
                                this.config.range[0].toString(),
                                this.chartMin.x + hThickness,
                                0,
                                this.getFont(),
                                0,
                                2,
                                {
                                    fillStyle: '#888888',
                                    textAlign: 'center',
                                    textBaseline: 'bottom'
                                }
                            ));

                        // draw the stop label
                        scaleSegments.push(new ChartSegment(ctx, '#ffffff', '#888888', 0)
                            .TextSegment(
                                this.config.range[1].toString(),
                                this.chartMax.x - hThickness,
                                0,
                                this.getFont(),
                                0,
                                2,
                                {
                                    fillStyle: '#888888',
                                    textAlign: 'center',
                                    textBaseline: 'bottom'
                                }
                            ));

                    }

                    // draw the arc background
                    scaleSegments.push(new ChartSegment(chart.context, '#dddddd', '#888888', 2)
                        .ArcSegment(xMid, this.chartMax.y, this.innerRadius - 1, this.chartRadius + 1, Math.PI, Math.PI * 2));

                    // create the segment for the value arc
                    var startAngle = Math.PI;
                    var pct = this.config.value / this.config.range[1];
                    var stopAngle = startAngle + (Math.PI * pct);

                    var xMid = this.chartMin.x + (this.chartMax.x - this.chartMin.x) * 0.5;
                    valueSegment = new ChartSegment(chart.context, this.config.color, '#888888', 0)
                        .ArcSegment(xMid, this.chartMax.y, this.innerRadius, this.chartRadius, startAngle, stopAngle, true);

                    // create the segment for the value text
                    valueText = new ChartSegment(ctx, '#ffffff', '#888888', 0)
                        .TextSegment(
                            this.config.value.toString(),
                            xMid,
                            textHeight,
                            this.getFont(this.innerRadius * 0.8),
                            0,
                            2,
                            {
                                fillStyle: '#888888',
                                textAlign: 'center',
                                textBaseline: 'bottom'
                            }
                            );
                },

                drawScale: function (animPc) {
                    scaleSegments.forEach(function (segment) {
                        segment.draw();
                    });
                },

                drawSegments: function (animPc) {
                    valueSegment.draw(animPc, ['angleDelta']);
                    valueText.draw();
                }
            });

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },

        STWhisker: function (data, options) {
            var config = $.extend({
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",

                scaleMinValue: 0,
                scaleMaxValue: 100,
                scaleLabelAlign: 'justified',
                scaleOptions: mergeObjectsRecursive({}, scaleDefaultOptions, options.scaleOptions || {}),

                yAxisRange: [0, 100]
            }, this.defaults.commonOptions, this.StackedBar.defaults, options);
            var ctx = this.context;

            data.labels = [];
            data.datasets.forEach(function (ds) {
                data.labels.push(ds.label);
            });

            var xAxisStart, xAxisEnd, yAxisBottom, yAxisTop, yAxisLabelWidth, yAxisLabelHeight, yAxisMaxLabelAspect, yScaleBase, maxLabelWidth;
            var xAxisStep;
            var yAxisPadding = 2;
            var xAxisPadding = 2;

            var res = $.extend({
            }, this, {
                config: config,
                initConstraints: function () {
                    var rect = this.config.scaleOptions.rect;
                    if (rect) {
                        xAxisStart = rect.x;
                        xAxisEnd = rect.x + rect.w;
                        yAxisTop = rect.y = this.scaleOptions.topPadding;
                        yAxisBottom = rect.y + rect.h;
                    }
                    else {
                        xAxisStart = 20;
                        xAxisEnd = this.context.canvas.width - 10;
                        yAxisBottom = this.context.canvas.height - this.getMaxLabelHeight() - 5;
                        yAxisTop = this.config.scaleOptions.topPadding;
                    }

                    maxLabelWidth = this.getMaxLabelWidth();

                    xAxisEnd = this.context.canvas.width - 10;
                    xAxisStep = maxLabelWidth + xAxisPadding;
                    if (config.scaleLabelAlign == 'justified') {
                        xAxisStep = Math.max(
                            (xAxisEnd - xAxisStart) / data.labels.length,
                            maxLabelWidth + xAxisPadding
                        );
                    }

                    var range = config.yAxisRange[1] - config.yAxisRange[0];
                    var units = (yAxisBottom - yAxisTop) / range;
                    var yAxisLabels = [];
                    var yStep = Math.ceil((range / 5) / 10) * 10;
                    for (var y = config.yAxisRange[0]; y <= config.yAxisRange[1]; y += yStep) {
                        yAxisLabels.push(y);
                    }

                    mergeObjectsRecursive(this.config.scaleOptions, {
                        rect: {
                            x: xAxisStart,
                            y: yAxisTop,
                            w: xAxisEnd - xAxisStart,
                            h: yAxisBottom - yAxisTop
                        },

                        bgColor: 'rgba(196,196,196,0.2)',

                        xAxis: {
                            labels: data.labels,
                            step: xAxisStep,
                            strokeWidth: 0,
                            textAlignment: 'center'
                        },

                        yAxis: {
                            labels: yAxisLabels,
                            step: units * yStep,
                            strokeWidth: 1
                        }
                    });

                },

                getMaxLabelWidth: function () {
                    var maxLabelWidth = 0;
                    var originalFont = ctx.font;

                    ctx.font = this.getFont();
                    data.labels.forEach(function (lbl) {
                        var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, lbl, config.fmtXLabel), config.scaleFontSize);
                        maxLabelWidth = Math.max(maxLabelWidth, textMsr.textWidth);
                    });
                    ctx.font = originalFont;

                    return maxLabelWidth;
                },

                getMaxLabelHeight: function () {
                    var maxLabelHeight = 0;
                    var originalFont = ctx.font;

                    ctx.font = this.getFont();
                    data.labels.forEach(function (lbl) {
                        var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, lbl, config.fmtXLabel), config.scaleFontSize);
                        maxLabelHeight = Math.max(maxLabelHeight, textMsr.textHeight);
                    });
                    ctx.font = originalFont;

                    return maxLabelHeight;
                },

                initSegments: function () {
                    var chart = this;
                    var so = this.config.scaleOptions;

                    yAxisBottom = so.rect.y + so.rect.h;
                    xAxisStart = so.rect.x;
                    xAxisStep = so.xAxis.step;

                    var x = xAxisStart + xAxisStep / 2;
                    var y = this.context.canvas.height - yAxisBottom;
                    var yMinValue = config.yAxisRange[0];
                    var yMaxValue = config.yAxisRange[1];
                    var units = (so.rect.h) / (config.yAxisRange[1] - config.yAxisRange[0]);
                    data.datasets.forEach(function (ds) {
                        var floorCeiling = [];
                        for (var i = 0, len = ds.values.length; i < len; i++) {
                            if (ds.values[i] > yMaxValue) {
                                floorCeiling.push(yMaxValue);
                            } else if (ds.values[i] < yMinValue) {
                                floorCeiling.push(yMinValue);
                            } else {
                                floorCeiling.push(ds.values[i]);
                            }
                        }

                        var lineSegment = new ChartSegment(ctx, '#888', '#888', 2).LineSegment(
                            x, y + (floorCeiling[0] * units),
                            x, y + (floorCeiling[2] * units)
                        );
                        chart.segments.push(lineSegment);

                        function addCircle(val, tooltipVal, label, color, radius) {
                            var circleSegment = new ChartSegment(ctx, color, '#000000', 1).CircleSegment(
                                x, y + (val * units),
                                radius, 5
                            );
                            chart.segments.push(circleSegment);

                            circleSegment.dataset = ds;
                            circleSegment.data = {
                                label: label,
                                value: tooltipVal
                            };
                        }

                        addCircle(floorCeiling[0], ds.values[0], 'Lowest Score', '#000000', 2);
                        addCircle(floorCeiling[2], ds.values[2], 'Highest Score', '#000000', 2);
                        addCircle(floorCeiling[1], ds.values[1], 'Student\'s Score', '#FFFFFF', 5);

                        x += xAxisStep;
                    });
                },

                drawScale: function () {
                    this.config.scaleOptions = drawScale(ctx, this.config.scaleOptions, this.config.legendOptions);
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width']);
                    });
                }
            });

            res.initialize();
            res.animate();

            res.context.canvas.chart = res;
            return res;
        },

        STHorizontalLayeredBar: function (data, options) {
            var config = mergeObjectsRecursive({
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",

                scaleMinValue: 0,
                scaleMaxValue: 100,
                scaleOptions: mergeObjectsRecursive({
                }, scaleDefaultOptions, {
                    xAxis: {
                        strokeWidth: 1,
                        textAlignment: 'center'
                    },

                    yAxis: {
                        padding: 10,
                        strokeWidth: 0
                    }
                }, options.scaleOptions || {})
            }, this.defaults.commonOptions, this.StackedBar.defaults, options);
            var ctx = this.context;

            var xAxisStart, xAxisEnd, yAxisBottom, yAxisTop, yAxisLabelWidth, yAxisLabelHeight, yAxisMaxLabelAspect, yScaleBase;
            var yAxisPadding = 2;
            var xAxisPadding = 5;

            var res = $.extend({}, this, {
                config: config,
                initConstraints: function () {
                    var rect = this.config.scaleOptions.rect;
                    if (rect) {
                        xAxisStart = rect.x;
                        xAxisEnd = rect.x + rect.w;
                        yAxisTop = rect.y = 0;
                        yAxisBottom = rect.y + rect.h;
                    }
                    else {
                        xAxisStart = 0;
                        xAxisEnd = this.context.canvas.width - 10;

                        yAxisBottom = this.context.canvas.height;
                        yAxisTop = 0;

                        yAxisLabelWidth = this.getMaxLabelWidth();
                        yAxisLabelHeight = this.getYAxisLabelHeight()

                        xAxisStart += yAxisLabelWidth;
                    }

                    var xAxisLabels = [];
                    var scaleSize = this.config.scaleMaxValue - this.config.scaleMinValue;
                    var units = (rect ? rect.w : xAxisEnd - xAxisStart) / scaleSize;
                    for (var x = this.config.scaleMinValue; x <= this.config.scaleMaxValue; x += parseInt(scaleSize / 5)) {
                        xAxisLabels.push(x);
                    }

                    mergeObjectsRecursive(this.config.scaleOptions, {
                        xAxis: {
                            labels: xAxisLabels,
                            step: units * 20,
                        },

                        yAxis: {
                            labels: data.labels,
                        }
                    });
                },

                getMaxLabelWidth: function () {
                    yAxisLabelWidth = 0;
                    var originalFont = ctx.font;
                    var so = this.config.scaleOptions;

                    var labelHeight = so.yAxis.font.size;
                    ctx.font = so.yAxis.font.toString();
                    data.labels
                        .forEach(function (lbl) {
                            var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, lbl, config.fmtXLabel), labelHeight);
                            yAxisLabelWidth = Math.max(yAxisLabelWidth, textMsr.textWidth);
                        });
                    ctx.font = originalFont;

                    yAxisMaxLabelAspect = yAxisLabelWidth / labelHeight;
                    yAxisLabelWidth = Math.min(yAxisLabelWidth, this.context.canvas.width / 2);

                    return yAxisLabelWidth;
                },

                getYAxisLabelHeight: function () {
                    return yAxisLabelWidth / yAxisMaxLabelAspect;
                },

                getSortedDataPoints: function (idx) {
                    var dataPoints = [];
                    data.datasets.forEach(function (ds) {
                        dataPoints.push({
                            value: ds.data[idx],
                            dataset: ds
                        });
                    });

                    // Sort ascending by value to render lowest to highest
                    return dataPoints.sort(function (a, b) {
                        if (a.value < b.value) return -1;
                        if (b.value < a.value) return 1;
                        return 0;
                    });
                },

                initSegments: function () {
                    var chart = this;
                    var so = this.config.scaleOptions;
                    var rect = so.rect;

                    // Initialize the segments
                    var labelCount = so.xAxis.labels.length + 1;
                    var units = (so.rect.w - so.xAxis.step / labelCount) / (chart.config.scaleMaxValue - chart.config.scaleMinValue);

                    var yPos = chart.context.canvas.height - (so.rect.y + so.yAxis.step / 2 + so.yAxis.padding / 2);
                    for (var i = 0; i < data.labels.length; i++) {
                        // Initialize the segments for this datapoint
                        var xPos = so.rect.x;
                        var labelCount = so.yAxis.labels.count + 1;
                        var offset = 0;
                        var prevSegment = null;
                        chart.getSortedDataPoints(i).forEach(function (d) {
                            var segment = new ChartSegment(ctx, d.dataset.fillColor, d.dataset.strokeColor, d.dataset.strokeWidth)
                                .RectSegment(
                                    xPos + offset, yPos,
                                    d.value * units - offset,
                                    yAxisLabelHeight
                                );

                            segment.dataset = d.dataset;
                            segment.data = {
                                idx: i,
                                value: d.value,
                                label: d.dataset.label
                            };

                            // If the segments are equal, split the bar
                            if (prevSegment && prevSegment.data.value == d.value) {
                                prevSegment.height *= 0.5;

                                segment.height = prevSegment.height;
                                segment.x -= offset;
                                segment.width += offset;
                                segment.y += segment.height;
                            }

                            offset = d.value * units;
                            chart.segments.push(segment);

                            prevSegment = segment;
                        });

                        yPos -= so.yAxis.step + 2;
                    }
                },

                drawScale: function () {
                    this.config.scaleOptions = drawScale(this.context, this.config.scaleOptions, this.config.legendOptions);
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width']);
                    });
                }
            });

            res.initialize();
            res.animate();

            res.context.canvas.chart = res;
            return res;
        },

        STHorizontalStackedBar: function (data, options) {
            var config = mergeObjectsRecursive({
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",

                scaleMinValue: 0,
                scaleMaxValue: 100,
                scaleOptions: mergeObjectsRecursive({
                }, scaleDefaultOptions, {
                    xAxis: {
                        strokeWidth: 1,
                        textAlignment: 'center',
                        font: {
                            family: "'Verdana'",
                            size: 14
                        },
                        title: {
                            font: {
                                family: "'Verdana'",
                                size: 16
                            }
                        },
                        padding: 20
                    },

                    yAxis: {
                        padding: 10,
                        strokeWidth: 0,
                        font: {
                            family: "'Verdana'",
                            size: 14
                        }
                    }
                }, options.scaleOptions || {}),

                legendOptions: mergeObjectsRecursive({}, legendDefaultOptions, {
                    vAlign: 'top',
                    border: 1,
                    font: {
                        family: "'Verdana'"
                    }    
                }, options.legendOptions || {})
            }, this.defaults.commonOptions, this.StackedBar.defaults, options);
            var ctx = this.context;

            var xAxisStart, xAxisEnd, yAxisBottom, yAxisTop, yAxisLabelWidth, yAxisLabelHeight, yAxisMaxLabelAspect, yScaleBase;
            var yAxisPadding = 2;
            var xAxisPadding = 5;

            var res = $.extend({
            }, this, {
                config: config,
                initConstraints: function () {
                    this.config.scaleOptions.rect = null;
                    var rect = this.config.scaleOptions.rect;
                    if (rect) {
                        xAxisStart = rect.x;
                        xAxisEnd = rect.x + rect.w;
                        yAxisTop = rect.y = 0;
                        yAxisBottom = rect.y + rect.h;
                    }
                    else {
                        xAxisStart = 0;
                        xAxisEnd = this.context.canvas.width - 10;

                        yAxisBottom = this.context.canvas.height;
                        yAxisTop = 0;

                        yAxisLabelWidth = this.getMaxLabelWidth();
                        yAxisLabelHeight = this.getYAxisLabelHeight()

                        xAxisStart += yAxisLabelWidth;
                    }

                    var xAxisLabels = [];
                    var scaleSize = this.config.scaleMaxValue - this.config.scaleMinValue;
                    var units = (rect ? rect.w : xAxisEnd - xAxisStart) / scaleSize;
                    for (var x = this.config.scaleMinValue; x <= this.config.scaleMaxValue; x += parseInt(scaleSize / 10)) {
                        xAxisLabels.push(x);
                    }

                    mergeObjectsRecursive(this.config.scaleOptions, {
                        xAxis: {
                            labels: xAxisLabels,
                            title: {
                                label: data.xAxisTitle
                            }
                        },

                        yAxis: {
                            labels: data.labels,
                        }
                    });

                    var legendLabels = [];
                    var legendColors = [];

                    for (var i = 0; i < data.datasets.length; i++) {
                        legendLabels.push(data.datasets[i].label);
                        legendColors.push(data.datasets[i].color);
                    }

                    mergeObjectsRecursive(this.config.legendOptions, {
                        labels: legendLabels,
                        colors: legendColors
                    });

                    this.drawScale();

                    this.config.scaleOptions.rect.y = 0;
                },

                getMaxLabelWidth: function () {
                    yAxisLabelWidth = 0;
                    var originalFont = ctx.font;
                    var so = this.config.scaleOptions;

                    var labelHeight = so.yAxis.font.size;
                    ctx.font = so.yAxis.font.toString();
                    data.labels
                        .forEach(function (lbl) {
                            var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, lbl, config.fmtXLabel), labelHeight);
                            yAxisLabelWidth = Math.max(yAxisLabelWidth, textMsr.textWidth);
                        });
                    ctx.font = originalFont;

                    yAxisMaxLabelAspect = yAxisLabelWidth / labelHeight;
                    yAxisLabelWidth = Math.min(yAxisLabelWidth, this.context.canvas.width / 2);

                    return yAxisLabelWidth;
                },

                getYAxisLabelHeight: function () {
                    return this.config.scaleOptions.yAxis.font.size;
                },

                getSortedDataPoints: function (idx) {
                    var dataPoints = [];
                    data.datasets.forEach(function (ds) {
                        dataPoints.push({
                            value: ds.data[idx].value,
                            label: ds.data[idx].label,
                            dataset: ds,
                            fillColor: ds.data[idx].fillColor
                        });
                    });


                    return dataPoints;
                },

                initSegments: function () {
                    var chart = this;
                    var so = this.config.scaleOptions;
                    var rect = so.rect;

                    // Initialize the segments
                    var units = (so.rect.w - so.xAxis.step) / (chart.config.scaleMaxValue - chart.config.scaleMinValue);
                    var yHalf = so.yAxis.padding / 2;

                    var yPos = chart.context.canvas.height - (so.rect.y + so.yAxis.step / 2 + so.yAxis.padding);

                    var barSizeMultipler = data.labels.length <= 10 ? 1.5 : 1.25;

                    for (var i = 0; i < data.labels.length; i++) {
                        // Initialize the segments for this datapoint
                        var xPos = so.rect.x;
                        var offset = 0;
                        var prevSegment = null;

                        chart.getSortedDataPoints(i).forEach(function (d) {
                            var segment = new ChartSegment(ctx, d.fillColor || d.dataset.fillColor, d.dataset.strokeColor, d.dataset.strokeWidth)
                                .RectSegment(
                                    xPos + offset, yPos,
                                    d.value * units,
                                    yAxisLabelHeight * barSizeMultipler
                                );

                            segment.dataset = d.dataset;
                            segment.data = {
                                idx: i,
                                value: d.value,
                                label: d.label
                            };


                            offset += d.value * units;
                            chart.segments.push(segment);

                            prevSegment = segment;
                        });

                        yPos -= so.yAxis.step;
                    }
                },

                drawScale: function () {
                    this.config.scaleOptions = drawScale(this.context, this.config.scaleOptions, this.config.legendOptions);
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width']);
                    });
                }
            });

            res.initialize();
            res.animate();

            res.context.canvas.chart = res;
            return res;
        },

        STStackedBar: function (data, options) {
            var config = mergeObjectsRecursive({
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",

                scaleOptions: mergeObjectsRecursive({}, scaleDefaultOptions, {
                    xAxis: {
                        strokeWidth: 0,
                        textAlignment: 'center',
                        font: {
                            family: "'Verdana'",
                            size: 14
                        },
                        title: {
                            font: {
                                family: "'Verdana'",
                                size: 16
                            }
                        },
                        padding: 20
                    },

                    yAxis: {
                        strokeWidth: 1,
                        padding: 10,
                        font: {
                            family: "'Verdana'",
                            size: 14
                        }
                    }
                }, options.scaleOptions || {}),

                legendOptions: mergeObjectsRecursive({}, legendDefaultOptions, {
                    vAlign: 'top',
                    border: 1,
                    font: {
                        family: "'Verdana'"
                    }
                }, options.legendOptions || {})
            }, this.defaults.commonOptions, this.StackedBar.defaults, options);
            var ctx = this.context;

            var xAxisStart, xAxisEnd, yAxisBottom, yAxisTop, yAxisLabelWidth, yAxisLabelHeight, yAxisMaxLabelAspect, yScaleBase;
            var yAxisPadding = 2;
            var xAxisPadding = 5;

            var res = $.extend({}, this, {
                config: config,
                initConstraints: function () {
                    this.config.scaleOptions.rect = null;
                    var rect = this.config.scaleOptions.rect;
                    if (rect) {
                        xAxisStart = rect.x;
                        xAxisEnd = rect.x + rect.w;
                        yAxisTop = rect.y = 0;
                        yAxisBottom = rect.y + rect.h;
                    }
                    else {
                        xAxisStart = 0;
                        xAxisEnd = this.context.canvas.width - 10;

                        yAxisBottom = this.context.canvas.height;
                        yAxisTop = 0;

                        yAxisLabelWidth = this.getMaxLabelWidth();
                        yAxisLabelHeight = this.getYAxisLabelHeight()

                        xAxisStart += yAxisLabelWidth;
                    }

                    var yAxisLabels = [];

                    this.yAxisStepValue = 5;
                    var maxValueY = this.getMaxValueY();

                    var minValueY = 0;

                    var scaleSize = maxValueY - minValueY;

                    for (var y = minValueY; y <= Math.max(maxValueY, this.yAxisStepValue); y += this.yAxisStepValue) {
                        yAxisLabels.push(y);
                    }
                
                    mergeObjectsRecursive(this.config.scaleOptions, {
                        xAxis: {
                            labels: data.labels,
                            title: {
                                label: data.xAxisTitle
                            }
                        },

                        yAxis: {
                            labels: yAxisLabels,
                        }
                    });

                    var legendLabels = [];
                    var legendColors = [];

                    for (var i = 0; i < data.datasets.length; i++) {
                        legendLabels.push(data.datasets[i].label);
                        legendColors.push(data.datasets[i].color);
                    }

                    mergeObjectsRecursive(this.config.legendOptions, {
                        labels: legendLabels,
                        colors: legendColors
                    });

                    this.drawScale();

                    this.config.scaleOptions.rect.y = 0;
                },

                getMaxValueY: function () {
                    var maxValueY = 0;

                    if (data && data.datasets && data.datasets.length > 0 && data.datasets[0].data.length > 0) {
                        for (var x = 0; x < data.datasets[0].data.length; x++) {
                            var yTotalForThisX = 0;
                            for (var y = 0; y < data.datasets.length; y++) {
                                yTotalForThisX += data.datasets[y].data[x].value;
                            }
                            if (yTotalForThisX > maxValueY) {
                                maxValueY = yTotalForThisX;
                            }
                        }
                    }

                    return maxValueY;
                },

                getMaxLabelWidth: function () {
                    yAxisLabelWidth = 0;
                    var originalFont = ctx.font;
                    var so = this.config.scaleOptions;

                    var labelHeight = so.yAxis.font.size;
                    ctx.font = so.yAxis.font.toString();
                    data.labels
                        .forEach(function (lbl) {
                            var textMsr = ctx.measureTextMultiLine(fmtChartJS(config, lbl, config.fmtXLabel), labelHeight);
                            yAxisLabelWidth = Math.max(yAxisLabelWidth, textMsr.textWidth);
                        });
                    ctx.font = originalFont;

                    yAxisMaxLabelAspect = yAxisLabelWidth / labelHeight;
                    yAxisLabelWidth = Math.min(yAxisLabelWidth, this.context.canvas.width / 2);

                    return yAxisLabelWidth;
                },

                getYAxisLabelHeight: function () {
                    return this.config.scaleOptions.yAxis.font.size;
                },

                getSortedDataPoints: function (idx) {
                    var dataPoints = [];
                    data.datasets.forEach(function (ds) {
                        dataPoints.push({
                            value: ds.data[idx].value,
                            label: ds.data[idx].label,
                            dataset: ds,
                            fillColor: ds.data[idx].fillColor
                        });
                    });


                    return dataPoints;
                },

                initSegments: function () {
                    var chart = this;
                    var so = this.config.scaleOptions;
                    var rect = so.rect;

                    var barWidth = so.xAxis.step / 2;
                    var xPos = rect.x + (so.xAxis.step - barWidth) / 2;
                    var maxYValue = this.getMaxValueY();
                    var units = so.yAxis.step / this.yAxisStepValue;
                    var yPosStart = this.context.canvas.height - (rect.y + rect.h);

                    for (var i = 0; i < data.labels.length; i++) {
                        var yPos = yPosStart;
                        chart.getSortedDataPoints(i).reverse().forEach(function (d) {
                            var barHeight = d.value * units;

                            var segment = new ChartSegment(ctx, d.fillColor || d.dataset.fillColor, d.dataset.strokeColor, d.dataset.strokeWidth)

                            .RectSegment( //(x, y, w, h)
                                    xPos,
                                    yPos,
                                    barWidth,
                                    barHeight
                                );

                            segment.dataset = d.dataset;
                            segment.data = {
                                idx: i,
                                value: d.value,
                                label: d.label
                            };

                            yPos += barHeight;

                            chart.segments.push(segment);
                        });

                        xPos += so.xAxis.step;
                    }
                },

                drawScale: function () {
                    this.config.scaleOptions = drawScale(this.context, this.config.scaleOptions, this.config.legendOptions);
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['height']);
                    });
                }
            });

            res.initialize();
            res.animate();

            res.context.canvas.chart = res;
            return res;
        },

        // old stacked bar
        STStackedBarOld: function (data, options) {
            var chart = $.extend({}, this);
            var ctx = chart.context;

            chart.StackedBar.defaults = {
                inGraphDataShow: false,
                inGraphDataPaddingX: 0,
                inGraphDataPaddingY: -3,
                inGraphDataTmpl: "<%=v3%>",
                inGraphDataAlign: "center",
                inGraphDataVAlign: "top",
                inGraphDataRotate: 0,
                inGraphDataFontFamily: "'Arial'",
                inGraphDataFontSize: 12,
                inGraphDataFontStyle: "normal",
                inGraphDataFontColor: "#666",
                inGraphDataXPosition: 2,
                inGraphDataYPosition: 3,
                scaleOverlay: false,
                scaleOverride: false,
                scaleOverride2: false,
                scaleSteps: null,
                scaleStepWidth: null,
                scaleStartValue: null,
                scaleSteps2: null,
                scaleStepWidth2: null,
                scaleStartValue2: null,
                scaleLineColor: "rgba(0,0,0,.1)",
                scaleLineWidth: 1,
                scaleShowLabels: true,
                scaleShowLabels2: true,
                scaleLabel: "<%=value%>",
                scaleFontFamily: "'Arial'",
                scaleFontSize: 12,
                scaleFontStyle: "normal",
                scaleFontColor: "#666",
                scaleShowGridLines: true,
                scaleXGridLinesStep: 1,
                scaleYGridLinesStep: 1,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                showYAxisMin: true, // Show the minimum value on Y axis (in original version, this minimum is not displayed - it can overlap the X labels)
                rotateLabels: "smart", // smart <=> 0 degre if space enough; otherwise 45 degres if space enough otherwise90 degre; 
                // you can force an integer value between 0 and 180 degres
                scaleTickSizeLeft: 5,
                scaleTickSizeRight: 5,
                scaleTickSizeBottom: 5,
                scaleTickSizeTop: 5,
                barShowStroke: true,
                barStrokeWidth: 2,
                barValueSpacing: 5,
                barDatasetSpacing: 1,
                animation: true,
                animationSteps: 60,
                animationEasing: "easeOutQuart",
                onAnimationComplete: null,
                annotateLabel: "<%=(v1 == '' ? '' : v1) + (v1!='' && v2 !='' ? ' - ' : '')+(v2 == '' ? '' : v2)+(v1!='' || v2 !='' ? ':' : '') + v3 + ' (' + v6 + ' %)'%>"
            };
            // merge annotate defaults
            chart.StackedBar.defaults = mergeChartConfig(chart.defaults.commonOptions, chart.StackedBar.defaults);
            chart.StackedBar.defaults = mergeChartConfig(chart.defaults.xyAxisCommonOptions, chart.StackedBar.defaults);
            chart.StackedBar.defaults = mergeChartConfig(chart.StackedBar.defaults, charJSPersonalDefaultOptions);
            chart.StackedBar.defaults = mergeChartConfig(chart.StackedBar.defaults, charJSPersonalDefaultOptionsStackedBar);
            var config = (options) ? mergeChartConfig(chart.StackedBar.defaults, options) : chart.StackedBar.defaults;

            var maxSize, scaleHop, calculatedScale, labelHeight, scaleHeight, valueBounds,
                labelTemplateString, valueHop, widestXLabel, xAxisLength, yAxisPosX, xAxisPosY, barWidth, rotateLabels = 0,
                    msr;

            var chart = this;
            chart.config = config;

            var valueSegment;
            var valueText;
            var scaleSegments = [];
            var res = $.extend({}, this, {
                initConstraints: function () {
                    this.chartMin = {
                        y: 5, x: 10
                    };
                    this.chartMax = {
                        y: this.context.canvas.height, x: this.context.canvas.width - 10
                    };

                    if (typeof ctx.ChartNewId == "undefined") {
                        var cvdate = new Date();
                        var cvmillsec = cvdate.getTime();
                        ctx.ChartNewId = "StackedBar_" + cvmillsec;
                    }
                    if (!dynamicFunction(data, config, ctx, "StackedBar")) return;
                    config.logarithmic = false;
                    if (typeof jsGraphAnnotate[ctx.ChartNewId] == "undefined") jsGraphAnnotate[ctx.ChartNewId] = new Array();
                    else if (!config.multiGraph) clearAnnotate(ctx.ChartNewId);
                    defMouse(ctx, data, config, "StackedBar");
                    setRect(ctx, config);
                    msr = this.msr = setMeasures(data, config, ctx, [""], [""], true, false, true, true, true, "StackedBar");
                    valueBounds = getValueBounds();
                    //Check and set the scale
                    labelTemplateString = (config.scaleShowLabels) ? config.scaleLabel : "";
                    if (!config.scaleOverride) {
                        calculatedScale = calculateScale(1, config, valueBounds.maxSteps, valueBounds.minSteps, valueBounds.maxValue, valueBounds.minValue, labelTemplateString);
                        msr = this.msr = setMeasures(data, config, ctx, calculatedScale.labels, null, true, false, true, true, true, "StackedBar");
                    } else {
                        calculatedScale = {
                            steps: config.scaleSteps,
                            stepValue: config.scaleStepWidth,
                            graphMin: config.scaleStartValue,
                            labels: []
                        }
                        for (var i = 0; i <= calculatedScale.steps; i++) {
                            if (labelTemplateString) {
                                calculatedScale.labels.push(tmpl(labelTemplateString, {
                                    value: fmtChartJS(config, 1 * ((config.scaleStartValue + (config.scaleStepWidth * i)).toFixed(getDecimalPlaces(config.scaleStepWidth))), config.fmtYLabel)
                                }));
                            }
                        }
                        msr = this.msr = setMeasures(data, config, ctx, calculatedScale.labels, null, true, false, true, true, true, "StackedBar");
                    }
                    msr.availableHeight = msr.availableHeight - config.scaleTickSizeBottom - config.scaleTickSizeTop;
                    msr.availableWidth = msr.availableWidth - config.scaleTickSizeLeft - config.scaleTickSizeRight;
                    scaleHop = Math.floor(msr.availableHeight / calculatedScale.steps);
                    valueHop = Math.floor(msr.availableWidth / (data.labels.length));
                    if (valueHop == 0 || config.fullWidthGraph) valueHop = (msr.availableWidth / data.labels.length);
                    msr.clrwidth = msr.clrwidth - (msr.availableWidth - ((data.labels.length) * valueHop));
                    msr.availableWidth = (data.labels.length) * valueHop;
                    msr.availableHeight = (calculatedScale.steps) * scaleHop;
                    yAxisPosX = msr.leftNotUsableSize + config.scaleTickSizeLeft;
                    xAxisPosY = msr.topNotUsableSize + msr.availableHeight + config.scaleTickSizeTop;
                    barWidth = (valueHop - config.scaleGridLineWidth * 2 - (config.barValueSpacing * 2) - (config.barDatasetSpacing * data.datasets.length - 1) - (config.barStrokeWidth / 2) - 1);
                },

                initSegments: function () {
                    var chart = this;
                    var ctx = this.context;

                    var xOffset = yAxisPosX + config.barValueSpacing;
                    for (var col = 0; col < data.labels.length; col++) {
                        var yOffset = ctx.canvas.height - xAxisPosY;
                        data.datasets.forEach(function (ds) {
                            var height = (ds.data[col] / calculatedScale.maxValue) * scaleHeight

                            var segment = new ChartSegment(ctx, ds.fillColor, 'white', 1)
                                .RectSegment(
                                    xOffset,
                                    yOffset,
                                    valueHop - config.barValueSpacing * 2,
                                    height
                                );

                            segment.dataset = ds;
                            segment.data = {
                                column: col,
                                label: ds.title,
                                value: ds.data[col]
                            };

                            chart.segments.push(segment);

                            yOffset += height;
                        });

                        xOffset += valueHop;
                    }
                },

                drawScale: function (animPc) {
                    this.drawLabels();

                    //X axis line
                    ctx.lineWidth = config.scaleLineWidth;
                    ctx.strokeStyle = config.scaleLineColor;
                    ctx.beginPath();
                    ctx.moveTo(yAxisPosX - config.scaleTickSizeLeft, xAxisPosY);
                    ctx.lineTo(yAxisPosX + msr.availableWidth + config.scaleTickSizeRight, xAxisPosY);
                    ctx.stroke();
                    for (var i = 0; i < data.labels.length; i++) {
                        ctx.beginPath();
                        ctx.moveTo(yAxisPosX + i * valueHop, xAxisPosY + config.scaleTickSizeBottom);
                        ctx.lineWidth = config.scaleGridLineWidth;
                        ctx.strokeStyle = config.scaleGridLineColor;
                        //Check i isnt 0, so we dont go over the Y axis twice.
                        if (config.scaleShowGridLines && i > 0 && i % config.scaleXGridLinesStep == 0) {
                            ctx.lineTo(yAxisPosX + i * valueHop, xAxisPosY - msr.availableHeight - config.scaleTickSizeTop);
                        } else {
                            ctx.lineTo(yAxisPosX + i * valueHop, xAxisPosY);
                        }
                        ctx.stroke();
                    }
                    //Y axis
                    ctx.lineWidth = config.scaleLineWidth;
                    ctx.strokeStyle = config.scaleLineColor;
                    ctx.beginPath();
                    ctx.moveTo(yAxisPosX, xAxisPosY + config.scaleTickSizeBottom);
                    ctx.lineTo(yAxisPosX, xAxisPosY - msr.availableHeight - config.scaleTickSizeTop);
                    ctx.stroke();
                    for (var j = ((config.showYAxisMin) ? -1 : 0) ; j < calculatedScale.steps; j++) {
                        ctx.beginPath();
                        ctx.moveTo(yAxisPosX - config.scaleTickSizeLeft, xAxisPosY - ((j + 1) * scaleHop));
                        ctx.lineWidth = config.scaleGridLineWidth;
                        ctx.strokeStyle = config.scaleGridLineColor;
                        if (config.scaleShowGridLines && j % config.scaleYGridLinesStep == 0) {
                            ctx.lineTo(yAxisPosX + msr.availableWidth + config.scaleTickSizeRight, xAxisPosY - ((j + 1) * scaleHop));
                        } else {
                            ctx.lineTo(yAxisPosX, xAxisPosY - ((j + 1) * scaleHop));
                        }
                        ctx.stroke();
                    }
                },

                drawLabels: function () {
                    ctx.font = config.scaleFontStyle + " " + config.scaleFontSize + "px " + config.scaleFontFamily;
                    ctx.fillStyle = config.scaleFontColor;

                    //X Labels     
                    if (ctx.canvas.width > config.xAxisMinWidthToShowLabels && (config.xAxisTop || config.xAxisBottom)) {
                        ctx.textBaseline = "top";
                        if (msr.rotateLabels > 90) {
                            ctx.save();
                            ctx.textAlign = "left";
                        } else if (msr.rotateLabels > 0) {
                            ctx.save();
                            ctx.textAlign = "right";
                        } else {
                            ctx.textAlign = "center";
                        }
                        if (config.xAxisBottom) {
                            for (var i = 0; i < data.labels.length; i++) {
                                ctx.save();
                                if (msr.rotateLabels > 0) {
                                    ctx.translate(yAxisPosX + i * valueHop - msr.highestXLabel / 2, msr.xLabelPos);
                                    ctx.rotate(-(msr.rotateLabels * (Math.PI / 180)));
                                    ctx.fillTextMultiLine(fmtChartJS(config, data.labels[i], config.fmtXLabel), 0, 0, ctx.textBaseline, config.scaleFontSize);
                                } else {
                                    ctx.fillTextMultiLine(fmtChartJS(config, data.labels[i], config.fmtXLabel), yAxisPosX + i * valueHop + (valueHop * 0.5), msr.xLabelPos, ctx.textBaseline, config.scaleFontSize);
                                }
                                ctx.restore();
                            }
                        }
                    }
                    //Y Labels
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    for (var j = ((config.showYAxisMin) ? -1 : 0) ; j < calculatedScale.steps; j++) {
                        if (config.scaleShowLabels) {
                            if (config.yAxisLeft) {
                                ctx.textAlign = "right";
                                ctx.fillTextMultiLine(calculatedScale.labels[j + 1], yAxisPosX - (config.scaleTickSizeLeft + config.yAxisSpaceRight), xAxisPosY - ((j + 1) * scaleHop), ctx.textBaseline, config.scaleFontSize);
                            }
                            if (config.yAxisRight && !valueBounds.dbAxis) {
                                ctx.textAlign = "left";
                                ctx.fillTextMultiLine(calculatedScale.labels[j + 1], yAxisPosX + msr.availableWidth + (config.scaleTickSizeRight + config.yAxisSpaceRight), xAxisPosY - ((j + 1) * scaleHop), ctx.textBaseline, config.scaleFontSize);
                            }
                        }
                    }
                    if (config.yAxisRight && valueBounds.dbAxis) {
                        for (var j = ((config.showYAxisMin) ? -1 : 0) ; j < calculatedScale2.steps; j++) {
                            if (config.scaleShowLabels) {
                                ctx.textAlign = "left";
                                ctx.fillTextMultiLine(calculatedScale2.labels[j + 1], yAxisPosX + msr.availableWidth + (config.scaleTickSizeRight + config.yAxisSpaceRight), xAxisPosY - ((j + 1) * scaleHop2), ctx.textBaseline, config.scaleFontSize);
                            }
                        }
                    }
                },

                drawSegments: function (animPc) {
                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width', 'height']);
                    });
                }
            });

            function getValueBounds() {
                var upperValue = Number.MIN_VALUE;
                var lowerValue = Number.MAX_VALUE;
                var minvl = new Array(data.datasets.length);
                var maxvl = new Array(data.datasets.length);
                for (var i = 0; i < data.datasets.length; i++) {
                    for (var j = 0; j < data.datasets[i].data.length; j++) {
                        var k = i;
                        var tempp = 0;
                        var tempn = 0;
                        if (!(typeof (data.datasets[0].data[j]) == 'undefined')) {
                            if (1 * data.datasets[0].data[j] > 0) {
                                tempp += 1 * data.datasets[0].data[j];
                                if (tempp > upperValue) {
                                    upperValue = tempp;
                                };
                                if (tempp < lowerValue) {
                                    lowerValue = tempp;
                                };
                            } else {
                                tempn += 1 * data.datasets[0].data[j];
                                if (tempn > upperValue) {
                                    upperValue = tempn;
                                };
                                if (tempn < lowerValue) {
                                    lowerValue = tempn;
                                };
                            }
                        }
                        while (k > 0) { //get max of stacked data
                            if (!(typeof (data.datasets[k].data[j]) == 'undefined')) {
                                if (1 * data.datasets[k].data[j] > 0) {
                                    tempp += 1 * data.datasets[k].data[j];
                                    if (tempp > upperValue) {
                                        upperValue = tempp;
                                    };
                                    if (tempp < lowerValue) {
                                        lowerValue = tempp;
                                    };
                                } else {
                                    tempn += 1 * data.datasets[k].data[j];
                                    if (tempn > upperValue) {
                                        upperValue = tempn;
                                    };
                                    if (tempn < lowerValue) {
                                        lowerValue = tempn;
                                    };
                                }
                            }
                            k--;
                        }
                    }
                };
                // AJOUT CHANGEMENT

                if (!isNaN(config.graphMin)) lowerValue = config.graphMin;
                if (!isNaN(config.graphMax)) upperValue = config.graphMax;
                if (Math.abs(upperValue - lowerValue) < 0.00000001) {
                    upperValue = Max([upperValue * 2, 1]);
                    lowerValue = 0;
                }
                labelHeight = config.scaleFontSize;
                scaleHeight = msr.availableHeight;
                var maxSteps = Math.floor((scaleHeight / (labelHeight * 0.66)));
                var minSteps = Math.floor((scaleHeight / labelHeight * 0.5));
                return {
                    maxValue: upperValue,
                    minValue: lowerValue,
                    maxSteps: maxSteps,
                    minSteps: minSteps
                };
            }

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        },
        // old stacked bar

        STSparkLine: function (data, options) {
            var highValue = Number.MIN_VALUE, lowValue = Number.MAX_VALUE, currentValue = 0;

            var yAxisPosX = 10;
            var xAxisPosY = 10;

            var ctx = this.context;

            var res = $.extend({
            }, this, {
                config: $.extend({
                    lineColor: 'gray',
                    lineWidth: 2,

                    highColor: 'blue',
                    lowColor: 'red',
                    currentColor: 'green'
                }, this.defaults.commonOptions, options),

                getValueAt: function (x) {
                    var xOffset = x - this.xMin;
                    var idx = (xOffset / this.xStep).toFixed(0);

                    var xPos = this.chartMin.x + this.xMin + (idx * this.xStep);
                    var yPos = this.context.canvas.height - (this.yMax - this.yMultiplier * data[idx].value);

                    return {
                        data: data[idx],
                        x: xPos,
                        y: yPos
                    };
                },

                initConstraints: function () {
                    this.chartMin = {
                        y: 5, x: 10
                    };
                    this.chartMax = {
                        y: this.context.canvas.height, x: this.context.canvas.width - 10
                    };

                    if (data) {
                        data.forEach(function (d) {
                            highValue = Math.max(highValue, d.value);
                            lowValue = Math.min(lowValue, d.value);
                            currentValue = d.value;
                        });

                        if (data.length) {
                            var chartWidth = this.chartMax.x - this.chartMin.x;
                            this.xMin = chartWidth * .1;
                            this.xStep = (chartWidth * .8) / (data.length - 1);

                            var chartHeight = (this.chartMax.y - this.chartMin.y);
                            this.yMin = this.chartMin.y + (chartHeight * .1);
                            this.yMax = this.chartMax.y - (chartHeight * .1);
                            this.yMultiplier = (chartHeight * .8) / 100;
                        }
                    }
                },

                initSegments: function () {
                    var inst = this;

                    var midX = inst.chartMin.x + inst.xMin;
                    data.forEach(function (d, col) {
                        var color = '';
                        if (col == 0 || col == data.length - 1) {
                            color = inst.config.lineColor;
                        }
                        if (d.value == lowValue) {
                            color = inst.config.lowColor;
                        }
                        if (d.value == highValue) {
                            color = inst.config.highColor;
                        }
                        if (d.value == currentValue) {
                            color = inst.config.currentColor;
                        }

                        if (color) {
                            var segment = new ChartSegment(ctx, 'white', color, 2)
                            .CircleSegment(
                                midX,
                                inst.context.canvas.height - (inst.yMax - inst.yMultiplier * d.value),
                                3,
                                3
                            );

                            segment.dataset = data;
                            segment.data = {
                                column: col,
                                label: d.label,
                                value: d.value
                            };

                            inst.segments.push(segment);
                        }

                        midX += inst.xStep;
                    });
                },

                drawScale: function (animPc) {
                    this.drawLabels();

                    //X axis lines
                    var y = this.yMax;
                    for (var i = 0; i <= 100; i++) {
                        ctx.lineWidth = this.config.scaleLineWidth;
                        ctx.strokeStyle = 'rgba(128,128,128,0.2)';
                        ctx.beginPath();
                        ctx.moveTo(this.chartMin.x, y);
                        ctx.lineTo(this.chartMax.x, y);
                        ctx.stroke();

                        y -= (this.yMax - this.yMin) * .2;
                    }
                },

                drawLabels: function () {
                },

                drawSegments: function (animPc) {
                    if (data) {
                        var xPos = this.chartMin.x + this.xMin;
                        for (var i = 0; i < data.length - 1; i++) {
                            ctx.lineWidth = this.config.lineWidth;
                            ctx.strokeStyle = this.config.lineColor;

                            ctx.beginPath();
                            ctx.moveTo(xPos, this.yMax - this.yMultiplier * data[i].value);
                            ctx.lineTo(xPos + this.xStep, this.yMax - this.yMultiplier * data[i + 1].value);
                            ctx.stroke();

                            xPos += this.xStep;
                        }
                    }

                    this.segments.forEach(function (segment) {
                        segment.draw(animPc, ['width', 'height']);
                    });
                }
            });

            var chart = res;

            res.initialize();
            res.animate();

            this.context.canvas.chart = res;
            return res;
        }
    };

    $(document).delegate('canvas', 'mouseover', function (ev) {
        if (!this.MouseOverInitialized) {
            this.MouseOverInitialized = true;

            var $tooltip;
            var prevSegment;
            var prevColor;

            function getGraphControl() {
                var $revGraph = $(this).closest('.REV_GRAPH');
                if ($revGraph.length) {
                    return $revGraph.STControlData();
                }
            }

            function getMouseoverSegment(ev) {
                var res = null;
                var pos = getMousePos(this, ev);
                if (pos && this.chart && this.chart.segments) {
                    // iterate in reverse as the last element drawn will be the top layer
                    for (var i = this.chart.segments.length - 1; i >= 0; i--) {
                        var segment = this.chart.segments[i];
                        if (segment.pointIsInside(pos.x, pos.y)) {
                            res = segment;
                            break;
                        }
                    }
                }
                return res;
            }

            $(this)
                .on('mousemove', function (ev) {
                    var el = this;

                    var mouseoverSegment = getMouseoverSegment.call(this, ev);
                    var graphControl = getGraphControl.call(this);

                    var pos = getMousePos(this, ev);
                    if (prevSegment && !prevSegment.pointIsInside(pos.x, pos.y)) {
                        this.chart.activeSegment = null;
                        prevSegment.highlight = false;
                        prevSegment.fillColor = prevColor;

                        if (graphControl && graphControl.lastCursor) {
                            $(el).css('cursor', graphControl.lastCursor);
                            graphControl.lastCursor = null;
                        }

                        $(this).trigger('segment-mouseleave', prevSegment);
                        prevSegment.draw();


                        if ($tooltip) {
                            $tooltip.remove();
                        }

                        $tooltip = null;
                        prevSegment = null;
                        prevColor = null;
                    }
                    if (!prevSegment && mouseoverSegment) {

                        if (graphControl && graphControl.OnClick) {
                            if (!graphControl.lastCursor) {
                                graphControl.lastCursor = $(el).css('cursor');
                            }
                            $(el).css('cursor', 'pointer');
                        }

                        prevSegment = mouseoverSegment;
                        prevColor = mouseoverSegment.fillColor;

                        var color = new tinycolor(mouseoverSegment.fillColor);
                        if (color.isDark()) {
                            color.lighten(20);
                        }
                        else {
                            color.darken(10);
                        }

                        mouseoverSegment.fillColor = color.toHexString();
                        mouseoverSegment.highlight = true;

                        this.chart.activeSegment = mouseoverSegment;
                        $(this).trigger('segment-mouseenter', mouseoverSegment);
                        mouseoverSegment.draw();

                        if (el.chart.config.showTooltips && el.chart.config.generateTooltip) {
                            $tooltip = $(el.chart.config.generateTooltip(mouseoverSegment.dataset, mouseoverSegment.data));
                            $tooltip.addClass('chartTooltip')
                                .css({
                                    'pointer-events': 'none'
                                })
                                .appendTo(document.body);
                        }


                        if ($tooltip) {
                            $tooltip.position({
                                my: 'left bottom',
                                at: 'left top',
                                of: ev,
                                collision: 'flip'
                            });
                        }
                    }
                })
                .on('mouseleave mouseout', function (ev) {
                    var el = this;

                    if ($tooltip) {
                        $tooltip.remove();
                        $tooltip = null;
                    }

                    $(document.body).children('.chartTooltip').remove();

                    if (prevSegment) {
                        prevSegment.fillColor = prevColor;
                        prevSegment.highlight = false;
                        prevSegment.draw();

                        prevSegment = null;
                        prevColor = null;
                    }

                    var graphControl = getGraphControl.call(this);
                    if (graphControl && graphControl.lastCursor) {
                        $(el).css('cursor', graphControl.lastCursor);
                        graphControl.lastCursor = null;
                    }
                })
                .on('click', function (ev) {
                    var mouseoverSegment = getMouseoverSegment.call(this, ev);
                    var graphControl = getGraphControl.call(this);

                    if (mouseoverSegment) {
                        if (graphControl && graphControl.OnClick) {
                            graphControl.OnClick(mouseoverSegment);
                        }

                        $(this).trigger('segment-click', mouseoverSegment);
                    }
                })
                .trigger(ev);
        }
    });

})(jQuery);
(function ($) {
    if (!$.pnotify) {
        return;
    }

    $.pnotify.defaults.history = false;
    $.pnotify.defaults.styling = "bootstrap3";

    if (ST.GetRootTXPWindow() === null) {
        $.pnotify = $.extend((function (pnotify) {
            return function() {
                return pnotify.apply(this, arguments)
                    .attr('aria-live', 'off')
                    .attr('role', 'alert');
            };
        })($.pnotify), $.pnotify);

        ///
        /// global defaults for specific pnotice types
        ///
        $.pnotify.defaults.addclass = "stack-topleft";
        $.pnotify.defaults.nonblock = true;
        $.pnotify.stack_top_right = {
            dir1: "down",
            dir2: "left",
            push: "bottom",
            firstpos2: 25,
            spacing1: 10,
            spacing2: 10
        };
    }

    $.pnotify_success = function (text, args) {
        if (window !== window.top && window.top.$ && window.top.$.pnotify_success) {
            return window.top.$.pnotify_success.apply(this, arguments);
        }

        var position = 0;

        if ($('#PageHeader').length) {
            var $cb = $('#PageHeader');
            position = $cb.offset().top + $cb.outerHeight() - $(document).scrollTop();
        }

        $.pnotify_position_all();

        return $.pnotify($.extend({}, $.pnotify.defaults, {
            title: 'Success',
            type: 'success',
            styling: 'bootstrap3',
            delay: 3000,
            text: text,
            addClass: 'stack-top-right',
            stack: $.pnotify.stack_top_right
        }, args || {}));
    };

    $.pnotify_notice = function (text, args) {
        return $.pnotify_error(text, $.extend({
            title: 'Notice',
            hide: true,
            delay: 3000,
            type: 'warn'
        }, args));
    };

    $.pnotify_error = function (text, args) {
        if (window !== window.top && window.top.$ && window.top.$.pnotify_error) {
            return window.top.$.pnotify_error.apply(this, arguments);
        }

        var position = 0;

        if ($('#PageHeader').length) {
            var $cb = $('#PageHeader');
            position = $cb.offset().top + $cb.outerHeight() - $(document).scrollTop();
        }

        $.pnotify_position_all();

        return $.pnotify($.extend({}, $.pnotify.defaults, {
            title: 'Error',
            text: text,
            type: 'error',
            styling: 'bootstrap3',
            nonblock: false,
            sticker: false,
            closer_hover: false,
            addClass: 'stack-top-right',
            stack: $.pnotify.stack_top_right
        }, args || {}));
    };
})(jQuery);
(function () {
    // Calling an OAuth Service
    function doSomethingWithGoogle() {
        ST.CallOAuthService("Google", "https://api.google.com/maps/...", { mapCoords: {} })
            .done(function (mapResponse) {
                if (mapResponse.status === 'OK') {
                    // Process the response
                }
            });
    }
})();

// Returns a deferred object that will execute once the response to the requestURL is completed.
//
// It will fetch a token for the specified service,
// show the authorization page if necessary,
// then redirect to the requestURL and requestData using the actual token
//
// the only data that needs to be stored in the browser is the auth code itself
//
(function ($) {
    var OAuthOptions = {};

    $.extend(Namespace('ST'), {
        CallOAuthService: function (serviceName, requestURL, requestData, options) {
            var OAUTH_SERVICE_REPOSITORY = './oauth_svc/';
            var STAPI_SERVICE = './st_api/';

            ST.Preferences.AuthAccessTokens = ST.Preferences.AuthAccessTokens || {};            
            var authObj = ST.Preferences.AuthAccessTokens[serviceName]//window.Cookies.getJSON('oauth_' + serviceName)
                || (serviceName.startsWith('ST.') ? ST.Authorization : null);

            var deferred = new jQuery.Deferred();
            var $progressDialog;
            var progressTimer;

            function closeProgressDialog() {
                clearTimeout(progressTimer);
                if ($progressDialog) {
                    ST.CloseProgressDialog($progressDialog);
                }
            }

            function requestAccessToken() {
                // Step 1: request the access token (call OAUTH_SERVICE_REPOSITORY/token)
                progressTimer = setTimeout(function () {
                    $progressDialog = ST.ShowProgressDialog('oauth', 'Attempting Authentication');
                }, 1000);

                return $.ajax(
                    {
                        url: OAUTH_SERVICE_REPOSITORY + serviceName + '/token',
                        type: 'POST',
                        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                        dataType: 'json',
                        headers: {
                            Authorization: (authObj && authObj.access_token)
                        }
                    })
                    .done(function (response) {
                        closeProgressDialog();

                        if (response.access_token) {
                            authObj = response;

                            ST.Preferences.AuthAccessTokens[serviceName] = authObj;
                            ST.SetPreference('AuthAccessTokens', JSON.stringify(ST.Preferences.AuthAccessTokens));

                            sendRequest();
                        }
                        else {
                            sendAuthRequest();
                        }
                    })
                    .fail(function (response) {
                        sendAuthRequest();
                    });
            }

            function sendAuthRequest() {
                // Step 2: attempt to have the user supply their credentials (if Step 2 fails)

                presentLoginDialog()
                    .done(function () {
                        sendRequest();
                    })
                    .fail(function (response) {
                        deferred.reject(response);
                    })
                    .always(function () {
                        closeProgressDialog();
                    });
            }

            function hasError(response) {
                response = response || { Error: 'Invalid Response' };

                if (response.Error) {
                    if ($.pnotify_error) {
                        $.pnotify_error(response.Error);
                    }
                    else if (window.ST && ST.ShowMessage) {
                        ST.ShowMessage(response.Error, 'Error', 'fa fa-exclamation-triangle');
                    }
                    else {
                        console.error(response.Error);
                    }

                    deferred.reject(response);
                    return true;
                }

                return false;
            }

            function sendRequest() {
                // Step 3: send the original request
                if (!requestURL) {
                    return $.resolve();
                }

                var url = requestURL.startsWith('http')
                    ? requestURL
                    : (STAPI_SERVICE + serviceName + '/' + requestURL.replace(/^\/+/, ''));

                var params = [];

                if (ST.Impersonated) {
                    params.push('IMPERSONATE=Y');
                }

                if (ST.CurrentWebPortal !== undefined) {
                    params.push('PORTAL=' + ST.CurrentWebPortal);
                }

                if (ST.RevFocusKey) {
                    params.push('FOCUS_KEY=' + ST.RevFocusKey)
                }

                url += '?' + params.join('&');

                var defaults = {
                    url: url,
                    type: 'POST',
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                    headers: {
                        Authorization: 'Bearer ' + (authObj && authObj.access_token)
                    },
                    dataType: 'json',
                    data: { 'data': JSON.stringify(requestData) }
                };

                var settings = $.extend(defaults, options);

                return $.ajax(settings)
                    .done(function (response) {
                        if (!hasError(response)) {
                            if (response.RevResponse && ST.ParseRevResponse) {
                                ST.ParseRevResponse(response.RevResponse);
                            }

                            deferred.resolve(response);
                        }
                    })
                    .fail(function (response) {
                        if (!hasError(response.responseJSON)) {
                            if (response.responseJSON && response.responseJSON.error === 'invalid_token') {
                                authObj = null;
                                requestAccessToken();
                            }
                            else if (response.statusCode === 500) {
                                authObj = null;
                                requestAccessToken();
                            }
                        }
                    });
            }

            function presentLoginDialog() {
                var loginDeferred = new jQuery.Deferred();

                if (OAuthOptions[serviceName].OpenInNewWindow) {
                    var wnd = window.open(OAUTH_SERVICE_REPOSITORY + serviceName + '/auth');
                    loginDeferred.resolve(); // TODO: add some polling to determine when the auth is complete
                }
                else {
                    ST.LoadTemplate("Templates/GB/IAPlugins.html")
                        .done(function () {
                            var interval = null;

                            closeProgressDialog();

                            // This will load a dialog with an iframe for the user to enter their credentials
                            $().stModal(
                                {
                                    template: 'ST.Modal.OAuth',
                                    src: OAUTH_SERVICE_REPOSITORY + serviceName + '/auth',
                                    init: function ($dlg) {
                                        var $iframe = $dlg.find('iframe');

                                        // When the iframe contains the code, we will close the dialog and complete the transaction
                                        interval = setInterval(function () {
                                            var contentType = $iframe[0].contentDocument && $iframe[0].contentDocument.contentType;

                                            if ($(document.body).find($iframe[0]).length === 0) {
                                                clearInterval(interval);
                                                loginDeferred.reject();
                                            }
                                            else {
                                                try {
                                                    var doc = $iframe[0].contentDocument;
                                                    var winLoc;

                                                    try {
                                                        winLoc = ($iframe[0].contentWindow && $iframe[0].contentWindow.location.href) || '';
                                                    }
                                                    catch (ex) {
                                                        // Do nothing
                                                    }

                                                    if (doc && doc.body) {
                                                        var json = doc.body.textContent.trim();
                                                        if (winLoc && winLoc.indexOf('/accept') !== -1 && json) {
                                                            try {
                                                                authObj = JSON.parse(json);
                                                            }
                                                            catch (ex) {
                                                                // do nothing
                                                            }

                                                            ST.Preferences.AuthAccessTokens[serviceName] = authObj;
                                                            ST.SetPreference('AuthAccessTokens', JSON.stringify(ST.Preferences.AuthAccessTokens));

                                                            clearInterval(interval);
                                                            $dlg.modal('hide');

                                                            loginDeferred.resolve();
                                                        }
                                                    }
                                                    else {
                                                        //$dlg.modal('hide');
                                                        //clearInterval(interval);
                                                        //loginDeferred.reject();
                                                    }
                                                }
                                                catch (ex) {
                                                    $dlg.modal('hide');
                                                    clearInterval(interval);
                                                    loginDeferred.reject();
                                                }
                                            }
                                        }, 250);
                                    }
                                })
                                .done(function () {
                                    clearInterval(interval);
                                    loginDeferred.reject();
                                });
                        });
                }

                return loginDeferred.promise();
            }

            if (OAuthOptions[serviceName]) {
                var serviceOpts = $.resolve();
            }
            else {
                var serviceOpts = ST.SendServerEvent(null, 'Rev_Get_ServiceOptions', { ServiceName: serviceName })
                    .done(function (res) {
                        OAuthOptions[serviceName] = res;
                    });
            }

            serviceOpts.done(function () {
                if (serviceName) {
                    // if there is no access token defined,
                    if (!authObj || !authObj.access_token) {
                        requestAccessToken();
                    }
                    else { // if there is an access token defined
                        sendRequest();
                    }
                }
                else {
                    deferred.reject();
                }
            });

            return deferred.promise();
        }
    });
})(jQuery);

$.extend(Namespace('ST.Actions'), {
    GetOpenAuthToken: function (node) {
        var clientName = node.ClientName['#cdata'];
        if (clientName) {
            ST.CallOAuthService(clientName, '', {}, {})
        }
    }
});
(function ($, ko) {
    $.extend(Namespace('ST.Translations.SignatureRequest'), {
        Clear: "clear",
        Signature: "Signature",
        Submit: "Submit",
        TypeSignature: "Type Signature",
        AcceptDocument: "Accept Document",
        Accept: "Accept",
        NoSelection: "No Selection",
        RejectDocument: "Reject Document",
        Reject: "Reject",
        EnterReason: "Enter Reason"
    });

    function getTranslations() {
        return (elvis_get(window, 'PXP', 'Translations') || ST.Translations).SignatureRequest;
    }

    $.extend(Namespace('ST'), {
        LoadSignatureRequest: function (el, data, bInModal) {
            return new Promise(function (resolve, reject) {
                if (el && data) {
                    var $el = ich['ST.SignatureRequest']({
                        Translate: function () {
                            return function (text, render) {
                                return getTranslations()[text];
                            }
                        }
                    });
                    $(el).replaceWith($el);

                    var vm = new vmSignatureRequest(data, bInModal, resolve);
                    ko.applyBindings(vm, $el[0]);
                }
            });
        }
    });

    $(document).delegate('.sig-documents li', 'click', function (ev) {
        ko.dataFor(this).error('');
    });

    ko.bindingHandlers.signature = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            $(element).signature();

            valueAccessor()($(element).data('signature'));
        }
    };

    function vmSignatureRequest(data, bInModal, resolve) {
        $.extend(this, {
        }, data);

        this.resolve = resolve;
        this.inModal = bInModal || false;
        this.saving = ko.observable(false);
        this.error = ko.observable('');
        this.signature = ko.observable();
        this.documents = data.documents.map(function (doc) {
            return new vmDocument(doc);
        });
    }

    vmSignatureRequest.prototype = {
        clearSignature: function () {
            this.signature().$inpText.val('');
            this.signature().clear();

            $(document.activeElement).blur();
        },

        submitSignature: function () {
            var inst = this;
            var sig = this.signature();

            function cropImageFromCanvas(srcCanvas) {
                var ctx = srcCanvas.getContext('2d');

                var canvas = document.createElement('canvas');
                var ctx1 = canvas.getContext('2d');

                canvas.width = srcCanvas.width;
                canvas.height = srcCanvas.height;

                var w = canvas.width, h = canvas.height,
                    pix = { x: [], y: [] },
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                for (var y = 0; y < h; y++) {
                    for (var x = 0; x < w; x++) {
                        var index = (y * w + x) * 4;
                        if (imageData.data[index + 3] > 0) {
                            pix.x.push(x);
                            pix.y.push(y);
                        }
                    }
                }
                pix.x.sort(function (a, b) { return a - b });
                pix.y.sort(function (a, b) { return a - b });

                var n = pix.x.length - 1;
                w = 1 + pix.x[n] - pix.x[0] + 10;
                h = 1 + pix.y[n] - pix.y[0] + 10;
                var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);

                canvas.width = w;
                canvas.height = h;
                ctx1.putImageData(cut, 5, 5);

                return canvas.toDataURL();
            }

            function crop(canvas, x, y, width, height) {
                var canvas1 = document.createElement('canvas');
                var ctx1 = canvas1.getContext('2d');
                canvas1.width = width;
                canvas1.height = height;

                ctx1.drawImage(canvas, x, y, width, height, 0, 0, width, height);
                return canvas1.toDataURL();
            }

            if (sig) {
                var data = {
                    Documents: {},
                    SignatureData: ''
                };

                var valid = true;
                this.documents.forEach(function (doc) {
                    if (doc.docGU && !doc.acceptState()) {
                        valid = false;
                        doc.error('An accept option must be selected.');
                    }
                    else {
                        var guid = doc.requestGU;
                        if (guid) {
                            data.Documents[guid] = {
                                Code: doc.acceptState(),
                                Reason: doc.acceptState() !== 'A' ? doc.reason() : ''
                            };
                        }
                    }
                });

                if (sig.hasValue()) {
                    var dr = sig.drawRect;
                    //data.SignatureData = crop(sig.$canvas[0], dr.x, dr.y, dr.x2 - dr.x, dr.y2 - dr.y);
                    data.SignatureData = cropImageFromCanvas(sig.$canvas[0]);
                }
                else {
                    valid = false;
                    this.error('Please enter a signature.');
                }

                if (valid) {
                    inst.saving(true);
                    ST.SendServerEvent(null, 'Rev_Submit_Signature', { '#cdata': JSON.stringify(data) })
                        .done(function (res) {
                            if (window.PXP) {
                                window.location.href = "Home_PXP2.aspx";
                            }
                            else if (inst.inModal) {
                                ST.CloseModal($('.sig-modal'));
                                if (inst.resolve) {
                                    inst.resolve(res);
                                }
                            }
                            else {
                                const iframe = ST.WithinIFrame();
                                const wnd = ST.GetParentWindow();
                                const $modal = wnd?.$(iframe).closestWithClass('modal');
                                const st = wnd?.ST;

                                if (st && $modal.length) {
                                    st.CloseModal($modal);
                                    st.RefreshView();
                                }
                            }
                        })
                        .fail(function () {
                            inst.saving(false);
                        });
                }
            }
        }
    };

    function vmDocument(data) {
        $.extend(this, {
            error: ko.observable(''),
            acceptState: ko.observable(data.docGU ? '' : 'A'), // auto-accept missing documents
            reason: ko.observable(''),
            showDocumentURL: true,
            documentURL: ''
        }, data);
    }

    vmDocument.prototype = {
        updateAccept: function () {

        }
    };

    function clearErrorMessage($el) {
        var error = ko.dataFor($el[0]).error;
        if (error) {
            error('');
        }
    }

    $.fn.signature = function (opts) {
        if (opts === 'value') {
            var sig = this.data('signature');
            return sig && sig.getValue();
        }

        else {
            return this.each(function () {
                if (!$(this).data('signature')) {
                    $(this).data('signature', new signature(this));
                }
            });
        }
    };

    function signature(el) {
        var inst = this;
        var $el = $(el);

        $.extend(this, {
            $bgCanvas: $el.fastFind('.bg-canvas').first(),
            $canvas: $el.fastFind('.sig-canvas').first(),
            $inpText: $el.fastFind('input').not('[type="hidden"]').first(),
            $inpData: $el.fastFind('input[type="hidden"]').first()
        });

        this.clear();

        $el.on('mousedown', function (ev) {
            clearErrorMessage($el.children('.sig-form-group'));
        });

        this.$inpText.on('input', function (ev) {
            clearErrorMessage($el);

            inst.drawText();
        });

        var ctx = this.$canvas[0].getContext('2d');
        function getPos(el, ev) {
            var offset = $(el).offset();

            if (ev.type.indexOf('touch') !== -1) {
                return {
                    x: ev.originalEvent.touches[0].clientX - offset.left + $(document).scrollLeft(),
                    y: ev.originalEvent.touches[0].clientY - offset.top + $(document).scrollTop()
                };
            }

            return {
                x: ev.originalEvent.pageX - offset.left,
                y: ev.originalEvent.pageY - offset.top
            };
        }

        var pos = null;
        this.$canvas
            .on('mousedown touchstart', function (ev) {
                pos = getPos(this, ev);

                this.isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);

                if (ev.type.indexOf('touch') !== -1) {
                    ev.preventDefault();
                }
            })
            .on('mousemove touchmove', function (ev) {
                if (pos && this.isDrawing) {
                    if (inst.$inpText.val()) {
                        inst.$inpText.val('');

                        inst.clear();
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y);
                    }

                    pos = getPos(this, ev);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    if (ev.type.indexOf('touch') !== -1) {
                        ev.preventDefault();
                    }
                }
            })
            .on('mouseleave mouseup touchend', function (ev) {
                if (this.isDrawing) {
                    this.isDrawing = false;

                    pos = getPos(this, ev);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    if (ev.type.indexOf('touch') !== -1) {
                        ev.preventDefault();
                    }
                }
            });
    }

    signature.prototype = {
        getValue: function () {
            return this.$inpData.val();
        },

        clear: function () {
            var signatureText = getTranslations().Signature || 'Signature';

            var canvas = this.$canvas[0];
            var ctx = canvas.getContext('2d');

            var bgCanvas = this.$bgCanvas[0];
            var bgCtx = bgCanvas.getContext('2d');

            bgCanvas.width = canvas.width = this.$canvas.width();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#888';
            ctx.fillStyle = '#888';
            ctx.font = "bold 16px arial";

            bgCtx.clearRect(0, 0, canvas.width, canvas.height);
            bgCtx.strokeStyle = '#888';
            bgCtx.fillStyle = '#888';
            bgCtx.font = "bold 16px arial";

            this.drawRect = {
                x: ctx.measureText(signatureText).width + 15,
                y: 10,
                x2: canvas.width - 15,
                y2: canvas.height - 10
            };

            bgCtx.fillText(signatureText, 10, this.drawRect.y2 - 10);

            bgCtx.beginPath();
            bgCtx.lineWidth = 2;
            bgCtx.moveTo(this.drawRect.x, this.drawRect.y2 - 10);
            bgCtx.lineTo(this.drawRect.x2, this.drawRect.y2 - 10);
            bgCtx.stroke();

            bgCtx.strokeStyle = '#333';
            bgCtx.fillStyle = '#333';

            canvas.originalData = canvas.toDataURL();
        },

        drawText: function (text) {
            this.clear();

            var canvas = this.$canvas[0];
            var ctx = canvas.getContext('2d');

            var cursiveFont = 'Brush Script MT, Brush Script Std, cursive';
            var text = text || this.$inpText.val().trim();

            if (text) {
                ctx.textBaseline = 'bottom';

                var maxHeight = this.drawRect.y2 - this.drawRect.y - 10;
                var scriptFontHeight = 18;

                do {
                    ctx.font = "normal " + scriptFontHeight + "px " + cursiveFont;
                    var currWidth = ctx.measureText(text).width;
                    if (currWidth >= this.drawRect.x2 - this.drawRect.x - 30) {
                        break;
                    }

                    scriptFontHeight += 2;
                } while (scriptFontHeight < maxHeight);

                ctx.fillText(text, this.drawRect.x + 10, this.drawRect.y2 - 10);
            }
        },

        hasValue: function () {
            return this.$canvas[0].originalData !== this.$canvas[0].toDataURL();
        }
    };
})(jQuery, ko);
/* 
 * Three things are needed to use VideoConferenceAPI effectively:
 * 1. window.applicationRoot defined.
 * 2. schemes/st/STX_VideoConferenceAPI.css.
 * 3. js/st/STX_VideoConferenceAPI.js.
*/

/*
 * Hosts must be authenticated once through Zoom. This means they must have a Zoom account created. 
 * Participants join as guests, and do not need authentication. They can have accounts with Zoom, but for purposes of the meeting they are guests.
 * 
 */

/*
 * Each method in VideoConferenceAPI can be called directly, or can be attached to a DOM element like this:
 * <span data-vidconf="JoinStartMeeting" data-options='{"vidConfGU": "xxx"}'></span>
 * This element, when clicked, will perform a VideoConferenceAPI.JoinStartMeeting({vidConfGU: xxx})
 */

document.addEventListener('DOMContentLoaded', function () {
    // This parent window trickery is to allow us to make callback events to any UIs after auth is complete.
    var parentWindow = window.parent;
    var options = null;
    if (parentWindow) options = parentWindow.VideoConferenceAPI_Options;

    // Just in case this is loaded in a window that is cross-origin
    try {
        if (!options && window.opener) options = window.opener.VideoConferenceAPI_Options;
    }
    catch (ex) { }

    // Do we have a code to use for auth? Begin auth round 2.
    var queryObject = VideoConferenceAPI.GetQueryString();
    if (queryObject.code) {
        VideoConferenceAPI.Authorize(queryObject.code, options);
        return;
    }

    if (options) {
        if (VideoConferenceAPI[options.Function]) VideoConferenceAPI[options.Function](options);
        return;
    }
}, false);

var VideoConferenceAPI = {
    Document_Click: function (event) {
        var vidconf = event.target.ep_closest('[data-vidconf]');
        if (vidconf) {
            var endPoint = vidconf.getAttribute('data-vidconf');
            var options = ep_JSONparse(vidconf.getAttribute('data-options'), {});
            if (VideoConferenceAPI[endPoint]) VideoConferenceAPI[endPoint](options);
        }
    },
    APIs_Enum: {
        BBB: 0,
        Zoom: 1
    },
    ApiResultCode_Enum: {
        NotAuthenticated: 1,
        AuthRefreshFailed: 2,
        JsonParseError: 3,
        NotAuthenticatedCanAuth: 4,
        RateLimit: 5,
        MeetingNotFound: 50,
        MeetingHasEnded: 51,
        CouldNotJoin: 52,
        GeneralException: 100,
        WebException: 101,
        NotLicensed: 102,
        NoContext: 103
    },
    Configured: function () { return !!ST.VideoConferenceConfigured },
    ClearAndReauth: function () {
        VideoConferenceAPI.CallPromise('ClearAuth', {}).then(
            function () {
                VideoConferenceAPI.Authorize(null, {
                    onAuth: function () { },
                    onAuthOptions: {}
                });
            }
        );
    },
    ClearAuth: function () {
        VideoConferenceAPI.CallPromise('ClearAuth', {});
    },
    Authorize: function (code, options) {
        if (!options) options = {};

        if (!code) {
            // Round one. This round opens the window in order to get the missing code.
            VideoConferenceAPI.CallPromise('AuthorizeURL', {}).then(
                function (response) {
                    if (!response.success) {
                        if (response.message) alert(response.message);
                        return;
                    }

                    // Open a window to begin the auth process.
                    window.VideoConferenceAPI_Options = options;
                    window.open(response.content);
                },
                function (response) {
                    if (response.message) alert(response.message);
                }
            );
        }
        else {
            if (!window.applicationRoot) {
                // This is the return trip. If Zoom is mucking up our Auth process in QA, we need to have this and be able to complete the auth.
                // Strip the st/templates portion out of the URL, that gets us the applicationRoot.
                var templatetIndex = location.href.indexOf('Template');
                window.applicationRoot = location.href.substr(0, templatetIndex);
            }

            // Round two. This will be called within the auth window as a URL redirect after auth. The code becomes tokens on the server.
            VideoConferenceAPI.CallPromise('Authorize', { code: code }, true).then(
                function (response) {
                    if (!response.success) {
                        if (response.message) alert(response.message);
                        return;
                    }

                    // On success, notify the parent window.
                    authorized = true;
                    if (options.onAuth) {
                        options.onAuth(options.onAuthOptions);
                        window.close();
                    }
                    else {
                        var element = document.createElement('div');
                        element.innerHTML = 'Auth Complete. If you recieved this message, then the auth process did not complete properly. You\'ll need to close this tab and recreate any meeting you were creating.';
                        document.body.appendChild(element);
                    }
                },
                function (response) {
                    if (response.message) alert(response.message);
                    return;
                }
            );
        }
    },
    Create: function (options) {
        /* 
            * Available options for Create:
            * 
            * Values
            * 
            * name - string - Optional. Will default to 'Web Meeting' with today's mm/dd/yyyy date.
            * startDate - Date - Optional. Defaults to right now.
            * endDate - Date - Optional. Defaults to right now + 1 hour. Really only determines when the user stops seeing the meeting as available.
            * sectionGU - EPC_SCH_YR_SECT.SECTION_GU - Optional. This or sectionGU are needed to do anything.
            * userGUs - REV_PERSON.PERSON_GU array - Optional. This or sectionGU are needed to do anything.
            * recurOptions - Optional. Used for recurring meetings.
            * 
            * Event Callbacks
            * 
            * success - Returns the created meeting object.
            * fail - Returns the full response object: {success, code, message}
            * 
            * Essentially, the only non-optional is either having sectionGU or userGUs.
        */

        if (!options.name) options.name = 'Web Meeting ' + (new Date()).toLocaleDateString();
        if (!options.sectionGU) options.sectionGU = '';
        if (!options.userGUs) options.userGUs = [];
        if (typeof options.meetingAuth === 'undefined') options.meetingAuth = true;

        if (!options.startDate || options.startDate.getTime) {
            var d = options.startDate;
            if (!d) d = new Date();
            options.startDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':00.000'; // This catpures user actual time sans TimeZone.
        }
        if (!options.endDate || options.endDate.getTime) {
            var d = options.endDate;
            if (!d) {
                d = new Date();
                d.setTime(d.getTime() + 1000 * 60 * 60);
            }
            options.endDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':00.000'; // This catpures user actual time sans TimeZone.
        }

        var post = { name: options.name, startDate: options.startDate, endDate: options.endDate, sectionGU: options.sectionGU, userGUs: options.userGUs, meetingAuth: options.meetingAuth, recurOptions: options.recurOptions };

        VideoConferenceAPI.CallPromise('Create', post).then(
            function (response) {
                var en = VideoConferenceAPI.ApiResultCode_Enum;
                if (!response.success && response.code == en.NotAuthenticatedCanAuth) {
                    // Run the Auth process before continuing.
                    VideoConferenceAPI.Authorize(null, {
                        onAuth: VideoConferenceAPI.Create,
                        onAuthOptions: options
                    });
                    return;
                }

                if (!response.success) {
                    if (options.fail) {
                        options.fail(response);
                        return;
                    }

                    if (response.message) alert(response.message);
                    return;
                }

                if (options.success) options.success(response.content);
            },
            function (response) {
                if (options.fail) {
                    options.fail(response);
                    return;
                }
                if (response.message) alert(response.message);
                return;
            }
        );
    },
    Update: function (options) {
        if (!options.startDate || options.startDate.getTime) {
            var d = options.startDate;
            if (!d) d = new Date();
            options.startDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':00.000'; // This captures user actual time sans TimeZone.
        }
        if (!options.endDate || options.endDate.getTime) {
            var d = options.endDate;
            if (!d) {
                d = new Date();
                d.setTime(d.getTime() + 1000 * 60 * 60);
            }
            options.endDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':00.000'; // This captures user actual time sans TimeZone.
        }

        var post = { vidConfGU: options.vidConfGU, name: options.name, startDate: options.startDate, endDate: options.endDate, recurOptions: options.recurOptions };

        VideoConferenceAPI.CallPromise('Update', post).then(
            function (response) {
                if (!response.success) {
                    if (options.fail) {
                        options.fail(response);
                        return;
                    }

                    if (response.message) alert(response.message);
                    return;
                }

                if (options.success) options.success(response.content);
            },
            function (response) {
                if (options.fail) {
                    options.fail(response);
                    return;
                }
                if (response.message) alert(response.message);
                return;
            }
        );
    },
    ClassMeetingSectionsAlreadyStarted: function (callback) {
        VideoConferenceAPI.CallPromise('ClassMeetingSectionsAlreadyStarted', {}).then(
            function (response) {
                if (!response.success) {
                    if (response.message) alert(response.message);
                    return;
                }

                if (callback) callback(response.content);
            },
            function (response) {
                if (response.message) alert(response.message);
            }
        );
    },
    AnalyzeMeeting: function (options) {
        // Experimenting with Zoom API possibilities. Not really used.

        VideoConferenceAPI.CallPromise('AnalyzeMeeting', { vidConfGU: options.vidConfGU }).then(
            function (response) {
                if (!response.success) {
                    if (response.message) alert(response.message);
                    return;
                }

                // Nothing much to do here yet, except look at the data set.
            },
            function (response) {
                if (response.message) alert(response.message);
                return;
            }
        );
    },
    JoinStartMeetingFromURL: function (url) {
        window.open(url);
    },
    JoinStartMeeting: function (options) {
        if (!options.vidConfGU) return;

        VideoConferenceAPI.CallPromise('JoinStartMeeting', { vidConfGU: options.vidConfGU }).then(
            function (response) {
                if (!response.success) {
                    if (options.failure) options.failure(response);

                    var en = VideoConferenceAPI.ApiResultCode_Enum;
                    if (response.code == en.NotAuthenticatedCanAuth) {
                        // Run the Auth process before continuing.
                        VideoConferenceAPI.Authorize(null, {
                            onAuth: VideoConferenceAPI.JoinStartMeeting,
                            onAuthOptions: options
                        });

                        return;
                    }
                    else if (response.code == en.RateLimit) {
                        // Wait a moment and try again.
                        setTimeout(
                            function () {
                                VideoConferenceAPI.JoinStartMeeting(options);
                            }, 1000
                        );

                        return;
                    }
                    else if (response.code == en.WebException) {
                        var rawData = {};
                        try {
                            rawData = JSON.parse(response.rawData);
                        }
                        catch (ex) {
                            rawData = {};
                        }

                        if (rawData.code == 200) {
                            alert('This meeting was not created using your currently connected Zoom account. (200 - No Permission)');
                            return;
                        }
                    }

                    if (response.message) alert(response.message);
                    return;
                }

                if (options.success) options.success();

                //window.open(response.content.WebURI.replace('https', 'zoommtg'));
                window.open(response.content.WebURI);
            },
            function (response) {
                if (response.message) alert(response.message);
                return;
            }
        )
    },
    Delete: function (options) {
        if (!options.vidConfGU) return;

        VideoConferenceAPI.CallPromise('Delete', { vidConfGU: options.vidConfGU }).then(
            function (response) {
                if (!response.success) {
                    if (options.failure) {
                        options.failure(response);
                        return;
                    }

                    if (response.message) alert(response.message);
                    return;
                }

                if (options.success) options.success();
            },
            function (response) {
                if (response.message) alert(response.message);
                return;
            }
        )
    },
    BellMeetingsInitiallyJoined: function (success, fail) {
        // They will become the Host of the meeting.

        return VideoConferenceAPI.CallPromise('BellMeetingsInitiallyJoined', {}).then(
            function (response) {
                if (!response.success) {
                    if (response.message) alert(response.message);
                    return;
                }

                if (success) success(response.content);
            },
            function (response) {
                if (response.message) alert(response.message);
                if (fail) fail();
            }
        )
    },
    GetClassMeetingInfo: function (orgYrGU, success, fail) {
        // Get basic info about every class meeting in the system. VidConfGU, MeetingID, SectionGUs.

        return VideoConferenceAPI.CallPromise('GetClassMeetingInfo', { orgYrGU: orgYrGU }).then(
            function (response) {

                if (!response.success) {

                    if (response.message) {
                        alert(response.message);
                    }

                    return;
                }

                if (success) {
                    return success(response.content);
                }

            },
            function (response) {
                if (response.message) alert(response.message);
                if (fail) fail();
            }
        )
    },
    GetCurrentMeetings: function (staffGU, success, fail) {
        // Get a list of current meetingIDs from Zoom

        VideoConferenceAPI.CallPromise('GetCurrentMeetings', { staffGU: staffGU }).then(
            function (response) {
                if (!response.success) {
                    if (response.message) alert(response.message);
                    return;
                }

                if (success) success(response.content);
            },
            function (response) {
                if (response.message) alert(response.message);
                if (fail) fail();
            }
        )
    },
    MeetingsForUser: function (callback) {
        // Get all meetings available to join for the current user.
        // Returns an array of meeting objects.

        VideoConferenceAPI.CallPromise('MeetingsForUser', {}).then(
            function (response) {
                if (!response.success) {
                    if (response.message) alert(response.message);
                    return;
                }

                if (callback) callback(response.content);
            },
            function (response) {
                if (response.message) alert(response.message);
            }
        );
    },
    DefaultDurationP: function () {
        // Get the default duration setting from the server.

        return new Promise(function (resolve, reject) {
            VideoConferenceAPI.CallPromise('DefaultDuration').then(
                function (response) {
                    if (!response.success) {
                        if (response.message) alert(response.message);
                        resolve('60');
                        return;
                    }

                    resolve(response.content);
                },
                function (response) {
                    if (response.message) alert(response.message);
                    resolve('60');
                }
            );
        });
    },
    RecurText: function (recur) {
        if (recur == null) return "";

        var rtn = "";

        if (recur.RecurType == 3) {
            rtn = "Monthly meeting";

            if (recur.MonthType == 0) {
                var ending = "th";
                var countString = recur.MonthDayofMonth.toString();
                var lastChar = countString[countString.length - 1];
                if (lastChar == '2') ending = "nd";
                else if (lastChar == '3') ending = "rd";
                else if (lastChar == '1') ending = "st";

                rtn = "Monthly meeting on the " + recur.MonthDayofMonth + ending;
            }
            else if (recur.MonthType == 1) {
                var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                var weekDay = weekDays[recur.MonthDayofWeek];

                if (recur.MonthDayType == 1)
                    rtn = "Monthly meeting on the first " + weekDay;
                else if (recur.MonthDayType == 2)
                    rtn = "Monthly meeting on the second " + weekDay;
                else if (recur.MonthDayType == 3)
                    rtn = "Monthly meeting on the third " + weekDay;
                else if (recur.MonthDayType == 4)
                    rtn = "Monthly meeting on the fourth " + weekDay;
                else if (recur.MonthDayType == 5)
                    rtn = "Monthly meeting on the last " + weekDay;
            }

            var months = [];
            if (recur.January) months.push("January");
            if (recur.February) months.push("February");
            if (recur.March) months.push("March");
            if (recur.April) months.push("April");
            if (recur.May) months.push("May");
            if (recur.June) months.push("June");
            if (recur.July) months.push("July");
            if (recur.August) months.push("August");
            if (recur.September) months.push("September");
            if (recur.October) months.push("October");
            if (recur.November) months.push("November");
            if (recur.December) months.push("December");

            if (months.length < 12)
                rtn += " of " + months.join(", ");
            else
                rtn += " of every month";
        }
        else if (recur.RecurType == 2) {
            var weekCount = recur.WeekCount;
            if (weekCount > 1)
                rtn = "Every " + weekCount + " weeks ";
            else
                rtn = "Every week ";

            var weekDays = [];
            if (recur.Monday) weekDays.push("Monday");
            if (recur.Tuesday) weekDays.push("Tuesday");
            if (recur.Wednesday) weekDays.push("Wednesday");
            if (recur.Thursday) weekDays.push("Thursday");
            if (recur.Friday) weekDays.push("Friday");
            if (recur.Saturday) weekDays.push("Saturday");
            if (recur.Sunday) weekDays.push("Sunday");

            if (weekDays.length > 0) rtn += " on ";
            rtn += weekDays.join(", ");
        }
        else if (recur.RecurType == 1) {
            rtn = "Every day";
            var dayCount = recur.DayCount;
            var hourCount = recur.EveryHour;
            var minuteCount = recur.EveryMinute;

            if (hourCount > 0) {
                if (hourCount > 1)
                    rtn = "Every " + hourCount + " hours";
                else
                    rtn = "Every hour";
            }
            else if (minuteCount > 0) {
                if (minuteCount > 1)
                    rtn = "Every " + minuteCount + " minutes";
                else
                    rtn = "Every minute";
            }
            else if (dayCount > 0) {
                if (dayCount > 1)
                    rtn = "Every " + dayCount + " days";
                else
                    rtn = "Every day";
            }
        }

        if (recur.StartDate)
            rtn += " beginning on " + new Date(recur.StartDate).toLocaleDateString();

        if (recur.StartTime)
            rtn += " at " + new Date(recur.StartTime).toLocaleTimeString();

        if (recur.StopDate)
            rtn += " ending on " + new Date(recur.StopDate).toLocaleDateString();

        return rtn;
    },
    CallPromise: function (call, post, skipLocalAuth) {
        if (!post) post = {};
        return new Promise(function (resolve, reject) {
            if (call.indexOf('api') === -1 && call.indexOf('Service') === -1) call = 'api/VideoConference/' + call;

            var checkApiRules = call.indexOf('api/VideoConference/') > -1;

            if (checkApiRules) {
                if (!skipLocalAuth && !VideoConferenceAPI.Licensed()) {
                    reject({ success: false, content: {}, message: null });
                    return;
                }

                if (!skipLocalAuth && !VideoConferenceAPI.Configured()) {
                    reject({ success: false, content: {}, message: 'Video Conferencing is not yet configured.' });
                    return;
                }
            }

            if (!window.applicationRoot) {
                reject({ success: false, content: {}, message: null });
                return;
            }

            var domain = window.applicationRoot + call;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', domain);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('CURRENT_WEB_PORTAL', window.CURRENT_WEB_PORTAL);
            xhr.setRequestHeader('AGU', window.PXP?.AGU);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    resolve(response);
                }
                else {
                    var response;
                    try {
                        response = JSON.parse(xhr.responseText);
                    }
                    catch (ex) { }

                    if (!response) response = 'Network Error (' + xhr.status + ')';

                    if (response.StackTrace) {
                        reject({ success: false, content: response, message: 'An unexpected error occurred: ' + response.Message });
                        return;
                    }

                    reject({ success: false, content: response, message: 'An unexpected error occurred: ' + xhr.responseText });
                }
            }
            xhr.onerror = function () {
                reject({ success: false, content: {}, message: 'Network Error' });
            };
            xhr.send(JSON.stringify(post));
        });
    },
    OpenPopup: function (options) {
        if (!options) options = {};
        if (!options.container) options.container = 'body';
        if (typeof options.scrolls === 'undefined') options.scrolls = true;

        document.querySelectorAll('.ep_OpenPopup.dx-state-invisible').ep_remove();
        var popup = document.ep_create('<div class="ep_OpenPopup"></div>');

        var container = document.querySelector(options.container);
        if (!container) {
            alert('Could not open popup. Container not found.');
            return;
        }

        container.appendChild(popup);
        $(popup).dxPopup({
            container: options.container,
            visible: true,
            fullScreen: !!options.fullScreen,
            dragEnabled: !!options.dragEnabled,
            resizeEnabled: !!options.resizeEnabled,
            title: options.title,
            onShown: function () {
                VideoConferenceAPI.UpdateForDXPopup();
            },
            onHidden: function () {
                VideoConferenceAPI.UpdateForDXPopup();
            },
            contentTemplate: function (element) {
                var scroller = document.createElement('div');
                scroller.style.height = '100%';

                var elm = document.createElement('div');
                scroller.appendChild(elm);

                if (options.scrolls) {
                    scroller.classList.add('Scroller');
                    scroller.style.overflow = 'auto';
                    scroller.addEventListener('wheel', function (event) { event.stopPropagation(); });
                }

                if (options.scrollableContent) options.scrollableContent(elm);

                return scroller;
            },
            onHiding: options.onHiding
        });
        popup.ep_PopupInstance = $(popup).dxPopup('instance');
    },
    ClosePopup: function (element) {
        var popup = element.ep_closest('.ep_OpenPopup.dx-popup');
        if (popup && popup.ep_PopupInstance) popup.ep_PopupInstance.hide();
    },
    UpdateForDXPopup: function (e) {
        var elements = document.querySelectorAll('.ep_OpenPopup:not(.dx-state-invisible)');
        if (elements.length > 0) document.querySelector('html').style.overflow = 'hidden';
        else document.querySelector('html').style.overflow = '';
        document.querySelectorAll('.ep_OpenPopup.dx-state-invisible').ep_remove();
    },
    GetQueryString: function (q) {
        if (!q) q = location;
        if (q == location) q = location.search;
        q = q.replace('?', '');

        return (function (a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(q.split("&"));
    },
    Licensed: function () {
        return !!ST.VideoConferenceEnabled;
    }
};

(function ($) {
    var videoMeetings = {};
    var vmVideoMeetings;
    var initElement;

    VideoConferenceAPI.InitVideoConferencePolling = function (initElementCallback) {
        if (window.ST && ST.Impersonated) return;
        if (window.TXP && TXP.Impersonated) return;

        initElement = initElementCallback;

        if (VideoConferenceAPI.Licensed() && VideoConferenceAPI.Configured() && !$(document.body).hasThisClass('ChildView')) {
            if (!ST.DisablePolling)
                setInterval(checkForMeetings, 120000);
        }
    };

    function checkForMeetings() {
        VideoConferenceAPI.CallPromise('UpcomingMeetings')
            .then(
                function (res) {
                    if (!res.success) {
                        if (res.message) alert(res.message);
                        return;
                    }

                    res.content.forEach(function (meeting) {
                        if (!videoMeetings[meeting.VidConfGU]) {
                            videoMeetings[meeting.VidConfGU] = meeting;
                            showMeetingNotification(meeting.VidConfGU);
                        }
                    });
                },
                function (response) {
                    if (response.message) alert(response.message);
                }
            );
    }

    function showMeetingNotification(vidConfGU) {
        if (videoMeetings[vidConfGU]) {
            if (!vmVideoMeetings) {
                vmVideoMeetings = new vmVideoMeetingWidget();
                initElement(vmVideoMeetings);
            }
            vmVideoMeetings.meetings.push(new vmVideoMeeting(videoMeetings[vidConfGU]));
        }
    }

    function vmVideoMeetingWidget() {
        this.meetings = ko.observableArray([]);
    }

    function vmVideoMeeting(meeting) {

        $.extend(this, meeting);

        this.dismissed = ko.observable(false);
        this.loading = ko.observable(true);
        this.JoinText = this.IAmTheHost ? 'Start Meeting' : 'Join Meeting';

        var inst = this;
        setTimeout(function () {
            inst.loading(false);
        }, 100);
    }

    vmVideoMeeting.prototype = {
        dismiss: function () {
            this.dismissed(true);
        },

        dismissFor: function (minutes) {
            this.dismissed(true);

            var vidConfGU = this.VidConfGU;
            setTimeout(function () {
                delete videoMeetings[vidConfGU];
            }, (minutes - 1) * 60000);
        },

        dismissUntil: function (minutes) {
            VideoConferenceAPI.CallPromise('HoldMeetingNotification', { vidConfGU: this.VidConfGU, minutes: minutes });
            vmVideoMeetings.meetings.remove(this);
        },

        join: function () {
            VideoConferenceAPI.JoinStartMeeting({ vidConfGU: this.VidConfGU });

            this.dismissed(true);
            vmVideoMeetings.meetings().forEach(function (meeting) {
                if (!meeting.dismissed()) {
                    meeting.dismissUntil(1)
                }
            });
        }
    };
})(jQuery);

document.addEventListener('click', VideoConferenceAPI.Document_Click);

try {
    if (!window.applicationRoot && window.parent && window.parent.window) applicationRoot = parent.window.applicationRoot;
    if (!window.applicationRoot && window.opener) applicationRoot = window.opener.applicationRoot;
} catch {
    if (!window.applicationRoot) applicationRoot = window.top;
}
/*
 Common features for use across multiple systems.
 Everything in here must be properly commented.
 */

/*
 * Utility Functions
 * ~~~~~~~~~~~~~~~~~
 * These functions are not modifications to any existing DOM area, and exist in their own Common object model.
 */

var ep_Common = {};

/**
 * Get the HTML for displaying date and time. Shows Icons for date and time.
 *
 * @param {string} stringDate the .Net string date value.
 */
ep_Common.FormatDateTime = function (stringDate) {
    let date = new Date(stringDate);
    return '<span class="Date fa fa-calendar"></span> <span>' + date.toLocaleDateString() + '</span><br><span class="Time fa fa-clock"></span> <span>' + date.toLocaleTimeString() + '</span>';
}

ep_Common.CacheString = function () {
    var now = new Date();
    var time = now.getTime();
    time -= now.getMilliseconds();
    time -= 1000 * now.getSeconds();
    time -= 1000 * 60 * now.getMinutes();
    return 'cache=' + time;
}

/**
 * Get the HTML for displaying a user name/email card. Uses Synergy Mail display.
 *
 * @param {string} userType The type of person
 * @param {string} name The name of the person
 * @param {string} detail Any detail of the detail row under the name.
 */
ep_Common.FormatUserDetailCard = function (userType, name, detail) {
    var contactBox = document.ep_create('<div class="contact-box contact-box-primary"></div>');
    var nameDisplay = document.ep_create('<span class="NameDisplay flexmiddle"></span>');
    var icon = 'images/ST_GENESIS/Staff_s.gif';
    if (userType === 'parent') icon = 'images/ST_GENESIS/Parent_s.gif';
    else if (userType === 'student') icon = 'images/ST_GENESIS/Student_s.gif';
    else if (userType === 'section') icon = 'images/ST_GENESIS/Section_s.gif';
    else if (userType === 'group') icon = 'images/ST_GENESIS/StudentGroups_s.gif';
    var img = document.ep_create('<img class="flexmin" src="' + icon + '" style="padding-right: 5px;"/>');
    var details = document.ep_create('<span><b>' + name + '</b><br><span class="contact-box-details2">' + detail + '</span></span>');
    contactBox.appendChild(nameDisplay);
    nameDisplay.appendChild(img);
    nameDisplay.appendChild(details);
    return contactBox.outerHTML;
}

/**
 * Get the HTML for displaying an attachment.
 *
 * @param {string} name the .Net string date value.
 */
ep_Common.FormatSynergyMailAttachmentCard = function (name, gu) {
    var div = document.ep_create('<div></div>');
    var label = document.ep_create('<span class="pointer label-primary label attachment attachment-label" onclick="ep_Common.DownloadSynergyMailAttachment(\'' + gu + '\');"></span>');
    var labelText = document.ep_create('<span><span class="fa fa-paperclip"></span> <span class="fileName">' + name + '</span></span>');
    div.appendChild(label);
    label.appendChild(labelText);
    return div.outerHTML;
}

/**
 * Download a synergy mail attachment.
 *
 * @param {string} gu The GU to open.
 */
ep_Common.DownloadSynergyMailAttachment = function (gu) {
    if (!gu) return;

    var synergyMailDownloader = document.querySelector('form.SynergyMailDownloader');
    if (!synergyMailDownloader) {
        var body = document.body;
        if (!body) return;
        synergyMailDownloader = document.ep_create('<form action="FileDownload.aspx" class="SynergyMailDownloader fakeHidden" target="_blank" method="GET"><input type="hidden" name="fdID" /><input type="hidden" name="dbID" value="3" /></form>');
        body.appendChild(synergyMailDownloader);
    }

    var fdID = synergyMailDownloader.querySelector('input[name="fdID"]');
    if (!fdID) return;

    fdID.value = gu;

    synergyMailDownloader.submit();
}

/**
 * Global "event" when a datasource is bound. Looks for any bindings to apply.
 *
 * @param {object} element Any element within a plugin. Normally likely it is the plugin element itself, but no assumptions.
 */
ep_Common.Bound = function (element, context, subcontext) {

    if (context) {
        if (context.Me) element = context.Me;
    }
    else {
        if (!element) return;
        element = element.ep_closest('[data-plugin]');
        if (!element || !element.ep_Plugin) return;
        context = element.ep_Plugin;
    }

    var blocks = element.querySelectorAll('[bindblock] [bindname], [bindblock] [name]');
    blocks.ep_addClass('bindblock');

    var bindings = element.querySelectorAll('[bindname]:not(.bindblock), [name]:not(.bindblock)');
    for (var i = 0; i < bindings.length; ++i) {
        var binding = bindings[i];

        if (binding.hasAttribute('events')) {
            var events = binding.getAttribute('events').split(',');

            for (var j = 0; j < events.length; ++j) {
                var event = events[j].trim();
                var value = 'ep_event(event)';
                if (event === 'bind') value = '';

                binding.setAttribute('on' + event, value);
            }

            binding.removeAttribute('events')
        }

        if (binding.hasAttribute('onclick')) {
            if (!binding.getAttribute('onclick')) binding.setAttribute('onclick', 'ep_event(event)');
        }

        if (binding.hasAttribute('onbind') || binding.hasAttribute('data-bound')) {
            var name = binding.getAttribute('name');
            if (!name) name = binding.getAttribute('bindname');
            if (!name || !context[name + '_bound']) continue;
            context[name + '_bound'](binding, subcontext);
        }
    }

    blocks.ep_removeClass('bindblock');
}

/**
 * Get the current URL queryString as a lookup object.
 * 
 * @param {string} q Optional. If not provided, will use the current window.location.
 */
ep_Common.GetQueryString =
    function (q) {
        if (!q) q = location;
        if (q == location) q = location.search;
        q = q.replace('?', '');

        return (function (a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(q.split("&"));
    };

/**
 * Make a call through the GB ClientSideDataAPI
 * 
 * @param {string} friendlyName The API endpoint
 * @param {string} call The API endpoint
 * @param {object} post The data being posted
 */
ep_Common.CallPromise =
    function (friendlyName, call, post, context) {
        return new Promise(function (resolve, reject) {

            if (!window.applicationRoot) {
                reject({ success: false, content: {}, message: null });
                return;
            }

            var domain = 'ClientSideData/Transfer?' + friendlyName + '-' + call;
            domain = window.applicationRoot + 'api/GB/' + domain;

            var postData = {
                FriendlyName: friendlyName,
                Method: call,
                Parameters: JSON.stringify(post)
            };

            var webPortal = ep_Common.GetQueryString().requestAppToken || window.CURRENT_WEB_PORTAL;

            var xhr = new XMLHttpRequest();
            xhr.open('POST', domain);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('CURRENT_WEB_PORTAL', webPortal);
            xhr.ep_states = [];

            xhr.onreadystatechange = function () {
                // What's in this?
                // Are there arguments?
                // What are the different states?
                this.ep_states.push({ ticks: new Date().getTime(), state: this.readyState, status: this.status });
            };

            xhr.onload = function (event) {
                if (this.status === 200) {
                    var response = null;

                    try {
                        response = JSON.parse(this.responseText);
                    }
                    catch (ex) {
                        response = this.responseText;
                    }

                    resolve(response);
                }
                else {
                    var response = JSON.parse(this.responseText);

                    if (!response) {
                        response = 'Network Error (' + this.status + ')';
                    }

                    resolve({ success: false, content: {}, message: response }, context);
                }
            }

            xhr.onerror = function () {
                resolve({ success: false, content: {}, message: 'Network Error' }, context);
            };

            xhr.send(JSON.stringify(postData));
        });
    };

ep_Common.PostPromise =
    function (url, post, context) {
        return new Promise(function (resolve, reject) {

            if (!window.applicationRoot) {
                reject({ success: false, content: {}, message: null });
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open('POST', location.origin + applicationRoot + url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('CURRENT_WEB_PORTAL', window.CURRENT_WEB_PORTAL);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var response = null;

                    try {
                        response = JSON.parse(xhr.responseText);
                    }
                    catch (ex) {
                        response = xhr.responseText;
                    }

                    if (response.d) {
                        response = response.d;
                    }

                    resolve(response, context);
                }
                else {
                    var response = JSON.parse(xhr.responseText);
                    if (!response) response = 'Network Error (' + xhr.status + ')';
                    resolve({ success: false, content: {}, message: response }, context);
                }
            }
            xhr.onerror = function () {
                resolve({ success: false, content: {}, message: 'Network Error' }, context);
            };
            xhr.send(JSON.stringify(post));
        });
    };

ep_Common.AjaxPromise =
    function (url, headers) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            for (var prop in headers) {
                xhr.setRequestHeader(prop, headers[prop]);
            }

            xhr.onload = function () {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (typeof response.success === 'undefined') response = { success: true, message: null, content: response }
                    resolve(response);
                }
                else reject({ success: false, content: {}, message: 'Network Error (' + xhr.status + ')' });
            }
            xhr.onerror = function () {
                reject({ success: false, content: {}, message: 'Network Error' });
            };
            xhr.send();
        });
    };

ep_Common.DecodeAlphaNumericToInt = function (value, encodingLength) {
    var res = 0;
    var encoding = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (var i = 0; i < value.length; ++i) {
        res *= encodingLength;
        res += encoding.indexOf(value[i]);
    }

    return res;
}

ep_Common.AnalyzeForPattern = function (value, patternSize) {
    var res = [];
    var resGrouped = {};

    for (var i = 0; i < value.length - patternSize; ++i) {
        var pattern = value.substr(i, patternSize);

        if (resGrouped[pattern]) {
            continue;
        }

        var patternIndex = value.indexOf(pattern);
        var patternCount = 0;

        while (patternIndex > -1) {
            patternCount++;
            patternIndex = value.indexOf(pattern, patternIndex + 1);
        }

        resGrouped[pattern] = patternCount;

    }

    for (var prop in resGrouped) {
        res.push({ pattern: prop, count: resGrouped[prop] });
    }

    res.sort(
        function (a, b) {
            return b.count - a.count;
        }
    );

    return res;
}

/**
 * Takes a dehydrated object from a server API call and rehydrates it.
 * 
 * @param {any} dehydratedObject
 */
ep_Common.Rehydrate = function (dehydratedObject) {

    if (!dehydratedObject || !dehydratedObject.Names || !dehydratedObject.Chunks) {
        return dehydratedObject;
    }

    var rtn = [];
    var names = dehydratedObject.Names;
    var rules = ep_Common.Rehydrate(dehydratedObject.ReplaceRules);

    if (rules) {
        rules.reverse();
    }

    for (var k = 0; k < dehydratedObject.Chunks.length; ++k) {
        var chunk = dehydratedObject.Chunks[k];
        var id_offset = dehydratedObject.ID_Offsets[k];

        if (rules) {
            for (var ruleI = 0; ruleI < rules.length; ++ruleI) {
                var rule = rules[ruleI];
                chunk = chunk.split(rule.ReplaceWith).join(rule.Target);
            }
        }

        if (dehydratedObject.UseBar) {
            chunk = chunk.replace(/-/g, '],[');
        }

        if (id_offset && dehydratedObject.UseBar) {
            // Find all [ after the first, scan to the id_index element, add ticks, skip the first

            var openI = chunk.indexOf('[', 1);

            while (openI > -1) {
                // get the nth comma position
                var commaI = chunk.indexOf(',', openI);

                if (dehydratedObject.ID_Index === 0) {
                    commaI = openI;
                }

                for (var idI = 1; idI < dehydratedObject.ID_Index; ++idI) {
                    commaI = chunk.indexOf(',', commaI + 1);
                }

                // Replace this comma with a ,'
                chunk = chunk.substring(0, commaI + 1) + "\"" + chunk.substr(commaI + 1);

                // Find the next comma and end bracket
                var nextCommaI = chunk.indexOf(',', commaI + 1);
                var endBracketI = chunk.indexOf(']', commaI + 1);

                // If the end bracket comes first, use that
                if (endBracketI < nextCommaI || nextCommaI === -1) {
                    chunk = chunk.substring(0, endBracketI) + "\"" + chunk.substr(endBracketI);
                }
                else {
                    chunk = chunk.substring(0, nextCommaI) + "\"" + chunk.substr(nextCommaI);
                }

                openI = chunk.indexOf('[', openI + 1);
            }

        }

        var values = ep_Common.DeserializeJSON(chunk);

        for (var i = 0; i < values.length; ++i) {
            var rowValues = values[i];
            var row = {};

            for (var j = 0; j < rowValues.length; ++j) {
                var name = names[j];

                if (name === 'ID' && id_offset) {

                    if (dehydratedObject.UseBar) {
                        row[name] = ep_Common.DecodeAlphaNumericToInt(rowValues[j], dehydratedObject.EncodingLength) + id_offset;
                    }
                    else {
                        row[name] = rowValues[j] + id_offset;
                    }

                    var thing = true;

                }
                else {
                    row[name] = rowValues[j];
                }

            }

            rtn.push(row);
        }

        var thing2 = true;
    }

    return rtn;
}

ep_Common.DeserializeJSON = function (stringValue, returnOnError) {

    if (!stringValue) {
        return returnOnError;
    }

    if (typeof stringValue !== 'string') {
        return stringValue;
    }

    try {
        return JSON.parse(stringValue);
    }
    catch (e) {
        return returnOnError;
    }
}


/**
* Hide the html overflow when a popup is in play.
*
*/
ep_Common.UpdateForDXPopup = function (e) {
    var elements = document.querySelectorAll('.ep_OpenPopup:not(.dx-state-invisible), .epPopup');
    var html = document.querySelector('html');

    if (elements.length > 0) {
        html.style.overflow = 'hidden';
        document.querySelector('body').style.height = '100vh';
    }
    else {
        document.querySelector('body').style.height = '';
        html.style.overflow = '';
    }

    document.querySelectorAll('.ep_OpenPopup.dx-state-invisible').ep_remove();
}

/**
 * Opens a dxPopup with a scrollable area.
 * 
 * @param {object} options A limited set of options that would typically be available for a dxPopup.
 */
ep_Common.OpenPopup =
    function (options) {
        if (!options) options = {};

        if (!options.container) {
            options.container = 'body';
        }

        if (typeof options.showTitle === 'undefined') {
            options.showTitle = true;
        }

        if (typeof options.scrolls === 'undefined') {
            options.scrolls = true;
        }

        var container = document.querySelector(options.container);

        if (options.popupStyle === 'ep') {
            var html = '<div class="epPopup ' + options.popupClass + '"><i class="fa fa-times close-popup" title="close popup"></i><div class="popup-content"></div></div>';

            if (options.showTitle) {
                html = '<div class="epPopup ' + options.popupClass + '"><div class="popup-header"><b>' + options.title + '</b></div><i class="fa fa-times close-popup" title="close popup"></i><div class="popup-content"></div></div>';
            }

            var popupDiv = document.ep_create(html);

            if (options.fullScreen) {
                popupDiv.classList.add('full-screen');
            }

            let width = options.width;

            if (typeof width === 'function') {
                width = width();
            }

            if (width) {
                popupDiv.style.width = `${width}px`;
            }

            if (options.height) {
                popupDiv.style.height = `${options.height}px`;
            }

            if (options.position === 'center') {
                let rect = container.getBoundingClientRect();

                if (options.height) {
                    popupDiv.style.top = `${rect.height / 2 - options.height / 2}px`;
                }

                if (width) {
                    popupDiv.style.left = `${rect.width / 2 - width / 2}px`;
                }

            }

            container.appendChild(popupDiv);

            if (options.dragEnabled) {
                $(popupDiv).draggable({
                    handle: '.popup-header',
                    containment: 'window'
                });
            }

            if (options.resizeEnabled) {
                $(popupDiv).resizable();
            }

            ep_Common.UpdateForDXPopup();

            if (options.scrollableContent) {
                options.scrollableContent(popupDiv.querySelector('.popup-content'), popupDiv);
            }

            var closePopup = popupDiv.querySelector('.close-popup');
            closePopup.ep_element = popupDiv.querySelector('.popup-content');
            closePopup.addEventListener('click',
                function (event) {

                    if (options.originalOptions && options.originalOptions.plugin && options.originalOptions.plugin.OnHidden) {
                        options.originalOptions.plugin.OnHidden();
                    }

                    if (options.onHidden) {
                        options.onHidden(this.ep_element, options);
                    }

                    this.parentElement.parentElement.removeChild(this.parentElement);
                    ep_Common.UpdateForDXPopup();
                }
            );

            return;
        }

        document.querySelectorAll('.ep_OpenPopup.dx-state-invisible').ep_remove();
        var popup = document.ep_create('<div class="ep_OpenPopup ' + options.popupClass + '"></div>');

        if (!container) {
            alert('Could not open popup. Container not found.');
            return;
        }

        if (options.popupClass) {
            var classes = options.popupClass.split(' ');

            for (var i = 0; i < classes.length; ++i) {
                popup.classList.add(classes[i]);
            }

        }

        var popupOptions = {
            container: options.container,
            width: options.width,
            visible: true,
            animation: options.animation || null,
            fullScreen: !!options.fullScreen,
            dragEnabled: !!options.dragEnabled,
            resizeEnabled: !!options.resizeEnabled,
            onInitialized: function (e) {
                e.component.registerKeyHandler("escape", function (arg) {
                    arg.stopPropagation();
                })
                e.component.registerKeyHandler("Escape", function (arg) {
                    arg.stopPropagation();
                })
                e.component.registerKeyHandler("Esc", function (arg) {
                    arg.stopPropagation();
                })
            },
            closeOnOutsideClick: function () {
                if (options.closeOnOutsideClick)
                    return event.target.classList.contains('dx-popup-wrapper');

                return false;
            },
            title: options.title,
            onShown: function () {
                ep_Common.UpdateForDXPopup();

                if (options.scrollFix) {
                    var html = document.querySelector('html');

                    if (!html.ep_ScrollTop) {
                        html.ep_ScrollTop = html.scrollTop;
                    }

                    html.scrollTop = 0;
                }

                let wrapper = this.ep_Element.closest(`.dx-popup-wrapper`);

                if (options.popupClass && wrapper) {
                    var classes = options.popupClass.split(' ');

                    for (var i = 0; i < classes.length; ++i) {
                        wrapper.classList.add(classes[i]);
                    }

                }

                if (options.onShown) {
                    options.onShown(this.ep_Element, options);
                }

            },
            onHidden: function (e) {
                ep_Common.UpdateForDXPopup();

                if (options.onHidden) {
                    options.onHidden(this.ep_Element, options, e);
                }

            },
            onHiding: function (e) {

                if (options.scrollFix) {
                    var html = document.querySelector('html');
                    html.scrollTop = html.ep_ScrollTop;
                    delete html.ep_ScrollTop;
                }

                if (options.onHiding) {
                    options.onHiding(this.ep_Element, options, e);
                }

            },
            onResizeStart: function () {
                var test = true;
            },
            onResize: function (args) {
                var element = args.element[0];

                if (args.actionValue) {
                    var width = args.actionValue[0].width;

                    element.classList.remove('mobile-res');
                    element.classList.remove('portrait-res');

                    if (width < 600) {
                        element.classList.add('mobile-res');
                    }
                    else if (width < 1000) {
                        element.classList.add('portrait-res');
                    }

                }

            },
            contentTemplate: function (element) {
                var scroller = document.createElement('div');
                scroller.style.height = '100%';
                var elm = document.createElement('div');
                scroller.appendChild(elm);
                this.ep_Element = elm;

                if (options.scrolls) {
                    scroller.classList.add('Scroller');
                    scroller.style.overflow = 'auto';
                    scroller.addEventListener('wheel', function (event) { event.stopPropagation(); });
                }

                if (options.scrollableContent) {
                    options.scrollableContent(elm, element[0], options);
                }

                return scroller;
            },
        }

        if (options.size === 'small') {
            popupOptions.width = 500;
        }

        if (options.width) {
            popupOptions.width = options.width;
        }

        if (options.height) {
            popupOptions.height = options.height;
        }

        if (options.maxHeight) {
            popupOptions.maxHeight = options.maxHeight;
        }

        container.appendChild(popup);
        $(popup).dxPopup(popupOptions);
        popup.ep_PopupInstance = $(popup).dxPopup('instance');
    };

/**
 * Close a dxPopup for an element.
 * 
 * @param {element} element An element within a popup.
 */
ep_Common.ClosePopup =
    function (element) {
        var popup = element.ep_closest('.ep_OpenPopup.dx-popup');
        if (popup && popup.ep_PopupInstance) popup.ep_PopupInstance.hide();
    };

ep_Common.StandardDeviation = function (pointArray) {
    return Math.sqrt(ep_Common.Variance(pointArray));
}

ep_Common.Variance = function (pointArray) {
    if (pointArray.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < pointArray.length; ++i) {
        sum += pointArray[i];
    }

    var mean = sum / pointArray.length;

    var squares = [];
    for (var i = 0; i < pointArray.length; ++i) {
        squares.push(Math.pow(pointArray[i] - mean, 2));
    }

    sum = 0

    for (var i = 0; i < squares.length; ++i) {
        sum += squares[i];
    }

    return sum / squares.length;
}

ep_Common.Average = function (pointArray) {
    let total = 0;

    for (let i = 0; i < pointArray.length; ++i) {
        total += pointArray[i];
    }

    return total / pointArray.length;
}

ep_Common.Normalize = function (points, average, standardDeviation) {
    let eExponent = -0.5 * Math.pow((points - average) / standardDeviation, 2);
    return 1 / (standardDeviation * Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, eExponent);
}

/*
 DOM-wide functions
 ~~~~~~~~~~~~~~~~~~
 These functions enhance objects within the default DOM, and are not tied to any specific plugin or component.
 As you find functions which are copied and pasted far too often, reduce complexity and include here.
 Ideally, these are simple utility.
 */

/**
 * Parse some JSON, with protections.
 * 
 * @param {string} stringValue The JSON string to parse
 * @param {object} returnOnError If there is an error, return this.
 */
window.ep_JSONparse = function (stringValue, returnOnError) {
    if (!stringValue) return returnOnError;
    if (typeof stringValue !== 'string') return stringValue;

    try {
        return JSON.parse(stringValue);
    }
    catch (e) {
        return returnOnError;
    }
}

/**
 * Adds the ability to remove a class from all nodes in a HTMLCollection from the DOM.
 *
 */
window.HTMLCollection.prototype.ep_removeClass =
    function (value) {
        for (var i = 0; i < this.length; ++i) {
            this[i].classList.remove(value);
        }

        return this;
    }

/**
 * Adds the ability to remove all nodes in a NodeList from the DOM.
 *
 */
window.NodeList.prototype.ep_remove =
    function () {
        for (var i = 0; i < this.length; ++i) {
            this[i].parentNode.removeChild(this[i]);
            this[i].ep_removed = true;
        }

        return this;
    }

/**
 * Adds the ability to remove a node from the DOM.
 *
 */
window.Node.prototype.ep_remove =
    function () {
        this.parentNode.removeChild(this[i]);
        this.ep_removed = true;
        return this;
    }

/**
 * Find the closest parent element matching the selector.
 * 
 * @param {string} selector The DOM query to use.
 */
window.Node.prototype.ep_closest =
    function (selector) {
        var parent = this;
        while (parent) {
            if (parent.matches)
                if (parent.matches(selector)) return parent;
                else
                    if ($(parent).is(selector)) return parent;

            parent = parent.parentNode;
        }
    }

/**
 * Adds the ability to add a class from all nodes in a NodeList.
 * The params for this function can result in different executions.
 * The params can be: (NodeList, value, value...)
 * Or: (value, value...) This case will use current NodeList (this).
 *
 */
window.NodeList.prototype.ep_addClass =
    function () {
        if (arguments.length === 0) return;

        var nodeList = this;
        var startIndex = 0;
        if (typeof arguments[0].entries !== 'undefined') {
            nodeList = arguments[0];
            startIndex = 1;
        }

        for (var i = 0; i < nodeList.length; ++i) {
            for (var j = startIndex; j < arguments.length; ++j) {
                nodeList[i].classList.add(arguments[j]);
            }
        }

        return this;
    }

/**
 * Adds the ability to remove a class from all nodes in a NodeList.
 * The params for this function can result in different executions.
 * The params can be: (NodeList, value, value...)
 * Or: (value, value...) This case will use current NodeList (this).
 *
 */
window.NodeList.prototype.ep_removeClass =
    function () {
        if (arguments.length === 0) return;

        var nodeList = this;
        var startIndex = 0;
        if (typeof arguments[0].entries !== 'undefined') {
            nodeList = arguments[0];
            startIndex = 1;
        }

        for (var i = 0; i < nodeList.length; ++i) {
            for (var j = startIndex; j < arguments.length; ++j) {
                nodeList[i].classList.remove(arguments[j]);
            }
        }

        return this;
    }

/**
 * Adds the ability to set an attribute for all nodes in a NodeList.
 * The params for this function can result in different executions.
 * The params can be: (NodeList, attributeName, value)
 * Or: (attributeName, value) This case will use current NodeList (this).
 *
 */
window.NodeList.prototype.ep_setAttribute =
    function () {
        var nodeList = this;
        var name = arguments[0];
        var value = arguments[1];
        if (arguments.length === 3) {
            nodeList = arguments[0];
            name = arguments[1];
            value = arguments[2];
        }

        for (var i = 0; i < nodeList.length; ++i) {
            nodeList[i].setAttribute(name, value);
        }

        return this;
    }

/**
* Loads a list of resources
*
* @param {string} arguments You can pass any number of string arguments.
*/
window.LoadResources = function () {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 0, '');
    LoadResourcesFrom.apply(window, args);
}

window.LoadResourcesInOrder = function () {
    var urls = Array.prototype.slice.call(arguments);

    var load = function (urls) {
        var url = urls.shift();

        if (typeof url === 'function') { // URL is a callback function. This ends the load.
            url();
        }
        else if (url) {
            LoadResourceInOrder(url,
                function () {
                    load(urls);
                }
            );
        }

    }

    load(urls);
}

window.LoadResourceInOrder = function (url, cb) {

    if (url.indexOf('.css') > -1) {
        LoadCSS(url, cb);
    }

    if (url.indexOf('.js') > -1) {
        LoadScript(url, cb);
    }

    if (url.indexOf('.html') > -1) {
        LoadHTML(url, cb);
    }

}

/**
* Loads RequireJS with the data-main setting.
*
* @param {string} url The url for the script.
* @param {string} url The url for the main execute for RequireJS.
*/
window.LoadRequireJS = function (url, main) {
    var elements = document.querySelectorAll('script[src*="' + url + '"]');

    if (elements.length === 0) {
        var queryChar = '?';
        if (url.indexOf('?') > -1) queryChar = '&';
        url += queryChar + 'cache=' + (new Date()).getHours();
        main += queryChar + 'cache=' + (new Date()).getHours();

        var script = document.createElement('script');
        if (url.indexOf(applicationRoot) === -1) {
            url = applicationRoot + url;
        }
        script.src = url;
        script.setAttribute('data-main', main);
        document.head.appendChild(script);
    }
}

/**
* Loads a list of resources
*
* @param {string} from This is the path from which you want to load. Really just a shortcut to LoadResources
* @param {string} arguments You can pass any number of string arguments.
*/
window.LoadResourcesFrom = function (from) {
    if (arguments.length === 1) {
        if (from.indexOf('.css') > -1) LoadCSS(from);
        if (from.indexOf('.js') > -1) LoadScript(from);
        if (from.indexOf('.html') > -1) LoadHTML(from);
        return;
    }

    for (var i = 1; i < arguments.length; ++i) {
        var argument = arguments[i];
        if (argument.indexOf('.css') > -1) LoadCSS(from + argument);
        if (argument.indexOf('.js') > -1) LoadScript(from + argument);
        if (argument.indexOf('.html') > -1) LoadHTML(from + argument);
    }
}

/**
* Loads a JS resource
*
* @param {string} url The URL of the resource. Can include the application root, but doesn't need to.
*/
window.LoadScript = function (url, onload) {
    var elements = document.querySelectorAll('script[src*="' + url + '"]');

    if (elements.length === 0) {
        var queryChar = '?';
        if (url.indexOf('?') > -1) queryChar = '&';
        url += queryChar + ep_Common.CacheString();

        var script = document.createElement('script');

        if (url.indexOf('http') === -1) {

            if (applicationRoot) {
                url = location.origin + applicationRoot + url;
            }
            else {
                url = location.origin + '/' + url;
            }

        }

        script.src = url;

        if (onload) {
            script.ep_onloadqueue = [onload];
            script.onload = function () {

                for (var i = 0; i < this.ep_onloadqueue.length; ++i) {
                    this.ep_onloadqueue[i]();
                }

                delete this.ep_onloadqueue;
            };
        }

        document.head.appendChild(script);
    }
    else {

        if (onload) {
            var script = elements[0];

            if (script.ep_onloadqueue) {
                script.ep_onloadqueue.push(onload);
            }
            else {
                onload();
            }

        }

    }
}

/**
* Loads a HTML resource as a template
 * This does not actually work, yet.
*
* @param {string} url The URL of the resource. Can include the application root, but doesn't need to.
*/
window.LoadHTML = function (url, onload) {
    var elements = document.querySelectorAll('script[src*="' + url + '"]');

    if (elements.length === 0) {
        var queryChar = '?';

        if (url.indexOf('?') > -1) {
            queryChar = '&';
        }

        url += queryChar + ep_Common.CacheString();

        var script = document.createElement('script');

        if (url.indexOf('http') === -1) {
            if (applicationRoot) {
                url = location.origin + applicationRoot + url;
            }
            else {
                url = location.origin + '/' + url;
            }
        }

        script.onload = onload;
        script.src = url;
        script.setAttribute('type', 'text/template');
        document.head.appendChild(script);
    }
    else {

        if (onload) {
            onload();
        }

    }
}

/**
* Loads a CSS resource
*
* @param {string} url The URL of the resource. Can include the application root, but doesn't need to.
*/
window.LoadCSS = function (url, onload) {
    var elements = document.querySelectorAll('link[href*="' + url + '"]');

    if (elements.length === 0) {
        var queryChar = '?';
        if (url.indexOf('?') > -1) queryChar = '&';
        url += queryChar + ep_Common.CacheString();

        if (url.indexOf('http') === -1) {
            if (applicationRoot) {
                url = location.origin + applicationRoot + url;
            }
            else {
                url = location.origin + '/' + url;
            }
        }

        if (document.createStyleSheet) {
            document.createStyleSheet(url);
        }
        else {
            var link = document.createElement('link');

            if (onload) {
                link.ep_onloadqueue = [onload];
                link.onload = function () {

                    for (var i = 0; i < this.ep_onloadqueue.length; ++i) {
                        this.ep_onloadqueue[i]();
                    }

                    delete this.ep_onloadqueue;
                };
            }

            link.setAttribute('type', 'text/css');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', url);
            var head = document.querySelector('head');
            if (head) head.appendChild(link);
        }
    }
    else {

        if (onload) {
            var link = elements[0];

            if (link.ep_onloadqueue) {
                link.ep_onloadqueue.push(onload);
            }
            else {
                onload();
            }

        }

    }
}

/**
* Execute a function when/if the document is loaded.
*
* @param {function} fn The function to call.
*/
window.DocumentReady = function (fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    }
    else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

/**
 * Load a plugin on demand and initialize it to an element.
 *
 * @param {element} element Where to load it
 * @param {string} name The name of the plugin
 * @param {object} options Parameters to pass to the plugin
 * 
 */
window.LoadPlugin = function (element, name, options) {

    if (arguments.length === 1 && typeof element.length !== 'undefined') {
        name = element;
        element = document.createElement('div');
        document.body.appendChild(element);
    }

    if (!element) {
        element = document.createElement('div');

        if (window.aspnetForm) {
            window.aspnetForm.appendChild(element);
        }
        else {
            document.body.appendChild(element);
        }

    }

    if (!options) {
        options = {};
    }

    if (!options.path) {
        options.path = 'GBResources';
    }

    if (!window[name]) {
        window.LoadResourcesInOrder('resources/' + options.path + '/' + name + '.js',
            function () {

                if (window[name + '_Override']) {
                    window[name + '_Override']();
                }

                if (window[name]) {
                    element.ep_plugin = new window[name](element, options);
                }
                else {
                    // Last ditch effort
                    setTimeout(
                        function (name, element, options) {
                            if (window[name]) {
                                element.ep_plugin = new window[name](element, options);
                            }
                        }, 1000, name, element, options
                    );
                }

            }
        );
        return;
    }

    if (window[name + '_Override']) {
        window[name + '_Override']();
    }

    element.ep_plugin = new window[name](element, options);
    return element.ep_plugin;
};

/**
 * Load a plugin and return when it is loaded.
 *
 * @param {string} name The name of the plugin
 * @param {function} callback Parameters to pass to the plugin
 */
window.LoadPlugin_Callback = function (name, callback) {
    if (window[name]) {
        if (callback) callback();
        return;
    }

    window.LoadResources('resources/GBResources/' + name + '.js');
    var intervalObj = {};
    intervalObj.interval = setInterval(
        function (name, window, intervalObj) {
            if (window[name]) {
                clearInterval(intervalObj.interval);
                if (callback) callback();
            }
        }, 200, name, window, intervalObj
    );
};

/**
 * Load all plugins in the DOM. Right now, matching the "autonew" class.
 *
 */
window.LoadPlugins = function () {
    var plugins = document.querySelectorAll('[data-plugin].autonew');
    for (var i = 0; i < plugins.length; ++i) {
        var plugin = plugins[i];
        var name = plugin.getAttribute('data-plugin');
        eval('var options = ' + plugin.getAttribute('data-options'));
        this.LoadPlugin(plugin, name, options);
    }
}

/**
 * A fast way to connect a child to a parent class through prototypical inheritance.
 *
 * @param {object} source The child
 * @param {object} target The parent
 */
window.ep_Inherit = function (source, target) {
    source.prototype = Object.create(target.prototype);
    Object.defineProperty(source.prototype, 'constructor', {
        value: source,
        enumerable: false, // so that it does not appear in 'for in' loop
        writable: true
    });
};

/**
 * Experimental. Load a component anywhere.
 *
 * @param {element} element The element 
 * @param {string} name The parent
 * @param {string} paramsString The parent
 */
window.LoadComponent = function (element, name, paramsString) {
    if (!window.COMPONENT_LOADER) {
        LoadRequireJS('txpapp/scripts.require.js', 'txpapp/scripts.require.config.js');
        setTimeout(
            function (obj, func, args) {
                func.apply(obj, args);
            }, 200, this, window.LoadPlugin, arguments
        );
        return;
    }

    element.innerHTML = '<div data-bind="stopBinding: true"><div class="component-loader-container" data-bind="attr: { \'data-bound\': \'true\' }"><' + name + ' params="' + paramsString + '"></' + name + '><!-- ko if: componentInjector --><div id="component-injector-container" data-bind="foreach: componentInjector"><!-- ko component: $data --><!-- /ko --></div><!-- /ko --></div></div>';

    //the second loader should not display the component-injector because that will double up injected components. remove it from the DOM before binding so there are no subscriptions.
    if ($(".component-loader-container").length > 1) {
        $(".component-loader-container").last().find("#component-injector-container").remove();
    }
    //we are loading a second component loader on the page. the only thing we need to do is apply bindings to the new area.
    ko.applyBindings(document.rootViewModel, $(element).find(".component-loader-container[data-bound!='true']").get(0));
};

/**
 * A custom create function that creates from an html string.
 *
 * @param {string} html The full html to create
 * @param {string} parentTag The creation process defaults to using a DIV element. However, some elements are nto allowed in a DIV. For example, if you want to create a TD element, pass in TR as the parentTag.
 */
document.ep_create =
    function (html, parentTag) {
        if (!html) return html;
        if (!parentTag) parentTag = 'div';
        var div = document.createElement(parentTag);
        div.innerHTML = html.trim();
        return div.firstChild;
    }

/**
 * An event handler which escapes from jQuery and Knockout and can be used in native HTML tags.
 * Example: onclick="ep_event(event)".
 * This is used in conjuction with ep_Plugin, as it will find the closest plugin parent and execute an event handler within that plugin.
 *
 * @param {event} event Always pass in the native event.
 */
window.ep_event = function (event) {
    var run = function (plugin, event) {
        if (!plugin) return;
        var target = event.currentTarget;
        if (!target) target = event.target;
        if (!target) return;

        var key = 'None';
        var name;
        if (target.getAttribute) {
            name = target.getAttribute('name');
            if (!name) name = target.getAttribute('bindname');
        }

        if (!name) name = 'General';
        key = name + '_' + event.type;

        if (plugin && plugin[key]) plugin[key](event, plugin);
    }

    var parent = event.target.ep_closest('[data-plugin], .ep_Plugin');
    if (parent) {
        run(parent.ep_Plugin, event);
    }
    else {
        var plugins = event.target.querySelectorAll('[data-plugin], .ep_Plugin');
        for (var i = 0; i < plugins.length; ++i) {
            run(plugins[i].ep_Plugin, event);
        }
    }
};

/**
 * The common plugin object.
 *
 */
(function (window) {
    window.ep_Plugin = function (name, element, options) {
        if (!options) options = {};

        if (typeof options.api === 'undefined') options.api = true;
        if (typeof options.async === 'undefined') options.async = false;
        if (typeof options.css === 'undefined') options.css = true;
        if (typeof options.path === 'undefined') options.path = 'GBResources';
        if (!options.post) options.post = {};

        if (options.css) LoadResourcesFrom('resources/' + options.path + '/', name + '.css');

        element.ep_Plugin = this;
        element.classList.add('ep_Plugin');
        if (!element.getAttribute('data-plugin')) element.setAttribute('data-plugin', name);

        this.Me = element;
        this.AC = window.AssessmentCommon;
        this.GBApp = window.gbapp;
        this.Common = ep_Common;
        this.Name = name;
        this.options = options;
        this.Loading = ko.observable(true);
        this.ShowLoading = ko.observable(false);
        this.DataSource = ko.observable(options.dataSource);
        this.DS = this.DataSource;
        this.BindTemplates = {};

        let self = this;

        if (window.requirejs) {
            requirejs(['app'], function (app) {
                self.App = app;
            });
        }

        this.LoadingTimeout = setTimeout(
            function (plugin) {
                plugin.ShowLoading(true);
            }, 500, this
        );

        if (!ep_Plugin.Templates[name]) {
            ep_Plugin.Templates[name] = 'In Progress';

            $('<div>').load(location.origin + applicationRoot + 'resources/' + options.path + '/' + name + '.html?' + ep_Common.CacheString(),
                function (rsp) {
                    ep_Plugin.Templates[name] = `
<div data-bind="stopBinding: true">
    <div class="BindHere ${name}">
        <!-- ko if: Loading-->
        <!-- ko if: ShowLoading-->
        <!-- ko if: !options.newLoadingText -->
        <div class="text-center">
            <i class="fa fa-spinner" style="font-size: 60px;"></i>
            <!-- ko if: options.loadingText -->
            <br>
            <span data-bind="html: options.loadingText"></span>
            <!-- /ko -->
        </div>
        <!-- /ko -->
        <!-- ko if: options.newLoadingText -->
        <div style="display: flex; height: 100%;">
            <div style="flex: 1; align-self: center;">
                <div class="asmt-large-btn-text">
                    <i class="fa fa-spinner"></i>
                    <span data-bind="html: options.newLoadingText"></span>
                </div>
            </div>
        </div>
        <!-- /ko -->
        <!-- /ko -->
        <!-- /ko -->
        <!-- ko ifnot: Loading-->
        ${rsp}
        <!-- /ko -->
    </div>
</div>`;
                }
            );
        }

        this.Reset();
    }

    if (window.ko) {
        ko.bindingHandlers.bound = {
            update: function (element, valueAccessor, allBindings) {
                // First get the latest data that we're bound to
                var value = valueAccessor();

                // Next, whether or not the supplied model property is observable, get its current value
                var valueUnwrapped = ko.unwrap(value);

                // Now call the function
                if ($.isFunction(valueUnwrapped)) {
                    valueUnwrapped(element);
                }
            }
        };

        ko.bindingHandlers.editableText = {
            init: function (element, valueAccessor) {
                $(element).on('blur editableTextUpdate', function () {
                    var observable = valueAccessor();
                    if (observable() != $(this).html()) {
                        observable($(this).html());
                    }
                });
            },
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                if ($(element).html() != value) $(element).html(value);
            }
        };
    }

    var o = ep_Plugin;
    o.Templates = {};

    /**
     * Process multiple plugin data source requests at the same time to reduce ajax calls.
     * 
     * @param {object} plugin The originating plugin
     * @param {object} post The post data
     * @param {function} cb The callback when data is received for the plugin.
     */
    o.BatchReset = function (plugin, post, async, cb) {

        if (!plugin.options.batch) {
            plugin.API('DataSource', plugin.options.post, async).then(
                function (response) {
                    clearTimeout(plugin.LoadingTimeout);
                    cb(plugin, response);
                },
                function (response) {

                    if (!response.success) {
                        alert(response.message);
                    }

                }
            );
            return;
        }

        var key = ep_Plugin.BatchPost.length;
        ep_Plugin.BatchKeys[key] = { cb: cb, plugin: plugin };
        post.key = key;
        ep_Plugin.BatchPost.push(post);

        clearTimeout(ep_Plugin.BatchTimeout);
        ep_Plugin.BatchTimeout = setTimeout(
            function (plugin, pluginObj) {
                var post = { list: pluginObj.BatchPost };
                var currentBatch = pluginObj.BatchKeys;
                pluginObj.BatchPost = [];
                pluginObj.BatchKeys = {};

                ep_Common.CallPromise(plugin.Name, 'DataSource_Batch', post).then(
                    function (response) {

                        if (response.content) {
                            response = response.content;
                        }

                        for (var i = 0; i < response.length; ++i) {
                            var dataSource = response[i];
                            var keyObj = currentBatch[dataSource.Key];

                            if (keyObj) {
                                keyObj.cb(keyObj.plugin, dataSource);
                                delete currentBatch[dataSource.Key];
                            }

                        }

                        // Handle any unprocessed keys.
                        for (var key in currentBatch) {
                            var keyObj = currentBatch[key];
                            keyObj.plugin.ResetFailed();
                        }

                        clearTimeout(plugin.loadingTimeout);
                    },
                    function (response) {
                        alert(response.message);
                    }
                );
            }, 300, plugin, ep_Plugin
        );
    }
    o.BatchKeys = {};
    o.BatchPost = [];
    o.BatchTimeout;

    var p = ep_Plugin.prototype;

    p.before_NewDataSource = function () {

    }

    p.after_NewDataSource = function () {
    }

    p.API = function (endpoint, post, async) {

        if (async && this.App) {
            return this.App.call({ friendlyName: this.Name, method: endpoint, parameters: post, async });
        }
        else {
            return this.Common.CallPromise(this.Name, endpoint, post);
        }

    }

    // Not sure if this is in use. If it is, it would be broken.
    p.Call = function (name, endpoint, post) {
        return this.Common.CallPromise(name, this.Name, endpoint, post);
    }

    /**
     * During the batch reset process, this plugin did not get a server response.
     * 
     * */
    p.ResetFailed = function () {
        this.Reset();
    }

    p.GetTemplates = function () {
        // Manage templates
        var blocks = this.Me.querySelectorAll('[bindblock] [bindtemplate]');
        blocks.ep_addClass('bindblock');

        var bindings = this.Me.querySelectorAll('[bindtemplate]:not([bindblock])');
        for (var i = 0; i < bindings.length; ++i) {
            var binding = bindings[i];
            var name = binding.getAttribute('bindtemplate');
            if (this.BindTemplates[name]) continue;
            this.BindTemplates[name] = binding.outerHTML();
        }

        blocks.ep_removeClass('bindblock');
    }

    p.Bind = function () {
        this.Common.Bound(this.Me, this);
    }

    p.Reset = function (delayed) {

        if (ep_Plugin.Templates[this.Name] === 'In Progress') {
            setTimeout(function (plugin) { plugin.Reset(); }, 100, this);
            return;
        }

        if (!delayed) {
            this.Me.classList.add('fakeHidden');
            this.Me.innerHTML = ep_Plugin.Templates[this.Name];
            this.GetTemplates();
            ko.applyBindings(this, this.Me.querySelector('.BindHere'));
            this.Me.classList.remove('fakeHidden');
        }

        if (this.options.delayRender) {
            // Don't render if it can't be seen.
            if (!this.AC.CanSeeRightNow(this.Me, window)) {
                var interval = {};
                interval.value = setInterval(
                    function (plugin, interval, window) {
                        if (plugin.AC.CanSeeRightNow(plugin.Me, window)) {
                            clearInterval(interval.value);
                            plugin.Reset(true);
                        }
                    }, 500, this, interval, window
                );
                return;
            }
        }

        if (!this.options.api) {
            this.before_NewDataSource();
            this.Loading(false);
            this.Bind();
            this.ShowLoading(false);
            this.after_NewDataSource();
            return;
        }

        this.Loading(true);

        ep_Plugin.BatchReset(this, this.options.post, this.options.async,
            function (plugin, dataSource) {
                dataSource.success = dataSource.success || dataSource.Success;

                if (typeof dataSource.success !== 'undefined' && !dataSource.success) {

                    if (plugin.error_NewDataSource) {
                        plugin.error_NewDataSource(dataSource.message);
                        return;
                    }

                }

                if (dataSource.content) {
                    dataSource = dataSource.content;
                }

                if (dataSource.Content) {
                    dataSource = dataSource.Content;
                }

                plugin.ds = dataSource;
                let result = plugin.before_NewDataSource(dataSource);
                if (result) dataSource = result;
                plugin.DataSource(dataSource);
                plugin.Loading(false);
                plugin.Bind();
                plugin.ShowLoading(false);
                plugin.after_NewDataSource(dataSource);
                if (plugin.options.onLoad) plugin.options.onLoad(plugin);
            }
        );
    }

    document.addEventListener('click',
        function (event) {
            // Find all plugins. If they have a Document_click, run it.
            var plugins = event.target.querySelectorAll('[data-plugin]');
            for (var i = 0; i < plugins.length; ++i) {
                var plugin = plugins[i].ep_Plugin;
                if (!plugin) continue;

                if (plugin.Document_click) plugin.Document_click(event);
            }
        }
    );

})(window);

document.addEventListener('DOMContentLoaded', function () {
    // Just in case we are in a cross-origin popup, try-check it.
    try {
        if (!window.applicationRoot && window.parent && window.parent.window) applicationRoot = parent.window.applicationRoot;
        if (!window.applicationRoot && window.opener) applicationRoot = window.opener.applicationRoot;
    }
    catch (ex) { }
}, false);

$.extend(Namespace('ST.Actions'), {
    ShowImageModal: function (ev) {
        var src = this.getAttribute('src').replace('\\', '/');
        var bIsEmpty = !src || src.substr(src.lastIndexOf('/') + 1).indexOf('NoPhoto.png') == 0;
        var viewData = $(this).viewData();
        var title = '';

        if (viewData && viewData.entityName) {
            var ctrl = viewData.ControlList[0];
            if (ctrl && ctrl.IsTitleText) {
                title = viewData.entityName + ': ' + viewData.ControlList[0].Value;
            }
        }

        if (!bIsEmpty) {
            $().stModal({
                template: 'ST.DockPanel.ImageModal',
                title: title,
                src: src,
                height: this.naturalHeight || 500,
                alt: this.getAttribute('alt')
            });
        }
    }
});
$.extend(Namespace('Enum'), {
    ColorThemes: {
        Default: '0',
        Dark: '1',
        Light: '2',
    }
});

(function ($) {
    var inIframe;

    function addThemeLinkElement() {
        const $themeEl = $('#CssTheme');
        if ($themeEl.length === 0) {
            $(`<link id="CssTheme" rel="stylesheet" type="text/css" href="schemes/ST/Themes/Light.css?d=${new Date().getTime()}" />`)
                .appendTo(document.head);
        }
    }

    $.extend(Namespace('ST.Theme'), {
        SaveColorThemePreferences: function (opts) {
            ST.SetPreference('ShowHighContrast', ST.Preferences.ShowHighContrast);
            ST.SetPreference('STColorTheme', ST.Preferences.STColorTheme);

            const $prefs = $('#divUserPreferences');
            if (opts?.closeDropdown !== false) {
                $prefs.removeClass('open').trigger('menu-closing');
            }
            $prefs.fastFind('[data-id="ShowHighContrast"] > input').prop('checked', ST.Preferences.ShowHighContrast);
            $prefs.fastFind('.st-dropdown[data-name="stColorTheme"]').val(ST.Preferences.STColorTheme || '0');
        },

        _SetColorTheme: function (theme) {
            function applyColorTheme(wnd, body) {
                if (wnd.$) {
                    let $body = wnd.$(body);
                    if (!$body.hasThisClass('changing-themes')) {
                        $body.addClass('changing-themes');
                        setTimeout(function () {
                            wnd.$(body).removeClass('changing-themes');
                        }, 1500);

                        if (wnd.ST && wnd.ST.Theme.ApplyColorTheme) {
                            wnd.ST.Theme.ApplyColorTheme(ST.Preferences.STColorTheme);
                        }
                    }
                }
            }

            ST.ForEachWindow(function (wnd) {
                const body = wnd.document.body;
                if (body) {
                    applyColorTheme(wnd, body);
                }
            }, true);
        },

        ApplyColorTheme: function (theme) {
            const DM_CSS = 'dx.dark.';
            const LM_CSS = 'dx.light.';
            const useColorTheme = ST.CurrentWebPortal == 0;

            addThemeLinkElement();
            if (useColorTheme) {
                const path = window.location.pathname.toLowerCase();

                if (ST.Preferences.ShowHighContrast
                    || path.indexOf('gb_assessmentpassage.aspx') >= 0
                    || path.indexOf('gb_districtgradebook.aspx') >= 0
                    || path.indexOf('gb_standardsgradingmethod.aspx') >= 0
                    || path.indexOf('/setup/rubrics') >= 0
                    || path.indexOf('/streams.aspx') >= 0
                    || path.indexOf('gb_rti_add.ashx') >= 0
                    || path.indexOf('gb_rti.aspx') >= 0
                ) {
                    theme = '';
                    document.body.removeAttribute('data-theme');
                }
                else if (theme === Enum.ColorThemes.Default) {
                    if (ST.PrefersDarkMode) {
                        theme = Enum.ColorThemes.Dark;
                    }
                    else {
                        theme = Enum.ColorThemes.Light;
                    }
                }

                if (theme && theme !== Enum.ColorThemes.Default) {
                    document.body.setAttribute('data-theme', theme);
                }
                else {
                    document.body.removeAttribute('data-theme');
                }

                if (theme === Enum.ColorThemes.Dark) {
                    $('link').each(function () {
                        if (this.href.indexOf(LM_CSS) !== -1) {
                            this.href = this.href.replace(LM_CSS, DM_CSS);
                        }
                    });
                }
                else {
                    $('link').each(function () {
                        if (this.href.indexOf(DM_CSS) !== -1) {
                            this.href = this.href.replace(DM_CSS, LM_CSS);
                        }
                    });
                }

                const themeUrl = theme === Enum.ColorThemes.Default
                    ? 'schemes/ST/Themes/Light.css'
                    : 'schemes/ST/Themes/' + (Object.keys(Enum.ColorThemes).filter(k => Enum.ColorThemes[k] === theme)[0] || 'Light') + '.css';
                $('link[id="CssTheme"]').attr('href', themeUrl);

                if ($.fn.STControlData) {
                    $('.REV_EDIT_HTML').each(function () {
                        const ctrl = $(this).STControlData();
                        if (ctrl && ctrl.editor) {
                            ctrl.editor.destroy();
                            ctrl.Initialize();
                        }
                    });
                }
            }
        },

        SetColorTheme: function (theme) {
            if (window !== ST.GetRootWindow()) {
                return ST.GetRootInstance().Theme.SetColorTheme(theme);
            }

            if (ST.SyncronizeCommand) {
                ST.SyncronizeCommand('ST.Theme._SetColorTheme', theme);
            }
            else {
                ST.Theme._SetColorTheme(theme);
            }
        },

        _SetYearRenderMode: function (mode) {
            document.body?.setAttribute('data-year-mode', mode);

            window.ST?.ForEachWindow(function (wnd) {
                const body = wnd.document.body;
                body?.setAttribute('data-year-mode', mode);
            }, true);
        },

        SetYearRenderMode: function (mode) {
            if (window !== ST.GetRootWindow()) {
                return ST.GetRootInstance().Theme.SetYearRenderMode(mode);
            }

            if (ST.SyncronizeCommand) {
                ST.SyncronizeCommand('ST.Theme._SetYearRenderMode', mode);
            }
            else {
                ST.Theme._SetYearRenderMode(mode);
            }
        },

        SetPageColor: function (color) {
            color = color || '';
            var isPastOrFuture = false;

            ST.$HCColorPicker = ST.$HCColorPicker || $('.hc-color-picker .color-picker');
            var $colorPicker = ST.$HCColorPicker.css('background-color', color);

            // Initialize the color picker if not already initialized
            if ($colorPicker[0]) {
                function updateColor(ev, ui) {
                    ST.Theme.SetPageColor(ui.color.toString());

                    clearTimeout(ST.Theme.SetPageColor.prefTimer);
                    ST.Theme.SetPageColor.prefTimer = setTimeout(function () {
                        ST.Preferences.HighContrastColor = ui.color.toString();
                        ST.SetPreference('HighContrastColor', ST.Preferences.HighContrastColor);
                    }, 4000);
                }

                if (!$colorPicker[0].initialized) {
                    $colorPicker[0].initialized = true;
                    $colorPicker.children('input')
                        .val(color)
                        .iris({
                            mode: 'hsv',
                            palettes: true,
                            target: $colorPicker,
                            hide: true,
                            change: updateColor,
                            complete: updateColor
                        });
                }
            }

            // Ensure all framed views also apply the styles
            $('#PrimaryView > iframe').each(function () {
                var st = this.contentWindow && this.contentWindow.ST;
                if (st && st.Theme.SetPageColor) {
                    st.Theme.SetPageColor(color);
                }
            });

            clearTimeout(ST.Theme.SetPageColor.timer);
            ST.Preferences.HighContrastColor = color || null;
            if (isPastOrFuture) {
                $('#STColorOverride').remove();
            }
            else {
                var $colorStyle = $('#STColorOverride');
                if (!$colorStyle[0]) {
                    $colorStyle = $('<style/>').appendTo('head');
                }

                if (color) {
                    var colors = color.split(',');
                    var bgColor = colors[0] || '#fff';

                    // calculate the colors
                    var c = new Color(bgColor);
                    var pc = new Color(bgColor).darken(10);
                    var pcLabel = new Color(bgColor).darken(10);
                    if (pc.toString() == '#000000') { // if black lighten instead of darken
                        pc = new Color(bgColor).lighten(20);
                        pcLabel = new Color(bgColor).getComplement();
                    }

                    var cSRC = new Color('#ff0000');

                    if (cSRC.getDistanceLuminosityFrom(pcLabel) < 5
                        || cSRC.getDistanceLuminosityFrom(c) < 5) {
                        var newColorFound = false;
                        var cSRCL = new Color(cSRC.toString());
                        for (var i = 0; i < 5; i++) {
                            cSRCL = cSRCL.lighten(20 * i);
                            if (cSRCL.getDistanceLuminosityFrom(pcLabel) >= 5
                                && cSRCL.getDistanceLuminosityFrom(c) >= 5) {
                                newColorFound = true;
                                cSRC = cSRCL;
                                break;
                            }
                        }

                        if (newColorFound == false) {
                            var cSRCL = new Color(cSRC.toString());
                            for (var i = 0; i < 5; i++) {
                                cSRCL = cSRCL.darken(20 * i);
                                if (cSRCL.getDistanceLuminosityFrom(pcLabel) >= 5
                                    && cSRCL.getDistanceLuminosityFrom(c) >= 5) {
                                    newColorFound = true;
                                    cSRC = cSRCL;
                                    break;
                                }
                            }
                        }

                        if (newColorFound == false) {
                            cSRC = pcLabel.getComplement().getMaxContrastColor().toString();
                        }
                    }

                    var c2 = new Color(bgColor);
                    var pc2 = new Color(bgColor).darken(10);
                    var cLink = pc2.getComplement().getReadableContrastingColor(c2);

                    var hbg = colors[1] ? new Color(colors[1]) : new Color(bgColor).getComplement();
                    var headingTextColor = hbg.clone().getComplement().getMaxContrastColor();

                    ST.Preferences.CustomColors = {
                        Background: bgColor,
                        HeaderBG: hbg.toString()
                    };

                    $colorStyle.replaceWith(ich['ST.ColorStyle']({
                        bgColor: c.toString(),
                        tabDisabled: bgColor,
                        panelBGColor: pc.toString(),
                        panelHeading: hbg.toString(),
                        panelHeaderDisabled: hbg.clone().lighten(30).toString(),
                        panelHeaderLabelDisabled: hbg.clone().lighten(30).getMaxContrastColor().toString(),
                        textColorView: c.clone().getMaxContrastColor().toString(),
                        textColor: pcLabel.clone().getMaxContrastColor().toString(),
                        textColorLink: cLink.toString(),
                        headingTextColor: headingTextColor.toString(),
                        headerLabelTextColor: pc.clone().getComplement().getMaxContrastColor().toString(),
                        headingSRCTextColor: cSRC.toString()
                    }));
                }
                else {
                    $('#STColorOverride').remove();
                }
            }
        },

        UpdateHighContrast: function (show) {
            if (ST.Preferences.STColorTheme && ST.Preferences.STColorTheme !== "0") {
                show = false;

                if (ST.Preferences.ShowHighContrast) {
                    ST.Preferences.ShowHighContrast = false;
                    ST.SetPreference("ShowHighContrast", ST.Preferences.ShowHighContrast);
                }
            }

            ST.Preferences.ShowHighContrast = show;

            var isPastOrFuture = false;
            $('body').toggleClass('HighContrast', show && !isPastOrFuture);

            // Ensure all framed views also apply the styles
            $('#PrimaryView > iframe').each(function () {
                var st = this.contentWindow && this.contentWindow.ST;
                st?.Theme?.UpdateHighContrast(show);
            });

            if (ST.Preferences.STColorTheme && ST.Preferences.STColorTheme !== "0") {
                $('#ConfigMenu').fastFind('[data-id="ShowHighContrast"]')
                    .removeClass('checked')
                    .children('input')
                    .prop('checked', false)
                    .removeAttr('checked');
            }

            if (!show) {
                $('#ConfigMenu').fastFind('.hc-color-picker').slideUp();
            }
            else {
                $('#ConfigMenu').fastFind('.hc-color-picker').removeClass('hidden').slideDown();
            }

            if (ST.Preferences.ShowHighContrast) {
                ST.Theme.SetPageColor(ST.Preferences.HighContrastColor);
                ST.Theme.SetColorTheme('');
            }
            else {
                ST.Theme.SetColorTheme(ST.Preferences.STColorTheme);
            }
        },

    });
})(jQuery);

(function ($) {
    var cssRules = null;

    function initRulesDictionary() {
        if (!cssRules) {
            cssRules = {};

            for (var ss in document.styleSheets) {
                var sheet = document.styleSheets[ss];
                var rules = sheet.cssRules || sheet.rules;
                for (var css in rules) {
                    var cssRule = rules[css];
                    var selectorText = cssRule.selectorText;
                    if (selectorText && !cssRules[selectorText]) {
                        cssRules[selectorText] = cssRule;

                        var parts = selectorText.split(',');
                        for (var i = 0; i < parts.length; i++) {
                            var part = parts[i].trim();

                            var normalizedSelector = normalizeSelector(part);
                            cssRules[normalizedSelector] = cssRules[normalizedSelector] || cssRule;
                        }
                    }
                }
            }
        }

        clearTimeout(initRulesDictionary.timer);
        initRulesDictionary.timer = setTimeout(function () {
            cssRules = null;
        }, 3000);
    }

    function normalizeSelector(selector) {
        var res = [];

        var parts = selector.split(' ');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i]
                .split('.')
                .join(' .')
                .split('#')
                .join(' #')
                .split(' ')
                .sort(function (a, b) {
                    return a.substr(1).localeCompare(b.substr(1));
                })
                .join('');

            if (part) {
                res.push(part);
            }
        }

        return res.join(' ');
    }

    var $styleSheet;
    $.extend(Namespace('ST'), {
        FindCSSRule: function (selector) {
            function addCSSRule(sheet, selector, rules, index) {
                if ("insertRule" in sheet) {
                    sheet.insertRule(selector + "{" + rules + "}", index);
                }
                else if ("addRule" in sheet) {
                    sheet.addRule(selector, rules, index);
                }

                cssRules[normalizeSelector(selector)] = (sheet.cssRules || sheet.rules)[0];
            }

            initRulesDictionary();
            var normalizedSelector = normalizeSelector(selector);
            if (cssRules[normalizedSelector]) {
                return cssRules[normalizedSelector];
            }

            // Rule not found, so create one
            $styleSheet = $styleSheet || $('<style/>').appendTo(document.head);
            var sheet = $styleSheet[0].sheet;

            addCSSRule(sheet, selector, '', 0);
            return (sheet.cssRules || sheet.rules)[0];
        }
    });
})(jQuery);

$(document).ready(function () {
    if (ST.Theme.ApplyColorTheme) {
        if (ST.Preferences?.STColorTheme) {
            ST.Theme.ApplyColorTheme(ST.Preferences.STColorTheme);
        }

        onMediaChanged('(prefers-color-scheme: dark)', function (matches) {
            ST.PrefersDarkMode = matches;
            if (!ST.Preferences?.STColorTheme || ST.Preferences?.STColorTheme === '0') {
                if (matches) {
                    ST.Theme.ApplyColorTheme('1');
                }
                else {
                    ST.Theme.ApplyColorTheme('2');
                }
            }
        });
    }
});

function onMediaChanged(mediaString, callback) {
    let currentResult;
    function watch() {
        let matches = window.matchMedia(mediaString).matches
        if (currentResult !== matches) {
            currentResult = matches;
            callback(matches);
        }
    }

    setInterval(watch, 1000);
    watch();
}
