import { useState } from 'react';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://movie-recommender-api-5qmo.onrender.com/recommend/${userId}`);
      if (!response.ok) throw new Error('User not found or server error');
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>🎬 Movie Recommender</h1>
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
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {recommendations.map((movie, idx) => (
            <li key={idx} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <strong>{movie.title}</strong> — predicted rating: {movie.predicted_rating} ⭐
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;