import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { LendingService } from './lending.service';
import { CreateLendingDto } from './dto/create-lending.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LendingResponse, ReturnResponse } from './response-model/lending-response';
import { PaginatedLendingResponse } from './response-model/pagination-lending-response';

@ApiTags('Lending')
@Controller('lending')
export class LendingController {
  constructor(private readonly lendingService: LendingService) {}

  @Post()
  @ApiOperation({ summary: 'Realize a lending process' })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of the lending.',
    type: LendingResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  realizeLending(@Body() createLendingDto: CreateLendingDto) {
    return this.lendingService.realizeLending(createLendingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of lending with optional pagination.' })
  @ApiResponse({status:200, description: 'Get Lendings',type:PaginatedLendingResponse})
  getAllLendings(@Query() paginationDto: PaginationDto) {
    return this.lendingService.getAllLendings(paginationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Realize a devolution of the Book' })
  @ApiResponse({status: 200, description: 'Returns the details of the lending.',
    type: ReturnResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  returnBook(@Param('id', ParseIntPipe) id: string) {
    return this.lendingService.returnBook(+id);
  }

}
