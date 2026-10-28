<script setup lang="ts">
import metricsJson from "~~/public/photos/proj4/a/metrics.json";

definePageMeta({
  subtitle: "Project 4: [Auto]Stitching Photo Mosaics",
});

useHead({
  title: "Project 4",
});

// written by nocommit/proj4/run.py
type Matrix = number[][];
interface Rectify {
  key: string;
  label: string;
  aspect: [number, number];
  seconds_nn: number;
  seconds_bilinear: number;
}
interface Pair { a: string; b: string; n: number; H: Matrix; mean_err_px: number; max_err_px: number }
interface Mosaic {
  key: string;
  label: string;
  order: string[];
  pairs: Pair[];
}
interface Metrics {
  rectify: Rectify[];
  mosaics: Mosaic[];
  system: { mosaic: string; a: string; b: string; A: Matrix; b_vec: number[] };
}
const m = metricsJson as unknown as Metrics;

const A = "/photos/proj4/a";

function num(x: number) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(4)));
  const [mant, exp] = x.toExponential(2).split("e");
  return `${mant} \\times 10^{${Number(exp)}}`;
}
function matTex(M: Matrix) {
  return `\\begin{bmatrix} ${M.map(row => row.map(num).join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;
}

// the system for one pair, cut down to the first few correspondences so it fits
const shownRows = 8;
const systemTex = computed(() => {
  const rows = m.system.A.slice(0, shownRows);
  const rhs = m.system.b_vec.slice(0, shownRows);
  const more = m.system.A.length > shownRows;
  const dots = more ? " \\\\ \\vdots & & & & & & & " : "";
  const Atex = `\\begin{bmatrix} ${rows.map(r => r.map(num).join(" & ")).join(" \\\\ ")}${dots} \\end{bmatrix}`;
  const btex = `\\begin{bmatrix} ${rhs.map(num).join(" \\\\ ")}${more ? " \\\\ \\vdots" : ""} \\end{bmatrix}`;
  return `${Atex} \\begin{bmatrix} a \\\\ b \\\\ c \\\\ d \\\\ e \\\\ f \\\\ g \\\\ h \\end{bmatrix} = ${btex}`;
});
const systemPair = computed(() => {
  const mo = m.mosaics.find(x => x.key === m.system.mosaic)!;
  return { mosaic: mo, pair: mo.pairs.find(p => p.a === m.system.a && p.b === m.system.b)! };
});

// the Campanile set has the biggest exposure jump between shots, so it shows the blending best
const first = m.mosaics.find(x => x.key === "mosaic3") ?? m.mosaics[0]!;
</script>

<template>
  <div class="prose-code:before:content-none prose-code:after:content-none">
    <h2
      id="part-a"
      class="mt-0"
    >
      Part A: Image Warping and Mosaicing
    </h2>

    <h3 id="a-1">
      A.1 Shooting the Pictures
    </h3>
    <p>
      For each set of images, I stood in one place, took a center photo with some sort of
      an anchor, and then rotated to the left and right, keeping the anchor in the photo for
      later pair-matching.
    </p>
    <PhotoFigure
      v-for="mo in m.mosaics"
      :key="mo.key"
      :src="`${A}/mosaic_${mo.key}_sources.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      {{ mo.label }}: {{ mo.order.join(", ") }}
    </PhotoFigure>

    <h3 id="a-2">
      A.2 Recovering Homographies
    </h3>
    <p>
      Each pair of corresponding pixels results in two linear equations in the 8 unknowns of <InlineMath tex="H" /> (with <InlineMath tex="H_{33} = 1" />).
      With 14 to 16 corresponding pixels per pair, the system is overdetermined, so computeH solves it
      with least squares. I normalize the points in each image centered at 0 with a mean distance of <InlineMath tex="\sqrt{2}" /> so that
      multiplying large pixels do not result in super big gaps between values. Once <InlineMath tex="H" /> is solved within this scale, I
      undo the normaliaztion back to the normal pixel coordinates.
      These are the corresponding pixel pairs for matching colors and numbers in both images:
    </p>
    <template
      v-for="mo in m.mosaics"
      :key="mo.key"
    >
      <PhotoFigure
        v-for="p in mo.pairs"
        :key="`${mo.key}-${p.a}-${p.b}`"
        :src="`${A}/mosaic_${mo.key}_pts_${p.a}_${p.b}.jpg`"
        img-class="aspect-auto"
        class="not-prose mt-3"
      >
        {{ mo.label }}: {{ p.a }} → {{ p.b }}, {{ p.n }} points, reprojection error mean {{ p.mean_err_px }} px,
        max {{ p.max_err_px }} px
      </PhotoFigure>
    </template>
    <p>
      The system for {{ systemPair.mosaic.label }}, {{ systemPair.pair.a }} → {{ systemPair.pair.b }} (first
      {{ shownRows / 2 }} of {{ systemPair.pair.n }} correspondences, in pixels), where
      <InlineMath tex="H = \left[\begin{smallmatrix} a & b & c \\ d & e & f \\ g & h & 1 \end{smallmatrix}\right]" />:
    </p>
    <MathFormula :tex="systemTex" />
    <p>The recovered homography for that pair:</p>
    <MathFormula :tex="`H = ${matTex(systemPair.pair.H)}`" />

    <h3 id="a-3">
      A.3 Warping the Images
    </h3>
    <p>
      Both warps size the output from the four warped corners, then inverse warp every output pixel through
      <InlineMath tex="H^{-1}" />, treating <InlineMath tex="(0, 0)" /> as the center of the top-left pixel. They also return an alpha mask
      of which output pixels end up inside the source, and the mosaics use this alpha mask for blending (this is why empty areas are white).
    </p>
    <p>
      For rectification, I clicked the 4 corners of a rectangular object and mapped them to an axis-aligned rectangle
      about the size the object appears in the photo. I didn't measure the objects, so I estimated their real aspect
      ratios from the corners and the EXIF focal length: with <InlineMath tex="K" /> known, the homography from a unit
      square to the corners is <InlineMath tex="K \begin{bmatrix} s_1 r_1 & s_2 r_2 & t \end{bmatrix}" />, so
      <InlineMath tex="\text{width} / \text{height} = \lVert K^{-1} h_1 \rVert / \lVert K^{-1} h_2 \rVert" />. The output is cropped to the rectangle plus a margin.
    </p>
    <template
      v-for="r in m.rectify"
      :key="r.key"
    >
      <ImageGrid class="grid-cols-1 sm:grid-cols-3">
        <PhotoFigure
          :src="`${A}/rectify_${r.key}_input.jpg`"
          img-class="aspect-auto"
        >
          {{ r.label }}: clicked corners (width:height {{ r.aspect[0] }}:{{ r.aspect[1] }})
        </PhotoFigure>
        <PhotoFigure
          :src="`${A}/rectify_${r.key}_nn.jpg`"
          img-class="aspect-auto"
        >
          nearest neighbor ({{ r.seconds_nn }} s)
        </PhotoFigure>
        <PhotoFigure
          :src="`${A}/rectify_${r.key}_bilinear.jpg`"
          img-class="aspect-auto"
        >
          bilinear ({{ r.seconds_bilinear }} s)
        </PhotoFigure>
      </ImageGrid>
      <PhotoFigure
        :src="`${A}/rectify_${r.key}_zoom.jpg`"
        img-class="aspect-auto"
        class="not-prose mt-3 max-w-xl mx-auto"
      >
        zoomed 4x: nearest neighbor (left) and bilinear (right)
      </PhotoFigure>
    </template>
    <p>
      Zoomed in, nearest neighbor turns every edge that isn't axis-aligned after the warp into stair steps (the outline
      of the chess piece and the checkerboard borders on the book), and the wood grain on the cart gets blocky.
      Bilinear smooths those edges, although it is slightly softer. At normal size they look almost the same.
      Bilinear does four lookups per pixel instead of one, which made it about 2.6x slower, but that's still only
      about a tenth of a second for a million-pixel output, so I use bilinear for the mosaics.
    </p>

    <h3 id="a-4">
      A.4 Blending the Images into a Mosaic
    </h3>
    <p>
      Using the center photo as a reference, I warp the others onto its frame (bilinear) on a shared canvas sized from
      all the warped corners, and blend them. Each image gets a weight that is 1 at its center and falls to 0 at its
      edges (following a normalized distance transform), warped along with it. I blend with a 2-level Laplacian pyramid: the low
      frequencies (Gaussian blur, <InlineMath tex="\sigma = 2" />) are averaged using those weights, which hide exposure differences, and the
      high frequencies come only from the image with the largest weight at each pixel, which avoids ghosting minute
      details if the alignment is a couple pixels off.
    </p>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2">
      <PhotoFigure
        :src="`${A}/mosaic_${first.key}_overwrite.jpg`"
        img-class="aspect-auto"
      >
        {{ first.label }}: no blending
      </PhotoFigure>
      <PhotoFigure
        :src="`${A}/mosaic_${first.key}_blend.jpg`"
        img-class="aspect-auto"
      >
        2-level Laplacian blend
      </PhotoFigure>
    </ImageGrid>
    <p>
      If I don't blend, there's a very clear seam down the building and a brightness jump in the sky since my iPhone's
      night mode exposed each photo differently. Using the blend fixes both of these issues. However, blending is not
      able to fix parallax. This is scene in the image on the stairs, where the white railing has some doubling (it's
      very close to the camera). I actually had to reduce the circular table set to 2 photos because the doubling with the
      third photo was really bad since I took the third photo a little too close.
    </p>
    <template
      v-for="mo in m.mosaics"
      :key="mo.key"
    >
      <h4 :id="`a-4-${mo.key}`">
        {{ mo.label }}
      </h4>
      <PhotoFigure
        :src="`${A}/mosaic_${mo.key}_sources.jpg`"
        img-class="aspect-auto"
        class="not-prose mt-3"
      >
        source images: {{ mo.order.join(", ") }}
      </PhotoFigure>
      <PhotoFigure
        :src="`${A}/mosaic_${mo.key}_blend.jpg`"
        img-class="aspect-auto"
        class="not-prose mt-3"
      >
        mosaic
      </PhotoFigure>
    </template>
  </div>
</template>
