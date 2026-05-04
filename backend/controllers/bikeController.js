const asyncHandler = require("express-async-handler");

const API_NINJAS_KEY = "Sar/hlBAggdnEu+zJX9qhA==NvVic5dBX5HiFiqi";
const API_NINJAS_BASE_URL = "https://api.api-ninjas.com/v1/motorcycles";

const getBikeDetails = asyncHandler(async (req, res) => {
  const { make, model, year } = req.query;

  if (!make) {
    return res.status(400).json({
      success: false,
      message: "Make is required",
    });
  }

  try {
    const params = new URLSearchParams();
    params.append("make", make);
    if (model) params.append("model", model);
    if (year) params.append("year", year);

    const response = await fetch(
      `${API_NINJAS_BASE_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": API_NINJAS_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API Ninjas error: ${response.statusText}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching bike details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bike details from API",
      error: error.message,
    });
  }
});

const getBikeMakes = asyncHandler(async (req, res) => {
  try {
    const makes = [
      "Kawasaki",
      "Yamaha",
      "Honda",
      "Suzuki",
      "KTM",
      "Royal Enfield",
      "Bajaj",
      "TVS",
      "Hero",
      "Harley-Davidson",
      "Triumph",
      "Ducati",
      "BMW",
    ];

    res.json({
      success: true,
      data: makes,
    });
  } catch (error) {
    console.error("Error fetching bike makes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bike makes",
      error: error.message,
    });
  }
});

const getBikeModels = asyncHandler(async (req, res) => {
  const { make } = req.query;

  if (!make) {
    return res.status(400).json({
      success: false,
      message: "Make is required",
    });
  }

  try {
    const response = await fetch(
      `${API_NINJAS_BASE_URL}?make=${encodeURIComponent(make)}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": API_NINJAS_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API Ninjas error: ${response.statusText}`);
    }

    const data = await response.json();

    const models = [...new Set(data.map((bike) => bike.model))].filter(Boolean);

    res.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error) {
    console.error("Error fetching bike models:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bike models from API",
      error: error.message,
    });
  }
});

module.exports = {
  getBikeDetails,
  getBikeMakes,
  getBikeModels,
};
