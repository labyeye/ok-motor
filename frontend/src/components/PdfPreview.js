import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const PdfPreview = ({ pdfUrl }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const pdfDocumentRef = useRef(null); // Ref to store the PDF document instance

  useEffect(() => {
    let isMounted = true;
    const fetchPdf = async () => {
      if (!pdfUrl) {
        // If pdfUrl becomes null/undefined, destroy any existing document
        if (pdfDocumentRef.current) {
          pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        }
        setPages([]);
        setLoading(false);
        return;
      }

      // Destroy previous document if a new one is being loaded
      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }

      try {
        setLoading(true);
        setError(null);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (!isMounted) {
          pdf.destroy(); // Destroy if component unmounted while loading
          return;
        }

        pdfDocumentRef.current = pdf; // Store the PDF document

        const renderedPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for better quality

          // We can't render canvas in useEffect directly easily without refs for each canvas
          // Instead, we'll store page data and render in separate components or handle here
          // For simplicity, let's store the page object and viewport to render
          renderedPages.push({ page, viewport, index: i });
        }

        if (isMounted) {
          setPages(renderedPages);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (isMounted) {
          setError("Failed to load PDF preview.");
          setLoading(false);
        }
        // If an error occurred after loading the document, destroy it
        if (pdfDocumentRef.current) {
          pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        }
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      // Cleanup: Destroy the PDF document when the component unmounts or pdfUrl changes
      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "#64748b",
        }}
      >
        Loading Preview...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "#ef4444",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
        backgroundColor: "#525659",
        minHeight: "100%",
      }}
    >
      {pages.map((pageData) => (
        <PdfPage
          key={pageData.index}
          page={pageData.page}
          viewport={pageData.viewport}
        />
      ))}
    </div>
  );
};

const PdfPage = ({ page, viewport }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && page) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // We might need to handle high DPI displays for crisp text
      // But standard viewport handling is usually okay for preview
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);

      return () => {
        renderTask.cancel();
      };
    }
  }, [page, viewport]);

  return (
    <div
      style={{
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lineHeight: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
};

export default PdfPreview;
