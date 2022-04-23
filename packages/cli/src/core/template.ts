import { ProjectConfiguration, ProviderChoice, ServiceTypeChoice } from '@stackmate/engine';
import { get, set } from 'lodash';

const AttributeComments = {
  name: '',
  provider: '',
  region: '',
  state: '',
  secrets: '',
  stages: '',
};

class ProjectTemplate {
  attributes: ProjectConfiguration = {};

  requiredInput = [];

  constructor({ name, provider, region, state, secrets, stages }: ProjectConfiguration = {}) {
    this.attributes = {
      name,
      provider,
      region,
      state,
      secrets,
      stages,
    };
  }

  yaml() {
  }

  json() {
  }
}

export default ProjectTemplate;
