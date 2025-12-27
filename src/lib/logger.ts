import pc from 'picocolors';
import type { Part, Message, ToolPart, TextPart, ReasoningPart } from '@opencode-ai/sdk';

export const log = {
  info: (msg: string) => console.log(pc.blue('ℹ'), msg),
  success: (msg: string) => console.log(pc.green('✔'), msg),
  warn: (msg: string) => console.log(pc.yellow('⚠'), msg),
  error: (msg: string) => console.error(pc.red('✖'), msg),
  step: (msg: string) => console.log(pc.cyan('→'), msg),
  dim: (msg: string) => pc.dim(msg),
};

export function banner() {
  console.log(pc.bold(pc.blue('\n🔧 open-workflows\n')));
}

function formatPart(part: Part): string[] {
  const lines: string[] = [];

  if (part.type === 'text') {
    const textPart = part as TextPart;
    if (textPart.text.trim()) {
      lines.push(textPart.text);
    }
  } else if (part.type === 'reasoning') {
    const reasonPart = part as ReasoningPart;
    if (reasonPart.text.trim()) {
      lines.push(pc.dim(pc.italic(`Thinking: ${reasonPart.text}`)));
    }
  } else if (part.type === 'tool') {
    const toolPart = part as ToolPart;
    const state = toolPart.state as { status?: string; title?: string; error?: string };
    const statusStr = state.status || 'unknown';
    let statusInfo = pc.dim(statusStr);
    if (statusStr === 'running') statusInfo = pc.yellow(statusStr);
    else if (statusStr === 'completed') statusInfo = pc.green(statusStr);
    else if (statusStr === 'error') statusInfo = pc.red(statusStr);
    
    const title = state.title;
    const toolInfo = title ? `${toolPart.tool} - ${title}` : toolPart.tool;
    lines.push(`${pc.cyan('Tool:')} ${toolInfo} (${statusInfo})`);
    if (statusStr === 'error' && state.error) {
      lines.push(pc.red(`  Error: ${state.error}`));
    }
  } else if (part.type === 'step-start') {
    lines.push(pc.dim('─'.repeat(40)));
  } else if (part.type === 'step-finish') {
    const reason = (part as { reason?: string }).reason;
    if (reason && reason !== 'end_turn') {
      lines.push(pc.dim(`Step finished: ${reason}`));
    }
  } else if (part.type === 'file') {
    const filePart = part as { url?: string; mime?: string };
    lines.push(pc.blue(`📄 File: ${filePart.url || filePart.mime}`));
  } else if (part.type === 'agent') {
    const agentPart = part as { name?: string };
    lines.push(pc.magenta(`Agent: ${agentPart.name || 'unknown'}`));
  } else if (part.type === 'subtask') {
    lines.push(pc.yellow(`Subtask: ${(part as { prompt?: string }).prompt?.slice(0, 50) || '...'}`));
  } else if (part.type === 'snapshot') {
    lines.push(pc.dim(`Snapshot: ${(part as { snapshot?: string }).snapshot?.slice(0, 50) || '...'}...`));
  }

  return lines;
}

export function formatMessage(data: { info: Message; parts: Part[] }): void {
  for (const part of data.parts) {
    const lines = formatPart(part);
    for (const line of lines) {
      console.log(line);
    }
  }
}
