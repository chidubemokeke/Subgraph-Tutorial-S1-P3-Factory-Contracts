// Importing BigDecimal and BigInt from the Graph Protocol library for precise arithmetic operations.
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Defining a constant for the zero address, commonly used as a placeholder or default address in Ethereum.
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// Defining a constant for a BigInt with value 0, using the fromI32 method to convert a 32-bit integer to a BigInt.
export const ZERO_BI = BigInt.fromI32(0);

// Defining a constant for a BigInt with value 1, using the fromI32 method to convert a 32-bit integer to a BigInt.
export const ONE_BI = BigInt.fromI32(1);

// Defining a constant for a BigDecimal with value 0, using the fromString method to convert a string to a BigDecimal.
export const ZERO_BD = BigDecimal.fromString("0");

// Defining a constant for a BigDecimal with value 1, using the fromString method to convert a string to a BigDecimal.
export const ONE_BD = BigDecimal.fromString("1");

// Defining a constant for a BigInt with value 18, often used to represent the number of decimal places in ERC-20 tokens.
export const BI_18 = BigInt.fromI32(18);
