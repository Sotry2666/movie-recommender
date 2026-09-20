import { useState } from 'react';
import './App.css';

const API_URL = 'https://movie-recommender-api-5qmo.onrender.com';

function App() {
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New state for the rating form
  const [rateUserId, setRateUserId] = useState('');
  const [rateMovieId, setRateMovieId] = useState('');
  const [rateValue, setRateValue] = useState('');
  const [rateStatus, setRateStatus] = useState('');

  const fetchRecommendations = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/recommend/${userId}`);
      if (!response.ok) throw new Error('User not found or server error');
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    }
    setLoading(false);
  };

  const submitRating = async () => {
    if (!rateUserId || !rateMovieId || !rateValue) {
      setRateStatus('Please fill in all fields');
      return;
    }
    setRateStatus('Submitting...');
    try {
      const response = await fetch(`${API_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(rateUserId),
          movie_id: parseInt(rateMovieId),
          rating: parseFloat(rateValue),
        }),
      });
      if (!response.ok) throw new Error('Failed to submit rating');
      setRateStatus('Rating submitted! Try refreshing recommendations.');
      setRateUserId('');
      setRateMovieId('');
      setRateValue('');
    } catch (err) {
      setRateStatus(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>🎬 Movie Recommender</h1>

      {/* Existing recommendations section */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Enter user ID (1-610)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={fetchRecommendations} style={{ padding: '8px 16px' }}>
          Get Recommendations
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {recommendations.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '40px' }}>
          {recommendations.map((movie, idx) => (
            <li key={idx} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>{movie.title}</strong> — predicted rating: {movie.predicted_rating} ⭐
            </li>
          ))}
        </ul>
      )}

      {/* New: rate a movie section */}
      <div style={{ borderTop: '2px solid #333', paddingTop: '20px' }}>
        <h2>Rate a Movie</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="User ID"
            value={rateUserId}
            onChange={(e) => setRateUserId(e.target.value)}
            style={{ padding: '8px', width: '100px' }}
          />
          <input
            type="number"
            placeholder="Movie ID"
            value={rateMovieId}
            onChange={(e) => setRateMovieId(e.target.value)}
            style={{ padding: '8px', width: '100px' }}
          />
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="5"
            placeholder="Rating (0.5-5)"
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
            style={{ padding: '8px', width: '130px' }}
          />
          <button onClick={submitRating} style={{ padding: '8px 16px' }}>
            Submit
          </button>
        </div>
        {rateStatus && <p>{rateStatus}</p>}
      </div>
    </div>
  );
}

export default App;