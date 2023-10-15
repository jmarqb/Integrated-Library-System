const path = require('path');
const fs = require('fs');
import { PrismaClient } from "@prisma/client";
import { MySqlContainer } from "@testcontainers/mysql";
import * as request from 'supertest';

let sqlContainer;
let mysqlUri;
let username = 'user_test';
let password = 'user_password';
let database = 'test_library';

export async function startContainer() {
  if (!sqlContainer) { // Only start the container if not yet executed
    console.log('Starting MySqlContainer container...');

    // set up container configuration
    sqlContainer = await new MySqlContainer('mysql:8.0').withUsername(username)
      .withUserPassword(password)
      .withRootPassword(password)
      .withDatabase(database)
      .start();
    expect(sqlContainer.getConnectionUri()).toEqual(
      `mysql://${username}:${password}@${sqlContainer.getHost()}:${sqlContainer.getPort()}/${database}`
    );

    // Override the DATABASE_URL to point => test container
    process.env.DATABASE_URL = `mysql://${username}:${password}@${sqlContainer.getHost()}:${sqlContainer.getPort()}/${database}`
    mysqlUri = process.env.DATABASE_URL;

    const prismaClient = new PrismaClient();

    // Load and execute migration SQL to establish the test database structure
    const migrationFilePath = path.join(__dirname, '..', 'prisma', 'migrations', '20231012112830_init', 'migration.sql');
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');

    const sqlStatements = sqlContent.trim().split(';').filter(stmt => stmt.trim() !== "");

    for (const stmt of sqlStatements) {
      await prismaClient.$executeRawUnsafe(stmt);
    }

    await prismaClient.$disconnect();

    return mysqlUri;
  } else {
    console.log('MySqlContainer container already running.');
    return mysqlUri;
  }
}

//stop-container
export async function stopContainer() {
  if (sqlContainer) {
    await sqlContainer.stop();
    sqlContainer = null; // Clean the instance after stop 
    console.log('Container stopped.');
  }
}

//Helper function to create an entity using a POST request
export async function createEntity(app, url: string, data: any) {
  let createdEntity;
  let status;

  await request(app.getHttpServer())
    .post(url)
    .send(data)
    .expect((res) => {
      createdEntity = res.body;
      status = res.statusCode;
    });

  return { createdEntity, status };
}

//Helper function to create an entity book
export async function createBook(app) {
  const data = {
    'name': `book${new Date().getTime()}`,
    'ISBN': (await generateRandomISBN13()).toString()
  };
  return createEntity(app, '/book', data);
}

//Helper function to create an entity book
export async function createReader(app) {
  const data = {
    'name': `book${new Date().getTime()}`,
  };
  return createEntity(app, '/reader', data);
}

//generate ramdon ISBN13
export async function generateRandomISBN13() {
  // Take a random prefix between 978 and 979
  const prefix = Math.random() < 0.5 ? '978' : '979';
  // Create  ramdonly the 12 first digits 
  let isbn = prefix + Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  // Calculate the control digit
  const checkDigit = computeCheckDigit(isbn);
  return isbn + checkDigit;
}

//Compute the check digit for a given ISBN-12 number.
function computeCheckDigit(isbn12) {
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn12[i], 10);
    if (i % 2 === 0) { //par position
      sum += digit;
    } else { //impar position
      sum += 3 * digit;
    }
  }
  const remainder = sum % 10;
  return remainder === 0 ? '0' : (10 - remainder).toString();
}

// export async function createLending(app) {
//     const category = await createCategory(app);
//     const data = {
//       'name': `product${new Date().getTime()}`,
//       "sizes": ["XL", "l"],
//       "gender": "unisex",
//       "categoryId": category.createdEntity._id
//     };
//     return createEntity(app, '/product', data);
// }