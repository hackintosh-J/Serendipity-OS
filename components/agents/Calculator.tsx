
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
      className={`text-2xl font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${className}`}
    >
      {value}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col p-4 bg-gray-800 text-white rounded-lg -m-4">
      <div className="flex-grow bg-gray-900/50 rounded-lg mb-4 p-4 text-right text-5xl font-mono break-all flex items-end justify-end">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <CalcButton value="C" onClick={handleClear} className="bg-orange-500 hover:bg-orange-600 col-span-2" />
        <CalcButton value="." onClick={handleDecimal} className="bg-gray-600 hover:bg-gray-700" />
        <CalcButton value="/" onClick={() => handleOperator('/')} className="bg-purple-600 hover:bg-purple-700" />

        <CalcButton value="7" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="8" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="9" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="*" onClick={() => handleOperator('*')} className="bg-purple-600 hover:bg-purple-700" />

        <CalcButton value="4" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="5" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="6" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="-" onClick={() => handleOperator('-')} className="bg-purple-600 hover:bg-purple-700" />

        <CalcButton value="1" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="2" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="3" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600" />
        <CalcButton value="+" onClick={() => handleOperator('+')} className="bg-purple-600 hover:bg-purple-700" />
        
        <CalcButton value="0" onClick={handleInput} className="bg-gray-700 hover:bg-gray-600 col-span-2" />
        <CalcButton value="=" onClick={handleEquals} className="bg-purple-600 hover:bg-purple-700 col-span-2" />
      </div>
    </div>
  );
};

export default CalculatorAgent;
