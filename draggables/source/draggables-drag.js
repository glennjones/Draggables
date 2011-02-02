/*!
    draggables-drag.js 
    http://draggables.com
    Copyright (C) 2011 Glenn Jones. All Rights Reserved. MIT license
    Full source (unminified) can be downloaded from draggables.com
*/
// Please use the minified version of this file (draggables-drag.min.js) for production work



if (!draggables) {

    var draggables = {

        version: 0.1,

        // Takes a configuration object
        addDragItem: function (config) {
            this.internal.dragItems.push(config);
        },


        internal: {
            dragItems: [],
            selectedData: {},

            initDrag: function () {
                // this is scoped to event so use reference
                var d = draggables.internal;

                for (var i = 0; i <= d.dragItems.length - 1; i++) {
                    d.buildDraggable(d.dragItems[i]);
                }

                // Tabs are part of WAI-ARIA support
                // Removes old tab key selections
                d.addEvent(window, 'keypress', function (e) {
                    if (!e) {
                        e = window.event;
                    }
                    // If Tab key is selected
                    if (e.keyCode == 9) {
                        d.removeDragIcons();
                    }
                });

                // Tabs are part of WAI-ARIA support
                // Removes tab key selections when user mouses down on the window
                d.addEvent(window, 'mousedown', function (e) {
                    d.removeDragIcons();
                });

            },



            buildDraggable: function (config) {

                // Does object contain correct data structure
                if (config.dragIcon && config.dataElements !== undefined) {

                    if (!this.isArray(config.dragIcon)) {
                        config.dragIcon = [config.dragIcon];
                    }

                    if (!this.isArray(config.dataElements)) {
                        config.dataElements = [config.dataElements];
                    }

                    if (!this.isArray(config.formats)) {
                        config.formats = [config.formats];
                    }


                    // Create a containing DOM object
                    var wrap = document.createElement("div");
                    for (var y = 0; y <= config.dataElements.length - 1; y++) {
                        // If we are given a string for an element id get the element
                        if (this.isString(config.dataElements[y])) {
                            if (document.getElementById(config.dataElements[y])) {
                                config.dataElements[y] = document.getElementById(config.dataElements[y]);
                                // Clone the element into our containing DOM object
                                wrap.appendChild(config.dataElements[y].cloneNode(true));
                            } else {
                                this.errorHandler('Debug: Sorry could not find the data element', 'Please check you have specfied the HTML element id "' + config.dataElements[y] + '"  correctly');
                            }
                        } else {
                            // Clone the element into our containing DOM object
                            if (config.dataElements[y]) {
                                wrap.appendChild(config.dataElements[y].cloneNode(true));
                            }
                        }
                    }


                    var uf = { 'microformats': {}, 'parser-information': {} };

                    // Convert DOM structure to microformats JSON object
                    for (var x = 0; x <= config.formats.length - 1; x++) {
                        var parse = navigator.microformats.get(config.formats[x], wrap);
                        for (prop in parse.microformats) {
                            uf.microformats[prop] = parse.microformats[prop];
                        }
                        // Add error trapping
                    }


                    // Add source url of metadata
                    uf['parser-information'].page = { 'url': document.location.href };

                    // Add draggables flag
                    uf.draggablePackage = true;

                    // Hook for bookmarklet
                    config.uf = uf;

                    // Add drag events to DOM objects
                    for (var i = 0; i <= config.dragIcon.length - 1; i++) {
                        var icon = config.dragIcon[i];


                        // If we are given a string for an element id get the element
                        if (this.isString(icon)) {
                            if (document.getElementById(icon)) {
                                icon = document.getElementById(icon);
                            } else {
                                this.errorHandler('Debug: Sorry could not find the icon', 'Please check you have specfied the HTML element id "' + icon + '" correctly');
                            }
                        }

                        //Allow user to tab through icons
                        if (!icon.getAttribute('tabindex'))
                            icon.setAttribute('tabindex', '0');


                        // Only add drag events to an img or link elements - IE only supports these element types
                        if (this.hasDragDrop() && (icon.nodeName == 'IMG' || icon.nodeName == 'A')) {


                            // Set individual browser class attribute for  drag and drop
                            if (icon.style.cssText)
                                icon.style.cssText = '-khtml-user-drag: element; -webkit-user-drag: element; -khtml-user-select: none; -webkit-user-select: none;';

                            // Set HTML5 drag and drop attribute
                            icon.setAttribute('draggable', 'draggable');

                            // Set WAI-ARIA drag and drop attribute - false means grabable, but not selected
                            icon.setAttribute('aria-grabbed', 'false');


                            var isImg = false;
                            if (icon.nodeName == 'IMG' && this.isArray(config.dragIconSrc))
                                isImg = true;


                            // Key based selection of drag item
                            // Use keyup as it captures the key event after the focus is past
                            this.addEvent(icon, 'keyup', function (e) {
                                if (!e) {
                                    e = window.event;
                                }

                                // Tab key press while focused on icon
                                if (e.keyCode == 9) {
                                    this.selectedData = uf;

                                    // If dragIconSrc array is given add image source swap
                                    if (isImg)
                                        icon.src = config.dragIconSrc[1];

                                    this.addClass(icon, 'dragIconDown');

                                    // Set WAI-ARIA drag and drop attribute
                                    icon.setAttribute('aria-grabbed', 'true');

                                    this.cancelBubble(e);
                                }

                            });


                            // Fires the build key based drop selector then spacebar is pressed
                            this.addEvent(icon, 'keypress', function (e) {
                                var d = draggables.internal;
                                if (!e) {
                                    e = window.event;
                                }

                                var code;
                                if (e.keyCode) code = e.keyCode;
                                else if (e.which) code = e.which;

                                // Spacebar key press while focused on icon
                                if (code == 32) {
                                    // is icon already selected
                                    if (d.hasClass(icon, 'dragIconDown')) {
                                        d.buildKeyBaseDropSelector(e);
                                    }
                                }
                            });


                            this.addEvent(icon, 'dragstart', function (e) {
                                var d = draggables.internal;
                                // We use move instead of copy because of a bug in Safari 4
                                e.dataTransfer.effectAllowed = 'move';

                                // Use text instead of JSON as IE only supports text data transfers
                                e.dataTransfer.setData('Text', JSON.stringify(uf));

                                d.selectedData = uf;
                                d.addClass(icon, 'dragIconStart');
                                // Set WAI-ARIA drag and drop attribute 
                                icon.setAttribute('aria-grabbed', 'true');
                            });


                            this.addEvent(icon, 'dragend', function (e) {
                                var d = draggables.internal;
                                d.removeClass(icon, 'dragIconStart');
                                d.removeIconSelection(icon, config);
                            });


                            this.addEvent(icon, 'mouseover', function (e) {
                                draggables.internal.addClass(icon, 'dragIconOver');
                            });


                            this.addEvent(icon, 'mouseout', function (e) {
                                draggables.internal.removeClass(icon, 'dragIconOver');
                            });


                            this.addEvent(icon, 'mousedown', function (e) {
                                var d = draggables.internal;
                                // If dragIconSrc array is given, do image source swap
                                if (isImg)
                                    icon.src = config.dragIconSrc[1];

                                d.addClass(icon, 'dragIconDown');
                                // Set WAI-ARIA drag and drop attribute 
                                icon.setAttribute('aria-grabbed', 'true');

                                d.cancelBubble(e);
                            });


                            this.addEvent(icon, 'mouseup', function (e) {
                                draggables.internal.removeIconSelection(icon, config);
                            });


                            //Preload selected image
                            // If dragIconSrc array is given add image source swap
                            if (isImg) {
                                var img = document.createElement('IMG');
                                img.src = config.dragIconSrc[1];
                            }

                            // Display icon if its preset to display = none
                            icon.style.display = 'inline';
                        } else {
                            // Hide icon if drag events are not supported
                            icon.style.display = 'none';
                        }
                    }
                }
            },


            // Loop all icons removing selection
            removeDragIcons: function () {
                for (var i = 0; i <= this.dragItems.length - 1; i++) {
                    var obj = this.dragItems[i];
                    for (var y = 0; y <= obj.dragIcon.length - 1; y++) {
                        var icon = obj.dragIcon[y];
                        this.removeIconSelection(icon, obj);
                    }
                }
            },


            // Removes a icon selection
            removeIconSelection: function (icon, config) {
                // If we are given a string for an element id get the element
                if (this.isString(icon))
                    icon = document.getElementById(icon);

                icon.src = config.dragIconSrc[0];
                this.removeClass(icon, 'dragIconDown');

                // Set WAI-ARIA drag and drop attribute - alse means grabable, but not selected
                icon.setAttribute('aria-grabbed', 'false');
                this.selectedData = {};
                this.removeKeyBaseDropSelector();
            },


            // Interface for key based drop selector, only used in comabined script
            buildKeyBaseDropSelector: function (e) {
                // Add key based accessible here.
                // Not used in window/file to window operation as there is no practical solution.
                // Overriden in draggables-combined.min.js for interanl window drag and drop
            },


            // Interface for key based drop selector removal, only used in comabined script
            removeKeyBaseDropSelector: function () {
                // Add key based accessible here.
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


            hasClass: function (elt, className) {
                return elt.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
            },


            addClass: function (elt, className) {
                if (!this.hasClass(elt, className)) elt.className += " " + className;
            },


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
                } else
                    obj.removeEventListener(type, fn, false);
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

    var d = draggables.internal;
    d.addEvent(window, 'load', d.initDrag);
}





