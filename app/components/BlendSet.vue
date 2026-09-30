<script setup lang="ts">
// image a / image b / mask / blend as a 2x2, read from /photos/proj2/<dir>/
defineProps<{
  dir: string;
}>();
</script>

<template>
  <ImageGrid class="grid-cols-2 sm:grid-cols-2">
    <PhotoFigure
      :src="`/photos/proj2/${dir}/a.jpg`"
      img-class="aspect-auto"
    >
      <slot name="a" />
    </PhotoFigure>
    <PhotoFigure
      :src="`/photos/proj2/${dir}/b.jpg`"
      img-class="aspect-auto"
    >
      <slot name="b" />
    </PhotoFigure>
    <PhotoFigure
      :src="`/photos/proj2/${dir}/mask.png`"
      img-class="aspect-auto"
    >
      mask
    </PhotoFigure>
    <PhotoFigure
      :src="`/photos/proj2/${dir}/blend.jpg`"
      img-class="aspect-auto"
    >
      blended
    </PhotoFigure>
  </ImageGrid>
</template>
