import { render, screen } from '@testing-library/react';
import App from './App';

test('renders command center heading', () => {
  render(<App />);
  const heading = screen.getByText(/RTT Security Analysis Command Center/i);
  expect(heading).toBeInTheDocument();
});
