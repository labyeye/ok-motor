
import { connectToDatabase } from '../../../lib/mongodb';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const buyLetter = {
        ...req.body,
        createdBy: session.user.id,
        createdAt: new Date()
      };
      
      const result = await db.collection('buyLetters').insertOne(buyLetter);
      res.status(201).json({ ...buyLetter, _id: result.insertedId });
    } catch (error) {
      res.status(400).json({ message: 'Error creating buy letter' });
    }
  } else if (req.method === 'GET') {
    try {
      const buyLetters = await db.collection('buyLetters')
        .find({ createdBy: session.user.id })
        .sort({ createdAt: -1 })
        .toArray();
      res.status(200).json(buyLetters);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching buy letters' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}