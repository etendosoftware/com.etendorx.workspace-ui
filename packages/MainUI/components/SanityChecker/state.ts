export interface State {
  connected: boolean;
  error: boolean;
  loading: boolean;
}

export type Action = { type: 'SET_CONNECTED' } | { type: 'SET_ERROR' } | { type: 'RESET' };

export const initialState: State = {
  connected: false,
  error: false,
  loading: false,
};

export function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: true, error: false, loading: false };
    case 'SET_ERROR':
      return { ...state, error: true, connected: false, loading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
