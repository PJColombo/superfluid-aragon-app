import Aragon, { events } from '@aragon/api';
import 'regenerator-runtime/runtime';

const app = new Aragon();
console.log('here');
console.log('helooooo');
app.store(
  async (state, { event }) => {
    const nextState = {
      ...state,
    };

    console.log('here');
    try {
      switch (event) {
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true };
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false };
        default:
          return state;
      }
    } catch (err) {
      console.log(err);
    }
  },
  {
    init: initializeState(),
  }
);

/***********************
 *   Event Handlers    *
 ***********************/

function initializeState() {
  return async cachedState => {
    return {
      ...cachedState,
    };
  };
}
