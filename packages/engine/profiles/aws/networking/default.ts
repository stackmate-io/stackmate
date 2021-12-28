import { VpcConfig, SubnetConfig, InternetGatewayConfig } from '@cdktf/provider-aws/lib/vpc';

const vpc: Partial<VpcConfig> = {
  enableDnsHostnames: true,
  enableDnsSupport: true,
};

const subnet: Partial<SubnetConfig> = {
  mapPublicIpOnLaunch: true,
};

const gateway: Partial<InternetGatewayConfig> = {};

export {
  vpc,
  subnet,
  gateway,
};
