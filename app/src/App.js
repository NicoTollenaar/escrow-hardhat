import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";
// window.ethereum provider works only with MetaMask
// const provider = new ethers.providers.Web3Provider(window.ethereum);
const provider = new ethers.providers.JsonRpcProvider();
console.log("provider:", provider);

export async function approve(escrowContract, signer) {
  console.log("in approve, logging signer:", signer);
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function handleAccountsChanged(accounts) {
      alert("in handleAccountsChanged, see accounts[0] in console");
      console.log("in handleAccountsChanged, logging accounts[0]", accounts[0]);
      setAccount(accounts[0]);
      setSigner(provider.getSigner(accounts[0]));
    }
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return function cleanup() {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  async function getAccounts() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // const accounts = await provider.send("eth_requestAccounts", []);
    console.log("accounts from eth_requestAccounts:", accounts);
    setAccount(accounts[0]);
    setSigner(provider.getSigner());
  }

  useEffect(() => {
    getAccounts();
  }, []);

  async function newContract() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.BigNumber.from(document.getElementById("wei").value);
    console.log("signer", signer);
    console.log("provider:", provider);
    console.log("account:", account);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });
        console.log("in handleApprove, logging signer:", signer);
        await approve(escrowContract, provider.getSigner(arbiter));
      },
    };

    setEscrows([...escrows, escrow]);
  }

  console.log("in outer space, logging account:", account);
  console.log("in outer space, logging signer:", signer);

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Wei)
          <input type="text" id="wei" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
