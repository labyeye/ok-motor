import React, { useState, useRef } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, RotateCw } from "lucide-react";

const ImageCropper = ({
  imageSrc,
  onCancel,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [rotation, setRotation] = useState(0);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    
    if (rotation !== 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg", 0.95);
    });
  };

  const handleSave = async () => {
    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg();
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
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
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            style={{ maxHeight: "100%", maxWidth: "100%" }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </ReactCrop>
        </div>

        <div style={styles.controls}>
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
