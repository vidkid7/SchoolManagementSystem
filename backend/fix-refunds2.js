const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost',port:3306,user:'root',password:'Dhire12345@@',database:'school_management_system'}).then(async conn => {
  const [mun] = await conn.query("SELECT id FROM municipalities WHERE code = 'KMC' LIMIT 1");
  const [sc] = await conn.query("SELECT id FROM school_config WHERE municipality_id = ? LIMIT 1", [mun[0].id]);
  console.log(`municipality_id=${mun[0].id}, school_config_id=${sc[0].id}`);
  await conn.query("UPDATE refunds SET municipality_id = ?, school_config_id = ?", [mun[0].id, sc[0].id]);
  console.log('Updated refunds table');
  await conn.end();
});
