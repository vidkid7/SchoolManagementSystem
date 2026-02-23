import dotenv from 'dotenv';
import path from 'path';
import express from 'express';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import Class from '../models/Class.model';
import { Subject } from '../models/Subject.model';
import { sendSuccess } from '../utils/responseFormatter';

const app = express();

app.get('/test/classes', async (_req, res) => {
  try {
    const classes = await Class.findAll({
      order: [['gradeLevel', 'ASC'], ['section', 'ASC']],
      limit: 5
    });
    
    console.log('Classes found:', classes.length);
    console.log('First class:', classes[0]);
    console.log('First class JSON:', JSON.stringify(classes[0]));
    
    sendSuccess(res, classes, 'Classes retrieved');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.get('/test/subjects', async (_req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [['nameEn', 'ASC']],
      limit: 5
    });
    
    console.log('Subjects found:', subjects.length);
    console.log('First subject:', subjects[0]);
    console.log('First subject JSON:', JSON.stringify(subjects[0]));
    
    sendSuccess(res, subjects, 'Subjects retrieved');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

async function start() {
  await sequelize.authenticate();
  console.log('Database connected');
  
  app.listen(3001, () => {
    console.log('Test server running on http://localhost:3001');
    console.log('Test endpoints:');
    console.log('  http://localhost:3001/test/classes');
    console.log('  http://localhost:3001/test/subjects');
  });
}

start();
