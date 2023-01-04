import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SubmitTransaction from "./pages/SubmitTransaction";
import OverviewTransactions from "./pages/OverviewTransactions";
import Home from "./pages/Home";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    getAccounts();
    async function getAccounts() {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }
  }, []);

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

  return (
    <div className="App">
      <Navbar />
      <Dashboard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit-transaction" element={<SubmitTransaction />} />
        <Route
          path="/overview-transactions"
          element={<OverviewTransactions />}
        />
      </Routes>
    </div>
  );
}

export default App;
