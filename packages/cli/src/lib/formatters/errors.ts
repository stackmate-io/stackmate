import { color } from '@oclif/color';
import { ValidationError } from '@stackmate/engine';

export const formatValidationError = (
  error: ValidationError, logger: { log: Function }, { colors = true }: { colors: boolean },
) => {
  const lines = [
    colors ? color.bold.red(error) : error,
    ...Object.keys(error.errors).map(path => (
      `\n${colors ? color.bold.gray(path) : path}: ${path}`
    )),
  ];

  return logger.log(lines.join('\n'))
};
