import { ApiProperty } from '@nestjs/swagger';

class Book {
  @ApiProperty({ example: 3, description: 'The unique ID of the book.' })
  id: number;

  @ApiProperty({ example: 'NameBook', description: 'Title of the book.' })
  name: string;

  @ApiProperty({ example: '978-84-673-2435-8', description: 'The unique ISBN of the book.' })
  ISBN: string;

  @ApiProperty({ description: 'Define if book is loaned' })
  loaned: boolean;

  @ApiProperty({ example: 2, description: 'The unique id of reader who loaned the book' })
  readerId: number;
}

class Lending {
  @ApiProperty({ example: 12, description: 'The unique ID of the lending.' })
  id: number;

  @ApiProperty({ example: '2023-10-14T11:02:59.811Z', description: 'The date when the book was loaned.' })
  date: Date;

  @ApiProperty({ example: '978-84-673-2435-8', description: 'The unique ISBN of the loaned book.' })
  bookISBN: string;

  @ApiProperty({ example: 2, description: 'The unique id of the reader who loaned the book.' })
  readerId: number;
}

export class ReturnResponse {
  @ApiProperty({ example: 'Book returned successfully.', description: 'A message indicating the result of the operation.' })
  message: string;
}

export class LendingResponse {
  @ApiProperty({ type: Lending })
  lending: Lending;

  @ApiProperty({ type: Book })
  updatedBook: Book;
}
