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

import {defineComponent, h, ref, useId, type PropType, type VNode} from 'vue';
import {
  ButtonApi,
  CheckBoxApi,
  ChoicePickerApi,
  DateTimeInputApi,
  SliderApi,
  TextFieldApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ComponentContext} from '@a2ui/web_core/v0_9';

import {createComponentImplementation, fromVueComponent, useA2uiProps} from '../../../adapter';
import {cx, getBaseLeafStyle, getWeightStyle, renderChildRefs, type Style} from '../utils';
import type {VueBuildChild} from '../../../types';

/** Reads `validationErrors` into a single message, or null when valid. */
function firstError(props: Record<string, unknown>): string | null {
  const errors = props.validationErrors;
  if (Array.isArray(errors) && errors.length > 0) return String(errors[0]);
  return null;
}

/**
 * Button: dispatches the bound action on click.
 *
 * `props.action` is already a callable closure produced by the binder, and
 * `isValid === false` disables it (the spec's client-side check gate).
 */
export const Button = createComponentImplementation(ButtonApi, ({props, buildChild}) => {
  const variant = props.variant as string | undefined;
  const disabled = props.isValid === false;

  return h(
    'button',
    {
      class: cx('a2ui-button', variant === 'primary' && 'a2ui-button--primary', variant === 'borderless' && 'a2ui-button--borderless'),
      style: {
        ...getBaseLeafStyle(),
        ...getWeightStyle(props.weight as number | undefined),
      } satisfies Style,
      disabled,
      onClick: () => {
        const action = props.action as (() => void) | undefined;
        action?.();
      },
    },
    renderChildRefs(props.child, buildChild) as VNode[],
  );
});

/** TextField: single-line, multi-line, numeric, or obscured input. */
export const TextField = createComponentImplementation(TextFieldApi, ({props}) => {
  const id = useId();
  const isLong = props.variant === 'longText';
  const type =
    props.variant === 'number' ? 'number' : props.variant === 'obscured' ? 'password' : 'text';
  const error = firstError(props as Record<string, unknown>);

  const common = {
    id,
    class: cx('a2ui-input', error && 'a2ui-input--invalid'),
    value: (props.value as string | number | undefined) ?? '',
    onInput: (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      (props.setValue as ((v: string) => void) | undefined)?.(target.value);
    },
  };

  return h('div', {class: cx('a2ui-field')}, [
    props.label ? h('label', {for: id, class: cx('a2ui-label')}, String(props.label)) : null,
    isLong ? h('textarea', common) : h('input', {...common, type}),
    error ? h('span', {class: cx('a2ui-error')}, error) : null,
  ]);
});

/** CheckBox: a labelled boolean input bound to `value` / `setValue`. */
export const CheckBox = createComponentImplementation(CheckBoxApi, ({props}) => {
  const id = useId();
  const error = firstError(props as Record<string, unknown>);

  return h('div', {class: cx('a2ui-field', 'a2ui-field--inline')}, [
    h('input', {
      id,
      type: 'checkbox',
      class: cx('a2ui-checkbox', error && 'a2ui-input--invalid'),
      checked: Boolean(props.value),
      onChange: (e: Event) => {
        const target = e.target as HTMLInputElement;
        (props.setValue as ((v: boolean) => void) | undefined)?.(target.checked);
      },
    }),
    h('label', {for: id, class: cx('a2ui-label')}, String(props.label ?? '')),
    error ? h('span', {class: cx('a2ui-error')}, error) : null,
  ]);
});

/** Slider: a numeric range input. */
export const Slider = createComponentImplementation(SliderApi, ({props}) => {
  const id = useId();
  const error = firstError(props as Record<string, unknown>);

  return h('div', {class: cx('a2ui-field')}, [
    props.label ? h('label', {for: id, class: cx('a2ui-label')}, String(props.label)) : null,
    h('input', {
      id,
      type: 'range',
      class: cx('a2ui-slider'),
      min: props.min as number | undefined,
      max: props.max as number | undefined,
      value: props.value as number | undefined,
      onInput: (e: Event) => {
        const target = e.target as HTMLInputElement;
        (props.setValue as ((v: number) => void) | undefined)?.(Number(target.value));
      },
    }),
    error ? h('span', {class: cx('a2ui-error')}, error) : null,
  ]);
});

/** DateTimeInput: date, time, or both, as an ISO 8601 string. */
export const DateTimeInput = createComponentImplementation(DateTimeInputApi, ({props}) => {
  const id = useId();
  const error = firstError(props as Record<string, unknown>);
  const enableDate = props.enableDate !== false;
  const enableTime = props.enableTime === true;
  const type = enableDate && enableTime ? 'datetime-local' : enableTime ? 'time' : 'date';

  return h('div', {class: cx('a2ui-field')}, [
    props.label ? h('label', {for: id, class: cx('a2ui-label')}, String(props.label)) : null,
    h('input', {
      id,
      type,
      class: cx('a2ui-input', error && 'a2ui-input--invalid'),
      value: String(props.value ?? ''),
      min: props.min == null ? undefined : String(props.min),
      max: props.max == null ? undefined : String(props.max),
      onInput: (e: Event) => {
        const target = e.target as HTMLInputElement;
        (props.setValue as ((v: string) => void) | undefined)?.(target.value);
      },
    }),
    error ? h('span', {class: cx('a2ui-error')}, error) : null,
  ]);
});

interface ChoiceOption {
  label?: string;
  value?: string;
}

/**
 * ChoicePicker: checkbox/chip group, optionally filterable.
 *
 * A component rather than a render function because the filter text is
 * instance state that must survive data updates.
 */
const ChoicePickerComponent = defineComponent({
  name: 'A2uiChoicePicker',
  props: {
    context: {type: Object as PropType<ComponentContext>, required: true},
    buildChild: {type: Function as PropType<VueBuildChild>, required: true},
  },
  setup(props) {
    const bound = useA2uiProps(() => props.context, ChoicePickerApi);
    const filter = ref('');

    return () => {
      const p = bound.value as unknown as Record<string, unknown>;
      const values: string[] = Array.isArray(p.value) ? (p.value as string[]) : [];
      const exclusive = p.variant === 'mutuallyExclusive';
      const error = firstError(p);
      const allOptions = (Array.isArray(p.options) ? p.options : []) as ChoiceOption[];

      const toggle = (val: string) => {
        const setValue = p.setValue as ((v: string[]) => void) | undefined;
        if (!setValue) return;
        if (exclusive) {
          setValue([val]);
          return;
        }
        setValue(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
      };

      const options = p.filterable
        ? allOptions.filter((opt) =>
            String(opt.label ?? '')
              .toLowerCase()
              .includes(filter.value.toLowerCase()),
          )
        : allOptions;

      const chips = p.displayStyle === 'chips';

      return h('div', {class: cx('a2ui-field', 'a2ui-choice-picker')}, [
        p.label ? h('strong', {class: cx('a2ui-label')}, String(p.label)) : null,
        p.filterable
          ? h('input', {
              class: cx('a2ui-input'),
              placeholder: 'Filter options...',
              value: filter.value,
              onInput: (e: Event) => {
                filter.value = (e.target as HTMLInputElement).value;
              },
            })
          : null,
        h(
          'div',
          {class: cx('a2ui-choice-options', chips && 'a2ui-choice-options--chips')},
          options.map((opt, i) => {
            const val = String(opt.value ?? '');
            const selected = values.includes(val);
            return chips
              ? h(
                  'button',
                  {
                    key: i,
                    type: 'button',
                    class: cx('a2ui-chip', selected && 'a2ui-chip--selected'),
                    onClick: () => toggle(val),
                  },
                  String(opt.label ?? ''),
                )
              : h('label', {key: i, class: cx('a2ui-option')}, [
                  h('input', {
                    type: exclusive ? 'radio' : 'checkbox',
                    checked: selected,
                    onChange: () => toggle(val),
                  }),
                  h('span', {class: cx('a2ui-option-text')}, String(opt.label ?? '')),
                ]);
          }),
        ),
        error ? h('span', {class: cx('a2ui-error')}, error) : null,
      ]);
    };
  },
});

export const ChoicePicker = fromVueComponent(ChoicePickerApi, ChoicePickerComponent);
