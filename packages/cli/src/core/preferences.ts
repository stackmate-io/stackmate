import { defaultsDeep, get } from 'lodash';
import { PROVIDER, util } from '@stackmate/engine';

import ConfigurationFile from '@stackmate/cli/lib/configuration-file';
import { PreferenceOptions } from '@stackmate/cli/types';
import { PREFERENCES_FILE, PREFERENCES_VERSION } from '@stackmate/cli/constants';

class Preferences {
  /**
   * @var {String} version the configuration's version
   */
  readonly version: string = PREFERENCES_VERSION;

  /**
   * @var {ConfigurationFile} file the configuration file that
   */
  readonly file: ConfigurationFile;

  /**
   * @var {Object} options the options stored in the settings file
   */
  protected options: PreferenceOptions;

  /**
   * @var {PreferenceOptions} defaults the defaults to use when upgrading or creating the file
   */
  readonly defaults: PreferenceOptions = {
    version: PREFERENCES_FILE,
    defaultProvider: PROVIDER.AWS,
    defaultRegion: 'eu-central-1',
  };

  /**
   * @constructor
   */
  constructor() {
    this.file = new ConfigurationFile(PREFERENCES_FILE);
    this.options = this.file.read() as PreferenceOptions;
    this.migrate();
  }

  /**
   * Gets a value from  the options
   *
   * @param {PreferenceOptions} key the key to get
   * @param {any} defaultValue the default value to set in case there isn't any stored
   * @returns {any} the value in the options
   */
  get(key: keyof PreferenceOptions, defaultValue = null): util.ChoiceOf<PreferenceOptions> | null {
    return get(this.options, key, defaultValue);
  }

  /**
   * Sets a preference item
   *
   * @param {String} key the preference key to set
   * @param {any} value the value to set
   */
  set(key: keyof PreferenceOptions, value: util.ChoiceOf<PreferenceOptions>) {
    // this.options[key] = value;
  }

  /**
   * Upgrades the preferences to its latest version
   */
  protected migrate() {
    // The file is present, there's no need to act upon it
    if (this.file.exists && this.get('version') === this.defaults.version) {
      return;
    }

    // File does not exist, create it with default options
    if (!this.file.exists) {
      this.file.write(this.defaults);
      return;
    }

    // File exists but it's outdated, upgrade to the latest version
    this.options = defaultsDeep(this.defaults, this.options, { version: PREFERENCES_VERSION });
    this.file.write(this.options);
  }
}

export default Preferences;
