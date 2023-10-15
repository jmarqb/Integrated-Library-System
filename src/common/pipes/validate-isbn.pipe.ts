import { BadRequestException, PipeTransform } from "@nestjs/common";
import { IsISBN, validate } from "class-validator";

class ISBNClass {
  @IsISBN()
  isbn: string;
}

export class ValidateIsbnPipe implements PipeTransform {
  
  async transform(value: string): Promise<string> {
    const obj = new ISBNClass();
    obj.isbn = value;

    const errors = validate(obj);
    
    if ((await errors).length > 0) {
        throw new BadRequestException('Invalid ISBN');
    }
    
    return value;
  }
}
