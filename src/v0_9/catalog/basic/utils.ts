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
 * Shared style helpers for the basic catalog.
 *
 * The values mirror the React renderer so that the same A2UI payload renders
 * with the same visual result across the two adapters.
 */

export type Style = Record<string, string | number | undefined>;

export const mapJustify = (j?: string): string => {
  switch (j) {
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'spaceAround':
      return 'space-around';
    case 'spaceBetween':
      return 'space-between';
    case 'spaceEvenly':
      return 'space-evenly';
    case 'start':
      return 'flex-start';
    case 'stretch':
      return 'stretch';
    default:
      return 'flex-start';
  }
};

export const mapAlign = (a?: string): string => {
  switch (a) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'stretch':
      return 'stretch';
    default:
      return 'stretch';
  }
};

export const getBaseLeafStyle = (): Style => ({boxSizing: 'border-box'});

export const getBaseContainerStyle = (): Style => ({boxSizing: 'border-box'});

/**
 * `min-width: 0` / `min-height: 0` let weighted children shrink below their
 * intrinsic content size; without them a large child forces overflow.
 */
export const getWeightStyle = (weight?: number): Style => {
  if (typeof weight !== 'number') return {};
  return {flex: `${weight}`, minWidth: 0, minHeight: 0};
};

/** Joins class names, dropping falsy entries (a `clsx`-free equivalent). */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

/**
 * A child reference as the binder hands it to a component: either a bare id
 * (or node token) or an id plus the data path it was spawned at.
 */
export type ResolvedChildRef = string | {id: string; basePath: string};

/**
 * Renders a resolved `ChildList` (or `ComponentId`) property.
 *
 * The binder hands children as strings for nodes sharing the parent's data
 * scope and as `{id, basePath}` for template-spawned items, so `buildChild`
 * needs the base path passed through when present.
 */
export function renderChildRefs(
  refs: unknown,
  buildChild: (id: string, basePath?: string) => unknown,
): unknown[] {
  if (refs == null) return [];
  const list = Array.isArray(refs) ? refs : [refs];
  const out: unknown[] = [];
  for (const ref of list) {
    if (typeof ref === 'string') {
      out.push(buildChild(ref));
    } else if (ref && typeof ref === 'object' && 'id' in ref) {
      const r = ref as {id: string; basePath?: string};
      out.push(buildChild(r.id, r.basePath));
    }
  }
  return out;
}
