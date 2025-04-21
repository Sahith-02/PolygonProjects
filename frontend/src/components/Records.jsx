import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/Records.css";

// 🔄 API call to fetch parcel data from backend
const fetchRecordByParcelId = async (parcelId) => {
  try {
    const response = await fetch(
      `http://localhost:5001/api/records/${parcelId}`
    );
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch parcel data:", err);
    return null;
  }
};

const RecordDetails = ({
  data,
  onClose,
  isSearchExpanded,
  showFmbLayer,
  setShowFmbLayer,
}) => {
  const topPosition = isSearchExpanded ? "400px" : "180px";

  const parcelId = String(data.Parcel_num || data["Parcel no"]).trim(); // ✅ Primary key for all queries

  const [adangalData, setAdangalData] = useState({});
  const [ror1bData, setRor1bData] = useState({});

  const toggleFmbLayer = () => setShowFmbLayer((prev) => !prev);

  // 📦 Fetch adangal + ror1b from DB on component mount
  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchRecordByParcelId(parcelId);
      if (result) {
        setAdangalData(result?.adangal?.[0] || {});
        setRor1bData(result?.ror1b?.[0] || {});
      }
    };
    fetchData();
  }, [parcelId]);

  return (
    <div
      className="records-sidebar"
      style={{
        top: topPosition,
        transition: "top 0.3s ease",
        pointerEvents: "auto",
      }}
    >
      {/* 🔷 Sidebar Header */}
      <div className="section-header">
        <div className="section-title">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M4 4H10V10H4V4Z" stroke="currentColor" strokeWidth="2" />
              <path
                d="M14 4H20V10H14V4Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4 14H10V20H4V14Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M14 14H20V20H14V14Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <button
            className="back-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="location-title">Records</h2>
        </div>
      </div>

      {/* 🔽 Main Record Content */}
      <div className="records-content">
        <div className="records-list">
          {/* ✅ Show Parcel Number (only from adangal) */}
          <div className="record-item" key="parcel-no">
            <div className="item-label">Parcel Number</div>
            <div className="item-value">{parcelId}</div>
          </div>

          {/* ✅ 1. DB: Adangal Fields (skip Parcel no) */}
          {Object.entries(adangalData)
            .filter(([key]) => key !== "Parcel no")
            .map(([key, value]) => (
              <div className="record-item" key={`adangal-${key}`}>
                <div className="item-label">{key}</div>
                <div className="item-value">
                  {value === null || value === "" ? "—" : value.toString()}
                </div>
              </div>
            ))}

          {/* ✅ 2. DB: ROR 1B Fields (skip Parcel no) */}
          {Object.entries(ror1bData)
            .filter(([key]) => key !== "Parcel no")
            .map(([key, value]) => (
              <div className="record-item" key={`ror1b-${key}`}>
                <div className="item-label">{key}</div>
                <div className="item-value">
                  {value === null || value === "" ? "—" : value.toString()}
                </div>
              </div>
            ))}

          {/* ✅ 3. Static Data (skip Parcel_num) */}
          {Object.entries(data)
            .filter(([key]) => key !== "Parcel_num" && key !== "Parcel no")
            .map(([key, value]) => (
              <div className="record-item" key={`static-${key}`}>
                <div className="item-label">{key}</div>
                <div className="item-value">
                  {value === null || value === ""
                    ? "—"
                    : typeof value === "number"
                    ? value.toFixed(6)
                    : value.toString()}
                </div>
              </div>
            ))}

          {/* 📎 FMB / EC / ADANGAL PDFs (always shown) */}
          {parcelId && (
            <>
              <div className="record-item">
                <div className="item-label">FMB SKETCH</div>
                <div
                  className="item-value"
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={showFmbLayer}
                    onChange={toggleFmbLayer}
                  />
                  {parcelId === "137" && (
                    <a
                      href="/pdfs/fmb_137.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#007bff",
                        textDecoration: "underline",
                        fontSize: "14px",
                      }}
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>

              <div className="record-item">
                <div className="item-label">EC</div>
                <div className="item-value">
                  {parcelId === "137" ? (
                    <a
                      href="/pdfs/137_EC.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#007bff",
                        textDecoration: "underline",
                        fontSize: "14px",
                      }}
                    >
                      PDF
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {parcelId === "137" ? (
                <div className="record-item">
                  <div className="item-label">ADANGAL</div>
                  <div
                    className="item-value"
                    style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                  >
                    {["137_1A", "137_1B", "137_1C", "137_2"].map((filename) => (
                      <a
                        key={filename}
                        href={`/pdfs/${filename}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#007bff",
                          textDecoration: "underline",
                          fontSize: "14px",
                        }}
                      >
                        {filename}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="record-item">
                  <div className="item-label">ADANGAL</div>
                  <div className="item-value">—</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;
