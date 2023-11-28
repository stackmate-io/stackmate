import { CdktfProject } from '@cdktf/cli-core'
import type { CdktfProjectOptions } from '@cdktf/cli-core/src/lib/cdktf-project'
import type { SynthesizedStack } from '@cdktf/cli-core'

export class Project extends CdktfProject {
  #synthesized: SynthesizedStack

  constructor(
    synthesized: SynthesizedStack,
    {
      workingDirectory = process.cwd(),
      onUpdate,
      onLog,
    }: Pick<CdktfProjectOptions, 'workingDirectory' | 'onUpdate' | 'onLog'>,
  ) {
    super({
      synthCommand: '',
      outDir: '.',
      synthOrigin: 'watch',
      workingDirectory,
      onLog,
      onUpdate,
    })

    this.#synthesized = synthesized
  }

  async synth(): Promise<SynthesizedStack[]> {
    return [this.#synthesized]
  }

  async readSynthesizedStacks(): Promise<SynthesizedStack[]> {
    return [this.#synthesized]
  }
}
