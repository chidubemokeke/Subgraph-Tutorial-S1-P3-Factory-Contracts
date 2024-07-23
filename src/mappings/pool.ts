import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/schema"; // Import event schemas for Swap, Mint, and Burn events

// Event handler function for Mint events
export function handleMint(event: MintEvent): void {
  // Call the actual implementation of the Mint event handler
  handleMint(event);
}

// Event handler function for Swap events
export function handleSwap(event: SwapEvent): void {
  // Call the actual implementation of the Swap event handler
  handleSwap(event);
}

// Event handler function for Burn events
export function handleBurn(event: BurnEvent): void {
  // Call the actual implementation of the Burn event handler
  handleBurn(event);
}
