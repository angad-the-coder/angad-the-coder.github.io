<script setup lang="ts">
definePageMeta({
  subtitle: "Project 4: [Auto]Stitching Photo Mosaics",
});

useHead({
  title: "Project 4",
});

const A = "/photos/proj4/a";
const B = "/photos/proj4/b";

const rectify = [
  { key: "rect1", label: "Textbook", aspect: [1.44, 1], seconds_nn: 0.044, seconds_bilinear: 0.108 },
  { key: "rect2", label: "Book Cart", aspect: [0.47, 1], seconds_nn: 0.019, seconds_bilinear: 0.058 },
];
const mosaics = [
  { key: "mosaic1", label: "Circular table around 4th floor of Gateway building", order: ["left", "center"], pairs: [
    { a: "left", b: "center", n: 14, mean_err_px: 2.89, max_err_px: 6.94 },
  ] },
  { key: "mosaic2", label: "Gateway building Atrium from 3rd floor steps", order: ["left", "center", "right"], pairs: [
    { a: "left", b: "center", n: 16, mean_err_px: 3.64, max_err_px: 6.99 },
    { a: "right", b: "center", n: 15, mean_err_px: 2.65, max_err_px: 5.14 },
  ] },
  { key: "mosaic3", label: "The Campanile from the Gateway Building rooftop", order: ["left", "center", "right"], pairs: [
    { a: "left", b: "center", n: 15, mean_err_px: 0.93, max_err_px: 2.36 },
    { a: "right", b: "center", n: 15, mean_err_px: 1.56, max_err_px: 4.17 },
  ] },
];
// the system for one pair, cut down to the first few correspondences so it fits
const system = {
  label: "Circular table around 4th floor of Gateway building", a: "left", b: "center", n: 14,
  A: [
    [796.8, 1001.3, 1.0, 0.0, 0.0, 0.0, -298720.3, -375387.4],
    [0.0, 0.0, 0.0, 796.8, 1001.3, 1.0, -814489.0, -1023528.9],
    [599.2, 971.1, 1.0, 0.0, 0.0, 0.0, -102043.8, -165378.3],
    [0.0, 0.0, 0.0, 599.2, 971.1, 1.0, -612502.2, -992658.4],
    [887.4, 906.0, 1.0, 0.0, 0.0, 0.0, -415214.5, -423917.4],
    [0.0, 0.0, 0.0, 887.4, 906.0, 1.0, -814278.2, -831345.6],
    [943.2, 926.9, 1.0, 0.0, 0.0, 0.0, -485182.1, -476797.4],
    [0.0, 0.0, 0.0, 943.2, 926.9, 1.0, -878685.1, -863500.0],
  ],
  b_vec: [374.9, 1022.2, 170.3, 1022.2, 467.9, 917.6, 514.4, 931.6],
  H: [
    [1.38316, 0.0294071, -646.499],
    [0.19822, 1.21786, -78.9115],
    [0.000373217, -2.70374e-05, 1.0],
  ],
};

const corners = { label: "The Campanile from the Gateway Building rooftop", harris: 36747, anms: 500 };
const pairsB = [
  { mosaic: "mosaic1", a: "left", b: "center", matches: 54, inliers: 15 },
  { mosaic: "mosaic2", a: "left", b: "center", matches: 65, inliers: 30 },
  { mosaic: "mosaic2", a: "right", b: "center", matches: 54, inliers: 28 },
  { mosaic: "mosaic3", a: "left", b: "center", matches: 126, inliers: 107 },
  { mosaic: "mosaic3", a: "right", b: "center", matches: 137, inliers: 126 },
];

function num(x: number) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(4)));
  const [mant, exp] = x.toExponential(2).split("e");
  return `${mant} \\times 10^{${Number(exp)}}`;
}
function matTex(M: number[][]) {
  return `\\begin{bmatrix} ${M.map(row => row.map(num).join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;
}

const shownRows = system.A.length;
const systemTex = (() => {
  const dots = " \\\\ \\vdots & & & & & & & ";
  const Atex = `\\begin{bmatrix} ${system.A.map(r => r.map(num).join(" & ")).join(" \\\\ ")}${dots} \\end{bmatrix}`;
  const btex = `\\begin{bmatrix} ${system.b_vec.map(num).join(" \\\\ ")} \\\\ \\vdots \\end{bmatrix}`;
  return `${Atex} \\begin{bmatrix} a \\\\ b \\\\ c \\\\ d \\\\ e \\\\ f \\\\ g \\\\ h \\end{bmatrix} = ${btex}`;
})();

// the Campanile set has the biggest exposure jump between shots, so it shows the blending best
const first = mosaics.find(x => x.key === "mosaic3")!;
const labelOf = (key: string) => mosaics.find(x => x.key === key)!.label;
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
      v-for="mo in mosaics"
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
      v-for="mo in mosaics"
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
      The system for {{ system.label }}, {{ system.a }} → {{ system.b }} (first
      {{ shownRows / 2 }} of {{ system.n }} correspondences, in pixels), where
      <InlineMath tex="H = \left[\begin{smallmatrix} a & b & c \\ d & e & f \\ g & h & 1 \end{smallmatrix}\right]" />:
    </p>
    <MathFormula :tex="systemTex" />
    <p>The recovered homography for that pair:</p>
    <MathFormula :tex="`H = ${matTex(system.H)}`" />

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
      v-for="r in rectify"
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
      v-for="mo in mosaics"
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

    <h2 id="part-b">
      Part B: Feature Matching for Autostitching
    </h2>

    <h3 id="b-1">
      B.1 Harris Corners and ANMS
    </h3>
    <p>
      Harris on {{ corners.label }} finds {{ corners.harris.toLocaleString() }} corners, which is quite a bit
      more than I need, and many of these points are just noise from the sky. ANMS keeps the {{ corners.anms }} corners
      with the biggest suppression radius, the distance to the nearest corner that's clearly stronger than it
      (<InlineMath tex="f_i < 0.9 f_j" />). As a result, the selected points are spread over the whole image instead of getting
      concentrated in one place. To keep the pairwise distances small enough to fit in memory, I run ANMS on the
      5000 strongest corners.
    </p>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2">
      <PhotoFigure
        :src="`${B}/harris_all.jpg`"
        img-class="aspect-auto"
      >
        all Harris corners ({{ corners.harris.toLocaleString() }})
      </PhotoFigure>
      <PhotoFigure
        :src="`${B}/harris_anms.jpg`"
        img-class="aspect-auto"
      >
        after ANMS ({{ corners.anms }})
      </PhotoFigure>
    </ImageGrid>

    <h3 id="b-2">
      B.2 Feature Descriptors
    </h3>
    <p>
      For each corner, I blur the grayscale image and sample every 5th pixel out of
      the 40x40 window around it to get an 8x8 patch, then subtract its mean and divide by its standard deviation to control
      for brightness or contrast. These are 12 features that ended up matching, each
      shown as its 40x40 window next to its normalized 8x8 descriptor:
    </p>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2">
      <PhotoFigure
        :src="`${B}/descriptor_locations.jpg`"
        img-class="aspect-auto"
      >
        feature locations
      </PhotoFigure>
      <PhotoFigure
        :src="`${B}/descriptor_patches.jpg`"
        img-class="aspect-auto"
      >
        40x40 window and 8x8 descriptor, left to right then top to bottom
      </PhotoFigure>
    </ImageGrid>

    <h3 id="b-3">
      B.3 Feature Matching
    </h3>
    <p>
      For every descriptor, I find its nearest and second nearest neighbor in the other image and only keep the match if
      the ratio of the squared distances from its nearest and second nearest neighbor are less than 0.4, which is about where Figure 6b
      of the paper separates correct matches from wrong ones. Green matches are the ones RANSAC keeps in B.4, red ones
      it throws out.
    </p>
    <PhotoFigure
      v-for="p in pairsB"
      :key="`${p.mosaic}-${p.a}`"
      :src="`${B}/matches_${p.mosaic}_${p.a}_${p.b}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      {{ labelOf(p.mosaic) }}: {{ p.a }} → {{ p.b }}, {{ p.matches }} matches, {{ p.inliers }} kept by RANSAC
    </PhotoFigure>
    <p>
      The ratio test still lets some bad matches through, mostly on stuff that repeats (skylight panes, window frames)
      and on things close to the camera that shift between shots, like the railing and the ground floor seen through it
      in the atrium.
    </p>

    <h3 id="b-4">
      B.4 RANSAC and Automatic Mosaics
    </h3>
    <p>
      RANSAC picks 4 random matches, fits an exact homography to them, and counts how many other matches it maps to
      within 2 pixels. After 5000 tries, I keep the biggest set of inliers and refit <InlineMath tex="H" /> to all of them with
      least squares. Then the mosaics are made the same way as Part A, just with these homographies instead of my
      clicked ones.
    </p>
    <template
      v-for="mo in mosaics"
      :key="mo.key"
    >
      <ImageGrid class="grid-cols-1 sm:grid-cols-2">
        <PhotoFigure
          :src="`${A}/mosaic_${mo.key}_blend.jpg`"
          img-class="aspect-auto"
        >
          {{ mo.label }}: manual
        </PhotoFigure>
        <PhotoFigure
          :src="`${B}/mosaic_${mo.key}_auto.jpg`"
          img-class="aspect-auto"
        >
          automatic
        </PhotoFigure>
      </ImageGrid>
    </template>
    <p>
      The automatic mosaics look basically the same as my manual ones for the Campanile and the atrium. I personally think
      the image from the atrium on the 3rd floor steps of the gateway building actually turned out better automatically than
      manually. My clicked points didn't do a great job on the railing, and the RANSAC seemed to line it up marginally better.
    </p>
  </div>
</template>
