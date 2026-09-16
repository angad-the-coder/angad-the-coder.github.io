<script setup lang="ts">
import katex from "katex";
import { computed } from "vue";

const props = defineProps<{
  tex: string;
  label?: string;
}>();

const html = computed(() => katex.renderToString(props.tex, {
  throwOnError: false,
  displayMode: true,
}));
</script>

<template>
  <div class="not-prose my-3 text-center">
    <p
      v-if="label"
      class="mb-1 text-sm text-brown-500"
    >
      {{ label }}
    </p>
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="overflow-x-auto"
      v-html="html"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>
