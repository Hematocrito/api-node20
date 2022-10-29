import { Injectable } from '@nestjs/common';

const cities = require('countrycitystatejson');

@Injectable()
export class CityService {
  constructor() {}

  public getCitiesInState(countryCode: string, state: string) {
    const data = cities.getCities(countryCode, state);
    return data;
  }
}
