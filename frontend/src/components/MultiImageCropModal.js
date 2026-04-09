import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Save, X, RotateCw } from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const MultiImageCropModal = ({ isOpen, files, fieldName, onSave, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [croppedImages, setCroppedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDataUrls, setImageDataUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    if (isOpen && files && files.length > 0) {
      setIsLoading(true);
      // Convert File objects to data URLs
      const promises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((urls) => {
        setImageDataUrls(urls);
        setCroppedImages(files.map(() => null));
        setCurrentIndex(0);
        setCrop({
          unit: "%",
          width: 50,
          height: 50,
          x: 25,
          y: 25,
        });
        setCompletedCrop(null);
        setRotation(0);
        setIsLoading(false);
      });
    }
  }, [isOpen, files]);

  if (!isOpen || !files || files.length === 0 || isLoading) {
    return null;
  }

  const currentImageDataUrl = imageDataUrls[currentIndex];

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
        const targetSize = 100 * 1024;
        let quality = 0.9;
        let blob = await compressImage(quality);

        if (blob.size <= targetSize) {
          const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
          resolve(file);
          return;
        }

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

  const handleCropSave = async () => {
    const croppedFile = await getCroppedImg();
    if (croppedFile) {
      const newCroppedImages = [...croppedImages];
      newCroppedImages[currentIndex] = croppedFile;
      setCroppedImages(newCroppedImages);
    }
  };

  const handleNext = async () => {
    await handleCropSave();
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCrop({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      });
      setCompletedCrop(null);
      setRotation(0);
    }
  };

  const handlePrevious = async () => {
    await handleCropSave();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCrop({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      });
      setCompletedCrop(null);
      setRotation(0);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsProcessing(true);
      await handleCropSave();
      const finalImages = croppedImages.map((cropped, idx) => {
        return cropped || files[idx];
      });
      await onSave(finalImages, fieldName);
      onClose();
    } catch (error) {
      console.error("Error saving cropped images:", error);
      alert("Error saving images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCroppedImages([]);
    onClose();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const styles = {
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      maxWidth: "900px",
      width: "95%",
      maxHeight: "95vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      backgroundColor: "#f8fafc",
    },
    title: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1e293b",
      margin: 0,
    },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#64748b",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      overflow: "auto",
    },
    progressBar: {
      width: "100%",
      height: "3px",
      backgroundColor: "#e2e8f0",
      borderRadius: "2px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
      transition: "width 0.3s ease",
      width: `${((currentIndex + 1) / files.length) * 100}%`,
    },
    imageCounter: {
      fontSize: "13px",
      color: "#64748b",
      fontWeight: "500",
      textAlign: "center",
    },
    cropperArea: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
      minHeight: "300px",
    },
    cropImageContainer: {
      width: "100%",
      maxHeight: "450px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      backgroundColor: "#f1f5f9",
      overflow: "auto",
      padding: "10px",
    },
    rotateBtn: {
      padding: "6px 12px",
      backgroundColor: "#e2e8f0",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500",
      color: "#334155",
    },
    navigationControls: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    navBtn: {
      padding: "8px 14px",
      backgroundColor: "#e2e8f0",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500",
      color: "#334155",
      transition: "all 0.2s",
    },
    navBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      padding: "12px 20px",
      borderTop: "1px solid #e2e8f0",
      backgroundColor: "#f8fafc",
    },
    cancelBtn: {
      padding: "8px 16px",
      backgroundColor: "#f1f5f9",
      border: "1px solid #cbd5e1",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "13px",
      color: "#334155",
    },
    saveBtn: {
      padding: "8px 16px",
      backgroundColor: "#3b82f6",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
  };

  const prevBtnStyle = {
    ...styles.navBtn,
    ...(currentIndex === 0 ? styles.navBtnDisabled : {}),
  };

  const nextBtnStyle = {
    ...styles.navBtn,
    ...(currentIndex === files.length - 1 ? styles.navBtnDisabled : {}),
  };

  const getRotatedImageSrc = () => {
    if (rotation === 0) return currentImageDataUrl;
    
    const img = new Image();
    img.src = currentImageDataUrl;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    
    canvas.width = Math.ceil(img.width * cos + img.height * sin);
    canvas.height = Math.ceil(img.width * sin + img.height * cos);
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  return (
    <div style={styles.modalOverlay} onClick={handleClose}>
      <div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>
            Crop Images - {fieldName || "Documents"} ({files.length})
          </h2>
          <button
            style={styles.closeBtn}
            onClick={handleClose}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.progressBar}>
            <div style={styles.progressFill}></div>
          </div>

          <div style={styles.imageCounter}>
            Image {currentIndex + 1} of {files.length}
          </div>

          <div style={styles.cropperArea}>
            {currentImageDataUrl && (
              <>
                <div style={styles.cropImageContainer}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                  >
                    <img
                      ref={imgRef}
                      src={rotation === 0 ? currentImageDataUrl : getRotatedImageSrc()}
                      alt="Crop preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "450px",
                        display: "block",
                        objectFit: "contain",
                      }}
                    />
                  </ReactCrop>
                </div>

                <button
                  style={styles.rotateBtn}
                  onClick={handleRotate}
                  disabled={isProcessing}
                >
                  <RotateCw size={14} />
                  Rotate 90°
                </button>
              </>
            )}

            <div style={styles.navigationControls}>
              <button
                style={prevBtnStyle}
                onClick={handlePrevious}
                disabled={currentIndex === 0 || isProcessing}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                style={nextBtnStyle}
                onClick={handleNext}
                disabled={currentIndex === files.length - 1 || isProcessing}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button
            style={styles.cancelBtn}
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            style={styles.saveBtn}
            onClick={handleSaveAll}
            disabled={isProcessing}
          >
            <Save size={16} />
            {isProcessing ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiImageCropModal;
