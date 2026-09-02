<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useA2ui, A2uiSurface} from '@a2ui/vue';
import type {A2uiClientAction} from '@a2ui/web_core/v0_9';
import restaurantCard from './examples/restaurant-card.json';
import contactCard from './examples/contact-card.json';

const examples: Record<string, unknown> = {
  'Restaurant Card': restaurantCard,
  'Contact Card': contactCard,
};

const exampleNames = computed(() => Object.keys(examples));

const {surfaces, processMessages} = useA2ui({
  onAction: (action: A2uiClientAction) => {
    // In a real app you would dispatch `action` back to the agent over SSE/A2A.
    console.log('[a2ui action]', action);
  },
});

const active = ref('Restaurant Card');

function load(name: string) {
  active.value = name;
  const example = examples[name];
  // Official gallery samples are arrays of A2UI messages.
  processMessages(example as Parameters<typeof processMessages>[0]);
}

onMounted(() => load(active.value));
</script>

<template>
  <div class="page">
    <header class="page__header">
      <h1>@a2ui/vue</h1>
      <p>Agent-authored UI, rendered in Vue — safely like data.</p>
      <nav class="page__nav">
        <button
          v-for="name in exampleNames"
          :key="name"
          :class="['tab', name === active ? 'tab--active' : '']"
          type="button"
          @click="load(name)"
        >
          {{ name }}
        </button>
      </nav>
    </header>
    <main class="page__main">
      <A2uiSurface
        v-for="surface in surfaces"
        :key="surface.id"
        :surface="surface"
      />
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 420px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  font-family: system-ui, -apple-system, sans-serif;
}
.page__header h1 {
  margin: 0 0 4px;
  font-size: 22px;
}
.page__header p {
  margin: 0 0 16px;
  color: #666;
  font-size: 14px;
}
.page__nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.tab {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}
.tab--active {
  border-color: #1a73e8;
  color: #1a73e8;
  background: #e8f0fe;
}
.page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
