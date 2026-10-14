import type { Binding } from '../companion/companion.js';

/**
 * Splits an internal address before its last part, at the last `.` or `/`,
 * e.g. `1-A:MUGO/GOINGGIO1.SPCSO1.stVal` into `1-A:MUGO/GOINGGIO1.SPCSO1` and
 * `stVal`.
 * @param intAddr - an internal address.
 * @returns the parts, or undefined if there is nothing to split.
 */
export function splitAddress(
  intAddr: string
): { path: string; last: string } | undefined {
  const cut = Math.max(intAddr.lastIndexOf('.'), intAddr.lastIndexOf('/'));
  if (cut <= 0 || cut === intAddr.length - 1) {
    return undefined;
  }
  return { path: intAddr.slice(0, cut), last: intAddr.slice(cut + 1) };
}

/**
 * Whether an input is for the quality of a value input: its internal address
 * is the same but for the last part, which is `q`.
 * @param quality - the input which may be for the quality.
 * @param value - the input of the value.
 */
export function isQualityInputOf(quality: Element, value: Element): boolean {
  const valueAddress = splitAddress(value.getAttribute('intAddr') ?? '');
  const qualityAddress = splitAddress(quality.getAttribute('intAddr') ?? '');
  return (
    valueAddress !== undefined &&
    qualityAddress !== undefined &&
    valueAddress.path === qualityAddress.path &&
    valueAddress.last !== 'q' &&
    qualityAddress.last === 'q'
  );
}

const lastPart = (daName: string | null): string =>
  daName?.split('.').pop() ?? '';

/**
 * Whether an FCDA is for the quality of the data of another: the same data
 * with the data attribute `q`.
 * @param quality - the FCDA which may be for the quality.
 * @param value - the FCDA of the value.
 */
export function isQualityFcdaOf(quality: Element, value: Element): boolean {
  return (
    ['ldInst', 'prefix', 'lnClass', 'lnInst', 'doName'].every(
      name => (quality.getAttribute(name) ?? '') === (value.getAttribute(name) ?? '')
    ) &&
    lastPart(quality.getAttribute('daName')) === 'q' &&
    lastPart(value.getAttribute('daName')) !== 'q'
  );
}

/**
 * The quality input of a value input. In NR Electric devices the input for the
 * quality follows the input for the value, as the quality follows the value in
 * a data set, e.g. `1-A:MUGO/GOINGGIO1.SPCSO1.stVal` then
 * `1-A:MUGO/GOINGGIO1.SPCSO1.q`.
 * @param binding - the input which was subscribed, or unsubscribed, and its
 * FCDA and control block.
 * @returns the next input bound to the next FCDA, if they are the quality of
 * the input and of the FCDA.
 */
export function valueQualityBindings({
  sink: extRef,
  fcda,
  controlBlock
}: Binding): Binding[] {
  const nextFcda = fcda.nextElementSibling;
  const nextInput = extRef.nextElementSibling;
  if (
    nextFcda === null ||
    nextInput === null ||
    nextFcda.tagName !== 'FCDA' ||
    nextInput.tagName !== 'ExtRef' ||
    !isQualityInputOf(nextInput, extRef) ||
    !isQualityFcdaOf(nextFcda, fcda)
  ) {
    return [];
  }
  return [{ sink: nextInput, fcda: nextFcda, controlBlock }];
}
