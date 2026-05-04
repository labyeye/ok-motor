import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

const PdfPreview = ({ pdfUrl }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const pdfDocumentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPdf = async () => {
      if (!pdfUrl) {
        if (pdfDocumentRef.current) {
          pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        }
        setPages([]);
        setLoading(false);
        return;
      }

      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }

      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (!isMounted) {
          pdf.destroy();
          return;
        }

        pdfDocumentRef.current = pdf;

        const renderedPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

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

        if (pdfDocumentRef.current) {
          pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        }
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;

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
    if (!canvasRef.current || !page) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);

    renderTask.promise.catch((err) => {
      if (err?.name !== "RenderingCancelledException") {
        console.error("PDF render error:", err);
      }
    });

    return () => {
      renderTask.cancel();
    };
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
