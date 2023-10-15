import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ReaderService } from './reader.service';
import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReaderResponse } from './response-model/reader-response';
import { PaginatedReaderResponse } from './response-model/pagination-reader-response';

@ApiTags('Reader')
@Controller('reader')
export class ReaderController {
  constructor(private readonly readerService: ReaderService) {}

  @Post()
  @ApiOperation({ summary: 'Insert a new Reader' })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of a Reader.',
    type: ReaderResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  create(@Body() createReaderDto: CreateReaderDto) {
    return this.readerService.create(createReaderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of Readers with optional pagination.' })
  @ApiResponse({status:200, description: 'Get Readers',type:PaginatedReaderResponse})
  findAll(@Query() paginationDto:PaginationDto) {
    return this.readerService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Reader for Id' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Reader.',
    type: ReaderResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  findOne(@Param('id' , ParseIntPipe) id: number) {
    return this.readerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Reader ' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Reader.',
    type: ReaderResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  update(@Param('id', ParseIntPipe) id: number, @Body() updateReaderDto: UpdateReaderDto) {
    return this.readerService.update(id, updateReaderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Reader ' })
  @ApiResponse({status: 200})
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.readerService.remove(id);
  }
}
