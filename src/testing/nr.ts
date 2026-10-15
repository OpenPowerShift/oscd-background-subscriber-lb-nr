import { mustQuery } from './scl.js';

export const fixtureName = 'SEL_SV_and_GOOSE.scd';

const mergingUnit = 'IED[name="NRR_PCS221S_001"]';
const relay = 'IED[name="SEL_SEL_487E_5S_001"]';

/** An input of the merging unit, e.g. `SPCSO5` and `stVal` or `q`. */
export function nrInput(doc: XMLDocument, dataObject: string, daName = 'stVal'): Element {
  return mustQuery(
    doc,
    `${mergingUnit} ExtRef[intAddr="1-A:MUGO/GOINGGIO1.${dataObject}.${daName}"]`
  );
}

/** The GOOSE control block of the SEL relay with its output signals. */
export function outputsGoose(doc: XMLDocument): Element {
  return mustQuery(doc, `${relay} GSEControl[name="Ctl"]`);
}

/** An output signal of the SEL relay, e.g. `Ind64`, for `stVal` or `q`. */
export function outputFcda(doc: XMLDocument, doName: string, daName = 'stVal'): Element {
  return mustQuery(
    doc,
    `${relay} DataSet[name="Ctl"] FCDA[doName="${doName}"][daName="${daName}"]`
  );
}

export { subscription } from './sel.js';
