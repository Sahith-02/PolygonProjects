import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import bbox from "@turf/bbox";

import "../styles/MapView.css";
import geojson from "../assets/joine3_lulc.js";
import anganwadi from "../assets/pois/AngawadiCenters.js";
import canal from "../assets/pois/Canal.js";
import forest from "../assets/pois/Forest.js";
import civilSupplies from "../assets/pois/CivilSupplies.js";
import muncipality from "../assets/pois/Muncipalities.js";
import hospital from "../assets/pois/Hospital.js";
import archMuse from "../assets/pois/ArchaeologyMuseums.js";
import drainage from "../assets/pois/Drainage.js";
import electricPoles from "../assets/pois/ElectricPoles.js";
import policeStation from "../assets/pois/PoliceStation.js";
import policeSurveillance from "../assets/pois/PoliceSurveillance.js";
import RailwayNetwork from "../assets/pois/RailwayNetwork.js";
import river from "../assets/pois/River.js";
import roads from "../assets/pois/Roads.js";

mapboxgl.accessToken =
  "pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA";
const allKeys = [
  "fid",
  "Remarks",
  "V_Name",
  "M_Name",
  "D_Name",
  "DMV_Code",
  "Parcel_num",
  "Shape_Leng",
  "Shape_Area",
  "Project",
  "AWC_Name",
  "Name",
  "Locality",
  "Status",
  "LULC_1",
];

const LULC_COLORS = {
  "Agriculture Land": "#1B5E20",
  Forest: "#1B3D1A",
  "Water Body": "#0D47A1",
  "Built Up": "#4A148C",
  Wastelands: "#3E2723",
  others: "#424242",
};

export default function MapView({
  onSelectPolygon,
  poiSettings,
  adminSettings,
  isAdminBoundariesVisible,
  isPOISectionVisible,
  isLULCSectionVisible,
  districts,
  mandals,
  villages,
  highlightDistrict,
  highlightMandal,
  highlightVillage,
  lulcToggles,
  activeTool,
  topographyVisible,
  showFmbLayer,
  cadastralVisible,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [area, setArea] = useState(null);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const drawInitialized = useRef(false);
  const popupRef = useRef(null);

  const DEFAULT_CENTER = [80.6063, 16.475];
  const DEFAULT_ZOOM = 13;

  const POI_LAYERS = [
    {
      id: "poi-anganwadi",
      data: anganwadi,
      setting: "anganwadi",
      color: "#FF5733",
    },
    { id: "poi-canal", data: canal, setting: "canal", color: "#2ECC71" },
    { id: "poi-forest", data: forest, setting: "forest", color: "#006400" },
    {
      id: "poi-civilsupplies",
      data: civilSupplies,
      setting: "civilSupplies",
      color: "#1E88E5",
    },
    {
      id: "poi-muncipalities",
      data: muncipality,
      setting: "muncipalities",
      color: "#F9A825",
    },
    {
      id: "poi-hospital",
      data: hospital,
      setting: "hospitals",
      color: "#C62828",
    },
    {
      id: "poi-archmuse",
      data: archMuse,
      setting: "archmuse",
      color: "#6D4C41",
    },
    {
      id: "poi-drainage",
      data: drainage,
      setting: "drainage",
      color: "#039BE5",
    },
    {
      id: "poi-electricpoles",
      data: electricPoles,
      setting: "electricpoles",
      color: "#F57C00",
    },
    {
      id: "poi-police",
      data: policeStation,
      setting: "policeSt",
      color: "#5E35B1",
    },
    {
      id: "poi-polsur",
      data: policeSurveillance,
      setting: "policeSur",
      color: "#00897B",
    },
    {
      id: "poi-railway",
      data: RailwayNetwork,
      setting: "railway",
      color: "#546E7A",
    },
    { id: "poi-river", data: river, setting: "river", color: "#00ACC1" },
    { id: "poi-roads", data: roads, setting: "roads", color: "#FF7043" },
  ];

  const BOUNDARY_LAYERS = [
    {
      id: "districts",
      data: districts,
      key: "district",
      nameField: "NAME",
      color: "#0a0a0a",
    },
    {
      id: "mandals",
      data: mandals,
      key: "mandal",
      nameField: "sdtname",
      color: "#DAA520",
    },
    {
      id: "villages",
      data: villages,
      key: "village",
      nameField: "NAME",
      color: "#444444",
    },
  ];

  const clearDrawing = () => {
    if (draw.current) {
      draw.current.deleteAll();
    }
    setArea(null);
    if (currentPopup) {
      currentPopup.remove();
      setCurrentPopup(null);
    }
    if (popupRef.current) {
      popupRef.current = null;
    }
  };

  useEffect(() => {
    if (!districts || !mandals || !villages || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    window.__MAP__ = map.current;

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", () => {
      map.current.addSource("topography", {
        type: "raster",
        url: "mapbox://rayapati49.bkzen9ha",
        tileSize: 256,
        minzoom: 5,
        maxzoom: 15,
      });

      map.current.addLayer({
        id: "topography-layer",
        type: "raster",
        source: "topography",
        layout: { visibility: topographyVisible ? "visible" : "none" },
      });

      map.current.addSource("fmb137", {
        type: "raster",
        url: "mapbox://rayapati49.0f2xgztl",
        tileSize: 256,
        minzoom: 10,
        maxzoom: 22,
      });

      map.current.addSource("parcels", { type: "geojson", data: geojson });
      map.current.addSource("highlight-parcel", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: { "fill-color": "#0080ff", "fill-opacity": 0.3 },
        layout: { visibility: cadastralVisible ? "visible" : "none" },
      });

      map.current.addLayer({
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        paint: { "line-color": "#003366", "line-width": 1.2 },
        layout: { visibility: cadastralVisible ? "visible" : "none" },
      });

      map.current.addLayer({
        id: "parcels-label",
        type: "symbol",
        source: "parcels",
        layout: {
          "text-field": ["get", "Parcel_num"],
          "text-size": 12,
          "text-offset": [0, 0.6],
          "text-anchor": "top",
          visibility: cadastralVisible ? "visible" : "none",
        },
        paint: {
          "text-color": "#111",
          "text-halo-color": "#fff",
          "text-halo-width": 1.2,
        },
      });

      map.current.addLayer({
        id: "highlight-parcel",
        type: "line",
        source: "highlight-parcel",
        paint: { "line-color": "#FF0000", "line-width": 3 },
      });

      map.current.on("click", "parcels-fill", (e) => {
        const feature = e.features[0];
        const area = turf.area(feature) * 0.000247105;

        map.current.getSource("highlight-parcel").setData({
          type: "FeatureCollection",
          features: [feature],
        });

        onSelectPolygon({ ...feature.properties });

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>Parcel Number:</strong> ${
              feature.properties.Parcel_num
            }<br><strong>Area:</strong> ${area.toFixed(2)} acres`
          )
          .addTo(map.current);
      });

      map.current.on("click", (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["parcels-fill"],
        });
        if (!features.length) {
          map.current.getSource("highlight-parcel").setData({
            type: "FeatureCollection",
            features: [],
          });
        }
      });

      BOUNDARY_LAYERS.forEach(({ id, data, nameField, color }) => {
        if (!data) return;
        map.current.addSource(id, { type: "geojson", data });
        map.current.addLayer({
          id: `${id}-outline`,
          type: "line",
          source: id,
          paint: { "line-color": color, "line-width": 2 },
          layout: { visibility: "none" },
        });
        map.current.addLayer({
          id: `${id}-label`,
          type: "symbol",
          source: id,
          layout: {
            "text-field": ["get", nameField],
            "text-size": 12,
            "text-anchor": "center",
            visibility: "none",
          },
          paint: {
            "text-color": "#004466",
            "text-halo-color": "#fff",
            "text-halo-width": 1.2,
          },
        });
      });

      map.current.addSource("highlight-district", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "highlight-district",
        type: "line",
        source: "highlight-district",
        paint: { "line-color": "blue", "line-width": 3 },
      });

      map.current.addSource("highlight-mandal", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "highlight-mandal",
        type: "line",
        source: "highlight-mandal",
        paint: { "line-color": "red", "line-width": 3 },
      });

      map.current.addSource("highlight-village", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current.addLayer({
        id: "highlight-village",
        type: "line",
        source: "highlight-village",
        paint: { "line-color": "#000000", "line-width": 3 },
      });

      POI_LAYERS.forEach(({ id, data, color }) => {
        if (!data) return;
        map.current.addSource(id, { type: "geojson", data });
        const type = data.features[0]?.geometry?.type;
        if (type === "Point") {
          map.current.addLayer({
            id,
            type: "circle",
            source: id,
            paint: {
              "circle-radius": 6,
              "circle-color": color,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff",
            },
            layout: { visibility: "none" },
          });
        } else if (type === "LineString" || type === "MultiLineString") {
          map.current.addLayer({
            id,
            type: "line",
            source: id,
            paint: { "line-color": color, "line-width": 3 },
            layout: { visibility: "none" },
          });
        } else {
          map.current.addLayer({
            id,
            type: "fill",
            source: id,
            paint: { "fill-color": color, "fill-opacity": 0.6 },
            layout: { visibility: "none" },
          });
          map.current.addLayer({
            id: `${id}-outline`,
            type: "line",
            source: id,
            paint: { "line-color": color, "line-width": 2 },
            layout: { visibility: "none" },
          });
        }
      });

      map.current.addLayer(
        {
          id: "fmb137-layer",
          type: "raster",
          source: "fmb137",
          layout: { visibility: "none" },
        },
        "poi-roads"
      );

      map.current.addSource("lulc", { type: "geojson", data: geojson });
      Object.entries(LULC_COLORS).forEach(([category, color]) => {
        const layerId = `lulc-${category.replace(/\s+/g, "-").toLowerCase()}`;
        map.current.addLayer({
          id: layerId,
          type: "fill",
          source: "lulc",
          paint: { "fill-color": color, "fill-opacity": 0.9 },
          filter: ["==", ["get", "LULC_1"], category],
          layout: { visibility: "none" },
        });
      });

      if (!drawInitialized.current) {
        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true,
          },
          styles: [
            // Active (being drawn) polygon style
            {
              id: "gl-draw-polygon-fill-active",
              type: "fill",
              filter: [
                "all",
                ["==", "active", "true"],
                ["==", "$type", "Polygon"],
              ],
              paint: {
                "fill-color": "#3bb2d0",
                "fill-outline-color": "#3bb2d0",
                "fill-opacity": 0.2,
              },
            },
            // Inactive (completed) polygon style
            {
              id: "gl-draw-polygon-fill-inactive",
              type: "fill",
              filter: [
                "all",
                ["==", "active", "false"],
                ["==", "$type", "Polygon"],
              ],
              paint: {
                "fill-color": "#3bb2d0",
                "fill-outline-color": "#3bb2d0",
                "fill-opacity": 0.1,
              },
            },
            // Active line style (while drawing)
            {
              id: "gl-draw-line-active",
              type: "line",
              filter: [
                "all",
                ["==", "active", "true"],
                ["==", "$type", "LineString"],
              ],
              paint: {
                "line-color": "#3bb2d0",
                "line-width": 2,
                "line-dasharray": [0.2, 2],
              },
            },
            // Vertex point style
            {
              id: "gl-draw-polygon-and-line-vertex-active",
              type: "circle",
              filter: [
                "all",
                ["==", "meta", "vertex"],
                ["==", "$type", "Point"],
              ],
              paint: {
                "circle-radius": 5,
                "circle-color": "#3bb2d0",
              },
            },
          ],
        });
        map.current.addControl(draw.current);
        map.current.on("draw.modechange", (e) => {
          setDrawingPolygon(e.mode === "draw_polygon");
        });
        drawInitialized.current = true;

        const createPopup = (content, coordinates) => {
          if (currentPopup) currentPopup.remove();

          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
          })
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(map.current);

          // Store the popup instance
          popupRef.current = popup;
          setCurrentPopup(popup);

          // Custom close handler for immediate closing
          const closeButton = popup._container.querySelector(
            ".mapboxgl-popup-close-button"
          );
          if (closeButton) {
            closeButton.style.pointerEvents = "auto";
            closeButton.addEventListener("click", (e) => {
              e.stopPropagation();
              clearDrawing();
            });
          }

          return popup;
        };

        map.current.on("draw.render", (e) => {
          if (drawingPolygon) {
            const data = draw.current.getAll();
            if (data.features.length > 0) {
              const calculatedArea = turf.area(data);
              setArea(Math.round(calculatedArea * 100) / 100);

              const coords = data.features[0].geometry.coordinates[0];
              if (coords.length > 0) {
                createPopup(
                  `<strong>Drawing...</strong><br>Area: ${(
                    calculatedArea * 0.000247105
                  ).toFixed(2)} acres`,
                  coords[coords.length - 1]
                );
              }
            }
          }
        });

        map.current.on("draw.create", (e) => {
          const data = draw.current.getAll();
          if (data.features.length > 0) {
            const calculatedArea = turf.area(data);
            setArea(Math.round(calculatedArea * 100) / 100);

            const centroid = turf.centroid(data.features[0]);
            createPopup(
              `<strong>Area:</strong> ${(calculatedArea * 0.000247105).toFixed(
                2
              )} acres`,
              centroid.geometry.coordinates
            );
          }
          setDrawingPolygon(false);
        });

        map.current.on("draw.create", updateArea);
        map.current.on("draw.delete", updateArea);
        map.current.on("draw.update", updateArea);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [districts, mandals, villages]);

  const updateArea = (e) => {
    const data = draw.current.getAll();
    if (currentPopup) currentPopup.remove();

    if (data.features.length > 0) {
      const calculatedArea = turf.area(data);
      setArea(Math.round(calculatedArea * 100) / 100);

      const centroid = turf.centroid(data.features[0]);
      const popup = new mapboxgl.Popup()
        .setLngLat(centroid.geometry.coordinates)
        .setHTML(
          `<strong>Area:</strong> ${(calculatedArea * 0.000247105).toFixed(
            2
          )} acres`
        );
      popup.addTo(map.current);
      setCurrentPopup(popup);
    } else {
      setArea(null);
    }
  };

  useEffect(() => {
    if (!map.current || !draw.current) return;

    if (activeTool === "polygon") {
      draw.current.changeMode("draw_polygon");
      setDrawingPolygon(true);
    } else if (activeTool === "line") {
      draw.current.changeMode("draw_line_string");
    } else {
      draw.current.changeMode("simple_select");
      setDrawingPolygon(false);
    }
  }, [activeTool]);

  useEffect(() => {
    if (!map.current) return;

    if (map.current.getLayer("parcels-fill")) {
      map.current.setLayoutProperty(
        "parcels-fill",
        "visibility",
        cadastralVisible ? "visible" : "none"
      );
    }
    if (map.current.getLayer("parcels-outline")) {
      map.current.setLayoutProperty(
        "parcels-outline",
        "visibility",
        cadastralVisible ? "visible" : "none"
      );
    }
    if (map.current.getLayer("parcels-label")) {
      map.current.setLayoutProperty(
        "parcels-label",
        "visibility",
        cadastralVisible ? "visible" : "none"
      );
    }

    BOUNDARY_LAYERS.forEach(({ id, key }) => {
      const outlineLayer = `${id}-outline`;
      const labelLayer = `${id}-label`;

      if (
        map.current.getLayer(outlineLayer) &&
        map.current.getLayer(labelLayer)
      ) {
        const visibility =
          isAdminBoundariesVisible && adminSettings[key] ? "visible" : "none";
        map.current.setLayoutProperty(outlineLayer, "visibility", visibility);
        map.current.setLayoutProperty(labelLayer, "visibility", visibility);
      }
    });

    POI_LAYERS.forEach(({ id, setting }) => {
      const visibility =
        isPOISectionVisible && poiSettings[setting] ? "visible" : "none";
      if (map.current.getLayer(id)) {
        map.current.setLayoutProperty(id, "visibility", visibility);
      }
      if (map.current.getLayer(`${id}-outline`)) {
        map.current.setLayoutProperty(
          `${id}-outline`,
          "visibility",
          visibility
        );
      }
    });

    Object.keys(lulcToggles).forEach((category) => {
      const layerId = `lulc-${category.replace(/\s+/g, "-").toLowerCase()}`;
      const visibility =
        isLULCSectionVisible && lulcToggles[category] ? "visible" : "none";
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, "visibility", visibility);
      }
    });

    if (map.current.getLayer("topography-layer")) {
      map.current.setLayoutProperty(
        "topography-layer",
        "visibility",
        topographyVisible ? "visible" : "none"
      );
    }

    if (
      isAdminBoundariesVisible &&
      (adminSettings.district || adminSettings.mandal || adminSettings.village)
    ) {
      let features = [];
      if (adminSettings.district && districts?.features)
        features = features.concat(districts.features);
      if (adminSettings.mandal && mandals?.features)
        features = features.concat(mandals.features);
      if (adminSettings.village && villages?.features) {
        const villageBBox = bbox({
          type: "FeatureCollection",
          features: villages.features,
        });
        map.current.fitBounds(villageBBox, { padding: 40 });
      }

      if (features.length) {
        const stateBBox = bbox({ type: "FeatureCollection", features });
        map.current.fitBounds(stateBBox, { padding: 40 });
      }
    }
  }, [
    poiSettings,
    isPOISectionVisible,
    adminSettings,
    isAdminBoundariesVisible,
    lulcToggles,
    isLULCSectionVisible,
    districts,
    mandals,
    villages,
    topographyVisible,
    cadastralVisible,
  ]);

  useEffect(() => {
    if (!map.current) return;

    if (map.current.getLayer("fmb137-layer")) {
      map.current.setLayoutProperty(
        "fmb137-layer",
        "visibility",
        showFmbLayer ? "visible" : "none"
      );
    }
  }, [showFmbLayer]);

  useEffect(() => {
    if (!map.current || !districts || !mandals || !villages) return;

    const findFeature = (collection, name, key) =>
      collection?.features?.find(
        (f) => f.properties?.[key]?.toLowerCase() === name?.toLowerCase()
      );

    const districtFeature = findFeature(districts, highlightDistrict, "NAME");
    const mandalFeature = findFeature(mandals, highlightMandal, "sdtname");
    const villageFeature = findFeature(villages, highlightVillage, "Village");

    if (map.current.getSource("highlight-district")) {
      map.current.getSource("highlight-district").setData({
        type: "FeatureCollection",
        features: districtFeature ? [districtFeature] : [],
      });
    }

    if (map.current.getSource("highlight-mandal")) {
      map.current.getSource("highlight-mandal").setData({
        type: "FeatureCollection",
        features: mandalFeature ? [mandalFeature] : [],
      });
    }

    if (map.current.getSource("highlight-village")) {
      map.current.getSource("highlight-village").setData({
        type: "FeatureCollection",
        features: villageFeature ? [villageFeature] : [],
      });
    }

    if (villageFeature) {
      map.current.fitBounds(turf.bbox(villageFeature), { padding: 40 });
    } else if (mandalFeature) {
      map.current.fitBounds(turf.bbox(mandalFeature), { padding: 40 });
    } else if (districtFeature) {
      map.current.fitBounds(turf.bbox(districtFeature), { padding: 40 });
    }
  }, [highlightDistrict, highlightMandal, highlightVillage]);

  useEffect(() => {
    if (!map.current) return;

    if (adminSettings.village && villages?.features?.length) {
      const villageBBox = bbox({
        type: "FeatureCollection",
        features: villages.features,
      });
      map.current.fitBounds(villageBBox, { padding: 40 });
    }
  }, [adminSettings.village]);

  return <div ref={mapContainer} className="map-container" />;
}
