import { Module } from '@nestjs/common';
import { BookModule } from './book/book.module';
import { ReaderModule } from './reader/reader.module';
import { LendingModule } from './lending/lending.module';
import { ConfigModule } from '@nestjs/config';
import { ReaderService } from './reader/reader.service';
import { PrismaService } from './prisma.service';
import { LoggerService } from './common/logger/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot(),

    BookModule,

    ReaderModule,

    LendingModule
  ],
  providers:[ReaderService,PrismaService,LoggerService]
})
export class AppModule { 
  constructor(private readonly ReaderService: ReaderService) {}

  async onModuleInit() {
    await this.ReaderService.initializeReaders();
  }
}
