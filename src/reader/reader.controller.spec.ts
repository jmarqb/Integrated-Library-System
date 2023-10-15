import { Test, TestingModule } from '@nestjs/testing';
import { ReaderController } from './reader.controller';
import { ReaderService } from './reader.service';
import { CreateReaderDto } from './dto/create-reader.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('ReaderController', () => {
  let controller: ReaderController;

  const ERROR_MESSAGES = {
    INTERNAL_SERVER: 'Error Unknow in database.',
    DUPLICATE_KEY: 'Reader already exists in database',
    NOT_FOUND: 'Not Found.',
    INVALID_ID: 'Invalid id',
    SYNTAX_ERROR: 'Syntax Error: the name have not allowed characters'
  };

  const mockReaderService = {

    create: jest.fn().mockImplementation((dto: CreateReaderDto) => Promise.resolve({
      id: 1,
      name: dto.name,
    })),

    findAll: jest.fn().mockImplementation((dto: PaginationDto) => Promise.resolve({
      items: ['id', 'name'],
      total: 10,
      currentPage: 1,
      totalPages: 5
    })),

    findOne: jest.fn().mockImplementation((id: number) => Promise.resolve({
      id: id,
      name: 'readerName',
    })),

    update: jest.fn().mockImplementation((id: number, updDto: UpdateReaderDto) => Promise.resolve({
      id: id,
      name: updDto.name,
    })),

    remove: jest.fn().mockImplementation((id: string) => Promise.resolve({

    })),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReaderController],
      providers: [ReaderService],
    })
      .overrideProvider(ReaderService).useValue(mockReaderService)
      .compile();

    controller = module.get<ReaderController>(ReaderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      name: "Marco"
    };
    const invalidDto = {
      name: "Marc][][///o"
    }

    it('should be create a Reader', async () => {
      const result = await controller.create(dto);

      // Verify if the function create was called with a valid dto
      expect(mockReaderService.create).toHaveBeenCalledWith(dto);

      //Check the returned value
      expect(result).toEqual({
        id: 1,
        name: dto.name,
      });
    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockReaderService.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);
    });

    //Handling Error 400 BadRequestException Duplicate Reader
    it('should throw an error 400 when Reader already exists in database', async () => {
      mockReaderService.create.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.DUPLICATE_KEY));
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    //Handling Error 400 BadRequestException Syntax Error
    it('should throw an error 400 when name contains metacharacters', async () => {
      mockReaderService.create.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.SYNTAX_ERROR));
      await expect(controller.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

  });

  describe('findAll', () => {

    it('should be return Array of readers and paginated data', async () => {
      const pagDto = {
        limit: 10,
        offset: 0
      };

      await controller.findAll(pagDto);

      // Verify if the function create was called with a valid dto
      expect(mockReaderService.findAll).toHaveBeenCalledWith(pagDto);

      //Check the value returned
      await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: ['id', 'name'],
        total: 10,
        currentPage: 1,
        totalPages: 5
      });
    });

    it('should return an empty list when no reader are present', async () => {

      mockReaderService.findAll.mockResolvedValue({
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
    //findOne Method Invalid Id
    it('should throw an BadRequestException when is a Invalid id', async () => {
      const invalidId = 'InvalidId';

      mockReaderService.findOne.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.findOne(+invalidId)).rejects.toThrow(BadRequestException);
    });

    //reader Not Found in database
    it('should throw an NotFoundException when a reader not exists in database', async () => {
      const validId = 5;
      // Mock the service to return a rejected promise with NotFoundException
      mockReaderService.findOne.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));

      // Expect the controller to throw a NotFoundException
      await expect(controller.findOne(validId)).rejects.toThrow(NotFoundException);

    });

    //findOne method -return correct data
    it('should return the correct reader data for a valid Id', async () => {
      const validId = 5;

      mockReaderService.findOne.mockResolvedValue({
        id: validId,
        name: 'readerName',
      })

      const result = await controller.findOne(validId);

      // Verify if the function findOne was called with a valid id
      expect(mockReaderService.findOne).toHaveBeenCalledWith(validId);

      //Check the value returned
      expect(result).toEqual({
        id: validId,
        name: 'readerName',
      });
    });

  });

  describe('update', () => {
    const invalidId = 'invalidId'
    const validId = 5;

    const sampleUpdDto = {
      name: "Aurelio",
    };

    const updatedReader = {
      id: validId,
      name: "UpdateAurelio",

    };

    //Suposed if service return a updated reader
    mockReaderService.update.mockResolvedValue(updatedReader);

    it('should update reader details if provided valid data', async () => {
      expect(await controller.update(validId, sampleUpdDto)).toEqual(updatedReader);
      expect(mockReaderService.update).toHaveBeenCalledWith(validId, sampleUpdDto);
    });

    it('should throw an BadRequestException when is a Invalid Id', async () => {
      mockReaderService.update.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));
      await expect(controller.update(+invalidId, sampleUpdDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reader does not exist', async () => {
      mockReaderService.update.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.update(+'non-existent-Id', sampleUpdDto)).rejects.toThrow(NotFoundException);
    });

  });

  describe('remove', () => {
    const invalidId = 'invalidId'
    const validId = 3;

    it('should throw an BadRequestException when is a Invalid Id', async () => {

      mockReaderService.remove.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.remove(+invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if the reader does not exist', async () => {
      mockReaderService.remove.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.remove(+'non-existent-Id')).rejects.toThrow(NotFoundException);
    });

    it('should remove reader succesfully if provided valid data', async () => {
      mockReaderService.remove.mockResolvedValue({});

      expect(await controller.remove(validId)).toEqual({});
      expect(mockReaderService.remove).toHaveBeenCalledWith(validId);
    });
  });
});
