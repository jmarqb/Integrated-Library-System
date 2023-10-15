import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {Book} from '@prisma/client';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LoggerService } from '../common/logger/logger.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class BookService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: LoggerService
  ) { }

  async create(createBookDto: CreateBookDto): Promise<Book> {

    const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(createBookDto.name);
      if (containsMetaCharacter) {
          throw new BadRequestException(`Syntax Error: not allowed characters`);
      }
    try {

      const book = await this.prismaService.book.create({ data: createBookDto })
      return book;

    } catch (error) {
        this.handlerDbErrors(error.code)
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Book>> {

    const { limit = 10, offset = 0 } = paginationDto;

    const books = await this.prismaService.book.findMany({
      skip: (Number(offset)),
      take: (Number(limit))
    });

    const total: number = await this.prismaService.book.count();
    const totalPages: number = Math.ceil(total / limit);

    return {
      items: books,
      total: total,
      currentPage: offset / limit + 1,
      totalPages: totalPages
    };
  }

  async findOne(id: string): Promise<Book> {
    try {
      const book = await this.prismaService.book.findUnique({ where: { ISBN: id } });

      if (!book) {
        throw new NotFoundException(`The book with id ${id} not exists in database`);
      }

      return book;
    } catch (error) {
      this.handlerDbErrors(error.status);
    }
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {

    const book = await this.findOne(id);

    const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(updateBookDto.name);
      if (containsMetaCharacter) {
          throw new BadRequestException(`Syntax Error: not allowed characters`);
      }
    try {

      const updatedBook = await this.prismaService.book.update({
        where: {
          ISBN: book.ISBN,
        },
        data: updateBookDto,
      })
      return updatedBook;

    } catch (error) {
      this.handlerDbErrors(error.status);
    }
  }

  async remove(id: string) {

    const book = await this.findOne(id);

    if (book.loaned === true || book.readerId != null) {
      throw new BadRequestException(`The book ${book.name} cannot be deleted because it is currently on loan.`);
    }

    await this.prismaService.book.delete({
      where: { ISBN: book.ISBN }
    });
  }

  private handlerDbErrors(error: any) {

    switch (error) {
      case 'P2002':
        this.logger.error('Duplicate Element.', error.detail);
        throw new BadRequestException('Duplicate ISBN, the element already exists in database');

      case 400:
        this.logger.error('Bad Request.', error.detail);
        throw new BadRequestException('Syntax Error: the name have not allowed characters');

      case 404:
        this.logger.error('Not Found.', error.detail);
        throw new NotFoundException('Element not found in database.');

      default:
        this.logger.error('Unknow Error.', error);
        throw new InternalServerErrorException('Checks Server logs.');
    }

  }
}
