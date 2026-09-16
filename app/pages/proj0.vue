<script setup lang="ts">
definePageMeta({
  subtitle: "Project 0: Becoming Friends with Your Camera",
});

useHead({
  title: "Project 0",
});
</script>

<template>
  <div>
    <h2>
      Part 1: Selfie: The Wrong Way vs. The Right Way
    </h2>
    <ImageGrid>
      <PhotoFigure src="/photos/proj0/pt1/closest.png">
        way too close
      </PhotoFigure>
      <PhotoFigure src="/photos/proj0/pt1/less-close.png">
        still too close
      </PhotoFigure>
      <PhotoFigure src="/photos/proj0/pt1/farther.png">
        getting there
      </PhotoFigure>
      <PhotoFigure src="/photos/proj0/pt1/farthest.png">
        across the room, zoomed in
      </PhotoFigure>
    </ImageGrid>

    <h2>
      Part 2: Architectural Perspective Compression
    </h2>
    <ImageRow class="flex-nowrap">
      <PhotoFigure
        src="/photos/proj0/pt2/wheeler-far.png"
        class="min-w-0 flex-1"
      >
        zoomed in standing near Sather gate
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj0/pt2/wheeler-close.png"
        class="min-w-0 flex-1"
      >
        walked up to the steps, no zoom
      </PhotoFigure>
    </ImageRow>

    <h2>
      Part 3: The Dolly Zoom
    </h2>
    <PhotoFigure
      src="/photos/proj0/pt3/final.gif"
      img-class="w-full aspect-square object-cover"
      class="mt-3 max-w-xl"
    >
      Moleja Boy, from my high school
      <a
        href="https://millingschem.com/mole-projects/"
        target="_blank"
        rel="noopener"
      >mole project</a>,
      looking over my room
    </PhotoFigure>
  </div>
</template>
