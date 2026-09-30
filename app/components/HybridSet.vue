<script setup lang="ts">
// low input / high input / hybrid, read from /photos/proj2/<dir>/
defineProps<{
  dir: string;
}>();
</script>

<template>
  <ImageGrid class="grid-cols-3 sm:grid-cols-3">
    <PhotoFigure
      :src="`/photos/proj2/${dir}/low_in.jpg`"
      img-class="aspect-auto"
    >
      <slot name="low" />
    </PhotoFigure>
    <PhotoFigure
      :src="`/photos/proj2/${dir}/high_in.jpg`"
      img-class="aspect-auto"
    >
      <slot name="high" />
    </PhotoFigure>
    <PhotoFigure
      :src="`/photos/proj2/${dir}/hybrid.jpg`"
      img-class="aspect-auto"
    >
      hybrid
    </PhotoFigure>
  </ImageGrid>
</template>
