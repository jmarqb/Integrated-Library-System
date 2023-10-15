import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReaderService } from './reader.service';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../common/logger/logger.service';

describe('ReaderService', () => {
  let service: ReaderService;

  const mockPrismaService = {
    reader: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    lending:{
      findFirst: jest.fn()
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReaderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },

      ],
    }).compile();

    service = module.get<ReaderService>(ReaderService);
  });

  describe('create', () => {
    //Define a sample CreateReaderDto to use for the test
    const createReaderDto = {
      name: 'readerName',
    };

    it('should create a reader succesfully', async () => {
      mockPrismaService.reader.create.mockResolvedValue(mockReader);
      const result = await service.create(createReaderDto);
      expect(mockPrismaService.reader.create).toHaveBeenCalledWith({ data: createReaderDto });
      expect(result).toEqual(mockReader);
    });

    it('should throw an error 500 when something goes wrong', async () => {
      mockPrismaService.reader.create.mockRejectedValue(new InternalServerErrorException('Unknow Error.'));
      await expect(service.create(createReaderDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Unknow Error.');
    });

    it('should throw a BadRequestException for Syntax Error in name', async () => {
      const mockError = {
        statusCode: 400,
        message: 'Syntax Error: the name have not allowed characters',
      };
      mockPrismaService.reader.create.mockRejectedValue(mockError);
      await expect(service.create({name:'bad/name'})).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Bad Request.');
    });

    it('should throw the exact error if it\'s not one of the handled errors', async () => {
      const someError = {
        code: 'AN_UNEXPECTED_ERROR',
        detail: 'UNEXPECTED_ERROR',
      };
      mockPrismaService.reader.create.mockRejectedValue(someError);
      await expect(service.create(createReaderDto)).rejects.toThrowError('Checks Server logs');
    });

  });

  describe('findAll', () => {
    it('should return a paginated list of readers', async () => {
      const mockReaders = [mockReader, mockReader];
      const paginationDto = { limit: 10, offset: 0 };
      mockPrismaService.reader.findMany.mockResolvedValue(mockReaders);
      mockPrismaService.reader.count.mockResolvedValue(2);
  
      const result = await service.findAll(paginationDto);
  
      expect(mockPrismaService.reader.findMany).toHaveBeenCalledWith({
        skip: Number(paginationDto.offset),
        take: Number(paginationDto.limit),
      });
      expect(result).toEqual({
        items: mockReaders,
        total: 2,
        currentPage: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single reader', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      const result = await service.findOne(5);
      expect(mockPrismaService.reader.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual(mockReader);
    });
  
    it('should throw an error if reader is not found', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(null);
      await expect(service.findOne(5)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if there\'s a problem fetching the reader', async () => {
      mockPrismaService.reader.findUnique.mockRejectedValue(new Error('Database error'));
      await expect(service.findOne(5)).rejects.toThrowError('Checks Server logs');
    });
    
  });

  describe('update', () => {
    const updateReaderDto = { name: 'UpdatedName' };
  
    it('should update and return the updated reader', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      mockPrismaService.reader.update.mockResolvedValue({ ...mockReader, ...updateReaderDto });
  
      const result = await service.update(mockReader.id, updateReaderDto);
      expect(mockPrismaService.reader.update).toHaveBeenCalledWith({
        where: { id: mockReader.id },
        data: updateReaderDto,
      });
      expect(result).toEqual({ ...mockReader, ...updateReaderDto });
    });

    it('should throw a BadRequestException for Syntax Error in name', async () => {
      const mockError = {
        statusCode: 400,
        message: 'Syntax Error: the name have not allowed characters',
      };
      mockPrismaService.reader.update.mockRejectedValue(mockError);
      await expect(service.update(mockReader.id,{name:'bad/name'})).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe('Bad Request.');
    });

    it('should throw an error if there\'s a problem updating the reader', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      mockPrismaService.reader.update.mockRejectedValue(new Error('Database error'));
      await expect(service.update(mockReader.id, updateReaderDto)).rejects.toThrowError('Checks Server logs');
    });
    
  });

  describe('remove', () => {

    it('should remove a reader successfully if not have lending', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      mockPrismaService.lending.findFirst.mockResolvedValue(false);
      mockPrismaService.reader.delete.mockResolvedValue(mockReader);
      await service.remove(mockReader.id);
      expect(mockPrismaService.reader.delete).toHaveBeenCalledWith({ where: { id: mockReader.id } });
    });

    it('should show a message if reader have lending', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(mockReader);
      mockPrismaService.lending.findFirst.mockResolvedValue(true);
    
      await expect(service.remove(mockReader.id))
        .rejects
        .toThrow(new BadRequestException(`The reader cannot be deleted as they have books checked out. They must return them first.`));
    });
    

    it('should throw an error if reader is not found', async () => {
      mockPrismaService.reader.findUnique.mockResolvedValue(null);
      await expect(service.findOne(5)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if there\'s a problem fetching the reader', async () => {
      mockPrismaService.reader.findUnique.mockRejectedValue(new Error('Database error'));
      await expect(service.findOne(5)).rejects.toThrowError('Checks Server logs');
    });
  });


});
