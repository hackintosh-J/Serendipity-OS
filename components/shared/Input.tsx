import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// FIX: Wrap Input component with React.forwardRef to allow passing a ref to the underlying input element.
// This is necessary for the parent component (CreateAssetPrompt) to focus the input on mount.
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const baseClasses = "w-full px-3 py-2 bg-input/80 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";
  
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