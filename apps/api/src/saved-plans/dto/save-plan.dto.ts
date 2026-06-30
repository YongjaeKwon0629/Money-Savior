import { IsInt, Min } from 'class-validator';

export class SavePlanDto {
  @IsInt()
  @Min(1)
  inputId: number;
}
