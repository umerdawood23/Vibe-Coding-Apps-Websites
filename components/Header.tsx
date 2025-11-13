import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white">Prompt and Image Generator</h1>
      <p className="mt-2 text-lg text-slate-400">Your AI-powered creative studio</p>
    </header>
  );
};