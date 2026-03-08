import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePayloadOverrides } from './usePayloadOverrides';

describe('usePayloadOverrides', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deep merges overrides into payload args', () => {
    localStorage.setItem(
      'luai_payload_overrides',
      JSON.stringify({
        VehicleYear: 2021,
        RiskQuotation: {
          RatingZoneCode: 3,
        },
      })
    );

    const { result } = renderHook(() => usePayloadOverrides());
    const merged = result.current.applyOverrides({
      VehicleYear: 2018,
      VehiclePrice: 50000000,
      RiskQuotation: {
        RatingZoneCode: 4,
        Questions: [{ QuestionId: 1, Response: 0 }],
      },
    });

    expect(merged).toEqual({
      VehicleYear: 2021,
      VehiclePrice: 50000000,
      RiskQuotation: {
        RatingZoneCode: 3,
        Questions: [{ QuestionId: 1, Response: 0 }],
      },
    });
  });

  it('returns original args when there are no stored overrides', () => {
    const { result } = renderHook(() => usePayloadOverrides());
    const args = { VehicleYear: 2019, VehiclePrice: 43000000 };

    const merged = result.current.applyOverrides(args);

    expect(merged).toBe(args);
  });

  it('does not call getItem when storage key does not exist', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const { result } = renderHook(() => usePayloadOverrides());
    const args = { VehicleYear: 2019 };

    expect(result.current.getOverrides()).toBeNull();
    expect(result.current.applyOverrides(args)).toBe(args);
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('adds missing nested keys during deep merge', () => {
    localStorage.setItem(
      'luai_payload_overrides',
      JSON.stringify({
        RiskQuotation: {
          ExtraData: {
            source: 'admin',
          },
        },
      })
    );

    const { result } = renderHook(() => usePayloadOverrides());
    const merged = result.current.applyOverrides({
      RiskQuotation: {
        RatingZoneCode: 4,
      },
    });

    expect(merged).toEqual({
      RiskQuotation: {
        RatingZoneCode: 4,
        ExtraData: {
          source: 'admin',
        },
      },
    });
  });

  it('returns original args when stored overrides are invalid JSON', () => {
    localStorage.setItem('luai_payload_overrides', '{bad-json');
    const { result } = renderHook(() => usePayloadOverrides());

    const args = { VehicleYear: 2020 };
    const merged = result.current.applyOverrides(args);

    expect(merged).toBe(args);
  });

  it('loads parsed overrides from localStorage', () => {
    localStorage.setItem(
      'luai_payload_overrides',
      JSON.stringify({ VehicleUseCode: 2 })
    );

    const { result } = renderHook(() => usePayloadOverrides());
    expect(result.current.getOverrides()).toEqual({ VehicleUseCode: 2 });
  });

  it('ignores parsed JSON values that are not objects', () => {
    localStorage.setItem('luai_payload_overrides', '[]');
    const { result } = renderHook(() => usePayloadOverrides());
    const args = { VehicleYear: 2020 };

    const merged = result.current.applyOverrides(args);
    expect(merged).toBe(args);
    expect(result.current.getOverrides()).toBeNull();
  });

  it('returns null when stored overrides cannot be parsed by getOverrides', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('luai_payload_overrides', '{bad-json');

    const { result } = renderHook(() => usePayloadOverrides());

    expect(result.current.getOverrides()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('reads legacy payload override storage key when new key is missing', () => {
    localStorage.setItem(
      'legacy_payload_overrides',
      JSON.stringify({ VehicleUseCode: 7 })
    );

    const { result } = renderHook(() => usePayloadOverrides());
    expect(result.current.getOverrides()).toEqual({ VehicleUseCode: 7 });
    expect(localStorage.getItem('luai_payload_overrides')).toBe(
      JSON.stringify({ VehicleUseCode: 7 })
    );
    expect(localStorage.getItem('legacy_payload_overrides')).toBeNull();
  });

  it('saves overrides using the canonical storage key', () => {
    const { result } = renderHook(() => usePayloadOverrides());

    result.current.saveOverrides({
      VehicleUseCode: 3,
      RiskQuotation: {
        channel: 'admin',
      },
    });

    expect(localStorage.getItem('luai_payload_overrides')).toBe(
      JSON.stringify({
        VehicleUseCode: 3,
        RiskQuotation: {
          channel: 'admin',
        },
      })
    );
  });

  it('clears canonical and legacy override keys', () => {
    localStorage.setItem('luai_payload_overrides', JSON.stringify({ VehicleUseCode: 3 }));
    localStorage.setItem('legacy_payload_overrides', JSON.stringify({ VehicleUseCode: 7 }));
    const { result } = renderHook(() => usePayloadOverrides());

    result.current.clearOverrides();

    expect(localStorage.getItem('luai_payload_overrides')).toBeNull();
    expect(localStorage.getItem('legacy_payload_overrides')).toBeNull();
  });

  it('returns null when localStorage access throws', () => {
    const windowSpy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => usePayloadOverrides());

    expect(result.current.getOverrides()).toBeNull();
    expect(result.current.applyOverrides({ VehicleYear: 2020 })).toEqual({ VehicleYear: 2020 });

    windowSpy.mockRestore();
  });

  it('skips save and clear operations when localStorage is unavailable', () => {
    const windowSpy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => usePayloadOverrides());

    expect(() =>
      result.current.saveOverrides({
        VehicleYear: 2025,
      })
    ).not.toThrow();
    expect(() => result.current.clearOverrides()).not.toThrow();

    windowSpy.mockRestore();
  });
});
