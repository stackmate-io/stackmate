import { vpc as awsVpc, subnet as awsSubnet, internetGateway } from '@cdktf/provider-aws';

const vpc: Partial<awsVpc.VpcConfig> = {
  enableDnsHostnames: true,
  enableDnsSupport: true,
};

const subnet: Partial<awsSubnet.SubnetConfig> = {
  mapPublicIpOnLaunch: true,
};

const gateway: Partial<internetGateway.InternetGatewayConfig> = {};

export {
  vpc,
  subnet,
  gateway,
};
