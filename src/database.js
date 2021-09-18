const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});

function queryDatabase(query) {
    return new Promise(function (resolve, reject) {
         pool.connect(function(err, client, done) {
              if (err) {
                   reject(err);
              } else {
                   client.query(query, function(error, result) {
                        done();
                        if (error) {
                             reject(error);
                        } else {
                             resolve(result);
                        }
                   });
              }
         });
    });
};

module.exports.queryDatabase = queryDatabase;