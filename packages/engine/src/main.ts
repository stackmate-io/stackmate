import Project from '@stackmate/core/project';
import { DEFAULT_PROJECT_FILE, DEFAULT_STAGE } from '@stackmate/constants';

/**
 * Synthesizes a stack
 *
 * @param {String} projectFile the file to use for the project
 * @param {String} stageName the name of the stage to use
 * @param {String} outputPath the path to write the output to
 */
const synthesize = async (
  projectFile: string = DEFAULT_PROJECT_FILE, stageName: string = DEFAULT_STAGE, outputPath?: string,
): Promise<void> => {
  const project = new Project(projectFile);
  await project.load();

  const stage = await project.stage(stageName, outputPath);
  stage.synthesize();
};

export {
  Project,
  synthesize,
};
