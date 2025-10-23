import { 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  IsDateString, 
  IsBoolean, 
  IsUUID,
  IsUrl,
  Length,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

// Custom validator for future dates
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: any, args: ValidationArguments) {
    if (!date) return false;
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate > now;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Deadline must be in the future';
  }
}

// Custom validator for positive numbers
@ValidatorConstraint({ name: 'isPositiveNumber', async: false })
export class IsPositiveNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return typeof value === 'number' && value > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Value must be a positive number';
  }
}

// Auth DTOs
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(1, { message: 'Password is required' })
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
  @MinLength(1, { message: 'Current password is required' })
  currentPassword!: string;

  @IsString({ message: 'New password must be a string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(100, { message: 'New password must not exceed 100 characters' })
  newPassword!: string;
}

// Campaign DTOs
export class CreateCampaignDto {
  @IsString({ message: 'Title must be a string' })
  @Length(1, 100, { message: 'Title must be between 1 and 100 characters' })
  title!: string;

  @IsString({ message: 'Description must be a string' })
  @Length(1, 10000, { message: 'Description must be between 1 and 10000 characters' })
  description!: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;

  @IsNumber({}, { message: 'Goal must be a number' })
  @Validate(IsPositiveNumberConstraint, { message: 'Goal must be a positive number' })
  @Min(0.01, { message: 'Goal must be at least $0.01' })
  @Max(1000000, { message: 'Goal cannot exceed $1,000,000' })
  goal!: number;

  @IsDateString({}, { message: 'Deadline must be a valid date string' })
  @Validate(IsFutureDateConstraint, { message: 'Deadline must be in the future' })
  deadline!: string;

  @IsEnum(['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'ENVIRONMENT', 'ARTS', 'SPORTS', 'BUSINESS', 'OTHER'], {
    message: 'Category must be one of: TECHNOLOGY, HEALTHCARE, EDUCATION, ENVIRONMENT, ARTS, SPORTS, BUSINESS, OTHER'
  })
  category!: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @Length(1, 100, { message: 'Title must be between 1 and 100 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(1, 10000, { message: 'Description must be between 1 and 10000 characters' })
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Goal must be a number' })
  @Validate(IsPositiveNumberConstraint, { message: 'Goal must be a positive number' })
  @Min(0.01, { message: 'Goal must be at least $0.01' })
  @Max(1000000, { message: 'Goal cannot exceed $1,000,000' })
  goal?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid date string' })
  deadline?: string;

  @IsOptional()
  @IsEnum(['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'ENVIRONMENT', 'ARTS', 'SPORTS', 'BUSINESS', 'OTHER'], {
    message: 'Category must be one of: TECHNOLOGY, HEALTHCARE, EDUCATION, ENVIRONMENT, ARTS, SPORTS, BUSINESS, OTHER'
  })
  category?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'OPEN', 'SUSPENDED', 'COMPLETED', 'CANCELLED'], {
    message: 'Status must be one of: DRAFT, ACTIVE, OPEN, SUSPENDED, COMPLETED, CANCELLED'
  })
  status?: string;
}

// Donation DTOs
export class CreateDonationDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Validate(IsPositiveNumberConstraint, { message: 'Amount must be a positive number' })
  @Min(0.01, { message: 'Amount must be at least $0.01' })
  @Max(10000, { message: 'Amount cannot exceed $10,000' })
  amount!: number;

  @IsEnum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'], {
    message: 'Payment method must be one of: CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CRYPTO'
  })
  paymentMethod!: string;

  @IsOptional()
  @IsBoolean({ message: 'isAnonymous must be a boolean' })
  isAnonymous?: boolean;

  @IsOptional()
  @IsString({ message: 'Message must be a string' })
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message?: string;
}

// Comment DTOs
export class CreateCommentDto {
  @IsString({ message: 'Content must be a string' })
  @Length(1, 500, { message: 'Content must be between 1 and 500 characters' })
  content!: string;

  @IsOptional()
  @IsUUID(4, { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}

// User DTOs
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;
}

// Admin DTOs
export class UpdateCampaignStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'], {
    message: 'Status must be one of: ACTIVE, SUSPENDED, COMPLETED, CANCELLED'
  })
  status!: string;

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;
}

// Query DTOs
export class PaginationDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;
}

export class CampaignSearchDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(100, { message: 'Search term cannot exceed 100 characters' })
  search?: string;

  @IsOptional()
  @IsEnum(['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'ENVIRONMENT', 'ARTS', 'SPORTS', 'BUSINESS', 'OTHER'], {
    message: 'Category must be one of: TECHNOLOGY, HEALTHCARE, EDUCATION, ENVIRONMENT, ARTS, SPORTS, BUSINESS, OTHER'
  })
  category?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'], {
    message: 'Status must be one of: ACTIVE, PAUSED, COMPLETED, CANCELLED'
  })
  status?: string;
}
