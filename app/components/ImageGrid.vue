<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <div :class="cn('not-prose mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2', attrs.class as string)">
    <slot />
  </div>
</template>
