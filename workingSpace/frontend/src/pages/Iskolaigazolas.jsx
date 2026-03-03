import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';

export default function Iskolaigazolas() {
  const { isAdmin } = useAuth();
  const [feedback, setFeedback] = useState(null);

  const handleAddIgazolas = () => {
    // TODO: Igazolás hozzáadása logika
    setFeedback({ type: 'info', message: 'Igazolás hozzáadása funkció fejlesztés alatt...' });
  };

  if (!isAdmin()) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <p>Hozzáférés megtagadva.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Iskolaigazolás</h1>
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        )}
        <div className="card">
          <div className="page-header">
            <h2>Igazolások kezelése</h2>
            <button className="btn" onClick={handleAddIgazolas}>
              Igazolás hozzáadása
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
