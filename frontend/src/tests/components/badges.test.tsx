import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import StatusBadge from '../../components/shared/StatusBadge';
import BookBadge from '../../components/shared/BookBadge';
import TypeIcon from '../../components/shared/TypeIcon';
import ConfidenceBadge from '../../components/shared/ConfidenceBadge';
import type { ProphecyStatus, ProphecyType } from '../../types';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

describe('StatusBadge', () => {
  const cases: { status: ProphecyStatus; label: string }[] = [
    { status: 'fulfilled', label: 'Fulfilled' },
    { status: 'partially_fulfilled', label: 'Partial' },
    { status: 'unfulfilled', label: 'Unfulfilled' },
    { status: 'debated', label: 'Debated' },
    { status: 'subverted', label: 'Subverted' },
  ];

  it.each(cases)('renders "$label" for status "$status"', ({ status, label }) => {
    render(<StatusBadge status={status} />, { wrapper: Wrapper });
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// ── BookBadge ────────────────────────────────────────────────────────────────

describe('BookBadge', () => {
  const cases: { book: number; label: string }[] = [
    { book: 1, label: 'AGOT' },
    { book: 2, label: 'ACOK' },
    { book: 3, label: 'ASOS' },
    { book: 4, label: 'AFFC' },
    { book: 5, label: 'ADWD' },
  ];

  it.each(cases)('renders "$label" for book $book', ({ book, label }) => {
    render(<BookBadge book={book} />, { wrapper: Wrapper });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders fallback label for unknown book number', () => {
    render(<BookBadge book={99} />, { wrapper: Wrapper });
    expect(screen.getByText('Book 99')).toBeInTheDocument();
  });
});

// ── TypeIcon ─────────────────────────────────────────────────────────────────

describe('TypeIcon', () => {
  const cases: { type: ProphecyType; icon: string; label: string }[] = [
    { type: 'verbal_prophecy', icon: '\u{1F5E3}\u{FE0F}', label: 'Verbal' },
    { type: 'dream_vision', icon: '\u{1F4AD}', label: 'Dream' },
    { type: 'flame_vision', icon: '\u{1F525}', label: 'Flames' },
    { type: 'song', icon: '\u{1F3B5}', label: 'Song' },
    { type: 'house_words', icon: '\u{1F3F0}', label: 'House Words' },
    { type: 'physical_sign', icon: '\u{2604}\u{FE0F}', label: 'Omen' },
    { type: 'greendream', icon: '\u{1F33F}', label: 'Greendream' },
    { type: 'house_of_undying', icon: '\u{1F3DA}\u{FE0F}', label: 'Undying' },
    { type: 'other', icon: '\u{1F4DC}', label: 'Other' },
  ];

  it.each(cases)(
    'renders icon and label for type "$type"',
    ({ type, icon, label }) => {
      render(<TypeIcon type={type} />, { wrapper: Wrapper });
      expect(screen.getByText(icon)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it('hides the label when showLabel is false', () => {
    render(<TypeIcon type="song" showLabel={false} />, { wrapper: Wrapper });
    expect(screen.getByText('\u{1F3B5}')).toBeInTheDocument();
    expect(screen.queryByText('Song')).not.toBeInTheDocument();
  });
});

// ── ConfidenceBadge ──────────────────────────────────────────────────────────

describe('ConfidenceBadge', () => {
  it('renders high confidence (green)', () => {
    render(<ConfidenceBadge confidence={0.85} />, { wrapper: Wrapper });
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders medium confidence (yellow)', () => {
    render(<ConfidenceBadge confidence={0.5} />, { wrapper: Wrapper });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders low confidence (red)', () => {
    render(<ConfidenceBadge confidence={0.2} />, { wrapper: Wrapper });
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('rounds to nearest integer percent', () => {
    render(<ConfidenceBadge confidence={0.666} />, { wrapper: Wrapper });
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('handles boundary at 0.67 as green', () => {
    render(<ConfidenceBadge confidence={0.67} />, { wrapper: Wrapper });
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('handles boundary at 0.34 as yellow', () => {
    render(<ConfidenceBadge confidence={0.34} />, { wrapper: Wrapper });
    expect(screen.getByText('34%')).toBeInTheDocument();
  });

  it('handles 0 confidence', () => {
    render(<ConfidenceBadge confidence={0} />, { wrapper: Wrapper });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles 1.0 confidence', () => {
    render(<ConfidenceBadge confidence={1} />, { wrapper: Wrapper });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
