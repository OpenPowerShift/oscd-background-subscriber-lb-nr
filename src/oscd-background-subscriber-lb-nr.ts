import { LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { msg } from '@lit/localize';

import { CompanionController } from './companion/companion.js';
import { isNrIed, planNr, nrIdentity } from './foundation/nr.js';

/**
 * A background plugin which works with the Subscriber Later Binding plugin.
 * When an input of an NR Electric device is subscribed or unsubscribed there,
 * it subscribes or unsubscribes the input for the quality of the value.
 *
 * It has no user interface of its own. It tells Subscriber Later Binding what
 * it does, which lists it in its settings, where it is turned on and off.
 */
export default class OscdBackgroundSubscriberLbNr extends LitElement {
  @property({ attribute: false })
  doc?: XMLDocument;

  @property()
  docName?: string;

  @property({ attribute: false })
  docVersion?: unknown;

  /** Identifies this plugin to other plugins. */
  @property({ type: String, reflect: true })
  identity = nrIdentity;

  /** Kept so that the companion is connected while the element is. */
  protected companion = new CompanionController(this, {
    identity: nrIdentity,
    name: 'NR Electric',
    description: () =>
      msg('Subscribes and unsubscribes further inputs of NR Electric devices'),
    features: () => [
      msg('Values: the input for their quality')
    ],
    isVendorIed: isNrIed,
    plan: planNr,
    title: action =>
      action === 'subscribe'
        ? msg('NR Electric subscribe')
        : msg('NR Electric unsubscribe')
  });

  render(): typeof nothing {
    return nothing;
  }
}
