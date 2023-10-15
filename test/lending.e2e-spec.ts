import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CommonModule } from '../src/common/common.module';
import { createBook, createReader, generateRandomISBN13, startContainer, stopContainer } from './test-helpers';
import { LendingService } from '../src/lending/lending.service';
import { PrismaService } from '../src/prisma.service';


describe('LendingController (e2e)', () => {

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
            providers: [LendingService, PrismaService]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    }, 60000);


    describe('/lending (POST)', () => {
        it('should realize a lending successfully', async () => {
            const reader = await createReader(app);
            const book = await createBook(app);

            await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader.createdEntity.id
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.lending).toHaveProperty('id');
                    expect(res.body.lending.bookISBN).toBe(book.createdEntity.ISBN);
                    expect(res.body.lending.readerId).toBe(reader.createdEntity.id);
                    expect(res.body.updatedBook.loaned).toBe(true);
                    expect(res.body.updatedBook.readerId).toBe(reader.createdEntity.id);
                });
        });

        it('should not allow lending of an already loaned book', async () => {
            const reader1 = await createReader(app);
            const reader2 = await createReader(app);
            const book = await createBook(app);

            // First lending with reader 1
            await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader1.createdEntity.id
                })
                .expect(201);

            // try lending with the reader 2
            await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader2.createdEntity.id
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Book not available');
                });
        });

        it('should return error when the book does not exist', async () => {
            const reader = await createReader(app);

            await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: '978-84-667-6349-3', //non-existing-isbn
                    readerId: reader.createdEntity.id
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe('Book not found in database');
                });
        });

        it('should return error when the reader does not exist', async () => {
            const book = await createBook(app);

            await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: 0
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe('Reader not found in database');
                });
        });

        it('should return error when the readerId or bookISBN are not provided', async () => {
            await request(app.getHttpServer())
                .post('/lending')
                .send({})
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('readerId should not be empty');
                    expect(res.body.message).toContain('bookISBN should not be empty');
                });
        });

    });

    describe('/lending (GET)', () => {
        it('should get all lendings with pagination', async () => {
            await request(app.getHttpServer())
                .get('/lending?limit=5&offset=0')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('items');
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('currentPage');
                    expect(res.body).toHaveProperty('totalPages');
                });
        });

        it('should return an empty array when there are no lendings', async () => {
            await request(app.getHttpServer())
                .get('/lending')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toBeInstanceOf(Array);
                    expect(res.body.items.length).toBe(0);
                    expect(res.body.total).toBe(0);
                });
        });

        it('should paginate lendings correctly', async () => {
            const book1 = await createBook(app);
            const book2 = await createBook(app);
            const reader = await createReader(app);

            //Adding lendings
            await request(app.getHttpServer())
                .post('/lending')
                .send({ bookISBN: book1.createdEntity.ISBN, readerId: reader.createdEntity.id })
                .expect(201);

            await request(app.getHttpServer())
                .post('/lending')
                .send({ bookISBN: book2.createdEntity.ISBN, readerId: reader.createdEntity.id })
                .expect(201);

            // Pagination Test:
            await request(app.getHttpServer())
                .get('/lending?limit=1&offset=0')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBe(1);
                    expect(res.body.total).toBe(2);
                });

            await request(app.getHttpServer())
                .get('/lending?limit=1&offset=1')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBe(1);
                    expect(res.body.total).toBe(2);
                });
        });

        it('should use default values if limit and offset are not provided', async () => {
            await request(app.getHttpServer())
                .get('/lending')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBeLessThanOrEqual(10);
                    expect(res.body.currentPage).toBe(1);
                });
        });
    });

    describe('/lending/:id (PATCH)', () => {
        it('should return a book successfully', async () => {
            const reader = await createReader(app);
            const book = await createBook(app);

            const lendingResponse = await request(app.getHttpServer())
                .post('/lending')
                .send({
                    bookISBN: book.createdEntity.ISBN,
                    readerId: reader.createdEntity.id
                });

            await request(app.getHttpServer())
                .patch(`/lending/${lendingResponse.body.lending.id}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Book returned successfully.');
                });
        });
        it('should return NotFound for a non-existent lending ID', async () => {
            const nonExistingLendingId = 0;
            await request(app.getHttpServer())
                .patch(`/lending/${nonExistingLendingId}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe('Not Found');
                    expect(res.body.message).toBe(`Lending with ID ${nonExistingLendingId} not found.`);
                });
        });
    });
    afterEach(async () => {
        const prismaService: PrismaService = app.get(PrismaService);
        await prismaService.lending.deleteMany();
        await prismaService.book.deleteMany();
        await prismaService.reader.deleteMany();
    })
    afterAll(async () => {
        await stopContainer();
    })

});