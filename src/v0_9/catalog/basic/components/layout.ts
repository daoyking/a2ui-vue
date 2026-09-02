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

import {defineComponent, h, ref, type PropType, type VNode} from 'vue';
import {CardApi, ColumnApi, DividerApi, ModalApi, RowApi} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ComponentContext} from '@a2ui/web_core/v0_9';

import {createComponentImplementation, fromVueComponent, useA2uiProps} from '../../../adapter';
import {
  cx,
  getBaseContainerStyle,
  getBaseLeafStyle,
  getWeightStyle,
  mapAlign,
  mapJustify,
  renderChildRefs,
  type Style,
} from '../utils';
import type {VueBuildChild} from '../../../types';

/** Row: lays children out along the horizontal axis. */
export const Row = createComponentImplementation(RowApi, ({props, buildChild}) =>
  h(
    'div',
    {
      class: cx('a2ui-row'),
      style: {
        ...getBaseContainerStyle(),
        ...getWeightStyle(props.weight as number | undefined),
        display: 'flex',
        flexDirection: 'row',
        justifyContent: mapJustify(props.justify as string | undefined),
        alignItems: mapAlign(props.align as string | undefined),
        gap: 'var(--a2ui-row-gap, var(--a2ui-spacing-m))',
      } satisfies Style,
    },
    renderChildRefs(props.children, buildChild) as VNode[],
  ),
);

/** Column: lays children out along the vertical axis. */
export const Column = createComponentImplementation(ColumnApi, ({props, buildChild}) =>
  h(
    'div',
    {
      class: cx('a2ui-column'),
      style: {
        ...getBaseContainerStyle(),
        ...getWeightStyle(props.weight as number | undefined),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mapJustify(props.justify as string | undefined),
        alignItems: mapAlign(props.align as string | undefined),
        gap: 'var(--a2ui-column-gap, var(--a2ui-spacing-m))',
      } satisfies Style,
    },
    renderChildRefs(props.children, buildChild) as VNode[],
  ),
);

/** Card: a surface container with elevation and rounded corners. */
export const Card = createComponentImplementation(CardApi, ({props, buildChild}) =>
  h(
    'div',
    {
      class: cx('a2ui-card'),
      style: {
        ...getBaseContainerStyle(),
        ...getWeightStyle(props.weight as number | undefined),
        borderRadius: 'var(--a2ui-radius-l, 12px)',
        border: '1px solid var(--a2ui-color-border, #e2e8f0)',
        background: 'var(--a2ui-color-surface, #fff)',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
        overflow: 'hidden',
      } satisfies Style,
    },
    renderChildRefs(props.child, buildChild) as VNode[],
  ),
);

/** Divider: a thin horizontal or vertical rule. */
export const Divider = createComponentImplementation(DividerApi, ({props}) => {
  const vertical = props.axis === 'vertical';
  return h('div', {
    class: cx('a2ui-divider', vertical ? 'a2ui-divider--vertical' : 'a2ui-divider--horizontal'),
    style: {
      ...getBaseLeafStyle(),
      ...getWeightStyle(props.weight as number | undefined),
      alignSelf: 'stretch',
      background: 'var(--a2ui-color-border, #e2e8f0)',
      ...(vertical ? {width: '1px', minHeight: '100%'} : {height: '1px', width: '100%'}),
    } satisfies Style,
  });
});

/**
 * Modal: renders a trigger inline and lifts its content into an overlay.
 *
 * Authored as a component rather than a render function because open/closed is
 * instance state: a render function re-runs on every render, which would reset
 * the overlay each time the DataModel pushed an update.
 */
const ModalComponent = defineComponent({
  name: 'A2uiModal',
  props: {
    context: {type: Object as PropType<ComponentContext>, required: true},
    buildChild: {type: Function as PropType<VueBuildChild>, required: true},
  },
  setup(props) {
    const bound = useA2uiProps(() => props.context, ModalApi);
    const open = ref(false);

    return () => {
      const p = bound.value as Record<string, unknown>;
      const buildChild = props.buildChild;
      return h('div', {class: cx('a2ui-modal-root')}, [
        ...(renderChildRefs(p.trigger, (id: string) =>
          h(
            'span',
            {
              class: cx('a2ui-modal-trigger'),
              onClick: () => {
                open.value = true;
              },
            },
            [buildChild(id)],
          ),
        ) as VNode[]),
        open.value
          ? h(
              'div',
              {
                class: cx('a2ui-modal-overlay'),
                onClick: () => {
                  open.value = false;
                },
              },
              [
                h(
                  'div',
                  {
                    class: cx('a2ui-modal-content'),
                    onClick: (e: Event) => e.stopPropagation(),
                  },
                  renderChildRefs(p.content, buildChild) as VNode[],
                ),
              ],
            )
          : null,
      ]);
    };
  },
});

export const Modal = fromVueComponent(ModalApi, ModalComponent);
