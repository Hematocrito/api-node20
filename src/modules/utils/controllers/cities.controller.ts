import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  Param
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { CityService } from '../services/city.service';

@Injectable()
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('/:countryCode/:state')
  @HttpCode(HttpStatus.OK)
  list(
    @Param('countryCode') countryCode: string,
    @Param('state') state: string
  ) {
    return DataResponse.ok(this.cityService.getCitiesInState(countryCode, state));
  }
}
