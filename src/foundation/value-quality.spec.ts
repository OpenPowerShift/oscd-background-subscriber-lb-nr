import { expect } from '@open-wc/testing';

import { loadFixture } from '../testing/fixtures.js';
import { fixtureName, nrInput, outputFcda, outputsGoose } from '../testing/nr.js';
import { mustQuery, parseScl } from '../testing/scl.js';
import {
  isQualityFcdaOf,
  isQualityInputOf,
  splitAddress,
  valueQualityBindings
} from './value-quality.js';

const extRef = (intAddr: string): Element =>
  parseScl(`<ExtRef intAddr="${intAddr}"/>`).querySelector('ExtRef')!;

const fcda = (attributes: string): Element =>
  parseScl(`<FCDA ${attributes}/>`).querySelector('FCDA')!;

const data = 'ldInst="LD" prefix="P" lnClass="GGIO" lnInst="1" doName="Ind1"';

describe('value and quality', () => {
  describe('splitAddress', () => {
    it('splits at the last . or /', () => {
      expect(splitAddress('1-A:MUGO/GOINGGIO1.SPCSO1.stVal')).to.deep.equal({
        path: '1-A:MUGO/GOINGGIO1.SPCSO1',
        last: 'stVal'
      });
      expect(splitAddress('RxExtIn1;/Ind/q')).to.deep.equal({
        path: 'RxExtIn1;/Ind',
        last: 'q'
      });
    });

    it('is undefined with nothing to split', () => {
      ['stVal', '.q', 'a.', ''].forEach(intAddr =>
        expect(splitAddress(intAddr), intAddr).to.equal(undefined)
      );
    });
  });

  describe('isQualityInputOf', () => {
    it('is true for the same address ending in q', () => {
      expect(
        isQualityInputOf(extRef('1-A:MUGO/GOINGGIO1.SPCSO1.q'), extRef('1-A:MUGO/GOINGGIO1.SPCSO1.stVal'))
      ).to.equal(true);
    });

    it('is false for another address, another last part or a quality', () => {
      const value = extRef('1-A:MUGO/GOINGGIO1.SPCSO1.stVal');
      expect(isQualityInputOf(extRef('1-A:MUGO/GOINGGIO1.SPCSO2.q'), value)).to.equal(false);
      expect(isQualityInputOf(extRef('1-A:MUGO/GOINGGIO1.SPCSO1.t'), value)).to.equal(false);
      expect(isQualityInputOf(extRef('1-A:MUGO/GOINGGIO1.SPCSO1.subq'), value)).to.equal(false);
      expect(
        isQualityInputOf(extRef('1-A:MUGO/GOINGGIO1.SPCSO1.q'), extRef('1-A:MUGO/GOINGGIO1.SPCSO1.q'))
      ).to.equal(false);
      expect(isQualityInputOf(extRef('q'), extRef('stVal'))).to.equal(false);
    });
  });

  describe('isQualityFcdaOf', () => {
    it('is true for the quality of the same data', () => {
      expect(isQualityFcdaOf(fcda(`${data} daName="q"`), fcda(`${data} daName="stVal"`))).to.equal(true);
      expect(isQualityFcdaOf(fcda(`${data} daName="q"`), fcda(data))).to.equal(true);
    });

    it('is false for other data or another attribute', () => {
      const value = fcda(`${data} daName="stVal"`);
      expect(
        isQualityFcdaOf(fcda(`${data.replace('Ind1', 'Ind2')} daName="q"`), value)
      ).to.equal(false);
      expect(isQualityFcdaOf(fcda(`${data} daName="t"`), value)).to.equal(false);
      expect(isQualityFcdaOf(fcda(`${data} daName="q"`), fcda(`${data} daName="q"`))).to.equal(false);
    });
  });

  describe('valueQualityBindings', () => {
    let doc: XMLDocument;

    beforeEach(async () => {
      doc = await loadFixture(fixtureName);
    });

    const bindings = (input: Element, data: Element) =>
      valueQualityBindings({ sink: input, fcda: data, controlBlock: outputsGoose(doc) });

    it('binds the next input to the quality of the data', () => {
      expect(bindings(nrInput(doc, 'SPCSO5'), outputFcda(doc, 'Ind64'))).to.deep.equal([
        {
          sink: nrInput(doc, 'SPCSO5', 'q'),
          fcda: outputFcda(doc, 'Ind64', 'q'),
          controlBlock: outputsGoose(doc)
        }
      ]);
    });

    it('binds nothing when the quality itself is chosen', () => {
      expect(bindings(nrInput(doc, 'SPCSO5', 'q'), outputFcda(doc, 'Ind64', 'q'))).to.deep.equal([]);
    });

    it('binds nothing when the next FCDA is other data', () => {
      expect(bindings(nrInput(doc, 'SPCSO5'), outputFcda(doc, 'Ind64', 'q'))).to.deep.equal([]);
    });

    it('binds nothing when the next element is not an input or an FCDA', () => {
      const input = nrInput(doc, 'SPCSO5');
      input.after(doc.createElementNS(input.namespaceURI, 'Private'));
      expect(bindings(input, outputFcda(doc, 'Ind64'))).to.deep.equal([]);

      const last = mustQuery(doc, 'IED[name="SEL_SEL_487E_5S_001"] DataSet[name="Ctl"] FCDA:last-child');
      expect(bindings(nrInput(doc, 'SPCSO6'), last)).to.deep.equal([]);
    });
  });
});
