# Joiner

## Purpose

It lets you write code into separate files, providing a real-time compilation of all files into one.


## Configuration

There is a `config.json` file on the Joiner folder. It lets you change the templates used to generate the joined files, administrate the order of files to be joined, and specify files packages.

### Specifying a list of files
```js
{
    "package_one": [
        "/Users/foo/development/one.js",
        "/Users/foo/development/two.js",
        "/Users/foo/development/three.js"
    ]
}
```

### Specifying groups of files
```js
{
    "package_one": {
        "group_one": [
            "/Users/foo/development/one.js",
            "/Users/foo/development/two.js"
        ],
        "group_two": [
            "/Users/foo/development/three.js",
            "/Users/foo/development/four.js"
        ]
    }
}
```

### Specifying an `output`
```js
{
    "package_one": {
        "group_one": [
            "/Users/foo/development/one.js",
            "/Users/foo/development/two.js"
        ],
        "group_two": [
            "/Users/foo/development/three.js",
            "/Users/foo/development/four.js"
        ],
        "output": [
            "/*! Documentation */",
            "group_one",
            "/* End of the first group */",
            "/* Begins the second group */",
            "group_two"
        ]
    }
}
```


## Usage

To see it in action, run the Joiner app and use it on any browser or any HTML tag `<link>`, `<script>`, `<img>`, etc.

### Executing the application

For the first time, you have to install all the dependencies. So, from the Joiner folder:

    $ npm install

And you can run the app:

    $ npm start

Or:

    $ node app.js

Also, you can set a custom port (`3000` by default):

    $ node app.js 1234


### Accessing

#### Via URL:

All the **uncompressed** files of, for example, `package_one`:

    http://localhost:3000/package_one

All the **minified** files of, for example, `package_one`:

    http://localhost:3000/package_one/min

#### As a NodeJS module:

However, you can require the Joiner as a module (see the [app.js](https://github.com/llinares/joiner/blob/master/app.js)):

```js
var Joiner = require('./joiner').Joiner;
```

Setting the package name and an optional flag to minify the code (`false` by default):

```js
joiner.init(packageName[, minify]);
```

For example:
```js
joiner.init('package_one', true);
```

And you'll receive a response object by listening the `joined` event:

* `raw` (String): The result of concatenate the files.
* `type` (String): Extension of the result file.
* `size` (Number): The size of the file in kilobytes.
* `min` (Boolean): It indicates if the package was compressed.

So you can do something like this:
```js
joiner.on('joined', function (data) {
    res.set('Content-Type', (data.type === 'js') ? 'text/javascript' : 'text/css');
    res.send(data.raw);
});
```

See the [app.js](https://github.com/llinares/joiner/blob/master/app.js).


## API

### Joiner.config
`JSON` Contains the entire JSON of the configuration file.

```js
{
    "package": {
        "group": [
            "filename"
        ],
        "template": []
    }
}
```

### Joiner.output
`Array` Data collected through process.

```js
[
    "First file content",
    "Second file content",
    "Third file content"
]
```

### Joiner.pack
`Object` Reference to the package object defined in the configuration file.

```js
{
    "group": [
        "filename"
    ],
    "template": []
}
```

### Joiner.type
`String` Indicates the package type from file extension.
It can be `js`, `css`, etc. It's determinated by the first file extension.

### Joiner.min
`Boolean` Indicates if the package needs to be compressed after combinate.

### Joiner.minify()
Applies uglify or cssmin to the final string.

```js
joiner.output = joiner.minify('Files raw data');
```

### Joiner.combine()
Join all the data into one single string.

### Joiner.getFilesRaw()
Reads files of a determinated collection and push the content into the output.

### Joiner.populateOutput()
Analize from where get the collection with filenames.

### Joiner.init()
Sets in the instance of the package to work with, and executes methods to get and combine data.

```js
joiner.init(packageName[, min]);
```

* **packageName**
    * String reference to the key of the object defined in the configuration file.
* **min** (Optional)
    * A boolean that indicates if the package needs to be compressed after combinate.


## License

The Joiner is released under the MIT License:

```
Copyright (c) 2013 Leandro Linares <http://leanlinares.me>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```