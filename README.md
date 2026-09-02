# @a2ui/vue

A **Vue 3 renderer** for [A2UI](https://a2ui.org/) (Agent-to-User Interface) — the open protocol that lets AI agents *speak UI like data, not code*.

> Agents should describe **what** to render, not **how**. A2UI carries UI as declarative JSON; `@a2ui/vue` renders that JSON into real, sandboxed Vue components. No `eval`, no `innerHTML` from the model, no arbitrary component execution.

## Why

LLMs are great at producing JSON and bad at producing safe UI code. A2UI closes the gap: the agent emits a `surface` (a tree of typed components with data bindings), and the host app renders it with its own trusted component catalog. If the agent references a component that doesn't exist, you get a placeholder — not a code-injection.

This package is the **Vue** entry in the A2UI renderer family, sitting alongside the official `react`, `lit`, `angular`, and `flutter` renderers. It reuses the framework-agnostic `@a2ui/web_core` (the message processor, data-model binder, and catalog schema), and adds only a thin Vue adapter on top.

## Install

```bash
npm install @a2ui/vue @a2ui/web_core vue
```

## Usage

```vue
<script setup lang="ts">
import {useA2ui, A2uiSurface} from '@a2ui/vue';
import type {A2uiClientAction} from '@a2ui/web_core/v0_9';

// `processor` owns the A2UI state; feed it messages from your agent
// (SSE, A2A, fetch, or a static file).
const {surfaces, processMessages} = useA2ui({
  onAction: (action: A2uiClientAction) => {
    // Dispatch user actions back to the agent over your transport.
    console.log('user action', action);
  },
});

// `messages` is an array of A2UI protocol messages.
processMessages(messages);
</script>

<template>
  <A2uiSurface
    v-for="surface in surfaces"
    :key="surface.surfaceId"
    :surface="surface"
  />
</template>
```

See [`demo/`](./demo) for a runnable playground using the official gallery samples.

## How it works

| Layer | Responsibility |
| --- | --- |
| `@a2ui/web_core` | Parses A2UI messages, maintains the reactive node tree and data model, owns the component catalogs (pure, framework-agnostic). |
| `@a2ui/vue` (this pkg) | Bridges web_core's signals into Vue reactivity, recursively renders resolved nodes, and ships the `basic` catalog as Vue components. |

- **Reactivity:** each catalog component subscribes to its own node's props through `GenericBinder`; a data-model change re-renders only the affected component. The bridge uses Vue's `shallowRef` + `effect` (the idiomatic equivalent of React's `useSyncExternalStore`).
- **Safety:** components are resolved by name against a fixed catalog allow-list. Unknown types and unresolved child references render as notices, never as executed code.
- **Lifecycle:** binders and signal subscriptions are disposed on Vue scope teardown, so a surface swapped mid-conversation does not leak.

## Catalog

Ships the standard **`basic`** catalog (the A2UI baseline): `Card`, `Column`, `Row`, `Text`, `Image`, `Icon`, `Button`, `TextField`, `TextArea`, `Slider`, `ChoicePicker`, `DateTimeInput`, `List`, `Tabs`, `Modal`, `Markdown`, plus `List`-item templates.

To render custom components, build a `Catalog` of `createComponentImplementation(api, renderFn)` entries and pass it to `useA2ui({ catalogs: [...] })`.

## Status

Targets A2UI **v0.9** (the current production protocol version).

## License

Apache-2.0
