import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import React from 'react'
import SignalDetailPage from '@/app/signals/[name]/page'

expect.extend(toHaveNoViolations as any)

jest.mock('next/navigation', () => ({ useParams: () => ({ name: 'EEG' }) }))

jest.mock('@/lib/api', () => ({
  useSignal: () => ({ data: { name: 'EEG', actions: [{ name: 'random', bit: 1 }] }, isLoading: false, error: null }),
  useUpdateSignalActions: () => ({ mutate: jest.fn() }),
}))

describe('Signal detail page a11y', () => {
  it('has no a11y violations', async () => {
    const { container } = render(<SignalDetailPage />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

