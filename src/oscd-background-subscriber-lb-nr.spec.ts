import { expect, fixture, html } from '@open-wc/testing';

import OscdBackgroundSubscriberLbNr from './oscd-background-subscriber-lb-nr.js';
import { companionWithdrawEventName } from './companion/protocol.js';
import type { CompanionWithdrawEvent } from './companion/protocol.js';
import { nrIdentity } from './foundation/nr.js';
import { loadFixture } from './testing/fixtures.js';
import { LaterBindingStandIn } from './testing/later-binding.js';
import {
  fixtureName,
  nrInput,
  outputFcda,
  outputsGoose,
  subscription
} from './testing/nr.js';

const tagName = 'oscd-background-subscriber-lb-nr-spec';
if (customElements.get(tagName) === undefined) {
  customElements.define(tagName, OscdBackgroundSubscriberLbNr);
}

describe('Subscriber Later Binding - NR Electric', () => {
  let doc: XMLDocument;
  let plugin: OscdBackgroundSubscriberLbNr;
  let laterBinding: LaterBindingStandIn;

  const serialize = (): string => new XMLSerializer().serializeToString(doc);

  const subscribeValue = (): void =>
    laterBinding.subscribe(nrInput(doc, 'SPCSO5'), outputFcda(doc, 'Ind64'), outputsGoose(doc));

  const qualityData = (): string | undefined =>
    subscription(nrInput(doc, 'SPCSO5', 'q')).daName;

  beforeEach(async () => {
    doc = await loadFixture(fixtureName);
    laterBinding = new LaterBindingStandIn();
    plugin = await fixture<OscdBackgroundSubscriberLbNr>(
      html`<oscd-background-subscriber-lb-nr-spec .doc=${doc}></oscd-background-subscriber-lb-nr-spec>`
    );
  });

  afterEach(() => {
    laterBinding.disconnect();
  });

  describe('values and their quality', () => {
    it('subscribes the quality with the value', () => {
      subscribeValue();
      expect(qualityData()).to.equal('q');
      expect(subscription(nrInput(doc, 'SPCSO5', 'q')).doName).to.equal('Ind64');
    });

    it('is one undoable edit with the subscription', () => {
      const before = serialize();
      subscribeValue();
      expect(laterBinding.editor.past).to.have.length(1);
      expect(laterBinding.editor.past[0].title).to.equal('NR Electric subscribe');

      laterBinding.editor.undo();
      expect(serialize()).to.equal(before);

      laterBinding.editor.redo();
      expect(qualityData()).to.equal('q');
    });

    it('unsubscribes the quality with the value in one undoable edit', () => {
      subscribeValue();
      const subscribed = serialize();
      laterBinding.unsubscribe(nrInput(doc, 'SPCSO5'), outputFcda(doc, 'Ind64'));
      expect(qualityData()).to.equal(undefined);
      expect(laterBinding.editor.past[1].title).to.equal('NR Electric unsubscribe');

      laterBinding.editor.undo();
      expect(serialize()).to.equal(subscribed);
    });

    it('leaves a quality input subscribed to something else', () => {
      laterBinding.disabledCompanions = [nrIdentity];
      laterBinding.subscribe(
        nrInput(doc, 'SPCSO5', 'q'),
        outputFcda(doc, 'Ind63', 'q'),
        outputsGoose(doc)
      );
      laterBinding.disabledCompanions = [];
      subscribeValue();
      expect(subscription(nrInput(doc, 'SPCSO5', 'q')).doName).to.equal('Ind63');

      laterBinding.unsubscribe(nrInput(doc, 'SPCSO5'), outputFcda(doc, 'Ind64'));
      expect(subscription(nrInput(doc, 'SPCSO5', 'q')).doName).to.equal('Ind63');
    });
  });

  describe('when it does nothing', () => {
    it('does nothing when turned off in Subscriber Later Binding', () => {
      laterBinding.disabledCompanions = [nrIdentity];
      subscribeValue();
      expect(qualityData()).to.equal(undefined);
    });

    it('does nothing for other manufacturers', () => {
      nrInput(doc, 'SPCSO5').closest('IED')!.setAttribute('manufacturer', 'SEL');
      subscribeValue();
      expect(qualityData()).to.equal(undefined);
    });
  });

  describe('as a background plugin', () => {
    it('reflects its identity and shows nothing', () => {
      expect(plugin.getAttribute('identity')).to.equal(nrIdentity);
      expect(plugin.shadowRoot!.childElementCount).to.equal(0);
    });

    it('tells Subscriber Later Binding what it does', () => {
      expect(laterBinding.companions.get(nrIdentity)).to.deep.equal({
        version: 1,
        identity: nrIdentity,
        name: 'NR Electric',
        description: 'Subscribes and unsubscribes further inputs of NR Electric devices',
        features: [
          'Values: the input for their quality'
        ]
      });
    });

    it('withdraws when removed from the page', () => {
      const withdrawn: CompanionWithdrawEvent['detail'][] = [];
      const listener = (event: CompanionWithdrawEvent): void => {
        withdrawn.push(event.detail);
      };
      window.addEventListener(companionWithdrawEventName, listener);
      plugin.remove();
      window.removeEventListener(companionWithdrawEventName, listener);
      expect(withdrawn).to.deep.equal([{ version: 1, identity: nrIdentity }]);
      expect(laterBinding.companions.has(nrIdentity)).to.equal(false);
    });
  });
});
