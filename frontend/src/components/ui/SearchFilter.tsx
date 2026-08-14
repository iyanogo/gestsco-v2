import React from 'react';
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: FilterOption[];
  placeholder?: string;
}

export interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset
}) => {
  return (
    <div className="search-filter mb-4">
      <Row className="g-3 align-items-end">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text className="bg-white">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
        </Col>

        {filters.map(filter => (
          <Col md={filter.type === 'select' ? 2 : 3} key={filter.key}>
            {filter.type === 'select' && filter.options && (
              <Form.Select
                value={filterValues[filter.key] || ''}
                onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
              >
                <option value="">{filter.label}</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            )}
            {filter.type === 'text' && (
              <Form.Control
                type="text"
                placeholder={filter.placeholder || filter.label}
                value={filterValues[filter.key] || ''}
                onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
              />
            )}
            {filter.type === 'date' && (
              <Form.Control
                type="date"
                value={filterValues[filter.key] || ''}
                onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
              />
            )}
          </Col>
        ))}

        {onReset && (
          <Col xs="auto">
            <Button variant="outline-secondary" onClick={onReset}>
              <i className="bi bi-x-lg me-1"></i>
              Réinitialiser
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SearchFilter;
