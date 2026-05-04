# Vehicle Search Filter System

## Overview

The search filter system uses JSON files to dynamically populate dropdowns and enable intelligent keyword search that redirects to the inventory page with proper filters.

## Files Created

### 1. `/website/data/bikes-data.json`

Contains all bike brands with:

- **make**: Brand name (e.g., "Royal Enfield", "Bajaj")
- **models**: Array of model names (e.g., "Classic 350", "Pulsar 150")
- **bodyTypes**: Array of body types (e.g., "cruiser", "sport", "commuter")
- **keywords**: Array of search keywords (e.g., "classic", "bullet", "re")

Total: 14 bike brands with comprehensive model listings

### 2. `/website/data/cars-data.json`

Contains all car brands with the same structure:

- **make**: Brand name (e.g., "Maruti", "Hyundai")
- **models**: Array of model names (e.g., "Swift", "Creta")
- **bodyTypes**: Array of body types (e.g., "sedan", "suv", "hatchback")
- **keywords**: Array of search keywords (e.g., "maruti suzuki", "swift")

Total: 17 car brands with comprehensive model listings

## How It Works

### 1. Data Loading

- On page load, both JSON files are loaded asynchronously
- Data is stored in the global `vehicleData` object
- System waits for data to load before initializing filters

### 2. Tab Switching (Car/Bike)

- When user switches tabs, dropdowns are dynamically populated
- Make dropdown shows only relevant brands for selected vehicle type
- Body dropdown shows only relevant body types for selected vehicle type
- Model dropdown is reset

### 3. Make Selection

- When user selects a make, the model dropdown is populated with that brand's models
- Models are fetched from the JSON data based on selected make

### 4. Keyword Search

The keyword search is intelligent and checks:

1. **Make Match**: If keyword matches any brand name
2. **Model Match**: If keyword matches any model name
3. **Keyword Match**: If keyword matches any brand's keywords array

Example:

- Search "classic" → Matches Royal Enfield (keyword: "classic")
- Search "swift" → Matches Maruti Swift
- Search "re" → Matches Royal Enfield (keyword: "re")

### 5. Search Button Action

When search is clicked, it builds a URL with parameters:

- `type`: Vehicle type (car/bike)
- `brand`: Selected or keyword-matched make
- `model`: Selected or keyword-matched model
- `body`: Selected body type
- `q`: Raw keyword for general search

Example URLs:

```
inventory.html?type=bike&brand=Royal%20Enfield&q=classic
inventory.html?type=car&brand=Maruti&model=Swift
inventory.html?type=bike&brand=KTM&body=sport
```

## Features

### ✅ Dynamic Dropdown Population

- Dropdowns are populated from JSON files
- Easy to add new brands/models by updating JSON
- No need to modify HTML

### ✅ Smart Keyword Matching

- Searches across make, models, and keywords
- Automatically populates brand/model if keyword matches
- Falls back to general search if no exact match

### ✅ Clean URL Parameters

- All filters passed as URL parameters to inventory page
- Easy for inventory page to parse and filter results

### ✅ User-Friendly

- Press Enter in keyword field to search
- Tab switching automatically resets filters
- Model dropdown updates based on make selection

## Adding New Vehicles

To add new brands or models, simply edit the JSON files:

### Adding a New Bike Brand

```json
{
  "make": "Aprilia",
  "models": ["RS 457", "Tuono 457", "SXR 160"],
  "bodyTypes": ["sport", "scooter"],
  "keywords": ["aprilia", "rs", "tuono", "sxr"]
}
```

### Adding a New Car Brand

```json
{
  "make": "Citroen",
  "models": ["C3", "C5 Aircross", "eC3"],
  "bodyTypes": ["hatchback", "suv"],
  "keywords": ["citroen", "c3", "c5", "aircross"]
}
```

## Integration with Inventory Page

The inventory page should read URL parameters:

- `type` - Filter by vehicle type
- `brand` - Filter by brand/make
- `model` - Filter by specific model
- `body` - Filter by body type
- `q` - General keyword search

This allows the inventory page to show pre-filtered results based on user's search criteria from the home page.
