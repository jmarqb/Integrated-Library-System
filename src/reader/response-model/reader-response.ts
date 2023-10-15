import { ApiProperty } from '@nestjs/swagger';

export class ReaderResponse {
  @ApiProperty({ example: 1, description: 'The unique ID of the reader.' })
  id:number
  
  @ApiProperty({ example: 'Juan', description: 'Name of the reader' })
  name:string
}
