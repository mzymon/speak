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

module.exports.getUserMessages = function (userID, callback) {
  console.log(`SELECT m.dateTime
              ,m.message
              ,u.username
              FROM SpeakDB.dbo.UsersMessages m
                FULL JOIN  SpeakDB.dbo.Users u on m.senderID = u.userID 
  
              WHERE m.recipientID = \'${userID}\' OR m.senderID = \'${userID}\'`)
  try {
    const request = pool.request();
    request.query(`SELECT m.dateTime
                  ,m.message
                  ,u.username
                  FROM SpeakDB.dbo.UsersMessages m
                    FULL JOIN  SpeakDB.dbo.Users u on m.senderID = u.userID 

                  WHERE m.recipientID = \'${userID}\' OR m.senderID = \'${userID}\'`).then(function (recordSet) {
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
module.exports.getMessagesBetweenUsers = function (recipientID,senderID,callback){
  console.log(`SELECT m.dateTime
              ,m.message
              ,u.username
              FROM SpeakDB.dbo.UsersMessages m
                FULL JOIN  SpeakDB.dbo.Users u on m.senderID = u.userID

              WHERE (m.recipientID = \'${recipientID}\' AND m.senderID = \'${senderID}\') OR (m.recipientID = \'${senderID}\' AND m.senderID = \'${recipientID}\')`)
  try {
    const request = pool.request();
    request.query(`SELECT m.dateTime
                  ,m.message
                  ,u.username
                  FROM SpeakDB.dbo.UsersMessages m
                    FULL JOIN  SpeakDB.dbo.Users u on m.senderID = u.userID

                  WHERE (m.recipientID = \'${recipientID}\' AND m.senderID = \'${senderID}\') OR (m.recipientID = \'${senderID}\' AND m.senderID = \'${recipientID}\')`).then(function (recordSet) {
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
module.exports.saveUsersMessages = function (recipientID, senderID, message) {
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

//for authentication
module.exports.getUserIdCheckingPassword = function (username, password, callback) {
  console.log(`SELECT userID FROM Users WHERE username = \'${username}\' AND password = \'${password}\'`)
  try {
    const request = pool.request();
    request.query(`SELECT userID FROM Users WHERE username = \'${username}\' AND password = \'${password}\'`).then(function (recordSet) {
      console.log(recordSet);
      if (recordSet.recordset.length == 0) {
        var id = 0;
        callback(id);
      }
      else {
        var id = recordSet.recordset[0].userID;
        callback(id);
      }

    }).catch(function (err) {
      console.log(err);
      pool.close();
    });
  } catch (err) {
    console.error('SQL error', err);
    return err;
  }
}

module.exports.getUserId = function (username, callback) {
  console.log(`SELECT userID FROM Users WHERE username = \'${username}\'`)
  try {
    const request = pool.request();
    request.query(`SELECT userID FROM Users WHERE username = \'${username}\'`).then(function (recordSet) {
      console.log(recordSet);
      if (recordSet.recordset.length == 0) {
        var id = 0;
        callback(id);
      }
      else {
        var id = recordSet.recordset[0].userID;
        callback(id);
      }

    }).catch(function (err) {
      console.log(err);
      pool.close();
    });
  } catch (err) {
    console.error('SQL error', err);
    return err;
  }
}