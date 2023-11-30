import { writeJsonFile } from '@src/lib/file'
import { CdktfProject } from '@cdktf/cli-core/src/lib/cdktf-project'
import type { SynthesizedStack } from '@cdktf/cli-core/src/lib/synth-stack'
import type {
  CdktfProjectOptions,
  DiffOptions,
  MutationOptions,
} from '@cdktf/cli-core/src/lib/cdktf-project'

const OPERATION_OPTIONS: Partial<MutationOptions & DiffOptions> = {
  skipSynth: true,
  noColor: true,
}

export class Project extends CdktfProject {
  #synthesized: SynthesizedStack

  constructor(
    synthesized: SynthesizedStack,
    { onUpdate, onLog }: Pick<CdktfProjectOptions, 'onUpdate' | 'onLog'>,
  ) {
    super({
      synthCommand: '',
      outDir: '.',
      synthOrigin: 'watch',
      workingDirectory: synthesized.workingDirectory,
      onLog,
      onUpdate,
    })

    this.#synthesized = synthesized

    writeJsonFile(this.#synthesized.content, this.#synthesized.synthesizedStackPath)
  }

  async synth(): Promise<SynthesizedStack[]> {
    return [this.#synthesized]
  }

  async readSynthesizedStacks(): Promise<SynthesizedStack[]> {
    return [this.#synthesized]
  }

  async deploy(opts?: MutationOptions | undefined): Promise<void> {
    return await super.deploy({ ...(opts || {}), ...OPERATION_OPTIONS })
  }

  async destroy(opts?: MutationOptions | undefined): Promise<void> {
    return await super.destroy({ ...(opts || {}), ...OPERATION_OPTIONS })
  }

  async diff(opts?: DiffOptions | undefined): Promise<void> {
    return await super.diff({ ...(opts || {}), ...OPERATION_OPTIONS })
  }
}
