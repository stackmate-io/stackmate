import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';

export const deployStage = async (projectFile: string, stage: string): Promise<void> => {
  const operation = await DeployOperation.factory(projectFile, stage);
  await operation.run();
};

export const destroyStage = async (projectFile: string, stage: string): Promise<void> => {
  const operation = await DestroyOperation.factory(projectFile, stage);
  await operation.run();
};

export const prepareStage = async (projectFile: string, stage: string): Promise<void> => {
  const operation = await PrepareOperation.factory(projectFile, stage);
  await operation.run();
};

