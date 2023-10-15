import { Module } from '@nestjs/common';
import { ReaderService } from './reader.service';
import { ReaderController } from './reader.controller';
import { PrismaService } from '../prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports:[
    CommonModule
  ],
  controllers: [ReaderController],
  providers: [ReaderService, PrismaService],
})
export class ReaderModule {}
