/*! 
hResume
Copyright (C) 2010 Glenn Jones. All Rights Reserved.
License: http://microformatshiv.com/license/
Version 0.2
*/

if (ufShiv) {

    // Keep out of global scope
    (function () {

        var hresume = {
          className: "hresume",
          properties: {
            "contact": {
                datatype: "microformat",
                microformat: "hCard",
                plural: false
            },
            "summary" : {},
            "affiliation" : {
                plural: true,
                datatype: "microformat",
                microformat: "hCard"
            },
            "education" : {
                plural: true,
                datatype: "microformat",
                microformat: "hCalendar"
            },
            "experience" : {
                datatype: "microformat",
                microformat: "hCalendar",
                plural: true
            },
            "skill": {
                plural: true,
                datatype: "microformat",
                microformat: "tag",
                microformat_property: "tag"
            }
          }
        };

        ufShiv.add("hResume", hresume);


    })();
}