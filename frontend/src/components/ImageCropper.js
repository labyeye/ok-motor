import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropUtils";
import { X, Check, RotateCw } from "lucide-react";

const ImageCropper = ({ imageSrc, onCancel, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onRotationChange = useCallback((rotation) => {
    setRotation(rotation);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Crop Image</h3>
          <button onClick={onCancel} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.cropperContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={undefined}
            onCropChange={onCropChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
            cropShape="rect"
            showGrid={true}
            restrictPosition={false}
          />
        </div>

        <div style={styles.controls}>
          <div style={styles.sliderContainer}>
            <label style={styles.label}>Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              style={styles.slider}
            />
          </div>
          <div style={styles.sliderContainer}>
            <label style={styles.label}>Rotation</label>
            <button
              onClick={() => setRotation((r) => r + 90)}
              style={styles.rotateBtn}
              type="button"
            >
              <RotateCw size={16} /> Rotate
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onCancel} style={styles.cancelBtn} type="button">
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={styles.saveBtn}
            disabled={isCropping}
            type="button"
          >
            {isCropping ? "Cropping..." : "Confirm & Upload"}{" "}
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px",
  },
  cropperContainer: {
    position: "relative",
    flex: 1,
    backgroundColor: "#333",
  },
  controls: {
    padding: "16px",
    backgroundColor: "white",
  },
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  },
  label: {
    minWidth: "60px",
    fontSize: "14px",
    color: "#475569",
  },
  slider: {
    flex: 1,
  },
  rotateBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  footer: {
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    backgroundColor: "white",
    color: "#475569",
    cursor: "pointer",
    fontWeight: "500",
  },
  saveBtn: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#088395",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default ImageCropper;
