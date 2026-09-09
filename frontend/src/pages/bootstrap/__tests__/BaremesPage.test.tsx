import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BaremesPage from '../parametrage/BaremesPage';

jest.mock('../../../services/api');

describe('BaremesPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <BaremesPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText(/barèmes de notation/i)).toBeInTheDocument();
  });
});
