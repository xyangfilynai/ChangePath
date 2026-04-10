import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSaveAssessment } from '../src/api/hooks';
import { api } from '../src/api/client';

describe('useSaveAssessment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invalidates case history after a successful save', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      caseId: 'case-1',
      answersJson: { A2: 'Yes' },
      derivedStateJson: null,
      engineOutputJson: null,
      completenessStatusJson: null,
      updatedAt: '2026-04-10T20:30:00.000Z',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSaveAssessment('case-1'), { wrapper });

    act(() => {
      result.current.mutate({
        delta: { A2: 'Yes' },
      });
    });

    await waitFor(() => expect(putSpy).toHaveBeenCalled());
    await waitFor(() =>
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['assessment', 'case-1'],
        expect.objectContaining({
          caseId: 'case-1',
          answersJson: { A2: 'Yes' },
        }),
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cases', 'case-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['case-history', 'case-1'] });

    queryClient.clear();
  });
});
