import type { ToolContext } from './agent-tools-types';
import { getFlowCardDefinition } from '@/lib/platform/cards';
import { isFlowCardId } from '@/lib/platform/cards';
import {
  GENERATED_FLOW_PACK_SERVER_MODULES,
} from '@/lib/platform/generated-flow-pack-server';
import type {
  FlowPackChatRuntimeContext,
  FlowPackChatRuntimeResult,
  FlowPackUsageRecordContext,
  FlowPackServerModule,
  FlowPackToolStreamFeedback,
} from '@/lib/platform/pack-server';

interface ResolveFlowPackChatRuntimeResult {
  earlyResponse: Response | null;
  toolContext: Partial<ToolContext>;
  streamFeedbackByToolId: Record<string, FlowPackToolStreamFeedback>;
  usageRecorders: Array<(context: FlowPackUsageRecordContext) => Promise<void> | void>;
}

function getEnabledFlowPackServerModules(
  enabledCardIds: ReadonlySet<string>
): FlowPackServerModule[] {
  const packIds = new Set<string>();

  for (const cardId of enabledCardIds) {
    if (!isFlowCardId(cardId)) continue;
    packIds.add(getFlowCardDefinition(cardId).packId);
  }

  const modules: FlowPackServerModule[] = [];
  for (const packId of packIds) {
    const serverModule = GENERATED_FLOW_PACK_SERVER_MODULES[packId];
    if (serverModule) {
      modules.push(serverModule);
    }
  }

  return modules;
}

function mergeChatRuntimeResult(
  target: ResolveFlowPackChatRuntimeResult,
  source: FlowPackChatRuntimeResult | null | undefined
): ResolveFlowPackChatRuntimeResult {
  if (!source) {
    return target;
  }

  if (source.earlyResponse && !target.earlyResponse) {
    target.earlyResponse = source.earlyResponse;
  }

  if (source.toolContext) {
    Object.assign(target.toolContext, source.toolContext);
  }

  if (source.streamFeedbackByToolId) {
    Object.assign(target.streamFeedbackByToolId, source.streamFeedbackByToolId);
  }

  return target;
}

export async function resolveFlowPackChatRuntime(
  context: FlowPackChatRuntimeContext
): Promise<ResolveFlowPackChatRuntimeResult> {
  const result: ResolveFlowPackChatRuntimeResult = {
    earlyResponse: null,
    toolContext: {},
    streamFeedbackByToolId: {},
    usageRecorders: [],
  };

  const serverModules = getEnabledFlowPackServerModules(context.enabledCardIds);

  for (const serverModule of serverModules) {
    if (serverModule.chat?.streamFeedbackByToolId) {
      Object.assign(result.streamFeedbackByToolId, serverModule.chat.streamFeedbackByToolId);
    }

    if (serverModule.chat?.recordUsage) {
      result.usageRecorders.push(serverModule.chat.recordUsage);
    }

    if (!serverModule.chat?.resolveRuntime) {
      continue;
    }

    const runtimeResult = await serverModule.chat.resolveRuntime(context);
    mergeChatRuntimeResult(result, runtimeResult);

    if (result.earlyResponse) {
      break;
    }
  }

  return result;
}
