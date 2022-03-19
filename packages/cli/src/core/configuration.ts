class Configuration {
  /**
   * @var {String} filename the configuration file's name
   */
  readonly filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }
}

export default Configuration;
