import { ApiProperty } from "@nestjs/swagger";
import { ReaderResponse } from "./reader-response";

export class PaginatedReaderResponse {
    @ApiProperty({ type: [ReaderResponse] })
    items: ReaderResponse[];
  
    @ApiProperty({ example: 100 })
    total: number;
  
    @ApiProperty({ example: 1 })
    currentPage: number;
  
    @ApiProperty({ example: 10 })
    totalPages: number;
  }
  