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
  try {
    const request = pool.request();
    request.query(`SELECT * FROM UsersMessages WHERE recipientID = \'${recipientID}\' AND senderID = \'${senderID}\'`).then(function (recordSet) {
      console.log(recordSet);
      callback(recordSet);
    }).catch(function (err) {
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
  
  try {
    const request = pool.request();
    const result = request.query(`INSERT INTO UsersMessages (recipientID,senderID,message) VALUES (\'${recipientID}\',\'${senderID}\',\'${message}\')`)
    console.dir(result)
    return result;
  } catch (err) {
      console.error('SQL error', err);
      return err;
  }
}