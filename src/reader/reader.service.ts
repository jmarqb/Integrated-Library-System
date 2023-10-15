import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Reader } from '@prisma/client';
import { PrismaService } from '../prisma.service';

import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ReaderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: LoggerService

  ){}

  async initializeReaders() {
    const defaultreaders = [
      { name: 'reader 1' },
      { name: 'reader 2' },
    ];

    for (const reader of defaultreaders) {
      const exists = await this.prismaService.reader.findFirst({
        where: { name: reader.name },
      });

      if (!exists) {
        await this.prismaService.reader.create({ data: reader });
      }
    }
  }
  
  async create(createReaderDto: CreateReaderDto):Promise<Reader> {
    try {
      const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(createReaderDto.name);
        if (containsMetaCharacter) {
            throw new BadRequestException(`Syntax Error: not allowed characters`);
        }

      const reader = await this.prismaService.reader.create({ data: createReaderDto })
      return reader;

    } catch (error) {
      this.handlerDbErrors(error.status)
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Reader>> {

    const { limit = 10, offset = 0 } = paginationDto;

    const readers = await this.prismaService.reader.findMany({
      skip: (Number(offset)),
      take: (Number(limit))
    });

    const total: number = await this.prismaService.reader.count();
    const totalPages: number = Math.ceil(total / limit);

    return {
      items: readers,
      total: total,
      currentPage: offset / limit + 1,
      totalPages: totalPages
    };
  }

  async findOne(id: number):Promise<Reader> {
    try {
      const reader = await this.prismaService.reader.findUnique({ where: { id } });

      if (!reader) {
        throw new NotFoundException(`Reader not found in database.`);
      }
      return reader;

    } catch (error) {
      this.handlerDbErrors(error.status);
    }
  }

  async update(id: number, updateReaderDto: UpdateReaderDto):Promise<Reader> {
    const reader = await this.findOne(id);

    try {
      const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(updateReaderDto.name);
        if (containsMetaCharacter) {
            throw new BadRequestException(`Syntax Error: not allowed characters`);
        }
      const updateReader = await this.prismaService.reader.update({
        where: {
          id: reader.id,
        },
        data: updateReaderDto,
      })
      return updateReader;
      
    } catch (error) {
      this.handlerDbErrors(error.status);
    }
  }

 async remove(id: number) {
  const reader = await this.findOne(id);

  const reader_lending = await this.prismaService.lending.findFirst({where:{readerId:reader.id}})
  
  if(reader_lending){
    throw new BadRequestException(`The reader cannot be deleted as they have books checked out. They must return them first.`);
  }
  await this.prismaService.reader.delete({where:{id}});
    
  }

  private handlerDbErrors(error: any) {

    switch (error) {
      case 'P2002':
        this.logger.error('Duplicate Key.', error.detail);
        throw new BadRequestException('Reader already exists in database');

      case 400:
        this.logger.error('Bad Request.', error.detail);
        throw new BadRequestException('Syntax Error: not allowed characters');

      case 404:
        this.logger.error('Not Found.', error.detail);
        throw new NotFoundException('Reader not found in database.');

      default:
        this.logger.error('Unknow Error.', error);
        throw new InternalServerErrorException('Checks Server logs.');
    }

  }
}
