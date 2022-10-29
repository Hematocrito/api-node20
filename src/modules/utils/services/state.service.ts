import { Injectable } from '@nestjs/common';

const states = require('countrycitystatejson');

@Injectable()
export class StateService {
  constructor() {}

  public getStatesByCountry(code: string) {
    const data = states.getStatesByShort(code);
    return data;
  }
}
