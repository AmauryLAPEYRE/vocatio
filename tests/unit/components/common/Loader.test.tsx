// tests/unit/components/common/Loader.test.tsx
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@/components/common/LoadingState';

describe('Loader Component', () => {
  test('renders without text', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  test('renders with text', () => {
    render(<Loader text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('renders with different sizes', () => {
    const { rerender } = render(<Loader size="small" />);
    expect(screen.getByRole('status')).toHaveClass('w-4');
    
    rerender(<Loader size="medium" />);
    expect(screen.getByRole('status')).toHaveClass('w-8');
    
    rerender(<Loader size="large" />);
    expect(screen.getByRole('status')).toHaveClass('w-12');
  });
});