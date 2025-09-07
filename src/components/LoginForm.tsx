import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 bg-white rounded shadow-md w-80 mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4 text-center">HMS</h1>
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
    </form>
  );
};

export default LoginForm;
