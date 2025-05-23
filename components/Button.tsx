import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`
        px-5 py-2 rounded-md text-sm font-medium transition-colors duration-200
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${variant === 'primary' 
          ? 'bg-black text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50'
          : 'border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200'}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
