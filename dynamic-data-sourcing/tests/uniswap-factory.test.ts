import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address } from "@graphprotocol/graph-ts"
import { NewExchange } from "../generated/schema"
import { NewExchange as NewExchangeEvent } from "../generated/UniswapFactory/UniswapFactory"
import { handleNewExchange } from "../src/uniswap-factory"
import { createNewExchangeEvent } from "./uniswap-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let token = Address.fromString("0x0000000000000000000000000000000000000001")
    let exchange = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newNewExchangeEvent = createNewExchangeEvent(token, exchange)
    handleNewExchange(newNewExchangeEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewExchange created and stored", () => {
    assert.entityCount("NewExchange", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewExchange",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "token",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "NewExchange",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "exchange",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
