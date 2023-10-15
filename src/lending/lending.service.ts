import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Lending } from '@prisma/client';
import { PrismaService } from '../prisma.service';

import { CreateLendingDto } from './dto/create-lending.dto';
import { LoggerService } from '../common/logger/logger.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';


@Injectable()
export class LendingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: LoggerService
  ) { }

  async realizeLending(createLendingDto: CreateLendingDto): Promise<{ lending: any, updatedBook: any }> {

    const [book, reader] = await Promise.all([
        this.prismaService.book.findUnique({ where: { ISBN: createLendingDto.bookISBN } }),
        this.prismaService.reader.findUnique({ where: { id: createLendingDto.readerId } })
    ]);

    if (!book) {
        this.logger.error(`Book not found in database`);
        throw new NotFoundException(`Book not found in database`);
    }

    if (!reader) {
        this.logger.error(`Reader not found in database`);
        throw new NotFoundException(`Reader not found in database`);
    }

    if (book.loaned === true) {
        this.logger.error(`Book not available`);
        throw new BadRequestException('Book not available');
    }

    const createLending = this.prismaService.lending.create({ data: createLendingDto });
    const updateBook = this.prismaService.book.update({
        where: { ISBN: createLendingDto.bookISBN },
        data: { readerId: createLendingDto.readerId, loaned: true }
    });

    try {
        const transactionResponse = await this.prismaService.$transaction([createLending, updateBook]);
        return {
            lending: transactionResponse[0],
            updatedBook: transactionResponse[1]
        };
    } catch (error) {
        this.logger.error(`Failed to execute transaction.`);
        throw new InternalServerErrorException('Failed to execute transaction.');
    }
}


  async getAllLendings(paginationDto: PaginationDto): Promise<PaginatedResult<Lending>> {
   
    const { limit = 10, offset = 0 } = paginationDto;

    try {
     const result = await this.prismaService.lending.findMany({
      skip: (Number(offset)),
      take: (Number(limit)),
        include: {
          Book: true,
          Reader: true
        }
      });

      const total: number = await this.prismaService.lending.count();
      const totalPages: number = Math.ceil(total / limit);
  
      return {
        items: result,
        total: total,
        currentPage: offset / limit + 1,
        totalPages: totalPages
      };
    } catch (error) {
      this.logger.error(`Failed to fetch lendings.`);
      throw new InternalServerErrorException('Failed to fetch lendings.');
    }
  }

  async returnBook(lendingId: number): Promise<{message: string}> {
    const lending = await this.prismaService.lending.findUnique({
      where: { id: lendingId },
      include: { Book: true }
    });

    if (!lending) {
      this.logger.error(`Lending not found.`);
      throw new NotFoundException(`Lending with ID ${lendingId} not found.`);
    }

    if (!lending.Book.loaned) {
      this.logger.error(`The book is not currently loaned out.`);
      throw new BadRequestException(`The book is not currently loaned out.`);
    }

    await this.prismaService.$transaction([
      this.prismaService.book.update({
        where: { ISBN: lending.Book.ISBN },
        data: { loaned: false, readerId: null }
      }),
      this.prismaService.lending.delete({
        where: { id: lendingId }
      })
    ]);

    return { message: 'Book returned successfully.' };
  }

}
