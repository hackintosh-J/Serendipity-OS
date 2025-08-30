
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// FIX: Wrap Input component with React.forwardRef to allow passing a ref to the underlying input element.
// This is necessary for the parent component (CreateAssetPrompt) to focus the input on mount.
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const baseClasses = "w-full px-3 py-2 bg-white/80 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors";
  
  return (
    <input
      ref={ref}
      {...props}
      className={`${baseClasses} ${props.className || ''}`}
    />
  );
});

Input.displayName = 'Input';

export default Input;