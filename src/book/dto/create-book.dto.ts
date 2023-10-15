import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsISBN, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateBookDto {

    @ApiProperty()
    @IsString()
    @MinLength(3)
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsISBN()
    ISBN: string;

}
