import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import RightLayer from "../components/Layers/Layers";
import RecordDetails from "../components/Records";
import "../styles/HomePage.css";
import ToolBar from "../components/ToolBar";
import Search from "../components/Search";
import AuthDebugHelper from "./AuthDebugHelper";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function HomePage({ onLogout }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isAdminBoundariesVisible, setIsAdminBoundariesVisible] =
    useState(false);
  const [isPOISectionVisible, setIsPOISectionVisible] = useState(false);
  const [showFmbLayer, setShowFmbLayer] = useState(false);
  const [isLULCSectionVisible, setIsLULCSectionVisible] = useState(false);
  const [districts, setDistricts] = useState(null);
  const [mandals, setMandals] = useState(null);
  const [villages, setVillages] = useState(null);
  const [highlightDistrict, setHighlightDistrict] = useState(null);
  const [highlightMandal, setHighlightMandal] = useState(null);
  const [highlightVillage, setHighlightVillage] = useState(null);
  const [lulcToggles, setLulcToggles] = useState({});
  const [activeTool, setActiveTool] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [topographyVisible, setTopographyVisible] = useState(false);
  const [cadastralVisible, setCadastralVisible] = useState(true);

  const [adminSettings, setAdminSettings] = useState({
    district: false,
    mandal: false,
    village: false,
  });
  const [poiSettings, setPoiSettings] = useState({
    anganwadi: false,
    canal: false,
    forest: false,
    civilSupplies: false,
    muncipalities: false,
    hospitals: false,
    archmuse: false,
    drainage: false,
    electricpoles: false,
    policeSt: false,
    policeSur: false,
    railway: false,
    river: false,
    roads: false,
  });

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/logout`, {
      method: "POST",
      credentials: "include",
    });
    onLogout();
  };

  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const [d, m, v] = await Promise.all([
          fetch("/District.json"),
          fetch("/Mandal.json"),
          fetch("/Village.json"),
        ]);
        const [districtData, mandalData, villageData] = await Promise.all([
          d.json(),
          m.json(),
          v.json(),
        ]);
        setDistricts(districtData);
        setMandals(mandalData);
        setVillages(villageData);
      } catch (err) {
        console.error("GeoJSON loading failed:", err);
      }
    };
    loadGeoJSON();
  }, []);

  useEffect(() => {
    if (!cadastralVisible) {
      setSelectedFeature(null); // hide record panel
      setShowFmbLayer(false); // hide FMB

      // Remove parcel highlight
      if (window.__MAP__) {
        const map = window.__MAP__;
        const source = map.getSource("highlight-parcel");
        if (source) {
          source.setData({ type: "FeatureCollection", features: [] });
        }

        // ✅ Close any popup
        const popups = document.getElementsByClassName("mapboxgl-popup");
        for (let popup of popups) {
          popup.remove();
        }
      }
    }
  }, [cadastralVisible]);

  return (
    <div className="app-container">
       <AuthDebugHelper />
      <Navbar onLogout={handleLogout} />
      <div className="map-container">
        <div
          className="records-container"
          style={{ pointerEvents: selectedFeature ? "auto" : "none" }}
        >
          {selectedFeature && (
            <RecordDetails
              data={selectedFeature}
              isSearchExpanded={isSearchExpanded}
              showFmbLayer={showFmbLayer}
              setShowFmbLayer={setShowFmbLayer}
              onClose={() => setSelectedFeature(null)}
            />
          )}
        </div>

        <MapView
          onSelectPolygon={(props) => setSelectedFeature(props)}
          adminSettings={adminSettings}
          poiSettings={poiSettings}
          isAdminBoundariesVisible={isAdminBoundariesVisible}
          isPOISectionVisible={isPOISectionVisible}
          isLULCSectionVisible={isLULCSectionVisible}
          topographyVisible={topographyVisible}
          districts={districts}
          mandals={mandals}
          villages={villages}
          highlightDistrict={highlightDistrict}
          highlightMandal={highlightMandal}
          highlightVillage={highlightVillage}
          lulcToggles={lulcToggles}
          activeTool={activeTool}
          showFmbLayer={showFmbLayer}
          cadastralVisible={cadastralVisible}
        />

        <RightLayer
          settings={poiSettings}
          setSettings={setPoiSettings}
          isPOISectionVisible={isPOISectionVisible}
          setIsPOISectionVisible={setIsPOISectionVisible}
          isAdminBoundariesVisible={isAdminBoundariesVisible}
          setIsAdminBoundariesVisible={setIsAdminBoundariesVisible}
          adminSettings={adminSettings}
          setAdminSettings={setAdminSettings}
          lulcToggles={lulcToggles}
          setLulcToggles={setLulcToggles}
          isLULCSectionVisible={isLULCSectionVisible}
          topographyVisible={topographyVisible}
          setTopographyVisible={setTopographyVisible}
          setIsLULCSectionVisible={setIsLULCSectionVisible}
          cadastralVisible={cadastralVisible}
          setCadastralVisible={setCadastralVisible}
        />

        <div className="controls-container">
          {districts && mandals && villages && (
            <Search
              districts={districts}
              mandals={mandals}
              villages={villages}
              onHighlightDistrict={setHighlightDistrict}
              onHighlightMandal={setHighlightMandal}
              onHighlightVillage={setHighlightVillage}
              onToggle={setIsSearchExpanded}
            />
          )}
        </div>

        <ToolBar setActiveTool={setActiveTool} />
       
      </div>
    </div>
  );
}