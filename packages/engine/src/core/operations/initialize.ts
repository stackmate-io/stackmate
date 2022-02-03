import Operation from '@stackmate/core/operation';

class InitOperation extends Operation {
  run(): void {
    const { clouds, stack, vault } = this.stage;

    clouds.forEach(
      cloud => cloud.provision(stack, vault),
    );
  }
}

export default InitOperation;
