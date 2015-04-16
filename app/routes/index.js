module.exports = function (app, config) {
  app.get('/*', function(req, res) {
  	res.sendFile(__dirname + '/../public/views/index.html');
  });
}
