import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AddressForm } from './AddressForm.jsx';

describe('AddressForm', () => {
  it('submits valid address data', async () => {
    const handleSubmit = vi.fn();
    render(<AddressForm onSubmit={handleSubmit} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Recipient Name/i), 'Alice Walker');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByLabelText(/PIN Code/i), '110001');
    await user.type(screen.getByLabelText(/Address Line 1/i), '123 Peace Ave');
    await user.type(screen.getByLabelText(/City/i), 'New Delhi');
    await user.type(screen.getByLabelText(/State/i), 'Delhi');

    await user.click(screen.getByRole('button', { name: /Save Address/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.recipientName).toBe('Alice Walker');
    expect(submitted.phone).toBe('9876543210');
    expect(submitted.postalCode).toBe('110001');
    expect(submitted.city).toBe('New Delhi');
    expect(submitted.state).toBe('Delhi');
  });

  it('rejects invalid PIN code (e.g. starts with 0 or wrong length)', async () => {
    const handleSubmit = vi.fn();
    render(<AddressForm onSubmit={handleSubmit} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Recipient Name/i), 'Alice Walker');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByLabelText(/PIN Code/i), '012345'); // invalid: starts with 0
    await user.type(screen.getByLabelText(/Address Line 1/i), '123 Peace Ave');
    await user.type(screen.getByLabelText(/City/i), 'New Delhi');
    await user.type(screen.getByLabelText(/State/i), 'Delhi');

    await user.click(screen.getByRole('button', { name: /Save Address/i }));

    await waitFor(() => {
      expect(screen.getByText(/Postal code must be a valid 6-digit Indian PIN code/i)).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('rejects invalid phone number (not 10 digits)', async () => {
    const handleSubmit = vi.fn();
    render(<AddressForm onSubmit={handleSubmit} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Recipient Name/i), 'Alice Walker');
    await user.type(screen.getByLabelText(/Phone Number/i), '98765'); // only 5 digits
    await user.type(screen.getByLabelText(/PIN Code/i), '110001');
    await user.type(screen.getByLabelText(/Address Line 1/i), '123 Peace Ave');
    await user.type(screen.getByLabelText(/City/i), 'New Delhi');
    await user.type(screen.getByLabelText(/State/i), 'Delhi');

    await user.click(screen.getByRole('button', { name: /Save Address/i }));

    await waitFor(() => {
      expect(screen.getByText(/Phone number must be exactly 10 digits/i)).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
