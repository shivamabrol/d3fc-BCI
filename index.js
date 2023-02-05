import { seriesSvgAnnotation } from "./annotation-series.js";
import {
  distance,
  trunc,
  hashCode,
  webglColor,
  iterateElements,
} from "./util.js";

let data = [];
let quadtree;

const createAnnotationData = (datapoint) => ({
  note: {
    label: datapoint.first_author_name + " " + datapoint.year,
    bgPadding: 5,
    title: trunc(datapoint.title, 100),
  },
  x: datapoint.x,
  y: datapoint.y,
  dx: 20,
  dy: 20,
});

console.log("I was here");

// create a web worker that streams the chart data
const streamingLoaderWorker = new Worker("streaming-tsv-parser.js");
streamingLoaderWorker.onmessage = ({
  data: { items, totalBytes, finished },
}) => {
  const rows = items
    .map((d) => ({
      ...d,
      x: Number(d["utm-easting"]),
      y: Number(d["utm-northing"]),
      name: d["individual-local-identifier"],
    }))
    .filter((d) => d.name);
  data = data.concat(rows);

  if (finished) {
    document.getElementById("loading").style.display = "none";

    // compute the fill color for each datapoint
    const nameFill = (d) =>
      webglColor(languageColorScale(hashCode(d.name) % 10));

    const fillColor = fc.webglFillColor().value(nameFill).data(data);
    pointSeries.decorate((program) => fillColor(program));

    // wire up the fill color selector
    iterateElements(".controls a", (el) => {
      el.addEventListener("click", () => {
        iterateElements(".controls a", (el2) => el2.classList.remove("active"));
        el.classList.add("active");
        fillColor.value(nameFill);
        redraw();
      });
    });

    // create a spatial index for rapidly finding the closest datapoint
    quadtree = d3
      .quadtree()
      .x((d) => d["utm-easting"])
      .y((d) => d["utm-northing"])
      .addAll(data);
  }

  redraw();
};
streamingLoaderWorker.postMessage("data2.tsv");

const languageColorScale = d3.scaleOrdinal(d3.schemeCategory10);

//these need to be domain of the data
const xScale = d3.scaleLinear().domain([624079.8465020715, 629752.8465020715]);

const yScale = d3
  .scaleLinear()
  .domain([1009715.5668793379, 1015157.5668793379]);
const xScaleOriginal = xScale.copy();
const yScaleOriginal = yScale.copy();

const pointSeries = fc
  .seriesWebglPoint()
  .equals((a, b) => a === b)
  .size(1)
  .crossValue((d) => d["utm-easting"])
  .mainValue((d) => d["utm-northing"]);

const zoom = d3
  .zoom()
  .scaleExtent([0.8, 10])
  .on("zoom", () => {
    // update the scales based on current zoom
    xScale.domain(d3.event.transform.rescaleX(xScaleOriginal).domain());
    yScale.domain(d3.event.transform.rescaleY(yScaleOriginal).domain());
    redraw();
  });

const annotations = [];

const pointer = fc.pointer().on("point", ([coord]) => {
  annotations.pop();

  if (!coord || !quadtree) {
    return;
  }

  // find the closes datapoint to the pointer
  const x = xScale.invert(coord["utm-easting"]);
  const y = yScale.invert(coord["utm-northing"]);
  const radius = Math.abs(
    xScale.invert(coord["utm-easting"]) -
      xScale.invert(coord["utm-easting"] - 20)
  );
  const closestDatum = quadtree.find(x, y, radius);

  // if the closest point is within 20 pixels, show the annotation

  if (closestDatum) {
    annotations[0] = createAnnotationData(closestDatum);
  }

  redraw();
});

const annotationSeries = seriesSvgAnnotation()
  .notePadding(15)
  .type(d3.annotationCallout);

const chart = fc
  .chartCartesian(xScale, yScale)
  .webglPlotArea(
    // only render the point series on the WebGL layer
    fc
      .seriesWebglMulti()
      .series([pointSeries])
      .mapping((d) => d.data)
  )
  .svgPlotArea(
    // only render the annotations series on the SVG layer
    fc
      .seriesSvgMulti()
      .series([annotationSeries])
      .mapping((d) => d.annotations)
  )
  .decorate((sel) =>
    sel
      .enter()
      .select("d3fc-svg.plot-area")
      .on("measure.range", () => {
        xScaleOriginal.range([0, d3.event.detail.width]);
        yScaleOriginal.range([d3.event.detail.height, 0]);
      })
      .call(zoom)
      .call(pointer)
  );

// render the chart with the required data
// Enqueues a redraw to occur on the next animation frame
const redraw = () => {
  d3.select("#chart").datum({ annotations, data }).call(chart);
};
