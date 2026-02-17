import React, { useState, useRef, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, RotateCw } from "lucide-react";

const ImageCropper = ({ imageSrc, onCancel, onCropComplete }) => {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [rotation, setRotation] = useState(0);
  const [rotatedImageSrc, setRotatedImageSrc] = useState(imageSrc);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);

  // Create a rotated version of the image whenever rotation changes
  useEffect(() => {
    const rotateImage = async () => {
      if (rotation === 0) {
        setRotatedImageSrc(imageSrc);
        return;
      }

      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate new canvas size after rotation
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));

      canvas.width = Math.ceil(img.width * cos + img.height * sin);
      canvas.height = Math.ceil(img.width * sin + img.height * cos);

      // Rotate and draw the image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      setRotatedImageSrc(canvas.toDataURL("image/jpeg", 0.85));

      // Reset crop when rotation changes
      setCrop({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      });
      setCompletedCrop(null);
    };

    rotateImage();
  }, [rotation, imageSrc]);

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    // Compress image to approximately 100KB
    return new Promise((resolve) => {
      const compressImage = async (quality) => {
        return new Promise((res) => {
          canvas.toBlob(
            (blob) => {
              res(blob);
            },
            "image/jpeg",
            quality,
          );
        });
      };

      const findOptimalQuality = async () => {
        const targetSize = 100 * 1024; // 100KB
        let quality = 0.9;
        let blob = await compressImage(quality);

        // If image is already small enough, return it
        if (blob.size <= targetSize) {
          const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
          resolve(file);
          return;
        }

        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = 0.9;
        let bestBlob = blob;

        while (maxQuality - minQuality > 0.05) {
          quality = (minQuality + maxQuality) / 2;
          blob = await compressImage(quality);

          if (blob.size > targetSize) {
            maxQuality = quality;
          } else {
            minQuality = quality;
            bestBlob = blob;
          }
        }

        // If still too large, try one more time with minimum quality
        if (bestBlob.size > targetSize * 1.5) {
          bestBlob = await compressImage(0.5);
        }

        const file = new File([bestBlob], "cropped.jpg", {
          type: "image/jpeg",
        });
        resolve(file);
      };

      findOptimalQuality();
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
            aspect={undefined}
          >
            <img
              ref={imgRef}
              src={rotatedImageSrc}
              alt="Crop"
              style={{
                maxWidth: "100%",
                maxHeight: "55vh",
                display: "block",
              }}
            />
          </ReactCrop>
        </div>

        <div style={styles.controls}>
          <div style={styles.sliderContainer}>
            <label style={styles.label}>Rotation</label>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              style={styles.rotateBtn}
              type="button"
            >
              <RotateCw size={16} /> Rotate 90°
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
    maxWidth: "800px",
    maxHeight: "90vh",
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
    overflow: "auto",
    minHeight: "400px",
    maxHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
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
