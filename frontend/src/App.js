import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/').then(res => setMessage(res.data.message));
  }, []);

  return (
    <div>
      <h1>Attack Path Simulator</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;