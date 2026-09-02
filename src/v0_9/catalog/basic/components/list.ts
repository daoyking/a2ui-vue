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

import {h, type VNode} from 'vue';
import {ListApi} from '@a2ui/web_core/v0_9/basic_catalog';

import {createComponentImplementation} from '../../../adapter';
import {cx, getBaseContainerStyle, getWeightStyle, mapAlign, renderChildRefs, type Style} from '../utils';

/**
 * List: lays out its children as a list.
 *
 * Template-spawned items arrive as `{id, basePath}` pairs; `renderChildRefs`
 * forwards the base path so `buildChild` picks the right instance.
 */
export const List = createComponentImplementation(ListApi, ({props, buildChild}) => {
  const horizontal = props.direction === 'horizontal';
  const listStyle = props.listStyle as string | undefined;
  // `none` renders no markers, so the container stays a flex div.
  const tag = listStyle === 'ordered' ? 'ol' : listStyle === 'unordered' ? 'ul' : 'div';

  const style: Style = {
    ...getBaseContainerStyle(),
    ...getWeightStyle(props.weight as number | undefined),
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    alignItems: mapAlign(props.align as string | undefined),
    gap: 'var(--a2ui-list-gap, var(--a2ui-spacing-s, 8px))',
  };

  if (listStyle === 'ordered' || listStyle === 'unordered') {
    style.listStyle = listStyle === 'ordered' ? 'decimal' : 'disc';
    style.paddingLeft = 'var(--a2ui-list-padding, 20px)';
  }

  return h(
    tag,
    {class: cx('a2ui-list', `a2ui-list--${listStyle ?? 'none'}`), style},
    renderChildRefs(props.children, buildChild) as VNode[],
  );
});
