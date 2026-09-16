<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <div :class="cn('not-prose mt-3 flex flex-wrap justify-center gap-4', attrs.class as string)">
    <slot />
  </div>
</template>
