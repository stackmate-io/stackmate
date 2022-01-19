import ffi from 'ffi-napi';

import { TERRAFORM_BINDING } from '@stackmate/constants';

class Terraform {
  /**
   * @var {Object} terraform the terraform FFI
   */
  terraform: { Deploy: ffi.ForeignFunction, State: ffi.ForeignFunction };

  /**
   * @constructor
   */
  constructor() {
    this.terraform = ffi.Library(TERRAFORM_BINDING, {
      Deploy: ['int', ['int']],
      State: ['int', ['int']],
    });
  }

  deploy() {
  }

  state() {
  }
}

export default Terraform;
