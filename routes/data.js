    exports.mapInfo = function(req, res) { 
       //Update mapGraph.json if changed since last GET
       delete require.cache[require.resolve('../public/json/mapGraph.json')];
       var mapdata = require('../public/json/mapGraph.json');
       res.json(mapdata); //Return the rows of mapGraph.json
    }

