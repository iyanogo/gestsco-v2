import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnneesScolairesPage from '../parametrage/AnneesScolairesPage';

jest.mock('../../../services/api');

describe('AnneesScolairesPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <AnneesScolairesPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText(/années scolaires/i)).toBeInTheDocument();
  });
});
