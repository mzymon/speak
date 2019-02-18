const sql = require('mssql/msnodesqlv8')

const pool = new sql.ConnectionPool({
  database: 'SpeakDB',
  server: 'localhost',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true
  }
})

pool.connect().then(() => {
  //simple query
  pool.request().query('select * from Users', (err, result) => {
        console.dir(result)
    })
})

module.exports.getUsersMessages=function (recipientID,senderID,callback) {
  console.log(`SELECT * FROM UsersMessages WHERE recipientID = \'${recipientID}\' AND senderID = \'${senderID}\'`)
  //await pool; // ensures that the pool has been created
  try {
    const request = pool.request(); // or: new sql.Request(pool1)
    //const result = 
    request.query(`SELECT * FROM UsersMessages WHERE recipientID = \'${recipientID}\' AND senderID = \'${senderID}\'`).then(function (recordSet) {
      console.log(recordSet);
    //console.dir(result);
     callback(recordSet);
    }).catch(function (err) {
      //8.
      console.log(err);
      pool.close();
  });
  } catch (err) {
      console.error('SQL error', err);
      return err;
  }
}
module.exports.saveUsersMessages=function (recipientID,senderID,message) {
  console.log(`Querry: INSERT INTO UsersMessages (recipientID,senderID,message) VALUES (\'${recipientID}\',\'${senderID}\',\'${message}\')`)
  //await pool; // ensures that the pool has been created
  try {
    const request = pool.request(); // or: new sql.Request(pool1)
    const result = request.query(`INSERT INTO UsersMessages (recipientID,senderID,message) VALUES (\'${recipientID}\',\'${senderID}\',\'${message}\')`)
    console.dir(result)
    return result;
  } catch (err) {
      console.error('SQL error', err);
      return err;
  }
}

//module.exports.saveUsersMessages = saveUsersMessages;
//module.exports.getUsersMessages = getUsersMessages;
console.log("after async");

//module.exports = {sql, pool}