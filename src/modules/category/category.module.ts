import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { categoryProviders } from './providers';
import { AdminCategoryController } from './controllers/admin-category.controller';
import { UserCategoryController } from './controllers/user-category.controller';
import { CategoryService } from './services';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => AuthModule)
  ],
  providers: [
    ...categoryProviders,
    CategoryService
  ],
  controllers: [
    AdminCategoryController,
    UserCategoryController
  ],
  exports: [
    ...categoryProviders,
    CategoryService
  ]
})
export class CategoryModule {}
