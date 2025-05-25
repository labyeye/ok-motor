
import { connectToDatabase } from '../../../lib/mongodb';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { db } = await connectToDatabase();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const buyLetter = await db.collection('buyLetters').findOne({
        _id: new ObjectId(id),
        createdBy: session.user.id
      });

      if (!buyLetter) {
        return res.status(404).json({ message: 'Buy letter not found' });
      }

      res.status(200).json(buyLetter);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching buy letter' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}