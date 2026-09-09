import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InscriptionsMatieresPage from '../etudiants/InscriptionsMatieresPage';

jest.mock('../../../services/api');

describe('InscriptionsMatieresPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <InscriptionsMatieresPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText(/inscriptions aux matières/i)).toBeInTheDocument();
  });
});
