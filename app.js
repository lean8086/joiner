/**
 * Module dependencies.
 */
var express = require('express'),
    app = express(),
    Joiner = require('./joiner').Joiner,
    header = {
        'js': 'text/javascript',
        'css': 'text/css'
    };

/**
 * Route
 * @example
 * http://localhost:3000/foo/min
 */
app.get('/:name/:min?', function (req, res) {

    var joiner = new Joiner();

    joiner.on('joined', function (data) {
        res.set('Content-Type', header[data.type]);
        res.send(data.raw);
    });

    joiner.init(req.params.name, req.params.min);
});

/**
 * Port binding
 */
app.listen(process.argv[2] || 3000);