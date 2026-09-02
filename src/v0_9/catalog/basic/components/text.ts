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

import {h} from 'vue';
import MarkdownIt from 'markdown-it';
import {IconApi, TextApi} from '@a2ui/web_core/v0_9/basic_catalog';

import {createComponentImplementation} from '../../../adapter';
import {cx, getBaseLeafStyle, getWeightStyle, type Style} from '../utils';

/**
 * `html: false` is the security-relevant setting: agent-authored text is
 * rendered as Markdown, and raw HTML in it is escaped rather than injected.
 * A2UI payloads are data, never executable markup.
 */
const md = new MarkdownIt({html: false, linkify: true, breaks: true});

/** Variants rendered as native typographic tags rather than through Markdown. */
const NON_MARKDOWN_VARIANTS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'caption']);

/** Text: renders Markdown (or a native heading tag for typographic variants). */
export const Text = createComponentImplementation(TextApi, ({props}) => {
  const text = typeof props.text === 'string' ? props.text : String(props.text ?? '');
  const variant = props.variant as string | undefined;

  const style: Style = {
    ...getBaseLeafStyle(),
    ...getWeightStyle(props.weight as number | undefined),
  };

  if (variant && NON_MARKDOWN_VARIANTS.has(variant)) {
    const isCaption = variant === 'caption';
    const tag = isCaption ? 'em' : variant;
    return h(
      isCaption ? 'span' : 'div',
      {class: cx('a2ui-text', isCaption ? 'a2ui-caption' : variant), style},
      [h(tag, text)],
    );
  }

  return h('div', {
    class: cx('a2ui-text', variant || 'body'),
    style,
    innerHTML: md.render(text),
  });
});

/**
 * Names that differ between the A2UI spec and the Material Symbols font.
 * Kept in sync with the React renderer so payloads render identically.
 */
const ICON_NAME_OVERRIDES: Record<string, string> = {
  play: 'play_arrow',
  rewind: 'fast_rewind',
  favoriteOff: 'favorite_border',
  starOff: 'star_border',
};

/** `shoppingCart` -> `shopping_cart`, for the Material Symbols font. */
function toMaterialSymbol(name: string): string {
  return ICON_NAME_OVERRIDES[name] ?? name.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

/** Icon: a Material Symbols glyph, or a custom SVG path from the payload. */
export const Icon = createComponentImplementation(IconApi, ({props}) => {
  const style: Style = {
    ...getBaseLeafStyle(),
    ...getWeightStyle(props.weight as number | undefined),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--a2ui-icon-size, var(--a2ui-font-size-xl, 24px))',
    color: 'var(--a2ui-icon-color, inherit)',
    lineHeight: 1,
  };

  const name = props.name as unknown;

  // The spec allows an inline SVG path in place of a named glyph.
  if (name && typeof name === 'object' && 'svgPath' in name) {
    const path = (name as {svgPath?: string}).svgPath ?? '';
    return h(
      'svg',
      {
        class: cx('a2ui-icon'),
        style,
        viewBox: '0 0 24 24',
        width: '1em',
        height: '1em',
        fill: 'currentColor',
        'aria-hidden': 'true',
      },
      [h('path', {d: path})],
    );
  }

  return h(
    'span',
    {
      class: cx('a2ui-icon', 'material-symbols-outlined'),
      style,
      'aria-hidden': 'true',
    },
    toMaterialSymbol(String(name ?? '')),
  );
});
