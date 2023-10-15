import { ApiProperty } from '@nestjs/swagger';

export class BookResponse {
  @ApiProperty({ example: 1, description: 'The unique ID of the book.' })
  id:number
  
  @ApiProperty({ example: 'The Great Gatsby', description: 'Title of the book.' })
  name:string

  @ApiProperty({ example: '978-84-673-2432-7', description: 'The unique ISBN of the book.' })
  ISBN:string
  
  @ApiProperty({description: 'Define if book is loaned' })
  loaned: false

 @ApiProperty({ example: 1, description: 'The unique id of reader loan the book' })
readerId: number | null
}
