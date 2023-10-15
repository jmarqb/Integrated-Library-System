import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ValidateIsbnPipe } from '../common/pipes/validate-isbn.pipe';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookResponse } from './response-model/book-response';
import { PaginatedBookResponse } from './response-model/pagination-book-response';

@ApiTags('Book')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @ApiOperation({ summary: 'Insert a new Book' })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of a Book.',
    type: BookResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of books with optional pagination.' })
  @ApiResponse({status:200, description: 'Get Books',type:PaginatedBookResponse})
  findAll(@Query() paginationDto:PaginationDto) {
    return this.bookService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Book for ISBN' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Book.',
    type: BookResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  findOne(@Param('id', ValidateIsbnPipe) id: string) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Book ' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Book.',
    type: BookResponse,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  update(@Param('id', ValidateIsbnPipe) id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Book ' })
  @ApiResponse({status: 200})
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  remove(@Param('id', ValidateIsbnPipe) id: string) {
    return this.bookService.remove(id);
  }
}
