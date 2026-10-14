import { expect } from '@open-wc/testing';

import { loadFixture } from '../testing/fixtures.js';
import { fixtureName, nrInput, outputFcda, outputsGoose } from '../testing/nr.js';
import { isNrIed, planNr } from './nr.js';

describe('NR Electric', () => {
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = await loadFixture(fixtureName);
  });

  const change = (action: 'subscribe' | 'unsubscribe') => ({
    version: 1,
    action,
    extRef: nrInput(doc, 'SPCSO5'),
    fcda: outputFcda(doc, 'Ind64'),
    controlBlock: outputsGoose(doc),
    settings: { ignoreSupervision: false, checkOnlyPreferredBasicType: false },
    enabledCompanions: [],
    apply: () => undefined
  });

  it('recognises IEDs of the manufacturer "NRR" only', () => {
    const ied = doc.createElementNS(doc.documentElement.namespaceURI, 'IED');
    ['NR', 'NR Electric', 'nrr', 'SEL'].forEach((manufacturer) => {
      ied.setAttribute('manufacturer', manufacturer);
      expect(isNrIed(ied), manufacturer).to.equal(false);
    });
    ied.setAttribute('manufacturer', 'NRR');
    expect(isNrIed(ied)).to.equal(true);
  });

  it('subscribes the quality input with a value', () => {
    const planned = planNr(change('subscribe'));
    expect(planned.subscribe.map(({ sink }) => sink)).to.deep.equal([
      nrInput(doc, 'SPCSO5', 'q')
    ]);
    expect(planned.unsubscribe).to.deep.equal([]);
  });

  it('unsubscribes the quality input with a value', () => {
    const planned = planNr(change('unsubscribe'));
    expect(planned.subscribe).to.deep.equal([]);
    expect(planned.unsubscribe.map(({ sink }) => sink)).to.deep.equal([
      nrInput(doc, 'SPCSO5', 'q')
    ]);
  });
});
