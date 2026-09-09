import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UtilisateursListPage from '../utilisateurs/UtilisateursListPage';

jest.mock('../../../services/api');

describe('UtilisateursListPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <UtilisateursListPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText(/^utilisateurs$/i)).toBeInTheDocument();
  });
});
