import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import RightLayer from "../components/RightLayer";
import RecordDetails from "../components/Records/RecordDetails";
import "../styles/HomePage.css";
import ToolBar from "../components/ToolBar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function HomePage({ onLogout }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isPOISectionVisible, setIsPOISectionVisible] = useState(false);
  const [isLULCSectionVisible, setIsLULCSectionVisible] = useState(false);
  const [districts, setDistricts] = useState(null);
  const [mandals, setMandals] = useState(null);
  const [villages, setVillages] = useState(null);
  const [highlightDistrict, setHighlightDistrict] = useState(null);
  const [highlightMandal, setHighlightMandal] = useState(null);
  const [highlightVillage, setHighlightVillage] = useState(null);
  const [lulcToggles, setLulcToggles] = useState({});

  const [poiSettings, setPoiSettings] = useState({
    district: false,
    mandal: false,
    village: false,
    anganwadi: false,
    canal: false,
    forest: false,
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

  return (
    <div className="app-container">
      <Navbar onLogout={handleLogout} />
      <div className="map-container">
        {selectedFeature && (
          <RecordDetails
            data={selectedFeature}
            onClose={() => setSelectedFeature(null)}
          />
        )}
        <MapView
          onSelectPolygon={(props) => setSelectedFeature(props)}
          poiSettings={poiSettings}
          isPOISectionVisible={isPOISectionVisible}
          isLULCSectionVisible={isLULCSectionVisible}
          districts={districts}
          mandals={mandals}
          villages={villages}
          highlightDistrict={highlightDistrict}
          highlightMandal={highlightMandal}
          highlightVillage={highlightVillage}
          lulcToggles={lulcToggles}
        />
        <RightLayer
          settings={poiSettings}
          setSettings={setPoiSettings}
          isPOISectionVisible={isPOISectionVisible}
          setIsPOISectionVisible={setIsPOISectionVisible}
          districts={districts}
          mandals={mandals}
          onHighlightDistrict={setHighlightDistrict}
          onHighlightMandal={setHighlightMandal}
          onHighlightVillage={setHighlightVillage}
          lulcToggles={lulcToggles}
          setLulcToggles={setLulcToggles}
          isLULCSectionVisible={isLULCSectionVisible}
          setIsLULCSectionVisible={setIsLULCSectionVisible}
        />
        <ToolBar/>
      </div>
    </div>
  );
}
