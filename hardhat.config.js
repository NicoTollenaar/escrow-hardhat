require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gasMultiplier: 1.5,
    },
    ganache: {
      url: "http://localhost:7545",
      accounts: [
        `0x${process.env.GANACHE_PRIVATE_KEY_ONE}`,
        `0x${process.env.GANACHE_PRIVATE_KEY_TWO}`,
        `0x${process.env.GANACHE_PRIVATE_KEY_THREE}`,
        `0x${process.env.GANACHE_PRIVATE_KEY_FOUR}`,
      ],
    },
    goerli: {
      url: process.env.ALCHEMY_GOERLI_URL,
      accounts: [
        `0x${process.env.GOERLI_PRIVATE_KEY_ONE}`,
        `0x${process.env.GOERLI_PRIVATE_KEY_TWO}`,
        `0x${process.env.GOERLI_PRIVATE_KEY_THREE}`,
      ],
    },
  },

  paths: {
    artifacts: "./app/src/artifacts",
  },
};
