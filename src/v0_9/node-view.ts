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

import {
  computed,
  defineComponent,
  h,
  inject,
  onMounted,
  provide,
  type InjectionKey,
  type PropType,
} from 'vue';
import {
  ComponentContext,
  isComponentNode,
  isWritable,
  peekValue,
  ResolvedBinding,
  type ComponentNode,
  type NodeProps,
  type SurfaceModel,
} from '@a2ui/web_core/v0_9';

import type {VueBuildChild, VueComponentImplementation} from './types';

type Node = ComponentNode<VueComponentImplementation>;

/** Injection key for the surface a node view renders under. */
export const NodeSurfaceKey = Symbol('A2uiNodeSurface') as InjectionKey<SurfaceModel<
  VueComponentImplementation
> | null>;

/** Stands in for a component that has not arrived, or has just been removed. */
export const LoadingPlaceholder = defineComponent({
  name: 'A2uiLoadingPlaceholder',
  props: {componentId: {type: String, required: true}},
  setup(props) {
    return () =>
      h('div', {style: {color: 'gray', padding: '4px'}}, `[Loading ${props.componentId}...]`);
  },
});

/** Unresolved-reference reports already dispatched, per surface. */
const reportedUnresolved = new WeakMap<SurfaceModel<VueComponentImplementation>, Set<string>>();

/**
 * The in-tree notice for a child reference the resolver built no node for.
 * Reports through the surface's error channel once per (id, path) so agents
 * see it too. Dispatch happens on mount: dispatching during render would
 * invoke `onError` subscribers while Vue is rendering.
 */
export const UnresolvedChildReference = defineComponent({
  name: 'A2uiUnresolvedChildReference',
  props: {
    surface: {type: Object as PropType<SurfaceModel<VueComponentImplementation> | null>, default: null},
    id: {type: String, required: true},
    requestedPath: {type: String, required: true},
    detail: {type: String, required: true},
  },
  setup(props) {
    const message = computed(
      () => `Unresolved child reference '${props.id}' at '${props.requestedPath}': ${props.detail}`,
    );

    onMounted(() => {
      const surface = props.surface;
      if (!surface) return;
      let seen = reportedUnresolved.get(surface);
      if (!seen) {
        seen = new Set();
        reportedUnresolved.set(surface, seen);
      }
      const key = JSON.stringify([props.id, props.requestedPath]);
      if (!seen.has(key)) {
        seen.add(key);
        void surface.dispatchError({code: 'UNRESOLVED_CHILD_REFERENCE', message: message.value});
      }
    });

    return () => h('div', {style: {color: 'red'}}, message.value);
  },
});

/** Child nodes of one view, keyed by id, then by the child's data path. */
type ChildMap = Map<string, Map<string, Node>>;

interface ChildIndex {
  byToken: ChildMap;
  byId: ChildMap;
}

function newChildIndex(): ChildIndex {
  return {byToken: new Map(), byId: new Map()};
}

function setChild(map: ChildMap, id: string, child: Node, firstWins: boolean): void {
  let byPath = map.get(id);
  if (!byPath) {
    byPath = new Map();
    map.set(id, byPath);
  }
  if (!firstWins || !byPath.has(child.dataPath)) {
    byPath.set(child.dataPath, child);
  }
}

function registerChild(index: ChildIndex, child: Node): string {
  setChild(index.byToken, child.instanceId, child, false);
  setChild(index.byId, child.componentId, child, true);
  return child.instanceId;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Converts node-resolved props to the shapes catalog views are written against. */
function toViewValue(parent: Node, value: unknown, index: ChildIndex): unknown {
  if (isComponentNode(value)) {
    const child = value as Node;
    const token = registerChild(index, child);
    if (child.dataPath !== parent.dataPath) {
      return {id: token, basePath: child.dataPath};
    }
    return token;
  }
  if (value instanceof ResolvedBinding) {
    return toViewValue(parent, value.value, index);
  }
  if (Array.isArray(value)) {
    return value.map((item) => toViewValue(parent, item, index));
  }
  if (isPlainObject(value)) {
    return toViewProps(parent, value, index);
  }
  return value;
}

/**
 * Unwraps each `ResolvedBinding` into a value + `set<Prop>` pair. A read-only
 * binding gets a no-op setter, matching `GenericBinder`'s literal handling.
 */
function toViewProps(
  parent: Node,
  props: Record<string, unknown>,
  index: ChildIndex,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(props)) {
    if (inner instanceof ResolvedBinding) {
      result[key] = toViewValue(parent, inner.value, index);
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      result[setterName] = isWritable(inner) ? inner.set : () => {};
    } else {
      result[key] = toViewValue(parent, inner, index);
    }
  }
  return result;
}

/**
 * Subscribes to a node's props and adapts them to the shape catalog views
 * implement: converted props, a `ComponentContext`, and a string-id
 * `buildChild` resolving through the conversion's child index.
 */
export function useNodeView(node: () => Node, buildChild: VueBuildChild) {
  const surface = inject(NodeSurfaceKey, null);

  const converted = computed(() => {
    const index = newChildIndex();
    const nodeProps = (peekValue(node().props) ?? {}) as NodeProps;
    return {
      viewProps: toViewProps(node(), nodeProps, index) as NodeProps,
      childIndex: index,
    };
  });

  // The component can be removed between the resolver's update and this render
  // committing; ComponentContext's constructor throws on a missing model, so
  // treat that window as not-ready rather than crashing.
  const context = computed(() => {
    const n = node();
    return surface && surface.componentsModel.get(n.componentId)
      ? new ComponentContext(surface, n.componentId, n.dataPath)
      : undefined;
  });

  const resolveThrough = (
    map: ChildMap,
    id: string | ComponentNode<VueComponentImplementation>,
    basePath?: string,
  ): ReturnType<VueBuildChild> => {
    const n = node();
    const requested = basePath ?? n.dataPath;
    const key = typeof id === 'string' ? id : id.instanceId;
    const byPath = map.get(key);
    const childNode = byPath?.get(requested);
    if (childNode) {
      return buildChild(childNode, basePath);
    }
    const elsewhere = byPath ? [...byPath.keys()] : [];
    if (elsewhere.length > 0) {
      return h(UnresolvedChildReference, {
        key: JSON.stringify([id, requested]),
        surface,
        id: key,
        requestedPath: requested,
        detail:
          `instances exist at ${elsewhere.join(', ')}. Instances are created only at ` +
          `the data paths the payload implies; buildChild selects among them.`,
      });
    }
    return buildChild(id, basePath);
  };

  const viewBuildChild: VueBuildChild = (id, basePath) =>
    resolveThrough(converted.value.childIndex.byToken, id, basePath) as ReturnType<VueBuildChild>;

  const rawBuildChild: VueBuildChild = (id, basePath) =>
    resolveThrough(converted.value.childIndex.byId, id, basePath) as ReturnType<VueBuildChild>;

  return {viewProps: converted, context, viewBuildChild, rawBuildChild, surface};
}

/**
 * Recursively renders one resolved component node.
 *
 * Each node resolves to its implementation's `render` wrapper (which binds its
 * own props) or to `A2uiSurface`'s buildChild when the node arrives as a child.
 */
export const NodeView = defineComponent({
  name: 'A2uiNodeView',
  props: {
    surface: {
      type: Object as PropType<SurfaceModel<VueComponentImplementation>>,
      required: true,
    },
    node: {type: Object as PropType<Node>, required: true},
  },
  setup(props) {
    const buildChild: VueBuildChild = (child, basePath) => {
      if (isComponentNode(child)) {
        return h(NodeView, {
          key: (child as Node).instanceId,
          surface: props.surface,
          node: child as Node,
        });
      }
      const n = props.node;
      const requested = basePath ?? n.dataPath;
      const detail = props.surface.componentsModel.get(child)
        ? 'the component exists, but the catalog schema does not mark the referencing ' +
          'property as a component id. Use componentId() or childList() from @a2ui/web_core.'
        : 'no component with this id exists on the surface.';
      return h(UnresolvedChildReference, {
        key: JSON.stringify([child, requested]),
        surface: props.surface,
        id: child,
        requestedPath: requested,
        detail,
      });
    };

    const {viewProps, context, rawBuildChild} = useNodeView(() => props.node, buildChild);

    return () => {
      const n = props.node;

      // A definition arrived whose type has no catalog entry; the resolver has
      // already reported UNKNOWN_COMPONENT_TYPE for it.
      if (n.state === 'unknown-type') {
        return h('div', {style: {color: 'red'}}, `Unknown component type: ${n.type}`);
      }
      if (n.isPlaceholder) {
        return h(LoadingPlaceholder, {componentId: n.componentId});
      }

      const ctx = context.value;
      if (!ctx) {
        return h(LoadingPlaceholder, {componentId: n.componentId});
      }

      const impl = n.impl;
      if (!impl?.render) {
        // Unreachable for a resolved node; kept as type narrowing.
        return null;
      }

      // `viewProps` is a computed: touching it here registers the child-index
      // side effects `rawBuildChild` resolves through.
      void viewProps.value;

      return h(impl.render, {
        key: n.instanceId,
        context: ctx,
        buildChild: rawBuildChild,
      });
    };
  },
});

/** Provides the surface context that `useNodeView` reads. */
export function provideNodeSurface(surface: SurfaceModel<VueComponentImplementation>) {
  provide(NodeSurfaceKey, surface);
}
