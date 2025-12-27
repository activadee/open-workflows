export interface Context {
  mode: 'ci' | 'local' | 'manual';
  repository?: string;
  prNumber?: number;
  issueNumber?: number;
  commitSha?: string;
  branch?: string;
  token?: string;
  eventName?: string;
  eventPayload?: Record<string, unknown>;
}

export interface CommandOptions {
  pr?: string;
  issue?: string;
  repo?: string;
  model?: string;
  local?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

import type { Part, Message } from '@opencode-ai/sdk';

export type {
  Message,
  UserMessage,
  AssistantMessage,
  TextPart,
  ReasoningPart,
  ToolPart,
  ToolState,
  ToolStatePending,
  ToolStateRunning,
  ToolStateCompleted,
  ToolStateError,
  FilePart,
  StepStartPart,
  StepFinishPart,
  Part,
  EventMessageUpdated,
  EventMessagePartUpdated,
} from '@opencode-ai/sdk';

export type OpenCodePermission = {
  bash?: 'allow' | 'deny' | 'ask' | Record<string, 'allow' | 'deny' | 'ask'>;
  edit?: 'allow' | 'deny' | 'ask';
  webfetch?: 'allow' | 'deny' | 'ask';
};

export interface OpenCodeOptions {
  model: string;
  prompt: string;
  onMessage?: (message: { info: Message; parts: Part[] }) => void;
}

export interface PRDetails {
  number: number;
  title: string;
  body: string;
  headSha: string;
  baseBranch: string;
  headBranch: string;
  diff: string;
}

export interface IssueDetails {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  committer: string;
  date: string;
  prNumber?: number;
  prTitle?: string;
}
