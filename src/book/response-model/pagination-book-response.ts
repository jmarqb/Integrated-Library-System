import { ApiProperty } from "@nestjs/swagger";
import { BookResponse } from "./book-response";

export class PaginatedBookResponse {
    @ApiProperty({ type: [BookResponse] })
    items: BookResponse[];
  
    @ApiProperty({ example: 100 })
    total: number;
  
    @ApiProperty({ example: 1 })
    currentPage: number;
  
    @ApiProperty({ example: 10 })
    totalPages: number;
  }
  