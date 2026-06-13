import { useEffect, useState, type JSX, type MouseEvent } from 'react';
import type { AppHostProps } from './registry';

type Op = '+' | '-' | '*' | '/' | null;

interface CalcState {
  readonly current: string;
  readonly previous: string;
  readonly op: Op;
  readonly justEvaluated: boolean;
}

const initial: CalcState = { current: '0', previous: '', op: null, justEvaluated: false };

const formatNumber = (n: number): string => {
  if (!isFinite(n)) return 'Error';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
    return n.toExponential(6);
  }
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
};

const apply = (a: number, b: number, op: Op): number => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
    case null:
      return b;
  }
};

export const CalculatorApp = (_props: AppHostProps): JSX.Element => {
  const [state, setState] = useState<CalcState>(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const key = e.key;
      if (/[0-9]/.test(key)) pressDigit(key);
      else if (key === '.') pressDot();
      else if (key === '+') pressOp('+');
      else if (key === '-') pressOp('-');
      else if (key === '*') pressOp('*');
      else if (key === '/') pressOp('/');
      else if (key === 'Enter' || key === '=') equals();
      else if (key === 'Backspace') backspace();
      else if (key === 'Escape') clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pressDigit = (d: string): void => {
    setState((s) => {
      if (s.justEvaluated) return { current: d, previous: '', op: null, justEvaluated: false };
      if (s.current === '0') return { ...s, current: d };
      if (s.current.length >= 16) return s;
      return { ...s, current: s.current + d };
    });
  };

  const pressDot = (): void => {
    setState((s) => {
      if (s.justEvaluated) return { current: '0.', previous: '', op: null, justEvaluated: false };
      if (s.current.includes('.')) return s;
      return { ...s, current: s.current + '.' };
    });
  };

  const clearAll = (): void => setState(initial);

  const backspace = (): void => {
    setState((s) => {
      if (s.justEvaluated) return initial;
      if (s.current.length <= 1 || (s.current.length === 2 && s.current.startsWith('-'))) {
        return { ...s, current: '0' };
      }
      return { ...s, current: s.current.slice(0, -1) };
    });
  };

  const negate = (): void => {
    setState((s) => {
      if (s.current === '0') return s;
      const cur = s.current.startsWith('-') ? s.current.slice(1) : `-${s.current}`;
      return { ...s, current: cur };
    });
  };

  const percent = (): void => {
    setState((s) => {
      const n = Number(s.current);
      if (!isFinite(n)) return s;
      return { ...s, current: formatNumber(n / 100) };
    });
  };

  const pressOp = (op: Op): void => {
    setState((s) => {
      if (s.op && s.previous !== '' && !s.justEvaluated) {
        const a = Number(s.previous);
        const b = Number(s.current);
        const r = apply(a, b, s.op);
        return { current: formatNumber(r), previous: formatNumber(r), op, justEvaluated: false };
      }
      return { current: s.current, previous: s.current, op, justEvaluated: false };
    });
  };

  const equals = (): void => {
    setState((s) => {
      if (s.op === null) return s;
      const a = Number(s.previous);
      const b = Number(s.current);
      const r = apply(a, b, s.op);
      return { current: formatNumber(r), previous: '', op: null, justEvaluated: true };
    });
  };

  const btn = (
    label: string,
    kind: 'num' | 'op' | 'eq' | 'clear' | 'fn',
    action: () => void,
    key: string,
  ): JSX.Element => (
    <button
      type="button"
      className={kind}
      onClick={(_e: MouseEvent<HTMLButtonElement>) => action()}
      data-key={key}
    >
      {label}
    </button>
  );

  const symbol = (op: Op): string => {
    switch (op) {
      case '+':
        return '+';
      case '-':
        return '-';
      case '*':
        return '×';
      case '/':
        return '÷';
      case null:
        return '';
    }
  };

  const history = state.op !== null && state.previous !== '' ? `${state.previous} ${symbol(state.op)} ${state.current}` : '';

  return (
    <div className="calculator">
      <div className="display" role="status" aria-label="Calculator display">
        <div className="history">{history || '\u00A0'}</div>
        <div>{state.current}</div>
      </div>
      <div className="keys">
        {btn('AC', 'clear', clearAll, 'Escape')}
        {btn('?', 'fn', backspace, 'Backspace')}
        {btn('%', 'fn', percent, '%')}
        {btn('÷', 'op', () => pressOp('/'), '/')}
        {btn('7', 'num', () => pressDigit('7'), '7')}
        {btn('8', 'num', () => pressDigit('8'), '8')}
        {btn('9', 'num', () => pressDigit('9'), '9')}
        {btn('×', 'op', () => pressOp('*'), '*')}
        {btn('4', 'num', () => pressDigit('4'), '4')}
        {btn('5', 'num', () => pressDigit('5'), '5')}
        {btn('6', 'num', () => pressDigit('6'), '6')}
        {btn('-', 'op', () => pressOp('-'), '-')}
        {btn('1', 'num', () => pressDigit('1'), '1')}
        {btn('2', 'num', () => pressDigit('2'), '2')}
        {btn('3', 'num', () => pressDigit('3'), '3')}
        {btn('+', 'op', () => pressOp('+'), '+')}
        {btn('±', 'fn', negate, '~')}
        {btn('0', 'num', () => pressDigit('0'), '0')}
        {btn('.', 'num', pressDot, '.')}
        {btn('=', 'eq', equals, 'Enter')}
      </div>
    </div>
  );
};
