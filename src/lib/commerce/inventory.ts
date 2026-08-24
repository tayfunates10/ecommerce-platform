export type InventoryErrorCode =
  | "INVALID_QUANTITY"
  | "INVALID_STATE"
  | "OUT_OF_STOCK"
  | "RESERVATION_UNDERFLOW";

export class InventoryError extends Error {
  readonly code: InventoryErrorCode;

  constructor(message: string, code: InventoryErrorCode) {
    super(message);
    this.name = "InventoryError";
    this.code = code;
  }
}

export type InventoryState = Readonly<{
  quantity: number;
  reserved: number;
}>;

function assertInventoryState(state: InventoryState): void {
  const validQuantity = Number.isSafeInteger(state.quantity) && state.quantity >= 0;
  const validReserved = Number.isSafeInteger(state.reserved) && state.reserved >= 0;

  if (!validQuantity || !validReserved || state.reserved > state.quantity) {
    throw new InventoryError(
      "Inventory state must contain non-negative safe integers with reserved not exceeding quantity.",
      "INVALID_STATE",
    );
  }
}

export function availableStock(state: InventoryState): number {
  assertInventoryState(state);
  return state.quantity - state.reserved;
}

export function reserveInventory(
  state: InventoryState,
  requested: number,
): InventoryState {
  assertInventoryState(state);

  if (!Number.isSafeInteger(requested) || requested <= 0) {
    throw new InventoryError(
      "Reservation quantity must be a positive safe integer.",
      "INVALID_QUANTITY",
    );
  }

  if (availableStock(state) < requested) {
    throw new InventoryError(
      "Requested quantity exceeds available stock.",
      "OUT_OF_STOCK",
    );
  }

  return { ...state, reserved: state.reserved + requested };
}

export function releaseInventory(
  state: InventoryState,
  released: number,
): InventoryState {
  assertInventoryState(state);

  if (!Number.isSafeInteger(released) || released <= 0) {
    throw new InventoryError(
      "Release quantity must be a positive safe integer.",
      "INVALID_QUANTITY",
    );
  }

  if (released > state.reserved) {
    throw new InventoryError(
      "Cannot release more inventory than is reserved.",
      "RESERVATION_UNDERFLOW",
    );
  }

  return { ...state, reserved: state.reserved - released };
}
