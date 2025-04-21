export const fetchRecordByParcelId = async (parcelId) => {
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
