import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  Param
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { StateService } from '../services/state.service';

@Injectable()
@Controller('states')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Get(':countryCode')
  @HttpCode(HttpStatus.OK)
  list(
    @Param('countryCode') code: string
  ) {
    return DataResponse.ok(this.stateService.getStatesByCountry(code));
  }
}
