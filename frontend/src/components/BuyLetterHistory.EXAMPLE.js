// Example: Updating BuyLetterHistory.js to use offline capabilities
// This is a template showing how to migrate existing components

import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import pdfService from '../services/pdfService';
import networkService from '../services/networkService';

const BuyLetterHistory = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    fetchLetters();

    // Subscribe to network status
    const unsubscribe = networkService.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        // Optionally refresh data when back online
        fetchLetters();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchLetters = async () => {
    setLoading(true);
    setError(null);

    try {
      // This automatically uses offline storage if offline!
      const response = await apiService.get('/api/buy-letters');
      
      if (response.success) {
        setLetters(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
      setError('Failed to load buy letters');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (letter) => {
    try {
      // Works offline! Will use local generation if needed
      const result = await pdfService.generateBuyLetterPDF(letter);
      
      if (result.success) {
        // Download the PDF
        const filename = `buy-letter-${letter.registrationNumber}-${Date.now()}.pdf`;
        pdfService.downloadPDF(result.blob, filename);
        
        // Show success message
        alert(isOnline 
          ? 'PDF generated and downloaded!' 
          : 'PDF generated offline and saved to your device!'
        );
      } else {
        throw new Error(result.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  const handleCreateLetter = async (letterData) => {
    try {
      // This will save offline if no connection!
      const response = await apiService.post('/api/buy-letters', letterData);
      
      if (response.success) {
        setLetters([response.data, ...letters]);
        
        // Show appropriate message
        alert(isOnline 
          ? 'Buy letter created successfully!' 
          : 'Buy letter saved offline. Will sync when online.'
        );
      }
    } catch (error) {
      console.error('Error creating letter:', error);
      alert('Failed to create buy letter');
    }
  };

  const handleUpdateLetter = async (id, updates) => {
    try {
      const response = await apiService.put(`/api/buy-letters/${id}`, updates);
      
      if (response.success) {
        setLetters(letters.map(letter => 
          letter._id === id ? response.data : letter
        ));
        
        alert(isOnline 
          ? 'Buy letter updated!' 
          : 'Buy letter updated offline. Will sync when online.'
        );
      }
    } catch (error) {
      console.error('Error updating letter:', error);
      alert('Failed to update buy letter');
    }
  };

  const handleDeleteLetter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this letter?')) {
      return;
    }

    try {
      await apiService.delete(`/api/buy-letters/${id}`);
      setLetters(letters.filter(letter => letter._id !== id));
      
      alert(isOnline 
        ? 'Buy letter deleted!' 
        : 'Buy letter deleted offline. Will sync when online.'
      );
    } catch (error) {
      console.error('Error deleting letter:', error);
      alert('Failed to delete buy letter');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading buy letters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchLetters}>Retry</button>
      </div>
    );
  }

  return (
    <div className="buy-letter-history">
      <div className="header">
        <h2>Buy Letter History</h2>
        {!isOnline && (
          <div className="offline-notice">
            📡 Working Offline - Changes will sync when online
          </div>
        )}
      </div>

      {letters.length === 0 ? (
        <p className="no-data">No buy letters found</p>
      ) : (
        <div className="letters-grid">
          {letters.map((letter) => (
            <div key={letter._id} className="letter-card">
              {/* Display letter information */}
              <div className="letter-info">
                <h3>{letter.vehicleName} {letter.vehicleModel}</h3>
                <p>Registration: {letter.registrationNumber}</p>
                <p>Seller: {letter.sellerName}</p>
                <p>Amount: ₹{letter.saleAmount}</p>
                
                {/* Show sync status if offline */}
                {letter.synced === false && (
                  <span className="sync-badge">📥 Not synced</span>
                )}
              </div>

              <div className="letter-actions">
                <button onClick={() => handleGeneratePDF(letter)}>
                  📄 Generate PDF
                </button>
                <button onClick={() => handleUpdateLetter(letter._id, { /* updates */ })}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDeleteLetter(letter._id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyLetterHistory;

/* 
MIGRATION STEPS FOR YOUR EXISTING COMPONENTS:

1. Replace axios imports:
   BEFORE: import axios from 'axios';
   AFTER:  import apiService from '../services/apiService';

2. Replace axios calls:
   BEFORE: await axios.get('/api/buy-letters')
   AFTER:  await apiService.get('/api/buy-letters')

3. Replace PDF generation:
   BEFORE: await axios.post('/api/buy-letters/generate-pdf', data, { responseType: 'arraybuffer' })
   AFTER:  await pdfService.generateBuyLetterPDF(data)

4. Add network status awareness:
   import networkService from '../services/networkService';
   const [isOnline, setIsOnline] = useState(true);
   
   useEffect(() => {
     const unsubscribe = networkService.subscribe(setIsOnline);
     return () => unsubscribe();
   }, []);

5. Show offline indicators in UI:
   {!isOnline && <div>Working Offline</div>}

6. That's it! The app now works offline automatically.
*/
