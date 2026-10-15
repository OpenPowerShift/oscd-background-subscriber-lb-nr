import type { PlannedBindings, ResolvedChange } from '../companion/companion.js';
import { valueQualityBindings } from './value-quality.js';

export const nrIdentity = 'openpowershift.oscd-background-subscriber-lb-nr';


/** Whether an IED is from NR Electric, whose manufacturer name is `NRR`. */
export function isNrIed(ied: Element): boolean {
  return ied.getAttribute('manufacturer') === 'NRR';
}

/**
 * What else to subscribe or unsubscribe for NR Electric devices: the quality
 * of a value.
 * @param change - what the Subscriber Later Binding plugin did.
 */
export function planNr(change: ResolvedChange): PlannedBindings {
  const bindings = valueQualityBindings({
    sink: change.extRef,
    fcda: change.fcda,
    controlBlock: change.controlBlock
  });
  return change.action === 'subscribe'
    ? { subscribe: bindings, unsubscribe: [] }
    : { subscribe: [], unsubscribe: bindings };
}
