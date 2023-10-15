import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CommonModule } from '../src/common/common.module';
import { BookService } from '../src/book/book.service';
import { PrismaService } from '../src/prisma.service';
import { createBook, createReader, startContainer, stopContainer } from './test-helpers';

describe('BookController (e2e)', () => {
    let client;
    let app: INestApplication;

    beforeAll(async () => {
        jest.setTimeout(60000);

        client = await startContainer();
        console.log(client);
        process.env.DATABASE_URL = client;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                CommonModule
            ],
            providers: [BookService, PrismaService]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    }, 60000);

    describe('/book (POST)', () => {
        it('should create a book', async () => {
            const response = await createBook(app);
            expect(response.status).toBe(201);
            expect(response.createdEntity).toHaveProperty('id')
            expect(response.createdEntity).toHaveProperty('name')
            expect(response.createdEntity).toHaveProperty('ISBN')
            expect(response.createdEntity).toHaveProperty('loaned')
            expect(response.createdEntity).toHaveProperty('readerId')
        });

        it('should BadRequest required a valid name', async () => {
            await request(app.getHttpServer())
                .post('/book')
                .send({
                    'ISBN': '978-84-673-2431-0'
                })
                .expect(400)
        });
        it('should BadRequest required a ISBN', async () => {
            await request(app.getHttpServer())
                .post('/book')
                .send({
                    'name': 'bookName'
                })
                .expect(400)
        });

        it('should BadRequest required a valid ISBN', async () => {
            await request(app.getHttpServer())
                .post('/book')
                .send({
                    'name': 'bookName',
                    'ISBN': '978-84-673-2431-'
                })
                .expect(400)
        });

        it('should BadRequest if name have metacharacter', async () => {
            await request(app.getHttpServer())
                .post('/book')
                .send({
                    'name': 'book[/name',
                    'ISBN': '978-84-673-2431-0'
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Syntax Error: not allowed characters')
                })
        });

        it('should not allow duplicated books', async () => {
            //first book
            const book1 = await createBook(app);

            //second book
            await request(app.getHttpServer())
                .post('/book')
                .send({
                    'name': 'bookName',
                    'ISBN': book1.createdEntity.ISBN
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Duplicate ISBN, the element already exists in database')
                });
        });

    });

    describe('/book (GET)', () => {
        it('should respond with paginated books', async () => {
            await createBook(app);
            await request(app.getHttpServer())
                .get('/book')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('items');
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('currentPage');
                    expect(res.body).toHaveProperty('totalPages');

                    expect(res.body.items).toBeInstanceOf(Array);
                    expect(res.body.items[0]).toHaveProperty('id');
                    expect(res.body.items[0]).toHaveProperty('name');
                    expect(res.body.items[0]).toHaveProperty('ISBN');
                    expect(res.body.items[0]).toHaveProperty('loaned');
                    expect(res.body.items[0]).toHaveProperty('readerId');
                });
        });

        it('should respond with an array of books', async () => {
            await request(app.getHttpServer())
                .get('/book')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toBeInstanceOf(Array);
                });
        });

        it('should respect the limit and offset parameters', async () => {

            for (let i = 0; i <= 11; i++) {
                //create a book in database
                await createBook(app);
            }

            await request(app.getHttpServer())
                .get('/book?limit=5&offset=5')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBe(5);
                });
        });

        it('should respect the provided limit', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/book?limit=${limit}`)
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(limit);
        });

        it('should respect the provided offset', async () => {
            for (let i = 0; i <= 11; i++) {
                //create a book in database
                await createBook(app);
            }

            const limit = 5;
            const offset = 5;

            const firstResponse = await request(app.getHttpServer())
                .get(`/book?limit=${limit}&offset=${offset}`)
                .expect(200);

            const secondResponse = await request(app.getHttpServer())
                .get(`/book?limit=${limit}&offset=${offset + limit}`)
                .expect(200);

            expect(firstResponse.body.items[0].id).not.toBe(secondResponse.body.items[0].id);
        });

        it('should return the correct total count and pages', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/book?limit=${limit}`)
                .expect(200);

            expect(response.body.total).toBeDefined();
            expect(response.body.totalPages).toBeDefined();
            expect(response.body.totalPages).toBe(Math.ceil(response.body.total / limit));
        });

        it('should use default values if limit and offset are not provided', async () => {
            const response = await request(app.getHttpServer())
                .get('/book')
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(10); // default limit
            expect(response.body.currentPage).toBe(1); // default page
        });
    });

    describe('/book/:id (GET)', () => {
        it('should retrieve a book by its ISBN', async () => {
            //create a book in database
            const response = await createBook(app);

            await request(app.getHttpServer())
                .get(`/book/${response.createdEntity.ISBN}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.id).toBe(response.createdEntity.id);
                    expect(res.body).toHaveProperty('name');
                    expect(res.body).toHaveProperty('ISBN');
                    expect(res.body).toHaveProperty('loaned');
                    expect(res.body).toHaveProperty('readerId');
                });
        });

        it('should return bad request if id is not a valid ISBN', async () => {
            const invalidISBN = 'some-invalidISBN';
            await request(app.getHttpServer())
                .get(`/book/${invalidISBN}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Invalid ISBN');
                });
        });

        it('should return not found if book does not exist', async () => {
            const nonExistingbookISBN = '978-84-942448-0-3'; //This ISBN not EXists
            await request(app.getHttpServer())
                .get(`/book/${nonExistingbookISBN}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe('Element not found in database.');
                });
        });
    });

    describe('/book/:id (PATCH)', () => {

        it('should return bad request if id is not a valid ISBN', async () => {
            const invalidISBN = 'some-invalidISBN';
            await request(app.getHttpServer())
                .patch(`/book/${invalidISBN}`)
                .send({
                    "name": "UpdatedBook",
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Invalid ISBN');
                });
        });
        it('should return bad request if ISBN in the request body is not a valid ISBN', async () => {
            const validISBN = '978-84-942448-0-3';
            await request(app.getHttpServer())
                .patch(`/book/${validISBN}`)
                .send({
                    "name": "UpdatedBook",
                    "ISBN": `invalidISBN`
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message[0]).toBe('ISBN must be an ISBN');
                });
        });

        it('should return not found if book does not exist', async () => {
            const nonExistingBookId = '978-84-942448-0-3'; //This ISBN not EXists
            await request(app.getHttpServer())
                .patch(`/book/${nonExistingBookId}`)
                .send({
                    "name": "UpdateBook",
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe('Element not found in database.');
                });
        });

        it('should Updated Book', async () => {
            //create a Book
            const response = await createBook(app);
            await request(app.getHttpServer())
                .patch(`/book/${response.createdEntity.ISBN}`)
                .send({
                    "name": "UpdateBook",
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('name');
                    expect(res.body).toHaveProperty('ISBN');
                    expect(res.body).toHaveProperty('loaned');
                    expect(res.body).toHaveProperty('readerId');
                });
        });
    });

    describe('/book/:id (DELETE)', () => {
        it('should return bad request if id is not a valid ISBN', async () => {
            const invalidISBN = 'some-invalidISBN';
            await request(app.getHttpServer())
                .delete(`/book/${invalidISBN}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Invalid ISBN');
                });
        });

        it('should return not found if book does not exist', async () => {
            const nonExistingbookISBN = '978-84-942448-0-3'; //This ISBN not EXists
            await request(app.getHttpServer())
                .delete(`/book/${nonExistingbookISBN}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe('Element not found in database.');
                });
        });

        it('should return message cannot delete if book is loaned', async () => {
            const book = await createBook(app);
            const reader = await createReader(app);

            await request(app.getHttpServer())
                .post(`/lending`)
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader.createdEntity.id
                })
                .expect(201);  //expecting the lending to be successful.

            //delete the loaned book.
            await request(app.getHttpServer())
                .delete(`/book/${book.createdEntity.ISBN}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe(`The book ${book.createdEntity.name} cannot be deleted because it is currently on loan.`);
                    expect(res.body.error).toBe(`Bad Request`);
                });
        });

        it('should remove book succesfully', async () => {
            const book = await createBook(app);
            await request(app.getHttpServer())
                .delete(`/book/${book.createdEntity.ISBN}`)
                .expect(200);
        });


    });

    afterEach(async () => {
        const prismaService: PrismaService = app.get(PrismaService);
        await prismaService.lending.deleteMany();
        await prismaService.book.deleteMany();
        await prismaService.reader.deleteMany();
    });

    afterAll(async () => {
        await stopContainer();
    });
});
