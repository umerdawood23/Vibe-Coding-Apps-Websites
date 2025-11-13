import React from 'react';

interface InputSectionProps {
  number: number;
  // FIX: Changed title from string to React.ReactNode to allow icons in the title.
  title: React.ReactNode;
  children: React.ReactNode;
}

export const InputSection: React.FC<InputSectionProps> = ({ number, title, children }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-7 h-7 bg-slate-700 rounded-full text-sm font-bold text-white">
          {number}
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="pl-10">
        {children}
      </div>
    </section>
  );
};