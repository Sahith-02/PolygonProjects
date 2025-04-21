import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/Records.css";

const RecordDetails = ({
  data,
  onClose,
  isSearchExpanded,
  showFmbLayer,
  setShowFmbLayer,
}) => {
  const topPosition = isSearchExpanded ? "400px" : "180px";

  const toggleFmbLayer = () => setShowFmbLayer((prev) => !prev);
  //console.log(data);
  return (
    <div
      className="records-sidebar"
      style={{
        top: topPosition,
        transition: "top 0.3s ease",
        pointerEvents: "auto",
      }}
    >
      <div className="section-header">
        <div className="section-title">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path
                d="M4 4H10V10H4V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 4H20V10H14V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 14H10V20H4V14Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 14H20V20H14V20Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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

      <div className="records-content">
        <div className="records-list">
          {/* ✅ Show ALL fields, including null or empty ones */}
          {Object.entries(data).map(([key, value]) => (
            <div className="record-item" key={key}>
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

          {/* ✅ Always show Adangal toggle at the end if Parcel is present */}
          {data?.Parcel_num && (
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
                  {String(data.Parcel_num).trim() === "137" && (
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
                  {String(data.Parcel_num).trim() === "137" ? (
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

              {String(data.Parcel_num).trim() === "137" ? (
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
