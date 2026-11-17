import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button, Input, Select, Card, CardTitle, Badge, EmptyState, ErrorState, Pagination, Modal } from './index.js';

describe('UI Primitives', () => {
  it('renders Button with variants and handles clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Input with label, error, and accessibility attributes', () => {
    render(<Input label="Full Name" error="Name is required" placeholder="John" />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });

  it('renders Select with options', () => {
    render(
      <Select label="Country" options={[{ value: 'IN', label: 'India' }]} />
    );
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('IN');
  });

  it('renders Badge and Card', () => {
    render(
      <Card>
        <CardTitle>Book Details</CardTitle>
        <Badge variant="success">In Stock</Badge>
      </Card>
    );
    expect(screen.getByText('Book Details')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders EmptyState and ErrorState', () => {
    render(<EmptyState title="No books found" description="Try another search." />);
    expect(screen.getByText('No books found')).toBeInTheDocument();

    const handleRetry = vi.fn();
    render(<ErrorState title="Failed to load" onRetry={handleRetry} />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Pagination and handles page changes', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('renders Modal when isOpen is true and calls onClose on escape', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Edit Address">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Address')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
