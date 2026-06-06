import { initDatabase } from './database/index.js';

async function bootstrap() {
  console.log("Project starting up...");
  
  // Fire up the database connection and build tables
  await initDatabase();
  
  console.log("Application pipeline ready!");
}

bootstrap();