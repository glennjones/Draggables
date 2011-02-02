/*! 
    draggables-drop.js 
    http://draggables.com
    Copyright (C) 2011 Glenn Jones. All Rights Reserved. MIT license
    Full source (unminified) can be downloaded from draggables.com
*/
// Please use the minified version of this file (draggables-drop.min.js) for production work


if (!draggables) {

    var draggables = {

        version: 0.1,

        // WAI-ARIA setting
        ariaDropeffect: 'copy execute',


        // Takes a configuration object
        addDropItem: function (obj) {
            this.internal.dropItems.push(obj);
        },


        internal: {
            dropItems: [],

            initDrop: function () {
                var d = draggables.internal;
                for (var i = 0; i <= d.dropItems.length - 1; i++) {
                    d.buildDropZone(d.dropItems[i]);
                }
            },


            buildDropZone: function (obj) {

                var d = draggables.internal;

                // If dropZone is a string use it to get the DOM element by ID
                if (this.isString(obj.dropZone)) {
                    obj.dropZone = document.getElementById(obj.dropZone);
                }

                // If the obj.formats property in not an array then turn it into one
                if (!this.isArray(obj.formats)) {
                    obj.formats = [obj.formats];
                }

                // Optional preLoadImages 
                if (obj.preLoadImages) {
                    if (!this.isArray(obj.preLoadImages)) {
                        obj.preLoadImages = [obj.preLoadImages];
                    }

                    for (var i = 0; i < obj.preLoadImages.length; i++) {
                        this.preLoadImage(obj.preLoadImages[i]);
                    }
                }

                // Chrome and Safari - Replace this 
                if (this.hasDragDrop() && !window.FileReader && !window.XDomainRequest) {
                    this.createFileInput(obj.dropZone, obj);
                }

                if (this.hasDragDrop()) {

                    // Set WAI-ARIA drag and drop roles 
                    // By default set to 'copy execute' - something will be copied into area then function will excuted using the dragged object as input
                    obj.dropZone.setAttribute('aria-dropeffect', this.ariaDropeffect);

                    this.addEvent(obj.dropZone, 'dragover', function (e) {
                        d.addClass(obj.dropZone, 'dropTargetOver');
                        d.preventDefault(e);
                    });

                    this.addEvent(obj.dropZone, 'dragenter', function (e) {
                        d.addClass(obj.dropZone, 'dropTargetOver');
                        d.preventDefault(e);
                    });

                    this.addEvent(obj.dropZone, 'dragleave', function (e) {
                        d.removeClass(obj.dropZone, 'dropTargetOver');
                        d.preventDefault(e);
                    });

                    this.addEvent(obj.dropZone, 'drop', function (e) {
                        d.removeClass(obj.dropZone, 'dropTargetOver');

                        var url = "";
                        var file = null;
                        var filefound = false;
                        var textfound = false;
                        var json = {};

                        // Dragged files - Only supports single file at the moment (html or zip) 
                        if (e.dataTransfer.files) {
                            for (i = 0; i <= e.dataTransfer.files.length - 1; i++) {
                                file = e.dataTransfer.files[i];

                                if (file.type == "text/html") {
                                    filefound = true;
                                    d.readHTMLFile(file, obj);
                                }

                                // Chrome does not return the correct type fro zip file
                                if (file.type == "application/zip" || file.fileName.toLowerCase().indexOf('.zip') > -1) {
                                    filefound = true;
                                    d.readZipFile(file, obj);
                                }
                            }
                        }

                        // Dragged URLs
                        if (e.dataTransfer.types) {
                            for (i = 0; i <= e.dataTransfer.types.length - 1; i++) {

                                // Dragged URL link
                                if (e.dataTransfer.types[i] == "URL" || e.dataTransfer.types[i] == "text/x-moz-url-data") {
                                    url = e.dataTransfer.getData(e.dataTransfer.types[i]);
                                }

                                // Dragged Firefox URL bookmark file
                                if (url === "" && e.dataTransfer.types[i] == "text/x-moz-url") {
                                    url = e.dataTransfer.getData(e.dataTransfer.types[i]).split(" ")[0].split("\n")[0].replace('\r', '');
                                }
                            }
                        }

                        // Dragged JSON objects
                        if (e.dataTransfer.getData('Text')) {
                            // Directly ask for 'Text' rather any a definded data type to support IE6/7/8
                            var text = e.dataTransfer.getData('Text');
                            // If text is equal to url then use the url
                            if (text != url) {
                                if (text.indexOf('draggablePackage') > 0) {
                                    textfound = true;
                                    json = JSON.parse(text);
                                    if (d.hasSupportedFormat(json, obj.formats)) {
                                        d.dataHandler(json, obj);
                                    }
                                } else {
                                    d.errorHandler('Sorry', 'The object you drop does not seems to support draggables format.');
                                }
                            }
                        }

                        // If not text or files where found use any URL's passed
                        if (url !== "" && !filefound && !textfound) {
                            d.urlHandler(url, obj);
                        }


                        d.preventDefault(e);
                    });



                } else {
                    obj.dropZone.style.display = 'none';
                }

            },


            // Preloads an image into document
            preLoadImage: function (url) {
                if (url) {
                    var img = new Image();
                    img.src = url;
                }
            },


            readZipFile: function (file, obj) {
                var found = false;
                // Does the browser support the File API
                if (window.FileReader) {
                    var reader = new FileReader();
                    var d = draggables.internal;

                    reader.onload = function (e) {
                        // Read data into jsunzip
                        var unzipper = new JSUnzip(reader.result);
                        if (unzipper.isZipFile()) {
                            unzipper.readEntries();
                            for (var i = 0; i < unzipper.entries.length; i++) {

                                var entry = unzipper.entries[i];
                                var uncompressed = '';
                                // Look for the first file nemed index.htm or index.html
                                if (entry.fileName.toLowerCase().indexOf('index.htm') > -1) {
                                    if (entry.compressionMethod === 0) {
                                        // Uncompressed
                                        uncompressed = entry.data;
                                    } else if (entry.compressionMethod === 8) {
                                        // Deflated
                                        uncompressed = JSInflate.inflate(entry.data);
                                    }
                                    if (uncompressed !== '') {
                                        // Create a DOM element, but do not append it to document
                                        var div = document.createElement('div');
                                        div.innerHTML = d.parseHtmlBody(uncompressed);

                                        // Parse the microformat from the HTML
                                        var uf = d.parseMicroformats(obj.formats, div);

                                        // Add draggables flag
                                        uf.draggablePackage = true;

                                        if (d.hasSupportedFormat(uf, obj.formats)) {
                                            d.dataHandler(uf, obj);
                                            found = true;
                                        }
                                    }
                                }
                            }
                        }
                    };

                    reader.onerror = function (e) {
                        d.errorHandler('Problem reading the file', 'A problem occurred while reading the file. The error code is: ' + e.target.error.code);
                    };

                    reader.readAsBinaryString(file);
                } else {
                    // Use CORS XHR method
                    this.fileHandler(file, obj);
                }
                return found;
            },


            readHTMLFile: function (file, obj) {
                // Does the browser support the File API
                var found = false;
                if (window.FileReader) {
                    var reader = new FileReader();
                    var d = draggables.internal;

                    reader.onload = function (e) {

                        // Create a DOM element, but do not append it to document
                        var div = document.createElement('div');
                        div.innerHTML = d.parseHtmlBody(e.target.result);

                        // Parse the microformat from the HTML
                        var uf = d.parseMicroformats(obj.formats, div);

                        // Add draggables flag
                        uf.draggablePackage = true;

                        if (d.hasSupportedFormat(uf, obj.formats)) {
                            d.dataHandler(uf, obj);
                            found = true;
                        }
                    };

                    reader.onerror = function (e) {
                        d.errorHandler('Problem reading the file', 'A problem occurred while reading the file. The error code is: ' + e.target.error.code);
                    };

                    reader.readAsText(file);
                } else {
                    // Use CORS XHR method
                    this.fileHandler(file, obj);
                }
                return found;
            },


            // Makes an JSON-P call to UfXtract microformats parser API
            urlHandler: function (url, options) {
                var d = draggables.internal;

                // Construct a one off callback function to pass scope
                var callbackName = 'loadJSON' + Math.floor(Math.random() * 9999999999);

                window[callbackName] = function (json) {
                    if (d.hasSupportedFormat(json, options.formats)) {
                        d.dataHandler(json, options);
                    }
                };

                // Get JSON-P using ufxtract.com microformats parser
                var params = 'url=' + url + '&callback=' + callbackName + '&output=json&format=' + options.formats;
                var head = document.getElementsByTagName("head")[0];
                var script = document.createElement('script');
                script.src = 'http://ufxtract.com/api/?' + params;
                head.appendChild(script);
            },


            // Makes an XHR CORS (Cross domain AJAX) binary POST call to UfXtract microformats parser API
            fileHandler: function (file, options) {

                var xhr = new XMLHttpRequest();

                // Its a IIS server so you have to use file name default.aspx on a POST, but does support CORS
                xhr.open("POST", "http://ufxtract.com/api/default.aspx?format=" + options.formats.join(',') + "&output=json", true);
                xhr.setRequestHeader("Content-Type", "multipart/form-data");

                // Use onload instead of onreadystatechange for CROS
                xhr.onload = function () {
                    var d = draggables.internal;
                    var json = JSON.parse(xhr.responseText);
                    if (d.hasSupportedFormat(json, options.formats)) {
                        d.dataHandler(json, options);
                    }
                };

                xhr.onerror = function (err) {
                    draggables.internal.errorHandler('Sorry', 'There was an error while parsing your file.');
                };

                xhr.send(file);
            },


            // Create file input element for webkit file drag&drop support
            createFileInput: function (element, options) {
                var d = draggables.internal;

                var form = document.createElement("form");
                var fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.setAttribute("multiple", true);
                fileInput.style.position = "absolute";

                this.positionInput(element, fileInput);

                // Set the opacity to 0
                fileInput.style.opacity = 0.01;
                fileInput.style.backgroundColor = '#eee';
                form.appendChild(fileInput);
                document.body.appendChild(form);

                this.addEvent(fileInput, "change", function (e) {
                    d.handleFileInputDrop(e, options, fileInput);
                }, false);

                // Makes the change between object and file functionality
                this.addEvent(document.body, "dragenter", function (e) {
                    d.handleFileInputDrag(e, options, fileInput);
                }, false);

                // Blocks file dialog and stop event bubble issue in Safari
                this.addEvent(fileInput, "click", function (e) {
                    e.preventDefault();
                }, false);

                this.addEvent(window, "resize", function (e) {
                    d.positionInput(element, fileInput);
                }, false);

            },


            positionInput: function (element, fileInput) {
                var pos = this.findPos(element);
                fileInput.style.left = pos[0] + "px";
                fileInput.style.top = pos[1] + "px";
                fileInput.style.width = parseInt(element.offsetWidth, 10) + "px";
                fileInput.style.height = parseInt(element.offsetHeight, 10) + "px";
            },


            // Switch on and off the webkit file input display dependant on object been dragged
            handleFileInputDrag: function (e, options, fileInput) {
                if (e.dataTransfer.types === null) {
                    fileInput.style.display = 'block';
                } else {
                    var files = false;
                    for (i = 0; i <= e.dataTransfer.types.length - 1; i++) {
                        if (e.dataTransfer.types[i] == 'Files')
                            files = true;
                    }
                    if (files)
                        fileInput.style.display = 'block';
                    else
                        fileInput.style.display = 'none';
                }
            },


            // Captures webkit file input drop and sends file data to correct method
            handleFileInputDrop: function (e, options) {
                var files = e.target.files;
                for (var i = 0, len = files.length; i < len; i++) {
                    var file = files[i];

                    if (file.type == "text/html") {
                        this.readHTMLFile(file, options);
                    }

                    // Chrome does not return the correct type fro zip file
                    if (file.type == "application/zip" || file.fileName.toLowerCase().indexOf('.zip') > -1) {
                        this.readZipFile(file, options);
                    }
                }
            },


            // Parses more than one format into a single results set
            parseMicroformats: function (formats, element) {
                var json = { "microformats": {} };
                for (var i = 0; i < formats.length; i++) {
                    // If we have results for format copy them into return object
                    var uf = navigator.microformats.get(formats[i], element);
                    var format = formats[i].toLowerCase();

                    if (format == 'hcard') {
                        format = 'vcard';
                    }
                    if (format == 'hcalendar') {
                        format = 'vevent';
                    }

                    if (uf != undefined && uf.microformats[format]) {
                        json.microformats[format] = uf.microformats[format];
                    }
                }
                return json;
            },



            parseHtmlBody: function (html) {
                var htmllc = html.toLowerCase();
                htmllc = htmllc.replace('< ', '<');

                var start = htmllc.indexOf('<body');
                if (start > -1) {
                    start = htmllc.indexOf('>', start);
                }

                var end = htmllc.indexOf('</body');

                if (start > -1 && end > -1) {
                    html = html.substring(start, end);
                }

                return html;
            },



            // Does the JSON package have any of the supported formats
            hasSupportedFormat: function (json, formats) {

                var found = false;
                if (json.microformats) {
                    for (var i = 0; i < formats.length; i++) {

                        var format = formats[i].toLowerCase();
                        // Allow for both microformat name and top level class name
                        if (format == 'hcard') {
                            format = 'vcard';
                        }

                        if (format == 'hcalendar') {
                            format = 'vevent';
                        }

                        // Find at least one item from a supported format
                        if (json.microformats[format]) {
                            if (json.microformats[format].length > 0) {
                                found = true;
                            }
                        }
                    }
                }
                if (found) {
                    return true;
                } else {
                    this.errorHandler('Sorry', 'Could not find the the right type of data in the dragged object.');
                    return false;
                }
            },


            // Interface for dataHandler
            dataHandler: function (json, options) {
                if (!json.UfErrors) {
                    if (json.microformats) {
                        this.renderMappings(json.microformats, options);
                    }
                } else {
                    if (json.UfErrors.length) {
                        this.errorHandler('Sorry we had a problem understanding the data', json.UfErrors[0]);
                    }
                }
            },


            // Renders the mapping property of the config object
            renderMappings: function (json, options) {

                var maps = options.mappings;

                // Map values into form elements
                if (maps !== undefined) {
                    for (var i = 0; i < maps.length; i++) {
                        var value = this.getStringFromJSON(maps[i][1], json);
                        this.applyMapping(maps[i][0], value);
                    }
                }

                // If string function name was given execute it
                if (options.onDataDrop) {
                    window[options.onDataDrop](json);
                }

            },


            // PUBLIC method
            // Find an element by its decription and applies the value
            applyMapping: function (elementDecription, value) {

                var element = null;
                // Get element from id
                if (document.getElementById(elementDecription)) {
                    element = document.getElementById(elementDecription);
                }

                // Get element from form field name
                if (elementDecription.indexOf('forms[') === 0) {
                    var parts = elementDecription.split('[');
                    parts = parts[1].split(']');
                    var fieldRef = parts[1].replace('.', '');
                    var formRef = parts[0].replace("'", "").replace('"', '');

                    if (document.forms[formRef][fieldRef])
                        element = document.forms[formRef][fieldRef];
                }

                if (element !== null) {
                    switch (element.tagName) {
                        // Add HTML5 element types for date and time if use extends beyond forms                                             

                        case 'INPUT':
                            // Map value into input 
                            element.value = value;
                            break;
                        case 'TEXTAREA':
                            // Map value into textarea
                            element.value = value;
                            break;
                        case 'SELECT':
                            // Map value into select text or value
                            for (var y = 0; y < element.options.length; y++) {
                                if (element.options[y].text.toLowerCase() == value.toLowerCase() || element.options[y].value.toLowerCase() == value.toLowerCase()) {
                                    element.options[y].selected = true;
                                } else {
                                    element.options[y].selected = false;
                                }
                            }
                            break;
                        case 'IMG':
                            // Map value into image src property
                            element.setAttribute('src', value);
                            break;
                        default:
                            // Default
                            if (element.innerHTML) {
                                element.innerHTML = value;
                            }
                            break;
                    }
                }
            },


            // PUBLIC method
            // Gets a value as a string from JSON given path expression ie  'vcard[0].url[0]'
            // Returns a string or null
            getStringFromJSON: function (exp, context) {
                var value = this.getObjectFromJSON(exp, context);
                if (typeof (value) == 'string' || typeof (value) == 'number') {
                    return new String(value);
                } else {
                    return '';
                }
            },

            // PUBLIC method
            // Gets a child object from JSON given path expression ie  'vcard[0].url[0]'
            // Returns a object or null
            getObjectFromJSON: function (exp, context) {
                try {
                    var currentContext = context;
                    var arrayDots = exp.split(".");
                    for (var i = 0; i < arrayDots.length; i++) {
                        if (arrayDots[i].indexOf('[') > -1) {
                            arrayDots[i] = arrayDots[i].replace(/]/g, "");
                            var arrayAB = arrayDots[i].split("[");
                            for (var x = 0; x < arrayAB.length; x++) {
                                if (arrayAB[x] !== null) {
                                    if (arrayAB[x].indexOf("'") > -1) {
                                        currentContext = this.getPropertyArrayItem(arrayAB[x], currentContext);
                                    } else {
                                        currentContext = this.getArrayObject(x, arrayAB, currentContext);
                                    }
                                }
                            }
                        }
                        else {
                            if (currentContext[arrayDots[i]] !== null || currentContext[arrayDots[i]] !== 'undefined')
                                currentContext = currentContext[arrayDots[i]];
                        }
                    }
                } catch (err) {
                    currentContext = null;
                }

                if (typeof currentContext === "function") {
                    currentContext = currentContext.apply(context);
                }

                if (currentContext == 'undefined')
                    currentContext = null;

                return currentContext;
            },


            getArrayObject: function (index, array, currentContext) {
                var arrayName = array[index];
                var arrayPosition = Number(array[index + 1]);
                var output = null;

                if (isNaN(arrayPosition)) {
                    output = this.getPropertyArrayItem(array[index], currentContext);
                } else {
                    if (currentContext[arrayName] !== null && currentContext[arrayName] !== 'undefined') {
                        if (currentContext[arrayName][arrayPosition] !== null && currentContext[arrayName][arrayPosition] !== 'undefined') {
                            output = currentContext[arrayName][arrayPosition];
                            array[index + 1] = null;
                        }
                    }
                }
                return output;
            },

            // Returns a property of an object using the objects property array
            getPropertyArrayItem: function (name, currentContext) {
                name = name.replace(/\'/g, "");
                return currentContext = currentContext[name];
            },







            // Common
            // ---------------------------------------------------------------------


            // Interface for errorHandler
            errorHandler: function (name, msg) {
                alert(name + ' \n' + msg);
            },


            // Gets the left/top position of an element
            findPos: function (obj) {
                var curleft = curtop = 0;
                if (obj.offsetParent) {
                    do {
                        curleft += parseInt(obj.offsetLeft, 10);
                        curtop += parseInt(obj.offsetTop, 10);
                    } while (obj == obj.offsetParent);
                }
                return [curleft, curtop];
            },


            // Cancels the event if it is cancelable, without stopping event bubbling.
            preventDefault: function (e) {
                if (e.preventDefault)
                    e.preventDefault();

                try {
                    e.returnValue = false;
                } catch (ex) {
                    // Do nothing
                }
            },

            // Cancel event bubbling to rest of DOM
            cancelBubble: function (e) {
                if (window.event)
                    window.event.cancelBubble = true;
                else
                    e.stopPropagation();
            },


            // Does an DOM element have an assign class
            hasClass: function (elt, className) {
                return elt.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
            },

            // Add a class to an DOM element
            addClass: function (elt, className) {
                if (!this.hasClass(elt, className)) elt.className += " " + className;
            },

            // Remove a class from an DOM element
            removeClass: function (elt, className) {
                if (this.hasClass(elt, className)) {
                    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                    elt.className = elt.className.replace(reg, ' ');
                }
            },


            // Check for drag and drop event supports
            hasDragDrop: function () {
                var element = document.createElement('div');
                var name = 'ondragstart';
                var isSupported = (name in element);
                if (!isSupported && element.setAttribute) {
                    element.setAttribute(name, 'return;');
                    isSupported = typeof element[name] == 'function';
                }
                element = null;
                return isSupported;
            },


            // Cross browser add event support
            addEvent: function (obj, type, fn) {
                if (obj.attachEvent) {
                    obj['e' + type + fn] = fn;
                    obj[type + fn] = function () { obj['e' + type + fn](window.event); };
                    obj.attachEvent('on' + type, obj[type + fn]);
                } else {
                    obj.addEventListener(type, fn, false);
                }
            },


            // Cross browser remove event support
            removeEvent: function (obj, type, fn) {
                if (obj.detachEvent) {
                    obj.detachEvent('on' + type, obj[type + fn]);
                    obj[type + fn] = null;
                } else {
                    obj.removeEventListener(type, fn, false);
                }
            },

            // Is any object an array
            isArray: function (obj) {
                return obj && !(obj.propertyIsEnumerable('length')) && typeof obj === 'object' && typeof obj.length === 'number';
            },

            // Is any object a string
            isString: function (obj) {
                return typeof (obj) == 'string';
            }

        }

    };

    // Provides abstracted public methods
    var d = draggables;
    var i = d.internal;
    d.getStringFromJSON = function (exp, context) { return draggables.internal.getStringFromJSON(exp, context); };
    d.getObjectFromJSON = function (exp, context) { return draggables.internal.getObjectFromJSON(exp, context); };
    d.applyMapping = function (elementDecription, value) { return draggables.internal.applyMapping(elementDecription, value); };

    i.addEvent(window, 'load', i.initDrop);
}














