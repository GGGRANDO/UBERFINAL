
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '159357996618999Gg@',
    database: 'uber'
  }
});

module.exports = knex;




