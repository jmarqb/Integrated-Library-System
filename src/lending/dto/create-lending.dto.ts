import { ApiProperty } from '@nestjs/swagger';
import { IsISBN, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateLendingDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsISBN()
    bookISBN: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    readerId: number;
}
