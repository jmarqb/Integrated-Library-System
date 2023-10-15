import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CommonModule } from '../src/common/common.module';
import { ReaderService } from '../src/Reader/Reader.service';
import { PrismaService } from '../src/prisma.service';
import { createBook, createReader, startContainer, stopContainer } from './test-helpers';

describe('ReaderController (e2e)', () => {
    let client;
    let app: INestApplication;

    beforeAll(async () => {
        jest.setTimeout(60000);

        client = await startContainer();
        process.env.DATABASE_URL = client;


        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                CommonModule
            ],
            providers: [ReaderService, PrismaService]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    }, 60000);

    describe('/reader (POST)', () => {
        it('should create a reader', async () => {
            const response = await createReader(app);
            expect(response.status).toBe(201);
            expect(response.createdEntity).toHaveProperty('id')
            expect(response.createdEntity).toHaveProperty('name')
        });

        it('should BadRequest required a valid name', async () => {
            await request(app.getHttpServer())
                .post('/reader')
                .send({
                    'name': ''
                })
                .expect(400)
        });

        it('should BadRequest if name have metacharacter', async () => {
            await request(app.getHttpServer())
                .post('/reader')
                .send({
                    'name': 'reader[/name',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Syntax Error: not allowed characters')
                })
        });

    });

    describe('/reader (GET)', () => {
        it('should respond with paginated readers', async () => {
            await createReader(app);
            await request(app.getHttpServer())
                .get('/reader')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('items');
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('currentPage');
                    expect(res.body).toHaveProperty('totalPages');

                    expect(res.body.items).toBeInstanceOf(Array);
                    expect(res.body.items[0]).toHaveProperty('id');
                    expect(res.body.items[0]).toHaveProperty('name');
                });
        });

        it('should respond with an array of readers', async () => {
            await request(app.getHttpServer())
                .get('/reader')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toBeInstanceOf(Array);
                });
        });

        it('should respect the limit and offset parameters', async () => {

            for (let i = 0; i <= 11; i++) {
                //create a reader in database
                await createReader(app);
            }

            await request(app.getHttpServer())
                .get('/reader?limit=5&offset=5')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBe(5);
                });
        });

        it('should respect the provided limit', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/reader?limit=${limit}`)
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(limit);
        });

        it('should respect the provided offset', async () => {
            for (let i = 0; i <= 11; i++) {
                //create a reader in database
                await createReader(app);
            }

            const limit = 5;
            const offset = 5;

            const firstResponse = await request(app.getHttpServer())
                .get(`/reader?limit=${limit}&offset=${offset}`)
                .expect(200);

            const secondResponse = await request(app.getHttpServer())
                .get(`/reader?limit=${limit}&offset=${offset + limit}`)
                .expect(200);

            expect(firstResponse.body.items[0].id).not.toBe(secondResponse.body.items[0].id);
        });

        it('should return the correct total count and pages', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/reader?limit=${limit}`)
                .expect(200);

            expect(response.body.total).toBeDefined();
            expect(response.body.totalPages).toBeDefined();
            expect(response.body.totalPages).toBe(Math.ceil(response.body.total / limit));
        });

        it('should use default values if limit and offset are not provided', async () => {
            const response = await request(app.getHttpServer())
                .get('/reader')
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(10); // default limit
            expect(response.body.currentPage).toBe(1); // default page
        });
    });

    describe('/reader/:id (GET)', () => {
        it('should retrieve a reader by its Id', async () => {
            //create a reader in database
            const response = await createReader(app);

            await request(app.getHttpServer())
                .get(`/reader/${response.createdEntity.id}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.id).toBe(response.createdEntity.id);
                    expect(res.body).toHaveProperty('name');
                });
        });

        it('should return bad request if id is not a valid Id', async () => {
            const invalidId = 'some-invalidId';
            await request(app.getHttpServer())
                .get(`/reader/${invalidId}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Validation failed (numeric string is expected)');
                });
        });

        it('should return not found if reader does not exist', async () => {
            const nonExistingreaderId = 0; //This Id not EXists
            await request(app.getHttpServer())
                .get(`/reader/${nonExistingreaderId}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe('Reader not found in database.');
                });
        });
    });

    describe('/reader/:id (PATCH)', () => {

        it('should return bad request if id is not a valid Id', async () => {
            const invalidId = 'some-invalidId';
            await request(app.getHttpServer())
                .patch(`/reader/${invalidId}`)
                .send({
                    "name": "Updatedreader",
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe('Bad Request');
                    expect(res.body.message).toBe('Validation failed (numeric string is expected)');
                });
        });


        it('should return not found if reader does not exist', async () => {
            const nonExistingreaderId = 0; //This Id not EXists
            await request(app.getHttpServer())
                .patch(`/reader/${nonExistingreaderId}`)
                .send({
                    "name": "Updatereader",
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe('Reader not found in database.');
                });
        });

        it('should Updated reader', async () => {
            //create a reader
            const response = await createReader(app);
            await request(app.getHttpServer())
                .patch(`/reader/${response.createdEntity.id}`)
                .send({
                    "name": "Updatereader",
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('name');
                });
        });
    });

    describe('/reader/:id (DELETE)', () => {

        it('should delete the reader when no books are checked out', async () => {
            const reader = await createReader(app);

            await request(app.getHttpServer())
                .delete(`/reader/${reader.createdEntity.id}`)
                .expect(200);

            await request(app.getHttpServer())
                .get(`/reader/${reader.createdEntity.id}`)
                .expect(404);
        });

        it('should not delete the reader when books are checked out and return appropriate message', async () => {
            const reader = await createReader(app);
            const book = await createBook(app);

            await request(app.getHttpServer())
                .post(`/lending`)
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader.createdEntity.id
                })
                .expect(201);

            const response = await request(app.getHttpServer())
                .delete(`/reader/${reader.createdEntity.id}`)
                .expect(400);

            expect(response.body.message).toBe(`The reader cannot be deleted as they have books checked out. They must return them first.`);
        });

        it('should handle error if reader does not exist', async () => {
            await request(app.getHttpServer())
                .delete('/reader/0') // Assuming "0" is an invalid ID
                .expect(404)
                .expect(res => {
                    expect(res.body.error).toBe('Not Found');
                });
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
    })
});