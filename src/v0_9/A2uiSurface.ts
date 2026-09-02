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

import {defineComponent, h, onScopeDispose, provide, shallowRef, watch, type PropType} from 'vue';
import {
  NodeResolver,
  effect,
  getValue,
  peekValue,
  type ComponentNode,
  type SurfaceModel,
} from '@a2ui/web_core/v0_9';

import {LoadingPlaceholder, NodeSurfaceKey, NodeView} from './node-view';
import type {VueComponentImplementation} from './types';

/**
 * Renders one A2UI surface.
 *
 * Constructs a `NodeResolver` over the surface and renders the resolved
 * `ComponentNode` tree it maintains. Each catalog component subscribes to its
 * own node's props through the adapter, so a data change re-renders exactly
 * the affected component rather than the whole tree.
 */
export const A2uiSurface = defineComponent({
  name: 'A2uiSurface',
  props: {
    surface: {
      type: Object as PropType<SurfaceModel<VueComponentImplementation>>,
      required: true,
    },
  },
  setup(props) {
    const root = shallowRef<ComponentNode<VueComponentImplementation> | undefined>(undefined);

    let resolver: NodeResolver<VueComponentImplementation> | undefined;
    let stopEffect: (() => void) | undefined;

    const teardown = () => {
      stopEffect?.();
      stopEffect = undefined;
      resolver?.dispose();
      resolver = undefined;
      root.value = undefined;
    };

    const start = () => {
      // `surface.catalog` carries the component implementations and the
      // executable function set the resolver needs to resolve derived values.
      resolver = new NodeResolver<VueComponentImplementation>(props.surface, props.surface.catalog);
      root.value = peekValue(resolver.rootNode);
      stopEffect = effect(() => {
        if (!resolver) return;
        getValue(resolver.rootNode);
        root.value = peekValue(resolver.rootNode);
      }) as () => void;
    };

    start();

    watch(
      () => props.surface,
      () => {
        teardown();
        start();
      },
    );

    onScopeDispose(teardown);

    provide(NodeSurfaceKey, props.surface);

    return () =>
      root.value
        ? h(NodeView, {surface: props.surface, node: root.value})
        : h(LoadingPlaceholder, {componentId: 'root'});
  },
});
