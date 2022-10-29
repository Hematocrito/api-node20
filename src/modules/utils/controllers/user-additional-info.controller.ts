import {
  HttpCode, HttpStatus, Controller, Get, Injectable
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { UserAdditionalInfoService } from '../services/user-additional-info.service';

@Injectable()
@Controller('user-additional')
export class UserAdditionalInfoController {
  constructor(private readonly userAdditionalInfoService: UserAdditionalInfoService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  listHeight() {
    return DataResponse.ok(this.userAdditionalInfoService.getBodyInfo());
  }
}
