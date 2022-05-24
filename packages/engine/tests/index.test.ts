import { isEmpty, isNil, omitBy } from 'lodash';
import { ProjectConfig, SERVICE_TYPE } from '../src';

test('Project population', () => {
  const project = ProjectConfig.populate({
    name: 'my-super-project',
    serviceTypes: [SERVICE_TYPE.MYSQL, SERVICE_TYPE.POSTGRESQL],
    stageNames: ['production', 'staging', 'uat'],
  });
  console.log(require('util').inspect(omitBy(project, (v) => isNil(v) || isEmpty(v) ), { depth: 30 }));
});
