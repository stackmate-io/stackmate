import Project from '@stackmate/core/project';

export const synthesize = async (projectFile: string, stage: string): Promise<void> => {
  await Project.synthesize(projectFile, stage);
};
