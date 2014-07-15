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

(function () {
    // Populate test page
    BrowserMap.forwardRequest();
    var matchedGroups = BrowserMap.getMatchedDeviceGroups(),
        matchedGroupsDescription = [],
        matchedGroupsNames = [],
        testFunctions = [],
        dgs = [],
        deviceGrps,
        g,
        element,
        i;
    for (g in matchedGroups) {
        matchedGroupsDescription.push(matchedGroups[g].description);
        matchedGroupsNames.push(matchedGroups[g].name);
        testFunctions.push(matchedGroups[g].testFunction);
    }
    deviceGrps = BrowserMap.getDeviceGroups();
    for (var g in deviceGrps) {
        dgs.push(deviceGrps[g].name);
    }

    element = document.getElementById('devicegroup-description');
    element.innerHTML = matchedGroupsDescription.join(', ')
    element = document.getElementById('devicegroup-name');
    element.innerHTML = matchedGroupsNames.join(', ');

    element = document.getElementById('debug-info');
    var probingResults = BrowserMap.getProbingResults();
    for (i in probingResults) {
        if (probingResults.hasOwnProperty(i)) {
            element.innerHTML += i + '=' + probingResults[i] + '<br />';
        }
    }
    element.innerHTML += '<br />';
    element.innerHTML += 'Test functions: <br />';
    for (i in testFunctions) {
        element.innerHTML += testFunctions[i] + '<br />';
    }
    element.innerHTML += '<br />';

    var dgs = BrowserMap.getDeviceGroupsInRankingOrder(),
        urlNoParams = window.location.href.replace(BrowserMapUtil.Url.getURLParametersString(window.location.href), ''),
        i;
    element = document.getElementById('devicegroups-list');
    for (i = 0; i < dgs.length; i++) {
        element.innerHTML += '<li><a href="' + urlNoParams + '?device=' + dgs[i].name + '">' + dgs[i].name + '</a></li>';
    }
})();
