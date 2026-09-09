import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParametresGenerauxPage from '../parametrage/ParametresGenerauxPage';

jest.mock('../../../services/api');

describe('ParametresGenerauxPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <ParametresGenerauxPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText(/paramètres généraux/i)).toBeInTheDocument();
  });
});
