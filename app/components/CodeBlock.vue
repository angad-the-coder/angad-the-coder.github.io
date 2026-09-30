<script setup lang="ts">
defineProps<{
  code: string;
}>();
</script>

<template>
  <!-- kept on one line so template whitespace doesn't end up inside the <pre> -->
  <pre class="not-prose mt-3 bg-brown-50 border-2 border-brown-200 rounded p-4 text-sm overflow-x-auto text-brown-900"><code>{{ code }}</code></pre>
</template>
