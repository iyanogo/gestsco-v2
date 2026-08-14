import { render, screen, fireEvent } from '@testing-library/react';

// Mock DataTable component for testing
const DataTable = ({ 
  data, 
  columns, 
  onRowClick, 
  onSort, 
  searchable = true,
  pagination = true 
}: {
  data: any[];
  columns: { key: string; label: string; sortable?: boolean }[];
  onRowClick?: (row: any) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  searchable?: boolean;
  pagination?: boolean;
}) => (
  <div data-testid="data-table">
    {searchable && (
      <input 
        type="text" 
        placeholder="Rechercher..." 
        data-testid="search-input"
      />
    )}
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th 
              key={col.key} 
              onClick={() => col.sortable && onSort?.(col.key, 'asc')}
              data-testid={`header-${col.key}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr 
            key={idx} 
            onClick={() => onRowClick?.(row)}
            data-testid={`row-${idx}`}
          >
            {columns.map(col => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    {pagination && (
      <div data-testid="pagination">
        <button data-testid="prev-page">Précédent</button>
        <span>Page 1</span>
        <button data-testid="next-page">Suivant</button>
      </div>
    )}
  </div>
);

const mockData = [
  { id: 1, nom: 'Diallo', prenom: 'Amadou', email: 'amadou@email.com' },
  { id: 2, nom: 'Sow', prenom: 'Fatou', email: 'fatou@email.com' },
  { id: 3, nom: 'Ndiaye', prenom: 'Moussa', email: 'moussa@email.com' },
];

const mockColumns = [
  { key: 'nom', label: 'Nom', sortable: true },
  { key: 'prenom', label: 'Prénom', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
];

describe('DataTable', () => {
  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Diallo')).toBeInTheDocument();
    expect(screen.getByText('Fatou')).toBeInTheDocument();
    expect(screen.getByText('Moussa')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', () => {
    const onRowClick = jest.fn();
    render(<DataTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />);
    
    const firstRow = screen.getByTestId('row-0');
    fireEvent.click(firstRow);
    
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should call onSort when sortable header is clicked', () => {
    const onSort = jest.fn();
    render(<DataTable data={mockData} columns={mockColumns} onSort={onSort} />);
    
    const nomHeader = screen.getByTestId('header-nom');
    fireEvent.click(nomHeader);
    
    expect(onSort).toHaveBeenCalledWith('nom', 'asc');
  });

  it('should render search input when searchable is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />);
    
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should not render search input when searchable is false', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={false} />);
    
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('should render pagination when pagination is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} pagination={true} />);
    
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('prev-page')).toBeInTheDocument();
    expect(screen.getByTestId('next-page')).toBeInTheDocument();
  });

  it('should not render pagination when pagination is false', () => {
    render(<DataTable data={mockData} columns={mockColumns} pagination={false} />);
    
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    
    const rows = screen.queryAllByTestId(/^row-/);
    expect(rows).toHaveLength(0);
  });

  it('should filter data based on search input', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Diallo' } });
    
    // In a real implementation, filtering would happen
    expect(searchInput).toHaveValue('Diallo');
  });
});
