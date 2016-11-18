
/*
 * GET role page.
 */

var data1 = require('../public/json/data.json');

exports.view = function(req, res){
	console.log(data1);
  res.render('scientist', data1);
};
