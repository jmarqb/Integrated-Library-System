<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Table of Contents
1. [General Info](#general-info)
2. [Technologies](#technologies)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Docker Stack](#docker-stack)
8. [Test](#test)
9. [API Documentation](#api-documentation)
10. [Contact & Follow](#contact-&-follow)

### General Info
***
Integrated Library System API

This project is an API developed to
System for managing a book catalog, tracking loans, and readers.

### Technologies
***
A list of technologies used within the project:

* @nestjs/common (Version 10.0.0): Essential for creating modules, controllers, services, and other basic elements in the NestJS framework.

* @nestjs/config (Version 3.1.1): Part of the NestJS ecosystem, used specifically for configuration management.

* @nestjs/core (Version 10.0.0): Core functionalities and building blocks of the NestJS framework.

* @nestjs/swagger (Version 7.1.13): Integrated to aid in the creation of API documentation and define the structure of the API endpoints.

* @prisma/client (Version 5.4.2): ORM used for smooth operations with MySQL, facilitating database interactions and queries.

* class-validator (Version 0.14.0) and class-transformer (Version 0.5.1): Used in tandem for runtime data validation and transformation, ensuring data integrity.

* jest (Version 29.5.0) with ts-jest (Version 29.1.0) and supertest (Version 6.3.3): Testing utilities for writing unit and end-to-end tests. The combination ensures that the server behaves as expected.

* @testcontainers/mysql (Version 10.2.1): Provides ephemeral instances of MySQL for testing, ensuring that tests are run in a consistent and isolated environment.

* TypeScript (Version 5.1.3): The project is written in TypeScript to ensure type safety and improved readability.

* winston (Version 3.11.0): A logging library for handling logs efficiently and with different transports.

### Prerequisites
***
Before you begin, ensure you have met the following requirements:
* You have installed node.js and npm.
* You have MySQL running.
* Docker and Docker Compose installed(if you prefer to run the application with Docker or to run e2e tests with testcontainers)

## Installation

To install API, follow these steps:

```bash
$ git clone https://github.com/jmarqb/Integrated-Library-System.git --config core.autocrlf=input
$ cd Integrated-Library-System
$ npm install
```

## Configuration

Copy the contents of env-example into a new .env file and update it with your MySQL connection parameters or use the values in the env-example

* Whenever changes are made to the .env file, you must execute:

```
npx prisma generate
```

* Remember, you must have a running instance of MySQL -- another alternative is to use the MySQL container included with the project for local development.
To do this, run:

```
docker-compose -f docker-compose-development-locally.yml up -d
```

* After starting your MySQL instance, proceed to migrate to the database from the Prisma migrations folder.
Make sure that the user you set in the .env file has permissions to perform operations on the database. If so, you can try running the migration as described in the 'Execute Migration' section later on. In case the user doesn't have execution permissions on the database, access the database with the root user and grant permissions to the user.

* If you use the mysql container:

Login with root credentials
```
mysql -h mysql -u root -p
```

```
CREATE USER 'test_user'@'%' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON *.* TO 'test_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Note: `The line CREATE USER 'test_user'@'%' IDENTIFIED BY 'test_password'; might throw the error ERROR 1396 (HY000): Operation CREATE USER failed for 'test_user'@'%. This indicates that the user test_user already exists with the host %. Since it already exists, the CREATE USER command fails, but you can still proceed and grant privileges using the GRANT command, which would be correct. Therefore, it would now be possible to run the migration correctly as described in the next step.`


* Execute Migration:
 npx prisma migrate dev --name `migration_folder_name` 

```
 npx prisma migrate dev --name 20231012112830_init 
 ```

* After the migration is completed, regenerate the client:

```
npx prisma generate
```

## Running the Application

To run Integrated Library System API, use the following command:

```bash
$ npm run build
$ npm run start
```

This will start the server and the application will be available at http://localhost:<your_port>

For Example: `http://localhost:3000/api/doc`


## Docker Stack

If you have Docker and Docker Compose installed, running the application becomes even easier. First, clone the repository and navigate to the project directory:

```bash
$ git clone https://github.com/jmarqb/Integrated-Library-System.git --config core.autocrlf=input
$ cd Integrated-Library-System
$ npm install
```

Copy the contents of env-example into a new .env file and update it with your MySQL connection parameters or use the values in the env-example

* Whenever changes are made to the .env file, you must execute:

```
npx prisma generate
```

* Ensure that the wait-for-it.sh script has execution permissions:

```
chmod +x wait-for-it.sh
```

* To start the application with Docker:

```
docker-compose up --build
```

This will start the server and the application will be available at http://localhost:<your_port>

For Example: `http://localhost:3000/api/doc`

## Test

To ensure everything runs smoothly, this project includes both Unit and Integration tests using the tools Jest and Supertest. To execute them, follow these steps:

Dependency Installation: Before running the tests, ensure you've installed all the project dependencies. If you haven't done so yet, you can install them by executing the command `npm install`.

Unit Tests: To run unit tests on controllers and services, use the following command:

```bash
$ npm run test
```

Integration Tests (e2e): These tests verify the complete flow and functioning of the application. To run them, use the command:

```bash
$ npm run test:e2e
```

It's important to highlight that these e2e tests utilize a Docker testcontainer with a MySQL database. This database is specifically created to test all the application's endpoints and the related database operations. Once the tests are completed, the database is automatically removed.

## API Documentation

You can access the API documentation at `localhost:<port>/api/doc` 
For example, when running the server locally, it will be available at localhost:3000/api/doc

For more detailed information about the endpoints, responses, and status codes, visit the API documentation.

---
## Contact & Follow

Thank you for checking out my project! If you have any questions, feedback or just want to connect, here's where you can find me:

**GitHub**: [jmarqb](https://github.com/jmarqb)

Feel free to [open an issue](https://github.com/jmarqb/Integrated-Library-System/issues) or submit a PR if you find any bugs or have some suggestions for improvements.

© 2023 Jacmel Márquez. All rights reserved.






