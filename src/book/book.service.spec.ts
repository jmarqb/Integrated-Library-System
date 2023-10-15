import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../prisma.service';
import { CommonModule } from '../common/common.module';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';


describe('BookService', () => {
  let service: BookService;

  const mockPrismaService = {
    book: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn()
    }
  }

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn()
  };

  const bookId = 40;
  const validISBN = '978-84-788-7499-6';

  const mockBook = {
    id: bookId,
    name: 'BookName',
    ISBN: validISBN,
    loaned: false,
    readerId: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        BookService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('create', () => {
    //Define a sample CreateBookDto to use for the test
    const createBookDto = {
      name: 'bookName',
      ISBN: validISBN
    };

    it('should create a book succesfully', async () => {
      mockPrismaService.book.create.mockResolvedValue(mockBook);
      const result = await service.create(createBookDto);
      expect(mockPrismaService.book.create).toHaveBeenCalledWith({ data: createBookDto });
      expect(result).toEqual(mockBook);
    });

    it('should throw a BadRequestException for duplicate ISBN error', async () => {
      const mockError = {
        code: 'P2002',
        detail: 'Duplicate ISBN, the element already exists in database.',
      };
      mockPrismaService.book.create.mockRejectedValue(mockError);
      await expect(service.create(createBookDto)).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Duplicate Element.');
    });

    it('should throw an InternalServerErrorException for unknown error', async () => {
      const mockError = {
        code: 'UNKNOWN_ERROR',
        detail: 'Some details about the unknown error',
      };
      mockPrismaService.book.create.mockRejectedValue(mockError);
      await expect(service.create(createBookDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Unknow Error.');
    });

    it('should throw the exact error if it\'s not one of the handled errors', async () => {
      const someError = {
        code: 'AN_UNEXPECTED_ERROR',
        detail: 'UNEXPECTED_ERROR',
      };
      mockPrismaService.book.create.mockRejectedValue(someError);
      await expect(service.create(createBookDto)).rejects.toThrowError('Checks Server logs');
    });

  });

  describe('findAll', () => {
    it('should return a paginated list of books', async () => {
      const mockBooks = [mockBook, mockBook];
      const paginationDto = { limit: 10, offset: 0 };
      mockPrismaService.book.findMany.mockResolvedValue(mockBooks);
      mockPrismaService.book.count.mockResolvedValue(2);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith({
        skip: Number(paginationDto.offset),
        take: Number(paginationDto.limit),
      });
      expect(result).toEqual({
        items: mockBooks,
        total: 2,
        currentPage: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      const result = await service.findOne(validISBN);
      expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({ where: { ISBN: validISBN } });
      expect(result).toEqual(mockBook);
    });

    it('should throw an error if book is not found', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);
      await expect(service.findOne(validISBN)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if there\'s a problem fetching the book', async () => {
      mockPrismaService.book.findUnique.mockRejectedValue(new Error('Database error'));
      await expect(service.findOne(validISBN)).rejects.toThrowError('Checks Server logs');
    });

  });

  describe('update', () => {
    const updateBookDto = { name: 'UpdatedName' };

    it('should update and return the updated book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.update.mockResolvedValue({ ...mockBook, ...updateBookDto });

      const result = await service.update(validISBN, updateBookDto);
      expect(mockPrismaService.book.update).toHaveBeenCalledWith({
        where: { ISBN: mockBook.ISBN },
        data: updateBookDto,
      });
      expect(result).toEqual({ ...mockBook, ...updateBookDto });
    });

    it('should throw an error if there\'s a problem updating the book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.update.mockRejectedValue(new Error('Database error'));
      await expect(service.update(validISBN, updateBookDto)).rejects.toThrowError('Checks Server logs');
    });

  });

  describe('remove', () => {

    it('should remove a book successfully if not loaned', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.delete.mockResolvedValue(mockBook);
      await service.remove(validISBN);
      expect(mockPrismaService.book.delete).toHaveBeenCalledWith({ where: { ISBN: mockBook.ISBN } });
    });

    it('should throw an error if the book is loaned', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({ ...mockBook, loaned: true });
      await expect(service.remove(validISBN))
        .rejects
        .toThrow(new BadRequestException(`The book ${mockBook.name} cannot be deleted because it is currently on loan.`));
      ;
    });

    it('should throw an error if there\'s a problem deleting the book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.delete.mockRejectedValue(new Error('Database error'));
      await expect(service.remove(validISBN)).rejects.toThrowError('Database error');
    });

  });

});
