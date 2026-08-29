var express = require('express');
var load = require('express-load');

module.exports = function() {
    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', './fluxy/views');
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use('/static', express.static('./static'));

    load('routes', {cwd: 'app'})
        .then('infra')
        .into(app);

    return app;
};