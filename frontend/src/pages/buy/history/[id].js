// pages/buy/history/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BuyLetterPDF from '../../../components/BuyLetterPDF';

export default function BuyLetterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [letterData, setLetterData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchLetter = async () => {
        try {
          const response = await fetch(`http://localhost:2500/api/buy-letter/${id}`);
          if (response.ok) {
            const data = await response.json();
            setLetterData(data);
          }
        } catch (error) {
          console.error('Error fetching letter:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchLetter();
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!letterData) return <div>Letter not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <BuyLetterPDF data={letterData} />
    </div>
  );
}