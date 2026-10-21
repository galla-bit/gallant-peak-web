// @vitest-environment jsdom
import {afterEach, describe, expect, it} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import App from './App';

afterEach(cleanup);

function renderEstimator() {
  render(<MemoryRouter initialEntries={['/custom']}><App/></MemoryRouter>);
}

describe('Custom estimator', () => {
  it('prices the default hoodie with a large print at $95', () => {
    renderEstimator();
    expect(screen.getByText('$95')).toBeTruthy();
  });

  it('updates garment, print and quantity using the production price table', () => {
    renderEstimator();
    fireEvent.change(screen.getByLabelText('GARMENT'), {target: {value: 'T-shirt'}});
    fireEvent.change(screen.getByLabelText('PRINT'), {target: {value: 'Small — up to 10×10 cm'}});
    fireEvent.change(screen.getByLabelText('QUANTITY'), {target: {value: '3'}});
    expect(screen.getByText('$180')).toBeTruthy();
  });

  it.each(['', '0', '-1', '1.5', '1e308'])('withholds the estimate for invalid quantity %j', (quantity) => {
    renderEstimator();
    fireEvent.change(screen.getByLabelText('QUANTITY'), {target: {value: quantity}});
    expect(screen.getByRole('alert').textContent).toBe('Enter a whole-number quantity of at least 1 within the supported range.');
    expect(screen.queryByText(/^\$/)).toBeNull();
  });

  it('recalculates after correcting an invalid quantity', () => {
    renderEstimator();
    const input = screen.getByLabelText('QUANTITY');
    fireEvent.change(input, {target: {value: ''}});
    expect((input as HTMLInputElement).value).toBe('');
    fireEvent.change(input, {target: {value: '2'}});
    expect(screen.getByText('$190')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces the changing total through a polite atomic status region', () => {
    renderEstimator();
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.textContent).toContain('$95');
    fireEvent.change(screen.getByLabelText('QUANTITY'), {target: {value: '2'}});
    expect(status.textContent).toContain('$190');
  });
});
