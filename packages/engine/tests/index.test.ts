import { ProjectConfig } from '../src';

test('Project population', () => {
  const res = ProjectConfig.populate({ name: 'my-super-project' });
  console.log(res);
});
