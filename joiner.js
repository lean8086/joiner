/*!
 * Joiner
 * It lets you write code into separate files, providing a real-time compilation of all files into one.
 * @author http://leanlinares.me
 * @see https://github.com/llinares/joiner
 */
(function () {
    'use strict';

    var util = require('util'),
        fs = require('fs'),
        UglifyJS = require('uglify-js'),
        cssmin = require('cssmin').cssmin,
        events = require('events'),
        exec = require('child_process').exec;

    function log(message) {
        util.puts(' > Joiner: ' + message + '.');
    }

    /**
     * Constructor class
     * @name Joiner
     */
    function Joiner() {

        log('Reading the configuration file');

        /**
         * Contains the entire JSON of the configuration file.
         * @name config
         * @memberOf Joiner
         * @type JSON
         */
        this.config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

        /**
         * Data collected through process.
         * @name output
         * @memberOf Joiner
         * @type Array
         */
        this.output = [];

        log('Ready to use');
    }

    /**
     * Event emitter
     */
    util.inherits(Joiner, events.EventEmitter);

    /**
     * Applies uglify or cssmin to the final string.
     * @name minify
     * @memberOf Joiner
     * @returns String
     */
    Joiner.prototype.minify = function () {

        // Check for a type existence
        if (this.type === undefined || typeof this.type !== 'string') {
            log('ERROR: Not exists a specific type to this package ("js", "css", etc.).');
            return;
        }

        // Abstract Syntax Tree generated from JS code (only for uglify-js)
        var minified;

        log('Minifying the entire output data');

        switch (this.type) {
        // Uglify
        case 'js':
            minified = UglifyJS.minify(this.output, {'fromString': true}).code;
            break;
        // CSS Min
        case 'css':
            minified = cssmin(this.output);
            break;
        }

        log('Minifying the entire output data: OK');

        return minified;
    };

    /**
     * Join all the data into one single string.
     * @name combine
     * @methodOf Joiner
     */
    Joiner.prototype.combine = function () {

        // Check for an output existence
        if (this.output.length === 0) {
            log('ERROR: There is no data to combine.');
            return;
        }

        // Combine the output with spacing
        this.output = this.output.join('\n\n');

        log('Data combined');

        // Minify the result if it's necesary
        if (this.min) {
            this.output = this.minify();
        }

        log('DONE');

        // Send advice to the client
        this.emit('joined', {
            'raw': this.output,
            'type': this.type,
            'size': this.output.length,
            'min': this.min
        });
    };

    /**
     * Reads files of a determinated collection and push the content into the output.
     * @name getFilesRaw
     * @methodOf Joiner
     * @param group Array Collection with filenames.
     * @todo Add support to relative URLs
     * @todo Add support to folders
     * @todo Get a better way to determine the package type
     */
    Joiner.prototype.getFilesRaw = function (group) {

        if (group.length === 0) {
            log('ERROR: There is no filenames to read');
            return;
        }

        var that = this;

        // Get each filename from the group
        group.forEach(function (path) {

            log('Reading file: ' + path);

            // Get the file data
            var raw = fs.readFileSync(path);
            // Push the data into the output
            that.output.push(raw);

            // Get the file extension if it wasn't get before
            if (that.type === undefined) {
                /**
                 * Indicates the package type from file extension.
                 * @name type
                 * @memberOf Joiner
                 * @type String
                 */
                that.type = path.split('.').pop();
            }
        });
    };

    /**
     * Analize from where get the collection with filenames.
     * @name populateOutput
     * @methodOf Joiner
     */
    Joiner.prototype.populateOutput = function () {

        var that = this;

        log('Looking for files to collect');

        /**
         * Case 1: A list of files were specified
         * @example
         * {
         *   "package_one": [
         *     "/Users/foo/development/one.js",
         *     "/Users/foo/development/two.js",
         *     "/Users/foo/development/three.js"
         *   ]
         * }
         */
        if (Array.isArray(this.pack)) {

            log('Files provided as a collection (without groups or template)');

            // Get filenames directly from the package
            this.getFilesRaw(this.pack);

            return;
        }

        /**
         * Case 2: Groups of files were specified
         * @example
         * {
         *   "package_one": {
         *     "group_one": [
         *       "/Users/foo/development/one.js",
         *       "/Users/foo/development/two.js"
         *     ],
         *     "group_two": [
         *       "/Users/foo/development/three.js",
         *       "/Users/foo/development/four.js"
         *     ]
         *   }
         * }
         */
        if (this.pack.output === undefined) {

            log('Files provided in groups (without template)');

            // Get filenames as groups into the package
            Object.keys(this.pack).forEach(function (groupName) {
                that.getFilesRaw(that.pack[groupName]);
            });

            return;
        }

        /**
         * Case 3: An "output" was specified
         * @example
         * {
         *   "package_one": {
         *     "group_one": [
         *       "/Users/foo/development/one.js",
         *       "/Users/foo/development/two.js"
         *     ],
         *     "group_two": [
         *       "/Users/foo/development/three.js",
         *       "/Users/foo/development/four.js"
         *     ],
         *     "output": [
         *       "// Documentation",
         *       "group_one",
         *       "// End of the first group",
         *       "// Begins the second group",
         *       "group_two"
         *     ]
         *   }
         * }
         */
        log('Files provided in groups and a template');

        // Walk into the output template to collect filenames and static data
        this.pack.output.forEach(function (tplMember) {
            // Check for the existence of a group with the tplMember name
            if (that.pack[tplMember] !== undefined) {
                // Get the files into this group
                that.getFilesRaw(that.pack[tplMember]);
            // It's a static member of the template
            } else {
                // Add directly to the final result
                that.output.push(tplMember);
            }
        });
    };

    /**
     * Sets in the instance of the package to work with, and executes methods to get and combine data.
     * @name init
     * @methodOf Joiner
     * @param packageName String Reference to the key of the object defined in the configuration file.
     * @param min Boolean (Optional) Indicates if the package needs to be compressed after combinate.
     */
    Joiner.prototype.init = function (packageName, min) {

        // Check for the arguments existence
        if (packageName === undefined || typeof packageName !== 'string') {
            log('ERROR: You have to provide a package name as parameter of init()');
            return;
        }

        /**
         * Reference to the package object defined in the configuration file.
         * @name pack
         * @memberOf Joiner
         * @type Object
         */
        this.pack = this.config[packageName];

        // Check for the package existence
        if (this.pack === undefined) {
            log('ERROR: The package ' + packageName + ' was not found in config.json');
            return;
        }

        log('Working with the package ' + packageName);

        /**
         * Indicates if the package needs to be compressed after combinate.
         * @name min
         * @memberOf Joiner
         * @type Boolean
         */
        this.min = !!min;

        // Fill the output array with the files content
        this.populateOutput();

        // Join the result data and send it to the user
        this.combine();
    };

    /**
     * Exports
     */
    exports.Joiner = Joiner;

}());