import { Module } from '@nestjs/common';
import { LendingService } from './lending.service';
import { LendingController } from './lending.controller';
import { PrismaService } from '../prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports:[
    CommonModule
  ],
  controllers: [LendingController],
  providers: [LendingService, PrismaService],
})
export class LendingModule {}
