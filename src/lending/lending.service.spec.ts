import { Test, TestingModule } from '@nestjs/testing';
import { LendingService } from './lending.service';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('LendingService', () => {
  let service: LendingService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    lending: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    book: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    reader: {
      findUnique: jest.fn(),
    }
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn()
  };

  const mockReader = {
    id: 5,
    name: "readerName"
  };

  const mockBook = {
    id: 6,
    name: 'BookName',
    ISBN: '978-84-788-7499-6',
    loaned: false,
    readerId: null
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LendingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<LendingService>(LendingService);

    mockPrismaService.$transaction.mockReset();
  });

  describe('realizeLending', () => {
    const createLendingDto = {
      bookISBN: mockBook.ISBN,
      readerId: mockReader.id
    };

    const mockRealizedLending = {
      lending: {
        id: 9,
        date: "2023-10-13T10:49:29.211Z",
        bookISBN: "978-84-788-7499-6",
        readerId: 2
      },
      updatedBook: {
        id: 7,
        name: "Marco Aurelio y Roma",
        ISBN: "978-84-788-7499-6",
        loaned: true,
        readerId: 2
      }
    }

    it('should realize lending succesfully', async () => {
      mockPrismaService.lending.create.mockResolvedValue(mockRealizedLending);
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      mockPrismaService.book.update.mockResolvedValue({ ...mockBook, loaned: true, readerId: mockReader.id })
      mockPrismaService.$transaction.mockResolvedValue([mockRealizedLending.lending, mockRealizedLending.updatedBook]);

      const result = await service.realizeLending(createLendingDto);

      expect(mockPrismaService.lending.create).toHaveBeenCalledWith({ data: createLendingDto });
      expect(result).toEqual(mockRealizedLending);

    });

    it('should throw NotFoundException if book does not exist', async () => {
      mockPrismaService.book.findUnique.mockResolvedValueOnce(null);

      await expect(service.realizeLending(createLendingDto)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Book not found in database');
    });

    it('should throw NotFoundException if reader does not exist', async () => {
      mockPrismaService.book.findUnique.mockResolvedValueOnce(mockBook);
      mockPrismaService.reader.findUnique.mockResolvedValueOnce(null);

      await expect(service.realizeLending(createLendingDto)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Reader not found in database');

    });

    it('should throw BadRequestException if book is already loaned', async () => {
      mockPrismaService.book.findUnique.mockResolvedValueOnce({ ...mockBook, loaned: true });

      await expect(service.realizeLending(createLendingDto)).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Book not available');

    });

    it('should throw InternalServerErrorException if transaction fails', async () => {
      mockPrismaService.book.findUnique.mockResolvedValueOnce(mockBook);
      mockPrismaService.reader.findUnique.mockResolvedValueOnce(mockReader);
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction error'));

      await expect(service.realizeLending(createLendingDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Failed to execute transaction.');

    });

  });

  describe('getAllLendings', () => {
    const paginationDto = { limit: 10, offset: 0 };

    const mockLendings = [{
      id: 9,
      date: "2023-10-13T10:49:29.211Z",
      bookISBN: mockBook.ISBN,
      readerId: mockReader.id,
      Book: mockBook,
      Reader: mockReader
    },
    ];

    it('should get all lendings successfully', async () => {
      mockPrismaService.lending.findMany.mockResolvedValue(mockLendings);
      mockPrismaService.lending.count.mockResolvedValue(mockLendings.length);

      const result = await service.getAllLendings(paginationDto);

      expect(result.items).toEqual(mockLendings);
      expect(result.total).toEqual(mockLendings.length);
      expect(result.currentPage).toEqual(1);
      expect(result.totalPages).toEqual(1);
    });

    it('should throw InternalServerErrorException if there is an error', async () => {
      mockPrismaService.lending.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllLendings(paginationDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Failed to fetch lendings.');

    });
  });

  describe('returnBook', () => {
    const lendingId = 9;
    const mockLending = {
      id: lendingId,
      Book: { ...mockBook, loaned: true }
    };

    it('should return book successfully', async () => {
      mockPrismaService.lending.findUnique.mockResolvedValue(mockLending);
      const result = await service.returnBook(lendingId);
      expect(result.message).toBe('Book returned successfully.');
    });

    it('should throw NotFoundException if lending is not found', async () => {
      mockPrismaService.lending.findUnique.mockResolvedValue(null);
      await expect(service.returnBook(lendingId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Lending not found.');

    });

    it('should throw BadRequestException if the book is not currently loaned out', async () => {
      mockPrismaService.lending.findUnique.mockResolvedValue({
        ...mockLending,
        Book: { ...mockBook, loaned: false }
      });
      await expect(service.returnBook(lendingId)).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('The book is not currently loaned out.');
    });

    it('should throw an error if the transaction fails', async () => {
      mockPrismaService.lending.findUnique.mockResolvedValue(mockLending);
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database transaction error'));
      await expect(service.returnBook(lendingId)).rejects.toThrowError('Database transaction error');

    });
  });
});
