import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

const ok = (data: any) => Promise.resolve({ json: () => Promise.resolve(data) } as any);

describe('Login checks Notion each click', () => {
  beforeEach(() => {
    sessionStorage.clear();
    (globalThis as any).fetch = vi.fn();
  });

  it('trims username before sending', async () => {
    (fetch as any).mockResolvedValueOnce(ok({ ok: true, user: { name: 'Cornelius', username: 'cmsm94', role: 'Admin' } }));
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('e.g. cmsm94'), { target: { value: '  cmsm94  ' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '1234' } });
    fireEvent.submit(screen.getByText(/Sign in|Checking with Notion/));
    const call = (fetch as any).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.username).toBe('cmsm94');
  });

  it('shows error when Notion says user not found', async () => {
    (fetch as any).mockResolvedValueOnce(ok({ ok: false, error: 'No such user.' }));
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('e.g. cmsm94'), { target: { value: 'ghost' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '1234' } });
    fireEvent.submit(screen.getByText(/Sign in|Checking with Notion/));
    const msg = await screen.findByText('No such user.');
    expect(msg).toBeInTheDocument();
  });

  it('defaults role to Regular on empty backend role', async () => {
    (fetch as any).mockResolvedValueOnce(ok({ ok: true, user: { name: 'Cornelius', username: 'cmsm94', role: '' } }));
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('e.g. cmsm94'), { target: { value: 'cmsm94' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '1234' } });
    fireEvent.submit(screen.getByText(/Sign in|Checking with Notion/));
    const role = await screen.findByText('Role: Regular');
    expect(role).toBeInTheDocument();
  });

  it('shows error when password is wrong', async () => {
    (fetch as any).mockResolvedValueOnce(ok({ ok: false, error: 'Wrong password.' }));
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('e.g. cmsm94'), { target: { value: 'cmsm94' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'bad' } });
    fireEvent.submit(screen.getByText(/Sign in|Checking with Notion/));
    const msg = await screen.findByText('Wrong password.');
    expect(msg).toBeInTheDocument();
  });
});
