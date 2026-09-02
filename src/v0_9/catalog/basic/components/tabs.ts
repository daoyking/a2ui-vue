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

import {computed, defineComponent, h, ref, type PropType} from 'vue';
import {TabsApi} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ComponentContext} from '@a2ui/web_core/v0_9';

import {fromVueComponent, useA2uiProps} from '../../../adapter';
import {cx, getBaseContainerStyle, getWeightStyle, type Style} from '../utils';
import type {VueBuildChild} from '../../../types';

interface Tab {
  title?: string;
  child?: string | {id: string; basePath?: string};
}

/**
 * Tabs: a tab bar plus the active tab's content.
 *
 * The selected index is instance state, so this is authored as a component:
 * a render function would reset the selection on every data update.
 */
const TabsComponent = defineComponent({
  name: 'A2uiTabs',
  props: {
    context: {type: Object as PropType<ComponentContext>, required: true},
    buildChild: {type: Function as PropType<VueBuildChild>, required: true},
  },
  setup(props) {
    const bound = useA2uiProps(() => props.context, TabsApi);
    const selected = ref(0);

    const tabs = computed<Tab[]>(() => {
      const p = bound.value as unknown as Record<string, unknown>;
      return Array.isArray(p.tabs) ? (p.tabs as Tab[]) : [];
    });

    return () => {
      const list = tabs.value;
      // Clamp rather than render nothing: an agent can shrink `tabs` between
      // messages while the user's selection still points at the old index.
      const index = Math.min(selected.value, Math.max(list.length - 1, 0));
      const active = list[index];

      return h(
        'div',
        {
          class: cx('a2ui-tabs'),
          style: {
            ...getBaseContainerStyle(),
            ...getWeightStyle((bound.value as Record<string, unknown>).weight as number | undefined),
          } satisfies Style,
        },
        [
          h(
            'div',
            {class: cx('a2ui-tab-bar'), role: 'tablist'},
            list.map((tab, i) =>
              h(
                'button',
                {
                  key: i,
                  type: 'button',
                  role: 'tab',
                  class: cx('a2ui-tab', i === index && 'a2ui-tab--active'),
                  'aria-selected': i === index,
                  onClick: () => {
                    selected.value = i;
                  },
                },
                String(tab.title ?? ''),
              ),
            ),
          ),
          h(
            'div',
            {class: cx('a2ui-tab-content')},
            active?.child
              ? typeof active.child === 'string'
                ? props.buildChild(active.child)
                : props.buildChild(active.child.id, active.child.basePath)
              : undefined,
          ),
        ],
      );
    };
  },
});

export const Tabs = fromVueComponent(TabsApi, TabsComponent);
