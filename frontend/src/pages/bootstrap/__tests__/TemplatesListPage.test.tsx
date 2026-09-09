import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TemplatesListPage from '../documents/TemplatesListPage';

jest.mock('../../../services/api');
jest.mock('../../../services/templateService', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn().mockResolvedValue([]),
    getVariables: jest.fn().mockResolvedValue([]),
    initialiser: jest.fn().mockResolvedValue({ templates_crees: 0 }),
    exportPDF: jest.fn(),
  },
}));

describe('TemplatesListPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <TemplatesListPage />
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', { name: /templates de documents/i })).toBeInTheDocument();
  });
});
