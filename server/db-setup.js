import mysql from "mysql2/promise";
import "dotenv/config";

const setup = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query("CREATE DATABASE IF NOT EXISTS lrnr");
    console.log("Database lrnr ready");

    await connection.query("USE lrnr");

    // USER table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS USER (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        admin TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        flagged TINYINT(1) DEFAULT 0
      )
    `);
    console.log("USER table ready");

    // ITEM table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ITEM (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(100) NOT NULL,
        description TEXT,
        starting_bid DECIMAL(10, 2) NOT NULL,
        current_bid DECIMAL(10, 2) DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        seller_id INT NOT NULL,
        FOREIGN KEY (seller_id) REFERENCES USER(user_id),
        flagged TINYINT(1) DEFAULT 0,
        image VARCHAR(500) DEFAULT NULL
      )
    `);
    console.log("ITEM table ready");

    // BID table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS BID (
        bid_id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        bidder_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES ITEM(item_id),
        FOREIGN KEY (bidder_id) REFERENCES USER(user_id)
      )
    `);
    console.log("BID table ready");

    // MESSAGE table 
    await connection.query(`
      CREATE TABLE IF NOT EXISTS MESSAGE (
        message_id   INT AUTO_INCREMENT PRIMARY KEY,
        item_id      INT NOT NULL,
        sender_id    INT NOT NULL,
        recipient_id INT NOT NULL,
        body         TEXT NOT NULL,
        type         ENUM('admin', 'buyer') NOT NULL DEFAULT 'buyer',
        is_read      TINYINT(1) DEFAULT 0,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id)      REFERENCES ITEM(item_id),
        FOREIGN KEY (sender_id)    REFERENCES USER(user_id),
        FOREIGN KEY (recipient_id) REFERENCES USER(user_id)
      )
    `);
  console.log("MESSAGE table ready");
 
  // REPORT table 
  await connection.query(`
    CREATE TABLE IF NOT EXISTS REPORT (
      report_id         INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id       INT NOT NULL,
      reported_user_id  INT,
      reported_item_id  INT,
      reason            TEXT NOT NULL,
      type              ENUM('user', 'item') NOT NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id)      REFERENCES USER(user_id),
      FOREIGN KEY (reported_user_id) REFERENCES USER(user_id),
      FOREIGN KEY (reported_item_id) REFERENCES ITEM(item_id)
    )
  `);
  console.log("REPORT table ready");

  // await connection.query(`SET GLOBAL event_scheduler = ON`);

  // await connection.query(`
  //   CREATE EVENT IF NOT EXISTS close_expired_auctions 
  //   ON SCHEDULE EVERY 1 MINUTE
  //   DO
  //       UPDATE ITEM SET status = 'inactive'
  //       WHERE status = 'active' AND end_date <= NOW();
  // `);
  //   console.log('close_expired_auctions event ready'); 

  
    console.log("Database setup complete");
    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

setup();