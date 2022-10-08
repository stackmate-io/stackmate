import { defaultsDeep, get } from 'lodash';
import { ChoiceOf, CloudServiceProvider, PROVIDER } from '@stackmate/engine';

import { fileExists, ConfigurationFile } from '@stackmate/cli/lib';
import { PREFERENCES_FILE, PREFERENCES_VERSION } from '@stackmate/cli/constants';

export type PreferenceOptions = {
  version: string;
  defaultProvider: CloudServiceProvider;
  defaultRegion: string;
};

class Preferences extends ConfigurationFile {
  /**
   * @var {String} version the configuration's version
   */
  readonly version: string = PREFERENCES_VERSION;

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
    super(PREFERENCES_FILE);
    this.options = this.read() as PreferenceOptions;
    this.migrate();
  }

  /**
   * Gets a value from  the options
   *
   * @param {PreferenceOptions} key the key to get
   * @param {any} defaultValue the default value to set in case there isn't any stored
   * @returns {any} the value in the options
   */
  get(key: keyof PreferenceOptions, defaultValue = null): ChoiceOf<PreferenceOptions> | null {
    return get(this.options, key, defaultValue);
  }

  /**
   * Sets a preference item
   *
   * @param {String} key the preference key to set
   * @param {any} value the value to set
   */
  set(key: keyof PreferenceOptions, value: ChoiceOf<PreferenceOptions>) {
    // this.options[key] = value;
  }

  /**
   * Upgrades the preferences to its latest version
   */
  protected migrate() {
    // The file is present, there's no need to act upon it
    if (fileExists(this.filename) && this.get('version') === this.defaults.version) {
      return;
    }

    // File does not exist, create it with default options
    if (!fileExists(this.filename)) {
      this.write(this.defaults);
      return;
    }

    // File exists but it's outdated, upgrade to the latest version
    this.options = defaultsDeep(this.defaults, this.options, { version: PREFERENCES_VERSION });
    this.write(this.options);
  }
}

export default Preferences;
