import React from 'react';
import { AgentComponentProps } from '../../types';

type Operator = '+' | '-' | '*' | '/';

const CalculatorAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
  const { display, firstOperand, operator, waitingForSecondOperand } = instance.state;

  const handleInput = (input: string) => {
    if (waitingForSecondOperand) {
      updateState({ ...instance.state, display: input, waitingForSecondOperand: false });
    } else {
      updateState({ ...instance.state, display: display === '0' ? input : display + input });
    }
  };

  const handleOperator = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (operator && !waitingForSecondOperand) {
      const result = calculate(firstOperand, inputValue, operator);
      updateState({
        ...instance.state,
        display: String(result),
        firstOperand: result,
      });
    } else {
      updateState({ ...instance.state, firstOperand: inputValue });
    }

    updateState({
      ...instance.state,
      waitingForSecondOperand: true,
      operator: nextOperator,
      firstOperand: operator && !waitingForSecondOperand ? calculate(firstOperand, inputValue, operator) : inputValue,
    });
  };

  const calculate = (op1: number, op2: number, op: Operator): number => {
    switch (op) {
      case '+': return op1 + op2;
      case '-': return op1 - op2;
      case '*': return op1 * op2;
      case '/': return op1 / op2;
      default: return op2;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (operator && !waitingForSecondOperand) {
      const result = calculate(firstOperand, inputValue, operator);
      updateState({
        ...instance.state,
        display: String(result),
        firstOperand: result,
        operator: null,
      });
    }
  };

  const handleClear = () => {
    updateState({ display: '0', firstOperand: null, operator: null, waitingForSecondOperand: false });
  };
  
  const handleDecimal = () => {
    if (!display.includes('.')) {
      updateState({ ...instance.state, display: display + '.' });
    }
  }

  const CalcButton: React.FC<{ value: string, onClick: (val: string) => void, className?: string }> = ({ value, onClick, className = '' }) => (
    <button
      onClick={() => onClick(value)}
      className={`text-2xl font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all h-16 ${className}`}
    >
      {value}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col p-4 bg-card text-card-foreground rounded-lg">
      <div className="flex-grow bg-background/50 rounded-lg mb-4 p-4 text-right text-5xl font-mono break-all flex items-end justify-end">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <CalcButton value="C" onClick={handleClear} className="bg-accent text-accent-foreground hover:bg-accent/90 col-span-2" />
        <CalcButton value="." onClick={handleDecimal} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="/" onClick={() => handleOperator('/')} className="bg-primary text-primary-foreground hover:bg-primary/90" />

        <CalcButton value="7" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="8" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="9" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="*" onClick={() => handleOperator('*')} className="bg-primary text-primary-foreground hover:bg-primary/90" />

        <CalcButton value="4" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="5" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="6" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="-" onClick={() => handleOperator('-')} className="bg-primary text-primary-foreground hover:bg-primary/90" />

        <CalcButton value="1" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="2" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="3" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" />
        <CalcButton value="+" onClick={() => handleOperator('+')} className="bg-primary text-primary-foreground hover:bg-primary/90" />
        
        <CalcButton value="0" onClick={handleInput} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 col-span-2" />
        <CalcButton value="=" onClick={handleEquals} className="bg-primary text-primary-foreground hover:bg-primary/90 col-span-2" />
      </div>
    </div>
  );
};

export default CalculatorAgent;