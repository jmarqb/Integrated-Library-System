import { Test, TestingModule } from '@nestjs/testing';
import { LendingController } from './lending.controller';
import { LendingService } from './lending.service';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('LendingController', () => {
  let controller: LendingController;

  const mockLendingService = {
    realizeLending: jest.fn(),
    getAllLendings: jest.fn(),
    returnBook: jest.fn()
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LendingController],
      providers: [LendingService],
    })
      .overrideProvider(LendingService).useValue(mockLendingService)
      .compile();

    controller = module.get<LendingController>(LendingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('realizeLending', () => {
    const dto = {
      bookISBN: "978-84-673-2431-0",
      readerId: 2
    };

    const mockLending = {
      lending: {
        id: 1,
        date: "2023-10-12T19:46:19.680Z",
        bookISBN: dto.bookISBN,
        readerId: dto.readerId
      },
      updatedBook: {
        id: 7,
        name: "Marco Aurelio y Roma",
        ISBN: dto.bookISBN,
        loaned: true,
        readerId: dto.readerId
      }
    }

    it('should be realize a lending', async () => {

      mockLendingService.realizeLending.mockResolvedValue(mockLending);

      const result = await controller.realizeLending(dto);

      // Verify if the function realizeLending was called with a valid dto
      expect(mockLendingService.realizeLending).toHaveBeenCalledWith(dto);

      //Check the returned value
      expect(result).toEqual({
        lending: {
          id: 1,
          date: "2023-10-12T19:46:19.680Z",
          bookISBN: dto.bookISBN,
          readerId: dto.readerId
        },
        updatedBook: {
          id: 7,
          name: "Marco Aurelio y Roma",
          ISBN: dto.bookISBN,
          loaned: true,
          readerId: dto.readerId
        }
      });
    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new InternalServerErrorException('Failed to execute transaction'));
      await expect(controller.realizeLending(dto)).rejects.toThrow(InternalServerErrorException);
    });

    //Handling Error 404 NotFoundtException - not found book
    it('should throw an error 404 when book not exists in database', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new NotFoundException('Book not found in database'));
      await expect(controller.realizeLending(dto)).rejects.toThrow(NotFoundException);
    });
    //Handling Error 404 NotFoundtException - not found reader
    it('should throw an error 404 when reader not exists in database', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new NotFoundException('Reader not found in database'));
      await expect(controller.realizeLending(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error 400 when book not available', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new BadRequestException('Book not available'));
      await expect(controller.realizeLending(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw an error 400 invalidbookISBN', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new BadRequestException('bookISBN must be an ISBN'));
      await expect(controller.realizeLending({ bookISBN: 'invalidISBN', readerId: 2 })).rejects.toThrow(BadRequestException);
    });

    it('should throw an error 400 invalid Reader Id', async () => {
      mockLendingService.realizeLending.mockRejectedValue(new BadRequestException('readerId must be an integer number'));
      await expect(controller.realizeLending({ bookISBN: dto.bookISBN, readerId: +'invalidReaderId' })).rejects.toThrow(BadRequestException);
    });

  });

  describe('getAllLendings', () => {

    mockLendingService.getAllLendings.mockResolvedValue({
      items: ['id', 'date', 'bookISBN', 'readerId', 'Book', 'Reader'],
      total: 10,
      currentPage: 1,
      totalPages: 5
    });

    it('should be return Array of lendings and paginated data', async () => {
      const pagDto = {
        limit: 10,
        offset: 0
      };

      await controller.getAllLendings(pagDto);

      // Verify if the function create was called with a valid dto
      expect(mockLendingService.getAllLendings).toHaveBeenCalledWith(pagDto);

      //Check the value returned
      await expect(controller.getAllLendings(pagDto)).resolves.toEqual({
        items: ['id', 'date', 'bookISBN', 'readerId', 'Book', 'Reader'],
        total: 10,
        currentPage: 1,
        totalPages: 5
      });
    });

    it('should return an empty list when no lendings are present', async () => {

      mockLendingService.getAllLendings.mockResolvedValue({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });

      const pagDto = {
        limit: 10,
        offset: 0
      };

      await expect(controller.getAllLendings(pagDto)).resolves.toEqual({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });
    });

  });

  describe('returnBook', () => {

    const validLendingId = 1;
    const invalidLendingId = 999;

    it('should successfully return a book', async () => {
      mockLendingService.returnBook.mockResolvedValue({ message: 'Book returned successfully.' });

      const response = await controller.returnBook(validLendingId.toString());
      expect(response).toEqual({ message: 'Book returned successfully.' });
      expect(mockLendingService.returnBook).toHaveBeenCalledWith(validLendingId);
    });

    it('should throw NotFoundException for an invalid lending ID', async () => {
      mockLendingService.returnBook.mockRejectedValue(new NotFoundException(`Lending with ID ${invalidLendingId} not found.`));

      await expect(controller.returnBook(invalidLendingId.toString())).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the book is not loaned', async () => {
      mockLendingService.returnBook.mockRejectedValue(new BadRequestException(`The book is not currently loaned out.`));

      await expect(controller.returnBook(validLendingId.toString())).rejects.toThrow(BadRequestException);
    });
  });


});
