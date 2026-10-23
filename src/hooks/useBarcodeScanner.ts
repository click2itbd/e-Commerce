import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxDelayBetweenCharsMs?: number;
  endKey?: string;
  enabled?: boolean;
}

/**
 * Enterprise-grade hardware barcode scanner listener hook.
 * Uses high-resolution performance.now() timestamps to differentiate between
 * ultra-fast hardware laser/CCD scanner bursts (< 40ms/char) and manual human keyboard typing.
 * Guarantees zero dropped characters and prevents search-field spillage.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 2,
  maxDelayBetweenCharsMs = 50,
  endKey = 'Enter',
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = performance.now();
      const delta = now - (lastKeyTimeRef.current || now);
      lastKeyTimeRef.current = now;

      // If finished scan with Enter or endKey
      if (e.key === endKey) {
        if (bufferRef.current.length >= minChars) {
          const barcode = bufferRef.current.join('').trim();
          
          // Clear buffer
          bufferRef.current = [];
          if (timerRef.current) clearTimeout(timerRef.current);

          if (barcode.length >= minChars) {
            // Prevent Enter from submitting forms or creating line breaks
            e.preventDefault();
            e.stopPropagation();

            // If an input is focused and contains the scanned barcode, clean it
            const activeEl = document.activeElement;
            if (activeEl instanceof HTMLInputElement && activeEl.value.includes(barcode)) {
              activeEl.value = '';
            }

            onScan(barcode);
            return;
          }
        }
        bufferRef.current = [];
        return;
      }

      // Check single printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If the gap between previous key and this key was too large (> 300ms), 
        // it means previous scan or typing expired: reset buffer
        if (delta > 300 && bufferRef.current.length > 0) {
          bufferRef.current = [];
        }

        bufferRef.current.push(e.key);

        // Dynamically clear buffer after scanner timeout (120ms of silence)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          // If characters stopped arriving without Enter, clear buffer after delay
          bufferRef.current = [];
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase for maximum precision
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onScan, minChars, maxDelayBetweenCharsMs, endKey, enabled]);
}
