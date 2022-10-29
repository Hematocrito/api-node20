import { Module, HttpModule } from '@nestjs/common';
import {
  CountryService, LanguageService, PhoneCodeService, UserAdditionalInfoService,
  StateService, CityService
} from './services';
import {
  CountryController, LanguageController, PhoneCodeController, UserAdditionalInfoController,
  StateController, CityController
} from './controllers';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5
    })
  ],
  providers: [
    CountryService,
    StateService,
    CityService,
    LanguageService,
    PhoneCodeService,
    UserAdditionalInfoService],
  controllers: [
    CountryController,
    LanguageController,
    PhoneCodeController,
    UserAdditionalInfoController,
    StateController,
    CityController
  ],
  exports: [CountryService, LanguageService, PhoneCodeService]
})
export class UtilsModule { }
