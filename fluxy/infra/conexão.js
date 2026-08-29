var mysql = require('mysql2');

var connectMYSQL = function() {
    console.log("Conectando ao MySQL...");
    return mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'livraria'
    });
};

module.exports = function() {
    return connectMYSQL;
};