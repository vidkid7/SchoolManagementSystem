const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost',port:3306,user:'root',password:'Dhire12345@@',database:'school_management_system'}).then(async conn => {
  const [tables] = await conn.query("SHOW TABLES LIKE '%school%'");
  console.log('school tables:', tables.map(t => Object.values(t)[0]).join(', '));
  const [mun] = await conn.query("SHOW TABLES LIKE '%munic%'");
  console.log('mun tables:', mun.map(t => Object.values(t)[0]).join(', '));
  const [info] = await conn.query("SELECT id, municipality_id FROM school_informations LIMIT 1").catch(() => conn.query("SELECT 1 as id, 1 as municipality_id"));
  console.log('school info:', JSON.stringify(info[0]));
  await conn.end();
});
