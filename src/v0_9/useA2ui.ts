/*
 * Copyright 2026 The A2UI Vue Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {onScopeDispose, shallowReactive} from 'vue';
import {
  MessageProcessor,
  type A2uiClientAction,
  type A2uiMessage,
  type Catalog,
  type SurfaceModel,
} from '@a2ui/web_core/v0_9';

import {basicCatalog} from './catalog/basic';
import type {VueComponentImplementation} from './types';

export interface UseA2uiOptions {
  /** Catalogs to render with. Defaults to the standard basic catalog. */
  catalogs?: Catalog<VueComponentImplementation>[];
  /** Called for every user action dispatched from any surface. */
  onAction?: (action: A2uiClientAction) => void | Promise<void>;
  /** Protocol version. Defaults to `v0.9`. */
  version?: 'v0.9' | 'v0.9.1';
}

/**
 * Owns a `MessageProcessor` and exposes its surfaces as reactive state.
 *
 * Feed it A2UI messages from an agent (over SSE, A2A, a fetch response, or a
 * static file) and render each surface with `<A2uiSurface>`. Subscriptions are
 * released when the owning scope is disposed.
 */
export function useA2ui(options: UseA2uiOptions = {}) {
  const processor = new MessageProcessor<VueComponentImplementation>(
    options.catalogs ?? [basicCatalog],
    options.onAction,
    {version: options.version ?? 'v0.9'},
  );

  const surfaces = shallowReactive<SurfaceModel<VueComponentImplementation>[]>(
    [...processor.model.surfacesMap.values()],
  );

  const subscriptions = [
    processor.onSurfaceCreated((surface) => {
      if (!surfaces.includes(surface)) surfaces.push(surface);
    }),
    processor.onSurfaceDeleted((id) => {
      const index = surfaces.findIndex((s) => s.id === id);
      if (index !== -1) surfaces.splice(index, 1);
    }),
  ];

  onScopeDispose(() => {
    for (const sub of subscriptions) sub.unsubscribe?.();
    surfaces.length = 0;
  });

  return {
    /** The underlying processor, for capabilities and data-model reads. */
    processor,
    /** Reactive list of surfaces; render each with `<A2uiSurface>`. */
    surfaces,
    /** Processes an ordered list of A2UI messages (or a wrapped list). */
    processMessages: (messages: A2uiMessage[] | {messages: A2uiMessage[]}) =>
      processor.processMessages(messages as A2uiMessage[]),
    /** The client capabilities object to send to the agent. */
    getClientCapabilities: (opts?: {includeInlineCatalogs?: boolean}) =>
      processor.getClientCapabilities(opts),
    /** The aggregated data model for surfaces with `sendDataModel` enabled. */
    getClientDataModel: () => processor.getClientDataModel(options.version ?? 'v0.9'),
  };
}
