## Apache DeviceMap - BrowserMap module

[![Build Status](https://travis-ci.org/apache/devicemap-browsermap.png?branch=trunk)](https://travis-ci.org/apache/devicemap-browsermap)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

BrowserMap is a JavaScript browser features detection library. It uses modular probes and code snippets that detect specific features of the client; these are then used to detect the client's type and to optimize page rendering or to provide the client with alternate website versions.

In addition, BrowserMap is capable of detecting the device groups a client belongs to. The following groups are provided by default:

* `smartphone` - feature phones / smartphones;
* `tablet` - various tablets, based on screen size and the presence of touch capabilities (the touch events Modernizr test is used for this feature);
* `highResolutionDisplay` - devices that report a device pixel ratio greater or equal than 2, such as: iPhone 4 and above, iPod Touch gen. 4 and above, iPad 3, Samsung Galaxy S3, etc.;
* `browser` - desktop browsers capable of CSS 3D transitions (another Modernizr test is used for this feature)
* `oldBrowser` - less modern desktop browsers

### Demo
A small demo is available at [http://devicemap-vm.apache.org/browsermap/index.html](http://devicemap-vm.apache.org/browsermap/index.html).

### Features

* extensible probing mechanism;
* on-demand probing with probes' results cache and cache clearing mechanism;
* easy mechanism for overriding pre-defined device groups / adding new device groups;
* three ways of determining the correct URL to which a client should be forwarded, depending on its device group, in order of importance:
    * usage of `<link rel="alternate" hreflang="<language_code>" data-bmap-devgroups="<device_group_name_list>" href="<alternate_url>" />` tags in BrowserMap enabled pages;
    * a specific URL defined for each `DeviceGroup` JavaScript object added to the `BrowserMap` JavaScript object (e.g. `http://www.example.com` for `browser`, `http://m.example.com` for `smartphone`);
    * modify the current URL to include a `DeviceGroup` selector, in case none of the previous two methods has been set up (e.g. `http://www.example.com/index.smartphone.html` for the `smartphone` device group);
* device group override (by using a combined mechanism of a `GET` parameter and cookie storage) so that a client from a certain device group can access the pages designed for a different device group; for clients that do not support cookies, the device group override uses just a `GET` parameter which can optionally be appended to each URL pointing to a resource from the same domain as the current resource.

### BrowserMap relevant files
The BrowserMap code is organised in two base folders:

* `libs/browsermap/`:
    * `bmap.js` - this is where the `BrowserMap` object is defined (main object used for device detection)
    * `bmaputil.js` - file containing helper objects and methods
    * `devicegroups.js` - file containing the `DeviceGroups` object descriptions for each identified device group
    * `probes.js` - file containing various `BrowserMap` probes used to detect various browser features that can determine a client's capabilities
* `libs/externals/`:
    * `modernizr/modernizr.custom.js` - a reduced [Modernizr](http://modernizr.com/ "Modernizr") configuration
    * `matchMedia/matchMedia.js` - the [`matchMedia.js` polyfill project](https://github.com/paulirish/matchMedia.js/ "matchMedia.js") written by Paul Irish

### Correct order of files inclusion in an HTML page
In order to have a functional BrowserMap instance, the previous files have to be included in this order:

        <script type="text/javascript" src="libs/browsermap/bmaputil.js"></script>
        <script type="text/javascript" src="libs/browsermap/bmap.js"></script>
        <script type="text/javascript" src="libs/externals/modernizr/modernizr.custom.js"></script>
        <script type="text/javascript" src="libs/externals/matchMedia/matchMedia.js"></script>
        <script type="text/javascript" src="libs/browsermap/probes.js"></script>
        <script type="text/javascript" src="libs/browsermap/devicegroups.js"></script>

### `DeviceGroup`s configuration
A `DeviceGroup` object has the following attributes:

* `ranking` - determines the order in which, when added to the `BrowserMap` object, the `DeviceGroup`s will be matched; a lower ranking means an earlier evaluation (e.g. 0 is evaluated before 10);
* `name` - the name of the `DeviceGroup`; can also act as a URL selector which will be used to create `DeviceGroup`s-specific URLs to which the clients will be forwarded
* `description` - a string used to store a brief description of the `DeviceGroup`
* `testFunction` - a test function that must return a boolean value; the test function is used to check if a client matches the `DeviceGroup` or not; the test function can use `BrowserMap` probe functions
* `isSelector` - a boolean flag which is checked to see if a `DeviceGroup`'s name should be used as a selector or not.

To add a `DeviceGroup` to the `BrowserMap` object, one can use the `BrowserMap.addDeviceGroup(DeviceGroup object)` method. The last `DeviceGroup` added to `BrowserMap` with the same name as a previously existing `DeviceGroup` will be the one which will be stored, which can be useful if one tries to override the default `DeviceGroups`.

### Development
BrowserMap's own source files are located in `src/main/js`.

The main test file is located in `src/test/js` and the tests are based on [QUnit](http://qunitjs.com/ "QUnit").

The builds are handled with [Grunt](http://gruntjs.com/ "Grunt"). In order to build the project you need to install
[PhantomJS](http://phantomjs.org/ "PhantomJS"), [Node.js](http://nodejs.org/ "Node.js") and [npm](https://github.com/isaacs/npm "npm").
Afterwards use `npm` to globally install `grunt-cli` and the development dependencies:

    npm install -g grunt-cli
    npm install -d

The tests can be run with `grunt test` inside the browsermap folder.

Packaging the app is done with `grunt package`.

### How to report issues or request enhancements
Please file a JIRA issue at [https://issues.apache.org/jira/browse/DMAP](https://issues.apache.org/jira/browse/DMAP) and use the "browsermap"
label.

If you're reporting a bug please provide an accurate description of the problem together with the debug output found on the demo page from
[http://devicemap-vm.apache.org/browsermap/index.html](http://devicemap-vm.apache.org/browsermap/index.html).
