import { createGlobalState } from "react-hooks-global-state";

const initialState = { status: "disconnected", path: "/" };
const { useGlobalState } = createGlobalState(initialState);

export default useGlobalState;
