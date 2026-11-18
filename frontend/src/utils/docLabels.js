const LABELS = {
  letter: "Letter",
  invoice: "Invoice",
  vehicleRC: "Vehicle RC",
  aadhaar: "Aadhaar",
  pan: "PAN",
  vehicleKM: "KM Photo",
  deliveryPhoto: "Delivery Photo",
  vehiclePhotos: "Vehicle Photos",
  signedDocSell: "Signed Sell Doc",
  signedDocBuy: "Signed Buy Doc",
  transferReceipt: "Transfer Receipt",
  insuranceCertificate: "Insurance Certificate",
  vehicleNOC: "NOC",
  vehicleBuyReceipt: "Buy Receipt",
};

// Names of the docs that will go into the PDF (all if no selection given)
export const docNames = (docs) =>
  docs ? Object.keys(docs).filter((k) => docs[k] && LABELS[k]).map((k) => LABELS[k]) : ["Letter", "Invoice"];
