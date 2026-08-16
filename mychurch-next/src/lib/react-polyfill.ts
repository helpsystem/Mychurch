// React 19 compatibility polyfill for Framer Motion & third-party libraries
import React from 'react';

function applyReact19Polyfill() {
  try {
    const ReactAny = React as any;
    if (!ReactAny) return;

    const internals =
      ReactAny.__CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
      {};

    if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
    }

    if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig) {
      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig = {
        transition: null,
      };
    }

    if (!internals.ReactCurrentBatchConfig) {
      internals.ReactCurrentBatchConfig = { transition: null };
    }

    if (!internals.ReactCurrentOwner) {
      internals.ReactCurrentOwner = { current: null };
    }

    if (typeof window !== 'undefined') {
      const winAny = window as any;
      if (winAny.React) {
        if (!winAny.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
          winAny.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
        }
      }
    }
  } catch (e) {
    // Silent fail
  }
}

applyReact19Polyfill();

export default applyReact19Polyfill;
