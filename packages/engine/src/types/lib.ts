import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';

export type CredentialsObject = {
  username?: string;
  password?: string;
};

export interface CloudStack extends TerraformStack {
  readonly name: string;
}

export interface CloudApp extends Construct {
  readonly name: string;
  stack(name: string): CloudStack;
}

export interface PriorityQueue<T> {
  items: [T, number][];
  size: number;
  isEmpty: boolean;
  all: T[];
  insert(item: T, priority: number): void;
  peek(): T | null;
  pop(): T | null;
}
