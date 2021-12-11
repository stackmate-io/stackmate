import Project from '@stackmate/core/project';

const synthesize = async (projectFile: string, stage: string): Promise<void> => {
  await Project.synthesize(projectFile, stage);
};

export {
  Project,
  synthesize,
};
