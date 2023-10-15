import { ApiProperty } from "@nestjs/swagger";
import { LendingResponse } from "./lending-response";

export class PaginatedLendingResponse {
    @ApiProperty({ type: [LendingResponse] })
    items: LendingResponse[];
  
    @ApiProperty({ example: 100 })
    total: number;
  
    @ApiProperty({ example: 1 })
    currentPage: number;
  
    @ApiProperty({ example: 10 })
    totalPages: number;
  }
  