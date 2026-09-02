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
import {AudioPlayerApi, ImageApi, VideoApi} from '@a2ui/web_core/v0_9/basic_catalog';

import {createComponentImplementation} from '../../../adapter';
import {cx, getBaseLeafStyle, getWeightStyle, type Style} from '../utils';

/** Sizes for the image `variant` hint, matching the basic catalog spec. */
const IMAGE_VARIANT_SIZE: Record<string, string> = {
  icon: '24px',
  avatar: '40px',
  smallFeature: '80px',
  mediumFeature: '160px',
  largeFeature: '240px',
  header: '100%',
};

const OBJECT_FIT: Record<string, string> = {
  contain: 'contain',
  cover: 'cover',
  fill: 'fill',
  none: 'none',
  scaleDown: 'scale-down',
};

/** Image: renders a URL with the requested fit and size hint. */
export const Image = createComponentImplementation(ImageApi, ({props}) => {
  const variant = props.variant as string | undefined;
  const size = variant ? IMAGE_VARIANT_SIZE[variant] : undefined;

  const style: Style = {
    ...getBaseLeafStyle(),
    ...getWeightStyle(props.weight as number | undefined),
    objectFit: OBJECT_FIT[props.fit as string] ?? 'cover',
    ...(size ? {width: size, height: variant === 'header' ? 'auto' : size} : {maxWidth: '100%'}),
    borderRadius: variant === 'avatar' ? '50%' : undefined,
  };

  return h('img', {
    class: cx('a2ui-image', variant),
    style,
    src: String(props.url ?? ''),
    alt: String(props.description ?? ''),
  });
});

/** Video: a native player with controls. */
export const Video = createComponentImplementation(VideoApi, ({props}) =>
  h('video', {
    class: cx('a2ui-video'),
    style: {
      ...getBaseLeafStyle(),
      ...getWeightStyle(props.weight as number | undefined),
      maxWidth: '100%',
    } satisfies Style,
    src: String(props.url ?? ''),
    controls: true,
  }),
);

/** AudioPlayer: a native audio element with controls. */
export const AudioPlayer = createComponentImplementation(AudioPlayerApi, ({props}) =>
  h('audio', {
    class: cx('a2ui-audio-player'),
    style: {
      ...getBaseLeafStyle(),
      ...getWeightStyle(props.weight as number | undefined),
      maxWidth: '100%',
    } satisfies Style,
    src: String(props.url ?? ''),
    controls: true,
  }),
);
