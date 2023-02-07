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
    label: datapoint["location-lat"] + " " + datapoint["location-long"],
    bgPadding: 5,
    title: trunc(datapoint["individual-local-identifier"], 100),
  },
  x: datapoint["utm-easting"],
  y: datapoint["utm-northing"],
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
    const nameFill = (d) => webglColor(nameColorScale(hashCode(d.name) % 14));
    const DanielFill = (d) => webglColor(DanielColorScale(d.Daniel));
    const MagnoliaFill = (d) => webglColor(MagnoliaColorScale(d.Magnolia));
    const JessyFill = (d) => webglColor(JessyColorScale(d.Jessy));
    const DrogonFill = (d) => webglColor(DrogonColorScale(d.Drogon));
    const ViserionFill = (d) => webglColor(ViserionColorScale(d.Viserion));
    const RhaegalFill = (d) => webglColor(RhaegalColorScale(d.Rhaegal));
    const JohnFill = (d) => webglColor(JohnSnowColorScale(d["John Snow"]));
    const Rhaegal_2Fill = (d) => webglColor(Rhaegal_2ColorScale(d.Rhaegal_2));
    const Viserion_2Fill = (d) =>
      webglColor(Viserion_2ColorScale(d.Viserion_2));
    const SamwellFill = (d) =>
      webglColor(SamwellTarlyColorScale(d["Samwell Tarly"]));
    const GendryFill = (d) => webglColor(GendryColorScale(d.Gendry));
    const Gendry_2Fill = (d) => webglColor(Gendry_2ColorScale(d.Gendry_2));
    const DaenerysFill = (d) => webglColor(DaenerysColorScale(d.Daenerys));
    const OlennaFill = (d) =>
      webglColor(OlennaTyrellColorScale(d["Olenna Tyrell"]));

    // 'Daniel',
    // 'Magnolia', 'Jessy', 'Drogon', 'Viserion', 'Rhaegal', 'John Snow',
    // 'Rhaegal_2', 'Viserion_2', 'Samwell Tarly', 'Gendry', 'Gendry_2',
    // 'Daenerys', 'Olenna Tyrell'
    const fillColor = fc.webglFillColor().value(nameFill).data(data);

    pointSeries.decorate((program) => fillColor(program));

    // wire up the fill color selector
    //This function needs 2 modifictaions
    // changing colors acc to name - individual coloring
    // adding other paramters for coloring/whatever
    iterateElements(".controls a", (el) => {
      el.addEventListener("click", () => {
        console.log(el.id);

        iterateElements(".controls a", (el2) => el2.classList.remove("active"));
        el.classList.add("active");
        // console.log(el.id + " is the ID");
        if (el.id == "name") {
          fillColor.value(nameFill);
        }
        if (el.id == "Daniel") {
          fillColor.value(DanielFill);
        }
        if (el.id == "Magnolia") {
          fillColor.value(MagnoliaFill);
        }
        if (el.id == "Jessy") {
          fillColor.value(JessyFill);
        }
        if (el.id == "Drogon") {
          fillColor.value(DrogonFill);
        }
        if (el.id == "Viserion") {
          fillColor.value(ViserionFill);
        }
        if (el.id == "Rhaegal") {
          fillColor.value(RhaegalFill);
        }
        if (el.id == "John") {
          fillColor.value(JohnFill);
        }
        if (el.id == "Rhaegal_2") {
          fillColor.value(Rhaegal_2Fill);
        }
        if (el.id == "Viserion_2") {
          fillColor.value(Viserion_2Fill);
        }
        if (el.id == "Samwell") {
          fillColor.value(SamwellFill);
        }
        if (el.id == "Gendry") {
          fillColor.value(GendryFill);
        }
        if (el.id == "Gendry_2") {
          fillColor.value(Gendry_2Fill);
        }
        if (el.id == "Daenerys") {
          fillColor.value(DaenerysFill);
        }
        if (el.id == "Olenna") {
          fillColor.value(OlennaFill);
        }
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
streamingLoaderWorker.postMessage("names.tsv");
const colors = [
  "#1abc9c",
  "#16a085",
  "#2ecc71",
  "#27ae60",
  "#3498db",
  "#2980b9",
  "#9b59b6",
  "#8e44ad",
  "#f1c40f",
  "#f39c12",
  "#e67e22",
  "#d35400",
  "#e74c3c",
  "#c0392b",
];

const names = [
  "Daniel",
  "Magnolia",
  "Jessy",
  "Drogon",
  "Viserion",
  "Rhaegal",
  "John Snow",
  "Rhaegal_2",
  "Viserion_2",
  "Samwell",
  "Gendry",
  "Gendry_2",
  "Daenerys",
  "Olenna",
];

const nameColorScale = d3.scaleOrdinal(colors);

const DanielColorScale = d3.scaleOrdinal(["#1abc9c", "cyan"]);
const MagnoliaColorScale = d3.scaleOrdinal(["cyan", "#16a085"]);
const JessyColorScale = d3.scaleOrdinal(["cyan", "#2ecc71"]);
const DrogonColorScale = d3.scaleOrdinal(["cyan", "#27ae60"]);
const ViserionColorScale = d3.scaleOrdinal(["cyan", "#3498db"]);
const RhaegalColorScale = d3.scaleOrdinal(["cyan", "#2980b9"]);
const JohnSnowColorScale = d3.scaleOrdinal(["cyan", "#9b59b6"]);
const Rhaegal_2ColorScale = d3.scaleOrdinal(["cyan", "#8e44ad"]);
const Viserion_2ColorScale = d3.scaleOrdinal(["cyan", "#f1c40f"]);
const SamwellTarlyColorScale = d3.scaleOrdinal(["cyan", "#f39c12"]);
const GendryColorScale = d3.scaleOrdinal(["cyan", "#e67e22"]);
const Gendry_2ColorScale = d3.scaleOrdinal(["cyan", "#d35400"]);
const DaenerysColorScale = d3.scaleOrdinal(["cyan", "#e74c3c"]);
const OlennaTyrellColorScale = d3.scaleOrdinal(["cyan", "#c0392b"]);

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

// const brush = d3.brush().on("end", (e) => {
//   console.log("what is this");
//   if (!e.selection) {
//     if (!idleTimeout) {
//       // detect double clicks
//       idleTimeout = setTimeout(() => (idleTimeout = null), idleDelay);
//     } else {
//       x.domain(xExtent(data));
//       y.domain(yExtent(data));
//       redraw();
//     }
//   } else {
//     x.domain(e.xDomain);
//     y.domain(e.yDomain);
//     redraw();
//   }
// });

const pointer = fc.pointer().on("point", ([coord]) => {
  annotations.pop();

  if (!coord || !quadtree) {
    return;
  }

  // find the closes datapoint to the pointer
  const x = xScale.invert(coord.x);
  const y = yScale.invert(coord.y);
  // const radius = Math.abs(xScale.invert(coord.x) - xScale.invert(coord.y - 20));
  const closestDatum = quadtree.find(x, y, 10);

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
  .decorate(
    (sel) =>
      sel
        .enter()
        .select("d3fc-svg.plot-area")
        .on("measure.range", () => {
          xScaleOriginal.range([0, 1000]);
          yScaleOriginal.range([1000, 0]);
        })
        .call(zoom)
        .call(pointer)
    // .call(brush)
  );

// render the chart with the required data
// Enqueues a redraw to occur on the next animation frame
const redraw = () => {
  d3.select("#chart").datum({ annotations, data }).call(chart);
};
