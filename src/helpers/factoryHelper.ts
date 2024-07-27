import {
  Address,
  BigInt,
  Bytes,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import { Pool, Factory, Token } from "../../generated/schema";
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory";
import { initializeToken } from "../helpers/tokenHelper";

// Helper function to handle the Factory entity
export function handleFactory(event: PoolCreatedEvent): void {
  let factoryId = event.transaction.hash;
  let factory = Factory.load(factoryId);

  if (!factory) {
    factory = new Factory(factoryId);
    factory.token0 = event.params.token0;
    factory.token1 = event.params.token1;
    factory.fee = event.params.fee;
    factory.tickSpacing = event.params.tickSpacing;
    factory.pool = event.params.pool;
    factory.poolCount = BigInt.fromI32(1); // Initialize with one pool
    factory.blockNumber = event.block.number;
    factory.blockTimestamp = event.block.timestamp;
    factory.transactionHash = event.transaction.hash;

    factory.save();
  } else {
    factory.poolCount = factory.poolCount.plus(BigInt.fromI32(1));
    factory.save();
  }
  // Initialize tokens related to the factory
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);
}

// Helper function to create or update a Pool entity
export function CreatePool(event: PoolCreatedEvent): void {
  let poolId = event.params.pool.toHex();
  let pool = Pool.load(poolId);

  if (!pool) {
    pool = new Pool(poolId);
    pool.token0 = event.params.token0;
    pool.token1 = event.params.token1;
    pool.fee = event.params.fee;
    pool.tickSpacing = event.params.tickSpacing;
    pool.totalLiquidityIn = BigInt.zero();
    pool.totalLiquidityOut = BigInt.zero();
    pool.averageLiquidityIn = BigInt.zero().toBigDecimal();
    pool.averageLiquidityOut = BigInt.zero().toBigDecimal();
    pool.totalLiquidity = BigInt.zero();
    pool.mintCount = BigInt.zero();
    pool.burnCount = BigInt.zero();
    pool.swapCount = BigInt.zero();
    pool.token0MintCount = BigInt.zero();
    pool.token0BurnCount = BigInt.zero();
    pool.token0SwapCount = BigInt.zero();
    pool.token1MintCount = BigInt.zero();
    pool.token1BurnCount = BigInt.zero();
    pool.token1SwapCount = BigInt.zero();
    pool.token0TransferCount = BigInt.zero();
    pool.token1TransferCount = BigInt.zero();
    pool.activityCount = BigInt.zero();
    pool.blockNumber = event.block.number;
    pool.timeStamp = event.block.timestamp;
    pool.transactionHash = event.transaction.hash;

    pool.save();
  }

  // Initialize tokens related to the factory
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);
}

// Update Pool Total Liquidity Function
export function updatePoolTotalLiquidity(
  poolId: string,
  amount: BigInt,
  isMint: Bytes = Bytes.empty(), // Default to empty Bytes if not used
  isBurn: Bytes = Bytes.empty(),
  isSwap: Bytes = Bytes.empty()
): void {
  let pool = Pool.load(poolId);

  if (!pool) {
    log.warning("Pool entity not found for ID: {}", [poolId]);
    return;
  }

  log.info("Updating pool total liquidity for pool: {}", [poolId]);

  if (!isSwap.equals(Bytes.empty())) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1));
    log.info("Processed swap event for pool: {}", [poolId]);
  } else if (!isMint.equals(Bytes.empty())) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount = pool.mintCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );
    log.info("Processed mint event for pool: {}", [poolId]);
  } else if (!isBurn.equals(Bytes.empty())) {
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount = pool.burnCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );
    log.info("Processed burn event for pool: {}", [poolId]);
  }

  pool.activityCount = pool.activityCount.plus(BigInt.fromI32(1));
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);

  pool.save();
}

// Function to calculate average liquidity
export function calculateAverageLiquidity(
  totalLiquidity: BigInt,
  count: BigInt
): BigDecimal {
  if (count.equals(BigInt.fromI32(0))) {
    return BigDecimal.zero();
  }
  return totalLiquidity.toBigDecimal().div(count.toBigDecimal());
}
