require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      gasMultiplier: 1.5,
    },
  },
  paths: {
    artifacts: "./app/src/artifacts",
  },
};
