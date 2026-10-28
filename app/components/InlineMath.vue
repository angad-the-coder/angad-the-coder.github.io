<script setup lang="ts">
import katex from "katex";
import { computed } from "vue";

const props = defineProps<{
  tex: string;
}>();

const html = computed(() => katex.renderToString(props.tex, {
  throwOnError: false,
  displayMode: false,
}));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="html" />
</template>
