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

/**
 * @a2ui/vue — Vue 3 renderer for A2UI (Agent-to-User Interface).
 *
 * A2UI lets agents "speak UI": they send declarative JSON describing the
 * intent of an interface, and the client renders it with its own trusted
 * component catalog. The result is safe like data, but expressive like code.
 *
 * The Vue adapter reuses `@a2ui/web_core` for state, binding, and message
 * processing, and contributes only the framework surface: how a resolved
 * component tree becomes Vue vnodes.
 */

export * from './v0_9';
