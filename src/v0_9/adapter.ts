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

import {defineComponent, onScopeDispose, shallowRef, watch, type Component, type PropType} from 'vue';
import {
  GenericBinder,
  effect,
  getValue,
  peekValue,
  type ComponentApi,
  type ComponentContext,
  type Signal,
} from '@a2ui/web_core/v0_9';

import type {
  PropsOf,
  VueA2uiRenderFn,
  VueBuildChild,
  VueComponentImplementation,
} from './types';

/**
 * Bridges a framework-agnostic A2UI signal into Vue's reactivity system.
 *
 * The React renderer does this with `useSyncExternalStore`; Vue has a neater
 * equivalent: run the signal read inside an A2UI `effect` and write straight
 * into a `shallowRef`. Any change to the signal triggers Vue's own scheduler.
 */
export function useSignalValue<T>(signal: Signal<T>) {
  const value = shallowRef<T>(peekValue(signal));

  const dispose = effect(() => {
    getValue(signal);
    value.value = peekValue(signal);
  });

  onScopeDispose(() => {
    if (typeof dispose === 'function') {
      dispose();
    } else if (dispose && typeof (dispose as {unsubscribe?: () => void}).unsubscribe === 'function') {
      (dispose as {unsubscribe: () => void}).unsubscribe();
    }
  });

  return value;
}

/**
 * Subscribes a `GenericBinder` to Vue reactivity and returns the live props.
 *
 * `GenericBinder` owns the DataModel subscriptions; disposing it on scope
 * teardown is what prevents the leak the React renderer guards with
 * `useEffect`. `onScopeDispose` covers both `onUnmounted` and the parent
 * `effectScope`, so a component swapped out mid-conversation still cleans up.
 */
export function useA2uiBinder<Api extends ComponentApi>(
  context: () => ComponentContext,
  api: Api,
) {
  let binder: GenericBinder<PropsOf<Api>> | null = null;
  let subscription: {unsubscribe: () => void} | null = null;

  const props = shallowRef<PropsOf<Api>>({} as PropsOf<Api>);

  const teardown = () => {
    subscription?.unsubscribe();
    subscription = null;
    binder?.dispose();
    binder = null;
  };

  const build = (ctx: ComponentContext) => {
    binder = new GenericBinder<PropsOf<Api>>(ctx, api.schema);
    props.value = (binder.snapshot ?? {}) as PropsOf<Api>;
    subscription = binder.subscribe((next) => {
      props.value = (next ?? {}) as PropsOf<Api>;
    }) as {unsubscribe: () => void};
  };

  build(context());

  // A new context reference means the component's model or data path changed;
  // rebuild the binder so subscriptions follow the new path.
  watch(context, (next) => {
    teardown();
    build(next);
  });

  onScopeDispose(teardown);

  return props;
}

/**
 * Creates a Vue component implementation from an A2UI component API.
 *
 * The returned `render` component binds props through `GenericBinder`, so a
 * value change in the DataModel re-renders only this component. The returned
 * `view` skips that work when the node layer has already resolved the props.
 */
export function createComponentImplementation<Api extends ComponentApi>(
  api: Api,
  renderFn: VueA2uiRenderFn<PropsOf<Api>>,
): VueComponentImplementation {
  const name = `${api.name}`;

  const Wrapper = defineComponent({
    name: `A2ui${name}`,
    props: {
      context: {type: Object as PropType<ComponentContext>, required: true},
      buildChild: {type: Function as PropType<VueBuildChild>, required: true},
    },
    setup(props) {
      const bound = useA2uiBinder(() => props.context as ComponentContext, api);
      return () =>
        renderFn({
          props: bound.value,
          buildChild: props.buildChild as VueBuildChild,
          context: props.context as ComponentContext,
        }) ?? null;
    },
  });

  return {
    name: api.name,
    schema: api.schema,
    render: Wrapper,
  } as VueComponentImplementation;
}

/**
 * Wraps an already-authored Vue component as a catalog implementation.
 *
 * Reach for this instead of {@link createComponentImplementation} when the
 * component holds state of its own (open/closed, selected tab, filter text).
 * The render function form runs on every render, so a `ref` declared inside it
 * would be recreated each time and lose its value; a component's `setup` runs
 * once per instance, which is where that state belongs.
 *
 * Inside the component call {@link useA2uiProps} to receive bound props.
 */
export function fromVueComponent<Api extends ComponentApi>(
  api: Api,
  component: Component,
): VueComponentImplementation {
  return {
    name: api.name,
    schema: api.schema,
    render: component,
  } as VueComponentImplementation;
}

/**
 * Binds a context to an API schema inside a component's `setup`.
 *
 * The companion to {@link fromVueComponent}: returns a shallow ref of resolved
 * props that tracks the DataModel for the lifetime of the component.
 */
export function useA2uiProps<Api extends ComponentApi>(context: () => ComponentContext, api: Api) {
  return useA2uiBinder(context, api);
}

/**
 * Creates a component implementation that binds its own values from the
 * context instead of going through the generic binder.
 *
 * Use for components whose props are not a flat schema (e.g. `List`, which
 * reads a template child and a data array).
 */
export function createBinderlessComponentImplementation<Api extends ComponentApi>(
  api: Api,
  renderFn: (args: {
    context: ComponentContext;
    buildChild: VueBuildChild;
  }) => ReturnType<VueA2uiRenderFn<never>>,
): VueComponentImplementation {
  const Wrapper = defineComponent({
    name: `A2ui${api.name}`,
    props: {
      context: {type: Object as PropType<ComponentContext>, required: true},
      buildChild: {type: Function as PropType<VueBuildChild>, required: true},
    },
    setup(props) {
      return () =>
        renderFn({
          context: props.context as ComponentContext,
          buildChild: props.buildChild as VueBuildChild,
        }) ?? null;
    },
  });

  return {
    name: api.name,
    schema: api.schema,
    render: Wrapper,
  } as VueComponentImplementation;
}
