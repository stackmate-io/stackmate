import Project from '@stackmate/core/project';
import { DEFAULT_PROJECT_FILE, DEFAULT_STAGE } from '@stackmate/constants';

const synthesize = async (
  projectFile: string = DEFAULT_PROJECT_FILE, stageName: string = DEFAULT_STAGE, outputPath?: string,
): Promise<void> => {
  const project = new Project(projectFile, outputPath);
  await project.load();

  const stage = await project.stage(stageName);
  stage.synthesize();
};

export {
  Project,
  synthesize,
};
