import path from 'node:path';
import { StackProvisioner } from '@stackmate/engine';

import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import ConfigurationFile from '@stackmate/cli/lib/configuration-file';

/**
 * Synthesizes a stack and writes out a Terraform configuration file
 *
 * @param {StackProvisioner} provisioner the operation that synthesizes the stack
 * @param {String} outputPath the directory to write the file to
 * @param {String} fileName the file name for the synthesized stack
 */
export const exportStackConfiguration = (
  provisioner: StackProvisioner, outputPath: string, fileName: string,
): { workdir: string, filename: string } => {
  const outputDir: string = path.resolve(CURRENT_DIRECTORY, outputPath);
  const stackFilename = fileName.toLowerCase();

  // Synthesize & write to files
  const config = new ConfigurationFile(path.join(outputDir, stackFilename));
  config.write(provisioner.synthesize());

  return {
    workdir: outputDir,
    filename: stackFilename,
  };
};


/**
 * Parses a comma separated value
 *
 * @param {String} value the value to parse
 * @returns {String[]} the parsed value
 */
export const parseCommaSeparatedString = (value: string): string[] => (
  value.split(',').map(v => v.trim())
);
