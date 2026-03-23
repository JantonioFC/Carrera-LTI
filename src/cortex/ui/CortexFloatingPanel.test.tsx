import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { CortexFloatingPanel } from './CortexFloatingPanel';
import { useCortexStore } from './cortexStore';

beforeEach(() => {
  useCortexStore.getState().reset();
  mockOnQuery.mockClear();
});

const mockOnQuery = vi.fn();

describe('CortexFloatingPanel — renderizado', () => {
  it('should_render_query_input', () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should_render_submit_button', () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByRole('button', { name: /buscar|consultar|search/i })).toBeInTheDocument();
  });

  it('should_show_empty_state_when_no_results', () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByTestId('cortex-empty')).toBeInTheDocument();
  });
});

describe('CortexFloatingPanel — interacción', () => {
  it('should_call_onQuery_with_input_value_on_submit', async () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'qué es TCP' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar|consultar|search/i }));
    expect(mockOnQuery).toHaveBeenCalledWith('qué es TCP');
  });

  it('should_not_call_onQuery_with_empty_input', () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    fireEvent.click(screen.getByRole('button', { name: /buscar|consultar|search/i }));
    expect(mockOnQuery).not.toHaveBeenCalled();
  });

  it('should_show_loading_spinner_while_querying', () => {
    useCortexStore.getState().setIsQuerying(true);
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByTestId('cortex-loading')).toBeInTheDocument();
  });

  it('should_render_results_from_store', () => {
    useCortexStore.getState().setQueryResults([
      { chunkId: 'c1', docId: 'doc-1', content: 'El three-way handshake...', score: 0.95 },
      { chunkId: 'c2', docId: 'doc-1', content: 'SYN-ACK es el segundo paso...', score: 0.80 },
    ]);
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByText(/three-way handshake/i)).toBeInTheDocument();
    expect(screen.getByText(/SYN-ACK/i)).toBeInTheDocument();
  });

  it('should_show_error_message_when_query_fails', () => {
    useCortexStore.getState().setQueryError('RuVector no disponible');
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    expect(screen.getByTestId('cortex-error')).toHaveTextContent('RuVector no disponible');
  });

  it('should_submit_on_enter_key', () => {
    render(<CortexFloatingPanel onQuery={mockOnQuery} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'modelo OSI' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnQuery).toHaveBeenCalledWith('modelo OSI');
  });
});
