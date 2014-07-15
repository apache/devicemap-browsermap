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

/*global BrowserMapUtil:false, Cookie:false */
/**
 * The BrowserMap object is used to identify the client's device group, based on JavaScript detection tests ("probes") that find out
 * which features the client supports.
 *
 * @class BrowserMap
 */
(function(BrowserMap) {
    'use strict';

    var cookiePrefix = 'BMAP_',
        deviceGroupCookieName = 'device',
        deviceOverrideParameter = 'device',
        languageOverrideParameter = 'language',
        enableForwardingWhenCookiesDisabled = false,
        matchRun = false,
        languageOverride = null,
        matchedDeviceGroups = {},
        probes = {},
        probeCache = {},
        deviceGroups = {};
    // Android 4.x phones in landscape view use 42 pixels for displaying the "soft buttons"
    BrowserMap.THE_ANSWER_TO_LIFE_THE_UNIVERSE_AND_EVERYTHING = 42;

    BrowserMap.VERSION = '<%= pkg.version %>'; // replaced at build time by Grunt

    var linkDataDevgroups = 'data-bmap-devgroups';
    var linkcurrentVariant = 'data-bmap-currentvar';

    /**
     * Retrieves the probes Map - useful for outputting debugging information.
     *
     * @return {Object} an Object holding the probes and their results
     */
    BrowserMap.getProbingResults = function () {
        var probingResults = {},
            probe;
        for (probe in probes) {
            if (probes.hasOwnProperty(probe)) {
                probingResults[probe] = BrowserMap.probe(probe);
            }
        }
        return probingResults;
    };

    /**
     * Initialises BrowserMap with a configuration object.
     *
     * @param {Object} config - a hash object with various properties that can be used to configure BrowserMap
     * <p>
     * The following properties can be be used:
     *      <ol>
     *          <li><code>config.cookiePrefix</code> - the prefix used to name cookies used throughout the detection</li>
     *          <li><code>config.deviceGroupCookieName</code> - the name of the device group cookie (the final name will be of the form
     *             <code>config.cookiePrefix + config.deviceGroupCookieName</code>)</li>
     *          <li><code>config.deviceOverrideParameter</code> - the name of the GET parameter that triggers a device override</li>
     *          <li><code>config.languageOverrideParameter</code> - the name of the GET parameter that triggers a language override</li>
     *          <li><code>config.enableForwardingWhenCookiesDisabled</code> - if true, it will allow for all the URLs pointing to resources
     *              from the current domain to be modified in order to include the deviceOverrideParameter; this is useful if the client
     *              does not support cookies</li>
     *      </ol>
     * </p>
     */
    BrowserMap.config = function (config) {
        if (config.cookiePrefix !== null) {
            cookiePrefix = config.cookiePrefix;
        }
        if (config.deviceGroupCookieName !== null) {
            deviceGroupCookieName = config.deviceGroupCookieName;
        }
        if (config.deviceOverrideParameter !== null) {
            deviceOverrideParameter = config.deviceOverrideParameter;
        }
        if (config.languageOverrideParameter !== null) {
            languageOverrideParameter = config.languageOverrideParameter;
        }
        if (config.enableForwardingWhenCookiesDisabled !== null) {
            enableForwardingWhenCookiesDisabled = config.enableForwardingWhenCookiesDisabled;
        }
    };

    /**
     * Returns an Array of the alternate sites by analysing the link elements with rel='alternate' and the data-bmap-devgroups attribute
     * not null or empty.
     *
     * @return {Array} an array of alternate sites defined as objects with the <code>id, href, hreflang, devgroups</code> set of
     *                 attributes; an empty array if no alternate site is found
     */
    BrowserMap.getAllAlternateSites = function () {
        var alternateSites = [],
            links,
            i,
            link,
            headElement,
            onIE7,
            linkHref,
            devgroups;
        onIE7 = navigator.appVersion.indexOf('MSIE 7') !== -1;
        headElement = document.getElementsByTagName('head')[0];
        if (headElement) {
            links = headElement.getElementsByTagName('link');
            for (i = 0; i < links.length; i++) {
                link = links[i];
                devgroups = link.getAttribute(linkDataDevgroups);
                if (link.rel == 'alternate' && devgroups && devgroups !== '') {
                    if (onIE7) {
                        linkHref = BrowserMapUtil.Url.qualifyURL(link.href);
                    } else {
                        linkHref = link.href;
                    }
                    alternateSites.push(
                        {'id' : link.id, 'href' : linkHref, 'hreflang' : link.hreflang, 'devgroups' : devgroups}
                    );
                }
            }
        }
        return alternateSites;
    };

    /**
     * <p>
     * Looks for the best matching alternate site. The primary criterion is the number of matched device groups which also provides the
     * score of the alternate site. More criteria can be added by providing a filtering function.
     * </p>
     * <p>
     * The filtering function receives an alternate site as a parameter and it must return a boolean value if the filter matches or not. The
     * filter is applied to alternate sites that have matched at least one device group. If the alternate site matches the filter, the total
     * score of the alternate site will increase by 1. The alternate site's object attributes are id, href, hreflang and media.
     * </p>
     *
     * @param {Array} deviceGroups - an array containing the names of the device groups for which to get the best alternate link
     * @param {Function} filter - a callback function that acts as a filter and which must return a boolean; the callback will receive a
     *      hash object representing an alternate site with the following attributes: "id", "href", "hreflang", "devgroups"
     * @return {String} the alternate link that matches the most device groups matched by the client
     */
    BrowserMap.getAlternateSite = function (deviceGroups, filter) {
        var alternateSites = BrowserMap.getAllAlternateSites(),
            maxLinkScore = 0,
            alternateSite = null,
            i,
            j,
            linkScore,
            devices;
        for (i = 0; i < alternateSites.length; i++) {
            linkScore = 0;
            devices = alternateSites[i].devgroups.split(',');
            for (j = 0; j < devices.length; j++) {
                if (deviceGroups.indexOf(devices[j].trim()) !== -1) {
                    linkScore++;
                }
            }
            if (typeof filter == 'function' && linkScore > 0) {
                if(filter(alternateSites[i])) {
                    linkScore++;
                }
            }
            if (linkScore > maxLinkScore) {
                alternateSite = alternateSites[i];
                maxLinkScore = linkScore;
            }
        }
        return alternateSite;
    };

    /**
     * Returns the current variant, if one is found.
     *
     * @return {Object} an object with the <code>id, href, hreflang, devgroups</code> set of attributes; <code>null</code> if the current
     *                  variant cannot be determined
     */
    BrowserMap.getCurrentVariant = function () {
        var headElement = document.getElementsByTagName('head')[0],
            i = 0,
            currentVariant = null,
            currentVariantAttribute,
            links,
            link,
            onIE7,
            linkHref,
            devgroups;
        onIE7 = navigator.appVersion.indexOf('MSIE 7') !== -1;
        if (headElement) {
            links = headElement.getElementsByTagName('link');
            for (i = 0; i < links.length; i++) {
                link = links[i];
                if (link.rel == 'alternate') {
                    if (onIE7) {
                        linkHref = BrowserMapUtil.Url.qualifyURL(link.href);
                    } else {
                        linkHref = link.href;
                    }
                    devgroups = link.getAttribute(linkDataDevgroups);
                    currentVariantAttribute = link.getAttribute(linkcurrentVariant);
                    if (currentVariantAttribute && currentVariantAttribute === 'true') {
                        currentVariant = {'id' : link.id, 'href' : linkHref, 'hreflang' : link.hreflang, 'devgroups' : devgroups};
                        break;
                    }
                }
            }
        }
        return currentVariant;
    };

    /**
     * Returns the defined DeviceGroups for this BrowserMap as an array in which the elements are ordered by their ranking property.
     *
     * @return {Array}
     */
    BrowserMap.getDeviceGroupsInRankingOrder = function () {
        var dgs = [],
            dg;
        for (dg in deviceGroups) {
            if (deviceGroups.hasOwnProperty(dg)) {
                dgs.push(deviceGroups[dg]);
            }
        }
        dgs.sort(function(a, b) {
            return a.ranking - b.ranking;
        });
        return dgs;
    };

    /**
     * Executes a probe that was previously added via <code>addProbe</code>. The result of the probe is cached so a second call
     * with the same probeName will not run the probe again. You can use <code>BrowserMap.clearProbeCache()</code> to avoid that.
     *
     * @param {String} probeName - the name of the requested probe
     * @return {Object} the result of the probe, or null if the probe has not been defined
     */
    BrowserMap.probe = function (probeName) {
        if (!probes[probeName]) {
            return null;
        }
        if (!probeCache.hasOwnProperty(probeName)) {
            probeCache[probeName] = probes[probeName]();
        }
        return probeCache[probeName];
    };

    /**
     * Starting from a currentURL, an array of device groups and an array of url selectors returns the alternate URL for the current URL.
     *
     * @param {String} currentURL - the current URL
     * @param {Array} detectedDeviceGroups - the Array of detected device groups
     * @param {Array} urlSelectors - the Array of URL selectors, in the order of their device group ranking
     * @return {String} the specific URL for the identified device groups
     */
    BrowserMap.getNewURL = function (currentURL, detectedDeviceGroups, urlSelectors) {
        var newURL = null,
            currentVariant = BrowserMap.getCurrentVariant(),
            alternateSite = BrowserMap.getAlternateSite(detectedDeviceGroups, function(alternateLink) {
                if (languageOverride && alternateLink.hreflang && alternateLink.hreflang.lastIndexOf(languageOverride) === 0) {
                    return true;
                } else if (currentVariant && currentVariant.hreflang === alternateLink.hreflang) {
                    return true;
                }
                return false;
            }),
            i,
            dg,
            parameters = BrowserMapUtil.Url.getURLParametersString(currentURL),
            urlNoParams = currentURL.replace(parameters, '');
        if (alternateSite) {
            newURL = alternateSite.href;
        }
        if (!newURL) {
            for (i = 0; i < detectedDeviceGroups.length; i++) {
                dg = BrowserMap.getDeviceGroupByName(detectedDeviceGroups[i]);
                if (dg) {
                    newURL = dg.url;
                    if (newURL) {
                        break;
                    }
                }
            }
        }
        if (!newURL) {
            newURL = BrowserMapUtil.Url.addSelectorsToURL(urlNoParams, urlSelectors);
        }
        if (parameters) {
            newURL += parameters;
        }
        return newURL;
    };

    /**
     * Removes the device group override, whether it was set up by using the override cookie or just by using the specific device group
     * override parameter.
     */
    BrowserMap.removeOverride = function () {
        var oCookie = BrowserMapUtil.CookieManager.getCookie('o_' + cookiePrefix + deviceGroupCookieName),
            currentURL = window.location.href,
            parameters = BrowserMapUtil.Url.getURLParametersString(currentURL),
            overrideParameter,
            indexOfOverride;
        if (oCookie) {
            BrowserMapUtil.CookieManager.removeCookie(cookiePrefix + deviceGroupCookieName);
            BrowserMapUtil.CookieManager.removeCookie(oCookie.name);
            oCookie.name = cookiePrefix + deviceGroupCookieName;
            oCookie.path = '/';
            BrowserMapUtil.CookieManager.setCookie(oCookie);
        }
        if (parameters) {
            overrideParameter = deviceOverrideParameter + '=' +
                BrowserMapUtil.Url.getValueForParameter(currentURL, deviceOverrideParameter);
            currentURL = currentURL.replace(parameters, '');
            indexOfOverride = parameters.indexOf(overrideParameter);
            if (indexOfOverride !== -1) {
                if (parameters.length > indexOfOverride + overrideParameter.length) {
                    if (parameters[indexOfOverride - 1] == '?') {
                        parameters = parameters.replace(overrideParameter + '&', '');
                    }
                    else {
                        parameters = parameters.replace('&' + overrideParameter, '');
                    }
                }
                else {
                    parameters = parameters.replace('?' + overrideParameter, '');
                }
            }
            currentURL += parameters;
        }
        window.location = currentURL;
    };

    /**
     * <p>Decides if the client should be forwarded to the best matching alternate link, depending on the detected device group.</p>
     * <p>
     * Three options are available for determining the correct representation of a page depending on the detected device group, listed in
     * the order of their importance:
     *      <ol>
     *          <li>alternate links: <code>&lt;link rel="alternate" href="..." hreflang="..." media="device_groups" &gt;</code></li>
     *          <li><code>DeviceGroup</code> level URLs (check the <code>DeviceGroup</code> objects description)</li>
     *          <li>selector-based URLs (the device group names will be appended to the current URL: <code>index.html ->
     *              index.tablet.html</code>)</li>
     *      </ol>
     * In either case <code>GET</code> parameters will be maintained.
     */
    BrowserMap.forwardRequest = function () {
        var currentURL = window.location.href,
            deviceOverride = BrowserMapUtil.Url.getValueForParameter(currentURL, deviceOverrideParameter),
            detectedDeviceGroups = [],
            urlSelectors = [],
            oCookie = BrowserMapUtil.CookieManager.getCookie('o_' + cookiePrefix + deviceGroupCookieName),
            cookie = BrowserMapUtil.CookieManager.getCookie(cookiePrefix + deviceGroupCookieName),
            dgs = [],
            i,
            g,
            registeredDeviceGroups,
            dgName,
            domain,
            aTags,
            url,
            parameters,
            newURL,
            canonicalURL = BrowserMapUtil.Url.getCanonicalURL();
        if (BrowserMap.isEnabled()) {
            languageOverride = BrowserMapUtil.Url.getValueForParameter(currentURL, languageOverrideParameter);
            if (deviceOverride) {
                // override detected
                detectedDeviceGroups = deviceOverride.split(',');
                if (detectedDeviceGroups.length > 0) {
                    if (BrowserMapUtil.CookieManager.cookiesEnabled()) {
                        if (!oCookie && !cookie) {
                            // tried to access resource directly with override parameter without passing through detection
                            // run detection code to detect the original device groups
                            oCookie = new Cookie();
                            oCookie.name = 'o_' + cookiePrefix + deviceGroupCookieName;
                            oCookie.path = '/';
                            BrowserMap.matchDeviceGroups();
                            for (g in matchedDeviceGroups) {
                                if (matchedDeviceGroups.hasOwnProperty(g)) {
                                    dgs.push(matchedDeviceGroups[g].name);
                                }
                            }
                            if (deviceOverride !== dgs.join(',')) {
                                oCookie.value = dgs.join(',');
                                BrowserMapUtil.CookieManager.setCookie(oCookie);
                            }
                        }
                        else if (!oCookie) {
                            // detection has been performed; override detected; store original values
                            if (cookie.value !== detectedDeviceGroups.join(',')) {
                                cookie.name = 'o_' + cookie.name;
                                cookie.path = '/';
                                BrowserMapUtil.CookieManager.setCookie(cookie);
                            }
                        }
                        // store the override
                        cookie = new Cookie();
                        cookie.name = cookiePrefix + deviceGroupCookieName;
                        cookie.value = detectedDeviceGroups.join(',');
                        cookie.path = '/';
                        BrowserMapUtil.CookieManager.setCookie(cookie);
                        if (oCookie) {
                            if (oCookie.value == cookie.value) {
                                BrowserMapUtil.CookieManager.removeCookie(oCookie.name);
                            }
                        }
                    }
                }
            }
            if (cookie !== null || deviceOverride) {
                /**
                 * cookie was either set by the detection code before, or we have an override;
                 *
                 * in either case, the matchDeviceGroups must match the detectedDeviceGroups which can come from the cookie or from the
                 * override parameter
                 */
                registeredDeviceGroups = BrowserMap.getDeviceGroups();
                if (detectedDeviceGroups.length === 0) {
                    detectedDeviceGroups = cookie.value.split(',');
                }
                matchedDeviceGroups = { };
                for (i = 0 ; i < detectedDeviceGroups.length; i++) {
                    dgName = detectedDeviceGroups[i].trim();
                    if (registeredDeviceGroups.hasOwnProperty(dgName)) {
                        if (registeredDeviceGroups[dgName].isSelector) {
                            urlSelectors.push(dgName);
                        }
                        matchedDeviceGroups[dgName] = registeredDeviceGroups[dgName];
                    }
                }
                // add the device override parameter to links using the same domain if a device override was detected
                if (deviceOverride && cookie === null && enableForwardingWhenCookiesDisabled) {
                    domain = BrowserMapUtil.Url.getDomainFromURL(window.location.href);
                    aTags = document.getElementsByTagName('a');
                    for (i = 0; i < aTags.length; i++) {
                        url = aTags[i].href;
                        if (url && url.indexOf(domain) !== -1) {
                            parameters = BrowserMapUtil.Url.getURLParametersString(url);
                            if (parameters) {
                                if (parameters.indexOf(languageOverrideParameter + '=' + deviceOverride) == -1) {
                                    aTags[i].href = url + '&' + deviceOverrideParameter + '=' + deviceOverride;
                                }
                            }
                            else {
                                aTags[i].href = url + '?' + deviceOverrideParameter + '=' + deviceOverride;
                            }
                        }
                    }
                }
            }
            else {
                // no override has been detected, nor a cookie has been set previous to this call
                // perform the match and then set the cookie
                BrowserMap.matchDeviceGroups();
                for (g in matchedDeviceGroups) {
                    if (matchedDeviceGroups.hasOwnProperty(g)) {
                        if (matchedDeviceGroups[g].isSelector) {
                            urlSelectors.push(matchedDeviceGroups[g].name);
                        }
                        detectedDeviceGroups.push(matchedDeviceGroups[g].name);
                    }
                }
                cookie = new Cookie();
                cookie.name = cookiePrefix + deviceGroupCookieName;
                cookie.value = detectedDeviceGroups.join(',');
                cookie.path = '/';
                BrowserMapUtil.CookieManager.setCookie(cookie);
            }
            newURL = BrowserMap.getNewURL(currentURL, detectedDeviceGroups, urlSelectors);
            if (currentURL !== newURL && canonicalURL !== newURL) {
                window.location = newURL;
            }
        }
    };

    /**
     * Clears the probe result cache.
     */
    BrowserMap.clearProbeCache = function () {
        probeCache = { };
    };

    /**
     * Adds a <code>DeviceGroup</code> to the <code>BrowserMap</code> object. The key which is used to store the <code>DeviceGroup</code> is
     * represented by its name. The last <code>DeviceGroup</code> added to <code>BrowserMap</code> with the same name as a previously
     * existing <code>DeviceGroup</code> will be the one which will be stored.
     *
     * @param {Object} deviceGroup - the DeviceGroup to be added to the list
     * <p>
     * A DeviceGroup is represented by a hash object with the following attributes:
     *      <ol>
     *          <li><code>Number</code> <code>ranking</code> - the order number of the DeviceGroup (when it comes to matching the
     *              <code>DeviceGroups</code> to the client's capabilites, the defined <code>DeviceGroups</code> will be evaluated in order)
     *          </li>
     *          <li><code>String</code> <code>name</code> - the name of the <code>DeviceGroup</code> as one word (use camelCase if you need
     *              more words)</li>
     *          <li><code>Function</code> <code>testFunction</code> - the function that is to be evaluated to check if the client matches
     *              the <code>DeviceGroup</code>; this function <strong>must</strong> return a boolean value</li>
     *          <li><code>String</code> <code>url</code> (optional) - the URL to which a client will be forwarded in case the
     *              <code>DeviceGroup</code> matches and the current page does not contain an alternate link to which the client can be
     *              forwarded</li>
     *          <li><code>String</code> <code>description</code> (optional) - the description of the <code>DeviceGroup</code></li>
     *          <li><code>Boolean</code> <code>isSelector</code> (optional) - if present and set to <code>true</code>, the name of the
     *              <code>DeviceGroup</code> will be used to create a URL with a selector to which BrowserMap can forward the client
     *              (e.g. index.selector.html)</li>
     *      </ol>
     * </p>
     */
    BrowserMap.addDeviceGroup = function (deviceGroup) {
        // validate the deviceGroup object
        if (typeof deviceGroup.ranking !== 'number') {
            throw new TypeError('Expected a Number for device group ' + deviceGroup.name + ' ranking');
        }
        if (typeof deviceGroup.testFunction !== 'function') {
            throw new TypeError('Expected a Function for device group ' + deviceGroup.name + ' testFunction');
        }
        deviceGroups[deviceGroup.name] = deviceGroup;
    };

    /**
     * Adds a probe to BrowserMap and returns the BrowserMap object (useful for chaining). The probe name must be unique. If one tries to
     * overwrite an existing probe nothing will happen and the BrowserMap object will be returned as it was before the method was called.
     *
     * @param name a String containing the name of the probe
     * @param probe a Function that returns the result of the probe
     *
     * @return the BrowserMap object
     */
    BrowserMap.addProbe = function (name, probe) {
        if (typeof name !== 'string' || name.length < 1) {
            throw new TypeError('invalid probe name');
        }
        if (typeof probe !== 'function') {
            throw new TypeError('invalid probe function');
        }
        if (!probes.hasOwnProperty(name)) {
            probes[name] = probe;
        }
        return BrowserMap;
    };

    /**
     * Returns the DeviceGroups that a client has matched.
     *
     * @return {Object} a hash object containing the matched device groups
     */
    BrowserMap.getMatchedDeviceGroups = function () {
        return matchedDeviceGroups;
    };

    /**
     * Returns all the DeviceGroups defined for the BrowserMap object.
     *
     * @return {Object} a hash object containing the defined device groups for this BrowserMap instance
     */
    BrowserMap.getDeviceGroups = function () {
        return deviceGroups;
    };

    /**
     * Matches the DeviceGroups to the client's capabilities by evaluating the DeviceGroup's test function.
     */
    BrowserMap.matchDeviceGroups = function () {
        var deviceGroupsArray = BrowserMap.getDeviceGroupsInRankingOrder(),
            i,
            deviceGroup;
        for (i = 0; i < deviceGroupsArray.length; i++) {
            deviceGroup = deviceGroupsArray[i];
            if (!!deviceGroup.testFunction.call()) {
                matchedDeviceGroups[deviceGroup.name] = deviceGroup;
            }
        }
        matchRun = true;
    };

    /**
     * Queries the list of DeviceGroups associated to this BrowserMap object using a DeviceGroup name and returns it if found.
     *
     * @param {String} groupName - the name of the DeviceGroup
     * @return {Object} the DeviceGroup with the respective name, <code>null</code> otherwise
     * @see BrowserMap.addDeviceGroup
     */
    BrowserMap.getDeviceGroupByName = function (groupName) {
        return deviceGroups[groupName];
    };

    /**
     * Checks if BrowserMap should be enabled by searching the current document for tags like <code>&lt;meta name="browsermap.enabled"
     *  content="false"&gt;</code> in the <head> section. If such a tag exists, then this method returns <code>false</code>.
     *
     * @return {Boolean} false if the previously mentioned tag exists, true otherwise
     */
    BrowserMap.isEnabled = function () {
        var headElement = document.getElementsByTagName('head')[0],
            metaTags,
            i,
            name,
            tag;
        if (headElement) {
            metaTags = headElement.getElementsByTagName('meta');
            for (i = 0; i < metaTags.length; i++) {
                if ((tag = metaTags[i]) && (name = tag.getAttribute('name'))) {
                    if (name === 'browsermap.enabled' && tag.getAttribute('content') === 'false') {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    return BrowserMap;

})(window.BrowserMap = window.BrowserMap || {});
