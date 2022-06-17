import { color } from '@oclif/color';

type ValidationError = {
  errors: {
    [path: string]: string[];
  },
}

export const formatValidationError = (
  error: ValidationError, logger: { log: Function }, { colors = true }: { colors: boolean },
) => {
  const lines = [
    colors ? color.bold.red(error) : error,
    ...Object.keys(error.errors).map(path => (
      `\t${colors ? color.bold.gray(path) : path}: ${error.errors[path].join('\n\t\t')}`
    )),
  ];

  return logger.log(lines.join('\n'))
};
