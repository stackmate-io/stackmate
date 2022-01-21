import { get } from 'lodash';

class Environment {
  /**
   * @var {Object} env the environment variables
   */
  readonly env: object;

  constructor() {
    ({ env: this.env } = process);
  }

  /**
   * @param {String} name the name of the environment variable to get
   * @returns {String} the value for the environment variable
   */
  get(name: string): string {
    return get(this.env, name);
  }
}

const instance = new Environment();

export default instance as Environment;
