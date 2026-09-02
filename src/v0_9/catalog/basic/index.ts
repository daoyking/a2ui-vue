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

import {Catalog} from '@a2ui/web_core/v0_9';
import {BASIC_FUNCTIONS} from '@a2ui/web_core/v0_9/basic_catalog';

import type {VueComponentImplementation} from '../../types';

import {Card, Column, Divider, Modal, Row} from './components/layout';
import {Icon, Text} from './components/text';
import {AudioPlayer, Image, Video} from './components/media';
import {List} from './components/list';
import {Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField} from './components/form';
import {Tabs} from './components/tabs';

export {Card, Column, Divider, Modal, Row};
export {Icon, Text};
export {AudioPlayer, Image, Video};
export {List};
export {Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField};
export {Tabs};

/**
 * The standard A2UI basic catalog, rendered with Vue components.
 *
 * The catalog id matches the spec's canonical URI so that payloads authored
 * against the basic catalog work across every A2UI renderer.
 */
const basicComponents: VueComponentImplementation[] = [
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  Tabs,
  Divider,
  Modal,
  Button,
  TextField,
  CheckBox,
  ChoicePicker,
  Slider,
  DateTimeInput,
];

export const basicCatalog = new Catalog<VueComponentImplementation>(
  'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
  basicComponents,
  BASIC_FUNCTIONS,
);
