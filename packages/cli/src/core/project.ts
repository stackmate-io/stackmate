import { ConfigurationFile } from '@stackmate/cli/lib';
import { DEFAULT_PROJECT_FILE } from '../constants';

class ProjectFile extends ConfigurationFile {
  /**
   * @constructor
   */
  constructor(filename: string = DEFAULT_PROJECT_FILE) {
    super(filename);
  }
}

export default ProjectFile;
