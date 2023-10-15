import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CommonModule } from '../common/common.module';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('BookController', () => {
  let controller: BookController;

  const ERROR_MESSAGES = {
    INTERNAL_SERVER: 'Error Unknow in database.',
    DUPLICATE_KEY: 'Duplicate ISBN, the element already exists in database.',
    NOT_FOUND: 'Not Found.',
    INVALID_ID: 'Invalid ISBN'
  };

  const bookId = 1;
  const validISBN = '978-84-788-7499-6'

  const mockBookService = {

    create: jest.fn().mockImplementation((dto: CreateBookDto) => Promise.resolve({
      id: bookId,
      name: dto.name,
      ISBN: dto.ISBN,
      loaned: false,
      readerId: null
    })),

    findAll: jest.fn().mockImplementation((dto: PaginationDto) => Promise.resolve({
      items: ['id', 'name', 'ISBN', 'loaned', 'readerId'],
      total: 10,
      currentPage: 1,
      totalPages: 5
    })),

    findOne: jest.fn().mockImplementation((id: string) => Promise.resolve({
      id: bookId,
      name: 'bookName',
      ISBN: validISBN,
      loaned: false,
      readerId: null
    })),

    update: jest.fn().mockImplementation((id: string, updDto: UpdateBookDto) => Promise.resolve({
      id: bookId,
      name: updDto.name,
      ISBN: updDto.ISBN,
      loaned: false,
      readerId: null
    })),

    remove: jest.fn().mockImplementation((id: string) => Promise.resolve({

    })),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [BookController],
      providers: [BookService],
    })
      .overrideProvider(BookService).useValue(mockBookService)
      .compile();

    controller = module.get<BookController>(BookController);
  });

  describe('create', () => {
    const dto = {
      name: "Marco Aurelio y Roma",
      ISBN: "978-84-788-7499-6"
    };

    it('should be create a Book', async () => {
      const result = await controller.create(dto);

      // Verify if the function create was called with a valid dto
      expect(mockBookService.create).toHaveBeenCalledWith(dto);

      //Check the returned value
      expect(result).toEqual({
        id: bookId,
        name: dto.name,
        ISBN: dto.ISBN,
        loaned: false,
        readerId: null
      });
    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockBookService.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);
    });

    //Handling Error 400 BadRequestException
    it('should throw an error 400 when book already exists in database', async () => {
      mockBookService.create.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.DUPLICATE_KEY));
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

    });

  });

  describe('findAll', () => {

    it('should be return Array of books and paginated data', async () => {
      const pagDto = {
        limit: 10,
        offset: 0
      };

      await controller.findAll(pagDto);

      // Verify if the function create was called with a valid dto
      expect(mockBookService.findAll).toHaveBeenCalledWith(pagDto);

      //Check the value returned
      await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: ['id', 'name', 'ISBN', 'loaned', 'readerId'],
        total: 10,
        currentPage: 1,
        totalPages: 5
      });
    });

    it('should return an empty list when no books are present', async () => {

      mockBookService.findAll.mockResolvedValue({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });

      const pagDto = {
        limit: 10,
        offset: 0
      };

      await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });
    });

  });

  describe('findOne', () => {
    //findOne Method Invalid ISBN
    it('should throw an BadRequestException when is a Invalid ISBN', async () => {
      const invalidISBN = 'InvalidISBN';

      mockBookService.findOne.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.findOne(invalidISBN)).rejects.toThrow(BadRequestException);
    });

    //findOne book Not Found in database
    it('should throw an NotFoundException when a book not exists in database', async () => {

      // Mock the service to return a rejected promise with NotFoundException
      mockBookService.findOne.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));

      // Expect the controller to throw a NotFoundException
      await expect(controller.findOne(validISBN)).rejects.toThrow(NotFoundException);

    });

    //findOne method -return correct data
    it('should return the correct book data for a valid ISBN', async () => {

      mockBookService.findOne.mockResolvedValue({
        id: bookId,
        name: 'bookName',
        ISBN: validISBN,
        loaned: false,
        readerId: null
      })

      const result = await controller.findOne(validISBN);

      // Verify if the function findOne was called with a valid id
      expect(mockBookService.findOne).toHaveBeenCalledWith(validISBN);

      //Check the value returned
      expect(result).toEqual({
        id: bookId,
        name: 'bookName',
        ISBN: validISBN,
        loaned: false,
        readerId: null
      });
    });

  });

  describe('update', () => {
    const invalidId = 'invalidId'

    const sampleUpdDto = {
      name: "Marco Aurelio y Roma",
      ISBN: "978-84-788-7499-6"
    };

    const updatedBook = {
      id: bookId,
      name: "Marco Aurelio y Roma",
      ISBN: "978-84-788-7499-6",
      loaned: false,
      readerId: null
    };

    //Suposed if service return a updated book
    mockBookService.update.mockResolvedValue(updatedBook);

    it('should update book details if provided valid data', async () => {
      expect(await controller.update(validISBN, sampleUpdDto)).toEqual(updatedBook);
      expect(mockBookService.update).toHaveBeenCalledWith(validISBN, sampleUpdDto);
    });

    it('should throw an BadRequestException when is a Invalid ISBN', async () => {
      mockBookService.update.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));
      await expect(controller.update(invalidId, sampleUpdDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if book does not exist', async () => {
      mockBookService.update.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.update('non-existent-ISBN', sampleUpdDto)).rejects.toThrow(NotFoundException);
    });

  });

  describe('remove', () => {
    const invalidId = 'invalidId'

    it('should throw an BadRequestException when is a Invalid ISBN', async () => {

      mockBookService.remove.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.remove(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if the book does not exist', async () => {
      mockBookService.remove.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.remove('non-existent-ISBN')).rejects.toThrow(NotFoundException);
    });

    it('should remove book succesfully if provided valid data', async () => {
      mockBookService.remove.mockResolvedValue({});

      expect(await controller.remove(validISBN)).toEqual({});
      expect(mockBookService.remove).toHaveBeenCalledWith(validISBN);
    });
  });
});
