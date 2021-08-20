import { QualifiedRules } from '@commitlint/types';

export enum Severity {
  Fail = 'fail',
  Warn = 'warn',
  Message = 'message',
  Disable = 'disable',
}

export interface BranchSizeConfig {
  maxCommits?: number;
  maxLines?: number;
  maxFiles?: number;
  severity?: Severity;
}

export interface ConventionalConfig {
  rules?: QualifiedRules;
  severity?: Severity;
}

export interface PRLintConfig {
  minBodyLength?: number;
  severity?: Severity;
  scoped?: boolean;
}

export interface JIRAConfig {
  severity?: Severity;
}

export interface Config {
  branchSize?: BranchSizeConfig;
  conventional?: ConventionalConfig;
  prLint?: PRLintConfig;
  jira?: JIRAConfig;
}
