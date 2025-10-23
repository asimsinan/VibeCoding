import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password!: string;

  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name must be at least 1 character long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  @MinLength(6, { message: 'Current password must be at least 6 characters long' })
  currentPassword!: string;

  @IsString({ message: 'New password must be a string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(100, { message: 'New password must not exceed 100 characters' })
  newPassword!: string;
}
