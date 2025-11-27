import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderQuestionsDto {
  @ApiProperty({ example: ['uuid1', 'uuid2', 'uuid3'], description: 'Question IDs in new order' })
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}
