<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = defineProps<{
  src: string;
  alt?: string;
  imgClass?: string;
  captionClass?: string;
}>();
</script>

<template>
  <figure :class="cn(attrs.class as string)">
    <img
      :src="src"
      :alt="alt ?? ''"
      :class="cn('rounded border-2 border-brown-200 w-full aspect-[3/4] object-cover', props.imgClass)"
    >
    <figcaption :class="cn('mt-1 text-sm text-brown-500', props.captionClass)">
      <slot />
    </figcaption>
  </figure>
</template>
