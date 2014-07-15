/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * BrowserMapUtil contains various utility static functions used by BrowserMap-related code.
 *
 * @class BrowserMapUtil
 */
 (function(BrowserMapUtil) {
    'use strict';

        /**
     * Merge two objects as hashes. Entries with duplicate keys are overwritten with values from the second object.
     *
     * @param {Object} hsh1 - the first hash object
     * @param {Object} hsh2 - the second hash object
     * @return {Object} a hash object obtained by merging the two parameter hash objects
     */
    BrowserMapUtil.merge = function(hsh1, hsh2) {
        var hsh = { },
            prop;
        for (prop in hsh1) {
            if (hsh1.hasOwnProperty(prop)) {
                hsh[prop] = hsh1[prop];
            }
        }
        for (prop in hsh2) {
            if (hsh2.hasOwnProperty(prop)) {
                hsh[prop] = hsh2[prop];
            }
        }
        return hsh;
    };

    /**
     * Returns the set difference between Array a and Array b (a \ b).
     *
     * @param {Array} a - the first Array
     * @param {Array} b - the second Array
     * @return {Array} an Array containing the set difference
     * @throws TypeError if either a or b are not of type Array
     */
    BrowserMapUtil.getArrayDifference = function (a, b) {
        if (!a instanceof Array) {
            throw new TypeError('Expected Array for a');
        }
        if (!b instanceof Array) {
            throw new TypeError('Expected Array for b');
        }
        var i,
            seen = [],
            diff = [];
        for (i = 0; i < b.length; i++) {
            seen[b[i]] = true;
        }
        for (i = 0; i < a.length; i++) {
            if (!seen[a[i]]) {
                diff.push(a[i]);
            }
        }
        return diff;
    };

    /**
     * The <code>cookieManager</code> is used to manage cookies client-side (see
     * <a href="https://developer.mozilla.org/en/DOM/document.cookie">https://developer.mozilla.org/en/DOM/document.cookie</a>).
     *
     * @class BrowserMapUtil.CookieManager
     */
    BrowserMapUtil.CookieManager = {
        /**
         * Returns a <code>Cookie</code> set on the client.
         *
         * @param {String} name - the cookie's name
         * @return {Cookie} the cookie; <code>null</code> if the specified cookie cannot be found
         */
        getCookie : function (name) {
            if (!name || !this.cookieExists(name)) { return null; }
            var cookieValue = decodeURIComponent(document.cookie.replace(new RegExp('(?:^|.*;\\s*)' +
                encodeURIComponent(name).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*'), '$1'));
            var cookie = new Cookie(name, cookieValue);
            return cookie;
        },

        /**
         * Sets a <code>Cookie</code> on the client.
         *
         * @param {Cookie} cookie - the cookie
         */
        setCookie : function (cookie) {
            if (!cookie.name || /^(?:expires|max\-age|path|domain|secure)$/.test(cookie.name)) { return; }
            var sExpires = '';
            if (cookie.expires) {
                switch (typeof cookie.expires) {
                    case 'number':
                        sExpires = '; max-age=' + cookie.expires; break;
                    case 'String':
                        sExpires = '; expires=' + cookie.expires; break;
                    case 'object':
                        if (cookie.expires.hasOwnProperty('toGMTString')) {
                            sExpires = '; expires=' + cookie.expires.toGMTString();
                        }
                    break;
                }
            }
            document.cookie = encodeURIComponent(cookie.name) + '=' + encodeURIComponent(cookie.value) + sExpires +
                (cookie.domain ? '; domain=' + cookie.domain : '') + (cookie.path ? '; path=' + cookie.path : '') +
                    (cookie.secure ? '; secure' : '');
        },

        /**
         * Removes a cookie from the client, if one exists.
         *
         * @param {String} name - the <code>Cookie</code>'s name
         */
        removeCookie : function (name) {
            if (!name || !this.cookieExists(name)) { return; }
            var oExpDate = new Date();
            oExpDate.setDate(oExpDate.getDate() - 1);
            document.cookie = encodeURIComponent(name) + '=; expires=' + oExpDate.toGMTString() + ';';
        },

        /**
         * Tests if a cookie exists on the client.
         *
         * @param {String} name - the cookie's name
         * @return {Boolean} <code>true</code> if the cookie exists, <code>false</code> otherwise
         */
        cookieExists : function (name) {
            return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(name).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
        },

        cookiesEnabled : function () {
            var cookie = new Cookie('browsermap_test_cookie', 'browsermap_test_cookie', 10, '/');
            this.setCookie(cookie);
            var testCookie = this.getCookie('browsermap_test_cookie');
            if (testCookie !== null) {
                this.removeCookie('browsermap_test_cookie');
                return true;
            }
            return false;
        }
    };

    /**
     * The <code>file</code> object provides various file-related static utility methods.
     *
     * @class BrowserMapUtil.File
     */
    BrowserMapUtil.File = {
        /**
         * Returns the extension of a file based on the file name.
         *
         * @param {String} file - the file's name
         * @return {String} a String containing the file's extension, empty String if the file does not have an extension
         */
        getFileExtension : function (file) {
            var extension = '';
            if (file && file !== '' && file.indexOf('.') != -1) {
                extension = file.substring(file.lastIndexOf('.') + 1, file.length);
            }
            return extension;
        },

        /**
         * Analyses if a file has selectors in its file name and returns the file name (file part + extension) without the selectors.
         *
         * @param {String} file - the file from which to remove the selectors
         * @return {String} a String containing the file with the removed selectors
         */
        removeSelectorsFromFile : function(file) {
            if (file && file !== '') {
                var tokens = file.split('.');
                if (tokens.length > 2) {
                    return tokens[0] + '.' + tokens[tokens.length - 1];
                }
            }
            return file;
        }
    };

    /**
     * The <code>url</code> object provides various URL-related static utility methods.
     *
     * @class BrowserMapUtil.Url
     */
    BrowserMapUtil.Url = {
        /**
         * Analyses a URL an returns the domain part from it.
         *
         * @param {String} url - the URL from which to extract the domain part
         * @return {String} the detected domain
         */
        getDomainFromURL : function (url) {
            var domain = '';
            url = url.replace(/http:\/\/|https:\/\//, '');
            var slashIndex = url.indexOf('/');
            if (slashIndex == -1) {
                domain = url;
            } else {
                domain = url.substring(0, slashIndex);
            }
            return domain;
        },

        /**
         * Decodes the value of a <code>GET</code> request URL parameter.
         *
         * @param {String} value - the encoded value of the parameter
         * @return {String} the decoded value of the parameter
         */
        decodeURLParameterValue : function (value) {
            return decodeURIComponent(value.replace(/\+/g, ' '));
        },

        /**
         * Returns a map with the <code>GET</code> paramters of a URL.
         *
         * @param {String} url - the URL from which the parameters need to be extracted
         * @return {Object} the map with the parameters and their values
         */
        getURLParameters : function (url) {
            var map = {}, self = this;
            var f = function(m,key,value) { map[key] = self.decodeURLParameterValue(value); };
            url.replace(/[?&]+([^=&]+)=([^&]*)/gi, f);
            return map;
        },

        /**
         * Returns the value of a specified <code>GET</code> parameter from a URL if the parameter exists. Otherwise it will return
         * <code>null</code>.
         *
         * @param {String} url - the URL from which the parameter value needs to be extracted
         * @param {String} parameter - the name of the <code>GET</code> parameter whose value needs to be returned
         * @return {String} the value of the parameter, <code>null</code> if the parameter does not exist
         */
        getValueForParameter : function (url, parameter) {
            return this.getURLParameters(url)[parameter];
        },

        /**
         * Returns the <code>GET</code> parameters String from a URL.
         *
         * @param {String} url - the URL form which the parameters String should be extracted
         * @return {String} the parameters String; empty String if the URL is <code>null</code> / empty
         */
        getURLParametersString : function (url) {
            var urlParametersString = '';
            if (url && url !== '' && url.lastIndexOf('?') != -1) {
                urlParametersString = url.substring(url.lastIndexOf('?'), url.length);
            }
            return urlParametersString;
        },

        /**
         * Returns the file part of a URL If the URL sent as a parameter
         * is empty or null, the returned value will be an empty String.
         *
         * @param {String} url - the URL from which the file part should be extracted
         * @return {String} a String containing the file part; empty String if the URL is null or empty or points to a folder instead of
         *      a file
         */
        getFileFromURL : function (url) {
            var file = '';
            if (url && url !== '') {
                url = url.replace('https://', '');
                url = url.replace('http://', '');
                url = url.replace(BrowserMapUtil.Url.getURLParametersString(url), '');
                if (url.lastIndexOf('/') != -1 && url[url.lastIndexOf('/') + 1] != '?') {
                    file = url.substring(url.lastIndexOf('/') + 1, url.length);
                }
            }
            return file;
        },

        /**
         * Retrieves the folder path from a URL.
         *
         * @param {String} url - the URL from which the path is extracted
         * @return {String} a String containing the folder path; empty String if the URL is <code>null</code> or empty or it does not end
         *  with "/"
         */
        getFolderPathFromURL : function (url) {
            var folderPath = '';
            var tmpURL = url;
            tmpURL = tmpURL.replace('https://', '');
            tmpURL = tmpURL.replace('http://', '');
            if (tmpURL && tmpURL !== '' && tmpURL.lastIndexOf('/') != -1) {
                folderPath = tmpURL.substring(0, tmpURL.lastIndexOf('/') + 1);
                folderPath = url.substring(0, url.indexOf(folderPath)) + folderPath;
            }
            return folderPath;
        },

        /**
         * Analyses a resource (the file part from a URL) and retrieves its selectors. The selectors will be returned in an Array. An empty
         * Array will be returned if no selectors have been found.
         *
         * @param {String} url - the URL from which the selectors have to be extracted
         * @return {Array} an Array with the selectors; the Array will be empty if no selectors have been found
         */
        getSelectorsFromURL : function(url) {
            var selectors = [];
            if (url && url !== '') {
                url = url.replace('https://', '');
                url = url.replace('http://', '');
                // ditch the parameters when retrieving selectors
                if (url.lastIndexOf('?') != -1) {
                    url = url.substring(0, url.lastIndexOf('?'));
                }
                if (url.lastIndexOf('/') != -1 ) {
                    url = url.substring(url.lastIndexOf('/') + 1, url.length);
                    var selectorCandidates = url.split('.');
                    if (selectorCandidates.length > 2) {
                        for (var i = 1; i < selectorCandidates.length - 1; i++) {
                            selectors.push(selectorCandidates[i]);
                        }
                    }
                }
            }
            return selectors;
        },

        /**
         * Adds selectors to the supplied URL and returns the modified URL. For example:
         * <pre>
         *      BrowserMapUtil.Url.addSelectorsToUrl('http://www.example.com/index.html', ['mobile'])
         *      ->
         *      'http://www.example.com/index.mobile.html'
         * </pre>
         * @param {String} url - the URL to which selectors need to be added
         * @param {Array} selectors - an Array with the selectors that have to be applied to the current URL
         * @return {String} a String containing the new URL
         */
        addSelectorsToURL : function(url, selectors) {
            var file = this.getFileFromURL(url),
                parameters = BrowserMapUtil.Url.getURLParametersString(url);
            file = BrowserMapUtil.File.removeSelectorsFromFile(file);
            if (file && file !== '') {
                var path = this.getFolderPathFromURL(url);
                var extension = BrowserMapUtil.File.getFileExtension(file);
                file = file.replace('.' + extension, '');
                var newURL = path + file;
                if (selectors.length > 0) {
                    newURL += '.';
                }
                newURL += selectors.join('.');
                if (extension && extension !== '') {
                    newURL += '.' + extension;
                }
                newURL += parameters;
                return newURL;
            }
            return url;
        },

        /**
         * Transforms a relative URL to an absolute one for IE7 which is not able to resolve relative URLs by itself.
         *
         * @param {String} url - the relative URL
         * @return {String} a String with the absolute URL
         */
        qualifyURL : function(url) {
            var absoluteURL = null,
                el;
            if (url) {
                el = document.createElement('div');
                el.innerHTML= '<a href="' + encodeURI(url) + '">x</a>';
                absoluteURL = el.firstChild.href;
            }
            return absoluteURL;
        },

        /**
         * Searches for a canonical link in the current document. If ones is found, its href attribute's value is returned.
         *
         * @return {String} a String with the canonical URL; null if one is not found
         */
        getCanonicalURL : function() {
            var headElement = document.getElementsByTagName('head')[0],
                links,
                i,
                link,
                url;
            if (headElement) {
                links = headElement.getElementsByTagName('link');
                if (links) {
                    for (i = 0; i < links.length; i++) {
                        link = links[i];
                        if (link.rel && link.rel === 'canonical') {
                            url = link.href;
                            break;
                        }
                    }
                }
            }
            return url;
        }
    };

 })(window.BrowserMapUtil = window.BrowserMapUtil || {});


/**
 * Creates a Cookie object.
 *
 * @constructor
 * @param {String} name - this cookie's name
 * @param {String} value - this cookie's value (unescaped - the cookie manager will handle escaping / unescaping)
 * @param {Object} expires - this cookie's expires information; the object can have the following types:
 *      <ol>
 *          <li><code>Number</code> - expiration time in seconds</li>
 *          <li><code>String</code> - expiration time as a String formatted date</li>
 *          <li><code>Object</code> - expiration time as a Date object</li>
 *      </ol>
 * @param {String} path - the path for which this cookie is valid
 * @param {String} domain - the domain for which this cookie is valid
 * @param {Boolean} secure - boolean flag to inidicate if this cookie needs to be used only for HTTPS connections or not
 */
function Cookie(name, value, expires, path, domain, secure) {
    if (!(this instanceof Cookie)) {
        return new Cookie(name, value, expires, path, domain, secure);
    }
    this.name = name;
    this.value = value;
    this.expires = expires;
    this.path = path;
    this.domain = domain;
    this.secure = secure;
}

// Array.indexOf polyfill
// from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        'use strict';
        if (this === null) {
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
            } else if (n !== 0 && n != Infinity && n != -Infinity) {
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
    };
}

// String.trim() polyfill
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/Trim
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}
