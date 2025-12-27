import { execSync } from 'child_process';
import { createOpencode } from '@opencode-ai/sdk';
import type { Part, EventMessageUpdated, Message } from '@opencode-ai/sdk';
import type { OpenCodeOptions } from '../types.js';
import { log } from './logger.js';

let opencodeInstance: Awaited<ReturnType<typeof createOpencode>> | null = null;

export async function ensureOpenCode(): Promise<void> {
  log.dim('Initializing OpenCode SDK...');

  try {
    execSync('opencode --version', { stdio: 'ignore' });
    return;
  } catch {
    log.warn('OpenCode CLI not found. Installing @opencode-ai/cli globally...');

    try {
      execSync('npm install -g @opencode-ai/cli', { stdio: 'inherit' });
      log.success('Installed @opencode-ai/cli globally.');
    } catch (error) {
      throw new Error(
        'Failed to install @opencode-ai/cli globally. Please install it manually with "npm install -g @opencode-ai/cli".'
      );
    }
  }
}

export async function startServer(): Promise<void> {
  if (opencodeInstance) {
    log.dim('OpenCode already running');
    return;
  }

  log.step('Starting OpenCode server...');

  opencodeInstance = await createOpencode({
    hostname: '127.0.0.1',
    port: 4199,
    config: {
      model: 'minimax/MiniMax-M2.1',
    },
  });

  log.success('OpenCode server started');
}

export async function stopServer(): Promise<void> {
  if (opencodeInstance) {
    opencodeInstance.server.close();
    opencodeInstance = null;
  }
}

function parseModel(model: string): { providerID: string; modelID: string } {
  const [providerID, ...rest] = model.split('/');
  const modelID = rest.join('/');

  if (!providerID?.length || !modelID.length) {
    throw new Error(`Invalid model format: ${model}. Expected "provider/model".`);
  }

  return { providerID, modelID };
}

function extractTextFromParts(parts: Part[]): string {
  return parts
    .filter((part): part is Part & { text: string } => 
      (part.type === 'text' || part.type === 'reasoning') && 'text' in part)
    .map(part => part.text)
    .join('');
}

export async function runOpenCode(options: OpenCodeOptions): Promise<string> {
  if (!opencodeInstance) {
    throw new Error('OpenCode not initialized. Call startServer() first.');
  }

  log.step('Running AI analysis...');

  const createResult = await opencodeInstance.client.session.create();
  if (createResult.error || !createResult.data) {
    throw new Error('Failed to create session');
  }
  const session = createResult.data;

  const { providerID, modelID } = parseModel(options.model);

  const events = await opencodeInstance.client.event.subscribe();
  const completedAssistantMessages = new Set<string>();
  let isComplete = false;

  const eventProcessor = (async () => {
    for await (const event of events.stream) {
      const evt = event as EventMessageUpdated | { type: string };

      if (evt.type === 'message.updated' && 'properties' in evt) {
        const info = evt.properties.info;
        if (!info || info.sessionID !== session.id) continue;
        if (info.role !== 'assistant') continue;

        const assistantInfo = info as Message & { time?: { completed?: number } };
        if (assistantInfo.time?.completed && !completedAssistantMessages.has(info.id)) {
          completedAssistantMessages.add(info.id);

          const messageResult = await opencodeInstance!.client.session.message({
            path: { id: session.id, messageID: info.id },
          });

          if (!messageResult.error && messageResult.data) {
            const { info: msgInfo, parts } = messageResult.data;
            if (options.onMessage) {
              options.onMessage({ info: msgInfo, parts });
            }
          }
        }
      }

      if (isComplete) break;
    }
  })();

  try {
    const promptResult = await opencodeInstance.client.session.prompt({
      path: { id: session.id },
      body: {
        model: { providerID, modelID },
        parts: [{ type: 'text' as const, text: options.prompt }],
      },
    });

    if (promptResult.error) {
      throw new Error(`Prompt failed: ${JSON.stringify(promptResult.error)}`);
    }

    isComplete = true;
    await new Promise(resolve => setTimeout(resolve, 500));

    if (options.onMessage && promptResult.data) {
      const { info, parts } = promptResult.data as { info: Message; parts: Part[] };
      if (info.role === 'assistant' && !completedAssistantMessages.has(info.id)) {
        options.onMessage({ info, parts });
      }
    }

    const response = promptResult.data as { parts?: Part[] } | undefined;
    if (response?.parts) {
      return extractTextFromParts(response.parts);
    }
    
    return '';
  } finally {
    await opencodeInstance.client.session.delete({ path: { id: session.id } });
  }
}

process.on('exit', () => stopServer());
process.on('SIGINT', () => {
  stopServer();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});
