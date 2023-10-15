import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { PrismaService } from '../prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports:[
    CommonModule
  ],
  controllers: [BookController],
  providers: [BookService, PrismaService],
})
export class BookModule {}
