import { IsEmail, IsString, Max, Min } from "class-validator";

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  // @IsString()
  // @Min(8)
  // @Max(16)
  // password!: string;
}