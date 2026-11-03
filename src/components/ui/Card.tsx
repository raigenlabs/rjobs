import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  id?: string;
  onClick?: () => void;
}> = ({ children, className = '', hoverable = false, id, onClick }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-5 border-b border-slate-800/80 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <h3 className={`text-base font-semibold text-slate-100 ${className}`}>{children}</h3>;
};

export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${className}`}>{children}</p>;
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};
